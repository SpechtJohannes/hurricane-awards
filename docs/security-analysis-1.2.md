# Sicherheitsanalyse Version 1.2

## Zusammenfassung

Die Anwendung ist fuer eine kleine Festival-Abstimmung insgesamt solide abgesichert: Tabellenzugriffe sind in den Migrationen weitgehend per RLS und Revoke gesperrt, die Browser-App nutzt nur RPC-Funktionen, Adminfunktionen pruefen serverseitig `is_admin`, und React rendert Benutzerdaten ohne gefundene direkte HTML-Injektion.

Die wichtigsten Restrisiken liegen nicht in klassischem XSS oder SQL Injection, sondern im bewusst einfachen Zugangscode-Modell: Teilnehmercodes werden im Browser gespeichert, der Festivalcode ist ein geteilter Code, Admin-RPCs sind fuer `anon` ausfuehrbar und verlassen sich auf Code-basierte Pruefungen. Fuer das aktuelle Nutzungsszenario ist das vertretbar, fuer hoeheren Schutz sollten kurzlebige Sessions, strengere Code-Policies und Rate Limiting fuer den Festivalcode nachgezogen werden.

Ausgefuehrte Pruefungen:

- `npm.cmd run lint`: erfolgreich, keine ESLint-Fehler.
- `npm.cmd test`: erfolgreich, 4 Testdateien und 98 Tests bestanden.
- `npm.cmd audit`: erfolgreich, `found 0 vulnerabilities`.
- `npm audit` ohne `.cmd` war wegen PowerShell Execution Policy blockiert; danach wurde `npm.cmd` verwendet.

## Nachtrag Issue #54

Die drei hoch priorisierten Findings wurden mit Issue #54 umgesetzt:

- Festivalcode-Brute-Force-Schutz: `ha_verify_festival_access_code` wird durch serverseitiges Rate Limiting ueber `festival_access_attempts` geschuetzt. Fehlversuche werden pro technischem Client-Schluessel gezaehlt, temporaer gesperrt und bei erfolgreicher Eingabe geloescht.
- Bekannter Default-Festivalcode: `HURRICANE2026` wird nicht mehr als frischer Default installiert. Eine neue Migration entfernt diesen Wert, falls er noch aktiv ist. Der initiale Festivalcode muss projektspezifisch per Deployment-/Setup-SQL gesetzt werden.
- Teilnehmercodes im Browser: Der eingeloggte Teilnehmer wird nicht mehr dauerhaft in `localStorage`, sondern nur noch in `sessionStorage` fuer die aktuelle Browser-Session gespeichert. Alte persistente Teilnehmer-Eintraege werden nicht mehr uebernommen und beim Zugriff entfernt.

## Nachtrag Issue #55

Die mittleren Findings wurden mit Issue #55 bearbeitet:

- Export sensibler Zugangsdaten: Der JSON-Export entfernt Teilnehmercodes standardmaessig. Ein Export inklusive Teilnehmercodes ist nur noch ueber eine explizite Admin-Option moeglich und zeigt eine Warnung an.
- Langfristige Admin-Absicherung: Die bestehenden Admin-RPCs bleiben in diesem Issue beim Code-basierten Modell, werden aber durch Tests gegen fehlende `ha_has_admin_access`-Pruefungen abgesichert. Ein langfristiges Konzept fuer robuste Admin-Authentifizierung und Autorisierung ist in `docs/security.md` dokumentiert.

## Pruefbereiche

### Frontend

Bewertung: gut mit mittleren Restrisiken durch clientseitig gespeicherte Zugangsdaten.

Relevante Dateien oder Komponenten:

- `src/App.tsx`
- `src/components/AdminFestival.tsx`
- `src/components/AdminParticipants.tsx`
- `src/components/AdminCategories.tsx`
- `src/hooks/useFestivalAccess.ts`
- `src/data/*.ts`
- `src/lib/supabase.ts`

Auffaelligkeiten:

