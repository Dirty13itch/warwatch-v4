FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4311
ENV WARWATCH_DB_PATH=/app/data/warwatch.sqlite

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/legacy ./legacy
COPY --from=build /app/docs/reference ./docs/reference

RUN mkdir -p /app/data

EXPOSE 4311

CMD ["node", "dist/server/server/index.js"]
