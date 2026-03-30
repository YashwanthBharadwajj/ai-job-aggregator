import asyncio
import json
import re
from datetime import datetime, timedelta
from fastapi import APIRouter
from starlette.responses import StreamingResponse
from typing import AsyncGenerator

from app.models.schemas import SearchRequest, JobBoard, AgentStatus
from app.services.tinyfish import run_tinyfish_agent
from app.services.job_boards import JOB_BOARD_CONFIGS, build_search_url

router = APIRouter()

MAX_AGE_HOURS = 72


def is_within_max_age(posted_date: str | None) -> bool:
    """
    Check if a posted_date string represents a job posted within MAX_AGE_HOURS
    of the current date/time.

    Handles:
    - Relative: "2 days ago", "1 hour ago", "just now", "today"
    - Short form: "1d", "2h"
    - Absolute: "Feb 10, 2026", "2026-02-10", "02/10/2026"
    """
    if not posted_date:
        return False

    text = posted_date.lower().strip()
    now = datetime.now()
    cutoff = now - timedelta(hours=MAX_AGE_HOURS)

    # "just now", "today", "just posted", "recently posted" → always recent
    if any(kw in text for kw in ["just", "now", "today", "moment", "recently"]):
        return True

    # Try to parse "N <unit> ago" patterns
    match = re.search(r"(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago", text)
    if match:
        num = int(match.group(1))
        unit = match.group(2)
        hours_map = {
            "second": 0, "minute": 0, "hour": 1,
            "day": 24, "week": 168, "month": 730, "year": 8760,
        }
        total_hours = num * hours_map.get(unit, 0)
        return total_hours <= MAX_AGE_HOURS

    # Try bare number patterns like "1d", "2h"
    match = re.search(r"(\d+)\s*(s|m|h|d|w|mo|yr)", text)
    if match:
        num = int(match.group(1))
        unit = match.group(2)
        unit_map = {"s": 0, "m": 0, "h": 1, "d": 24, "w": 168, "mo": 730, "yr": 8760}
        hours = num * unit_map.get(unit, 0)
        return hours <= MAX_AGE_HOURS

    # Try absolute date formats
    date_formats = [
        "%Y-%m-%d",          # 2026-02-10
        "%m/%d/%Y",          # 02/10/2026
        "%m-%d-%Y",          # 02-10-2026
        "%b %d, %Y",         # Feb 10, 2026
        "%B %d, %Y",         # February 10, 2026
        "%d %b %Y",          # 10 Feb 2026
        "%d %B %Y",          # 10 February 2026
    ]
    for fmt in date_formats:
        try:
            parsed = datetime.strptime(posted_date.strip(), fmt)
            return parsed >= cutoff
        except ValueError:
            continue

    # Can't parse — exclude to be safe
    return False


