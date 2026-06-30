# Datenbankschema

Diese Dokumentation beschreibt den aktuellen Datenbankstand der Hurricane Awards App als technische Referenz fuer Entwickler. Fuer den groben Systemzusammenhang siehe [Architektur](architecture.md); fuer Sicherheitsdetails siehe [Sicherheitskonfiguration](security.md).

## Ueberblick

Die Datenbank speichert Teilnehmer, Abstimmungskategorien, Stimmen, zentrale App-Einstellungen, Festivalarchive und minimale technische Daten fuer Login-Rate-Limiting. Das Frontend greift aus dem Browser nicht direkt auf geschuetzte Tabellen zu, sondern nutzt Supabase RPC-Funktionen.

Das Schema besteht aus:

- aktiven Festivaldaten: `participants`, `categories`, `votes`
- historisch/kompatibel beruecksichtigten Daten: `archived_votes`
- zentralen Einstellungen: `app_settings`
- unveraenderlichen Festival-Snapshots: `festival_archives` und `festival_archive_*`
- technischem Login-Schutz: `participant_login_attempts`
- optionaler Ergebnisrelation: `all_time_standings`, falls in der Umgebung vorhanden

## Tabellen

### `participants`

Zweck: Speichert die Teilnehmer und ihre Login-/Admin-Eigenschaften.

Wichtigste Spalten:

- `id`: Teilnehmer-ID.
- `name`: Interner Name, aktuell beim Anlegen aus dem Anzeigenamen gesetzt.
- `display_name`: Anzeigename in der UI.
- `access_code`: Persoenlicher Teilnehmercode.
- `is_admin`: Kennzeichnet Adminteilnehmer.
- `is_active`: Steuert, ob ein Teilnehmer sich anmelden und Zugriff erhalten kann.

Primaerschluessel: `id`.

Fremdschluessel: In den vorhandenen Migrationen wird die Basistabelle nicht neu definiert. Andere Tabellen und RPCs referenzieren Teilnehmer logisch ueber `votes.voter_id`, `votes.voted_for_id` und Archivspalten.

Besonderheiten:

- Direkte Browserzugriffe sind per RLS/Grants gesperrt.
- `participants_access_code_upper_unique` erzwingt eindeutige Codes case-insensitive, wenn `access_code` gesetzt ist.
- Adminrechte werden serverseitig ueber `ha_has_admin_access` geprueft.
- Inaktive Teilnehmer werden beim Login wie ungueltige Codes behandelt.

### `categories`

Zweck: Speichert die Abstimmungskategorien.

Wichtigste Spalten:

- `id`: Kategorie-ID.
- `title`: Titel der Kategorie.
- `description`: Beschreibung.
- `status`: Status der Kategorie, verwendet werden `upcoming`, `open` und `closed`.
- `sort_order`: Sortierung fuer Anzeige und Adminverwaltung.

Primaerschluessel: `id`.

Fremdschluessel: Keine in den aktuellen Migrationen neu dokumentierte FK-Definition. `votes.category_id` und Archivdaten beziehen sich logisch auf Kategorien.

Besonderheiten:

- Direkte Browserzugriffe sind gesperrt.
- Stimmen koennen nur fuer Kategorien mit `status = 'open'` gespeichert werden.
- Kategorien mit vorhandenen Eintraegen in `votes` oder `archived_votes` werden durch `ha_delete_category` nicht geloescht.

### `votes`

Zweck: Speichert aktive Stimmen.

Wichtigste Spalten:

- `id`: Vote-ID, im Live-Schema vorhanden.
- `voter_id`: Teilnehmer, der abstimmt.
- `voted_for_id`: Teilnehmer, fuer den gestimmt wird.
- `category_id`: Kategorie der Stimme.
- `created_at`: Erstellzeitpunkt, im Live-Schema vorhanden.
- `timestamp`: fachlicher Zeitstempel der Stimme.

Primaerschluessel: `id`.

Fremdschluessel: Die aktuelle Migrationshistorie definiert die Basistabelle nicht neu. Die RPCs behandeln `voter_id` und `voted_for_id` als Teilnehmerreferenzen und `category_id` als Kategoriereferenz.

Besonderheiten:

