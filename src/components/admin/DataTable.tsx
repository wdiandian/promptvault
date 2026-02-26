import { useState, useMemo } from 'react';

type ColumnType = 'text' | 'badge' | 'link' | 'number';

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
  published: { bg: 'rgba(74,222,128,0.1)', text: '#4ade80' },
  draft: { bg: 'rgba(99,99,99,0.15)', text: '#636363' },
  review: { bg: 'rgba(251,146,60,0.1)', text: '#fb923c' },
  active: { bg: 'rgba(74,222,128,0.1)', text: '#4ade80' },
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
        const c = colors[String(val).toLowerCase()] ?? { bg: 'rgba(99,99,99,0.15)', text: '#636363' };
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
            className="text-[.7rem] px-2.5 py-1 rounded-sm border border-[#222] text-[#636363] font-semibold hover:border-[#636363] hover:text-[#a0a0a0] transition-all"
          >
            View
          </a>
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
            className="bg-[#1a1a1a] border border-[#222] rounded-[6px] px-3.5 py-2 text-sm outline-none focus:border-[#e8634a] transition-[border] text-[#f0f0f0] placeholder:text-[#636363] w-[260px]"
          />
        </div>
      )}

      <div className="bg-[#161616] rounded-[10px] overflow-hidden border border-[#222]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`bg-[#111] px-3.5 py-2.5 text-left text-[.6875rem] font-semibold uppercase tracking-[.03em] text-[#636363] border-b border-[#222] ${col.sortable ? 'cursor-pointer select-none hover:text-[#a0a0a0]' : ''}`}
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
              <tr key={item.id ?? idx} className="hover:bg-[#1e1e1e] transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-3.5 py-2.5 text-[.8125rem] border-b border-[#222]">
                    {renderCell(item, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paged.length === 0 && (
          <div className="text-center text-[#636363] text-sm py-10">{emptyMessage}</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-[#636363]">
          <span>{sorted.length} item{sorted.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-[#222] rounded-[6px] hover:border-[#333] disabled:opacity-30 transition-all cursor-pointer"
            >
              Prev
            </button>
            <span className="px-3 py-1.5">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-[#222] rounded-[6px] hover:border-[#333] disabled:opacity-30 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
