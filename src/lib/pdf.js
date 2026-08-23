import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Filters and returns all purchased items (quantity > 0)
 * @param {Array<{name: string, items: Array<{name: string, price: number}>}>} categories
 * @param {Record<string, number>} quantities
 * @returns {Array<{category: string, name: string, price: number, quantity: number, total: number}>}
 */
export function getPurchasedItems(categories, quantities) {
  const purchased = [];
  categories.forEach((cat, catIdx) => {
    (cat.items || []).forEach((item, itemIdx) => {
      const key = `${catIdx}-${itemIdx}`;
      const qty = quantities[key] || 0;
      if (qty > 0) {
        purchased.push({
          category: cat.name,
          name: item.name,
          price: item.price,
          quantity: qty,
          total: item.price * qty
        });
      }
    });
  });
  return purchased;
}

/**
 * Generates and downloads a PDF overview of purchased items
 * @param {Array<{name: string, items: Array<{name: string, price: number}>}>} categories
 * @param {Record<string, number>} quantities
 */
export function generatePurchasePdf(categories, quantities) {
  const items = getPurchasedItems(categories, quantities);
  if (items.length === 0) {
    return false;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totalSum = items.reduce((sum, item) => sum + item.total, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const formattedDate = new Date().toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Header / Branding bar (#5B6E4B -> rgb(91, 110, 75))
  doc.setFillColor(91, 110, 75);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Hubertus Hausbutler', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Verbrauchsübersicht & Abrechnung', 14, 19);

  doc.text(`Datum: ${formattedDate}`, 196, 19, { align: 'right' });

  // Subtitle / Info block
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bilderbuchbauernhof Hof und Tenne', 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Vielen Dank für Ihren Besuch! Nachfolgend finden Sie die Übersicht Ihrer erfassten Verbräuche.', 14, 41);

  // Table Body
  const tableData = items.map((item) => [
    item.category,
    item.name,
    `${item.price.toFixed(2).replace('.', ',')} €`,
    item.quantity.toString(),
    `${item.total.toFixed(2).replace('.', ',')} €`
  ]);

  autoTable(doc, {
    startY: 47,
    head: [['Kategorie', 'Artikel', 'Einzelpreis', 'Anzahl', 'Gesamt']],
    body: tableData,
    foot: [
      [
        { content: 'Gesamtsumme', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: `${totalCount} Artikel`, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: `${totalSum.toFixed(2).replace('.', ',')} €`, styles: { halign: 'right', fontStyle: 'bold' } }
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [91, 110, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    footStyles: {
      fillColor: [240, 243, 238],
      textColor: [30, 41, 59],
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' }
    },
    bodyStyles: {
      textColor: [40, 40, 40],
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [250, 250, 248]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer / Signature Section
  const lastTable = /** @type {any} */ (doc).lastAutoTable;
  const finalY = lastTable ? lastTable.finalY + 15 : 180;
  const pageHeight = doc.internal.pageSize.height;

  let signY = finalY;
  if (finalY + 25 > pageHeight) {
    doc.addPage();
    signY = 30;
  }

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);

  doc.line(14, signY + 12, 95, signY + 12);
  doc.text('Gast / Ferienwohnung', 14, signY + 17);

  doc.line(115, signY + 12, 196, signY + 12);
  doc.text('Datum / Unterschrift', 115, signY + 17);

  // Trigger browser download
  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`Hausbutler_Verbrauchsuebersicht_${fileDate}.pdf`);
  return true;
}