- Keine Nutzung von `dangerouslySetInnerHTML`, `innerHTML`, `eval` oder `new Function` gefunden.
- Benutzereingaben und DB-Werte werden durch React als Text gerendert, z. B. Festivalname, Kategorien, Teilnehmernamen und Fehlertexte.
- Formulare normalisieren Zugangscodes mit `trim().toUpperCase()`.
- Admin-UI wird nur angezeigt, wenn `selectedParticipant.isAdmin` wahr ist; verbindlich ist aber die serverseitige RPC-Pruefung.
- Der eingeloggte Teilnehmer inklusive `accessCode` wird nur in `sessionStorage` gespeichert (`readStoredParticipant`, `storeAuthenticatedParticipant` in `src/App.tsx`); alte `localStorage`-Eintraege werden entfernt.
- Der Festivalzugang speichert nicht den Festivalcode, sondern eine Access-Version in `localStorage` (`src/hooks/useFestivalAccess.ts`).
- Fehler werden in der UI meist generisch angezeigt. Einzelne Admin-Formulare zeigen `Error.message` aus RPC-Aufrufen an; das kann interne Validierungsdetails sichtbar machen, aber keine Stacktraces.
- Umgebungsvariablen im Frontend sind auf `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` beschraenkt. Kein `service_role`-Key wurde im Projekt gefunden.

Risiko:

- Mittel fuer dauerhaft gespeicherte Teilnehmercodes im Browser.
- Niedrig fuer XSS nach aktuellem Codebild.
- Niedrig bis mittel fuer Informationslecks durch Admin-Fehlermeldungen.

### Supabase

Bewertung: gut strukturiertes Deny-by-default-Modell mit RPC-basierter Zugriffsschicht, aber hoher Verantwortung in `SECURITY DEFINER`-Funktionen.

Relevante Dateien oder Komponenten:

- `supabase/migrations/20260628123000_secure_data_access.sql`
- `supabase/migrations/20260628143000_add_participant_active_flag.sql`
- `supabase/migrations/20260628153000_create_participant_management_rpcs.sql`
- `supabase/migrations/20260629100000_enforce_data_integrity.sql`
- `supabase/migrations/20260630100000_create_category_management_rpcs.sql`
- `supabase/migrations/20260630110000_create_festival_name_setting.sql`
- `supabase/migrations/20260630120000_create_festival_archives.sql`
- `supabase/migrations/20260630130000_secure_participant_login.sql`
- `supabase/migrations/20260701070000_manage_festival_access_code.sql`

Auffaelligkeiten:

- RLS ist fuer `participants`, `categories`, `votes`, `archived_votes`, `app_settings`, Archivtabellen, Login-Attempts und Festivalcode-Attempts aktiviert.
- Direkte Tabellenrechte fuer `anon` und `authenticated` werden entzogen; Policies sind restriktiv mit `using (false)` / `with check (false)`.
- Zugriff erfolgt ueber `SECURITY DEFINER`-RPCs mit `set search_path = public`.
- Admin-RPCs sind an `anon` und `authenticated` granted, pruefen aber intern `ha_has_admin_access`.
- Teilnehmerlogin nutzt serverseitiges Rate Limiting ueber `participant_login_attempts`: 3 Fehlversuche, 30 Sekunden Sperre, technische Keys aus Client-Adresse und User-Agent.
- Festivalcode-Pruefung nutzt serverseitiges Rate Limiting ueber `festival_access_attempts` nach demselben Muster.
- `ha_find_participant` wird in der spaeteren Login-Migration fuer Browserrollen entzogen.
- Vote-Integritaet wird serverseitig geprueft: keine Selbstvotes, nur offene Kategorien, Zielteilnehmer muss existieren, Unique Index auf `(voter_id, category_id)`.
- SQL Injection wurde nicht auffaellig: die Frontend-Aufrufe verwenden Supabase RPC-Parameter, SQL-Funktionen arbeiten ueber Parameter und statische Queries. Das einzige `return query execute` fuer `all_time_standings` verwendet eine konstante SQL-Zeichenkette.
- Festivalcode wird in `app_settings` gespeichert und per RPC verifiziert. Es wird kein allgemein bekannter Default-Code mehr installiert.
- Storage-Konfiguration wurde im Repository nicht gefunden.