- Direkte Browserzugriffe sind gesperrt.
- `votes_voter_category_unique` erzwingt eine Stimme pro Waehler und Kategorie.
- `ha_save_vote` verhindert Selbstvotes, Stimmen in nicht offenen Kategorien und Stimmen fuer nicht vorhandene Zielteilnehmer.

### `archived_votes`

Zweck: Aeltere Archiv-/Historientabelle fuer Stimmen, die weiterhin in Sicherheits- und Integritaetslogik beruecksichtigt wird.

Wichtigste Spalten:

- `id`: Archiv-Vote-ID.
- `festival`: Festivalbezug oder Festivalname.
- `voter_id`: Urspruenglicher Waehler.
- `voted_for_id`: Urspruenglich nominierter Teilnehmer.
- `category_id`: Urspruengliche Kategorie.
- `created_at`: Erstellzeitpunkt.
- `archived_at`: Archivierungszeitpunkt.

Primaerschluessel: `id`.

Fremdschluessel: Nicht in den aktuellen Migrationen neu definiert.

Besonderheiten:

- Direkte Browserzugriffe sind gesperrt.
- `ha_delete_category` prueft `archived_votes`, damit Kategorien mit historischen Stimmen nicht entfernt werden.
- Neuere vollstaendige Festival-Snapshots liegen in den `festival_archive_*` Tabellen.

### `app_settings`

Zweck: Speichert zentrale App-Einstellungen.

Wichtigste Spalten:

- `key`: Einstellungsname.
- `value`: Einstellungswert.
- `updated_at`: Zeitpunkt der letzten Aenderung.

Primaerschluessel: `key`.

Fremdschluessel: Keine.

Besonderheiten:

- Aktuell wird `festival_name` als zentraler Festivalname gespeichert.
- `app_settings_value_not_blank` verhindert leere Werte.
- Lesen erfolgt ueber `ha_get_festival_name`; Schreiben ueber `ha_update_festival_name` mit Adminschutz.
- Direkte Browserzugriffe sind gesperrt.

### `festival_archives`

Zweck: Kopfdatensatz eines unveraenderlichen Festival-Snapshots.

Wichtigste Spalten:

- `id`: Archiv-ID.
- `festival_name`: Festivalname zum Archivierungszeitpunkt.
- `archived_at`: Archivierungszeitpunkt.
- `version_label`: Optionales Versionslabel.
- `created_by_participant_id`: Optionaler Adminteilnehmer, der archiviert hat.

Primaerschluessel: `id`.

Fremdschluessel: Keine aktive FK-Beziehung auf `participants`; `created_by_participant_id` ist bewusst nullable.

Besonderheiten:

- Wird durch `ha_archive_festival` angelegt.
- Direkte Browserzugriffe sind gesperrt.
- Archivdaten sind von aktiven Tabellen getrennt.

### `festival_archive_participants`

Zweck: Teilnehmerdaten innerhalb eines Festival-Snapshots.

Wichtigste Spalten:

- `id`: Archiv-Teilnehmerdatensatz.
- `archive_id`: Zugehoeriges Archiv.
- `original_participant_id`: Urspruengliche Teilnehmer-ID, falls als UUID interpretierbar.
- `display_name`: Anzeigename zum Archivierungszeitpunkt.
- `access_code`: Teilnehmercode zum Archivierungszeitpunkt.
- `is_admin`: Adminstatus zum Archivierungszeitpunkt.
- `is_active`: Aktivstatus zum Archivierungszeitpunkt.

Primaerschluessel: `id`.

Fremdschluessel:

- `archive_id` referenziert `festival_archives(id)`.

Besonderheiten:

- Keine FK-Beziehung auf aktive `participants`.
- Direkte Browserzugriffe sind gesperrt.

### `festival_archive_categories`

Zweck: Kategoriedaten innerhalb eines Festival-Snapshots.

Wichtigste Spalten:

- `id`: Archiv-Kategoriedatensatz.
- `archive_id`: Zugehoeriges Archiv.
- `original_category_id`: Urspruengliche Kategorie-ID, falls als UUID interpretierbar.
- `name`: Kategorie-Titel zum Archivierungszeitpunkt.
- `description`: Beschreibung zum Archivierungszeitpunkt.
- `sort_order`: Sortierung zum Archivierungszeitpunkt.
- `is_active`: Boolean-Ableitung aus `categories.status = 'open'` zum Archivierungszeitpunkt.

Primaerschluessel: `id`.

