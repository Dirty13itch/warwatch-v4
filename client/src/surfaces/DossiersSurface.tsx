import { useMemo } from "react";
import type { EntityDossier, GraphSnapshot } from "@shared/types";
import { formatDate, formatDateTime, formatTokenLabel } from "../lib/format";

function excerpt(value: string, limit = 180): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trim()}...`;
}

function publicationLabel(reviewState: string, visibility: string): string {
  if (reviewState === "approved" || reviewState === "auto_published") {
    return visibility === "primary" ? "public primary" : "public secondary";
  }

  return "review gated";
}

export default function DossiersSurface({
  graph,
  dossier,
  onSelectEntity,
  onOpenEvent
}: {
  graph: GraphSnapshot;
  dossier: EntityDossier | null;
  onSelectEntity: (key: string) => void;
  onOpenEvent?: (eventId: string) => void;
}) {
  const relationshipCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const relationship of graph.relationships) {
      counts.set(relationship.fromEntityId, (counts.get(relationship.fromEntityId) ?? 0) + 1);
      counts.set(relationship.toEntityId, (counts.get(relationship.toEntityId) ?? 0) + 1);
    }
    return counts;
  }, [graph.relationships]);

  const selectedEntityId = dossier?.entity.id ?? null;
  const pendingClaims = graph.claims.filter((claim) => claim.reviewState === "pending").length;
  const freshestEvidence =
    dossier?.events[0]?.date ??
    dossier?.briefings[0]?.briefingDate ??
    null;

  return (
    <div className="space-y-6" data-preview="dossiers-surface">
      <section className="shell-panel p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow-label">
              Dossiers
            </p>
            <h2 className="section-heading text-[2rem]">Canonical actor and claim graph</h2>
          </div>
          <p className="section-copy max-w-[24rem]">
            This is the product shift from feed reader to explorable intelligence graph: actors, claims, influence lanes, and the public evidence stack live in one surface.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["Tracked actors", String(graph.entities.length)],
            ["Canonical claims", String(graph.claims.length)],
            ["Relationship lanes", String(graph.relationships.length)],
            ["Pending claims", String(pendingClaims)]
          ].map(([label, value]) => (
            <div
              key={label}
              className="subtle-card p-4"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">{label}</p>
              <p className="mt-3 font-display text-2xl text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="shell-panel p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow-label">
                Actor rail
              </p>
              <h2 className="section-heading text-[2rem]">Campaign participants and chokepoints</h2>
            </div>
            <p className="section-copy max-w-[16rem]">
              Each dossier resolves into relationships, claims, and the latest public evidence.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {graph.entities.map((entity) => {
              const selected = entity.id === selectedEntityId;
              return (
                <button
                  key={entity.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectEntity(entity.slug)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${
                    selected
                      ? "subtle-card subtle-card-strong border-signal/22"
                      : "subtle-card hover:border-white/14 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{entity.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-calm/82">{entity.summary}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/58">
                      {formatTokenLabel(entity.kind)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                      {relationshipCounts.get(entity.id) ?? 0} links
                    </span>
                    <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                      {entity.slug}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="shell-panel p-5"
          data-preview="dossiers-detail"
        >
          {dossier ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="eyebrow-label">
                    Selected dossier
                  </p>
                  <h2 className="section-heading mt-2 text-[2.3rem]">{dossier.entity.name}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-calm/82">{dossier.entity.summary}</p>
                </div>
                <span className="rounded-full border border-white/8 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                  {formatTokenLabel(dossier.entity.kind)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Influence lanes", String(dossier.relationships.length)],
                  ["Linked claims", String(dossier.claims.length)],
                  [
                    "Freshest evidence",
                    freshestEvidence ? formatDate(freshestEvidence) : "No linked public evidence"
                  ]
                ].map(([label, value]) => (
                  <div key={label} className="subtle-card p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-calm/60">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="detail-panel p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      Influence lanes
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">How this actor touches the theater</h3>
                  </div>
                  <p className="max-w-[18rem] text-sm leading-6 text-calm/72">
                    Direction and relation type are explicit so the public product can show structure, not just chronology.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {dossier.relationships.length ? (
                    dossier.relationships.map((link) => (
                      <div
                        key={link.relationship.id}
                        className="subtle-card p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/78">
                              {link.direction === "outbound" ? "Outbound" : "Inbound"}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold text-white">
                              {dossier.entity.name} {link.direction === "outbound" ? "->" : "<-"} {link.counterparty?.name ?? "Unknown"}
                            </h4>
                          </div>
                          <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                            {link.relationship.confidence}
                          </span>
                        </div>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/60">
                          {formatTokenLabel(link.relationship.relationType)}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-calm/82">{link.relationship.note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="subtle-card p-4 text-sm leading-6 text-calm/76">
                      No canonical relationship lanes are attached to this actor yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      Linked claims
                    </p>
                    <div className="mt-4 space-y-3">
                      {dossier.claims.length ? (
                        dossier.claims.map((claim) => (
                          <div
                            key={claim.id}
                            className="rounded-[18px] border border-white/8 bg-[#08111b]/90 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-base font-semibold text-white">{claim.title}</h4>
                              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {claim.reviewState}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-calm/82">{claim.statement}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {claim.status}
                              </span>
                              <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {claim.significance}
                              </span>
                              <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {claim.confidence}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-calm/74">
                          No canonical claims currently resolve directly to this actor.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      Briefing handoff
                    </p>
                    <div className="mt-4 space-y-3">
                      {dossier.briefings.length ? (
                        dossier.briefings.map((briefing) => (
                          <div
                            key={briefing.id}
                            className="rounded-[18px] border border-white/8 bg-[#08111b]/90 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-base font-semibold text-white">{briefing.title}</h4>
                                <p className="mt-2 text-sm text-calm/70">{formatDate(briefing.briefingDate)}</p>
                              </div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {briefing.reviewState}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-calm/82">{excerpt(briefing.body, 200)}</p>
                            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/56">
                              Published {formatDateTime(briefing.createdAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-calm/74">
                          No published briefing sections are currently tied to this actor.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      Latest events
                    </p>
                    <div className="mt-4 space-y-3">
                      {dossier.events.length ? (
                        dossier.events.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-[18px] border border-white/8 bg-[#08111b]/90 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-base font-semibold text-white">{event.title}</h4>
                                <p className="mt-2 text-sm text-calm/70">{formatDate(event.date)}</p>
                              </div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {publicationLabel(event.reviewState, event.visibility)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-calm/82">{excerpt(event.detail, 180)}</p>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {event.significance}
                              </span>
                              <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {event.confidence}
                              </span>
                              <span className="rounded-full border border-white/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {event.corroboration} refs
                              </span>
                              {onOpenEvent ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenEvent(event.id)}
                                  className="rounded-full border border-signal/20 bg-signal/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal"
                                >
                                  Open timeline
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-calm/74">
                          No public events currently match this actor dossier.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal/76">
                      Story spine
                    </p>
                    <div className="mt-4 space-y-3">
                      {dossier.stories.length ? (
                        dossier.stories.map((story) => (
                          <div
                            key={story.id}
                            className="rounded-[18px] border border-white/8 bg-[#08111b]/90 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-base font-semibold text-white">{story.title}</h4>
                                <p className="mt-2 text-sm text-calm/70">{story.sourceText}</p>
                              </div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-calm/64">
                                {formatTokenLabel(story.section)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-calm/82">{story.summary}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-calm/74">
                          No canonical stories currently reinforce this dossier.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-calm/76">
              No actor dossier is available yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
