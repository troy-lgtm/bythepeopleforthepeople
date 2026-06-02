import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CauseEditor } from "@/components/CauseEditor";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { readCauseById } from "@/lib/causes";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) return { title: "Cause not found" };
  return {
    title: `Edit: ${cause.title}`,
    description: cause.outcome,
    robots: { index: false, follow: false },
  };
}

export default async function CauseEditPage({ params }: Props) {
  const { id } = await params;
  const cause = await readCauseById(id);
  if (!cause) notFound();

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href={`/causes/${cause.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-600"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to cause
          </Link>
          <SectionHeader
            eyebrow="Refine your cause"
            title={cause.title}
            description="Sharpening the outcome, topics, jurisdictions, or keywords improves the match. Saved straight to your cookie."
          />
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <CauseEditor cause={cause} />
      </section>
    </PageShell>
  );
}
