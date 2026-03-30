from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"


class JobBoard(str, Enum):
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    WELLFOUND = "wellfound"
    YC_JOBS = "yc_jobs"
    LEVELS_FYI = "levels_fyi"
    GLASSDOOR = "glassdoor"


class SearchRequest(BaseModel):
    keywords: str
    location: str
    experience_level: Optional[ExperienceLevel] = None
    job_boards: List[JobBoard]


class JobResult(BaseModel):
    title: str
    company: str
    location: str
    salary: Optional[str] = None
    url: str
    source: str
    posted_date: Optional[str] = None
    description: Optional[str] = None


class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"


class AgentUpdate(BaseModel):
    board: str
    status: AgentStatus
    message: Optional[str] = None
    streaming_url: Optional[str] = None
    jobs: Optional[List[JobResult]] = None
    error: Optional[str] = None
