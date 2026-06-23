# Image du serveur MCP Gilbert (transport stdio).
# Build :  docker build -t gilbert-mcp .
# Run  :   docker run --rm -i -e GILBERT_API_KEY=glbrt_live_xxx gilbert-mcp
#
# Le serveur communique sur stdin/stdout (stdio) — d'où `-i` (interactif) et
# l'absence de port exposé.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Exécution non-root.
USER node
ENTRYPOINT ["node", "dist/index.js"]