async def search_single_board(
    board: JobBoard,
    keywords: str,
    location: str,
) -> AsyncGenerator[dict, None]:
    """
    Search a single job board and yield status updates.
    """
    config = JOB_BOARD_CONFIGS.get(board)
    if not config:
        yield {
            "board": board.value,
            "status": AgentStatus.ERROR.value,
            "message": f"Unknown job board: {board.value}",
            "error": f"Unknown job board: {board.value}",
        }
        return
    
    url = build_search_url(board, keywords, location)
    
    # Send initial status
    yield {
        "board": board.value,
        "status": AgentStatus.RUNNING.value,
        "message": f"Connecting to {config['name']}...",
    }
    
    try:
        streaming_url = None
        final_jobs = []
        
        async for event in run_tinyfish_agent(url, config["goal"]):
            # Handle streaming URL
            if "streamingUrl" in event:
                streaming_url = event["streamingUrl"]
                yield {
                    "board": board.value,
                    "status": AgentStatus.RUNNING.value,
                    "streaming_url": streaming_url,
                    "message": "Browser connected, searching...",
                }
            
            # Handle status updates
            elif event.get("type") == "STATUS":
                yield {
                    "board": board.value,
                    "status": AgentStatus.RUNNING.value,
                    "streaming_url": streaming_url,
                    "message": event.get("message", "Processing..."),
                }
            
            # Handle errors
            elif event.get("type") == "ERROR":
                yield {
                    "board": board.value,
                    "status": AgentStatus.ERROR.value,
                    "message": event.get("message", "Unknown error"),
                    "error": event.get("message", "Unknown error"),
                }
                return
            
            # Handle completion
            elif event.get("type") == "COMPLETE":
                result = event.get("resultJson", {})
                
                # Parse result if it's a string
                if isinstance(result, str):
                    try:
                        result = json.loads(result)
                    except json.JSONDecodeError:
                        result = {"jobs": []}
                
                jobs = result.get("jobs", [])
                
                # Add source to each job
                all_jobs = [
                    {
                        "title": job.get("title", "Unknown"),
                        "company": job.get("company", "Unknown"),
                        "location": job.get("location", "Unknown"),
                        "salary": job.get("salary"),
                        "url": job.get("url", ""),
                        "source": board.value,
                        "posted_date": job.get("posted_date"),
                    }
                    for job in jobs
                ]

                # Filter to only jobs posted within the last 72 hours
                final_jobs = [
                    job for job in all_jobs
                    if is_within_max_age(job.get("posted_date"))
                ]

                yield {
                    "board": board.value,
                    "status": AgentStatus.COMPLETED.value,
                    "message": f"Found {len(final_jobs)} jobs (filtered from {len(all_jobs)})",
                    "jobs": final_jobs,
                }
    
    except Exception as e:
        yield {
            "board": board.value,
            "status": AgentStatus.ERROR.value,
            "message": str(e),
            "error": str(e),
        }


async def search_all_boards(request: SearchRequest) -> AsyncGenerator[str, None]:
    """
    Search all selected job boards in parallel and stream results as SSE.
    Yields pre-formatted SSE strings (data: ...\n\n) for use with StreamingResponse.
    """
    # Send initial pending status for all boards
    for board in request.job_boards:
        yield f"data: {json.dumps({'board': board.value, 'status': 'pending', 'message': 'Queued...'})}\n\n"

    # Create async tasks for each board
    async def process_board(board: JobBoard) -> list:
        """Process a single board and collect all updates."""
        updates = []
        async for update in search_single_board(board, request.keywords, request.location):
            updates.append(update)
        return updates

    # Run all boards in parallel using asyncio.gather
    tasks = [process_board(board) for board in request.job_boards]

    # Use as_completed to stream results as they finish
    for coro in asyncio.as_completed(tasks):
        try:
            updates = await coro
            for update in updates:
                yield f"data: {json.dumps(update)}\n\n"
        except Exception as e:
            # If a task fails, send error for that board
            yield f"data: {json.dumps({'status': 'error', 'error': str(e)})}\n\n"

    yield "data: [DONE]\n\n"


@router.post("/search")
async def search_jobs(request: SearchRequest):
    """
    Start a job search across selected job boards.
    Returns an SSE stream with real-time updates.
    
    Request body:
    - keywords: Job title or keywords (e.g., "AI Engineer")
    - location: Location (e.g., "San Francisco" or "Remote")
    - job_boards: List of job boards to search
    
    SSE Events:
    - {"board": "linkedin", "status": "pending", "message": "Queued..."}
    - {"board": "linkedin", "status": "running", "streaming_url": "...", "message": "..."}
    - {"board": "linkedin", "status": "completed", "jobs": [...]}
    - {"board": "linkedin", "status": "error", "error": "..."}
    """
    return StreamingResponse(
        search_all_boards(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/boards")
async def list_boards():
    """
    List all available job boards.
    """
    return {
        "boards": [
            {"id": board.value, "name": config["name"]}
            for board, config in JOB_BOARD_CONFIGS.items()
        ]
    }
