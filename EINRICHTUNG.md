# HEP Berichte Workflow - Einrichtungsanleitung

Diese Anleitung fuehrt dich Schritt fuer Schritt durch die Einrichtung des kompletten Systems.

---

## Uebersicht der Komponenten

| Komponente | Beschreibung | Speicherort |
|------------|--------------|-------------|
| PWA (Web App) | Upload-Interface fuers iPhone | `/webapp/` |
| n8n Workflow | Automatisierung | `/n8n/hep-bericht-workflow.json` |
| Prompts | KI-Anweisungen | `/prompts/prompts.md` |

---

## Schritt 1: Google Cloud einrichten

### 1.1 Projekt erstellen
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Klicke auf "Neues Projekt erstellen"
3. Name: `HEP-Workflow`
4. Projekt erstellen und auswaehlen

### 1.2 APIs aktivieren
1. Gehe zu "APIs und Dienste" > "Bibliothek"
2. Suche und aktiviere:
   - Google Drive API
   - Gmail API

### 1.3 OAuth2 Credentials erstellen
1. Gehe zu "APIs und Dienste" > "Anmeldedaten"
2. Klicke "Anmeldedaten erstellen" > "OAuth-Client-ID"
3. Anwendungstyp: "Desktopanwendung"
4. Name: `n8n HEP Workflow`
5. Erstellen und Client-ID/Secret notieren

### 1.4 OAuth-Einstellungen (Neue Google Auth Platform)

Die Einstellungen sind auf verschiedene Menuepunkte verteilt:

**A) Zielgruppe pruefen:**
1. Klicke links auf "Zielgruppe" (Audience)
2. Stelle sicher, dass "Extern" ausgewaehlt ist

**B) Branding einrichten:**
1. Klicke links auf "Branding"
2. App-Name: `HEP Berichte`
3. Support-E-Mail: Deine E-Mail-Adresse

**C) Berechtigungen hinzufuegen:**
1. Klicke links auf "Datenzugriff" (Data Access)
2. Klicke "Berechtigungen hinzufuegen oder entfernen"
3. Suche und fuege hinzu:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/gmail.send`
4. Speichern

---

## Schritt 2: Gemini API Key holen

1. Gehe zu [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Klicke "Create API Key"
3. Kopiere den API Key und speichere ihn sicher

---

## Schritt 3: Google Drive vorbereiten

1. Oeffne [Google Drive](https://drive.google.com/)
2. Erstelle einen Ordner: `HEP-Berichte`
3. Rechtsklick auf den Ordner > "Link kopieren"
4. Die ID ist der Teil nach `/folders/` in der URL
   - Beispiel: `https://drive.google.com/drive/folders/ABC123xyz` -> ID ist `ABC123xyz`
5. Diese ID benoetigen wir spaeter in n8n

---

## Schritt 4: n8n Credentials einrichten

### 4.1 Google OAuth2 Credential
1. In n8n: Gehe zu "Credentials" > "Add Credential"
2. Suche: "Google OAuth2 API"
3. Gib ein:
   - Client ID (aus Schritt 1.3)
   - Client Secret (aus Schritt 1.3)
4. "Sign in with Google" klicken und Zugriff erlauben
5. Speichern

### 4.2 Gemini API Credential
1. In n8n: Gehe zu "Credentials" > "Add Credential"
2. Suche: "Google PaLM API" (funktioniert auch fuer Gemini)
3. API Key eingeben (aus Schritt 2)
4. Speichern

---

## Schritt 5: n8n Workflow importieren

1. In n8n: Gehe zu "Workflows" > "Import"
2. Waehle die Datei `/n8n/hep-bericht-workflow.json`
3. Workflow oeffnen

### 5.1 Credentials verbinden
Gehe durch jeden Node und verbinde die Credentials:
- Alle "Google Drive" Nodes: Google OAuth2 Credential
- Alle "Gmail" Nodes: Google OAuth2 Credential
- Alle "Gemini" HTTP Nodes: Google PaLM API Credential

### 5.2 Werte sind bereits konfiguriert

> **Hinweis:** Die folgenden Werte sind bereits im Workflow eingetragen:
> - Google Drive Ordner-ID: `12T02vHSdNYgmiVjYYNmOyUxZI9YxrrEt` (Studierende im Loreto)
> - Benachrichtigungs-E-Mail: `aleccorvis@gmail.com`
>
> Du musst nichts weiter konfigurieren!

### 5.3 Workflow aktivieren
1. Toggle oben rechts auf "Active"
2. Kopiere die Webhook-URL (wird angezeigt im Webhook-Node)

---

## Schritt 6: PWA hosten

### Option A: Hostinger (empfohlen)
1. Logge dich bei Hostinger ein
2. Gehe zu "Websites" > "Verwalten"
3. Lade alle Dateien aus `/webapp/` in den `public_html` Ordner hoch
4. Deine PWA ist nun unter deiner Domain erreichbar

### Option B: GitHub Pages (kostenlos)
1. Erstelle ein neues GitHub Repository
2. Lade alle Dateien aus `/webapp/` hoch
3. Gehe zu "Settings" > "Pages"
4. Source: main branch
5. Deine PWA ist unter `https://username.github.io/repo-name/` erreichbar

---

## Schritt 7: PWA konfigurieren

1. Oeffne die PWA im Browser (am besten auf dem iPhone)
2. Halte das Logo 1 Sekunde lang gedrueckt
3. Gib im Modal die Webhook-URL aus Schritt 5.3 ein
4. Speichern

### Auf iPhone Homescreen installieren
1. Oeffne Safari
2. Gehe zu deiner PWA-URL
3. Tippe auf das "Teilen"-Symbol
4. Waehle "Zum Home-Bildschirm"
5. Name eingeben und "Hinzufuegen"

---

## Schritt 8: Testen

1. Oeffne die PWA
2. Lade eine Test-PDF hoch
3. Waehle ob benotet oder nicht
4. "Hochladen" tippen
5. Warte auf die Bestaetigung
6. Pruefe:
   - E-Mail mit Benachrichtigung erhalten?
   - Datei in Google Drive abgelegt?
   - Bewertungsdokument erstellt?

---

## Fehlerbehebung

### "Upload fehlgeschlagen"
- Ist der Workflow in n8n aktiv?
- Ist die Webhook-URL korrekt in der PWA?
- Sind alle Credentials in n8n verbunden?

### "No file received" in n8n
- Pruefe ob die Datei unter 25MB ist
- Nur PDF, DOCX, DOC werden akzeptiert

### "Google Drive Error"
- Pruefe ob die Ordner-ID korrekt ist
- Hat das OAuth2 Credential die richtigen Scopes?

### "Gemini Error"
- Pruefe ob der API Key gueltig ist
- Hast du das Limit erreicht? (Free Tier: 60 Requests/Minute)

---

## Support

Bei Fragen oder Problemen kannst du dich jederzeit an mich wenden!
