# Topograph

Visuelle Systemdokumentation und Topologie-Editor. Erstelle interaktive Diagramme für Netzwerke, Software-Abhängigkeiten, Workflows und Infrastruktur — vollständig self-hosted.

## Features

- **Visueller Editor** — Drag & Drop, 12 Node-Typen (Server, Datenbank, Cloud, Mail, …)
- **Rechtsklick-Menü** — Nodes hinzufügen, duplizieren, löschen ohne Toolbar
- **Workflow-Knoten** — Start/Ende-Knoten mit eigenen Beschriftungen
- **Custom Fields** — Eigene Felder pro Node, ein-/ausblendbar auf der Karte
- **Notizen** — Mehrere Notizen pro Node mit Zeitstempel
- **Verbindungs-Labels** — Doppelklick auf Linie → Label (z.B. "HTTP", "TCP 443")
- **Animierte Kanten** — Datenfluss & VPN mit Fluss-Animation
- **PDF-Export** — A4 Hoch-/Querformat, 3 Themes (Dark / Hell / Blueprint)
- **LDAP / Active Directory** — SSO über AD-Sicherheitsgruppen (RODC-kompatibel)
- **Admin-Panel** — Nutzerverwaltung, Rollen (Admin / Mitglied)
- **Auto-Updates** — Admins sehen neue Versionen → Ein-Klick Docker-Update
- **Linux-Updates** — Sicherheitsupdates mit CVE-Hinweis, direkt aus dem Browser
- **Eigenes Branding** — App-Name, Logo und Primärfarbe per `.env`

---

## Schnellstart

**Keine Kompilierung nötig** — Image direkt von GHCR (`ghcr.io/corexmanagement/topograph:latest`).

```bash
# 1. docker-compose.yml und .env herunterladen
curl -O https://raw.githubusercontent.com/CoreXManagement/topograph/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/CoreXManagement/topograph/main/.env.example
mv .env.example .env
```

```bash
# 2. .env anpassen (Pflichtfelder)
nano .env
```

Mindestens diese drei Werte setzen:
```env
DB_PASSWORD=sicheres-datenbankpasswort
NEXTAUTH_URL=https://topograph.example.com
NEXTAUTH_SECRET=   # openssl rand -base64 32
```

```bash
# 3. Starten
docker compose up -d

# 4. Ersten Administrator anlegen
docker compose exec app node scripts/create-admin.js admin@example.com MeinPasswort
```

### Easypanel / Coolify / Portainer

Die `docker-compose.yml` ist für Plattformen mit eigenem Reverse Proxy optimiert — **keine Ports oder Container-Namen hardcoded**. Einfach die Compose-Datei + `.env` einfügen, Plattform übernimmt das Routing.

### Direktes Deployment ohne Reverse Proxy

Port nach außen freigeben via Override:

```bash
curl -O https://raw.githubusercontent.com/CoreXManagement/topograph/main/docker-compose.override.example.yml
mv docker-compose.override.example.yml docker-compose.override.yml
# APP_PORT=3000 in .env setzen, dann:
docker compose up -d
```

Docker Compose lädt `override.yml` automatisch zusätzlich zur Hauptdatei.

---

## Image manuell ziehen

```bash
docker pull ghcr.io/corexmanagement/topograph:latest
```

> **Hinweis:** Falls das Package noch privat ist → GitHub → Packages → Topograph → Visibility → Public setzen.

---

## LDAP / Active Directory

Eintragen in `.env`:

```env
LDAP_URL=ldap://dc.beispiel.de
LDAP_DOMAIN=beispiel.de
LDAP_BASE_DN=DC=beispiel,DC=de
LDAP_GROUP_DN=CN=Topograph,OU=Gruppen,DC=beispiel,DC=de
```

**Nur Mitglieder dieser AD-Gruppe** können sich anmelden. RODC (Read-Only DC) wird unterstützt.

Für verschachtelte Gruppen (rekursive Prüfung) einen Service-Account angeben:
```env
LDAP_BIND_DN=CN=svc-topograph,OU=Dienste,DC=beispiel,DC=de
LDAP_BIND_PASSWORD=sicheres-passwort
```

---

## Branding

```env
APP_NAME=Stadtwerk Docs        # App-Name überall
PRIMARY_COLOR=#0ea5e9          # Primärfarbe (Hex)
LOGO_URL=https://example.com/logo.png
```

---

## Updates

### App-Update (Ein-Klick)
Admins sehen automatisch einen Banner wenn eine neue Version auf GitHub erscheint.  
Klick auf „Jetzt updaten" → zieht neues Image → Container startet neu.

### Manuelles Update
```bash
docker compose pull && docker compose up -d
```

### Automatisches Update (optional — Watchtower)
```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400 \
  topograph-app
```

---

## Backup

```bash
# Backup erstellen
docker compose exec postgres pg_dump -U topograph topograph > backup_$(date +%Y%m%d).sql

# Wiederherstellen
docker compose exec -T postgres psql -U topograph topograph < backup_20240101.sql
```

Tägliches Backup per Cron:
```bash
# crontab -e
0 3 * * * cd /opt/topograph && docker compose exec -T postgres pg_dump -U topograph topograph > backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Alle Umgebungsvariablen

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL-Verbindung |
| `DB_PASSWORD` | ✓ | DB-Passwort (für docker-compose intern) |
| `NEXTAUTH_URL` | ✓ | Öffentliche URL der App |
| `NEXTAUTH_SECRET` | ✓ | Sicherer Zufalls-String |
| `LDAP_URL` | – | LDAP-Server (ldap:// oder ldaps://) |
| `LDAP_DOMAIN` | – | Domain-Suffix |
| `LDAP_BASE_DN` | – | Such-Basis im AD |
| `LDAP_GROUP_DN` | – | AD-Gruppe mit Zugang |
| `LDAP_BIND_DN` | – | Service-Account-DN |
| `LDAP_BIND_PASSWORD` | – | Service-Account-Passwort |
| `APP_NAME` | – | App-Name (Standard: `Topograph`) |
| `PRIMARY_COLOR` | – | Primärfarbe als Hex |
| `LOGO_URL` | – | URL zum eigenen Logo |
| `APP_PORT` | – | Host-Port (Standard: `3000`) |

---

## Lizenz

MIT — Freie Nutzung, auch kommerziell.
