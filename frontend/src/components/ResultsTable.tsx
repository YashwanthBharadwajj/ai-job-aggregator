import { useState, useMemo } from "react";
import {
  ExternalLink,
  ArrowUpDown,
  Building2,
  MapPin,
  DollarSign,
  Filter,
  Briefcase,
} from "lucide-react";
import { JobResult, JobBoard, JOB_BOARD_INFO } from "../types";
import { cn } from "../lib/utils";

interface ResultsTableProps {
  jobs: JobResult[];
}

export function ResultsTable({ jobs }: ResultsTableProps) {
  const [sortBy, setSortBy] = useState<"company" | "source" | "title">("source");
  const [filterSource, setFilterSource] = useState<JobBoard | "all">("all");

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (filterSource !== "all") {
      result = result.filter((job) => job.source === filterSource);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "company":
          return a.company.localeCompare(b.company);
        case "title":
          return a.title.localeCompare(b.title);
        case "source":
        default:
          return a.source.localeCompare(b.source);
      }
    });

    return result;
  }, [jobs, sortBy, filterSource]);

  const uniqueSources = useMemo(() => {
    return [...new Set(jobs.map((job) => job.source))] as JobBoard[];
  }, [jobs]);

  if (jobs.length === 0) return null;

  return (
    <section className="bg-white/95 rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden">
      <div className="px-5 md:px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-700" />
            Found {jobs.length} Jobs
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated from {uniqueSources.length} job board{uniqueSources.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-2 py-1 rounded-xl border border-slate-200 bg-white">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as JobBoard | "all")}
              className="pr-1 py-1 text-sm bg-transparent text-slate-700 focus:outline-none"
            >
              <option value="all">All Sources ({jobs.length})</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {JOB_BOARD_INFO[source].name} ({jobs.filter((j) => j.source === source).length})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              const options: ("source" | "company" | "title")[] = ["source", "company", "title"];
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
        {filteredJobs.map((job, i) => (
          <a
            key={`${job.source}-${job.url}-${i}`}
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-5 md:px-6 py-4 hover:bg-blue-50/40 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {job.location}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </span>
                  )}
                </div>
                {job.posted_date && <p className="text-xs text-slate-400 mt-1.5">{job.posted_date}</p>}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-full text-white",
                    JOB_BOARD_INFO[job.source]?.color || "bg-slate-500"
                  )}
                >
                  {JOB_BOARD_INFO[job.source]?.name || job.source}
                </span>
                <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="px-6 py-12 text-center text-slate-500">No jobs match the current filter.</div>
      )}
    </section>
  );
}

