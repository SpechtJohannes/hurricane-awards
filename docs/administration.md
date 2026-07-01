# Administrationshandbuch

## Inhalt

1. Einleitung
2. Anmeldung als Administrator
3. Ein neues Festival vorbereiten
4. Teilnehmer verwalten
5. Kategorien verwalten
6. Festivaleinstellungen
7. Während des Festivals
8. Nach dem Festival
9. Häufige Probleme

## Einleitung

Dieses Handbuch begleitet den gesamten Lebenszyklus eines Festivals, von der Vorbereitung über die Durchführung bis zur Archivierung der Ergebnisse.

Dieses Handbuch richtet sich an Administratoren der Festival App. Es erklärt, wie du ein Festival vorbereitest, Teilnehmer und Kategorien verwaltest, Abstimmungen während des Festivals begleitest und die Ergebnisse nach dem Festival sicherst.

Das Handbuch setzt keine Entwicklerkenntnisse voraus. Es beschreibt nur Funktionen, die in der App für Administratoren verfügbar sind.

## Anmeldung als Administrator

Die App hat zwei Zugangsschritte:

1. Öffne die Festival App.
2. Gib den Festivalcode ein, wenn die App danach fragt.
3. Gib deinen persönlichen Teilnehmercode ein.

Wenn dein Teilnehmerkonto Administratorrechte hat, erscheint oben rechts die Schaltfläche **Admin**. Über diese Schaltfläche öffnest du den Adminbereich. Dort kannst du Festivalname, Teilnehmer und Kategorien verwalten, das Festival archivieren und einen JSON-Export erstellen.

Wenn die Schaltfläche **Admin** nicht sichtbar ist, bist du entweder nicht angemeldet, dein Teilnehmercode gehört nicht zu einem Administrator, oder dein Teilnehmerkonto ist deaktiviert.

## Ein neues Festival vorbereiten

Empfohlene Reihenfolge:

1. **Festivalname festlegen**

   Öffne den Adminbereich und ändere im Abschnitt **Festival** den Festivalnamen. Speichere die Änderung. Der neue Name wird direkt in der App angezeigt.

2. **Festivalcode festlegen**

   Der Festivalcode schützt den ersten Zugang zur App. Im Adminbereich gibt es aktuell keine Funktion, mit der du den Festivalcode anzeigen oder ändern kannst. Wenn ein neuer Festivalcode benötigt wird, kläre das vor dem Festival mit der Person, die die App bereitstellt.

3. **Teilnehmer anlegen**

   Lege alle Teilnehmer im Abschnitt **Teilnehmer** an. Jeder Teilnehmer benötigt einen Anzeigenamen und einen Teilnehmercode. Beim Anlegen schlägt die App einen Code vor.

4. **Kategorien anlegen**

   Lege im Abschnitt **Kategorien** alle Abstimmungskategorien an. Setze neue Kategorien zunächst am besten auf **Demnächst**, bis die Abstimmung wirklich starten soll.

5. **Funktionstest durchführen**

   Prüfe vor dem Festival mindestens:

   - Kann sich ein normaler Teilnehmer mit Festivalcode und Teilnehmercode anmelden?
   - Sieht ein normaler Teilnehmer keinen Adminbereich?
   - Kann sich ein Administrator anmelden und den Adminbereich öffnen?
   - Werden Teilnehmer und Kategorien korrekt angezeigt?
   - Werden offene Kategorien zur Abstimmung angeboten?
   - Werden Ergebnisse angezeigt, sobald Stimmen vorhanden sind?

   Wichtig: Stimmen können aktuell nicht im Adminbereich zurückgesetzt werden. Gib Teststimmen deshalb nur ab, wenn diese im Festivalstand bleiben dürfen.

## Teilnehmer verwalten

Teilnehmer werden im Adminbereich nicht gelöscht. Es gibt keine Schaltfläche zum Löschen von Teilnehmern. Wenn jemand nicht mehr teilnehmen soll, wird der Teilnehmer deaktiviert.

### Teilnehmer anlegen

1. Öffne den Adminbereich.
2. Gehe zum Abschnitt **Teilnehmer**.
3. Klicke auf **Teilnehmer anlegen**.
4. Trage den Anzeigenamen ein.
5. Prüfe den vorgeschlagenen Teilnehmercode oder ändere ihn.
6. Speichere den Teilnehmer.

Der Teilnehmer kann sich danach mit diesem Code anmelden, solange er aktiv ist.

### Namen bearbeiten

