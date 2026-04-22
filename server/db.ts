import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { loadLegacyBundle } from "./legacy.js";
import { CONFLICT_START_ISO } from "./config.js";
import {
  initialReviewState,
  initialVisibility,
  severityFromSignificance
} from "../shared/review.js";
import type { Confidence, Significance } from "../shared/types.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toId(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 12)}`;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (!value) {
    return null;
  }

  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) {
    return null;
  }

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function inferSignificanceFromMagnitude(magnitude: number): Significance {
  if (magnitude >= 5.5) {
    return "critical";
  }

  if (magnitude >= 4.7) {
    return "high";
  }

  if (magnitude >= 4) {
    return "medium";
  }

  return "watch";
}

export function openDatabase({
  dbPath,
  legacyDir,
  blueprintPath
}: {
  dbPath: string;
  legacyDir: string;
  blueprintPath: string;
}): DatabaseSync {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  createSchema(db);

  const seeded = db.prepare("SELECT COUNT(*) AS count FROM events").get() as { count: number };
  if (!seeded.count) {
    seedDatabase(db, legacyDir, blueprintPath);
  }

  return db;
}

function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      reliability_score REAL NOT NULL,
      bias_direction TEXT NOT NULL,
      notes TEXT NOT NULL,
      review_state TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      from_entity_id TEXT NOT NULL,
      to_entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      confidence TEXT NOT NULL,
      note TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      statement TEXT NOT NULL,
      status TEXT NOT NULL,
      significance TEXT NOT NULL,
      confidence TEXT NOT NULL,
      evidence_refs_json TEXT NOT NULL,
      review_state TEXT NOT NULL,
      last_reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      section TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT NOT NULL,
      significance TEXT NOT NULL,
      source_text TEXT NOT NULL,
      review_state TEXT NOT NULL,
      meta_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      category TEXT NOT NULL,
      significance TEXT NOT NULL,
      confidence TEXT NOT NULL,
      corroboration INTEGER NOT NULL,
      source_text TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      review_state TEXT NOT NULL,
      visibility TEXT NOT NULL,
      geo_json TEXT,
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      metric_key TEXT NOT NULL,
      value REAL,
      value_text TEXT,
      unit TEXT,
      timestamp TEXT NOT NULL,
      source_text TEXT NOT NULL,
      confidence TEXT NOT NULL,
      review_state TEXT NOT NULL,
      freshness TEXT NOT NULL,
      meta_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS metrics_key_timestamp_idx ON metrics(metric_key, timestamp);

    CREATE TABLE IF NOT EXISTS briefings (
      id TEXT PRIMARY KEY,
      briefing_date TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      source_refs_json TEXT NOT NULL,
      review_state TEXT NOT NULL,
      publish_state TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_queue (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingestion_runs (
      id TEXT PRIMARY KEY,
      feed_name TEXT NOT NULL,
      run_type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      summary TEXT NOT NULL,
      inserted_count INTEGER NOT NULL,
      queued_count INTEGER NOT NULL,
      error_text TEXT
    );

    CREATE TABLE IF NOT EXISTS map_features (
      id TEXT PRIMARY KEY,
      layer_key TEXT NOT NULL,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      source_text TEXT NOT NULL,
      review_state TEXT NOT NULL,
      meta_json TEXT NOT NULL
    );
  `);
}

function seedDatabase(db: DatabaseSync, legacyDir: string, blueprintPath: string): void {
  const { data, blueprint } = loadLegacyBundle(legacyDir, blueprintPath);
  const now = new Date().toISOString();
  const sourceMatrix = new Map([
    ["CENTCOM", { type: "official_us", score: 0.7, bias: "pro_us", notes: "Official US military source." }],
    ["ISW/CritThreats", { type: "analysis", score: 0.8, bias: "pro_us", notes: "Think-tank analysis with stable research cadence." }],
    ["Reuters", { type: "wire", score: 0.85, bias: "neutral_west", notes: "Wire-service reporting." }],
    ["Al Jazeera", { type: "regional", score: 0.75, bias: "pro_arab", notes: "Regional outlet with broad Middle East coverage." }],
    ["IRNA/PressTV", { type: "state_media", score: 0.3, bias: "pro_iran", notes: "Iranian state media." }],
    ["Scott Ritter", { type: "independent", score: 0.5, bias: "counter_narrative", notes: "Independent analyst; requires corroboration." }],
    ["Pepe Escobar", { type: "independent", score: 0.5, bias: "counter_narrative", notes: "Independent geopolitical analyst." }],
    ["Drop Site News", { type: "independent", score: 0.7, bias: "counter_narrative", notes: "Investigative source." }],
    ["Bellingcat", { type: "osint", score: 0.9, bias: "neutral_forensic", notes: "OSINT/forensic reporting." }],
    ["@sentdefender", { type: "osint", score: 0.75, bias: "neutral_osint", notes: "OSINT signal account." }]
  ]);

  const insertSource = db.prepare(`
    INSERT OR IGNORE INTO sources (
      id, slug, name, type, reliability_score, bias_direction, notes, review_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEntity = db.prepare(`
    INSERT OR IGNORE INTO entities (id, slug, name, kind, summary) VALUES (?, ?, ?, ?, ?)
  `);
  const insertRelationship = db.prepare(`
    INSERT OR IGNORE INTO relationships (
      id, from_entity_id, to_entity_id, relation_type, confidence, note
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertClaim = db.prepare(`
    INSERT OR IGNORE INTO claims (
      id, title, statement, status, significance, confidence, evidence_refs_json, review_state, last_reviewed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertStory = db.prepare(`
    INSERT OR IGNORE INTO stories (
      id, slug, title, section, summary, detail, significance, source_text, review_state, meta_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (
      id, date, time, title, detail, category, significance, confidence, corroboration,
      source_text, source_refs_json, review_state, visibility, geo_json, tags_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMetric = db.prepare(`
    INSERT OR IGNORE INTO metrics (
      id, metric_key, value, value_text, unit, timestamp, source_text, confidence, review_state, freshness, meta_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertBriefing = db.prepare(`
    INSERT OR IGNORE INTO briefings (
      id, briefing_date, title, body, source_refs_json, review_state, publish_state, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertQueue = db.prepare(`
    INSERT OR IGNORE INTO review_queue (
      id, item_type, item_id, title, severity, reason, status, created_at, updated_at, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMapFeature = db.prepare(`
    INSERT OR IGNORE INTO map_features (
      id, layer_key, title, kind, lat, lon, severity, status, source_text, review_state, meta_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sourceNames = new Set<string>();
  for (const feed of data.RSS_FEEDS ?? []) {
    sourceNames.add(feed.name);
  }
  for (const event of data.WAR_TIMELINE ?? []) {
    event.source
      .split("/")
      .map((value: string) => value.trim())
      .filter(Boolean)
      .forEach((value: string) => sourceNames.add(value));
  }
  for (const [name, profile] of sourceMatrix.entries()) {
    insertSource.run(
      toId("src", name),
      slugify(name),
      name,
      profile.type,
      profile.score,
      profile.bias,
      profile.notes,
      "approved"
    );
  }
  for (const name of sourceNames) {
    if (sourceMatrix.has(name)) {
      continue;
    }

    insertSource.run(
      toId("src", name),
      slugify(name),
      name,
      "dataset",
      0.65,
      "mixed",
      "Seeded from legacy WarWatch reference material.",
      "approved"
    );
  }

  const entities = [
    ["entity_iran", "iran", "Iran", "state", "Primary state actor and strike target."],
    ["entity_us", "united-states", "United States", "state", "Primary military actor."],
    ["entity_israel", "israel", "Israel", "state", "Primary military actor and public target."],
    ["entity_hezbollah", "hezbollah", "Hezbollah", "non_state", "Lebanon-based armed group."],
    ["entity_hormuz", "strait-of-hormuz", "Strait of Hormuz", "chokepoint", "Critical maritime chokepoint."],
    ["entity_pakistan", "pakistan", "Pakistan", "state", "Named broker in the ceasefire track."],
    ["entity_lebanon", "lebanon", "Lebanon", "state", "Secondary theater with major escalatory risk."]
  ] as const;

  for (const [id, slug, name, kind, summary] of entities) {
    insertEntity.run(id, slug, name, kind, summary);
  }

  const relationships = [
    ["entity_us", "entity_iran", "targets", "confirmed", "US-led strikes targeted Iranian assets."],
    ["entity_israel", "entity_lebanon", "operates_in", "reported", "Israel expanded military operations in Lebanon."],
    ["entity_iran", "entity_hormuz", "constrains", "reported", "Iranian military leverage constrains shipping in Hormuz."],
    ["entity_pakistan", "entity_iran", "brokers", "reported", "Pakistan is described as a broker in the ceasefire process."],
    ["entity_hezbollah", "entity_israel", "targets", "reported", "Hezbollah rocket fire targets northern Israel."]
  ] as const;

  for (const [fromId, targetId, relationType, confidence, note] of relationships) {
    insertRelationship.run(
      toId("rel", `${fromId}:${targetId}:${relationType}`),
      fromId,
      targetId,
      relationType,
      confidence,
      note
    );
  }

  const claims = [
    {
      title: "Threat Level",
      statement: data.THREAT_LEVEL?.description ?? "Critical threat environment.",
      status: data.THREAT_LEVEL?.label ?? "CRITICAL",
      significance: "critical" as Significance,
      confidence: "reported" as Confidence,
      evidence: ["legacy:v3:kpi", "blueprint:gap-analysis"],
      reviewState: "pending"
    },
    {
      title: "Ceasefire / Deadline Status",
      statement: data.DEADLINE?.ceasefireViolations ?? data.DEADLINE?.threatDesc ?? "",
      status: data.DEADLINE?.negotiationStatus ?? "Legacy ceasefire assessment",
      significance: "critical" as Significance,
      confidence: "reported" as Confidence,
      evidence: ["legacy:v3:deadline"],
      reviewState: "pending"
    },
    {
      title: "Negotiation Track",
      statement: data.NEGOTIATION?.summary ?? "Negotiation track requires live verification.",
      status: data.NEGOTIATION?.status ?? "Monitoring",
      significance: "high" as Significance,
      confidence: "reported" as Confidence,
      evidence: ["legacy:v3:negotiation"],
      reviewState: "approved"
    }
  ];

  for (const claim of claims) {
    const claimId = toId("claim", claim.title);
    insertClaim.run(
      claimId,
      claim.title,
      claim.statement,
      claim.status,
      claim.significance,
      claim.confidence,
      json(claim.evidence),
      claim.reviewState,
      claim.reviewState === "approved" ? now : null
    );
  }

  for (const front of data.FRONTS ?? []) {
    insertStory.run(
      toId("story", `front:${front.name}`),
      slugify(`front-${front.name}`),
      front.name,
      "front",
      front.status,
      `${front.summary}\n\n${front.keyFact}`,
      front.level === "critical" ? "critical" : front.level === "high" ? "high" : "medium",
      "Legacy V3 fronts deck",
      "approved",
      json({ icon: front.icon, lastUpdate: front.lastUpdate, keyFact: front.keyFact })
    );
  }

  for (const indicator of data.INDICATORS ?? []) {
    insertStory.run(
      toId("story", `indicator:${indicator.name}`),
      slugify(`indicator-${indicator.name}`),
      indicator.name,
      "indicator",
      indicator.status,
      indicator.desc,
      indicator.statusColor === "danger"
        ? "critical"
        : indicator.statusColor === "warning"
          ? "high"
          : "medium",
      indicator.source,
      "approved",
      json({ icon: indicator.icon, link: indicator.link, hasWidget: Boolean(indicator.hasWidget) })
    );
  }

  for (const achievement of data.IRAN_ACHIEVEMENTS ?? []) {
    insertStory.run(
      toId("story", `achievement:${achievement.category}`),
      slugify(`achievement-${achievement.category}`),
      achievement.category,
      "achievement",
      achievement.significance,
      achievement.detail,
      achievement.significance.toLowerCase() === "critical" ? "critical" : "high",
      achievement.source,
      "approved",
      json({})
    );
  }

  for (const event of data.WAR_TIMELINE ?? []) {
    insertEvent.run(
      toId("event", `${event.date}:${event.title}`),
      event.date,
      event.time ?? null,
      event.title,
      event.detail,
      event.category,
      event.significance,
      "reported",
      event.source.includes("/") ? 2 : 1,
      event.source,
      json(
        event.source
          .split("/")
          .map((value: string) => value.trim())
          .filter(Boolean)
      ),
      "approved",
      "primary",
      null,
      json([event.category]),
      `${event.date}T00:00:00.000Z`
    );
  }

  const asOf = data.CASUALTIES?.asOf ?? "2026-04-09";
  const insertMetricRow = (
    metricKey: string,
    value: number | null,
    valueText: string | null,
    unit: string | null,
    sourceText: string,
    meta: Record<string, unknown> = {}
  ) => {
    insertMetric.run(
      toId("metric", `${metricKey}:${asOf}`),
      metricKey,
      value,
      valueText,
      unit,
      `${asOf}T00:00:00.000Z`,
      sourceText,
      "reported",
      "approved",
      "stale_seed",
      json(meta)
    );
  };

  insertMetricRow("threat_level", null, data.THREAT_LEVEL?.label ?? "CRITICAL", null, "Legacy V3 top-line threat");
  insertMetricRow("total_strikes", parseNumber(data.KPI?.totalStrikes), data.KPI?.totalStrikes ?? null, "strikes", "Legacy V3 KPI");
  insertMetricRow("oil_brent", 109, data.KPI?.oilPrice ?? null, "usd_per_barrel", "Legacy V3 KPI");
  insertMetricRow("hormuz_daily_cap", 15, data.KPI?.hormuzStatus ?? null, "ships_per_day", "Legacy V3 KPI");
  insertMetricRow("active_csg", Number(data.KPI?.activeCSGs ?? 0), String(data.KPI?.activeCSGs ?? ""), "groups", "Legacy V3 KPI");
  insertMetricRow("war_cost_billion_usd", 28, data.KPI?.warCost ?? null, "billion_usd", "Legacy V3 KPI");
  insertMetricRow("iran_casualties_estimate", 21000, data.KPI?.casualtiesTotal ?? null, "people", "Legacy V3 KPI");
  insertMetricRow("iran_internet_pct", 1, data.KPI?.iranInternet ?? null, "percent", "Legacy V3 KPI");
  insertMetricRow("us_equipment_loss_low_musd", Number(data.US_LOSSES?.totalEquipmentCost?.low ?? 0), null, "million_usd", "Legacy V3 losses");
  insertMetricRow("us_equipment_loss_high_musd", Number(data.US_LOSSES?.totalEquipmentCost?.high ?? 0), null, "million_usd", "Legacy V3 losses");

  for (const scenario of data.SCENARIOS ?? []) {
    insertMetricRow(
      `scenario_${String(scenario.id).toLowerCase()}_pct`,
      Number(scenario.probability),
      `${scenario.probability}%`,
      "percent",
      "Legacy V3 scenario deck",
      { name: scenario.name, nickname: scenario.nickname }
    );
  }

  const eventCounts = new Map<string, { total: number; us: number; iran: number; diplomacy: number }>();
  for (const event of data.WAR_TIMELINE ?? []) {
    const bucket = eventCounts.get(event.date) ?? { total: 0, us: 0, iran: 0, diplomacy: 0 };
    bucket.total += 1;
    if (event.category === "us_strike") {
      bucket.us += 1;
    }
    if (event.category === "iran_strike") {
      bucket.iran += 1;
    }
    if (event.category === "diplomatic") {
      bucket.diplomacy += 1;
    }
    eventCounts.set(event.date, bucket);
  }

  for (const [date, bucket] of eventCounts.entries()) {
    const timestamp = `${date}T00:00:00.000Z`;
    const rows = [
      ["daily_event_volume", bucket.total],
      ["daily_us_strike_volume", bucket.us],
      ["daily_iran_strike_volume", bucket.iran],
      ["daily_diplomatic_volume", bucket.diplomacy]
    ] as const;

    for (const [metricKey, value] of rows) {
      insertMetric.run(
        toId("metric", `${metricKey}:${date}`),
        metricKey,
        value,
        String(value),
        "events",
        timestamp,
        "Derived from legacy timeline",
        "reported",
        "approved",
        "historical_seed",
        json({})
      );
    }
  }

  const mapLayers = [
    ["country_attacks", data.COUNTRY_ATTACKS ?? [], "country"],
    ["nuclear_sites", data.NUCLEAR_SITES ?? [], "site"],
    ["iran_bases", data.IRAN_BASES ?? [], "base"],
    ["us_bases", data.US_BASES ?? [], "base"],
    ["oil_infra", data.OIL_INFRA ?? [], "infrastructure"]
  ] as const;

  for (const [layerKey, features, kind] of mapLayers) {
    for (const feature of features) {
      const lat = Number(feature.lat ?? feature.latitude);
      const lon = Number(feature.lon ?? feature.lng ?? feature.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        continue;
      }

      insertMapFeature.run(
        toId("map", `${layerKey}:${feature.name ?? feature.country ?? feature.site ?? `${lat}:${lon}`}`),
        layerKey,
        feature.name ?? feature.country ?? feature.site ?? "Untitled feature",
        kind,
        lat,
        lon,
        String(feature.level ?? feature.status ?? "monitoring"),
        String(feature.status ?? feature.totalMunitions ?? "Seeded"),
        feature.source ?? "Legacy V3 map layer",
        "approved",
        json(feature)
      );
    }
  }

  const briefingDate = "2026-04-20";
  const briefingBody = [
    "SITUATION",
    `Legacy WarWatch V3 data remains anchored around ${asOf}, while the blueprint identifies the current product gap as stale data, no review queue, and no server-side ingestion.`,
    "",
    "ENEMY",
    "Public-facing truth cannot rely on unreviewed critical claims. The main strategic risk is stale but visually authoritative information.",
    "",
    "FRIENDLY",
    "WarWatch V4 now seeds its first command-center spine from the extracted legacy bundle and routes critical claims into operator review rather than silent publication.",
    "",
    "ASSESSMENT",
    "The first release should favor verified shells, explicit freshness labels, and operator review over false precision.",
    "",
    "OUTLOOK",
    "Next leverage is ingestion, live verification, and daily heartbeat reporting."
  ].join("\n");

  insertBriefing.run(
    toId("brief", briefingDate),
    briefingDate,
    "WarWatch Launch SITREP",
    briefingBody,
    json(["legacy:v3", "blueprint:v4"]),
    "approved",
    "published",
    now
  );

  const queuedClaims = [
    {
      itemType: "claim",
      title: "Legacy ceasefire status requires revalidation",
      itemId: toId("claim", "Ceasefire / Deadline Status"),
      reason: "Critical public claim imported from V3 is stale and must be revalidated before promotion."
    },
    {
      itemType: "claim",
      title: "Threat level banner requires live review",
      itemId: toId("claim", "Threat Level"),
      reason: "Critical top-line state cannot remain legacy-only."
    },
    {
      itemType: "briefing",
      title: "First live SITREP needs current-source refresh",
      itemId: toId("brief", briefingDate),
      reason: "The seeded briefing is a launch artifact and should be replaced by current-source generation."
    }
  ];

  for (const item of queuedClaims) {
    const queueId = toId("queue", `${item.itemType}:${item.itemId}`);
    insertQueue.run(
      queueId,
      item.itemType,
      item.itemId,
      item.title,
      "critical",
      item.reason,
      "pending",
      now,
      now,
      json({ seeded: true })
    );
  }

  insertMetric.run(
    toId("metric", `conflict_day:${now}`),
    "conflict_day",
    Math.floor((Date.now() - Date.parse(CONFLICT_START_ISO)) / 86_400_000) + 1,
    null,
    "days",
    now,
    "Calculated from conflict start timestamp",
    "confirmed",
    "approved",
    "live",
    json({})
  );

  insertSource.run(
    toId("src", "WarWatch Blueprint"),
    "warwatch-blueprint",
    "WarWatch Blueprint",
    "analysis",
    0.8,
    "internal",
    blueprint.slice(0, 160),
    "approved"
  );

  const blueprintEventDate = "2026-04-20";
  insertEvent.run(
    toId("event", `${blueprintEventDate}:WarWatch V4 blueprint finalized`),
    blueprintEventDate,
    null,
    "WarWatch V4 blueprint finalized",
    "Blueprint established the rebuild scope: fullstack app, SQLite, ingestion, review queue, and mobile-capable public shell.",
    "project",
    "high",
    "confirmed",
    1,
    "WarWatch Blueprint",
    json(["warwatch-blueprint"]),
    "approved",
    "secondary",
    null,
    json(["product", "governance"]),
    `${blueprintEventDate}T00:00:00.000Z`
  );
}

export function classifyFeedEvent(text: string): {
  category: string;
  significance: Significance;
} {
  const normalized = text.toLowerCase();

  if (/(ceasefire|talks|negotiation|summit|accord|brokered|deadline)/.test(normalized)) {
    return {
      category: "diplomatic",
      significance: /(collapse|walks out|breakdown)/.test(normalized) ? "critical" : "high"
    };
  }

  if (/(missile|strike|bomb|drone|air raid|rocket|shelling)/.test(normalized)) {
    return {
      category: normalized.includes("iran") ? "iran_strike" : "us_strike",
      significance: /(capital|nuclear|carrier|embassy|killed|major)/.test(normalized)
        ? "critical"
        : "high"
    };
  }

  if (/(oil|hormuz|shipping|tanker|lng|pipeline|refinery)/.test(normalized)) {
    return {
      category: "economic",
      significance: /(closure|halt|surge|record)/.test(normalized) ? "high" : "medium"
    };
  }

  if (/(cyber|jamming|internet|gps|satellite|network)/.test(normalized)) {
    return {
      category: "cyber",
      significance: "medium"
    };
  }

  return {
    category: "intel",
    significance: "medium"
  };
}

export function earthquakeSignificance(magnitude: number): Significance {
  return inferSignificanceFromMagnitude(magnitude);
}
