# gilbert-mcp

[![CI](https://github.com/HugoF1234/Gilbert-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/HugoF1234/Gilbert-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/gilbert-mcp.svg)](https://www.npmjs.com/package/gilbert-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Serveur **Model Context Protocol** (MCP) officiel de Gilbert.

Permet à Claude Desktop, Claude Code, Cursor, VS Code, Zed, Continue et tous les
clients compatibles MCP d'accéder aux réunions, transcriptions et synthèses
Gilbert d'un utilisateur — **en lecture seule**.

## Installation rapide

Toutes les configs partagent la même commande : `npx -y gilbert-mcp` avec la
variable `GILBERT_API_KEY`.

### Claude Desktop

Éditez le fichier de configuration :

- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gilbert": {
      "command": "npx",
      "args": ["-y", "gilbert-mcp"],
      "env": {
        "GILBERT_API_KEY": "glbrt_live_XXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

Redémarrez Claude Desktop. Vous pouvez maintenant demander :

> « Liste mes réunions terminées cette semaine »
> « Résume-moi la réunion du 12 avril »
> « Trouve-moi la réunion où on a parlé de budget Q3 »

### Claude Code

```bash
claude mcp add gilbert --env GILBERT_API_KEY=glbrt_live_XXX -- npx -y gilbert-mcp
```

### Cursor

`Settings > Features > Model Context Protocol > Add MCP Server` :

```json
{
  "name": "gilbert",
  "command": "npx",
  "args": ["-y", "gilbert-mcp"],
  "env": { "GILBERT_API_KEY": "glbrt_live_XXXXXXXXXXXXXXXXXXXXXXXX" }
}
```

### VS Code

`.vscode/mcp.json` (ou la commande *MCP: Add Server*) :

```json
{
  "servers": {
    "gilbert": {
      "command": "npx",
      "args": ["-y", "gilbert-mcp"],
      "env": { "GILBERT_API_KEY": "glbrt_live_XXXXXXXXXXXXXXXXXXXXXXXX" }
    }
  }
}
```

### Zed

Dans `settings.json`, sous `context_servers` :

```json
{
  "context_servers": {
    "gilbert": {
      "command": { "path": "npx", "args": ["-y", "gilbert-mcp"], "env": { "GILBERT_API_KEY": "glbrt_live_XXX" } }
    }
  }
}
```

### Docker (alternative)

```bash
docker build -t gilbert-mcp .
docker run --rm -i -e GILBERT_API_KEY=glbrt_live_XXX gilbert-mcp
```

## Obtenir une clé API

Contactez votre administrateur Gilbert pour qu'il génère une clé depuis la
console admin. Scope minimum requis : `meetings:read` (lecture seule).

## Tools exposés

Tous les tools sont **en lecture seule** (`readOnlyHint`).

| Tool | Description |
| --- | --- |
| `list_meetings` | Liste paginée, filtres par statut/date |
| `get_meeting` | Détail complet d'une réunion (metadata + transcription + synthèse) |
| `get_transcript` | Transcription texte seule |
| `get_summary` | Synthèse markdown seule |
| `search_meetings` | Recherche full-text |

## Variables d'environnement

- `GILBERT_API_KEY` (requis) : clé au format `glbrt_live_...`
- `GILBERT_BASE_URL` (optionnel) : défaut `https://gilbert-assistant.ovh/api/v1`

## Confidentialité & sécurité

Ce serveur expose des transcriptions et synthèses de réunions (données
potentiellement sensibles). Il s'exécute **localement** en stdio, n'ouvre aucun
port entrant, ne journalise jamais la clé API et n'écrit aucune donnée de réunion
sur disque. Voir [SECURITY.md](./SECURITY.md).

## Développement

```bash
git clone https://github.com/HugoF1234/Gilbert-mcp
cd Gilbert-mcp
npm install
GILBERT_API_KEY=glbrt_live_... npm run dev   # stdio
npm test                                     # build + smoke test (handshake MCP)
```

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour le process de release et
[docs/SUBMISSION.md](./docs/SUBMISSION.md) pour le référencement dans les
catalogues.

## Licence

[MIT](./LICENSE) — © 2026 Lexia.

## Support

- Documentation API : <https://gilbert-assistant.ovh/api/v1/docs>
- Contact : contact@lexiapro.fr