1. Klicke beim Teilnehmer auf **Bearbeiten**.
2. Ändere den Anzeigenamen.
3. Speichere die Änderung.

Der Anzeigename wird in der App und in den Ergebnisanzeigen verwendet.

### Zugangscode ändern

1. Klicke beim Teilnehmer auf **Bearbeiten**.
2. Ändere den Teilnehmercode im Feld **Teilnehmercode**.
3. Speichere die Änderung.
4. Teile den neuen Code nur der betroffenen Person mit.

Der alte Code ist danach nicht mehr gültig.

### Zugangscode neu generieren

Beim Anlegen eines neuen Teilnehmers schlägt die App automatisch einen Teilnehmercode vor. Für bestehende Teilnehmer gibt es aktuell keine eigene Schaltfläche zum automatischen Neugenerieren.

Wenn ein bestehender Teilnehmer einen neuen Code braucht, bearbeite den Teilnehmer und trage einen neuen Code manuell ein.

### Teilnehmer deaktivieren

1. Suche den Teilnehmer im Abschnitt **Teilnehmer**.
2. Klicke auf **Deaktivieren**.
3. Bestätige die Rückfrage.

Ein deaktivierter Teilnehmer kann sich nicht mehr anmelden. Bereits abgegebene Stimmen bleiben erhalten.

### Teilnehmer wieder aktivieren

1. Suche den deaktivierten Teilnehmer im Abschnitt **Teilnehmer**.
2. Klicke auf **Reaktivieren**.

Der Teilnehmer kann sich danach wieder mit seinem gespeicherten Teilnehmercode anmelden.

## Kategorien verwalten

Kategorien steuern, wofür Teilnehmer abstimmen können.

### Bedeutung der Kategorienstatus

- **Demnächst**: Die Kategorie ist vorbereitet, aber noch nicht zur Abstimmung geöffnet.
- **Offen**: Teilnehmer können in dieser Kategorie abstimmen.
- **Geschlossen**: Die Kategorie ist beendet. Sie wird nicht mehr zur Abstimmung angeboten. Ergebnisse können weiterhin angezeigt werden.

### Kategorie anlegen

1. Öffne den Adminbereich.
2. Gehe zum Abschnitt **Kategorien**.
3. Klicke auf **Kategorie anlegen**.
4. Trage Titel und Beschreibung ein.
5. Wähle den Status.
6. Trage optional eine Sortierung ein.
7. Speichere die Kategorie.

### Kategorie bearbeiten

1. Klicke bei der Kategorie auf **Bearbeiten**.
2. Ändere Titel, Beschreibung, Status oder Sortierung.
3. Speichere die Änderung.

### Aktivieren

Setze den Status einer Kategorie auf **Offen**. Teilnehmer können danach in dieser Kategorie abstimmen.

### Deaktivieren

Setze den Status einer Kategorie auf **Demnächst** oder **Geschlossen**:

- **Demnächst** eignet sich für Kategorien, die noch nicht gestartet sind.
- **Geschlossen** eignet sich für Kategorien, deren Abstimmung beendet ist.

### Stimmen zurücksetzen

Das Zurücksetzen von Stimmen ist aktuell nicht als Adminfunktion in der App verfügbar. Im Adminbereich gibt es keine Schaltfläche, mit der du Stimmen einer Kategorie oder alle Stimmen zurücksetzen kannst.

Wenn eine Kategorie Stimmen enthält, werden diese Stimmen weiterhin für die Ergebnisse berücksichtigt. Prüfe Kategorien deshalb vor dem Öffnen besonders sorgfältig.

### Kategorie löschen

1. Klicke bei der Kategorie auf **Löschen**.
2. Bestätige die Rückfrage.

Eine Kategorie kann nur gelöscht werden, wenn noch keine Stimmen für sie vorhanden sind. Kategorien mit vorhandenen Stimmen können im Adminbereich nicht gelöscht werden. Wenn du es trotzdem versuchst, zeigt die App eine Fehlermeldung an. In diesem Fall kannst du die Kategorie schließen, aber nicht löschen.

## Festivaleinstellungen

### Festivalname ändern

1. Öffne den Adminbereich.
2. Gehe zum Abschnitt **Festival**.
3. Ändere den Festivalnamen.
4. Klicke auf **Festivalname speichern**.

Der neue Name wird direkt in der App verwendet.

### Festivalcode ändern

