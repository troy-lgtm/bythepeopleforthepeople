import { MessageSquare } from "lucide-react";

type PlainLanguageCalloutProps = {
  text: string;
};

export function PlainLanguageCallout({ text }: PlainLanguageCalloutProps) {
  return (
    <aside
      role="note"
      aria-label="Plain-language summary"
      className="mt-6 rounded-lg border border-civic-100 bg-civic-50 p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-civic-700">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-700">
            Plain English
          </p>
          <p className="mt-2 text-base leading-7 text-ink-900">{text}</p>
          <p className="mt-3 text-xs leading-5 text-ink-600">
            Translation only. The legal effect is whatever the official record
            says. When in doubt, read the source.
          </p>
        </div>
      </div>
    </aside>
  );
}
