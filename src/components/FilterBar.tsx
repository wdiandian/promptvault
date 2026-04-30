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
  currentModelId?: string;
}

export default function FilterBar({
  tags,
  currentTags = [],
  currentSort = 'latest',
  currentQuery = '',
  baseUrl = '/gallery',
  currentModelId,
}: Props) {
  const buildHref = (params: Record<string, string | string[] | undefined>) => {
    const searchParams = new URLSearchParams();

    if (currentModelId) searchParams.set('model', currentModelId);
    currentTags.forEach((tag) => searchParams.append('tags', tag));
    if (currentSort && currentSort !== 'latest') searchParams.set('sort', currentSort);

    for (const [key, value] of Object.entries(params)) {
      searchParams.delete(key);
      if (value === undefined) continue;
      if (Array.isArray(value)) value.forEach((item) => searchParams.append(key, item));
      else searchParams.set(key, value);
    }

    const queryString = searchParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const getToggledTags = (tagId: string) => (
    currentTags.includes(tagId)
      ? currentTags.filter((tag) => tag !== tagId)
      : [...currentTags, tagId]
  );

  const sortOptions = [
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Popular' },
    { value: 'random', label: 'Random' },
  ];

  return (
    <div className="sticky top-[52px] z-40 bg-bg/90 backdrop-blur-[14px] border-b border-border px-5 py-2.5 flex items-center gap-2.5 flex-wrap">
      <form
        role="search"
        action="/search"
        className="flex items-center bg-bg-input border border-border rounded-[10px] px-3.5 gap-2 h-9 w-[220px] transition-[border] duration-150 focus-within:border-text-3"
      >
        <svg className="w-4 h-4 text-text-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          name="q"
          type="text"
          defaultValue={currentQuery}
          placeholder="Search..."
          className="border-none bg-transparent py-2 w-full text-[.875rem] outline-none text-text placeholder:text-text-3"
        />
      </form>

      <div className="flex gap-[5px] overflow-x-auto flex-1 tags-hide-scrollbar">
        <a
          href={buildHref({ tags: undefined })}
          className={`px-3.5 py-[5px] rounded-full text-[.8125rem] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
            currentTags.length === 0
              ? 'bg-[#1a1a1a] text-white font-semibold'
              : 'text-text-3 hover:text-text-2'
          }`}
        >
          All
        </a>
        {tags.map((tag) => (
          <a
            key={tag.id}
            href={buildHref({ tags: getToggledTags(tag.id) })}
            className={`px-3.5 py-[5px] rounded-full text-[.8125rem] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
              currentTags.includes(tag.id)
                ? 'bg-[#1a1a1a] text-white font-semibold'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            {tag.name}
          </a>
        ))}
      </div>

      <div className="flex items-center rounded-sm border border-border bg-bg-input p-0.5">
        {sortOptions.map((option) => (
          <a
            key={option.value}
            href={buildHref({ sort: option.value === 'latest' ? undefined : option.value })}
            className={`px-2.5 py-1 text-[.75rem] font-medium rounded-[3px] transition-colors ${
              currentSort === option.value
                ? 'bg-white text-text shadow-[0_1px_2px_rgba(0,0,0,.06)]'
                : 'text-text-3 hover:text-text-2'
            }`}
          >
            {option.label}
          </a>
        ))}
      </div>
    </div>
  );
}