Risiko:

- Mittel fuer Code-basierte Authentifizierung ohne echte Sessions.
- Mittel fuer fehlendes Rate Limiting beim gemeinsamen Festivalcode.
- Niedrig bis mittel fuer breite `grant execute`-Oberflaeche auf Admin-RPCs, da interne Pruefungen vorhanden sind.
- Hinweis fuer `SECURITY DEFINER`-Hardening.

### Projekt und Abhaengigkeiten

Bewertung: unauffaellig.

Relevante Dateien oder Komponenten:

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `docs/installation-and-deployment.md`
- `.env.local` geprueft nur auf Variablennamen

Auffaelligkeiten:

- `npm.cmd audit` meldet 0 bekannte Vulnerabilities.
- `lint` und Tests laufen erfolgreich.
- Vite-Konfiguration enthaelt React und PWA-Plugin, keine auffaelligen Proxy-, Header- oder Secret-Konfigurationen.
- `.env.local` enthaelt nur `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` als Variablennamen.
- Dokumentation weist korrekt darauf hin, dass Vite-Variablen ins Frontend-Bundle gelangen und kein `service_role`-Key verwendet werden darf.

Risiko:

- Niedrig nach aktuellem Audit.
- Hinweis: PWA/Service Worker kann alte Frontend-Versionen cachen; bei sicherheitsrelevanten Frontend-Aenderungen sollte Update-Verhalten bewusst getestet werden.

## Feststellungen

### 1. Teilnehmercodes werden dauerhaft im Browser gespeichert

Beschreibung:

Nach erfolgreichem Login speichert die App den kompletten Teilnehmer inklusive `accessCode` in `localStorage`. Dadurch bleiben Teilnehmercodes nach Browser-Neustarts erhalten und sind fuer jedes Skript derselben Origin lesbar. Bei XSS, gemeinsam genutzten Geraeten oder kompromittierten Browserprofilen koennen damit Teilnehmer- und bei Admins auch Adminrechte weiterverwendet werden.

Risikoeinschaetzung: mittel

Betroffene Komponenten:

- `src/App.tsx`
- `src/data/participants.ts`
- `src/data/accessContext.ts`

Handlungsempfehlung:

Kurzlebige serverseitige Sessions oder signierte Tokens einfuehren und Teilnehmercodes nach Login nicht dauerhaft im Klartext im Browser speichern. Mindestens sollte ein Folgeissue klaeren, ob `sessionStorage`, Ablaufzeiten oder explizites "angemeldet bleiben" fuer das aktuelle Risiko angemessener sind.

Folgeissue empfohlen: ja

### 2. Gemeinsamer Festivalcode hat kein serverseitiges Rate Limiting

Beschreibung:

Der Festivalcode wird ueber `ha_verify_festival_access_code` geprueft. Anders als beim Teilnehmerlogin gibt es fuer diese Pruefung keine serverseitige Sperre, keinen Attempt-Zaehler und keine technische Rate-Limit-Tabelle. Ein Angreifer kann den gemeinsamen Festivalcode daher ueber den anon Key automatisiert probieren.

Risikoeinschaetzung: mittel

Betroffene Komponenten:

- `src/hooks/useFestivalAccess.ts`
- `src/data/festival.ts`
- `supabase/migrations/20260701070000_manage_festival_access_code.sql`

Handlungsempfehlung:

Rate Limiting analog zu `ha_login_participant` fuer `ha_verify_festival_access_code` ergaenzen. Zusaetzlich Mindestlaenge und Komplexitaet fuer Festivalcodes definieren.

Folgeissue empfohlen: ja

### 3. Initialer Festivalcode ist im Migrationsskript fest vorgegeben

Beschreibung:

Die Migration legt `festival_access_code` initial mit `HURRICANE2026` an. Auch wenn Admins den Code spaeter aendern koennen, ist dieser Default im Repository sichtbar und kann in frischen Deployments oder Test-/Preview-Umgebungen versehentlich aktiv bleiben.

