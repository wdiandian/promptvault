import { useState, useMemo } from 'react';

type ColumnType = 'text' | 'badge' | 'link' | 'number' | 'actions';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  type?: ColumnType;
  linkPrefix?: string;
  linkKey?: string;
  badgeColors?: Record<string, { bg: string; text: string }>;
  className?: string;
}

interface Props {
  data: Record<string, any>[];
  columns: Column[];
  pageSize?: number;
  searchKeys?: string[];
  emptyMessage?: string;
}

const DEFAULT_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: 'rgba(22,163,74,0.08)', text: '#16a34a' },
  draft: { bg: 'rgba(0,0,0,0.04)', text: '#999999' },
  review: { bg: 'rgba(234,88,12,0.08)', text: '#ea580c' },
  active: { bg: 'rgba(22,163,74,0.08)', text: '#16a34a' },
};

export default function DataTable({
  data,
  columns,
  pageSize = 15,
  searchKeys = [],
  emptyMessage = 'No data found.',
}: Props) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    if (!query.trim() || searchKeys.length === 0) return data;
    const q = query.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const renderCell = (item: Record<string, any>, col: Column) => {
    const val = item[col.key];
    const type = col.type ?? 'text';

    switch (type) {
      case 'badge': {
        const colors = col.badgeColors ?? DEFAULT_BADGE_COLORS;
        const c = colors[String(val).toLowerCase()] ?? { bg: 'rgba(0,0,0,0.04)', text: '#999' };
        const label = String(val).charAt(0).toUpperCase() + String(val).slice(1);
        return (
          <span
            className="text-[.65rem] px-[9px] py-[3px] rounded-full font-semibold inline-block"
            style={{ background: c.bg, color: c.text }}
          >
            {label}
          </span>
        );
      }
      case 'link': {
        const href = col.linkPrefix
          ? `${col.linkPrefix}${item[col.linkKey ?? col.key]}`
          : String(val);
        return (
          <a
            href={href}
            className="text-[.75rem] px-2.5 py-1 rounded-sm border border-border text-text-3 font-semibold hover:border-border-hover hover:text-text-2 transition-all"
          >
            View
          </a>
        );
      }
      case 'actions': {
        const editHref = col.linkPrefix ? `${col.linkPrefix}${item[col.linkKey ?? 'id']}` : '#';
        const viewHref = `/prompt/${item.slug ?? ''}`;
        return (
          <div className="flex gap-1.5">
            <a
              href={editHref}
              className="text-[.75rem] px-2.5 py-1 rounded-sm border border-accent text-accent font-semibold hover:bg-accent hover:text-white transition-all"
            >
              Edit
            </a>
            <a
              href={viewHref}
              className="text-[.75rem] px-2.5 py-1 rounded-sm border border-border text-text-3 font-semibold hover:border-border-hover hover:text-text-2 transition-all"
            >
              View
            </a>
          </div>
        );
      }
      case 'number':
        return <span className="text-text-3 tabular-nums">{Number(val).toLocaleString()}</span>;
      default:
        return <span className={col.className}>{val ?? '—'}</span>;
    }
  };

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search…"
            className="bg-bg-input border border-border rounded-sm px-3.5 py-2 text-sm outline-none focus:border-accent transition-[border] text-text placeholder:text-text-3 w-[260px]"
          />
        </div>
      )}

      <div className="bg-bg-card rounded-[10px] overflow-hidden border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`bg-bg-sidebar px-3.5 py-2.5 text-left text-[.6875rem] font-semibold uppercase tracking-[.03em] text-text-3 border-b border-border ${col.sortable ? 'cursor-pointer select-none hover:text-text-2' : ''}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((item, idx) => (
              <tr key={item.id ?? idx} className="hover:bg-bg-hover transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-3.5 py-2.5 text-[.875rem] border-b border-border">
                    {renderCell(item, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paged.length === 0 && (
          <div className="text-center text-text-3 text-sm py-10">{emptyMessage}</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-text-3">
          <span>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-border rounded-sm hover:border-border-hover disabled:opacity-30 transition-all cursor-pointer"
            >
              Prev
            </button>
            <span className="px-3 py-1.5">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-border rounded-sm hover:border-border-hover disabled:opacity-30 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
