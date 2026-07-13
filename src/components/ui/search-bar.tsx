"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface AutocompleteItem {
  id: string;
  name: string;
  brand?: string;
  capacity?: string;
  slug: string;
  imageUrl?: string;
  score: number;
}

export interface SearchBarProps {
  className?: string;
  variant?: "full" | "compact";
}

export function SearchBar({ className, variant = "full" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const latestQueryRef = useRef(query);

  const fetchAutocomplete = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(q)}&limit=6`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.items || []);
        setShowDropdown(true);
      }
    } catch {
      // Autocomplete failure is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setHighlightedIndex(-1);
      latestQueryRef.current = value;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchAutocomplete(value);
      }, 250);
    },
    [fetchAutocomplete]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToSearch = useCallback(
    (q: string) => {
      if (q.trim()) {
        router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
      }
    },
    [router]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setShowDropdown(false);
      navigateToSearch(query);
    },
    [query, navigateToSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const item = suggestions[highlightedIndex];
        setQuery(item.name);
        setShowDropdown(false);
        navigateToSearch(item.name);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [showDropdown, suggestions, highlightedIndex, navigateToSearch]
  );

  const handleSuggestionClick = useCallback(
    (item: AutocompleteItem) => {
      setQuery(item.name);
      setShowDropdown(false);
      navigateToSearch(item.name);
    },
    [navigateToSearch]
  );

  if (variant === "compact") {
    return (
      <Link
        href="/buscar"
        className={className}
        aria-label="Search products"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </Link>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 2) {
              setShowDropdown(true);
            }
          }}
          placeholder="Buscar productos..."
          className="h-10 w-full rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-4 pl-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none transition focus-visible:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          role="combobox"
          aria-expanded={showDropdown && suggestions.length > 0}
          aria-autocomplete="list"
          aria-controls="search-autocomplete-list"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Autocomplete dropdown — desktop: positioned dropdown, mobile: full-screen overlay */}
        {showDropdown && (
          <>
            {/* Mobile: full-screen overlay backdrop */}
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setShowDropdown(false)}
            />
            <div
              ref={dropdownRef}
              id="search-autocomplete-list"
              role="listbox"
              className={`
                fixed inset-x-0 bottom-0 top-16 z-50 bg-[var(--surface)] overflow-y-auto
                md:static md:inset-auto md:mt-2 md:rounded-xl md:border md:border-[var(--border-subtle)] md:shadow-xl md:overflow-hidden md:max-h-96
                ${suggestions.length === 0 && !loading ? "" : ""}
              `}
            >
              {/* Loading skeleton */}
              {loading && suggestions.length === 0 && (
                <div className="p-3 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-md bg-zinc-700/50 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-zinc-700/50 rounded w-3/4" />
                        <div className="h-3 bg-zinc-700/30 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Results */}
              {suggestions.length > 0 && (
                <>
                  {suggestions.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={index === highlightedIndex}
                      onClick={() => handleSuggestionClick(item)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors ${
                        index === highlightedIndex
                          ? "bg-[var(--accent)]/10 text-[var(--foreground)]"
                          : "text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)]"
                      }`}
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-md object-cover bg-zinc-800 shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                          <svg
                            className="w-4 h-4 text-zinc-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.name}</p>
                        <p className="text-xs opacity-60 truncate">
                          {[item.brand, item.capacity].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Empty state */}
              {!loading && suggestions.length === 0 && query.trim().length >= 2 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    No encontramos resultados para &quot;<span className="font-medium text-[var(--foreground)]">{query.trim()}</span>&quot;.
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">
                    Probá con otros términos o revisá la ortografía.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </form>
  );
}
