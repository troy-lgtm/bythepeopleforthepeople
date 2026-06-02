import type { Metadata } from "next";
import { CauseWizard } from "@/components/CauseWizard";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { readCauses } from "@/lib/causes";
import { readPlace } from "@/lib/place";
import { STATE_NAMES } from "@/data/states";

export const metadata: Metadata = {
  title: "Add a cause",
  description:
    "Pick a starter cause or write your own. The product matches indexed records, votes, and reps to your cause.",
  alternates: { canonical: "/causes/new" },
};

export default async function NewCausePage() {
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
        />
      </section>
    </PageShell>
  );
}
