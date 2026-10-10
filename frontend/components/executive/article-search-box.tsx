"use client";

import { forwardRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useArticleSuggestions } from "@/features/catalogue/use-search";
import { cn } from "@/lib/utils";

interface ArticleSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on Enter or when a suggestion is picked, with the text to search for. */
  onSubmit: (value: string) => void;
  placeholder?: string;
  showClear?: boolean;
  inputClassName?: string;
  className?: string;
}

/** Article search input with live suggestions (matches numbers and text, e.g. "SS5205"). */
export const ArticleSearchBox = forwardRef<HTMLInputElement, ArticleSearchBoxProps>(
  function ArticleSearchBox(
    { value, onChange, onSubmit, placeholder, showClear, inputClassName, className },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const suggestions = useArticleSuggestions(value, open);
    const showList = open && suggestions.length > 0;

    function pick(article: string) {
      onChange(article);
      setOpen(false);
      setActiveIndex(-1);
      onSubmit(article);
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      if (event.key === "ArrowDown" && showList) {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
      } else if (event.key === "ArrowUp" && showList) {
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (showList && activeIndex >= 0) {
          pick(suggestions[activeIndex]);
        } else {
          setOpen(false);
          onSubmit(value);
        }
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }

    return (
      <div className={cn("relative", className)}>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          placeholder={placeholder}
          className={cn("h-12 rounded-2xl pl-10 text-[15px]", inputClassName)}
        />
        {showClear && value && (
          <button
            type="button"
            aria-label="Clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
          >
            <X className="size-4.5" />
          </button>
        )}

        {showList && (
          <ul
            role="listbox"
            className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover p-1 shadow-lg"
          >
            {suggestions.map((article, index) => (
              <li
                key={article}
                role="option"
                aria-selected={index === activeIndex}
                // mousedown (not click) so it fires before the input's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(article);
                }}
                className={cn(
                  "cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium",
                  index === activeIndex ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                {article}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
