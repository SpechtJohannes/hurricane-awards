# Sicherheitskonfiguration

Die App verwendet im Browser nur den Supabase anon Key. Der `service_role` Key darf nicht in `VITE_*` Variablen, im Frontend-Bundle oder in Tests verwendet werden.

## Migration

Die SQL-Aenderungen liegen in:

```text
supabase/migrations/20260628123000_secure_data_access.sql
supabase/migrations/20260628133000_restrict_admin_functions.sql
```

Diese Migration ist auf das aktuelle Live-Schema zugeschnitten:

- `participants(id, name, display_name, access_code, ...)`
- `categories(id, title, description, status, sort_order)`
- `votes(id, voter_id, voted_for_id, category_id, created_at, timestamp)`
- `archived_votes(id, festival, voter_id, voted_for_id, category_id, created_at, archived_at)`

Die Basismigration legt keine `festivals` Tabelle an, ergaenzt keine `festival_id` Spalten und veraendert keine bestehenden Daten.

Die Admin-Folgemigration ergaenzt die minimale Berechtigungsspalte `participants.is_admin boolean not null default false`. Bestehende Teilnehmer werden dadurch standardmaessig normale Teilnehmer. Admins muessen danach explizit markiert werden.

## Direkte Zugriffe

Nach Anwendung der Migration sollen direkte Browserzugriffe mit dem anon Key fehlschlagen:

```ts
supabase.from('participants').select('*')
supabase.from('categories').select('*')
supabase.from('votes').select('*')
supabase.from('archived_votes').select('*')
supabase.from('votes').insert(...)
supabase.from('categories').update(...)
supabase.from('all_time_standings').select('*')
```

Der gewuenschte Zugriff laeuft ausschliesslich ueber RPC-Funktionen wie `ha_find_participant`, `ha_list_categories`, `ha_save_vote` und die Admin-RPCs.

## RLS und Rechte

RLS wird fuer diese Tabellen aktiviert:

- `participants`
- `categories`
- `votes`
- `archived_votes`
- `all_time_standings`, falls es eine Tabelle ist

Fuer `all_time_standings` prueft die Migration zur Laufzeit, ob es eine Tabelle, materialisierte View oder View ist. Bei einer View wird keine RLS Policy erzwungen; stattdessen werden direkte Rechte entzogen und die App nutzt `ha_list_all_time_standings`.

## Teilnehmerrechte

Normale Teilnehmer muessen ihren persoenlichen Teilnehmercode liefern. Die RPCs pruefen serverseitig:

- Teilnehmercode existiert.
- Teilnehmerlisten enthalten keine Access Codes.
- Teilnehmer duerfen nur ihre eigenen bereits abgegebenen Stimmen als persoenliche Stimmen laden.
- Stimmen koennen nur fuer offene Kategorien, fuer andere existierende Teilnehmer und nur ueber `ha_save_vote` gespeichert werden.
- Ergebnis- und Ranglistendaten werden nur nach gueltigem Teilnehmercode geliefert.

## Adminrechte

Adminfunktionen sind von normalen Teilnehmerfunktionen getrennt:

- `ha_update_category_status`
- `ha_delete_category_votes`

Adminrechte werden ueber `participants.is_admin` gesteuert. Die App zeigt Adminfunktionen nur fuer Teilnehmer an, deren Login-RPC `is_admin = true` zurueckgibt. Das ist nur Komfort; verbindlich ist die serverseitige Pruefung in `ha_has_admin_access`.

Die Admin-RPCs `ha_update_category_status` und `ha_delete_category_votes` rufen `ha_has_admin_access` auf. Manipulierte Requests normaler Teilnehmer werden dadurch mit fehlender Berechtigung abgelehnt.

Einen Teilnehmer als Admin markieren:

```sql
update public.participants
set is_admin = true
where access_code = 'PERSOENLICHER_TEILNEHMERCODE';
```

## Offene Grenzen

Der gemeinsame Festivalcode liegt weiterhin im statischen Frontend und ist deshalb kein starkes Secret. Der serverseitige Schutz verhindert direkte Tabellenzugriffe ueber den anon Key, ersetzt aber keine echte Benutzer-Authentifizierung mit kurzlebigen Sessions. Fuer hoeheren Schutz sollte spaeter eine Server-/Edge-Function-Schicht Session Tokens ausstellen und Teilnehmercodes nicht dauerhaft im Browser speichern.
