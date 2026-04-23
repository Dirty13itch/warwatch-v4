import type { OperatorMetricPublishInput, TopLineMetricKey } from "./types.js";

export interface TopLineMetricDefinition {
  key: TopLineMetricKey;
  label: string;
  supportingText: string;
  unit: string | null;
  operatorPrompt: string;
  valuePlaceholder: string;
  sourcePlaceholder: string;
  holdValueText: string;
  holdSourceText: string;
  holdNote: string;
  holdSupportingText: string;
}

export const topLineMetricDefinitions: TopLineMetricDefinition[] = [
  {
    key: "total_strikes",
    label: "Total strikes",
    supportingText: "Seeded from legacy verified top-line data",
    unit: "strikes",
    operatorPrompt: "Publish a reviewed cumulative strike estimate when the monitored total changes.",
    valuePlaceholder: ">13,400",
    sourcePlaceholder: "CENTCOM / Reuters / operator review",
    holdValueText: "Awaiting reviewed cumulative strike total",
    holdSourceText: "Operator reviewed hold / no defensible cumulative strike total in the live feed lane",
    holdNote: "Current live coverage provides strike context but not a defensible cumulative total for public publication.",
    holdSupportingText: "Operator-reviewed hold while cumulative strike evidence remains insufficient for safe publication."
  },
  {
    key: "oil_brent",
    label: "Brent marker",
    supportingText: "Public top-line is freshness-labeled until live economic ingest is active",
    unit: "usd_per_barrel",
    operatorPrompt: "Use this only if the live market lane needs a reviewed override.",
    valuePlaceholder: "$102.01",
    sourcePlaceholder: "Yahoo Finance / operator review",
    holdValueText: "Awaiting reviewed Brent marker",
    holdSourceText: "Operator reviewed hold / live market marker temporarily unavailable",
    holdNote: "Use only if the live market lane is unavailable and the public shell needs an explicit reviewed hold state.",
    holdSupportingText: "Operator-reviewed hold while the live Brent marker is unavailable."
  },
  {
    key: "hormuz_daily_cap",
    label: "Hormuz throughput cap",
    supportingText: "Current public shell exposes the operating assumption and freshness state",
    unit: "ships_per_day",
    operatorPrompt: "Publish a reviewed shipping-cap estimate when corridor conditions materially change.",
    valuePlaceholder: "<=15/day",
    sourcePlaceholder: "Kpler / Lloyd's List / operator review",
    holdValueText: "Awaiting reviewed Hormuz throughput cap",
    holdSourceText: "Operator reviewed hold / no defensible current Hormuz throughput cap in the live feed lane",
    holdNote: "Current shipping coverage is directionally relevant, but it does not yet support a defensible public throughput cap.",
    holdSupportingText: "Operator-reviewed hold while current Hormuz throughput evidence remains insufficient for safe publication."
  },
  {
    key: "iran_casualties_estimate",
    label: "Iran casualty estimate",
    supportingText: "Carries forward the legacy estimate until revalidated",
    unit: "people",
    operatorPrompt: "Publish a reviewed casualty estimate only when the evidence base is defensible.",
    valuePlaceholder: "21,500+ Iran alone",
    sourcePlaceholder: "ISW / Reuters / operator review",
    holdValueText: "Awaiting reviewed Iran casualty estimate",
    holdSourceText: "Operator reviewed hold / no defensible current Iran casualty estimate in the live feed lane",
    holdNote: "Current live coverage does not yet support a defensible public casualty estimate for Iran.",
    holdSupportingText: "Operator-reviewed hold while current casualty evidence remains insufficient for safe publication."
  }
];

export function isTopLineMetricKey(value: string): value is TopLineMetricKey {
  return topLineMetricDefinitions.some((definition) => definition.key === value);
}

export function getTopLineMetricDefinition(key: TopLineMetricKey): TopLineMetricDefinition {
  return topLineMetricDefinitions.find((definition) => definition.key === key) ?? topLineMetricDefinitions[0];
}

export function buildTopLineHoldInput(key: TopLineMetricKey): OperatorMetricPublishInput {
  const definition = getTopLineMetricDefinition(key);
  return {
    mode: "hold",
    value: null,
    valueText: definition.holdValueText,
    sourceText: definition.holdSourceText,
    confidence: "reported",
    note: definition.holdNote
  };
}