Risikoeinschaetzung: mittel

Betroffene Komponenten:

- `supabase/migrations/20260701070000_manage_festival_access_code.sql`
- `docs/installation-and-deployment.md`

Handlungsempfehlung:

Deployment-Schritt dokumentieren oder automatisieren, der den Festivalcode unmittelbar nach Migration rotiert. Alternativ keinen bekannten Default setzen, sondern ein Setup-Skript oder eine Admin-Initialisierung verlangen.

Folgeissue empfohlen: ja

### 4. Admin-RPCs sind fuer anon ausfuehrbar und schuetzen sich intern

Beschreibung:

Adminfunktionen wie Teilnehmer-, Kategorien-, Festivalcode- und Archivverwaltung sind fuer `anon` und `authenticated` granted. Die Funktionen pruefen intern `ha_has_admin_access`, was aktuell der entscheidende Schutz ist. Das Modell funktioniert, vergroessert aber die oeffentliche Angriffsoberflaeche und macht jede Admin-RPC-Validierung sicherheitskritisch.

Risikoeinschaetzung: mittel

Betroffene Komponenten:

- `supabase/migrations/20260628153000_create_participant_management_rpcs.sql`
- `supabase/migrations/20260630100000_create_category_management_rpcs.sql`
- `supabase/migrations/20260630110000_create_festival_name_setting.sql`
- `supabase/migrations/20260630120000_create_festival_archives.sql`
- `supabase/migrations/20260701070000_manage_festival_access_code.sql`

Handlungsempfehlung:

Langfristig echte Supabase Auth, Edge Functions oder kurzlebige Admin-Sessions einsetzen. Kurzfristig sollten Tests sicherstellen, dass jeder Admin-RPC ohne Admincode fehlschlaegt und keine sensiblen Daten ausgibt.

Folgeissue empfohlen: ja

### 5. Teilnehmer-Login-Rate-Limit ist vorhanden, aber schwach

Beschreibung:

`ha_login_participant` sperrt nach 3 Fehlversuchen fuer 30 Sekunden pro technischem Key aus IP/User-Agent. Das reduziert triviales Raten, ist aber bei verteilten Clients, wechselnden User-Agents oder laengeren Angriffen nur begrenzt wirksam.

Risikoeinschaetzung: niedrig

Betroffene Komponenten:

- `supabase/migrations/20260630130000_secure_participant_login.sql`
- `src/data/participants.ts`

Handlungsempfehlung:

Sperrdauer, Backoff und Monitoring definieren. Fuer laengere Nutzung sollten Festival-/Teilnehmercode-Laengen und Entropie dokumentiert und technisch validiert werden.

Folgeissue empfohlen: ja

### 6. Admin-Export enthaelt Teilnehmercodes

Beschreibung:

Der Festivalexport lud Admin-Teilnehmerdaten urspruenglich inklusive `accessCode`. Mit Issue #55 werden Teilnehmercodes standardmaessig aus dem Export entfernt. Ein Export inklusive Codes bleibt nur als explizit aktivierte vertrauliche Option mit Warnhinweis verfuegbar.

Risikoeinschaetzung: mittel

Betroffene Komponenten:

- `src/data/export.ts`
- `src/App.tsx`
- `src/components/AdminFestival.tsx`

Handlungsempfehlung:

Umgesetzt: Standardexport ohne Teilnehmercodes, explizite Option inklusive Warnung fuer vertrauliche Code-Exporte. Exporte mit Codes muessen weiterhin vertraulich behandelt werden.

Folgeissue empfohlen: nein

### 7. Archivtabellen speichern historische Access Codes

Beschreibung:

`ha_archive_festival` kopiert Teilnehmer inklusive `access_code` in `festival_archive_participants`. Direkte Tabellenzugriffe sind gesperrt, aber die Daten bleiben langfristig in der Datenbank erhalten. Wenn Codes nach einem Festival nicht mehr gebraucht werden, ist diese Persistenz unnoetig sensibel.

Risikoeinschaetzung: niedrig

Betroffene Komponenten:

- `supabase/migrations/20260630120000_create_festival_archives.sql`

