import type { Metadata } from "next";
import { CauseWizard } from "@/components/CauseWizard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { readCauses } from "@/lib/causes";
import { readPlace } from "@/lib/place";
import { STATE_NAMES } from "@/data/states";
import { STARTER_CAUSES } from "@/data/starter-causes";

export const metadata: Metadata = {
  title: "Add a cause",
  description:
    "Pick a starter cause or write your own. The product matches indexed records, votes, and reps to your cause.",
  alternates: { canonical: "/causes/new" },
};

type NewCausePageProps = {
  searchParams: Promise<{
    title?: string;
    keywords?: string;
    starter?: string;
  }>;
};

export default async function NewCausePage({ searchParams }: NewCausePageProps) {
  const { title, keywords, starter } = await searchParams;
  // A ?starter=<id> deep-link preselects the matching starter card and
  // prefills its title + keywords; free-form ?title=/?keywords= still work.
  const starterCause = starter
    ? STARTER_CAUSES.find((s) => s.id === starter)
    : undefined;
  const initialTitle = title ?? starterCause?.title;
  const initialKeywords = keywords ?? starterCause?.watchTermsAny.join(", ");
  const initialOutcome = starterCause?.outcome;
  const place = await readPlace();
  const causes = await readCauses();
  const existing = causes.map((c) => ({
    id: c.id,
    title: c.title,
    emoji: c.emoji,
    topics: c.topics,
    watchTermsAny: c.watchTermsAny,
    jurisdictions: c.jurisdictions,
  }));
  const defaultJurisdictions: string[] = [];
  if (place?.state) {
    const stateName = STATE_NAMES[place.state];
    if (stateName) {
      defaultJurisdictions.push(`${stateName} Legislature`);
    }
    if (place.city) defaultJurisdictions.push(`${place.city} City Council`);
  }
  if (defaultJurisdictions.length === 0) {
    defaultJurisdictions.push("United States Congress");
  }

  return (
    <PageShell>
      <section className="border-b border-record-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="New cause"
            title="What do you want?"
            description="In your own words. We match indexed records, reps, and votes to it. We do not score alignment."
          />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CauseWizard
          existing={existing}
          defaultJurisdictions={defaultJurisdictions}
          initialTitle={initialTitle}
          initialKeywords={initialKeywords}
          initialOutcome={initialOutcome}
          initialStarterId={starterCause?.id}
        />
      </section>
    </PageShell>
  );
}
