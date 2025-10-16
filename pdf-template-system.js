// PDF Template System mit PDF-lib
// Ermöglicht das Laden einer PDF-Vorlage und Ersetzen von Platzhaltern

class PDFTemplateSystem {
    constructor() {
        this.templatePdfBytes = null;
        this.placeholders = new Map();
    }

    // Lade die PDF-Vorlage
    async loadTemplate(pdfFile) {
        if (pdfFile instanceof File) {
            this.templatePdfBytes = await pdfFile.arrayBuffer();
        } else if (typeof pdfFile === 'string') {
            // URL zu PDF
            const response = await fetch(pdfFile);
            this.templatePdfBytes = await response.arrayBuffer();
        }
        console.log('PDF Template geladen');
    }

    // Definiere Platzhalter und ihre Ersetzungen
    setPlaceholder(placeholder, value) {
        this.placeholders.set(placeholder, value);
    }

    // Mehrere Platzhalter auf einmal setzen
    setPlaceholders(placeholderMap) {
        for (const [key, value] of Object.entries(placeholderMap)) {
            this.placeholders.set(key, value);
        }
    }

    // Generiere das finale PDF mit ersetzten Platzhaltern
    async generatePDF() {
        if (!this.templatePdfBytes) {
            throw new Error('Keine PDF-Vorlage geladen');
        }

        // PDF-lib importieren (muss vorher geladen werden)
        const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
        
        // Lade das Template-PDF
        const pdfDoc = await PDFDocument.load(this.templatePdfBytes);
        const originalPages = pdfDoc.getPages();
        
        // Font für Text
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Produktdaten für Seitenduplikation
        const produkte = this.placeholders.get('***PRODUKTE_ARRAY***') || [];
        
        // SEITE 1 und 2: Basis-Seiten mit Standard-Platzhaltern
        for (let pageIndex = 0; pageIndex < Math.min(3, originalPages.length); pageIndex++) {
            const page = originalPages[pageIndex];
            await this.replacePlaceholdersOnPage(page, font, boldFont);
        }
        
        // SEITE 4+: Produktseiten duplizieren
        if (originalPages.length >= 4 && produkte.length > 0) {
            const produktTemplatePageIndex = 3; // Seite 4 als Template (0-indexiert)
            
            // Erstelle für jedes Produkt eine neue Seite
            for (const [index, produkt] of produkte.entries()) {
                // Kopiere die Template-Seite vom Original-Dokument
                const tempDoc = await PDFDocument.load(this.templatePdfBytes);
                const [copiedPage] = await pdfDoc.copyPages(tempDoc, [produktTemplatePageIndex]);
                
                // Setze produktspezifische Platzhalter
                const produktPlaceholders = new Map([
                    ['***PRODUKT***', produkt.name || ''],
                    ['***PRODUKTBESCHREIBUNG***', produkt.beschreibung || produkt.hinweise || ''],
                    ['***VORTEILE***', this.formatVorteile(produkt.vorteile || produkt.besonderheiten || [])],
                ]);
                
                // Temporär die Produktdaten in die Haupt-Platzhalter setzen
                const originalPlaceholders = new Map(this.placeholders);
                for (const [key, value] of produktPlaceholders) {
                    this.placeholders.set(key, value);
                }
                
                // Platzhalter auf der kopierten Seite ersetzen
                await this.replacePlaceholdersOnPage(copiedPage, font, boldFont);
                
                // Original-Platzhalter wiederherstellen
                this.placeholders = originalPlaceholders;
                
                // Seite zum Dokument hinzufügen
                pdfDoc.addPage(copiedPage);
            }
            
            // Entferne die Original-Produktseite am Ende
            if (originalPages.length >= 4) {
                pdfDoc.removePage(3);
            }
        }

        // PDF als Bytes zurückgeben
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }

    // Hilfsfunktion: Formatiere Vorteile als Text
    formatVorteile(vorteile) {
        if (Array.isArray(vorteile)) {
            return vorteile.map(vorteil => `• ${vorteil}`).join('\n');
        }
        return String(vorteile || '');
    }

