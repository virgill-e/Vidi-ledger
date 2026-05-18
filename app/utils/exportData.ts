import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (filename: string, headers: string[], data: any[][]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (title: string, filename: string, headers: string[], data: any[][], formatCurrencyFn?: (val: number) => string) => {
  const doc = new jsPDF();

  // Add a nice header
  doc.setFillColor(41, 75, 60); // Primary color
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 32);

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 45,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 75, 60],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [240, 244, 242]
    }
  });

  doc.save(`${filename}.pdf`);
};
