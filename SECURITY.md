# Politique de sécurité — gilbert-mcp

## Modèle de sécurité

`gilbert-mcp` est un serveur **stdio** local : il s'exécute sur la machine de
l'utilisateur (lancé par le client MCP) et n'ouvre **aucun port réseau entrant**.
Il agit uniquement comme client de l'API Gilbert en HTTPS sortant.

### Authentification

- L'accès à l'API se fait via une **clé API** `GILBERT_API_KEY` (format
  `glbrt_live_...`), fournie par variable d'environnement.
- La clé n'est **jamais journalisée** ni écrite sur disque par le serveur.
- Scope minimal recommandé côté Gilbert : `meetings:read`.
- La clé donne accès **en lecture seule** aux réunions de l'utilisateur
  propriétaire de la clé.

### Surface d'attaque

- **Aucune écriture** : les 5 tools sont annotés `readOnlyHint: true`. Le serveur
  ne crée, ne modifie ni ne supprime aucune donnée.
- **Appels réseau** limités au seul `GILBERT_BASE_URL` (défaut
  `https://gilbert-assistant.ovh/api/v1`). Les identifiants de réunion sont
  URL-encodés avant interpolation.
- **Timeout** de 15 s par requête + 1 retry sur erreur transitoire (pas de
  blocage indéfini du client).

### Données traitées

Le serveur expose des **transcriptions et synthèses de réunions** — données
potentiellement sensibles (RGPD). Elles transitent du backend Gilbert vers le
client MCP de l'utilisateur, sans stockage intermédiaire par ce serveur.

## Signaler une vulnérabilité

Merci de **ne pas** ouvrir d'issue publique pour une faille de sécurité.
Contact : **security@lexiapro.fr** (ou contact@lexiapro.fr).

Nous nous engageons à accuser réception sous 72 h ouvrées et à tenir le
rapporteur informé de la correction.
