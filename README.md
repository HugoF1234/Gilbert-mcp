# gilbert-mcp

Serveur **Model Context Protocol** (MCP) officiel de Gilbert.

Permet à Claude Desktop, Cursor, Continue, Zed et tous les clients compatibles MCP
d'accéder aux réunions, transcriptions et synthèses Gilbert d'un utilisateur.

## Installation rapide

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

### Cursor

Dans `Settings > Features > Model Context Protocol > Add MCP Server` :

```json
{
  "name": "gilbert",
  "command": "npx",
  "args": ["-y", "gilbert-mcp"],
  "env": {
    "GILBERT_API_KEY": "glbrt_live_XXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

## Obtenir une clé API

Contactez votre administrateur Gilbert pour qu'il génère une clé depuis la console admin.
Scope minimum requis : `meetings:read`.

## Tools exposés

| Tool | Description |
| --- | --- |
| `list_meetings` | Liste paginée, filtres par statut/date |
| `get_meeting` | Détail complet d'une réunion |
| `get_transcript` | Transcription texte seule |
| `get_summary` | Synthèse markdown seule |
| `search_meetings` | Recherche full-text |

## Variables d'environnement

- `GILBERT_API_KEY` (requis) : clé au format `glbrt_live_...`
- `GILBERT_BASE_URL` (optionnel) : défaut `https://gilbert-assistant.ovh/api/v1`

## Développement local

```bash
git clone https://github.com/HugoF1234/Gilbert-mcp
cd Gilbert-mcp
npm install
GILBERT_API_KEY=glbrt_live_... npm run dev
```

## Licence

[MIT](./LICENSE) — © 2026 Lexia.

## Support

- Documentation API : <https://gilbert-assistant.ovh/api/v1/docs>
- Contact : contact@lexiapro.fr
