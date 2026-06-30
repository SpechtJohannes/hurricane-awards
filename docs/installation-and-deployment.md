# Installation und Deployment

Diese Dokumentation beschreibt den aktuellen Stand der Hurricane Awards App. Sie erklaert, wie ein neuer Entwickler das Projekt lokal einrichtet, startet, testet und als statische Anwendung deployed.

## Voraussetzungen

- Node.js: Fuer Vite, TypeScript, Vitest und den Build-Prozess.
- npm: Wird fuer Installation, lokale Entwicklung, Tests und Build verwendet.
- Git: Zum Klonen und Versionieren des Repositorys.
- Supabase Projekt: Die App benoetigt eine Supabase URL, einen anon Key und die Datenbankmigrationen aus diesem Repository.

Optional, aber hilfreich:

- Supabase CLI, wenn Migrationen lokal oder per CLI angewendet werden sollen.
- Ein Hosting-Anbieter fuer statische Websites, zum Beispiel Netlify, Vercel, GitHub Pages oder ein vergleichbares Setup.

## Repository Einrichten

Repository klonen:

```bash
git clone <repository-url>
cd hurricane-awards
```

Abhaengigkeiten installieren:

```bash
npm install
```

Unter Windows PowerShell kann je nach Execution Policy statt `npm` der direkte Shim `npm.cmd` noetig sein:

```bash
npm.cmd install
```

## Umgebungsvariablen

Die Supabase-Konfiguration wird ueber Vite-Umgebungsvariablen gelesen. Die Datei wird lokal typischerweise als `.env.local` angelegt.

Benötigte Variablen:

- `VITE_SUPABASE_URL`: URL des Supabase Projekts.
- `VITE_SUPABASE_ANON_KEY`: Oeffentlicher Supabase anon/publishable Key fuer Browserzugriffe.

Beispiel ohne echte Werte:

```bash
VITE_SUPABASE_URL=https://example-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Wichtig:

- Keine `service_role` Keys in `VITE_*` Variablen eintragen.
- Keine echten Secrets in Dokumentation, Tests oder Frontend-Code committen.
- Vite Variablen mit Prefix `VITE_` werden in das Frontend-Bundle eingebettet.

## Lokale Entwicklung

Entwicklungsserver starten:

```bash
npm run dev
```

Tests ausfuehren:

```bash
npm test
```

Weitere Testbefehle:

```bash
npm run test:watch
npm run test:coverage
```

Lint ausfuehren:

```bash
npm run lint
```

Produktionsbuild erzeugen:

```bash
npm run build
```

PWA lokal pruefen:

```bash
npm run build
npm run preview
```

Anschliessend die Preview-URL im Browser oeffnen und in den DevTools unter `Application` pruefen, ob Manifest und Service Worker vorhanden sind. Fuer Install-Tests auf mobilen Geraeten ist eine HTTPS-faehige Umgebung oder ein lokales Netzwerk-Setup mit gueltigem HTTPS erforderlich.

## Supabase

Die Datenbankstruktur und RPC-Funktionen liegen unter `supabase/migrations`.

Migrationen anwenden:

```bash
supabase db push
```

Alternativ koennen die SQL-Dateien in der Supabase SQL-Oberflaeche ausgefuehrt werden.

Reihenfolge:

- Migrationen sind timestamp-basiert benannt.
- Sie muessen in aufsteigender Reihenfolge angewendet werden.
- Kommentare am Anfang einzelner Migrationen nennen die jeweils erwartete Vorgaenger-Migration.

Aktuelle Migrationsbereiche:

- RLS und RPC-Grundschutz.
- Adminrechte und Teilnehmerverwaltung.
- Datenintegritaet fuer Codes und Votes.
- Kategorieverwaltung.
- Zentraler Festivalname.
- Festivalarchivierung.
- Serverseitiger Login-Schutz gegen Code-Erraten.

Hinweise fuer neue Migrationen:

- Neue Datenbankaenderungen immer als neue Datei unter `supabase/migrations` ablegen.
- Bestehende angewendete Migrationen nicht nachtraeglich umschreiben.
- Grants, RLS Policies und RPC-Berechtigungen bei jeder neuen Tabelle oder Funktion mitpruefen.
- Migrationstests in `src/test/securityMigration.test.ts` aktualisieren, wenn Sicherheitsannahmen oder Struktur geaendert werden.

## Deployment

Die Anwendung wird als statische Vite-App gebaut:

```bash
npm run build
```

Das Build-Ergebnis liegt in `dist`. Dieses Verzeichnis wird beim Hosting-Anbieter als statische Website deployed.

Typische Hosting-Konfiguration:

- Build Command: `npm run build`
- Publish/Output Directory: `dist`
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Zusammenspiel mit Supabase:

- Das Frontend enthaelt nur den Supabase anon Key.
- Geschuetzte Datenzugriffe laufen ueber Supabase RPC-Funktionen.
- Die Datenbankmigrationen muessen vor oder zusammen mit einem Deployment angewendet sein, wenn das Frontend neue RPCs oder Spalten erwartet.
- Der Hosting-Anbieter liefert nur die statischen Dateien aus `dist`; Datenbank, RLS und RPCs laufen im Supabase Projekt.

## Wartung

- Vor jedem Merge Tests und Lint ausfuehren.
- Neue Datenbankaenderungen immer als Migration einchecken.
- Neue sichtbare UI-Texte in `src/i18n/de.json` und `src/i18n/nl.json` pflegen.
- Bei Sicherheitsaenderungen [docs/security.md](security.md) pruefen und aktualisieren.
- Bei strukturellen Aenderungen [docs/architecture.md](architecture.md) und [docs/database-schema.md](database-schema.md) aktualisieren.
- Bei Deployment-relevanten Aenderungen diese Dokumentation aktualisieren.
