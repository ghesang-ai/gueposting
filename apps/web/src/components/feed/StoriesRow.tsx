"use client";

export function StoriesRow() {
  const placeholders = Array.from({ length: 6 });

  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none border-b border-border">
      {placeholders.map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-muted animate-pulse ring-2 ring-border" />
          <span className="text-[10px] text-muted-foreground w-14 truncate text-center">User {i + 1}</span>
        </div>
      ))}
    </div>
  );
}
