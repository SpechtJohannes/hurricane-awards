# Changelog

All notable changes between releases of this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## v1.6.0 - Even Management

### ✨ Neue Funktionen

- Dashboard reagiert nun auf den aktuellen Eventstatus und kann Inhalte abhängig von der Phase des Events priorisieren.
- Administratoren können den Eventzeitraum verwalten.
- Das Dashboard zeigt vor dem Event einen Countdown, während des Events den aktuellen Eventtag und nach dem Event einen Abschlussstatus.
- Abstimmungen und Awards wurden in zwei eigenständige Bereiche getrennt.
- Zufällige Paarungsaktionen können vollständig zurückgesetzt und anschließend erneut ausgelost werden.

### 🎨 Verbesserungen

- Allgemeine Benutzeroberfläche verwendet nun den neutralen Begriff Event, sofern kein expliziter Festivalbezug besteht.
- Deutsche Umlaute und Sonderzeichen werden in der gesamten Anwendung korrekt dargestellt.
- Navigation und Benutzerführung rund um Abstimmungen und Awards wurden vereinfacht.

### 🛠️ Technische Änderungen

- Zentrale Logik zur Ermittlung des Eventstatus geschaffen.
- Eventzeitraum dient als gemeinsame Datengrundlage für zeitabhängige Funktionen.
- Internationalisierung erweitert und vereinheitlicht.
- Tests und Dokumentation aktualisiert.

## v1.5.0 – Festivalspiele

### ✨ Neue Features

- KO Turniere können vollständig innerhalb der App erstellt und verwaltet werden.
- Automatische Auslosung inklusive Freilosen bei ungerader Teilnehmerzahl.
- Turnierbaum mit mobiler Darstellung und automatischer Fortschreibung der Gewinner.
- Ergebnisse können nachträglich geändert werden, abhängige Begegnungen werden konsistent neu berechnet.
- Zufällige Paarungen für beliebige Aktionen wie Secret Buddy oder Wichteln.
- Teilnehmende sehen ausschließlich ihre eigene Zuordnung.

### 🛠 Verbesserungen

- Automatische Fortschreibung von Freilosen über alle Turnierrunden hinweg verbessert.
- Zusätzliche automatisierte Tests für Turnierlogik und Migrationen.

## v1.4.0

### UI und Nutzerführung

Diese Version verbessert die Bedienbarkeit und das visuelle Gesamtbild der App deutlich. Die Startseite wurde zu einem persönlichen Dashboard weiterentwickelt und dient nun als zentrale Navigation in die wichtigsten App Bereiche.

### Änderungen

- Die Startseite zeigt nun ein persönliches Dashboard mit Statusinformationen und direkten Einstiegen in die Hauptbereiche.
- Aus allen Hauptbereichen ist eine Rückkehr zum Dashboard möglich.
- Das Header Konzept wurde vereinheitlicht und kompakter gestaltet.
- Der Profilbereich reagiert nun besser auf den aktuellen Loginstatus.
- Der ausgewählte Avatar wird deutlicher hervorgehoben.
- Der Bingo Bereich enthält nun eine kurze Erklärung zur Funktionsweise.
- Der Bereich Spiele wurde als Einstieg für Bingo und künftige Spiele eingeführt.
- Bei nicht aktiven Abstimmungen wird ein verständlicher Hinweis angezeigt.
- Im Timetable werden Tage ohne Auftritte ausgeblendet.
- Ein konsistentes Farbsystem verbessert die visuelle Orientierung in der App.
- Fehlerhafte Tests wurden korrigiert.

## v1.3.0

### Timetable

Der Festival Timetable wurde vollständig in die App integriert und ermöglicht die Planung des Festivalwochenendes direkt innerhalb der Anwendung.

#### Neu

- Mehrtägiger Timetable mit Bühnen und Auftritten
- Verwaltung von Bühnen, Acts und Auftritten im Administrationsbereich
- Hervorhebung der Bühnen durch individuelle Farben
- Persönliche Favoriten können direkt im Timetable markiert werden
- Gemeinsame Favoriten anderer Teilnehmender werden angezeigt und erleichtern die gemeinsame Festivalplanung

#### Verbessert

- Darstellung und Bedienung des Timetables optimiert
- Performance verbessert
- Usability überarbeitet
- Tests und Dokumentation ergänzt
- Vollständige Mehrsprachigkeit für das Timetable Feature

## v1.2.0

### Features

- Appnavigation für Hauptbereiche eingeführt
- Bereich Festivalinfos ergänzt
- Campstandort für Teilnehmende bereitgestellt
- Festival Playlist über Spotify eingebunden
- Festivalcode per QR Code scanbar gemacht
- Avatarauswahl für Teilnehmende ergänzt
- Bingo Bereich integriert

### Administration

- Admins können Festivalinfos verwalten
- Admins können Campstandort und Spotify Playlist hinterlegen
- Admins können eine Bingorunde starten und schließen

### Technik

- Supabase CLI Workflow für Migrationen eingeführt
- Neue Datenmodelle und Migrationen für Festivalinfos, Avatare und Bingo ergänzt
- Architektur Dokumentation aktualisiert
- Testabdeckung erweitert
- Build Größe analysiert und optimiert

## [1.1.0]

### Authentication & Security

- Added festival login for secured festival access.
- Added participant login for authenticated participant workflows.
- Added administrator access control for protected administration areas.

### Administration

- Added participant management for maintaining festival participants.
- Added participant access code management.
- Added category management.
- Added festival management.
- Added festival archive support.
- Added JSON export for festival data.

### User Experience

- Added Progressive Web App support.
- Added a PWA installation hint.
- Added German and Dutch translations.

### Documentation

- Added an administration manual.
- Added an imprint.
- Added a privacy policy.

### Technical Improvements

- Added database migrations.
- Extended unit test coverage.
- Improved application security.
