import Link from "next/link";
import type { Vote } from "@/data/types";
import { getSourcesByIds } from "@/data/records";
import { SourceTrail } from "./SourceTrail";

type VoteTableProps = {
  votes: Vote[];
};

const voteToneClass: Record<string, string> = {
  Yes: "border-emerald-200 bg-emerald-50 text-emerald-800",
  No: "border-rose-200 bg-rose-50 text-rose-800",
  Abstain: "border-record-200 bg-paper-50 text-ink-700",
  Absent: "border-record-200 bg-paper-50 text-ink-700",
  NVR: "border-record-200 bg-paper-50 text-ink-700",
};

export function VoteTable({ votes }: VoteTableProps) {
  return (
    <div className="grid gap-5">
      {votes.map((vote) => (
        <article
          key={vote.id}
          className="overflow-hidden rounded-lg border border-record-200 bg-white shadow-line"
        >
          <div className="grid gap-4 border-b border-record-200 p-5 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="font-mono text-xs font-medium text-ink-600">
                {vote.date}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink-950">
                {vote.motion}
              </h3>
              <p className="mt-1 text-sm text-ink-600">{vote.chamberOrBody}</p>
            </div>
            <div
              className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4"
              role="group"
              aria-label={`Vote tally for ${vote.motion}`}
            >
              <VoteCount label="Yes" value={vote.yes} />
              <VoteCount label="No" value={vote.no} />
              <VoteCount label="Abstain" value={vote.abstain} />
              <VoteCount
                label="NVR"
                value={vote.absent}
                fullLabel="No vote recorded"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            {vote.members.length ? (
              <table className="min-w-full divide-y divide-record-200 text-left text-sm">
                <caption className="sr-only">
                  {`Member votes for ${vote.motion} (${vote.chamberOrBody}): ${vote.yes ?? 0} yes, ${vote.no ?? 0} no, ${vote.abstain ?? 0} abstain, ${vote.absent ?? 0} no vote recorded.`}
                </caption>
                <thead className="bg-paper-50 text-xs uppercase tracking-[0.14em] text-ink-600">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Member
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Seat
                    </th>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Vote
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-record-200 bg-white">
                  {vote.members.map((member, index) => {
                    const memberHref = member.entitySlug
                      ? member.entitySlug.startsWith("/")
                        ? member.entitySlug
                        : `/people/${member.entitySlug}`
                      : null;
                    return (
                      <tr key={`${vote.id}-${index}-${member.name}`}>
                        <td className="px-5 py-3 font-medium text-ink-950">
                          {memberHref ? (
                            <Link
                              href={memberHref}
                              className="hover:text-civic-700"
                            >
                              {member.name}
                            </Link>
                          ) : (
                            member.name
                          )}
                        </td>
                        <td className="px-5 py-3 text-ink-600">
                          {member.districtOrSeat}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              voteToneClass[member.vote] ??
                              voteToneClass.Abstain
                            }`}
                          >
                            {member.vote}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="bg-paper-50 p-5 text-sm leading-6 text-ink-700">
                {vote.note ??
                  "The source records an action, but member-level votes were not available in this dataset."}
              </div>
            )}
          </div>
          <div className="border-t border-record-200 p-5">
            <SourceTrail sources={getSourcesByIds(vote.sourceIds)} compact />
          </div>
        </article>
      ))}
    </div>
  );
}

function VoteCount({
  label,
  value,
  fullLabel,
}: {
  label: string;
  value: number | null;
  fullLabel?: string;
}) {
  return (
    <div
      role="img"
      className="rounded-lg border border-record-200 bg-paper-50 px-3 py-2"
      aria-label={`${fullLabel ?? label}: ${value ?? "not available"}`}
    >
      <div className="font-mono text-lg font-semibold text-ink-950" aria-hidden="true">
        {value ?? "n/a"}
      </div>
      <div className="text-xs font-medium text-ink-600" aria-hidden="true">
        {label}
      </div>
    </div>
  );
}
