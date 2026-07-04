# Changelog

All notable changes between releases of this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## v1.2.0

### Features

* Appnavigation für Hauptbereiche eingeführt
* Bereich Festivalinfos ergänzt
* Campstandort für Teilnehmende bereitgestellt
* Festival Playlist über Spotify eingebunden
* Festivalcode per QR Code scanbar gemacht
* Avatarauswahl für Teilnehmende ergänzt
* Bingo Bereich integriert

### Administration

* Admins können Festivalinfos verwalten
* Admins können Campstandort und Spotify Playlist hinterlegen
* Admins können eine Bingorunde starten und schließen

### Technik

* Supabase CLI Workflow für Migrationen eingeführt
* Neue Datenmodelle und Migrationen für Festivalinfos, Avatare und Bingo ergänzt
* Architektur Dokumentation aktualisiert
* Testabdeckung erweitert
* Build Größe analysiert und optimiert

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
