# i18n

Die Anwendung nutzt `i18next` und `react-i18next` mit Deutsch als Fallback-Sprache. Feste UI-Texte liegen in `de.json` und `nl.json` und werden in React-Komponenten mit `useTranslation()` gelesen.

Die Keys sind nach UI-Bereichen gruppiert, zum Beispiel `hero`, `identity`, `categories`, `results`, `standings`, `admin` und `language`. Dynamische Inhalte aus Supabase wie Kategorien, Teilnehmernamen oder Access Codes bleiben außerhalb der Übersetzungsdateien.

Beim ersten Besuch wird die Browsersprache berücksichtigt, sofern sie unterstützt wird. Die manuell gewählte Sprache wird im Local Storage unter `hurricane-awards-language` gespeichert.
