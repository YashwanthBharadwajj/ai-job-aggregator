export type JobBoard = 
  | "linkedin"
  | "indeed"
  | "wellfound"
  | "yc_jobs"
  | "levels_fyi"
  | "glassdoor";

export type AgentStatus = "pending" | "running" | "completed" | "error";

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead";

export interface JobResult {
  title: string;
  company: string;
  location: string;
  salary?: string | null;
  url: string;
  source: JobBoard;
  posted_date?: string | null;
  description?: string | null;
}

export interface AgentState {
  board: JobBoard;
  status: AgentStatus;
  message?: string;
  streamingUrl?: string;
  jobs: JobResult[];
  error?: string;
}

export interface SearchRequest {
  keywords: string;
  location: string;
  experience_level?: ExperienceLevel;
  job_boards: JobBoard[];
}

export interface SSEUpdate {
  board: JobBoard;
  status: AgentStatus;
  message?: string;
  streaming_url?: string;
  jobs?: JobResult[];
  error?: string;
}

export const JOB_BOARD_INFO: Record<JobBoard, { name: string; color: string }> = {
  linkedin: { name: "LinkedIn", color: "bg-blue-600" },
  indeed: { name: "Indeed", color: "bg-purple-600" },
  wellfound: { name: "Wellfound", color: "bg-black" },
  yc_jobs: { name: "Y Combinator", color: "bg-orange-500" },
  levels_fyi: { name: "Levels.fyi", color: "bg-green-600" },
  glassdoor: { name: "Glassdoor", color: "bg-teal-600" },
};
