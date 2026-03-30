import httpx
import json
import os
from typing import AsyncGenerator, Dict, Any

TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"


def get_api_key() -> str:
    api_key = os.getenv("TINYFISH_API_KEY")
    if not api_key:
        raise ValueError("TINYFISH_API_KEY environment variable is not set")
    return api_key


async def run_tinyfish_agent(
    url: str,
    goal: str,
    timeout: int = 300000
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Calls TinyFish API and yields SSE events as they arrive.
    
    Args:
        url: The target URL to navigate to
        goal: Natural language instruction for what to extract
        timeout: Timeout in milliseconds (default 5 minutes)
    
    Yields:
        Dict containing SSE event data (streamingUrl, STATUS, COMPLETE, etc.)
    """
    api_key = get_api_key()
    
    async with httpx.AsyncClient(timeout=httpx.Timeout(360.0)) as client:
        try:
            async with client.stream(
                "POST",
                TINYFISH_API_URL,
                headers={
                    "X-API-Key": api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "url": url,
                    "goal": goal,
                    "timeout": timeout,
                },
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    yield {
                        "type": "ERROR",
                        "message": f"TinyFish API error: {response.status_code} - {error_text.decode()}"
                    }
                    return
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str and data_str != "[DONE]":
                            try:
                                yield json.loads(data_str)
                            except json.JSONDecodeError:
                                # Skip malformed JSON
                                pass
        except httpx.TimeoutException:
            yield {
                "type": "ERROR",
                "message": "Request timed out"
            }
        except Exception as e:
            yield {
                "type": "ERROR",
                "message": str(e)
            }
