# Deployment

## Live Website
- Production URL: `https://warwatch-v4.vercel.app`
- Stable project alias: `https://warwatch-v4.vercel.app`
- Published repo: `https://github.com/Dirty13itch/warwatch-v4`
- Current production deploy path: `npx vercel deploy --prod --yes` from repo root

## Hosted Contract
WarWatch is live on Vercel as a deliberate `public_readonly` website lane.

That contract is honest:
- public data is served from the committed `data/public-snapshot.json`
- Vercel hosts the built Vite site plus a single function-backed public API fan-in route
- scheduler jobs do not run in hosted mode
- operator write workflows stay local and are intentionally unavailable in the hosted lane
- live public verification runs against the deployed site through `PUBLIC_BASE_URL`

## Repo Artifacts
- Vercel config: `vercel.json`
- Hosted mode env: `.env.hosted`
- Snapshot generator: `scripts/generate-public-snapshot.ts`
- Hosted static generator: `scripts/generate-static-site.ts`
- Hosted verification: `scripts/verify-hosted-static.ts`
- Runtime env example: `.env.example`

## Deploy / Redeploy
1. Refresh the committed public snapshot locally with `npm run snapshot:public`.
2. Verify locally with:
   - `npm run verify`
   - `npm run heartbeat`
   - `npm run preview:shots`
   - `PUBLIC_BASE_URL=https://warwatch-v4.vercel.app npm run preview:live`
3. Deploy preview with:
   - `npx vercel deploy --target preview --yes`
4. Deploy production with:
   - `npx vercel deploy --prod --yes`
5. Keep `PUBLIC_BASE_URL=https://warwatch-v4.vercel.app` in the Vercel production environment so canonical and OG metadata stay aligned with the stable alias.

## Live Preview Proof
- Local atlas: `reports/previews/latest/index.html`
- Live atlas: `reports/previews/live/latest/index.html`
- Drift report: `reports/previews/DIFF-LATEST.md`
- Generate live deployed screenshots with:
  - `PUBLIC_BASE_URL=https://warwatch-v4.vercel.app npm run preview:live`
- Compare local and live preview artifacts with:
  - `PUBLIC_BASE_URL=https://warwatch-v4.vercel.app npm run preview:compare`
- Open the latest live atlas with:
  - `npm run preview:open:live`

## Current Drift
- GitHub pushes are not currently creating fresh Vercel deployments for this project.
- Release truth is therefore the CLI production deploy path above until the Vercel Git integration is fixed.

## Mutable Runtime Boundary
The full Express + SQLite + scheduler runtime still exists locally and remains the honest mutable/operator lane. Moving that write-capable lane to hosted infrastructure is a future decision, not something Vercel is pretending to solve for free.
