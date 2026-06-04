type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Heading level for the title. Use "h1" once per page for the primary title. */
  as?: "h1" | "h2";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  as = "h2",
}: SectionHeaderProps) {
  const Title = as;
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-700">
          {eyebrow}
        </p>
      ) : null}
      <Title className="mt-3 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
        {title}
      </Title>
      {description ? (
        <p className="mt-3 text-base leading-7 text-ink-600">{description}</p>
      ) : null}
    </div>
  );
}
