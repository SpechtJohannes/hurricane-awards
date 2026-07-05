# Sicherheitskonfiguration

Die App verwendet im Browser nur den Supabase anon Key. Der `service_role` Key darf nicht in `VITE_*` Variablen, im Frontend-Bundle oder in Tests verwendet werden.

## Migration

Die SQL-Aenderungen liegen in:

```text
supabase/migrations/20260628123000_secure_data_access.sql
supabase/migrations/20260628133000_restrict_admin_functions.sql
supabase/migrations/20260628143000_add_participant_active_flag.sql
supabase/migrations/20260628153000_create_participant_management_rpcs.sql
supabase/migrations/20260629100000_enforce_data_integrity.sql
supabase/migrations/20260630100000_create_category_management_rpcs.sql
supabase/migrations/20260630110000_create_festival_name_setting.sql
supabase/migrations/20260630120000_create_festival_archives.sql
supabase/migrations/20260630130000_secure_participant_login.sql
supabase/migrations/20260701070000_manage_festival_access_code.sql
supabase/migrations/20260702090000_secure_festival_access_code.sql
supabase/migrations/20260705100000_create_timetable.sql
```

Diese Migration ist auf das aktuelle Live-Schema zugeschnitten:

- `participants(id, name, display_name, access_code, ...)`
- `categories(id, title, description, status, sort_order)`
- `votes(id, voter_id, voted_for_id, category_id, created_at, timestamp)`
- `archived_votes(id, festival, voter_id, voted_for_id, category_id, created_at, archived_at)`
- `app_settings(key, value, updated_at)` fuer zentrale App-Einstellungen wie Festivalname und Festivalcode
- `festival_archives(...)` und zugehoerige `festival_archive_*` Tabellen fuer unveraenderliche Festival-Snapshots
- `festival_days`, `timetable_stages`, `timetable_acts`, `timetable_performances` fuer die technische Timetable-Basis
- `participant_login_attempts(festival_id, technical_key, failed_attempts, locked_until, ...)` fuer serverseitige Login-Sperren ohne Klartextcodes
- `festival_access_attempts(festival_id, technical_key, failed_attempts, locked_until, ...)` fuer serverseitige Festivalcode-Sperren ohne Klartextcodes

Die Migrationen legen keine `festivals` Tabelle an und ergaenzen keine `festival_id` Spalten. Editierbare Festivaleinstellungen liegen stattdessen als einzelne Eintraege wie `festival_name` und `festival_access_code` in `app_settings`.

Die Admin-Folgemigration ergaenzt die minimale Berechtigungsspalte `participants.is_admin boolean not null default false`. Bestehende Teilnehmer werden dadurch standardmaessig normale Teilnehmer. Admins muessen danach explizit markiert werden.

## Direkte Zugriffe

Nach Anwendung der Migration sollen direkte Browserzugriffe mit dem anon Key fehlschlagen:

```ts
supabase.from('participants').select('*')
supabase.from('categories').select('*')
supabase.from('votes').select('*')
supabase.from('archived_votes').select('*')
supabase.from('app_settings').select('*')
supabase.from('festival_archives').select('*')
supabase.from('festival_archive_votes').insert(...)
supabase.from('festival_days').select('*')
supabase.from('timetable_stages').select('*')
supabase.from('timetable_acts').select('*')
supabase.from('timetable_performances').select('*')
supabase.from('votes').insert(...)
supabase.from('categories').update(...)
supabase.from('app_settings').update(...)
supabase.from('all_time_standings').select('*')
```

Der gewuenschte Zugriff laeuft ausschliesslich ueber RPC-Funktionen wie `ha_login_participant`, `ha_list_categories`, `ha_save_vote` und die Admin-RPCs. Der aeltere direkte Teilnehmer-Lookup `ha_find_participant` wird fuer Browserrollen entzogen.

Timetable-Basisdaten werden ebenfalls nicht direkt gelesen, sondern ueber `ha_get_timetable` fuer gueltige Teilnehmercodes bereitgestellt.

## RLS und Rechte

RLS wird fuer diese Tabellen aktiviert:

- `participants`
- `categories`
- `votes`
- `archived_votes`
- `app_settings`
- `festival_access_attempts`
- `festival_archives`
- `festival_archive_participants`
- `festival_archive_categories`
- `festival_archive_votes`
- `festival_days`
- `timetable_stages`
- `timetable_acts`
- `timetable_performances`
- `all_time_standings`, falls es eine Tabelle ist

Fuer `all_time_standings` prueft die Migration zur Laufzeit, ob es eine Tabelle, materialisierte View oder View ist. Bei einer View wird keine RLS Policy erzwungen; stattdessen werden direkte Rechte entzogen und die App nutzt `ha_list_all_time_standings`.

## Teilnehmerrechte

Normale Teilnehmer muessen ihren persoenlichen Teilnehmercode liefern. Die RPCs pruefen serverseitig:

- Der Login laeuft ueber `ha_login_participant`; ungueltige und inaktive Teilnehmercodes liefern nur generische Fehler.
- Wiederholte ungueltige Loginversuche werden in `participant_login_attempts` serverseitig gezaehlt und temporaer gesperrt.
- Fuer das Rate Limiting wird ein technischer Hash aus Festivalkontext und Request-Metadaten gespeichert, nicht der Teilnehmercode im Klartext.
- Teilnehmerlisten enthalten keine Access Codes.
- Teilnehmer duerfen nur ihre eigenen bereits abgegebenen Stimmen als persoenliche Stimmen laden.
- Stimmen koennen nur fuer offene Kategorien, fuer andere existierende Teilnehmer und nur ueber `ha_save_vote` gespeichert werden.
- Ergebnis- und Ranglistendaten werden nur nach gueltigem Teilnehmercode geliefert.

