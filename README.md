# 🎯 AI Job Aggregator

---

## What is this?

AI Job Aggregator is a parallel job search tool that deploys AI web agents to **6 job boards simultaneously**. Instead of manually checking LinkedIn, Indeed, Wellfound, YC Jobs, Levels.fyi, and Glassdoor one by one, this tool searches them all in real-time and aggregates the results.

Built for the **Web Agents Hackathon** by TinyFish.

---

## Demo

<!-- Replace with your demo GIF/video -->
![Demo](https://via.placeholder.com/800x400?text=Add+Your+Demo+GIF+Here)

---

## How TinyFish Web Agent is Used

For each selected job board:

1. A TinyFish browser agent opens the job search page
2. Waits for results to load
3. Extracts job listings (title, company, salary, location, URL)
4. Streams live browser preview back to the UI via SSE
5. Returns structured JSON for aggregation

**Multiple agents run in parallel**, one per job board.

## Code Snippet

```python
async with httpx.AsyncClient() as client:
    async with client.stream(
        "POST",
        "https://agent.tinyfish.ai/v1/automation/run-sse",
        headers={
            "X-API-Key": TINYFISH_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "url": "https://www.linkedin.com/jobs/search/?keywords=AI+Engineer",
            "goal": """
                Search for job listings. Extract the first 10 jobs with:
                - Job title, Company, Location, Salary, URL, Posted date
                Return as JSON: {"jobs": [...]}
            """,
            "timeout": 300000,
        },
    ) as response:
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                event = json.loads(line[6:])
                # Handle streaming events...
```

---

## How to Run

### Prerequisites

- Python 3.10+
- Node.js 18+
- TinyFish API Key ([get one here](https://tinyfish.ai))

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your TINYFISH_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env if your backend is not on localhost:8000

# Run the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `TINYFISH_API_KEY` | Your TinyFish API key | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | Optional (default: http://localhost:5173) |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Optional (default: http://localhost:8000) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                              │
│                 (React + Tailwind + Vite)                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐    │
│  │  SearchForm  │  │  AgentDashboard  │  │  ResultsTable   │    │
│  │  - keywords  │  │  - AgentCard x6  │  │  - All jobs     │    │
│  │  - location  │  │  - Live preview  │  │  - Filter/Sort  │    │
│  │  - boards    │  │  - Status        │  │  - Apply links  │    │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬────────┘    │
│         │                   │                      │             │
│         └───────────────────┼──────────────────────┘             │
│                             │                                    │
│                    useJobSearch() hook                           │
│                    - Fetch + SSE streaming                       │
│                    - State management                            │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              │ SSE Stream (text/event-stream)
                              │
┌─────────────────────────────┼────────────────────────────────────┐
│                       FASTAPI BACKEND                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ POST /api/search                                            │ │
│  │ - Receives search criteria                                  │ │
│  │ - Spawns async tasks for each job board                     │ │
│  │ - Streams progress + results via SSE                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TinyFish Client                                             │ │
│  │ - Async HTTP streaming                                      │ │
│  │ - SSE event parsing                                         │ │
│  │ - Error handling                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ Parallel async requests
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TINYFISH WEB AGENTS                           │
│                                                                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│   │ LinkedIn │ │  Indeed  │ │Wellfound │ │ YC Jobs  │           │
│   │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │           │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│        │            │            │            │                  │
│   ┌────┴─────┐ ┌────┴─────┐                                     │
│   │Levels.fyi│ │Glassdoor │  ... All running in parallel        │
│   │  Agent   │ │  Agent   │                                     │
│   └──────────┘ └──────────┘                                     │
│                                                                  │
│              SSE streams back to FastAPI                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Backend** | FastAPI, Python 3.10+, HTTPX, SSE-Starlette |
| **Web Automation** | TinyFish Web Agent API |
| **Streaming** | Server-Sent Events (SSE) |

---

## Features

- ✅ **Parallel Search** - Search 6 job boards simultaneously
- ✅ **Real-time Updates** - Live status updates via SSE
- ✅ **Live Browser Preview** - Watch agents navigate in real-time
- ✅ **Aggregated Results** - All jobs in one unified view
- ✅ **Filter & Sort** - Filter by source, sort by company/title
- ✅ **Direct Apply Links** - Click to go to original job posting

---

## Job Boards Supported

| Board | URL |
|-------|-----|
| LinkedIn | linkedin.com/jobs |
| Indeed | indeed.com |
| Wellfound | wellfound.com |
| Y Combinator | ycombinator.com/jobs |
| Levels.fyi | levels.fyi/jobs |
| Glassdoor | glassdoor.com |

---

## License

MIT

---

## Author

Yashwanth Bharadwaj Nandamuru