Handlungsempfehlung:

Klaeren, ob Access Codes in Archiv-Snapshots fachlich notwendig sind. Wenn nicht, beim Archivieren weglassen oder maskiert speichern.

Folgeissue empfohlen: ja

### 8. SECURITY DEFINER-Funktionen sollten regelmaessig gehartet werden

Beschreibung:

Die RPC-Schicht nutzt viele `SECURITY DEFINER`-Funktionen mit `set search_path = public`. Tabellen und Hilfsfunktionen sind ueberwiegend mit `public.` qualifiziert, was gut ist. Trotzdem sollte bei Security-Definer-Funktionen geprueft werden, dass keine untrusted Objekte im Suchpfad missbraucht werden koennen und dass `CREATE`-Rechte auf relevanten Schemas nicht offen sind.

Risikoeinschaetzung: Hinweis

Betroffene Komponenten:

- `supabase/migrations/*.sql`

Handlungsempfehlung:

Ein SQL-Hardening-Review ergaenzen: `CREATE` auf `public` pruefen, Suchpfade standardisieren, Hilfsfunktionen weiterhin nicht oeffentlich ausfuehrbar halten und automatisierte Tests fuer Revoke/Grant-Abdeckung pflegen.

Folgeissue empfohlen: ja

### 9. Admin-Fehlertexte koennen Validierungsdetails offenlegen

Beschreibung:

Einige Admin-Formulare zeigen `Error.message` aus fehlgeschlagenen RPC-Aufrufen an. Die aktuellen Meldungen sind meist Validierungs- oder Berechtigungsfehler, keine Stacktraces. Trotzdem kann dies Details wie doppelte Codes, fehlende Kategorien oder genaue Constraint-Namen indirekt bestaetigen.

Risikoeinschaetzung: niedrig

Betroffene Komponenten:

- `src/components/AdminFestival.tsx`
- `src/components/AdminCategories.tsx`
- `src/App.tsx`

Handlungsempfehlung:

Fehler-Mapping zentralisieren: bekannte Fehlercodes in generische UI-Texte uebersetzen und technische Details nur in Logs oder fuer lokale Entwicklung behalten.

Folgeissue empfohlen: ja

## Empfohlene Folgeissues

1. Teilnehmercodes nicht dauerhaft im Browser speichern und Session-Konzept entwerfen.
2. Rate Limiting fuer `ha_verify_festival_access_code` implementieren.
3. Bekannten Default-Festivalcode aus Migration/Setup-Prozess entfernen oder verpflichtend rotieren.
4. Admin-RPC-Angriffsoberflaeche reduzieren oder mit echten Admin-Sessions absichern.
5. Login-Rate-Limit und Code-Entropie fuer Teilnehmercodes staerken.
6. Admin-Export ohne Teilnehmercodes oder mit expliziter vertraulicher Exportoption anbieten.
7. Access Codes aus Festivalarchiven entfernen oder maskieren.
8. Security-Definer-Hardening fuer alle Supabase-RPCs pruefen.
9. Zentrales Fehler-Mapping fuer UI-Fehler einfuehren.

## Nicht gefundene Risiken

- Keine direkte XSS-Stelle durch `dangerouslySetInnerHTML`, `innerHTML`, `eval` oder dynamische Script-Ausfuehrung gefunden.
- Keine direkte Nutzung von Supabase-Tabellenzugriffen im Frontend gefunden; Datenzugriff laeuft ueber RPC.
- Keine `service_role`-Keys oder nicht-oeffentlichen Secrets im Frontend-Code gefunden.
- Keine bekannte Dependency-Sicherheitsluecke laut `npm.cmd audit`.
- Keine auffaellige SQL Injection durch nutzerkontrolliertes SQL-Stringbuilding gefunden.
- Keine Supabase Storage-Konfiguration im Repository gefunden; deshalb keine Storage-Bucket-Fehlkonfiguration erkennbar.
- Keine produktiven Codeaenderungen vorgenommen; diese Analyse fuegt ausschliesslich dieses Dokument hinzu.
