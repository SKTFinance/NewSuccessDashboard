# PDF Template System - Anleitung

## Was ist das PDF Template System?

Das PDF Template System ermöglicht es, vorgefertigte PDF-Dokumente als Vorlagen zu verwenden und Platzhalter automatisch durch Beratungsdaten zu ersetzen.

## Funktionsweise

### 1. Template erstellen
Erstelle ein PDF-Dokument mit Platzhaltern in folgender Form:
- `***KUNDENNAME***` - wird durch den Kundennamen ersetzt
- `***BERATERNAME***` - wird durch den Beraternamen ersetzt  
- `***DATUM***` - wird durch das aktuelle Datum ersetzt
- `***PRODUKTNAME***` - wird durch den ersten empfohlenen Produktnamen ersetzt
- `***GESELLSCHAFT***` - wird durch die Gesellschaft des ersten Produkts ersetzt
- `***SCORE***` - wird durch den Score des ersten Produkts ersetzt
- `***BUERO***` - wird durch das Büro des Beraters ersetzt
- `***KARRIERESTUFE***` - wird durch die Karrierestufe des Beraters ersetzt

### 2. Template hochladen
1. Drücke `Strg + T` während der Beratung
2. Wähle dein PDF-Template aus
3. Klicke "Template laden"

### 3. PDF generieren
1. Nachdem die Beratung abgeschlossen ist
2. Klicke "PDF erstellen" 
3. Das PDF wird automatisch heruntergeladen

## Beispiel-Template

Ein Template könnte so aussehen:

```
BERATUNGSPROTOKOLL

Kunde: ***KUNDENNAME***
Berater: ***BERATERNAME***
Datum: ***DATUM***
Büro: ***BUERO***

Empfohlenes Produkt:
- Name: ***PRODUKTNAME***
- Gesellschaft: ***GESELLSCHAFT***
- Match-Score: ***SCORE***

[Weitere statische Inhalte...]
```

## Verfügbare Platzhalter

| Platzhalter | Beschreibung | Beispiel |
|-------------|--------------|----------|
| `***KUNDENNAME***` | Name des Kunden | "Max Mustermann" |
| `***BERATERNAME***` | Name des Beraters | "Samuel Königslehner" |
| `***DATUM***` | Aktuelles Datum | "16.10.2025" |
| `***BUERO***` | Berater-Büro | "Wien" |
| `***KARRIERESTUFE***` | Berater-Position | "Regionaldirektor:in" |
| `***PRODUKTNAME***` | Erstes empfohlenes Produkt | "Premium Rente" |
| `***GESELLSCHAFT***` | Produktgesellschaft | "Allianz" |
| `***SCORE***` | Match-Prozentsatz | "87%" |

## Technische Details

- Verwendet die PDF-lib Bibliothek
- Unterstützt Text-Ersetzung an definierten Koordinaten
- Koordinaten müssen für jedes Template kalibriert werden
- Unterstützt verschiedene Schriftarten und -größen

## Erweiterungen

Das System kann erweitert werden um:
- Automatische Texterkennung (OCR)
- Dynamische Koordinaten-Ermittlung
- Mehrere Produkte pro Template
- Bilder-Ersetzung
- Formular-Felder Ausfüllung

## Verwendung im Code

```javascript
// Template laden
const templateManager = new PDFTemplateManager(beratungView);
await templateManager.loadTemplate(pdfFile);

// PDF generieren
await templateManager.generateFromTemplate();
```
