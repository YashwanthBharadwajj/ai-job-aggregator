from app.models.schemas import JobBoard

JOB_BOARD_CONFIGS = {
    JobBoard.LINKEDIN: {
        "name": "LinkedIn",
        "url_template": "https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}&f_TPR=r259200&sortBy=DD",
        "goal": """You are searching for RECENT job listings on LinkedIn (filtered to past 72 hours).

STEP 1 - WAIT FOR PAGE:
Wait for the job listings to fully load on the page.

STEP 2 - EXTRACT JOBS:
Find the first 10 job listings visible on the page. For each job, extract:
- Job title
- Company name
- Location
- Salary (if shown, otherwise null)
- Job URL (the link to the full job posting)
- Posted date (e.g., "2 days ago")

IMPORTANT: Only include jobs posted within the last 3 days (72 hours). Skip any jobs older than that.

STEP 3 - RETURN RESULT:
Return a JSON object with this exact format:
{
  "jobs": [
    {
      "title": "Senior AI Engineer",
      "company": "Google",
      "location": "San Francisco, CA",
      "salary": "$180,000 - $250,000",
      "url": "https://www.linkedin.com/jobs/view/...",
      "posted_date": "2 days ago"
    }
  ]
}

If no jobs are found, return: {"jobs": []}
Be factual - only extract information that is actually visible on the page."""
    },
    
    JobBoard.INDEED: {
        "name": "Indeed",
        "url_template": "https://www.indeed.com/jobs?q={keywords}&l={location}&fromage=3&sort=date",
        "goal": """You are searching for RECENT job listings on Indeed (filtered to past 3 days).

STEP 1 - WAIT FOR PAGE:
Wait for the job listings to fully load.

STEP 2 - EXTRACT JOBS:
Find the first 10 job listings. For each job, extract:
- Job title
- Company name
- Location
- Salary (if shown, otherwise null)
- Job URL (the direct link to the job)
- Posted date

IMPORTANT: Only include jobs posted within the last 3 days (72 hours). Skip any jobs older than that.

STEP 3 - RETURN RESULT:
Return a JSON object:
{
  "jobs": [
    {
      "title": "Machine Learning Engineer",
      "company": "Meta",
      "location": "Remote",
      "salary": "$150,000 - $200,000",
      "url": "https://www.indeed.com/viewjob?...",
      "posted_date": "1 day ago"
    }
  ]
}

If no jobs found, return: {"jobs": []}"""
    },
    
    JobBoard.WELLFOUND: {
        "name": "Wellfound",
        "url_template": "https://wellfound.com/role/r/software-engineer?query={keywords}",
        "goal": """You are searching for RECENT startup jobs on Wellfound (formerly AngelList Talent).

STEP 1 - WAIT FOR PAGE:
Wait for the job listings to load.

STEP 2 - EXTRACT JOBS:
Find the first 10 job listings. For each job, extract:
- Job title
- Company name
- Location (or "Remote" if remote)
- Salary range (if shown)
- Job URL
- Posted date (if shown)

IMPORTANT: Only include jobs that appear to be recently posted (within the last 3 days / 72 hours). Skip any jobs that are clearly older.

STEP 3 - RETURN RESULT:
Return a JSON object:
{
  "jobs": [
    {
      "title": "AI Engineer",
      "company": "CoolStartup",
      "location": "San Francisco, CA",
      "salary": "$140,000 - $180,000",
      "url": "https://wellfound.com/...",
      "posted_date": null
    }
  ]
}

If no jobs found, return: {"jobs": []}"""
    },
    
    JobBoard.YC_JOBS: {
        "name": "Y Combinator",
        "url_template": "https://www.ycombinator.com/jobs?query={keywords}",
        "goal": """You are searching for RECENT jobs at Y Combinator startups.

STEP 1 - WAIT FOR PAGE:
Wait for the job listings to load on the YC jobs board.

STEP 2 - EXTRACT JOBS:
Find the first 10 job listings. For each job, extract:
- Job title
- Company name (include YC batch if shown, e.g., "Company (W24)")
- Location
- Job URL

IMPORTANT: Only include jobs that appear to be recently posted (within the last 3 days / 72 hours). Skip any jobs that are clearly older.

STEP 3 - RETURN RESULT:
Return a JSON object:
{
  "jobs": [
    {
      "title": "Founding AI Engineer",
      "company": "AI Startup (YC W24)",
      "location": "San Francisco, CA",
      "salary": null,
      "url": "https://www.ycombinator.com/companies/.../jobs/...",
      "posted_date": null
    }
  ]
}

If no jobs found, return: {"jobs": []}"""
    },
    
    JobBoard.LEVELS_FYI: {
        "name": "Levels.fyi",
        "url_template": "https://www.levels.fyi/jobs?searchText={keywords}&location={location}",
        "goal": """You are searching for RECENT jobs on Levels.fyi which shows detailed compensation data.

STEP 1 - WAIT FOR PAGE:
Wait for job listings to load.

STEP 2 - EXTRACT JOBS:
Find the first 10 job listings. For each job, extract:
- Job title
- Company name
- Location
- Total compensation (TC) - this site shows detailed comp data
- Job URL
- Level (if shown)

STEP 3 - RETURN RESULT:
Return a JSON object:
{
  "jobs": [
    {
      "title": "Senior ML Engineer",
      "company": "OpenAI",
      "location": "San Francisco, CA",
      "salary": "$350,000 TC",
      "url": "https://www.levels.fyi/jobs/...",
      "posted_date": null
    }
  ]
}

IMPORTANT: Only include jobs that appear to be recently posted (within the last 3 days / 72 hours). Skip any jobs that are clearly older.

If no jobs found, return: {"jobs": []}"""
    },

    JobBoard.GLASSDOOR: {
        "name": "Glassdoor",
        "url_template": "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={keywords}&fromAge=3&sortBy=date_desc",
        "goal": """You are searching for RECENT jobs on Glassdoor (filtered to past 3 days).

STEP 1 - HANDLE POPUPS:
If any popups or modals appear, close them by clicking the X or close button.

STEP 2 - WAIT FOR PAGE:
Wait for job listings to load.

STEP 3 - EXTRACT JOBS:
Find the first 10 job listings. For each job, extract:
- Job title
- Company name
- Location
- Salary estimate (Glassdoor often shows estimates)
- Job URL
- Company rating (if shown)

IMPORTANT: Only include jobs posted within the last 3 days (72 hours). Skip any jobs older than that.

STEP 4 - RETURN RESULT:
Return a JSON object:
{
  "jobs": [
    {
      "title": "AI Research Scientist",
      "company": "DeepMind",
      "location": "London, UK",
      "salary": "$200,000 - $300,000 (Glassdoor est.)",
      "url": "https://www.glassdoor.com/job-listing/...",
      "posted_date": "1 day ago"
    }
  ]
}

If no jobs found, return: {"jobs": []}"""
    },
}


def get_board_config(board: JobBoard) -> dict:
    """Get configuration for a specific job board."""
    return JOB_BOARD_CONFIGS.get(board, {})


def build_search_url(board: JobBoard, keywords: str, location: str) -> str:
    """Build the search URL for a job board with given parameters."""
    config = get_board_config(board)
    url_template = config.get("url_template", "")
    return url_template.format(
        keywords=keywords.replace(" ", "+"),
        location=location.replace(" ", "+")
    )
