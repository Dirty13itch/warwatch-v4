import type { TopLineMetricKey } from "./types.js";

export interface TopLineMetricDefinition {
  key: TopLineMetricKey;
  label: string;
  supportingText: string;
  unit: string | null;
  operatorPrompt: string;
  valuePlaceholder: string;
  sourcePlaceholder: string;
}

export const topLineMetricDefinitions: TopLineMetricDefinition[] = [
  {
    key: "total_strikes",
    label: "Total strikes",
    supportingText: "Seeded from legacy verified top-line data",
    unit: "strikes",
    operatorPrompt: "Publish a reviewed cumulative strike estimate when the monitored total changes.",
    valuePlaceholder: ">13,400",
    sourcePlaceholder: "CENTCOM / Reuters / operator review"
  },
  {
    key: "oil_brent",
    label: "Brent marker",
    supportingText: "Public top-line is freshness-labeled until live economic ingest is active",
    unit: "usd_per_barrel",
    operatorPrompt: "Use this only if the live market lane needs a reviewed override.",
    valuePlaceholder: "$102.01",
    sourcePlaceholder: "Yahoo Finance / operator review"
  },
  {
    key: "hormuz_daily_cap",
    label: "Hormuz throughput cap",
    supportingText: "Current public shell exposes the operating assumption and freshness state",
    unit: "ships_per_day",
    operatorPrompt: "Publish a reviewed shipping-cap estimate when corridor conditions materially change.",
    valuePlaceholder: "<=15/day",
    sourcePlaceholder: "Kpler / Lloyd's List / operator review"
  },
  {
    key: "iran_casualties_estimate",
    label: "Iran casualty estimate",
    supportingText: "Carries forward the legacy estimate until revalidated",
    unit: "people",
    operatorPrompt: "Publish a reviewed casualty estimate only when the evidence base is defensible.",
    valuePlaceholder: "21,500+ Iran alone",
    sourcePlaceholder: "ISW / Reuters / operator review"
  }
];

export function isTopLineMetricKey(value: string): value is TopLineMetricKey {
  return topLineMetricDefinitions.some((definition) => definition.key === value);
}

export function getTopLineMetricDefinition(key: TopLineMetricKey): TopLineMetricDefinition {
  return topLineMetricDefinitions.find((definition) => definition.key === key) ?? topLineMetricDefinitions[0];
}
