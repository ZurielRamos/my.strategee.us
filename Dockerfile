# ---- Build: Angular (app) -> api/app/www, NestJS (api) -> api/dist ----
FROM node:22-slim AS build
WORKDIR /srv

COPY app/package.json app/package-lock.json ./app/
RUN npm install --prefix app --no-audit --no-fund

COPY api/package.json ./api/
RUN npm install --prefix api --no-audit --no-fund

COPY app ./app
COPY api ./api
RUN npm run build --prefix app && npm run build --prefix api
RUN npm prune --omit=dev --prefix api

# ---- Runtime ----
FROM node:22-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /srv/api
COPY --from=build /srv/api/node_modules ./node_modules
COPY --from=build /srv/api/dist ./dist
COPY --from=build /srv/api/app ./app
COPY --from=build /srv/api/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main"]