## Adminrechte

Adminfunktionen sind von normalen Teilnehmerfunktionen getrennt:

- `ha_update_category_status`
- `ha_delete_category_votes`
- `ha_admin_list_participants`
- `ha_create_participant`
- `ha_update_participant`
- `ha_deactivate_participant`
- `ha_reactivate_participant`
- `ha_admin_list_categories`
- `ha_create_category`
- `ha_update_category`
- `ha_delete_category`
- `ha_update_festival_name`
- `ha_get_festival_access_code`
- `ha_update_festival_access_code`
- `ha_archive_festival`
- `ha_admin_list_festival_days`
- `ha_create_festival_day`
- `ha_update_festival_day`
- `ha_delete_festival_day`

Adminrechte werden ueber `participants.is_admin` gesteuert. Die App zeigt Adminfunktionen nur fuer Teilnehmer an, deren Login-RPC `is_admin = true` zurueckgibt. Das ist nur Komfort; verbindlich ist die serverseitige Pruefung in `ha_has_admin_access`.

Die Admin-RPCs rufen `ha_has_admin_access` auf. Manipulierte Requests normaler Teilnehmer werden dadurch mit fehlender Berechtigung abgelehnt.

Der Festivalname wird fuer die Anzeige ueber `ha_get_festival_name` gelesen. Aenderungen laufen ausschliesslich ueber `ha_update_festival_name`, validieren einen nicht-leeren Namen serverseitig und sind Admins vorbehalten.

Der gemeinsame Festivalcode wird ueber `ha_verify_festival_access_code` geprueft, ohne den Codewert oeffentlich auszulesen. Fehlversuche werden in `festival_access_attempts` serverseitig gezaehlt und temporaer gesperrt; erfolgreiche Eingaben setzen den passenden Zaehler zurueck. Der Code selbst kann nur von Admins ueber `ha_get_festival_access_code` gelesen und ueber `ha_update_festival_access_code` geaendert werden. Leere Codes werden serverseitig abgelehnt.

Frische Deployments installieren keinen allgemein bekannten Festivalcode. Der initiale Code muss projektspezifisch mit privilegiertem Datenbankzugriff in `app_settings` gesetzt werden.

## Export sensibler Daten

Der JSON-Export enthaelt standardmaessig keine Teilnehmercodes. Admins koennen Teilnehmercodes nur ueber eine explizite Exportoption einschliessen; die UI zeigt dafuer einen Warnhinweis an. Dateien mit Teilnehmercodes sind vertraulich zu behandeln und duerfen nicht in Tickets, Chatverlaeufe, Repositories oder ungeschuetzte Ablagen gelangen.

## Langfristiges Admin-Auth-Konzept

Die aktuelle Admin-Autorisierung bleibt bewusst schlank: Admin-RPCs sind fuer Browserrollen ausfuehrbar, pruefen aber intern `ha_has_admin_access` gegen aktive Adminteilnehmer. Das ist fuer diese App funktionsfaehig, aber Code-basierte Adminrechte bleiben kopierbar und haben keine serverseitige Session-Lebensdauer.

Robusteres Zielbild fuer ein spaeteres Issue:

- Supabase Auth oder eine kleine Edge-Function-Schicht fuer echte Admin-Sessions einfuehren.
- Persoenlichen Teilnehmercode nur noch fuer den initialen Login verwenden und danach kurzlebige, serverseitig pruefbare Session Tokens nutzen.
- Admin-RPCs nicht mehr direkt fuer `anon` als Adminoberflaeche verwenden, sondern Adminoperationen ueber authentifizierte Claims, Rollen oder Edge Functions absichern.
- Adminrechte serverseitig an eine stabile Identitaet binden, nicht an weitergebbare Codes.
- Session-Ablauf, Rotation, Logout und Audit-Logging fuer administrative Aktionen definieren.
- Tests beibehalten, die sicherstellen, dass Admin-RPCs ohne Adminberechtigung keine Daten liefern und keine Mutation ausfuehren.

Festival-Archivierungen laufen ausschliesslich ueber `ha_archive_festival`. Die Funktion kopiert Teilnehmer, Kategorien und Stimmen inklusive Anzeigeinformationen in getrennte Archivtabellen. Diese Archivtabellen haben keine Fremdschluessel auf aktive `participants`, `categories` oder `votes` und sind fuer direkte Browserzugriffe gesperrt.

Archivierte Teilnehmerdaten enthalten keine Teilnehmercodes. Eine Sicherheits-Folgemigration entfernt die alte Archivspalte `festival_archive_participants.access_code`, falls sie in einem bestehenden Deployment bereits angelegt wurde.

Einen Teilnehmer als Admin markieren:

```sql
update public.participants
set is_admin = true
where access_code = 'PERSOENLICHER_TEILNEHMERCODE';
```

## Offene Grenzen

Der gemeinsame Festivalcode ist ein geteilter Zugangscode und deshalb kein Ersatz fuer persoenliche Authentifizierung. Der serverseitige Schutz verhindert direkte Tabellenzugriffe ueber den anon Key, ersetzt aber keine echte Benutzer-Authentifizierung mit kurzlebigen Sessions. Teilnehmercodes werden nur in `sessionStorage` fuer die aktuelle Browser-Session gehalten; fuer hoeheren Schutz sollte spaeter eine Server-/Edge-Function-Schicht kurzlebige Session Tokens ausstellen.
