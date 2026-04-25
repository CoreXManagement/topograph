# Commit-Konvention

Topograph verwendet **Conventional Commits** damit der automatische Changelog im Update-Banner sinnvoll ist.

## Format

```
<typ>(<bereich>): <kurze Beschreibung>

<optionaler Langtext>
```

## Typen

| Typ | Wann | Beispiel | Im Banner |
|-----|------|---------|-----------|
| `feat` | Neue Funktion | `feat: LDAP-Konfiguration in Admin-UI` | ✨ Neu |
| `fix` | Bugfix | `fix: Toggle-Button Darstellung korrigiert` | 🐛 Behoben |
| `ci` | CI/CD, Build | `ci: GitHub Release automatisch erstellen` | ⚙️ CI/Build |
| `docs` | Dokumentation | `docs: README Quickstart aktualisieren` | 📝 Doku |
| `refactor` | Umstrukturierung | `refactor: Auth-Logik in eigene Datei` | 🔧 Sonstiges |
| `chore` | Abhängigkeiten etc. | `chore: nodemailer auf v7 updaten` | 🔧 Sonstiges |

## Regeln

1. **Pflicht:** Typ + Doppelpunkt + Beschreibung
2. **Imperativ:** "füge hinzu" nicht "hinzugefügt" — "fix: Button reparieren" nicht "fix: Button repariert"
3. **Deutsch** für dieses Projekt
4. **Kurzhalten:** max. 72 Zeichen in der ersten Zeile
5. Mehrere Änderungen → mehrere Commits, nicht alles in einen

## Gute Beispiele

```
feat: PDF-Export mit Dark/Hell/Blueprint-Theme
fix: Update-Banner pollt jetzt alle 5 Minuten
feat(admin): LDAP in Admin-UI konfigurierbar
fix(pdf): Node-Clipping durch größeres Padding behoben
ci: APP_VERSION als Build-Arg im Dockerfile gesetzt
docs: LDAP-Setup für Windows RODC dokumentiert
```

## Schlechte Beispiele

```
update stuff              ← kein Typ, zu vage
feat: added new button    ← Englisch
fix: various bug fixes    ← zu unspezifisch
WIP                       ← kein Conventional Commit
```

## Warum das wichtig ist

Jeder Push auf `main` erstellt automatisch einen GitHub Release.
Die Commit-Messages erscheinen **direkt im Update-Banner** der laufenden App:

```
sha-old123 → sha-new456

✨ Neu      LDAP in Admin-UI konfigurierbar
🐛 Behoben  Toggle-Button Darstellung
⚙️ CI       GitHub Release automatisch erstellen
```

Wenn Commit-Messages nichtssagend sind, sehen Admins im Update-Banner auch nichts Sinnvolles.