    // Ersetze Platzhalter auf einer Seite (Koordinaten-basiert)
    async replacePlaceholdersOnPage(page, font, boldFont) {
        const { rgb } = window.PDFLib;
        
        // Definierte Platzhalter-Positionen für Vorlage.pdf (müssen kalibriert werden)
        const placeholderPositions = {
            // SEITE 1 - Deckblatt
            '***TELEFONNUMMER DES BERATERS***': { x: 400, y: 750, fontSize: 12, font: font },
            '***KUNDENNAME***': { x: 100, y: 700, fontSize: 18, font: boldFont },
            '***DATUM***': { x: 400, y: 700, fontSize: 12, font: font },
            
            // SEITE 2 - Berater-Info
            '***NAME DES BERATERS***': { x: 100, y: 650, fontSize: 16, font: boldFont },
            '***BESCHREIBUNG DES BERATERS***': { x: 100, y: 600, fontSize: 12, font: font },
            
            // SEITE 4+ - Produktseiten (werden dynamisch für jedes Produkt erstellt)
            '***PRODUKT***': { x: 100, y: 700, fontSize: 16, font: boldFont },
            '***PRODUKTBESCHREIBUNG***': { x: 100, y: 650, fontSize: 12, font: font },
            '***VORTEILE***': { x: 100, y: 550, fontSize: 12, font: font },
        };

        // Ersetze jeden Platzhalter
        for (const [placeholder, position] of Object.entries(placeholderPositions)) {
            if (this.placeholders.has(placeholder)) {
                const value = this.placeholders.get(placeholder);
                
                // Handle mehrzeiligen Text
                let textToRender = String(value);
                if (placeholder === '***PRODUKTBESCHREIBUNG***' || placeholder === '***VORTEILE***' || placeholder === '***BESCHREIBUNG DES BERATERS***') {
                    // Längeren Text in mehrere Zeilen aufteilen
                    const maxWidth = 400;
                    const lines = this.splitTextToLines(textToRender, position.font, position.fontSize, maxWidth);
                    
                    lines.forEach((line, index) => {
                        page.drawText(line, {
                            x: position.x,
                            y: position.y - (index * (position.fontSize + 2)),
                            size: position.fontSize,
                            font: position.font,
                            color: rgb(0, 0, 0),
                        });
                    });
                } else {
                    // Einzeiliger Text
                    page.drawText(textToRender, {
                        x: position.x,
                        y: position.y,
                        size: position.fontSize,
                        font: position.font,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }
    }

    // Hilfsfunktion: Text in Zeilen aufteilen
    splitTextToLines(text, font, fontSize, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            // Einfache Schätzung der Textbreite (kann durch font.widthOfTextAtSize ersetzt werden)
            const estimatedWidth = testLine.length * (fontSize * 0.6);
            
            if (estimatedWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // Hilfsfunktion: PDF herunterladen
    downloadPDF(pdfBytes, filename = 'beratungsprotokoll.pdf') {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Erweiterte Version mit OCR-ähnlicher Textsuche (falls möglich)
class AdvancedPDFTemplateSystem extends PDFTemplateSystem {
    
    // Versuche automatisch Text im PDF zu finden und zu ersetzen
    async findAndReplaceText(searchText, replaceText) {
        // Dies ist komplexer und würde eine zusätzliche Bibliothek benötigen
        // wie pdf2pic + OCR oder pdf-parse
        console.log(`Suche nach "${searchText}" und ersetze mit "${replaceText}"`);
    }

    // Füge Bilder an bestimmten Positionen ein
    async insertImage(imageBytes, x, y, width, height, pageIndex = 0) {
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(this.templatePdfBytes);
        const pages = pdfDoc.getPages();
        
        if (pageIndex < pages.length) {
            const page = pages[pageIndex];
            
            // Bild einbetten
            let image;
            if (imageBytes.includes('data:image/jpeg') || imageBytes.includes('.jpg')) {
                image = await pdfDoc.embedJpg(imageBytes);
            } else {
                image = await pdfDoc.embedPng(imageBytes);
            }
            
            // Bild auf Seite zeichnen
            page.drawImage(image, {
                x: x,
                y: y,
                width: width,
                height: height,
            });
        }
        
        this.templatePdfBytes = await pdfDoc.save();
    }
}

// Export für Verwendung
window.PDFTemplateSystem = PDFTemplateSystem;
window.AdvancedPDFTemplateSystem = AdvancedPDFTemplateSystem;

// Beispiel-Verwendung:
/*
const templateSystem = new PDFTemplateSystem();

// 1. Template laden
await templateSystem.loadTemplate('/path/to/template.pdf');

// 2. Platzhalter definieren
templateSystem.setPlaceholders({
    '***KUNDENNAME***': 'Max Mustermann',
    '***BERATERNAME***': 'Samuel Königslehner',
    '***DATUM***': new Date().toLocaleDateString('de-DE'),
    '***PRODUKTNAME***': 'Premium Rente',
    '***GESELLSCHAFT***': 'Allianz',
    '***SCORE***': '87%'
});

// 3. PDF generieren und herunterladen
const pdfBytes = await templateSystem.generatePDF();
templateSystem.downloadPDF(pdfBytes, 'beratungsprotokoll_template.pdf');
*/
