import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "Search or select...",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter and sort options dynamically as user types
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }
    const q = searchQuery.trim().toLowerCase();

    return options
      .filter((opt) => {
        const matchLabel = opt.label.toLowerCase().includes(q);
        const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
        return matchLabel || matchSub;
      })
      .sort((a, b) => {
        const aStarts = a.label.toLowerCase().startsWith(q);
        const bStarts = b.label.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.label.localeCompare(b.label);
      });
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Target Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full p-2.5 sm:p-3 border rounded-xl flex items-center justify-between cursor-pointer transition text-xs sm:text-sm bg-white ${
          isOpen ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <span className={`font-medium truncate ${selectedOption ? "text-slate-800" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-emerald-600" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-64 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Live Search Input inside Dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/75 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search & sort..."
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none py-1 font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition text-xs sm:text-sm ${
                      isSelected ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[11px] font-normal text-slate-400 truncate mt-0.5">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                No matching results found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
