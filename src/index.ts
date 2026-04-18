#!/usr/bin/env node
/**
 * Gilbert MCP Server
 *
 * Expose les données Gilbert (réunions, transcriptions, synthèses) aux clients
 * compatibles Model Context Protocol : Claude Desktop, Cursor, Continue, etc.
 *
 * Variables d'environnement :
 *   GILBERT_API_KEY   (requis)  — Clé API au format glbrt_live_...
 *   GILBERT_BASE_URL  (optionnel, défaut https://gilbert-assistant.ovh/api/v1)
 *
 * Usage dans Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json) :
 * {
 *   "mcpServers": {
 *     "gilbert": {
 *       "command": "npx",
 *       "args": ["-y", "@gilbert/mcp"],
 *       "env": { "GILBERT_API_KEY": "glbrt_live_XXX" }
 *     }
 *   }
 * }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const API_KEY = process.env.GILBERT_API_KEY;
const BASE_URL = process.env.GILBERT_BASE_URL || "https://gilbert-assistant.ovh/api/v1";

if (!API_KEY || !API_KEY.startsWith("glbrt_")) {
  console.error("[gilbert-mcp] ❌ GILBERT_API_KEY manquante ou invalide. Configurez la variable d'environnement.");
  process.exit(1);
}

async function gilbertFetch(path: string, params?: Record<string, any>): Promise<any> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "User-Agent": "gilbert-mcp/1.0",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gilbert API ${res.status}: ${body.slice(0, 500)}`);
  }
  return res.json();
}

// ─── Tools schemas ──────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: "list_meetings",
    description:
      "Liste les réunions de l'utilisateur. Pagination et filtres par statut et date. " +
      "Utile pour répondre aux questions 'quelles sont mes réunions récentes ?' ou " +
      "'liste les réunions du mois dernier'.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "processing", "completed", "error"], description: "Filtrer par statut de transcription" },
        from: { type: "string", description: "Date ISO 8601 (ex: 2026-01-01) — borne inférieure sur created_at" },
        to: { type: "string", description: "Date ISO 8601 — borne supérieure" },
        page: { type: "number", default: 1, minimum: 1 },
        per_page: { type: "number", default: 25, minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "get_meeting",
    description:
      "Récupère le détail complet d'une réunion : metadata + transcription + synthèse. " +
      "Utile quand l'utilisateur veut résumer une réunion spécifique.",
    inputSchema: {
      type: "object",
      required: ["meeting_id"],
      properties: {
        meeting_id: { type: "string", description: "UUID de la réunion" },
      },
    },
  },
  {
    name: "get_transcript",
    description:
      "Récupère uniquement la transcription texte d'une réunion (plus léger que get_meeting). " +
      "Format 'Speaker 0: ...\\nSpeaker 1: ...'.",
    inputSchema: {
      type: "object",
      required: ["meeting_id"],
      properties: {
        meeting_id: { type: "string", description: "UUID de la réunion" },
      },
    },
  },
  {
    name: "get_summary",
    description: "Récupère la synthèse markdown d'une réunion (plus léger que get_meeting).",
    inputSchema: {
      type: "object",
      required: ["meeting_id"],
      properties: {
        meeting_id: { type: "string", description: "UUID de la réunion" },
      },
    },
  },
  {
    name: "search_meetings",
    description:
      "Recherche full-text dans les titres, transcriptions et synthèses de l'utilisateur. " +
      "Utile pour 'trouve-moi la réunion où on a parlé de X'.",
    inputSchema: {
      type: "object",
      required: ["q"],
      properties: {
        q: { type: "string", description: "Expression de recherche (mots-clés)" },
        page: { type: "number", default: 1 },
        per_page: { type: "number", default: 10, maximum: 25 },
      },
    },
  },
];

// ─── Server setup ───────────────────────────────────────────────────────────

const server = new Server(
  { name: "gilbert", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let result: any;
    switch (name) {
      case "list_meetings":
        result = await gilbertFetch("/meetings", args);
        break;
      case "get_meeting":
        result = await gilbertFetch(`/meetings/${args?.meeting_id}`);
        break;
      case "get_transcript":
        result = await gilbertFetch(`/meetings/${args?.meeting_id}/transcript`);
        break;
      case "get_summary":
        result = await gilbertFetch(`/meetings/${args?.meeting_id}/summary`);
        break;
      case "search_meetings":
        result = await gilbertFetch("/meetings/search", args);
        break;
      default:
        throw new Error(`Tool inconnu : ${name}`);
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: any) {
    return {
      content: [{ type: "text", text: `Erreur : ${err.message || err}` }],
      isError: true,
    };
  }
});

// Run
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[gilbert-mcp] Server running (stdio). Base URL:", BASE_URL);
