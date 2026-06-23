#!/usr/bin/env node
/**
 * Gilbert MCP Server
 *
 * Expose les données Gilbert (réunions, transcriptions, synthèses) aux clients
 * compatibles Model Context Protocol : Claude Desktop, Claude Code, Cursor,
 * VS Code, Zed, Continue, etc.
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
 *       "args": ["-y", "gilbert-mcp"],
 *       "env": { "GILBERT_API_KEY": "glbrt_live_XXX" }
 *     }
 *   }
 * }
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ────────────────────────────────────────────────────────

// Version unique : lue depuis package.json à l'exécution (évite toute dérive
// entre le numéro déclaré ici et celui publié sur npm / le registre MCP).
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as {
  version: string;
};
const VERSION = pkg.version;

const API_KEY = process.env.GILBERT_API_KEY;
const BASE_URL = process.env.GILBERT_BASE_URL || "https://gilbert-assistant.ovh/api/v1";

// Timeout et retry réseau : sans ça, une API qui pend bloque le client MCP
// indéfiniment. On retente une fois sur erreur réseau / 5xx (idempotent : tous
// les tools sont en lecture seule).
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_RETRIES = 1;

if (!API_KEY || !API_KEY.startsWith("glbrt_")) {
  console.error(
    "[gilbert-mcp] ❌ GILBERT_API_KEY manquante ou invalide (format attendu : glbrt_live_...). " +
      "Configurez la variable d'environnement.",
  );
  process.exit(1);
}

// ─── Client HTTP Gilbert ────────────────────────────────────────────────────

async function gilbertFetch(path: string, params?: Record<string, unknown>): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "User-Agent": `gilbert-mcp/${VERSION}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      // 5xx → on retente (l'API peut être momentanément indisponible).
      if (res.status >= 500 && attempt < FETCH_RETRIES) {
        lastError = new Error(`Gilbert API ${res.status} (tentative ${attempt + 1})`);
        continue;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gilbert API ${res.status}: ${body.slice(0, 500)}`);
      }
      return (await res.json()) as unknown;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const isAbort = err instanceof Error && err.name === "AbortError";
      // Timeout ou erreur réseau transitoire → on retente une fois.
      if (attempt < FETCH_RETRIES && (isAbort || err instanceof TypeError)) continue;
      throw err;
    }
  }
  throw lastError ?? new Error("Gilbert API: échec inconnu");
}

function asTextResult(data: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

// ─── Serveur MCP ────────────────────────────────────────────────────────────

const server = new McpServer({ name: "gilbert", version: VERSION });

// Tous les tools sont en LECTURE SEULE et interrogent une API externe :
// readOnlyHint = true (aucune mutation), openWorldHint = true (appel réseau).
// Ces annotations sont lues par les clients et les revues de sécurité des
// catalogues pour classer le niveau de risque du connecteur.
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const;

server.registerTool(
  "list_meetings",
  {
    title: "Lister les réunions",
    description:
      "Liste les réunions de l'utilisateur. Pagination et filtres par statut et date. " +
      "Utile pour répondre à « quelles sont mes réunions récentes ? » ou « liste les réunions du mois dernier ».",
    inputSchema: {
      status: z
        .enum(["pending", "processing", "completed", "error"])
        .optional()
        .describe("Filtrer par statut de transcription"),
      from: z
        .string()
        .optional()
        .describe("Date ISO 8601 (ex: 2026-01-01) — borne inférieure sur created_at"),
      to: z.string().optional().describe("Date ISO 8601 — borne supérieure sur created_at"),
      page: z.number().int().min(1).default(1).describe("Numéro de page (défaut 1)"),
      per_page: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(25)
        .describe("Éléments par page (1–100, défaut 25)"),
    },
    annotations: READ_ONLY,
  },
  async (args) => asTextResult(await gilbertFetch("/meetings", args)),
);

server.registerTool(
  "get_meeting",
  {
    title: "Détail d'une réunion",
    description:
      "Récupère le détail complet d'une réunion : metadata + transcription + synthèse. " +
      "Utile quand l'utilisateur veut résumer une réunion spécifique.",
    inputSchema: {
      meeting_id: z.string().min(1).describe("UUID de la réunion"),
    },
    annotations: READ_ONLY,
  },
  async ({ meeting_id }) =>
    asTextResult(await gilbertFetch(`/meetings/${encodeURIComponent(meeting_id)}`)),
);

server.registerTool(
  "get_transcript",
  {
    title: "Transcription d'une réunion",
    description:
      "Récupère uniquement la transcription texte d'une réunion (plus léger que get_meeting). " +
      "Format « Speaker 0: ...\\nSpeaker 1: ... ».",
    inputSchema: {
      meeting_id: z.string().min(1).describe("UUID de la réunion"),
    },
    annotations: READ_ONLY,
  },
  async ({ meeting_id }) =>
    asTextResult(await gilbertFetch(`/meetings/${encodeURIComponent(meeting_id)}/transcript`)),
);

server.registerTool(
  "get_summary",
  {
    title: "Synthèse d'une réunion",
    description: "Récupère la synthèse markdown d'une réunion (plus léger que get_meeting).",
    inputSchema: {
      meeting_id: z.string().min(1).describe("UUID de la réunion"),
    },
    annotations: READ_ONLY,
  },
  async ({ meeting_id }) =>
    asTextResult(await gilbertFetch(`/meetings/${encodeURIComponent(meeting_id)}/summary`)),
);

server.registerTool(
  "search_meetings",
  {
    title: "Rechercher dans les réunions",
    description:
      "Recherche full-text dans les titres, transcriptions et synthèses de l'utilisateur. " +
      "Utile pour « trouve-moi la réunion où on a parlé de X ».",
    inputSchema: {
      q: z.string().min(1).describe("Expression de recherche (mots-clés)"),
      page: z.number().int().min(1).default(1).describe("Numéro de page (défaut 1)"),
      per_page: z
        .number()
        .int()
        .min(1)
        .max(25)
        .default(10)
        .describe("Éléments par page (1–25, défaut 10)"),
    },
    annotations: READ_ONLY,
  },
  async (args) => asTextResult(await gilbertFetch("/meetings/search", args)),
);

server.registerTool(
  "list_folders",
  {
    title: "Lister les dossiers",
    description:
      "Lister les dossiers de l'utilisateur (nom + nombre de réunions). " +
      "Sert à résoudre un dossier par son nom avant d'en résumer le contenu, " +
      "ex: « résume mon dossier Kick-off » → list_folders puis get_folder_meetings. " +
      "Les dossiers partagés ne sont inclus que si la clé porte le scope shared:read.",
    inputSchema: {},
    annotations: READ_ONLY,
  },
  async () => asTextResult(await gilbertFetch("/folders")),
);

server.registerTool(
  "get_folder_meetings",
  {
    title: "Réunions d'un dossier",
    description:
      "Lister les réunions d'un dossier (et de ses sous-dossiers). " +
      "À combiner avec get_summary/get_transcript pour résumer un dossier entier.",
    inputSchema: {
      folder_id: z.string().min(1).describe("UUID du dossier (obtenu via list_folders)"),
    },
    annotations: READ_ONLY,
  },
  async ({ folder_id }) =>
    asTextResult(await gilbertFetch(`/folders/${encodeURIComponent(folder_id)}/meetings`)),
);

// ─── Démarrage ──────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[gilbert-mcp] v${VERSION} running (stdio). Base URL: ${BASE_URL}`);
