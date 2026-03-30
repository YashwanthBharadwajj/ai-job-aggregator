import { useState, useCallback } from "react";
import { AgentState, SearchRequest, SSEUpdate, JobBoard, JobResult } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const createInitialAgentState = (board: JobBoard): AgentState => ({
  board,
  status: "pending",
  jobs: [],
  message: "Waiting...",
});

export function useJobSearch() {
  const [agents, setAgents] = useState<Record<JobBoard, AgentState>>({
    linkedin: createInitialAgentState("linkedin"),
    indeed: createInitialAgentState("indeed"),
    wellfound: createInitialAgentState("wellfound"),
    yc_jobs: createInitialAgentState("yc_jobs"),
    levels_fyi: createInitialAgentState("levels_fyi"),
    glassdoor: createInitialAgentState("glassdoor"),
  });
  const [allJobs, setAllJobs] = useState<JobResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedBoards, setSearchedBoards] = useState<JobBoard[]>([]);

  const search = useCallback(async (request: SearchRequest) => {
    // Reset state
    setIsSearching(true);
    setError(null);
    setAllJobs([]);
    setSearchedBoards(request.job_boards);

    // Initialize agent states for selected boards
    const initialStates: Record<JobBoard, AgentState> = {
      linkedin: createInitialAgentState("linkedin"),
      indeed: createInitialAgentState("indeed"),
      wellfound: createInitialAgentState("wellfound"),
      yc_jobs: createInitialAgentState("yc_jobs"),
      levels_fyi: createInitialAgentState("levels_fyi"),
      glassdoor: createInitialAgentState("glassdoor"),
    };

    request.job_boards.forEach((board) => {
      initialStates[board] = {
        board,
        status: "pending",
        jobs: [],
        message: "Queued...",
      };
    });
    setAgents(initialStates);

    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages (they end with \n\n)
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || ""; // Keep incomplete message in buffer

        for (const message of messages) {
          const lines = message.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]" || !dataStr) continue;

              try {
                const update: SSEUpdate = JSON.parse(dataStr);

                if (update.board) {
                  setAgents((prev) => ({
                    ...prev,
                    [update.board]: {
                      board: update.board,
                      status: update.status,
                      message: update.message,
                      streamingUrl: update.streaming_url || prev[update.board]?.streamingUrl,
                      jobs: update.jobs || prev[update.board]?.jobs || [],
                      error: update.error,
                    },
                  }));

                  // Aggregate all jobs
                  if (update.jobs && update.jobs.length > 0) {
                    setAllJobs((prev) => {
                      // Filter out duplicates by URL
                      const newJobs = update.jobs!.filter(
                        (job) => !prev.some((p) => p.url === job.url)
                      );
                      return [...prev, ...newJobs];
                    });
                  }
                }
              } catch (e) {
                // Silently ignore parse errors for partial data
              }
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAgents({
      linkedin: createInitialAgentState("linkedin"),
      indeed: createInitialAgentState("indeed"),
      wellfound: createInitialAgentState("wellfound"),
      yc_jobs: createInitialAgentState("yc_jobs"),
      levels_fyi: createInitialAgentState("levels_fyi"),
      glassdoor: createInitialAgentState("glassdoor"),
    });
    setAllJobs([]);
    setError(null);
    setIsSearching(false);
    setSearchedBoards([]);
  }, []);

  return {
    agents,
    allJobs,
    isSearching,
    error,
    searchedBoards,
    search,
    reset,
  };
}