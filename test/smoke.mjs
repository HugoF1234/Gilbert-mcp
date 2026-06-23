#!/usr/bin/env node
/**
 * Smoke test : démarre le serveur compilé (dist/index.js) via stdio, fait le
 * handshake MCP et vérifie que les 5 tools attendus sont exposés et annotés
 * en lecture seule. N'appelle PAS l'API Gilbert (pas de réseau requis).
 *
 * Exit code 0 = OK, 1 = échec (utilisé tel quel par la CI).
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const EXPECTED = [
  "list_meetings",
  "get_meeting",
  "get_transcript",
  "get_summary",
  "search_meetings",
];

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  // Clé factice : valide le format glbrt_ sans jamais toucher l'API (tools/list
  // n'effectue aucun appel réseau).
  env: { ...process.env, GILBERT_API_KEY: "glbrt_live_smoketest" },
});

const client = new Client({ name: "gilbert-mcp-smoke", version: "1.0.0" });

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
};

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();

  if (JSON.stringify(names) !== JSON.stringify([...EXPECTED].sort())) {
    fail(`Tools inattendus. Attendu ${EXPECTED.join(", ")} — reçu ${names.join(", ")}`);
  } else {
    console.log(`✅ ${tools.length} tools exposés : ${names.join(", ")}`);
  }

  for (const t of tools) {
    if (t.annotations?.readOnlyHint !== true) {
      fail(`Tool ${t.name} : readOnlyHint manquant ou faux`);
    }
  }

  if (process.exitCode !== 1) console.log("✅ Tous les tools sont annotés readOnly.");
} catch (err) {
  fail(`Exception : ${err?.message ?? err}`);
} finally {
  await client.close().catch(() => {});
}
