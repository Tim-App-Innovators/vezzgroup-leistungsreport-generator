[README.md](https://github.com/user-attachments/files/26528200/README.md)
# Leistungsreport Generator

React-Frontend für den vezzgroup Leistungsreport Generator. Vollständig gestylte, workflow-basierte UI zur Eingabe von Datenquellen, Auswertungsparametern und Ausgabeeinstellungen — bereit zur Integration mit einer Backend-Logik.

---

## Projektstruktur

```
src/
  App.jsx        ← vollständige UI-Komponente (diese Datei)
  main.jsx       ← React-Einstiegspunkt
index.html
package.json
```

---

## Schnellstart

### 1. Neues Vite-Projekt anlegen

```bash
npm create vite@latest leistungsreport -- --template react
cd leistungsreport
```

### 2. Abhängigkeiten installieren

```bash
npm install lucide-react
```

> `lucide-react` ist die einzige externe Abhängigkeit neben React selbst.

### 3. App.jsx einfügen

Die mitgelieferte `App.jsx` ersetzt die von Vite generierte `src/App.jsx` vollständig.

### 4. `main.jsx` prüfen

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

### 5. Starten

```bash
npm run dev
```

---

## Technologie

| Was | Womit |
|---|---|
| Framework | React 18 |
| Styling | Inline-Styles (kein Tailwind, kein CSS-File) |
| Icons | lucide-react `^0.383.0` |
| Build-Tool | Vite (empfohlen) |
| Sprache | JSX (kein TypeScript) |

### TypeScript-Projekte

Die Datei kann direkt in `App.tsx` umbenannt werden. Typisierung der Props ist minimal, da die Komponente keine externen Props erwartet (`export default function App()`). Typen für interne State-Variablen können bei Bedarf ergänzt werden.

---

## Aufbau der UI

Die App ist als 5-Schritt-Workflow aufgebaut:

| Schritt | Inhalt |
|---|---|
| 1 – Datenquellen | 5 Datei-Felder (XML Vorjahr, XML aktuelles Jahr, MatchMaster, Kennzahlen, Klinik Konfig) + Verarbeitungs-Toggle |
| 2 – Parameter | Auszuwertendes Jahr, Auswertungsquartal, YTD (Monate seit Jan.) |
| 3 – Ausgabeordner | Pfad-Eingabe für den Speicherort des Reports |
| 4 – Überprüfung | Zusammenfassung aller Eingaben + Bestätigungs-Toggle |
| 5 – Report erstellen | Fortschrittsanzeige + Download-Button |

Alle Schritte beinhalten vollständige **Validierung** (Fehlerzustände, rote Hinweise, Toast-Benachrichtigungen) und **kontextbezogene Hilfe-Popups** am ⓘ-Icon jeder Card.

---

## Was der Entwickler noch integrieren muss

Die folgenden Funktionen sind in der UI als Mocks implementiert und müssen mit echter Logik belegt werden:

### 1. File-Picker (Schritt 1 & 3)

Die Buttons „Durchsuchen" simulieren aktuell eine Dateiauswahl mit Dummy-Werten. Hier muss die plattformspezifische API eingebunden werden:

**Electron:**
```js
const { dialog } = require('electron').remote
const result = await dialog.showOpenDialog({ properties: ['openFile'] })
if (!result.canceled) setFile(result.filePaths[0])
```

**Web (File System Access API):**
```js
const [fileHandle] = await window.showOpenFilePicker()
const file = await fileHandle.getFile()
setFile(file.name)
```

### 2. Ausgabeordner auswählen (Schritt 3)

Analog zum File-Picker, aber mit `showOpenDialog({ properties: ['openDirectory'] })` für Electron bzw. `window.showDirectoryPicker()` für Web.

### 3. Report-Generierung (Schritt 5)

Der Fortschrittsbalken läuft aktuell als animierter Demo-Timer. Die echte Logik ersetzt den `useEffect` in Schritt 5:

```js
// In App.jsx, Schritt 5:
useEffect(() => {
  if (step !== 5) return
  // Hier: API-Call oder Electron-IPC für Report-Generierung
  // Fortschritt über setReportProgress(n) aktualisieren
}, [step])
```

### 4. Report-Download

Der Button „Report herunterladen" ruft aktuell `showToast(...)` auf. Hier den tatsächlichen Download oder das Öffnen des Ausgabeordners einbauen.

---

## Logo

Das vezzgroup-Logo ist als Base64-PNG direkt in `App.jsx` eingebettet (Konstante `LOGO_SRC`). Es kann jederzeit durch einen normalen Asset-Import ersetzt werden:

```jsx
// App.jsx, oben:
import logo from './assets/logo.png'

// Dann in VezzgroupLogo():
<img src={logo} alt="vezzgroup" style={{ height: 32, width: "auto" }} />
```

---

## Layout-Hinweise

- Die App ist für eine **Mindestbreite von 1100px** ausgelegt (Desktop/Electron).
- Das Haupt-Layout hat eine feste Größe von `1160px` Breite und `calc(100vh - 40px)` Höhe — bei Bedarf anpassbar in der `return`-Anweisung von `App`.
- Die Scrollbar-Reserve ist mit `scrollbarGutter: "stable"` fest einkalkuliert, sodass Cards beim Erscheinen der Scrollbar nicht ihre Breite ändern.

---

## Abhängigkeiten (package.json)

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "lucide-react": "^0.383.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

---

## Kontakt & Kontext

Entwickelt für **vezzgroup GmbH** durch **App Innovators Solution GmbH**.  
UI-Version: `Release 1.00.00`