Der Festivalcode kann aktuell nicht im Adminbereich geändert werden. Im Adminbereich gibt es dafür kein Eingabefeld und keine Speichern-Schaltfläche. Wenn der Festivalcode geändert werden muss, wende dich an die Person, die die App bereitstellt.

### Festival archivieren

Mit **Festival archivieren** erstellt die App einen Snapshot des aktuellen Festivalstands. Dazu gehören Teilnehmer, Kategorien und Stimmen zum Zeitpunkt der Archivierung.

Die Archivierung setzt die laufende App nicht zurück. Der aktuelle Festivalstand bleibt nach der Archivierung unverändert.

Empfehlung: Erstelle vor der Archivierung zuerst einen JSON-Export der Ergebnisse.

### Archiv öffnen

Das Öffnen oder Auswählen archivierter Festivals ist aktuell nicht als Adminfunktion in der App verfügbar. Im Adminbereich gibt es keine Archivliste und keine Schaltfläche, um ein archiviertes Festival zu laden.

### Ergebnisse als JSON exportieren

1. Öffne den Adminbereich.
2. Gehe zum Abschnitt **Festival**.
3. Klicke auf **JSON exportieren**.

Die App lädt eine JSON-Datei herunter. Der Export enthält Rohdaten des aktuellen Festivals, darunter Festivalinformationen, Teilnehmer inklusive Zugangscodes und Adminstatus, Kategorien, abgegebene Stimmen, Exportzeitpunkt und Formatversion.

Der Export enthält keine berechneten Ranglisten.

## Während des Festivals

Typische administrative Aufgaben während des Festivals:

- Teilnehmer bei Loginproblemen unterstützen.
- Teilnehmercodes prüfen oder bei Bedarf manuell ändern.
- Neue Teilnehmer anlegen, falls kurzfristig jemand hinzukommt.
- Kategorien zum richtigen Zeitpunkt auf **Offen** setzen.
- Beendete Kategorien auf **Geschlossen** setzen.
- Ergebnisse prüfen, sobald Stimmen abgegeben wurden.
- Kategorien nur dann löschen, wenn sicher noch keine Stimmen vorhanden sind.

## Nach dem Festival

Empfohlener Ablauf:

1. **Ergebnisse als JSON exportieren**

   Erstelle zuerst einen JSON-Export und bewahre die Datei sicher auf.

2. **Festival archivieren**

   Archiviere danach das Festival über den Adminbereich.
   
3. **Neues Festival vorbereiten**

   Bereite anschließend den nächsten Festivalstand vor: Festivalnamen anpassen, Teilnehmer prüfen oder neu anlegen und Kategorien vorbereiten.

   Beachte: Ein vollständiges Zurücksetzen aller Stimmen ist aktuell nicht als Adminfunktion in der App verfügbar. Plane den nächsten Festivalstand deshalb entsprechend sorgfältig.

## Häufige Probleme

### Teilnehmer kann sich nicht anmelden

Prüfe:

- Wurde zuerst der richtige Festivalcode eingegeben?
- Ist der Teilnehmercode korrekt geschrieben?
- Ist der Teilnehmer aktiv?
- Wurde der Teilnehmercode kürzlich geändert?

Wenn zu viele falsche Loginversuche gemacht wurden, sperrt die App die Eingabe kurzzeitig. Warte in diesem Fall, bis der Countdown abgelaufen ist.

### Kategorie fehlt

Prüfe:

- Ist die Kategorie im Adminbereich vorhanden?
- Hat die Kategorie den erwarteten Status?
- Für die Abstimmung müssen Kategorien auf **Offen** stehen.
- Kategorien mit **Demnächst** oder **Geschlossen** werden nicht als offene Abstimmung angeboten.

### Ergebnisse stimmen nicht

Prüfe:

- Sind die erwarteten Kategorien geöffnet oder geschlossen?
- Haben Teilnehmer möglicherweise noch nicht abgestimmt?
- Wurde in der richtigen Kategorie abgestimmt?
- Wurde ein Teilnehmer deaktiviert? Bereits abgegebene Stimmen bleiben trotzdem erhalten.

Der JSON-Export enthält die Rohdaten und kann helfen, die abgegebenen Stimmen nachzuvollziehen.

### Export funktioniert nicht

Prüfe:

- Bist du als Administrator angemeldet?
- Ist der Adminbereich geöffnet?
- Blockiert der Browser Downloads?
- Besteht eine Verbindung zur App?

Wenn der Export weiterhin fehlschlägt, versuche es nach einem Neuladen der App erneut.
