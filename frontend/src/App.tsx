import { useRef } from "react";
import { Briefcase, Globe, RotateCcw, SearchCheck, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { SearchForm } from "./components/SearchForm";
import { AgentCard } from "./components/AgentCard";
import { ResultsTable } from "./components/ResultsTable";
import { useJobSearch } from "./hooks/useJobSearch";
import { cn } from "./lib/utils";

function App() {
  const { agents, allJobs, isSearching, error, searchedBoards, search, reset } =
    useJobSearch();

  const activeAgents = searchedBoards.map((board) => agents[board]);
  const hasStarted = searchedBoards.length > 0;
  const completedCount = activeAgents.filter((a) => a.status === "completed").length;
  const runningCount = activeAgents.filter((a) => a.status === "running").length;

  // Track previous job count for pop animation key
  const jobCountRef = useRef(allJobs.length);
  const jobCountKey = allJobs.length !== jobCountRef.current
    ? (jobCountRef.current = allJobs.length)
    : jobCountRef.current;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid opacity-60 pointer-events-none" />

      {/* Ambient blobs */}
      <div className="fixed -top-40 -left-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl pointer-events-none" />
      <div className="fixed top-16 -right-40 h-[28rem] w-[28rem] rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm shadow-slate-900/5">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                AI Job Aggregator
              </h1>
              <p className="text-xs font-medium text-slate-500 truncate">
                Parallel AI job search assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live agent status indicator */}
            {isSearching && runningCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                <span className="text-xs font-semibold text-blue-700 font-mono">
                  {runningCount} agent{runningCount !== 1 ? "s" : ""} running
                </span>
              </div>
            )}
            {isSearching && runningCount === 0 && completedCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">All done</span>
              </div>
            )}

            {hasStarted && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-400 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                New Search
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 py-10 md:py-12 space-y-8">
        {/* Hero badge */}
        {!hasStarted && (
          <div className="text-center max-w-3xl mx-auto pt-2 pb-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-blue-600/25">
              <Sparkles className="w-4 h-4" />
              Multi-board AI job search
            </div>
          </div>
        )}

        {/* Search form */}
        <SearchForm onSearch={search} isSearching={isSearching} />

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 px-5 py-4 flex items-start gap-3 shadow-sm">
            <span className="mt-0.5 font-bold text-rose-500">!</span>
            <div>
              <p className="font-semibold">Search Error</p>
              <p className="text-sm text-rose-700/90">{error}</p>
            </div>
          </div>
        )}

        {/* ── Stats bar ── */}
        {hasStarted && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Boards */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-slate-400">
                <Globe className="w-3.5 h-3.5" />
                Boards
              </div>
              <p className="mt-1.5 text-3xl font-black text-slate-900 font-mono tabular-nums">
                {searchedBoards.length}
              </p>
            </div>

            {/* Running — pulses when active */}
            <div
              className={cn(
                "rounded-2xl border px-4 py-3.5 shadow-sm transition-colors duration-500",
                runningCount > 0
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-white/90"
              )}
            >
              <div className={cn(
                "flex items-center gap-2 text-xs uppercase tracking-widest font-semibold",
                runningCount > 0 ? "text-blue-500" : "text-slate-400"
              )}>
                {runningCount > 0 ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </span>
                ) : (
                  <SearchCheck className="w-3.5 h-3.5" />
                )}
                Running
              </div>
              <p className={cn(
                "mt-1.5 text-3xl font-black font-mono tabular-nums transition-colors",
                runningCount > 0 ? "text-blue-700" : "text-slate-400"
              )}>
                {runningCount}
              </p>
            </div>

            {/* Completed */}
            <div
              className={cn(
                "rounded-2xl border px-4 py-3.5 shadow-sm transition-colors duration-500",
                completedCount > 0
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-slate-200 bg-white/90"
              )}
            >
              <div className={cn(
                "flex items-center gap-2 text-xs uppercase tracking-widest font-semibold",
                completedCount > 0 ? "text-emerald-600" : "text-slate-400"
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
              </div>
              <p className={cn(
                "mt-1.5 text-3xl font-black font-mono tabular-nums",
                completedCount > 0 ? "text-emerald-700" : "text-slate-400"
              )}>
                {completedCount}
              </p>
            </div>

            {/* Jobs found */}
            <div
              className={cn(
                "rounded-2xl border px-4 py-3.5 shadow-sm transition-colors duration-500",
                allJobs.length > 0
                  ? "border-cyan-200 bg-cyan-50/80"
                  : "border-slate-200 bg-white/90"
              )}
            >
              <div className={cn(
                "flex items-center gap-2 text-xs uppercase tracking-widest font-semibold",
                allJobs.length > 0 ? "text-cyan-700" : "text-slate-400"
              )}>
                <Zap className="w-3.5 h-3.5" />
                Jobs Found
              </div>
              <p
                key={jobCountKey}
                className={cn(
                  "mt-1.5 text-3xl font-black font-mono tabular-nums animate-pop",
                  allJobs.length > 0 ? "text-cyan-800" : "text-slate-400"
                )}
              >
                {allJobs.length}
              </p>
            </div>
          </section>
        )}

        {/* ── Agent status grid ── */}
        {hasStarted && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Agent Status
              {isSearching && (
                <span className="text-xs font-normal text-slate-400 ml-1">
                  — updating in real-time
                </span>
              )}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeAgents.map((agent) => (
                <AgentCard key={agent.board} agent={agent} />
              ))}
            </div>
          </section>
        )}

        {/* Results table */}
        <ResultsTable jobs={allJobs} />
      </main>

    </div>
  );
}

export default App;
