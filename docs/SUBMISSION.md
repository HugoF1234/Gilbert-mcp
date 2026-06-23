# Référencement de gilbert-mcp — checklist

Deux objectifs distincts. **La Piste A est faisable maintenant ; la Piste B
exige un serveur remote + OAuth (chantier séparé).**

---

## Piste A — Écosystème « outils développeur » (stdio)

Cible : Claude Desktop, Claude Code, Cursor, VS Code, Zed, Continue, Windsurf,
et le **registre MCP officiel**. Transport stdio + clé API = suffisant.

### État

- [x] Publié sur **npm** (`gilbert-mcp`)
- [x] Enregistré au **registre MCP officiel** (`io.github.HugoF1234/gilbert-mcp`)
- [x] `server.json` conforme au schéma officiel
- [x] Tools annotés `readOnlyHint` / `openWorldHint`
- [x] Validation des entrées (zod), timeout + retry réseau
- [x] Version unique (lue depuis `package.json`)
- [x] CI (build + typecheck + format + smoke test)
- [x] Publication automatisée (npm + registre via OIDC) sur release
- [x] `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE` (MIT)

### À faire (référencement communautaire — augmente l'adoption)

- [ ] PR dans [`punkpeye/awesome-mcp-servers`](https://github.com/punkpeye/awesome-mcp-servers)
- [ ] Soumettre sur **mcp.so**, **Glama**, **PulseMCP**, **Smithery**
- [ ] Vérifier l'apparition dans la galerie MCP de **VS Code** et le directory **Cursor**
- [ ] (Optionnel) Image **Docker/OCI** publiée sur GHCR + entrée `packages` OCI
      dans `server.json`

---

## Piste B — Catalogues *in-product* des chatbots (remote + OAuth)

Cible : directory de connecteurs **Claude.ai**, connecteurs **ChatGPT**,
connecteurs **Le Chat (Mistral)**. Ces catalogues sont **curés** et n'acceptent
**que des serveurs remote HTTP avec OAuth** — l'architecture stdio actuelle est
inéligible.

### Pré-requis techniques (à construire)

- [ ] Transport **Streamable HTTP** (en plus du stdio) via le SDK MCP
- [ ] **OAuth 2.1** côté Gilbert : flow PKCE, scopes (`meetings:read`…),
      idéalement *dynamic client registration*
- [ ] Serveur MCP **hébergé** (ex. `mcp.gilbert-assistant.ovh`), HTTPS, monitoring,
      disponibilité/SLA
- [ ] **Politique de confidentialité** publique + description du traitement des
      données (transcriptions = données sensibles RGPD)

### Soumissions (revue humaine, pas de self-serve)

- [ ] **Anthropic** — directory de connecteurs Claude.ai : process de soumission /
      partenariat
- [ ] **OpenAI** — connecteurs ChatGPT : programme partenaire
- [ ] **Mistral** — connecteurs Le Chat : contact partenariats

### Critères regardés par les trois éditeurs

Qualité du serveur · sécurité (OAuth, scopes, isolation) · doc développeur ·
disponibilité/SLA · cas d'usage · **nombre d'utilisateurs / adoption** ·
réputation open source · support entreprise.

> C'est pourquoi finir la Piste A **d'abord** est rationnel : l'adoption qu'elle
> génère est l'argument principal des candidatures de la Piste B.
