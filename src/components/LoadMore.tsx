import { useState, useEffect, useRef, useCallback } from 'react';
import { showToast } from '@/lib/stores';

interface Props {
  modelId?: string;
  tagIds?: string[];
  sort?: string;
  initialOffset: number;
}

function formatCount(n: number): string {
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

export default function LoadMore({ modelId, tagIds = [], sort = 'latest', initialOffset }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const offsetRef = useRef(initialOffset);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = data.items.filter((i: any) => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
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
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '600px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  const handleCopy = async (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/prompts/${slug}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      await navigator.clipboard.writeText(data.promptText ?? '');
      showToast('Copied!');
      fetch(`/api/prompts/${slug}/copy`, { method: 'POST' });
    } catch {
      showToast('Failed to copy');
    }
  };

  return (
    <>
      {items.length > 0 && (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1.5 px-1.5 pb-1.5">
          {items.map((item) => {
            const imgSrc = item.coverUrl ?? `https://picsum.photos/seed/${item.slug}/400/${item.coverHeight ?? 400}`;
            const vid = isVideo(imgSrc) || item.modelType === 'video';
            const w = item.coverWidth ?? 400;
            const h = item.coverHeight ?? (vid ? 534 : 500);
            return (
              <a
                key={item.id}
                href={`/prompt/${item.slug}`}
                className="group block break-inside-avoid mb-1.5 rounded-sm overflow-hidden relative cursor-pointer bg-bg-card"
              >
                <div style={{ aspectRatio: `${w}/${h}` }} className="w-full overflow-hidden bg-bg-hover">
                  <img
                    src={vid ? `${imgSrc}#t=0.5` : imgSrc}
                    alt={item.title}
                    width={w}
                    height={h}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
                  <h3 className="text-[.875rem] font-semibold leading-[1.35] mb-1 line-clamp-2 text-white">{item.title}</h3>
                  <div className="text-[.75rem] text-white/60 flex items-center gap-2">
                    <span>{item.modelName}</span>
                    <span>&#9825; {formatCount(item.copies)}</span>
                  </div>
                </div>

                <button
                  className="absolute top-2 right-2 w-[30px] h-[30px] rounded-sm bg-black/40 backdrop-blur-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-accent border border-white/[.08]"
                  onClick={(e) => handleCopy(item.slug, e)}
                  title="Copy prompt"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </button>

                {vid && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 text-[.6875rem] font-semibold px-2 py-[3px] rounded-sm bg-black/50 backdrop-blur-[8px] text-white/80">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Video
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}

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
        <div className="text-center py-8 text-text-3 text-xs">All prompts loaded</div>
      )}
    </>
  );
}
