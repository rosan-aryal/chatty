"use client";

import { useState, useRef, useEffect } from "react";
import { useCountries } from "@/hooks/use-countries";
import { ChevronsUpDown, Check, Globe, Loader2 } from "lucide-react";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  showAny?: boolean;
  placeholder?: string;
}

export function CountrySelector({
  value,
  onChange,
  showAny = false,
  placeholder = "Select country",
}: CountrySelectorProps) {
  const { data: countries, isLoading } = useCountries();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = countries?.find((c) => c.code === value);

  const filtered = countries?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (isLoading) {
    return (
      <div className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading countries...
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <img
              src={selected.flagUrl}
              alt={selected.name}
              className="h-4 w-6 rounded-sm object-cover"
            />
            {selected.name}
          </span>
        ) : value === "any" ? (
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Any Country
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {showAny && (
              <button
                type="button"
                onClick={() => {
                  onChange("any");
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Globe className="h-4 w-4" />
                <span>Any Country</span>
                {value === "any" && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            )}
            {filtered?.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <img
                  src={country.flagUrl}
                  alt={country.name}
                  className="h-4 w-6 rounded-sm object-cover"
                />
                <span>{country.name}</span>
                {value === country.code && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
