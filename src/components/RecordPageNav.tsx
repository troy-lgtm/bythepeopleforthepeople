type RecordPageNavProps = {
  items: Array<{ href: string; label: string }>;
};

export function RecordPageNav({ items }: RecordPageNavProps) {
  return (
    <nav
      aria-label="Record sections"
      className="sticky top-[65px] z-30 border-b border-record-200 bg-paper-50/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-record-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 shadow-line hover:border-civic-500 hover:text-civic-700"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
