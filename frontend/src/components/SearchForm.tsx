import React, { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { JobBoard, SearchRequest, JOB_BOARD_INFO } from "../types";
import { cn } from "../lib/utils";

const JOB_BOARDS: JobBoard[] = [
  "linkedin",
  "indeed",
  "wellfound",
  "yc_jobs",
  "levels_fyi",
  "glassdoor",
];

// Short brand icon labels + colors for each board chip
const BOARD_ICON: Record<JobBoard, { label: string; bg: string; text: string }> = {
  linkedin:   { label: "in",  bg: "bg-blue-600",   text: "text-white" },
  indeed:     { label: "Ind", bg: "bg-violet-600",  text: "text-white" },
  wellfound:  { label: "W",   bg: "bg-zinc-900",    text: "text-white" },
  yc_jobs:    { label: "YC",  bg: "bg-orange-500",  text: "text-white" },
  levels_fyi: { label: "Lv",  bg: "bg-emerald-600", text: "text-white" },
  glassdoor:  { label: "GD",  bg: "bg-teal-600",    text: "text-white" },
};

interface SearchFormProps {
  onSearch: (request: SearchRequest) => void;
  isSearching: boolean;
}

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const [keywords, setKeywords] = useState("AI Engineer");
  const [location, setLocation] = useState("San Francisco");
  const [selectedBoards, setSelectedBoards] = useState<JobBoard[]>([
    "linkedin",
    "indeed",
    "wellfound",
    "yc_jobs",
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || selectedBoards.length === 0) return;
    onSearch({
      keywords: keywords.trim(),
      location: location.trim(),
      job_boards: selectedBoards,
    });
  };

  const toggleBoard = (board: JobBoard) => {
    setSelectedBoards((prev) =>
      prev.includes(board) ? prev.filter((b) => b !== board) : [...prev, board]
    );
  };

  const allSelected = selectedBoards.length === JOB_BOARDS.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/8 p-6 md:p-8 space-y-7"
    >
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Job Title / Keywords
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="AI Engineer, ML Engineer, LLM..."
              className="w-full pl-10 pr-4 py-3.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, Remote, New York..."
              className="w-full pl-10 pr-4 py-3.5 border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Board chips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-slate-700">
            Select Job Boards
          </label>
          <button
            type="button"
            onClick={() =>
              setSelectedBoards(allSelected ? [] : [...JOB_BOARDS])
            }
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {JOB_BOARDS.map((board) => {
            const isSelected = selectedBoards.includes(board);
            const icon = BOARD_ICON[board];
            return (
              <button
                key={board}
                type="button"
                onClick={() => toggleBoard(board)}
                className={cn(
                  "px-3 py-2.5 rounded-xl text-sm border flex items-center gap-2.5 transition-all duration-150",
                  isSelected
                    ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 font-medium"
                )}
              >
                {/* Brand icon badge */}
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-5 rounded text-[10px] font-black flex items-center justify-center leading-none tracking-tight transition-all",
                    isSelected
                      ? "bg-white/20 text-white"
                      : cn(icon.bg, icon.text)
                  )}
                >
                  {icon.label}
                </span>
                <span className="truncate">{JOB_BOARD_INFO[board].name}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mt-2 font-medium">
          {selectedBoards.length} of {JOB_BOARDS.length} boards selected
        </p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSearching || selectedBoards.length === 0 || !keywords.trim()}
        className={cn(
          "w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-3",
          isSearching || selectedBoards.length === 0 || !keywords.trim()
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "btn-shimmer text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        {isSearching ? (
          <>
            <div className="w-5 h-5 border-2 border-white/70 border-t-white rounded-full animate-spin" />
            Searching {selectedBoards.length} boards in parallel...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search {selectedBoards.length} Job Board{selectedBoards.length !== 1 ? "s" : ""} in Parallel
          </>
        )}
      </button>
    </form>
  );
}
