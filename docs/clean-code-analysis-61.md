# Clean Code Analyse Issue 61

## Kurzbefund

Die App ist fachlich klar geschnitten: Datenzugriffe liegen in `src/data`, UI-Komponenten in `src/components`, globale App-Orchestrierung in `src/App.tsx` und Supabase-Sicherheitsregeln in Migrationen. Die groessten Clean-Code-Auffaelligkeiten liegen nicht in unklaren Namen, sondern in gewachsener Orchestrierungslogik und Wiederholungen.

## KISS

- `src/App.tsx` buendelt Routing, Login, Datenladen, Adminaktionen, Abstimmung und Export. Das ist fuer die aktuelle Groesse noch nachvollziehbar, aber der mentale Kontext ist hoch.
- Die neue Härtungsmigration ist bewusst ausführlich, weil sie angewendete RPCs neu definiert. Das ist fuer Migrationen akzeptabel, sollte aber nicht in weitere Copy-Paste-Migrationen auswachsen.

## DRY

- Die Supabase-Konfigurationspruefung war in jedem Datenadapter wiederholt. Das wurde in `getSupabase()` zentralisiert.
- Mapping-Funktionen wie `mapCategoryResult`, `mapParticipantResult` und die `Array.isArray(data) ? data[0] : data`-Logik folgen einem wiederkehrenden Muster. Eine generische Hilfsfunktion waere moeglich, aber aktuell nicht zwingend.
- Admin-Fehlerzuordnung ist in `App.tsx` schon fachlich getrennt, koennte langfristig in ein eigenes Modul wandern.

## Lesbarkeit

- Die Namen der Datenmodule und Komponenten sind ueberwiegend selbsterklaerend.
- `App.tsx` enthaelt viele lokale Handler mit guten Namen, aber die Datei ist dadurch sehr lang. Die Lesbarkeit leidet eher durch Umfang als durch schlechte Benennung.

## YAGNI

- Keine offensichtlichen toten Produktfeatures gefunden.
- `updateCategoryStatus` und `deleteVotesForCategory` sind Datenadapter, die aktuell nur teilweise oder gar nicht genutzt werden. Vor dem Entfernen sollte geprueft werden, ob sie fuer alte UI-Pfade oder geplante Adminabläufe bewusst vorgehalten werden.

## Single Responsibility

- Datenmodule haben klare Verantwortlichkeiten.
- `AdminFestival`, `AdminCategories` und `AdminParticipants` sind ausreichend fokussiert.
- `App.tsx` ist der groesste SRP-Hotspot, weil dort globale Datenkoordination und viele Admin-Workflows zusammenlaufen.

## Direkt umgesetzt

- Supabase-Konfigurationspruefung in `src/lib/supabase.ts` zentralisiert.
- Datenadapter verwenden `getSupabase()` statt wiederholter lokaler Nullpruefung.

## Folge-Issues

1. `App.tsx` in kleine Hooks aufteilen: Festivaldaten, Teilnehmerlogin, Admin-Festival, Admin-Teilnehmer, Admin-Kategorien.
2. Gemeinsame RPC-Ergebnishelfer pruefen, z. B. `firstRow(data)` fuer Single-Row RPCs.
3. Admin-Fehlerzuordnung aus `App.tsx` in ein kleines Modul verschieben und gezielt testen.
4. Nutzung von selten verwendeten Datenadaptern pruefen und nicht benoetigte Adapter entfernen oder begruenden.
