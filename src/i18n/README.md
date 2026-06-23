# i18n

Die Anwendung nutzt aktuell Deutsch als einzige aktive Sprache. Alle sichtbaren festen UI-Texte liegen in `de.json` und werden mit `t("bereich.key")` aus `index.ts` gelesen.

Die Keys sind nach UI-Bereichen gruppiert, zum Beispiel `hero`, `identity`, `categories`, `results`, `standings` und `admin`. Dynamische Inhalte aus Supabase wie Kategorien, Teilnehmernamen oder Access Codes bleiben außerhalb der Übersetzungsdateien.

Für eine weitere Sprache kann später eine zweite Datei wie `nl.json` mit derselben Struktur ergänzt und in `index.ts` als aktive Quelle ausgewählt werden.
