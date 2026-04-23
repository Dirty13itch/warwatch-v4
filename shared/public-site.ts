export const publicSiteSurfaces = [
  { id: "preview", label: "Home", path: "/" },
  { id: "command", label: "Command", path: "/command" },
  { id: "timeline", label: "Timeline", path: "/timeline" },
  { id: "dossiers", label: "Dossiers", path: "/dossiers" },
  { id: "signals", label: "Signals", path: "/signals" },
  { id: "briefings", label: "Briefings", path: "/briefings" },
  { id: "operator", label: "Operator", path: "/operator" }
] as const;

export type PublicSiteSurface = (typeof publicSiteSurfaces)[number]["id"];

export type PublicPageMetaTemplate = {
  title: string;
  description: string;
  robots: string;
};

const publicPageMetaByPath: Record<string, PublicPageMetaTemplate> = {
  "/": {
    title: "WarWatch | Public briefing website for the Iran conflict",
    description:
      "Public briefing website for the Iran conflict with review-gated claims, daily SITREPs, dossiers, timeline context, and live signals.",
    robots: "index,follow"
  },
  "/command": {
    title: "Command | WarWatch",
    description: "Operational command surface over the public WarWatch runtime.",
    robots: "index,follow"
  },
  "/timeline": {
    title: "Timeline | WarWatch",
    description: "Filterable public timeline with corroboration, significance, and source-linked context.",
    robots: "index,follow"
  },
  "/dossiers": {
    title: "Dossiers | WarWatch",
    description: "Canonical actor dossiers and claim graph for the public WarWatch site.",
    robots: "index,follow"
  },
  "/signals": {
    title: "Signals | WarWatch",
    description: "Live market pressure, source posture, and signals shaping the public conflict picture.",
    robots: "index,follow"
  },
  "/briefings": {
    title: "Briefings | WarWatch",
    description: "Daily SITREPs and briefing archive with operator-reviewed public context.",
    robots: "index,follow"
  },
  "/operator": {
    title: "Operator | WarWatch",
    description: "Operator review controls, synthesis lane, and ingestion oversight.",
    robots: "noindex,nofollow"
  }
};

export const publicSitemapRoutes = publicSiteSurfaces
  .filter((surface) => surface.id !== "operator")
  .map((surface) => surface.path);

export function normalizePublicPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function getBasePublicPageMeta(pathname: string): PublicPageMetaTemplate {
  return publicPageMetaByPath[normalizePublicPath(pathname)] ?? publicPageMetaByPath["/"];
}
