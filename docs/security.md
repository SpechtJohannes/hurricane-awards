# Sicherheitskonfiguration

Die App verwendet im Browser nur den Supabase anon Key. Der `service_role` Key darf nicht in `VITE_*` Variablen, im Frontend-Bundle oder in Tests verwendet werden.

## Migration

Die SQL-Aenderungen liegen in:

```text
supabase/migrations/20260628123000_secure_data_access.sql
```

Diese Migration ist auf das aktuelle Live-Schema zugeschnitten:

- `participants(id, name, display_name, access_code, ...)`
- `categories(id, title, description, status, sort_order)`
- `votes(id, voter_id, voted_for_id, category_id, created_at, timestamp)`
- `archived_votes(id, festival, voter_id, voted_for_id, category_id, created_at, archived_at)`

Die Migration legt keine `festivals` Tabelle an, ergaenzt keine `festival_id` Spalten und veraendert keine bestehenden Daten.

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

Die bestehende App hat keine separate Adminrolle: Jeder erfolgreich angemeldete Teilnehmer kann die Adminansicht oeffnen und dort Kategorien aendern oder Stimmen zuruecksetzen. Die Migration fuehrt deshalb keine neue `is_admin` Spalte ein und verlangt fuer Admin-RPCs denselben serverseitig geprueften Teilnehmercode wie das Frontend bisher. Dadurch bleibt das bestehende Verhalten erhalten, waehrend direkte Tabellenzugriffe gesperrt werden.

Wenn spaeter echte Adminrollen eingefuehrt werden sollen, muss ein eigenes Datenfeld oder eine Auth-Schicht ergaenzt und `ha_has_admin_access` entsprechend verschaerft werden.

## Offene Grenzen

Der gemeinsame Festivalcode liegt weiterhin im statischen Frontend und ist deshalb kein starkes Secret. Der serverseitige Schutz verhindert direkte Tabellenzugriffe ueber den anon Key, ersetzt aber keine echte Benutzer-Authentifizierung mit kurzlebigen Sessions. Fuer hoeheren Schutz sollte spaeter eine Server-/Edge-Function-Schicht Session Tokens ausstellen und Teilnehmercodes nicht dauerhaft im Browser speichern.
