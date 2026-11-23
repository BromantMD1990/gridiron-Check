# Topps NFL TC

Installierbare Web-App für die Checkliste **2026 Topps Flagship Football**. Die App enthält 3.687 Karten in 71 Teilsets (Basis, Variationen, Inserts und weitere Untersets). Es werden keine Kartenbilder verwendet. Sammlungsdaten bleiben im lokalen Speicher des jeweiligen Browsers.

## Auf dem iPhone öffnen

Die App benötigt einen Webserver und eine HTTPS-Adresse, damit iOS sie zuverlässig zum Home-Bildschirm hinzufügen und offline nutzen kann.

1. Veröffentliche diesen Ordner auf einem statischen HTTPS-Host (z. B. GitHub Pages, Netlify oder einem eigenen Webserver).
2. Öffne die URL in Safari auf dem iPhone.
3. Tippe auf **Teilen** → **Zum Home-Bildschirm** → **Hinzufügen**.

Zum lokalen Vorschauen im Projektordner `python3 -m http.server 8000` starten und am Rechner `http://localhost:8000` öffnen. `file://` funktioniert wegen des lokalen Checklisten-Imports nicht.

## Sammlung sichern

Das Export-Symbol oben öffnet eine Auswahl: „OK“ lädt eine JSON-Sicherung herunter; „Abbrechen“ wählt eine vorhandene Sicherung zum Import aus. Beim Import wird der aktuelle Sammlungsstand ersetzt.

## Checklistenquelle

Die Kartendaten stammen aus der [2026 Topps Flagship Collection Football Checkliste von Degree Grading](https://degreegrading.com/checklists/2026-topps-flagship-football/), abgerufen am 23.11.2026. Das ist eine Drittanbieter-Checkliste; bitte bei Bedarf mit der Hersteller-Checkliste abgleichen.
