import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock, ExternalLink, ChevronRight } from "lucide-react";
import { AgentState, JOB_BOARD_INFO } from "../types";
import { cn } from "../lib/utils";

interface AgentCardProps {
  agent: AgentState;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function AgentCard({ agent }: AgentCardProps) {
  const boardInfo = JOB_BOARD_INFO[agent.board];
  const [elapsed, setElapsed] = useState(0);

  // Elapsed timer — resets when status changes away from running
  useEffect(() => {
    if (agent.status !== "running") {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [agent.status]);

  const statusMeta = {
    pending: {
      icon: <Clock className="w-4 h-4 text-slate-400" />,
      label: "Queued",
      cardBase: "border-slate-200 bg-white/60",
      cardExtra: "",
      pill: "bg-slate-100 text-slate-500",
      headerBg: "bg-white/70",
      messageColor: "text-slate-400",
    },
    running: {
      icon: <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />,
      label: "Running",
      cardBase: "border-blue-300 bg-blue-50/50",
      cardExtra: "card-running-pulse",
      pill: "bg-blue-100 text-blue-700",
      headerBg: "bg-blue-50/60",
      messageColor: "text-blue-700",
    },
    completed: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      label: "Done",
      cardBase: "border-emerald-200 bg-emerald-50/30",
      cardExtra: "",
      pill: "bg-emerald-100 text-emerald-700",
      headerBg: "bg-emerald-50/50",
      messageColor: "text-emerald-700",
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
      label: "Failed",
      cardBase: "border-rose-200 bg-rose-50/30",
      cardExtra: "",
      pill: "bg-rose-100 text-rose-600",
      headerBg: "bg-rose-50/40",
      messageColor: "text-rose-600",
    },
  }[agent.status];

  const jobCount = agent.jobs.length;
  const visibleJobs = agent.jobs.slice(0, 3);
  const extraCount = jobCount - 3;

  return (
    <div
      className={cn(
        "rounded-2xl border-2 overflow-hidden shadow-sm transition-all duration-300",
        statusMeta.cardBase,
        statusMeta.cardExtra
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-slate-200/60",
          statusMeta.headerBg
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {statusMeta.icon}
          <span className="font-bold text-slate-900 truncate">{boardInfo.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {agent.status === "completed" && jobCount > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {jobCount} jobs
            </span>
          )}
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusMeta.pill)}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Live browser iframe (running only) */}
      {agent.status === "running" && agent.streamingUrl && (
        <div className="relative h-48 bg-slate-900">
          <iframe
            src={agent.streamingUrl}
            className="w-full h-full border-0"
            title={`Live preview for ${boardInfo.name}`}
            sandbox="allow-scripts allow-same-origin"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 rounded-full shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-xs text-white font-bold tracking-wide">LIVE</span>
          </div>
        </div>
      )}

      {/* Status message */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <p className={cn("text-sm font-medium", statusMeta.messageColor)}>
          {agent.status === "running"
            ? agent.message || "Searching..."
            : agent.status === "completed"
            ? `Found ${jobCount} jobs`
            : agent.status === "error"
            ? agent.error || "Failed to search"
            : "Waiting in queue..."}
        </p>
        {agent.status === "running" && elapsed > 0 && (
          <span className="text-xs font-mono text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* Job listings (completed) */}
      {agent.status === "completed" && jobCount > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {visibleJobs.map((job, i) => (
            <a
              key={i}
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm group transition-all"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                  {job.title}
                </p>
                <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{job.company}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-0.5 transition-colors" />
            </a>
          ))}

          {extraCount > 0 && (
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40 cursor-default transition-all">
              <ChevronRight className="w-3.5 h-3.5" />
              {extraCount} more job{extraCount !== 1 ? "s" : ""} in results below
            </div>
          )}
        </div>
      )}

      {/* Empty completed state */}
      {agent.status === "completed" && jobCount === 0 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-slate-400 text-center py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No recent jobs found (last 72 hrs)
          </p>
        </div>
      )}

      {/* Error retry hint */}
      {agent.status === "error" && (
        <div className="px-4 pb-4">
          <p className="text-xs text-rose-400 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">
            Try running a new search — this board may be temporarily unavailable.
          </p>
        </div>
      )}
    </div>
  );
}