Fremdschluessel:

- `archive_id` referenziert `festival_archives(id)`.

Besonderheiten:

- Keine FK-Beziehung auf aktive `categories`.
- Direkte Browserzugriffe sind gesperrt.

### `festival_archive_votes`

Zweck: Stimmen innerhalb eines Festival-Snapshots inklusive Anzeigeinformationen.

Wichtigste Spalten:

- `id`: Archiv-Stimmendatensatz.
- `archive_id`: Zugehoeriges Archiv.
- `original_vote_id`: Urspruengliche Vote-ID, aktuell beim Archivieren `null`.
- `original_voter_id`: Urspruenglicher Waehler, falls als UUID interpretierbar.
- `original_category_id`: Urspruengliche Kategorie, falls als UUID interpretierbar.
- `original_nominee_id`: Urspruenglich nominierter Teilnehmer, falls als UUID interpretierbar.
- `voter_display_name`: Anzeigename des Waehlers zum Archivierungszeitpunkt.
- `category_name`: Kategoriename zum Archivierungszeitpunkt.
- `nominee_display_name`: Anzeigename des Nominierten zum Archivierungszeitpunkt.

Primaerschluessel: `id`.

Fremdschluessel:

- `archive_id` referenziert `festival_archives(id)`.

Besonderheiten:

- Speichert Anzeigeinformationen redundant, damit Archivdaten unabhaengig von aktiven Tabellen lesbar bleiben.
- Keine FK-Beziehungen auf aktive `votes`, `participants` oder `categories`.
- Direkte Browserzugriffe sind gesperrt.

### `participant_login_attempts`

Zweck: Minimale technische Daten fuer serverseitiges Rate-Limiting beim Teilnehmerlogin.

Wichtigste Spalten:

- `festival_id`: Festival-Kontext, aktuell default `current`.
- `technical_key`: Hash aus Festivalkontext und Request-Metadaten.
- `failed_attempts`: Anzahl fehlgeschlagener Versuche im aktuellen Fenster.
- `locked_until`: Zeitpunkt, bis zu dem weitere Loginversuche blockiert sind.
- `last_failed_at`: Zeitpunkt des letzten Fehlversuchs.
- `updated_at`: Zeitpunkt der letzten Aktualisierung.

Primaerschluessel: `(festival_id, technical_key)`.

Fremdschluessel: Keine.

Besonderheiten:

- Speichert keine Teilnehmercodes im Klartext.
- `participant_login_attempts_failed_attempts_valid` verhindert negative Zaehler.
- Alte, abgelaufene Daten werden in `ha_login_participant` bereinigt bzw. ignoriert.
- Direkte Browserzugriffe sind gesperrt.

## Beziehungen

Die aktiven Daten bilden fachlich diesen Kern:

- Ein Teilnehmer kann viele Stimmen abgeben: `participants.id` zu `votes.voter_id`.
- Ein Teilnehmer kann in vielen Stimmen nominiert werden: `participants.id` zu `votes.voted_for_id`.
- Eine Kategorie kann viele Stimmen enthalten: `categories.id` zu `votes.category_id`.
- Ein Festivalarchiv hat viele archivierte Teilnehmer, Kategorien und Stimmen ueber `archive_id`.
- Archivtabellen speichern urspruengliche IDs als Werte, referenzieren aber bewusst keine aktiven Tabellen.
- `participant_login_attempts` ist technisch isoliert und hat keine fachlichen Beziehungen.

```mermaid
erDiagram
  PARTICIPANTS ||--o{ VOTES : voter
  PARTICIPANTS ||--o{ VOTES : nominee
  CATEGORIES ||--o{ VOTES : category

  FESTIVAL_ARCHIVES ||--o{ FESTIVAL_ARCHIVE_PARTICIPANTS : contains
  FESTIVAL_ARCHIVES ||--o{ FESTIVAL_ARCHIVE_CATEGORIES : contains
  FESTIVAL_ARCHIVES ||--o{ FESTIVAL_ARCHIVE_VOTES : contains

  APP_SETTINGS {
    text key PK
    text value
    timestamptz updated_at
  }

  PARTICIPANT_LOGIN_ATTEMPTS {
    text festival_id PK
    text technical_key PK
    integer failed_attempts
    timestamptz locked_until
  }
```

## Views

