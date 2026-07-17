# Performance

Diese Seite dokumentiert die Bundle-Analyse fuer Issue #66 und die aktuelle Entscheidung zur Bundle-Optimierung.

## Reproduzierbare Bundle-Analyse

Der normale Produktionsbuild bleibt unveraendert:

```sh
npm run build
```

Fuer eine Bundle-Analyse kann separat der Visualizer-Build gestartet werden:

```sh
npm run build:analyze
```

Der Analysebuild nutzt `vite build --mode analyze` und erzeugt zusaetzlich `dist/bundle-analysis.html`. Der Report liegt bewusst in `dist`, weil der Ordner bereits ignoriert wird und generierte Analyseartefakte nicht eingecheckt werden muessen.

## Build-Ausgabe vom 2026-07-04

Ausgabe von `npm run build`:

```text
vite v8.0.16 building client environment for production...
transforming...✓ 161 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.41 kB
dist/index.html                   0.92 kB │ gzip:   0.44 kB
dist/assets/index-BnL0WRlc.css   33.28 kB │ gzip:   5.70 kB
dist/assets/index-ErP36jSu.js   589.75 kB │ gzip: 152.08 kB

✓ built in 199ms

PWA v1.3.0
mode      generateSW
precache  7 entries (609.46 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js

[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification.
```

Der Build ist erfolgreich. Die einzige Warnung ist die Vite-Chunk-Warnung fuer den minifizierten JS-Einstieg oberhalb von 500 kB.

## Bundle-Zusammensetzung

Auswertung aus `dist/bundle-analysis.html` nach `npm run build:analyze`:

| Bestandteil                          |   Rendered |      Gzip | Einordnung                                                                                      |
| ------------------------------------ | ---------: | --------: | ----------------------------------------------------------------------------------------------- |
| Gesamt-JS `assets/index-ErP36jSu.js` | 1132.9 KiB | 256.1 KiB | Unminifizierte Modulsumme aus dem Visualizer; der gebaute Chunk ist 589.75 kB / 152.08 kB gzip. |
| `node_modules` gesamt                |  898.5 KiB | 192.3 KiB | Hauptanteil des Bundles.                                                                        |
| `react-dom`                          |  448.0 KiB |  85.0 KiB | Groesster einzelner Block, erwartbar fuer React SPA.                                            |
| `@supabase/*`                        |  333.2 KiB |  75.5 KiB | Zweitgroesster Block; enthaelt Auth, Realtime, Storage, PostgREST und Supabase Client.          |
| `src` gesamt                         |  230.1 KiB |  61.7 KiB | App-Code, Uebersetzungen, Avatar-URLs und Komponenten.                                          |
| `@supabase/auth-js`                  |  156.6 KiB |  31.0 KiB | Groesster Supabase-Unterblock, obwohl die App aktuell codebasierte RPC-Zugriffe nutzt.          |
| `src/App.tsx`                        |   76.6 KiB |  12.9 KiB | Zentrale App-Komponente mit Login, Voting, Ergebnis- und Adminlogik.                            |
| `i18next`                            |   72.0 KiB |  17.6 KiB | Internationalisierung.                                                                          |
| `src/assets/avatars`                 |   57.0 KiB |  24.0 KiB | 52 lokal gebuendelte Avatar-SVG-URLs.                                                           |
| `@supabase/realtime-js`              |   49.8 KiB |  14.7 KiB | Durch Supabase Client enthalten; Realtime wird aktuell nicht explizit verwendet.                |
| `@supabase/storage-js`               |   37.8 KiB |   7.1 KiB | Wird fuer Festivaldokumente benoetigt.                                                          |

Die groessten beeinflussbaren Bereiche sind damit nicht einzelne App-Komponenten, sondern die Bibliothekswahl und die Art, wie Supabase gebuendelt wird. Das waere keine kleine risikoarme Aenderung.

## Code-Splitting-Pruefung

Selten genutzte Bereiche wie der Adminbereich wurden geprueft. Die Admin-Komponenten selbst sind klein:

| Admin-Komponente             | Rendered |    Gzip |
| ---------------------------- | -------: | ------: |
| `AdminCategories.tsx`        |  9.7 KiB | 1.8 KiB |
| `AdminFestivalDocuments.tsx` |  9.4 KiB | 1.7 KiB |
| `AdminFestival.tsx`          |  8.2 KiB | 1.5 KiB |
| `AdminParticipants.tsx`      |  6.3 KiB | 1.2 KiB |

Ein einfaches Lazy Loading nur dieser Komponenten wuerde voraussichtlich nur wenige KiB gzip aus dem Initial-Chunk verschieben. Ein wirklich wirksames Admin-Splitting muesste auch State, Datenladefunktionen und Admin-spezifische Logik aus `src/App.tsx` herausziehen. Das waere eine funktionale Refaktorierung mit hoeherem Risiko und passt nicht zu diesem Issue, weil explizit keine funktionalen Aenderungen gewuenscht sind.

## Entscheidung

Aktuell ist keine Bundle-Optimierung notwendig.

Begruendung:

- Der Produktionsbuild ist erfolgreich und der einzige Hinweis ist eine Vite-Warnung zur 500-kB-Minified-Schwelle.
- Die komprimierte JS-Groesse liegt bei 152.08 kB gzip und ist fuer diese SPA mit PWA, i18n und Supabase-Anbindung akzeptabel.
- Die groessten Bestandteile sind `react-dom` und Supabase Client Libraries. Eine Reduktion waere eher Architektur-/Dependency-Arbeit als eine kleine risikoarme Optimierung.
- Code Splitting des Adminbereichs ist prinzipiell moeglich, aber in der aktuellen Struktur nur begrenzt wirksam, solange die zentrale Adminlogik in `src/App.tsx` liegt.

Empfehlung: Bundle-Groesse weiter beobachten und den Visualizer bei groesseren Dependency-, Admin- oder Medien-Aenderungen erneut ausfuehren. Eine gezielte Optimierung sollte erst geplant werden, wenn reale Ladezeitprobleme auftreten oder der Initial-Chunk deutlich weiter waechst.
