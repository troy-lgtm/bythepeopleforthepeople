import type { LucideIcon } from "lucide-react";

type MethodologyPrincipleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function MethodologyPrincipleCard({
  icon: Icon,
  title,
  description,
}: MethodologyPrincipleCardProps) {
  return (
    <article className="rounded-lg border border-record-200 bg-white p-5 shadow-line">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-700">{description}</p>
    </article>
  );
}
