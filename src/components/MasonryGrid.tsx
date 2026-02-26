import { useState, useEffect, useRef, useCallback } from 'react';
import { showToast } from '@/lib/stores';

interface PromptItem {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  coverThumbUrl: string | null;
  coverHeight: number | null;
  copies: number;
  views: number;
  modelName: string;
  modelColor: string;
  modelType: string;
}

interface Props {
  initialItems: PromptItem[];
  hasMore: boolean;
  modelId?: string;
  tagIds?: string[];
  sort?: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

export default function MasonryGrid({ initialItems, hasMore: initialHasMore, modelId, tagIds = [], sort = 'latest' }: Props) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialItems.length);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (modelId) params.set('modelId', modelId);
      params.set('sort', sort);
      params.set('limit', '20');
      params.set('cursor', String(offsetRef.current));
      tagIds.forEach((t) => params.append('tagIds', t));

      const res = await fetch(`/api/prompts?${params}`);
      if (!res.ok) throw new Error('Failed to load');

      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      offsetRef.current += data.items.length;
    } catch {
      showToast('Failed to load more');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, modelId, sort, tagIds]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '600px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleCopy = async (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/prompts/${slug}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      await navigator.clipboard.writeText(data.promptText ?? data.prompt_items?.promptText ?? '');
      showToast('Copied!');
      fetch(`/api/prompts/${slug}/copy`, { method: 'POST' });
    } catch {
      showToast('Failed to copy');
    }
  };

  return (
    <>
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5 p-1.5">
        {items.map((item) => {
          const imgSrc = item.coverUrl ?? `https://picsum.photos/seed/${item.slug}/400/${item.coverHeight ?? 400}`;
          return (
            <a
              key={item.id}
              href={`/prompt/${item.slug}`}
              className="group block break-inside-avoid mb-1.5 rounded-sm overflow-hidden relative cursor-pointer bg-bg-card"
            >
              <img
                src={imgSrc}
                alt={item.title}
                loading="lazy"
                className="w-full block transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
                <h3 className="text-[.8125rem] font-semibold leading-[1.35] mb-1 line-clamp-2">{item.title}</h3>
                <div className="text-[.6875rem] text-white/60 flex items-center gap-2">
                  <span>{item.modelName}</span>
                  <span>&#9825; {formatCount(item.copies)}</span>
                </div>
              </div>

              <button
                className="absolute top-2 right-2 w-[30px] h-[30px] rounded-sm bg-black/45 backdrop-blur-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-accent border border-white/[.08]"
                onClick={(e) => handleCopy(item.slug, e)}
                title="Copy prompt"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>

              {item.modelType === 'video' && (
                <span className="absolute top-2 left-2 text-[.6rem] font-semibold px-[7px] py-[3px] rounded-sm bg-black/45 backdrop-blur-[8px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 uppercase tracking-[.04em]">
                  Video
                </span>
              )}
            </a>
          );
        })}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loading && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-text-3 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-text-3 text-xs">
          All prompts loaded
        </div>
      )}
    </>
  );
}