Die vorhandenen Migrationen erstellen keine View und keine Materialized View.

Die App kennt jedoch die Relation `all_time_standings`. Die Sicherheitsmigration behandelt sie bewusst flexibel:

- Wenn `all_time_standings` eine Tabelle ist, wird RLS aktiviert.
- Wenn sie eine View oder Materialized View ist, werden direkte Rechte entzogen und der Zugriff laeuft ueber `ha_list_all_time_standings`.
- Wenn sie nicht existiert, wirft `ha_list_all_time_standings` zur Laufzeit einen Fehler.

Erwartete Spalten fuer die App:

- `participant_id`
- `participant_name`
- `total_points`

## RPC-Funktionen

Dies ist keine vollstaendige API-Referenz, sondern eine Gruppierung der wichtigsten RPCs.

### Login

- `ha_login_participant`: Prueft Teilnehmercodes, beruecksichtigt `is_active`, zaehlt Fehlversuche und gibt `success`, `invalid` oder `blocked` zurueck.
- `ha_login_rate_limit_key`: Erzeugt den technischen Hash fuer Rate-Limiting.

### Teilnehmer

- `ha_list_participants`: Listet Teilnehmer ohne Access Codes fuer angemeldete Teilnehmer.
- `ha_admin_list_participants`: Adminliste inklusive Codes und Status.
- `ha_suggest_participant_access_code`: Generiert einen neuen Codevorschlag.
- `ha_create_participant`, `ha_update_participant`: Admin-RPCs fuer Teilnehmerpflege.
- `ha_deactivate_participant`, `ha_reactivate_participant`: Admin-RPCs fuer Aktivstatus.

### Kategorien

- `ha_list_categories`: Kategorien fuer angemeldete Teilnehmer.
- `ha_admin_list_categories`: Kategorien fuer Admins inklusive Sortierung.
- `ha_create_category`, `ha_update_category`, `ha_update_category_status`, `ha_delete_category`: Admin-RPCs fuer Kategorien.

### Votes

- `ha_list_participant_votes`: Eigene Stimmen eines Teilnehmers.
- `ha_list_result_votes`: Stimmen fuer Ergebnisanzeigen.
- `ha_save_vote`: Speichert eine Stimme mit serverseitiger Validierung.
- `ha_delete_category_votes`: Entfernt Stimmen einer Kategorie als Adminfunktion.

### Festival

- `ha_get_festival_name`: Liest den zentralen Festivalnamen.
- `ha_update_festival_name`: Aktualisiert den Festivalnamen mit Adminschutz.
- `ha_list_all_time_standings`: Liefert das Gesamtclassement, falls `all_time_standings` vorhanden ist.

### Archivierung

- `ha_archive_festival`: Erstellt einen Snapshot aus Teilnehmern, Kategorien und Stimmen in den Festivalarchivtabellen.

## Sicherheitskonzept

- Row Level Security ist fuer geschuetzte Tabellen aktiviert.
- Direkte Tabellenrechte fuer `anon` und `authenticated` sind fuer geschuetzte Tabellen entzogen.
- Browserzugriffe laufen ueber gezielte `SECURITY DEFINER` RPC-Funktionen.
- Adminrechte werden serverseitig ueber `ha_has_admin_access` und aktive Adminteilnehmer geprueft.
- Teilnehmerzugriffe pruefen den Teilnehmercode serverseitig ueber Hilfsfunktionen wie `ha_participant_id_for_access`.
- Login-Rate-Limiting laeuft serverseitig ueber `participant_login_attempts`; Klartextcodes werden dort nicht gespeichert.
- Der aeltere direkte Login-Lookup `ha_find_participant` ist fuer Browserrollen entzogen.

## Wartung

- Schemaaenderungen immer als neue Migration unter `supabase/migrations` erfassen.
- Neue Tabellen, Spalten, Indizes, Policies, Grants und RPCs in diesem Dokument nachziehen.
- Sicherheitsrelevante Aenderungen auch in [docs/security.md](security.md) pruefen.
- Architekturveraenderungen mit [docs/architecture.md](architecture.md) abgleichen.
- Bei neuen sichtbaren UI-Auswirkungen die Tests und Uebersetzungsdateien pruefen.
- Migrationstests in `src/test/securityMigration.test.ts` aktualisieren, wenn sich Struktur oder Sicherheitsannahmen aendern.
