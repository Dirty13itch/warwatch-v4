# Deployment

## Primary Target
WarWatch now targets a Docker-backed Render web service with a persistent disk mounted at `/app/data`.

That choice is deliberate:
- Express plus SQLite needs a single-instance runtime with honest persistent local storage.
- Render supports Docker web services, a public URL, health checks, and persistent disks on paid web services.
- The disk mount keeps `WARWATCH_DB_PATH=/app/data/warwatch.sqlite` stable across restarts and redeploys.

## Repo Artifacts
- Blueprint: `render.yaml`
- Container image recipe: `Dockerfile`
- Runtime env example: `.env.example`

## First Deploy
1. Push the repo state you want to deploy.
2. Create the Render service from `render.yaml` or point Render at this repo and let the Blueprint manage the service.
3. Let Render generate `OPERATOR_API_KEY`.
4. After the first deploy, set `PUBLIC_BASE_URL` to the actual service URL:
   - initial form: `https://<service>.onrender.com`
   - later: replace with the real custom domain when one exists
5. Redeploy after `PUBLIC_BASE_URL` is set so canonical/OG/meta URLs become live-real instead of placeholder-local.

## Runtime Contract
- Disk mount: `/app/data`
- SQLite path: `/app/data/warwatch.sqlite`
- Scheduler: enabled in the web process for now
- Operator writes: key-required in public/production mode
- Health check: `/api/health`

## Operational Notes
- Persistent disks on Render are single-instance. This service should stay at `numInstances: 1`.
- Disk-backed services do not get zero-downtime deploys. Expect a brief restart window during deploys.
- The repo-local verification contract is still:
  - `npm run verify`
  - `npm run heartbeat`
  - `npm run preview:shots`

## Validation
- If Render CLI is available: `render blueprints validate render.yaml`
- If Render CLI is not available locally, Render Dashboard blueprint validation is the remaining validation path.
