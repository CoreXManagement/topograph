# Topograph

Visuelle Systemdokumentation und Topologie-Editor. Erstelle interaktive Diagramme für Netzwerke, Software-Abhängigkeiten, Workflows und Infrastruktur.

![Topograph Screenshot](docs/screenshot.png)

## Features

- **Visueller Editor** — Drag & Drop, 12 Node-Typen (Server, Datenbank, Cloud, Mail, …)
- **Workflow-Knoten** — Start/Ende-Knoten mit eigenen Beschriftungen
- **Custom Fields** — Eigene Felder pro Node, ein-/ausblendbar
- **Notizen** — Mehrere Notizen pro Node mit Zeitstempel
- **Verbindungs-Labels** — Doppelklick auf Linie → Label setzen (z.B. "HTTP", "VPN")
- **Animierte Kanten** — Datenfluss & VPN-Verbindungen mit Animationen
- **PDF-Export** — A4 Hoch-/Querformat, Dark/Hell/Blueprint-Theme
- **LDAP / Active Directory** — SSO über AD-Sicherheitsgruppen
- **Admin-Panel** — Nutzerverwaltung, Rollen, System-Updates
- **Auto-Updates** — Admins werden über neue Versionen informiert, Ein-Klick-Update
- **Eigenes Branding** — Logo, Name und Farben per Umgebungsvariable

---

## Schnellstart (Docker)

### 1. Repository klonen

```bash
git clone https://github.com/your-org/topograph.git
cd topograph
```

### 2. Konfiguration anlegen

```bash
cp .env.example .env
# .env anpassen: NEXTAUTH_SECRET, NEXTAUTH_URL, DB_PASSWORD
```

Sicheren Secret generieren:
```bash
openssl rand -base64 32
```

### 3. Starten

```bash
docker compose up -d
```

Topograph ist erreichbar unter: `http://localhost:3000`

### 4. Ersten Administrator anlegen

Beim ersten Start gibt es noch keine Nutzer. Lege manuell einen Admin an:

```bash
docker compose exec postgres psql -U topograph -d topograph -c "
  INSERT INTO tg_users (email, name, password_hash, role)
  VALUES (
    'admin@example.com',
    'Administrator',
    '\$2b\$10\$...',   -- bcrypt-Hash deines Passworts
    'ADMIN'
  );
"
```

Oder nutze das mitgelieferte Skript:
```bash
docker compose exec app node scripts/create-admin.js admin@example.com MeinPasswort
```

---

## LDAP / Active Directory

Topograph unterstützt SSO über LDAP. Konfiguriere die folgenden Variablen in `.env`:

```env
LDAP_URL=ldap://dc.example.com          # oder ldaps:// für verschlüsselt
LDAP_DOMAIN=example.com                 # Domain-Suffix für UPN
LDAP_BASE_DN=DC=example,DC=com          # Such-Basis
LDAP_GROUP_DN=CN=Topograph,OU=Gruppen,DC=example,DC=com  # Zugangs-Gruppe
```

**Nur Mitglieder dieser AD-Gruppe** können sich anmelden.

Für rekursive Gruppenprüfung (verschachtelte Gruppen) zusätzlich einen Service-Account angeben:
```env
LDAP_BIND_DN=CN=svc-topograph,OU=Dienste,DC=example,DC=com
LDAP_BIND_PASSWORD=sicheres-passwort
```

Der Service-Account benötigt nur **Lesezugriff** (z.B. auf einem RODC).

---

## Branding

Topograph lässt sich vollständig anpassen:

```env
APP_NAME=Mein Firmendok          # App-Name (Sidebar, Login)
PRIMARY_COLOR=#6366f1            # Primärfarbe (Hex)
LOGO_URL=https://example.com/logo.png   # Logo-URL (SVG oder PNG)
```

---

## Backup

Datenbank-Backup:
```bash
docker compose exec postgres pg_dump -U topograph topograph > backup_$(date +%Y%m%d).sql
```

Wiederherstellung:
```bash
docker compose exec -T postgres psql -U topograph topograph < backup_20240101.sql
```

Automatisches tägliches Backup per Cron:
```bash
# crontab -e
0 3 * * * cd /opt/topograph && docker compose exec -T postgres pg_dump -U topograph topograph > backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Updates

Admins sehen automatisch einen Update-Banner, wenn eine neue Version verfügbar ist.  
Alternativ manuell:

```bash
docker compose pull && docker compose up -d
```

---

## Lizenz

MIT — Freie Nutzung, auch kommerziell.
