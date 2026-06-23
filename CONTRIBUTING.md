# Contribuer à gilbert-mcp

## Pré-requis

- Node.js ≥ 18
- Une clé API Gilbert (`glbrt_live_...`) pour les tests manuels avec l'API réelle

## Boucle de dev

```bash
npm install
npm run dev          # exécute src/index.ts via tsx (stdio)
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write
npm test             # build + smoke test (handshake MCP + tools/list, sans réseau)
```

### Tester avec un client réel

```bash
# Avec l'inspecteur MCP officiel (UI dans le navigateur) :
GILBERT_API_KEY=glbrt_live_xxx npx @modelcontextprotocol/inspector node dist/index.js
```

## Avant d'ouvrir une PR

1. `npm run format` (le check est bloquant en CI).
2. `npm run typecheck` doit passer.
3. `npm test` doit passer.

## Processus de release

La publication (npm + registre MCP) est automatisée par
`.github/workflows/publish.yml`, déclenchée à la **publication d'une release
GitHub**. Étapes :

1. Bumper la version aux **trois** endroits (elles doivent rester identiques) :
   - `package.json` → `version`
   - `server.json` → `version` **et** `packages[0].version`
2. `npm install` pour mettre à jour `package-lock.json`, commit.
3. Créer un tag `vX.Y.Z` et une **release GitHub** correspondante.
4. Le workflow publie sur npm (avec provenance) puis sur le registre MCP via
   OIDC GitHub (aucun secret à gérer pour le registre).

> Secret requis pour npm : `NPM_TOKEN` (token d'automation npm) dans les secrets
> du repo. Le registre MCP utilise l'OIDC GitHub — rien à configurer.

## Style

- TypeScript strict (cf. `tsconfig.json`), pas de `any` non justifié.
- Prettier (`.prettierrc.json`) fait foi pour le formatage.
- Les tools restent **en lecture seule** : toute évolution mutant des données
  doit être discutée (impact sécurité + revue des catalogues).
