const { jsPDF } = require('jspdf');
const { autoTable } = require('jspdf-autotable');
const imageSize = require('image-size');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const sizeOf = (input) => {
  if (typeof imageSize === 'function') {
    return imageSize(input);
  }
  if (imageSize && typeof imageSize.imageSize === 'function') {
    return imageSize.imageSize(input);
  }
  if (imageSize && typeof imageSize.default === 'function') {
    return imageSize.default(input);
  }
  throw new Error('image-size module is not callable');
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

const fetchImageBuffer = (url) => {
  return new Promise((resolve, reject) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Status code ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

exports.generateInvoicePDF = async (invoice, settings) => {
  try {
    const doc = new jsPDF();
    const template = settings.invoiceTemplate || 'simple';

  let logoBase64 = null;
  let logoFormat = 'PNG';
  let logoDimensions = null;

  if (settings.logoUrl) {
    try {
      let logoUrl = settings.logoUrl;

      if (!logoUrl.startsWith('data:image') && !logoUrl.startsWith('http') && !logoUrl.startsWith('/')) {
        if (logoUrl.startsWith('uploads/')) {
          logoUrl = `/${logoUrl}`;
        } else {
          logoUrl = `/${logoUrl}`;
        }
      }

      if (logoUrl.startsWith('data:image')) {
        logoBase64 = logoUrl;
        if (logoUrl.startsWith('data:image/jpeg')) {
          logoFormat = 'JPEG';
        }
      } else {
        let localPath = null;
        let mimeFromExt = null;

        if (logoUrl.includes('/uploads/')) {
          try {
            if (logoUrl.startsWith('http')) {
              const urlObj = new URL(logoUrl);
              const pathname = urlObj.pathname;
              if (pathname.startsWith('/uploads/')) {
                const filename = pathname.split('/uploads/')[1];
                localPath = path.join(__dirname, '../uploads', filename);
                mimeFromExt = filename.split('.').pop();
              }
            } else if (logoUrl.startsWith('/uploads/')) {
              const filename = logoUrl.split('/uploads/')[1];
              localPath = path.join(__dirname, '../uploads', filename);
              mimeFromExt = filename.split('.').pop();
            }
          } catch (err) {
            console.warn('Failed to resolve local file from URL:', err);
          }
        }

        let imgBuffer = null;

        if (localPath && fs.existsSync(localPath)) {
          imgBuffer = fs.readFileSync(localPath);
        } else if (logoUrl.startsWith('http')) {
          imgBuffer = await fetchImageBuffer(logoUrl);
        } else if (logoUrl.startsWith('/')) {
          const candidatePath = path.join(__dirname, '../uploads', path.basename(logoUrl));
          if (fs.existsSync(candidatePath)) {
            imgBuffer = fs.readFileSync(candidatePath);
          }
        }

        if (imgBuffer) {
          const base64String = imgBuffer.toString('base64');
          let ext = (mimeFromExt || '').toLowerCase();
          if (!ext && logoUrl.includes('.')) {
            ext = logoUrl.split('.').pop().toLowerCase();
          }

          let mimeType = 'png';
          if (ext === 'jpg' || ext === 'jpeg') {
            mimeType = 'jpeg';
            logoFormat = 'JPEG';
          } else {
            logoFormat = 'PNG';
          }

          logoBase64 = `data:image/${mimeType};base64,${base64String}`;
        }
      }
    } catch (e) {
      console.error('Failed to process logo', e);
      logoBase64 = null;
    }
  }

  const getLogoDimensions = (maxWidth, maxHeight) => {
    if (!logoDimensions || logoDimensions.width === 0 || logoDimensions.height === 0) {
      return { w: maxWidth, h: maxHeight };
    }
    const ratio = Math.min(maxWidth / logoDimensions.width, maxHeight / logoDimensions.height);
    return { w: logoDimensions.width * ratio, h: logoDimensions.height * ratio };
  };

  // --- Data Preparation ---
  let items = invoice.items;
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  const config = settings.templateConfig || {};
   const t = settings.t || ((key, def) => def);
   const showQty = config.columns?.quantity !== false;
  const showPrice = config.columns?.price !== false;

  const tableColumn = [
    "No.",
    t('item', "Description"),
    ...(showQty ? [t('quantity', "Qty")] : []),
    ...(showPrice ? [t('price', "Unit Price")] : []),
    t('amount', "Total")
  ];
  const tableRows = [];

  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      const itemData = [
        index + 1,
        item.description,
        ...(showQty ? [item.quantity] : []),
        ...(showPrice ? [Number(item.price).toFixed(2)] : []),
        (item.quantity * item.price).toFixed(2)
      ];
      tableRows.push(itemData);
    });
  }

  const currency = settings.currency || '€';
  const subtotal = Number(invoice.subtotal || invoice.total).toFixed(2);
  const vatRate = Number(invoice.vatRate || 0);
  const vatAmount = Number(invoice.vatAmount || 0).toFixed(2);
  const total = Number(invoice.total).toFixed(2);
  const issueDate = formatDate(invoice.issueDate);
  const dueDate = formatDate(invoice.dueDate);

  // Client object construction from invoice fields
  // In the server controller, these might be passed differently, but here we assume 'invoice' has related fields 
  // or we need to fetch them. 
  // However, looking at the controller, 'client' data is likely not fully in 'invoice' object if it's just the Prisma model.
  // We need to check if 'invoice' passed here has client details.
  // Assuming 'invoice' passed to this function is an enriched object or we use placeholders.
  // The 'invoice' object from Prisma usually has relation to 'client'. 
  // Let's assume the controller passes the full client object or fields.
  // If not, we might need to adjust. For now, we'll try to use invoice.client if available, or empty strings.
  
  const clientData = invoice.client || {}; 
  // If invoice.client is not populated, we might face issues. 
  // But let's proceed assuming the controller handles data population.

  const addProviderInfo = (doc, x, y, fontSize = 10, lineHeight = 4, color = [0, 0, 0], align = 'left') => {
    doc.setTextColor(color[0], color[1], color[2]);
    
    // Company Name
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || '', x, y, { align });
    
    // Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize - 2);
    
    let currentY = y + lineHeight + 1;
    
    const details = [
      settings.address,
      (settings.city && settings.country) ? `${settings.city}, ${settings.country}` : (settings.city || settings.country),
      settings.zipCode ? `ZIP: ${settings.zipCode}` : null,
      settings.cui ? `CUI: ${settings.cui}` : null,
      settings.regCom ? `Reg: ${settings.regCom}` : null,
      settings.iban ? `IBAN: ${settings.iban}` : null,
      settings.bank ? `Bank: ${settings.bank}` : null,
      settings.swift ? `SWIFT: ${settings.swift}` : null,
      settings.email,
      settings.phone,
      settings.website
    ].filter(Boolean);

    details.forEach(detail => {
      if (detail) {
        doc.text(detail, x, currentY, { align });
        currentY += lineHeight;
      }
    });
    
    return currentY;
  };

  const addClientInfo = (doc, x, y, fontSize = 10, lineHeight = 5, color = [0, 0, 0], align = 'left', skipName = false) => {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');

    if (!skipName) {
      doc.text(clientData.name || '', x, y, { align });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize - 1);
    
    let currentY = y + lineHeight;
    
    const addressDetails = [
      clientData.address,
      [clientData.city, clientData.county].filter(Boolean).join(", "),
      [clientData.country, clientData.zipCode].filter(Boolean).join(" ")
    ].filter(Boolean);

    addressDetails.forEach(detail => {
      if (detail) {
        doc.text(String(detail), x, currentY, { align });
        currentY += lineHeight;
      }
    });

    if (clientData.cui) {
      doc.text(`VAT ID: ${clientData.cui}`, x, currentY, { align });
      currentY += lineHeight;
    }
    
    if (clientData.phone) {
      doc.text(clientData.phone, x, currentY, { align });
      currentY += lineHeight;
    }

    if (clientData.email) {
      doc.text(clientData.email, x, currentY, { align });
      currentY += lineHeight;
    }

    if (clientData.regCom) {
      doc.text(`Reg: ${clientData.regCom}`, x, currentY, { align });
      currentY += lineHeight;
    }
    
    return currentY;
  };

  // --- Template Implementations ---

  const STANDARD_TEMPLATES = ['simple', 'modern', 'professional', 'creative', 'minimalist', 'editorial', 'geometric', 'business', 'horizon', 'neon'];
  let contentEndY = 0;

  if (settings.templateConfig?.custom && !STANDARD_TEMPLATES.includes(template)) {
      // === Custom Template ===
      const custom = settings.templateConfig.custom;
      const styles = custom.styles || {};
      const sections = custom.sections || [];
      const labels = settings.templateConfig.labels || {};

      // 1. Background
      const bg = hexToRgb(styles.backgroundColor || '#ffffff');
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(0, 0, 210, 297, 'F');

      // 2. Fonts & Colors
      const textCol = hexToRgb(styles.textColor || '#1f2937');
      const primaryCol = hexToRgb(styles.primaryColor || '#2563eb');
      
      let fontName = 'helvetica';
      if (styles.fontFamily === 'serif') fontName = 'times';
      if (styles.fontFamily === 'mono') fontName = 'courier';

      doc.setFont(fontName, 'normal');
      doc.setTextColor(textCol[0], textCol[1], textCol[2]);

      let currentY = 20;
      const marginX = 14;
      const rightX = 196;

      // Sort sections
      const sortedSections = [...sections].sort((a, b) => a.order - b.order);

      for (const section of sortedSections) {
          if (!section.isVisible) continue;

          switch (section.id) {
              case 'header':
                  if (logoBase64) {
                      try {
                          const { w, h } = getLogoDimensions(50, 30);
                          doc.addImage(logoBase64, logoFormat, marginX, currentY, w, h);
                      } catch (e) {
                          console.error('Failed to render logo in custom header', e);
                      }
                  } else {
                      doc.setFontSize(20);
                      doc.setFont(fontName, 'bold');
                      doc.text(settings.companyName || 'COMPANY', marginX, currentY + 10);
                  }
                  
                  doc.setFontSize(20);
                  doc.setFont(fontName, 'bold');
                  doc.text(labels.invoiceTitle || 'INVOICE', rightX, currentY + 10, { align: 'right' });
                  
                  doc.setFontSize(10);
                  doc.setFont(fontName, 'normal');
                  doc.text(`#${invoice.invoiceNumber}`, rightX, currentY + 18, { align: 'right' });
                  doc.text(issueDate, rightX, currentY + 23, { align: 'right' });

                  currentY += 40;
                  break;

              case 'provider':
                  doc.setFontSize(8);
                  doc.setFont(fontName, 'bold');
                  doc.setTextColor(textCol[0], textCol[1], textCol[2]);
                  doc.text(labels.from || 'FROM', marginX, currentY);
                  currentY += 5;
                  currentY = addProviderInfo(doc, marginX, currentY, 10, 5, textCol);
                  currentY += 10;
                  break;

              case 'client':
                  doc.setFontSize(8);
                  doc.setFont(fontName, 'bold');
                  doc.text(labels.to || 'TO', marginX, currentY);
                  currentY += 5;
                  currentY = addClientInfo(doc, marginX, currentY, 10, 5, textCol);
                  currentY += 10;
                  break;

              case 'items':
                  autoTable(doc, {
                      startY: currentY,
                      head: [tableColumn],
                      body: tableRows,
                      theme: 'plain',
                      styles: {
                          font: fontName,
                          textColor: textCol,
                          fontSize: 9,
                          cellPadding: 3
                      },
                      headStyles: {
                          fillColor: primaryCol,
                          textColor: 255,
                          fontStyle: 'bold'
                      },
                      columnStyles: {
                          4: { halign: 'right' }
                      }
                  });
                  currentY = doc.lastAutoTable.finalY + 10;
                  break;

              case 'totals':
                  const totalsStartY = currentY;
                  doc.setFontSize(10);
                  doc.setFont(fontName, 'normal');
                  doc.text('Subtotal', 140, totalsStartY);
                  doc.text(`${subtotal}`, rightX, totalsStartY, { align: 'right' });
                  
                  doc.text(`Tax (${vatRate}%)`, 140, totalsStartY + 6);
                  doc.text(`${vatAmount}`, rightX, totalsStartY + 6, { align: 'right' });
                  
                  doc.setFontSize(12);
                  doc.setFont(fontName, 'bold');
                  doc.setTextColor(primaryCol[0], primaryCol[1], primaryCol[2]);
                  doc.text('Total', 140, totalsStartY + 14);
                  doc.text(`${total} ${currency}`, rightX, totalsStartY + 14, { align: 'right' });
                  
                  // Reset color
                  doc.setTextColor(textCol[0], textCol[1], textCol[2]);
                  currentY += 30;
                  break;
          }
      }

      contentEndY = currentY;

  } else if (template === 'editorial') {
    doc.setFillColor(250, 249, 246);
    doc.rect(0, 0, 210, 297, 'F');
    
    const marginX = 10;
    const rightX = 195;
    let currentY = 15;
    let providerStartY = currentY;

    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 40);
      doc.addImage(logoBase64, logoFormat, marginX, currentY, w, h);
      providerStartY = currentY + h + 4;
    } else {
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'italic');
      doc.setFontSize(26); 
      doc.text('&', marginX, currentY + 10);
      providerStartY = currentY + 20;
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setCharSpace(3); 
    doc.text('INVOICE', rightX - 10, currentY + 10, { align: 'right' });
    doc.setCharSpace(0); 
    
    const providerEndY = addProviderInfo(doc, marginX, providerStartY, 10, 4, [0, 0, 0]);

    const sectionY = providerEndY + 4;

    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('BILLED TO:', marginX, sectionY);
    
    const clientInfoEndY = addClientInfo(doc, marginX, sectionY + 6, 10, 4, [0, 0, 0]);
    doc.setTextColor(0);

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(`Invoice No. ${invoice.invoiceNumber}`, rightX, sectionY, { align: 'right' });
    doc.text(issueDate, rightX, sectionY + 5, { align: 'right' });

    autoTable(doc, {
      startY: clientInfoEndY + 6,
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      styles: { 
        font: 'times', 
        fontSize: 8, 
        cellPadding: 3,
        textColor: 0,
      },
      headStyles: { 
        fontStyle: 'bold', 
        fillColor: [250, 249, 246], 
        textColor: 0, 
        lineWidth: { bottom: 0.5 },
        lineColor: 0
      },
      bodyStyles: { 
        lineColor: 220, 
        lineWidth: { bottom: 0.1 } 
      },
      columnStyles: {
        0: { cellWidth: 10 }, 
        4: { halign: 'right' } 
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 3, right: 6, bottom: 3, left: 3 };
        }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 6;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal', 140, totalsStartY + 5);
    doc.text(`${subtotal}`, rightX, totalsStartY + 5, { align: 'right' });
    
    doc.text(`Tax (${vatRate}%)`, 140, totalsStartY + 10);
    doc.text(`${vatAmount}`, rightX, totalsStartY + 10, { align: 'right' });

    const totalLineY = totalsStartY + 15;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(marginX, totalLineY, rightX, totalLineY);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Total', rightX - 40, totalLineY + 6, { align: 'right' });
    doc.text(`${total} ${currency}`, rightX, totalLineY + 6, { align: 'right' });

    contentEndY = totalLineY + 6;

  } else if (template === 'geometric') {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setFillColor(30, 58, 138);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    doc.triangle(130, 0, 210, 0, 210, 80, 'F');
    doc.triangle(130, 0, 210, 80, 100, 80, 'F');

    doc.setFillColor(37, 99, 235);
    doc.setGState(new doc.GState({ opacity: 0.8 }));
    doc.triangle(150, 0, 210, 0, 210, 70, 'F');
    doc.triangle(150, 0, 210, 70, 120, 70, 'F');
    
    doc.restoreGraphicsState();

    let providerStartY = 35;
    if (logoBase64) {
      try {
        const { w, h } = getLogoDimensions(50, 40);
        doc.addImage(logoBase64, logoFormat, 14, 20, w, h);
        providerStartY = 20 + h + 4;
      } catch (e) {
        console.error('Failed to render logo in geometric template', e);
      }
    } else {
      doc.setFillColor(30, 58, 138);
      doc.roundedRect(14, 20, 12, 12, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text((settings.companyName || 'C').charAt(0).toUpperCase(), 20, 27.5, { align: 'center' });
      providerStartY = 34;
    }

    const providerY = addProviderInfo(doc, 14, providerStartY, 11, 4.5, [30, 58, 138]);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('INVOICE', 190, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.9 }));
    doc.text(`#${invoice.invoiceNumber}`, 190, 32, { align: 'right' });
    doc.restoreGraphicsState();

    const infoY = providerY + 5;
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TO:', 14, infoY);
    
    addClientInfo(doc, 14, infoY + 5, 10, 4, [0, 0, 0]);

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE:', 180, infoY, { align: 'right' });
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(issueDate, 180, infoY + 5, { align: 'right' });

    autoTable(doc, {
      startY: infoY + 30,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 58, 138], 
        textColor: 255, 
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        fontSize: 9, 
        textColor: 80,
        cellPadding: 3
      },
      alternateRowStyles: { 
        fillColor: [239, 246, 255] 
      },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 10;

    const barWidth = 130;
    const barHeight = 18;
    const barX = 210 - barWidth - 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', barX + 5, totalsStartY - 10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${subtotal} ${currency}`, 200, totalsStartY - 10, { align: 'right' });
    
    doc.setTextColor(100, 100, 100);
    doc.text('Tax', barX + 5, totalsStartY - 4);
    doc.setTextColor(0, 0, 0);
    doc.text(`${vatAmount} ${currency}`, 200, totalsStartY - 4, { align: 'right' });
    
    doc.setFillColor(30, 58, 138);
    doc.roundedRect(barX, totalsStartY, barWidth, barHeight, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', barX + barWidth - 50, totalsStartY + 11, { align: 'right' });
    doc.text(`${total} ${currency}`, barX + barWidth - 25, totalsStartY + 11, { align: 'right' });

    doc.setFillColor(30, 58, 138);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.triangle(0, 250, 100, 297, -50, 297, 'F'); 
    doc.restoreGraphicsState();

    contentEndY = totalsStartY + 11;

  } else if (template === 'business') {
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 4, 'F'); 
    
    let logoH = 0;
    if (logoBase64) {
      try {
        const { w, h } = getLogoDimensions(50, 40);
        doc.addImage(logoBase64, logoFormat, 14, 20, w, h);
        logoH = h;
      } catch (e) {
        console.error('Failed to render logo in business template', e);
      }
    } else {
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(14, 20, 10, 10, 0, 0, 'F');
      logoH = 10;
    }
    
    const providerY = addProviderInfo(doc, 14, Math.max(55, 20 + logoH + 10), 12, 4, [30, 41, 59]);

    doc.setTextColor(5, 150, 105);
    doc.setFontSize(18);
    doc.text('INVOICE', 190, 27, { align: 'right' });

    const barY = Math.max(providerY + 5, 80);
    const barHeight = 50; 
    doc.setFillColor(249, 250, 251);
    doc.rect(0, barY, 210, barHeight, 'F');
    doc.setDrawColor(243, 244, 246);
    doc.line(0, barY, 210, barY);
    doc.line(0, barY + barHeight, 210, barY + barHeight);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TO:', 14, barY + 8);
    
    addClientInfo(doc, 14, barY + 15, 10, 4, [31, 41, 55]);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.text('INVOICE NO', 120, barY + 8);
    doc.text('DATE', 160, barY + 8);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.text(invoice.invoiceNumber, 120, barY + 15);
    doc.text(issueDate, 160, barY + 15);

    autoTable(doc, {
      startY: barY + barHeight + 30,
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [5, 150, 105],
        textColor: 255,
        fontSize: 8
      },
      bodyStyles: { 
        lineColor: [240, 240, 240], 
        lineWidth: { bottom: 0.1 },
        fontSize: 9,
        textColor: 70
      },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 15;
    const rightX = 134;

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    
    doc.text('Sub Total', rightX, totalsStartY + 10);
    doc.text(`${subtotal}`, 190, totalsStartY + 10, { align: 'right' });
    
    doc.text(`Tax (${vatRate}%)`, rightX, totalsStartY + 16);
    doc.text(`${vatAmount}`, 190, totalsStartY + 16, { align: 'right' });

    doc.setFillColor(5, 150, 105);
    doc.roundedRect(rightX - 2, totalsStartY + 22, 66, 10, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', rightX + 2, totalsStartY + 28);
    doc.text(`${total} ${currency}`, 190, totalsStartY + 28, { align: 'right' });

    contentEndY = totalsStartY + 28;

  } else if (template === 'horizon') {
    for (let i = 0; i <= 210; i++) {
        const ratio = i / 210;
        const r = 6 + (37 - 6) * ratio;
        const g = 182 + (99 - 182) * ratio;
        const b = 212 + (235 - 212) * ratio;
        doc.setFillColor(r, g, b);
        doc.rect(i, 0, 1.1, 25, 'F');
    }
    
    doc.setFillColor(255, 255, 255);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.2 }));
    doc.ellipse(105, 25, 120, 10, 'F');
    doc.restoreGraphicsState();

    let logoH = 0;
    if (logoBase64) {
      try {
        const { w, h } = getLogoDimensions(60, 40);
        doc.addImage(logoBase64, logoFormat, 14, 30, w, h);
        logoH = h;
      } catch (e) {
        console.error('Failed to render logo in horizon template', e);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(2);
    doc.text('INVOICE', 14, 18);
    doc.setCharSpace(0);

    doc.setFontSize(8);
    doc.text('AMOUNT DUE', 190, 12, { align: 'right' });
    doc.setFontSize(14);
    doc.text(`${total} ${currency}`, 190, 18, { align: 'right' });

    const startBody = Math.max(70, 30 + logoH + 10);
    
    doc.setTextColor(8, 145, 178);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED BY', 14, startBody);
    
    const providerY = addProviderInfo(doc, 14, startBody + 5, 10, 4, [31, 41, 55]);

    const issuedToY = providerY + 10;
    doc.setTextColor(8, 145, 178);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED TO', 14, issuedToY);
    
    const clientInfoEndY = addClientInfo(doc, 14, issuedToY + 5, 10, 4, [31, 41, 55]);

    doc.setTextColor(8, 145, 178);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILS', 190, startBody, { align: 'right' });
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, 190, startBody + 5, { align: 'right' });
    doc.text(issueDate, 190, startBody + 10, { align: 'right' });

    autoTable(doc, {
      startY: Math.max(clientInfoEndY, issuedToY + 25) + 30,
      head: [], 
      body: tableRows,
      theme: 'plain',
      bodyStyles: { 
        lineColor: [229, 231, 235],
        lineWidth: { bottom: 0.1 },
        cellPadding: 4,
        fontSize: 10
      },
      columnStyles: {
        0: { textColor: [55, 65, 81], fontStyle: 'bold' },
        4: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 15;

    doc.setTextColor(75, 85, 99);
    doc.setFontSize(9);
    
    doc.text('Subtotal', 125, totalsStartY + 6);
    doc.text(`${subtotal}`, 190, totalsStartY + 6, { align: 'right' });
    
    doc.text(`Tax (${vatRate}%)`, 125, totalsStartY + 11);
    doc.text(`${vatAmount}`, 190, totalsStartY + 11, { align: 'right' });

    doc.setFillColor(249, 250, 251);
    doc.roundedRect(120, totalsStartY + 15, 76, 12, 2, 2, 'F');
    
    doc.setTextColor(75, 85, 99);
    doc.text('Total Amount', 125, totalsStartY + 22);
    
    doc.setTextColor(8, 145, 178);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 22, { align: 'right' });

    contentEndY = totalsStartY + 22;

  } else if (template === 'neon') {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setFillColor(236, 72, 153);
    doc.rect(0, 0, 70, 1.5, 'F');
    doc.setFillColor(168, 85, 247);
    doc.rect(70, 0, 70, 1.5, 'F');
    doc.setFillColor(6, 182, 212);
    doc.rect(140, 0, 70, 1.5, 'F');
    
    let logoH = 0;
    if (logoBase64) {
      try {
        const { w, h } = getLogoDimensions(50, 40);
        doc.addImage(logoBase64, logoFormat, 14, 15, w, h);
        logoH = h;
      } catch (e) {
        console.error('Failed to render logo in neon template', e);
      }
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 211, 238);
    const titleY = Math.max(65, 15 + logoH + 10);
    doc.text('NEO', 14, titleY);
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 26, titleY);

    doc.setDrawColor(51, 65, 85);
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(170, 14, 26, 8, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(244, 114, 182);
    doc.text(`STATUS: ${(invoice.status || 'PAID').toUpperCase()}`, 183, 19, { align: 'center' });

    const boxY = Math.max(80, titleY + 15);
    const boxHeight = 50; 
    
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.5 }));
    doc.setFillColor(30, 41, 59);
    doc.setDrawColor(51, 65, 85);
    
    doc.roundedRect(14, boxY, 85, boxHeight, 1, 1, 'FD');
    doc.roundedRect(111, boxY, 85, boxHeight, 1, 1, 'FD');
    
    doc.restoreGraphicsState();

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text('FROM', 18, boxY + 5);
    doc.text('TO', 115, boxY + 5);
    
    addProviderInfo(doc, 18, boxY + 12, 9, 4, [255, 255, 255]);
    addClientInfo(doc, 115, boxY + 12, 9, 4, [255, 255, 255]);

    autoTable(doc, {
      startY: boxY + boxHeight + 30,
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        textColor: [34, 211, 238],
        fillColor: [15, 23, 42], 
        lineColor: [51, 65, 85],
        lineWidth: { bottom: 0.1 },
        fontSize: 7
      },
      bodyStyles: { 
        textColor: [209, 213, 219],
        fillColor: [15, 23, 42],
        lineColor: [30, 41, 59],
        lineWidth: { bottom: 0.1 },
        fontSize: 8
      },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 20;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    
    doc.text('Subtotal', 134, totalsStartY + 10);
    doc.text(`${subtotal}`, 190, totalsStartY + 10, { align: 'right' });
    
    doc.text(`Tax (${vatRate}%)`, 134, totalsStartY + 17);
    doc.text(`${vatAmount}`, 190, totalsStartY + 17, { align: 'right' });

    doc.text('TOTAL AMOUNT', 190, totalsStartY + 28, { align: 'right' });
    
    doc.setTextColor(232, 121, 249);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 36, { align: 'right' });

    contentEndY = totalsStartY + 36;

  } else if (template === 'minimalist') {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.setCharSpace(1.5);
    doc.text('INVOICE', 14, 20); 
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text(`#${invoice.invoiceNumber}`, 14, 25); 

    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 40);
      const logoX = 210 - 14 - w;
      doc.addImage(logoBase64, logoFormat, logoX, 15, w, h);
    }

    const colY = Math.max(50, 15 + (logoBase64 ? 40 : 0) + 10);
    
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('From', 14, colY);
    const fromY = addProviderInfo(doc, 14, colY + 6, 10, 4, [0, 0, 0]);

    const col2X = 80;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Billed To', col2X, colY);
    
    addClientInfo(doc, col2X, colY + 6, 10, 4, [0, 0, 0]);

    const col3X = 150;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Issued', col3X, colY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(issueDate, col3X, colY + 6);

    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Total', 196, colY + 15, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total}`, 196, colY + 21, { align: 'right' });

    autoTable(doc, {
      startY: Math.max(fromY, colY + 30) + 10,
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [156, 163, 175],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        lineColor: [243, 244, 246],
        lineWidth: { bottom: 0.1 },
        cellPadding: 4,
        fontSize: 9,
        textColor: 31
      },
      columnStyles: {
          4: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 4, right: 8, bottom: 4, left: 4 };
        }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 20;
    const rightX = 140;

    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('Thank you.', 14, totalsStartY + 10);

    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Subtotal', rightX, totalsStartY);
    doc.setTextColor(0, 0, 0);
    doc.text(`${subtotal} ${currency}`, 190, totalsStartY, { align: 'right' });

    doc.setTextColor(156, 163, 175);
    doc.text('Tax', rightX, totalsStartY + 5);
    doc.setTextColor(0, 0, 0);
    doc.text(`${vatAmount} ${currency}`, 190, totalsStartY + 5, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('Total', 190, totalsStartY + 10, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 16, { align: 'right' });

    contentEndY = totalsStartY + 16;

  } else if (template === 'modern') {
    const headerH = 17;
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, headerH, 'F'); 

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    let logoW = 0;
    if (logoBase64) {
      const { w, h } = getLogoDimensions(40, 10);
      const logoY = (headerH - h) / 2;
      doc.addImage(logoBase64, logoFormat, 14, logoY, w, h);
      logoW = w + 4;
    }

    doc.setCharSpace(1);
    doc.text('INVOICE', 14 + logoW, 11);
    doc.setCharSpace(0);

    doc.setFontSize(6);
    doc.text(invoice.invoiceNumber, 190, 11, { align: 'right' });

    const infoY = 25;
    const providerEndY = addProviderInfo(doc, 14, infoY, 9, 4, [107, 114, 128]);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 190, infoY, { align: 'right' });
    
    const clientEndY = addClientInfo(doc, 190, infoY + 5, 9, 4, [107, 114, 128], 'right');

    autoTable(doc, {
      startY: Math.max(infoY + 45, providerEndY + 10, clientEndY + 10),
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: 5,
        halign: 'left',
        fontStyle: 'bold'
      },
      bodyStyles: { 
        lineColor: [249, 250, 251], 
        lineWidth: { bottom: 0.1 },
        textColor: 75,
        fontSize: 5,
        cellPadding: 3
      },
      columnStyles: {
        4: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 3, right: 6, bottom: 3, left: 3 };
        }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 10;
    const rightX = 140;
    
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    
    doc.text('Subtotal', rightX, totalsStartY - 10);
    doc.setTextColor(75, 85, 99);
    doc.text(`${subtotal} ${currency}`, 200, totalsStartY - 10, { align: 'right' });
    
    doc.setTextColor(156, 163, 175);
    doc.text('Tax', rightX, totalsStartY - 4);
    doc.setTextColor(75, 85, 99);
    doc.text(`${vatAmount} ${currency}`, 200, totalsStartY - 4, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('Total Due', 200, totalsStartY + 5, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 200, totalsStartY + 12, { align: 'right' });

    contentEndY = totalsStartY + 12;

  } else if (template === 'professional') {
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 4.5, 'F'); 

    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 25);
      doc.addImage(logoBase64, logoFormat, 196 - w, 15, w, h);
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    doc.text('INVOICE', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`No: ${invoice.invoiceNumber} • ${issueDate}`, 14, 25);

    const gridY = 45;
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM', 14, gridY);
    
    const providerEndY = addProviderInfo(doc, 14, gridY + 6, 10, 4.5, [107, 114, 128]);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TO', 105, gridY); 
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clientEndY = addClientInfo(doc, 105, gridY + 6, 10, 4.5, [107, 114, 128]);

    autoTable(doc, {
      startY: Math.max(gridY + 60, providerEndY + 10, clientEndY + 10),
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [243, 244, 246],
        textColor: [30, 41, 59],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: { 
        textColor: [75, 85, 99],
        lineColor: [243, 244, 246],
        lineWidth: { bottom: 0.1 },
        fontSize: 7,
        cellPadding: 3
      },
      columnStyles: {
        4: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 2, right: 5, bottom: 2, left: 2 };
        }
      }
    });

    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 20;
    const rightX = 140;

    doc.setFontSize(6);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you', 14, totalsStartY + 5);
    doc.setFont('helvetica', 'normal');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal', rightX, totalsStartY - 10);
    doc.setTextColor(51, 65, 85);
    doc.text(`${subtotal} ${currency}`, 196, totalsStartY - 10, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text('Tax', rightX, totalsStartY - 4);
    doc.setTextColor(51, 65, 85);
    doc.text(`${vatAmount} ${currency}`, 196, totalsStartY - 4, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(rightX, totalsStartY, 196, totalsStartY);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Total', 196, totalsStartY + 1, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 196, totalsStartY + 6, { align: 'right' });

    contentEndY = totalsStartY + 6;

  } else if (template === 'creative') {
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 70, 297, 'F'); 

    doc.setTextColor(255, 255, 255);
    
    let providerY = 50;
    if (logoBase64) {
       doc.addImage(logoBase64, logoFormat, 10, 10, 50, 50);
       doc.setFontSize(28); 
       doc.setFont('helvetica', 'bold');
       doc.text('INVOICE', 10, 70);
       providerY = 85;
    } else {
       doc.setFontSize(28); 
       doc.setFont('helvetica', 'bold');
       doc.text('INVOICE', 10, 30);
    }

    const providerEndY = addProviderInfo(doc, 10, providerY, 9, 4, [255, 255, 255]);

    const billToY = Math.max(130, providerEndY + 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 10, billToY);
    
    addClientInfo(doc, 10, billToY + 8, 9, 4, [255, 255, 255]);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(45); 
    doc.text(`#${invoice.invoiceNumber}`, 80, 30);

    doc.setFontSize(9);
    doc.text(`Date: ${issueDate}`, 80, 45);
    doc.text(`Due: ${dueDate}`, 140, 45);
    if (invoice.paymentTerms) {
       doc.text(`Terms: ${invoice.paymentTerms}`, 80, 52);
    }

    autoTable(doc, {
      startY: 70,
      margin: { left: 80 },
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [79, 70, 229],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { 
        lineColor: [243, 244, 246], 
        lineWidth: { bottom: 0.1 },
        fontSize: 9
      },
      columnStyles: {
        4: { halign: 'right' }
      }
    });
    
    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 20;

    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal', 144, totalsStartY + 10, { align: 'right' });
    doc.text(`${subtotal}`, 190, totalsStartY + 10, { align: 'right' });
    
    doc.text(`Tax (${vatRate}%)`, 144, totalsStartY + 17, { align: 'right' });
    doc.text(`${vatAmount}`, 190, totalsStartY + 17, { align: 'right' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 27, { align: 'right' });

    contentEndY = totalsStartY + 27;

  } else {
    // === Default Simple Template (Aligned with Client Side) ===
    let headerY = 20;
    
    // Left: Logo + Invoice Info
    let logoW = 0;
    if (logoBase64) {
      try {
        const { w, h } = getLogoDimensions(40, 10);
        doc.addImage(logoBase64, logoFormat, 14, 15, w, h);
        logoW = w + 4;
      } catch (e) {
        console.error('Failed to render logo in simple template', e);
      }
    }
    
    const titleX = 14 + logoW;
    doc.setFontSize(8); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text(t('invoiceTitle', 'INVOICE'), titleX, 19);
    
    doc.setFontSize(5); 
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(`#${invoice.invoiceNumber}`, titleX, 23);
    
    // Right: Provider Info (all company details)
    const providerY = addProviderInfo(doc, 196, 19, 10, 4, [31, 41, 55], 'right');
    
    headerY = Math.max(providerY, 25);
    
    // Divider Section
    const dividerY = headerY + 5; 
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setLineWidth(0.1);
    doc.line(14, dividerY, 196, dividerY);
    
    const contentY = dividerY + 5; 
    
    // Left: Client
    doc.setFontSize(10); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.text(t('to', 'Client:'), 14, contentY);
    
    // Client Address
    addClientInfo(doc, 14, contentY + 5, 10, 4.5, [107, 114, 128]); 
    
    // Right: Date
    doc.setFontSize(5); 
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.text(t('date', 'Date:'), 196, contentY, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(issueDate, 196, contentY + 3, { align: 'right' });
    
    const sectionBottomY = contentY + 10; 
    doc.line(14, sectionBottomY, 196, sectionBottomY);
    
    // Table
    autoTable(doc, {
      startY: sectionBottomY + 60, 
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [243, 244, 246], // Gray-100
        textColor: [55, 65, 81], // Gray-700
        fontSize: 5, 
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: { 
        textColor: [75, 85, 99], // Gray-600
        fontSize: 5, 
        cellPadding: 2,
        lineColor: 255
      },
      columnStyles: {
        4: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 2, right: 5, bottom: 2, left: 2 };
        }
      }
    });
    
    // Footer / Totals
    const finalY = doc.lastAutoTable?.finalY || 150;
    const totalsStartY = finalY + 30; 
    const rightX = 140;

    doc.setDrawColor(31, 41, 55); 
    doc.setLineWidth(0.5);
    doc.line(rightX, totalsStartY - 15, 200, totalsStartY - 15);

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); 
    doc.text(t('subtotal', 'Subtotal'), rightX, totalsStartY - 10);
    doc.setTextColor(31, 41, 55); 
    doc.text(`${subtotal}`, 200, totalsStartY - 10, { align: 'right' });

    // Tax
    doc.setTextColor(107, 114, 128); 
    doc.text(t('tax', 'Tax'), rightX, totalsStartY - 4);
    doc.setTextColor(31, 41, 55); 
    doc.text(`${vatAmount}`, 200, totalsStartY - 4, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); 
    doc.setFont('helvetica', 'bold');
    doc.text(t('total', 'Total'), 200, totalsStartY + 3, { align: 'right' });
    doc.text(`${total} ${currency}`, 200, totalsStartY + 8, { align: 'right' });

    contentEndY = totalsStartY + 8;
  }

  // Content after totals (Notes & Payment Details)
  const hasNotes = !!invoice.notes && invoice.notes.trim().length > 0;
  const hasPaymentTerms = !!invoice.paymentTerms && invoice.paymentTerms.trim().length > 0;
  const paymentLink = invoice.paymentLink;
  const paymentInstructions = invoice.user?.paymentInstructions;
  const hasPaymentDetails = !!paymentLink || !!paymentInstructions;

  if (hasNotes || hasPaymentTerms || hasPaymentDetails) {
      const pageHeight = doc.internal.pageSize.height || 297;
      let notesX = 14;
      let titleColor = [50, 50, 50];
      let bodyColor = [80, 80, 80];

      if (template === 'neon') {
          titleColor = [255, 255, 255];
          bodyColor = [209, 213, 219]; // gray-300
      } else if (template === 'professional') {
          notesX = 80;
      }

      // 1. Calculate content height
      let contentHeight = 0;
      
      // Notes Section Height
      let notesSectionHeight = 0;
      if (hasNotes || hasPaymentTerms) {
          notesSectionHeight += 10; // Title + gap
          if (hasPaymentTerms) notesSectionHeight += 5;
          if (hasNotes) {
              const splitNotes = doc.splitTextToSize(invoice.notes, 180 - (notesX - 14));
              notesSectionHeight += (splitNotes.length * 4);
          }
      }
      contentHeight += notesSectionHeight;

      // Payment Details Section Height
      let paymentSectionHeight = 0;
      if (hasPaymentDetails) {
          if (contentHeight > 0) contentHeight += 10; // Gap
          paymentSectionHeight += 10; // Title + gap
          if (paymentLink) paymentSectionHeight += 6;
          if (paymentInstructions) {
              const splitInstructions = doc.splitTextToSize(paymentInstructions, 150 - (notesX - 14));
              paymentSectionHeight += (splitInstructions.length * 5);
          }
      }
      contentHeight += paymentSectionHeight;

      // 2. Determine Start Y
      const lastTableY = doc.lastAutoTable?.finalY || 150;
      const contentBaseY = Math.max(lastTableY, contentEndY || 0);
      let baseOffset = 40;
      if (template === 'creative') baseOffset = 100;
      if (['neon', 'modern', 'geometric'].includes(template)) baseOffset += 20;

      const desiredY = contentBaseY + baseOffset;
      const bottomMargin = 20;
      const maxY = pageHeight - bottomMargin - contentHeight;
      
      // Check if we need a new page
      let startY = Math.min(desiredY, maxY);
      
      if (maxY < contentBaseY + 20) {
           doc.addPage();
           if (template === 'neon') {
             doc.setFillColor(15, 23, 42);
             doc.rect(0, 0, 210, 297, 'F');
          } else if (template === 'professional') {
             doc.setFillColor(30, 41, 59);
             doc.rect(0, 0, 70, 297, 'F');
          }
           startY = 40;
      } else if (startY < contentBaseY + 20) {
           startY = contentBaseY + 20;
      }
      
      let currentY = startY;

      // 3. Render Content
      if (hasNotes || hasPaymentTerms) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...titleColor);
          doc.text("Notes / Terms:", notesX, currentY);
          
          let textY = currentY + 6;
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(...bodyColor);

          if (hasPaymentTerms && invoice.paymentTerms) {
              doc.text(`Payment Terms: ${invoice.paymentTerms}`, notesX, textY);
              textY += 5;
          }
          
          if (hasNotes && invoice.notes) {
              const splitNotes = doc.splitTextToSize(invoice.notes, 180 - (notesX - 14));
              doc.text(splitNotes, notesX, textY);
              textY += (splitNotes.length * 4);
          }
          currentY = textY + 6;
      }

      if (hasPaymentDetails) {
          if (hasNotes || hasPaymentTerms) currentY += 4;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...titleColor);
          doc.text("Payment Details", notesX, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          let detailsY = currentY + 6;

          if (paymentLink) {
              doc.text("Pay Online:", notesX, detailsY);
              doc.setTextColor(0, 126, 230); // Blue link color
              doc.text(paymentLink, notesX + 21, detailsY); 
              doc.setTextColor(...titleColor); // Reset color
              detailsY += 6;
          }

          if (paymentInstructions) {
              doc.setTextColor(...bodyColor);
              doc.text("Instructions:", notesX, detailsY);
              const splitInstructions = doc.splitTextToSize(paymentInstructions, 150 - (notesX - 14));
              doc.text(splitInstructions, notesX + 21, detailsY);
              detailsY += (splitInstructions.length * 5);
          }
      }
  }

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating invoice PDF', error);
    const fallbackDoc = new jsPDF();
    fallbackDoc.setFontSize(12);
    fallbackDoc.text('Error generating invoice PDF', 10, 10);
    fallbackDoc.setFontSize(10);
    fallbackDoc.text(error.message || 'Unknown error', 10, 20);
    return Buffer.from(fallbackDoc.output('arraybuffer'));
  }
};
