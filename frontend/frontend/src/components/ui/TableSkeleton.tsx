export function TableSkeleton({ columns = 5, rows = 4 }: { columns?: number; rows?: number }) {
  return (
    <div className="w-full text-sm animate-pulse">
      <div className="border-b border-brand-border bg-brand-surface/30 px-5 py-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`th-${i}`} className={`h-4 bg-brand-border rounded ${i === 0 ? 'flex-1' : 'w-24'}`}></div>
        ))}
      </div>
      <div className="divide-y divide-brand-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`tr-${r}`} className="px-5 py-5 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={`td-${r}-${c}`} className={`h-4 bg-brand-surface rounded ${c === 0 ? 'flex-1' : 'w-24'}`}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
