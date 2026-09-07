// Abre una ventana de impresión con el HTML proporcionado.
export function printHTML(title, contentHTML, styles = '') {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Permite las ventanas emergentes para imprimir.');
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          ${styles}
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${contentHTML}
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Imprimir</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-left: 10px;">Cerrar</button>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// Imprime un ticket pequeño (para impresoras térmicas de 80mm).
export function printTicket(title, contentHTML) {
  const styles = `
    @page { size: 80mm auto; margin: 0; }
    body { width: 80mm; font-size: 12px; margin: 0 auto; }
    h1, h2, h3 { text-align: center; margin: 4px 0; }
    p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { text-align: left; padding: 2px 0; }
    .right { text-align: right; }
    .center { text-align: center; }
    .line { border-top: 1px dashed #999; margin: 8px 0; }
    .bold { font-weight: bold; }
  `;
  printHTML(title, contentHTML, styles);
}

// Imprime una factura/reporte en tamaño carta.
export function printDocument(title, contentHTML) {
  const styles = `
    @page { size: letter; margin: 15mm; }
    body { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    .right { text-align: right; }
    .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
  `;
  printHTML(title, contentHTML, styles);
}
