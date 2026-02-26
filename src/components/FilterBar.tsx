import { useState } from 'react';

interface Tag {
  id: string;
  name: string;
}

interface Props {
  tags: Tag[];
  currentTags?: string[];
  currentSort?: string;
  currentQuery?: string;
  baseUrl?: string;
}

export default function FilterBar({
  tags,
  currentTags = [],
  currentSort = 'latest',
  currentQuery = '',
  baseUrl = '/gallery',
}: Props) {
  const [query, setQuery] = useState(currentQuery);

  const buildUrl = (params: Record<string, string | string[] | undefined>) => {
    const url = new URL(baseUrl, window.location.origin);
    const currentParams = new URLSearchParams(window.location.search);

    for (const [key, val] of Object.entries(params)) {
      if (val === undefined) {
        currentParams.delete(key);
      } else if (Array.isArray(val)) {
        currentParams.delete(key);
        val.forEach((v) => currentParams.append(key, v));
      } else {
        currentParams.set(key, val);
      }
    }

    url.search = currentParams.toString();
    return url.toString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const toggleTag = (tagId: string) => {
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];

    window.location.href = buildUrl({
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  return (
    <div className="sticky top-[52px] z-40 bg-bg/90 backdrop-blur-[14px] border-b border-border px-5 py-2.5 flex items-center gap-2.5 flex-wrap">
      <form
        role="search"
        onSubmit={handleSearch}
        className="flex items-center bg-bg-input border border-border rounded-[10px] px-3.5 gap-2 h-9 w-[220px] transition-[border] duration-150 focus-within:border-text-3"
      >
        <svg className="w-4 h-4 text-text-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="border-none bg-transparent py-2 w-full text-[.875rem] outline-none text-text placeholder:text-text-3"
        />
      </form>

      <div className="flex gap-[5px] overflow-x-auto flex-1 tags-hide-scrollbar">
        <button
          onClick={() => (window.location.href = buildUrl({ tags: undefined }))}
          className={`px-3.5 py-[5px] rounded-full text-[.8125rem] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
            currentTags.length === 0
              ? 'bg-[#1a1a1a] text-white font-semibold'
              : 'text-text-3 hover:text-text-2'
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`px-3.5 py-[5px] rounded-full text-[.8125rem] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
              currentTags.includes(tag.id)
                ? 'bg-[#1a1a1a] text-white font-semibold'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <select
        value={currentSort}
        onChange={(e) => (window.location.href = buildUrl({ sort: e.target.value }))}
        className="bg-bg-input border border-border rounded-sm px-3 py-1.5 text-[.8125rem] text-text-3 h-[34px] cursor-pointer"
      >
        <option value="latest">Latest</option>
        <option value="popular">Popular</option>
        <option value="random">Random</option>
      </select>
    </div>
  );
}
