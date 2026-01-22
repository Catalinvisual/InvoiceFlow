import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateFormatter';

type JsPDFWithGState = jsPDF & {
  GState?: new (options: { opacity?: number }) => unknown;
  setGState?: (state: unknown) => jsPDF;
};

const setOpacity = (doc: jsPDF, opacity: number) => {
  const gDoc = doc as unknown as JsPDFWithGState;
  if (typeof gDoc.setGState === 'function' && gDoc.GState) {
    const state = new gDoc.GState({ opacity });
    gDoc.setGState(state);
  }
};

const getPageHeight = (doc: jsPDF): number => {
  const pageSize = doc.internal.pageSize as unknown as { height?: number; getHeight?: () => number };
  return pageSize.height ?? pageSize.getHeight?.() ?? 297;
};

// Definim tipurile necesare
interface TemplateConfig {
  labels?: {
      invoiceTitle?: string;
      from?: string;
      to?: string;
      date?: string;
      due?: string;
      total?: string;
      item?: string;
      quantity?: string;
      price?: string;
      amount?: string;
      subtotal?: string;
      tax?: string;
  };
  columns?: {
      quantity?: boolean;
      price?: boolean;
  };
  custom?: {
      sections: Array<{ id: string; label: string; isVisible: boolean; order: number }>;
      styles: {
          backgroundColor: string;
          textColor: string;
          primaryColor: string;
          borderColor: string;
          fontFamily: string;
      };
  };
}

interface Settings {
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  zipCode?: string | null;
  iban?: string | null;
  bank?: string | null;
  swift?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  currency?: string | null;
  invoiceTemplate?: string | null;
  templateConfig?: TemplateConfig | null;
}

interface Client {
  name: string;
  cui?: string | null;
  regCom?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  zipCode?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[] | string;
  total: number | string;
  subtotal?: number | string;
  vatRate?: number | string;
  vatAmount?: number | string;
  status: string;
  notes?: string | null;
  paymentTerms?: string | null;
}

const getBase64ImageFromURL = async (url: string): Promise<{ data: string, width: number, height: number } | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            const img = new Image();
            img.onload = () => {
                // If it's a JPEG or PNG, use the original data to preserve quality
                // Check blob type or base64 header
                const isJpeg = blob.type === 'image/jpeg' || blob.type === 'image/jpg' || base64data.startsWith('data:image/jpeg');
                const isPng = blob.type === 'image/png' || base64data.startsWith('data:image/png');

                if (isJpeg || isPng) {
                    resolve({ data: base64data, width: img.width, height: img.height });
                } else {
                    // For other formats (e.g. WEBP), convert to PNG via canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
                    } else {
                        // Fallback to original if canvas fails
                        resolve({ data: base64data, width: img.width, height: img.height });
                    }
                }
            };
            img.onerror = () => {
                reject(new Error('Failed to load image for dimensions'));
            };
            img.src = base64data;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Fetch failed, falling back to Image load:', error);
    // Fallback for CORS or other fetch issues
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Use highest quality for canvas export if we must fallback
                ctx.drawImage(img, 0, 0);
                resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
            } else {
                reject(new Error('Canvas context is null'));
            }
        };
        img.onerror = reject;
        img.src = url;
    });
  }
};

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

export const generateInvoicePDF = async (invoice: Invoice, client: Client, settings: Settings) => {
  const doc = new jsPDF();
  const template = settings.invoiceTemplate || 'simple';

  let logoBase64: string | null = null;
  let logoFormat: 'PNG' | 'JPEG' = 'PNG';
  let logoDimensions: { width: number, height: number } | null = null;
  let contentEndY = 0; // Track end of content for notes positioning

  if (settings.logoUrl) {
      try {
          let logoUrl = settings.logoUrl;
          // Ensure URL is absolute if it's relative
          if (logoUrl.startsWith('/')) {
             const apiBase = 'http://localhost:5000'; // Default dev
             logoUrl = `${apiBase}${logoUrl}`;
          }
          
          const result = await getBase64ImageFromURL(logoUrl);
          if (result) {
             logoBase64 = result.data;
             logoDimensions = { width: result.width, height: result.height };

             if (logoBase64.startsWith('data:image/jpeg')) {
                logoFormat = 'JPEG';
             } else if (logoBase64.startsWith('data:image/png')) {
                logoFormat = 'PNG';
             } else {
                // Invalid or unsupported format (e.g. text/html from a failed fetch that returned 404 page)
                console.warn('Invalid image format returned:', logoBase64.substring(0, 30));
                logoBase64 = null;
             }
          }
      } catch (e) {
          console.error('Failed to load logo', e);
      }
  }

  const getLogoDimensions = (maxWidth: number, maxHeight: number) => {
    if (!logoDimensions || logoDimensions.width === 0 || logoDimensions.height === 0) {
        return { w: maxWidth, h: maxHeight }; // Fallback to max dimensions if actual not known
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

  const showQty = settings.templateConfig?.columns?.quantity !== false;
  const showPrice = settings.templateConfig?.columns?.price !== false;
  const t = (key: string, defaultVal: string) => settings.templateConfig?.labels?.[key as keyof typeof settings.templateConfig.labels] || defaultVal;

  const tableColumn = [
    "No.",
    t('item', "Description"),
    ...(showQty ? [t('quantity', "Qty")] : []),
    ...(showPrice ? [t('price', "Unit Price")] : []),
    t('amount', "Total")
  ];
  const tableRows: Array<Array<string | number>> = [];

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

  // Helper function to add common provider info
  const addProviderInfo = (doc: jsPDF, x: number, y: number, fontSize: number = 10, lineHeight: number = 4, color: [number, number, number] = [0, 0, 0], align: 'left' | 'right' | 'center' = 'left') => {
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
      settings.cui ? `VAT ID: ${settings.cui}` : null,
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
    
    return currentY; // Return new Y position
  };

  // Helper function to add common client info
  const addClientInfo = (doc: jsPDF, x: number, y: number, fontSize: number = 10, lineHeight: number = 5, color: [number, number, number] = [0, 0, 0], align: 'left' | 'right' = 'left', skipName: boolean = false) => {
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    
    if (!skipName) {
      doc.text(client.name || '', x, y, { align });
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize - 1);
    
    let currentY = y + lineHeight;
    
    const addressDetails = [
      client.address,
      [client.city, client.county].filter(Boolean).join(", "),
      [client.country, client.zipCode].filter(Boolean).join(" ")
    ].filter(Boolean);

    addressDetails.forEach(detail => {
      if (detail) {
        doc.text(String(detail), x, currentY, { align });
        currentY += lineHeight;
      }
    });

    if (client.cui) {
        doc.text(`VAT ID: ${client.cui}`, x, currentY, { align });
        currentY += lineHeight;
    }
    
    if (client.phone) {
        doc.text(client.phone, x, currentY, { align });
        currentY += lineHeight;
    }

    if (client.email) {
        doc.text(client.email, x, currentY, { align });
        currentY += lineHeight;
    }
    if (client.regCom) {
        doc.text(`Reg: ${client.regCom}`, x, currentY, { align });
        currentY += lineHeight;
    }
    
    return currentY;
  };

  // Check for custom template configuration first
  // If templateConfig.custom exists, it means a custom template is active
  if (settings.templateConfig?.custom) {
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
                      const { w, h } = getLogoDimensions(50, 30);
                      doc.addImage(logoBase64, logoFormat, marginX, currentY, w, h);
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
                  // @ts-expect-error jspdf-autotable types issue
                  currentY = (doc.lastAutoTable?.finalY || currentY) + 10;
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

      contentEndY = Math.max(contentEndY, currentY);

  } else if (template === 'editorial') {
    // === Editorial Serif Template ===
    doc.setFillColor(250, 249, 246);
    doc.rect(0, 0, 210, 297, 'F');
    
    const marginX = 10;
    const rightX = 195;
    const currentY = 15;
    let providerStartY = currentY;

    // Logo or Big &
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
    
    // INVOICE Label
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setCharSpace(3); 
    // Adjusted right margin for INVOICE as requested
    doc.text('INVOICE', rightX - 10, currentY + 10, { align: 'right' });
    doc.setCharSpace(0); 
    
    // Provider Info
    const providerEndY = addProviderInfo(doc, marginX, providerStartY, 10, 4, [0, 0, 0]);

    // Flex Row: Billed To (Left) vs Details (Right)
    const sectionY = providerEndY + 4;

    // Left: Billed To
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('BILLED TO:', marginX, sectionY);
    
    const clientInfoEndY = addClientInfo(doc, marginX, sectionY + 6, 10, 4, [0, 0, 0]);
    doc.setTextColor(0);

    // Right Side Details
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.text(`Invoice No. ${invoice.invoiceNumber}`, rightX, sectionY, { align: 'right' });
    doc.text(issueDate, rightX, sectionY + 5, { align: 'right' });

    // Table
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
            // Adjust padding to move text slightly left
            data.cell.styles.cellPadding = { top: 3, right: 6, bottom: 3, left: 3 };
        }
      }
    });

    // Totals
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    
    // Push totals to bottom
    const totalsStartY = finalY + 6;
    
    // Subtotal/Tax
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal', 140, totalsStartY + 5);
    doc.text(`${subtotal}`, rightX, totalsStartY + 5, { align: 'right' });
    
    doc.text(`Tax (${vatRate}%)`, 140, totalsStartY + 10);
    doc.text(`${vatAmount}`, rightX, totalsStartY + 10, { align: 'right' });

    // Total Line
    const totalLineY = totalsStartY + 15;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(marginX, totalLineY, rightX, totalLineY);

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('Total', rightX - 40, totalLineY + 6, { align: 'right' });
    doc.text(`${total} ${currency}`, rightX, totalLineY + 6, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalLineY + 6);

  } else if (template === 'geometric') {
    // === Geometric Blue Template ===
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');

    // Shapes: Preview has Blue 900 (z-10) over Blue 600 (z-0).
    // And shapes are skewed rectangles (parallelograms).
    // Skew -20deg means bottom shifts LEFT.
    
    // Shape 2 (Light Blue) - Below Dark Blue
    // Starts where Dark Blue ends (y=45)
    // Matches width of Dark Blue (TL=94, TR=204 based on Dark Blue bottom coords)
    // Height: ~1/4 of Dark Blue (45mm) -> ~11mm
    // Skew calculation: shift = height * tan(20deg) ~= 11 * 0.36 ~= 4mm
    
    const s2_height = 11;
    const skew_shift = 4;

    // Dark Blue Bottom coordinates were: BL=94, BR=204 at Y=45 (from s1_bl_x and s1_br_x below)
    const s2_tl_x = 94; 
    const s2_tr_x = 204; 
    const s2_br_x = 204 - skew_shift; 
    const s2_bl_x = 94 - skew_shift; 
    
    const s2_y_start = 45;
    const s2_y_end = 45 + s2_height;

    doc.setFillColor(96, 165, 250); // Blue-400
    doc.path([
        { op: 'm', c: [s2_tl_x, s2_y_start] },
        { op: 'l', c: [s2_tr_x, s2_y_start] },
        { op: 'l', c: [s2_br_x, s2_y_end] },
        { op: 'l', c: [s2_bl_x, s2_y_end] },
        { op: 'h' }
    ]);
    doc.fill();

    // Shape 1 (Blue 900) - Top Layer
    // w=60% (126mm), h=15% (45mm). Right aligned.
    doc.setFillColor(30, 58, 138); // Blue-900
    doc.saveGraphicsState();
    setOpacity(doc, 1);
    const s1_tr_x = 220; 
    const s1_tl_x = 110; // Starts further right than Shape 2's start to reveal it? 
    // No, Shape 2 TL is 90. Shape 1 TL is 110. So Shape 2 is visible on the left.
    const s1_br_x = 204; 
    const s1_bl_x = 94;  
    doc.path([
        { op: 'm', c: [s1_tl_x, 0] },
        { op: 'l', c: [s1_tr_x, 0] },
        { op: 'l', c: [s1_br_x, 45] },
        { op: 'l', c: [s1_bl_x, 45] },
        { op: 'h' }
    ]);
    doc.fill();
    doc.restoreGraphicsState();

    // Logo or "T" Box
    let logoBottomY = 35;
    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 40);
      doc.addImage(logoBase64, logoFormat, 14, 20, w, h);
      logoBottomY = 20 + h + 10;
    } else {
      doc.setFillColor(30, 58, 138);
      doc.roundedRect(14, 20, 12, 12, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text((settings.companyName || 'C').charAt(0).toUpperCase(), 20, 27.5, { align: 'center' });
      logoBottomY = 40;
    }

    // INVOICE Right
    // In Preview: "INVOICE" and ID are in a text-white div over the shapes.
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 190, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.saveGraphicsState();
    setOpacity(doc, 0.9);
    doc.text(`#${invoice.invoiceNumber}`, 190, 32, { align: 'right' });
    doc.restoreGraphicsState();

    // Provider Info (Right - Below Header)
    const providerStartY = 45;
    const providerEndY = addProviderInfo(doc, 190, providerStartY, 11, 4.5, [30, 58, 138], 'right');

    // Right: Date (Below Provider Info)
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 190, providerEndY + 5, { align: 'right' });
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(issueDate, 190, providerEndY + 10, { align: 'right' });

    const rightColumnEndY = providerEndY + 15;

    // Left: Invoice To (Below Logo)
    const clientStartY = Math.max(logoBottomY, 45);

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice To:', 14, clientStartY);
    
    const clientEndY = addClientInfo(doc, 14, clientStartY + 5, 11, 4.5, [0, 0, 0]);

    // Table
    autoTable(doc, {
      startY: Math.max(clientEndY, rightColumnEndY) + 10,
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
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 3, right: 6, bottom: 3, left: 3 };
        }
      }
    });

    // Total Box
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Push totals to bottom - Increased spacing to avoid overlap
    const totalsStartY = finalY + 30;

    const barWidth = 130; // Increased for horizontal padding
    const barHeight = 18;
    const barX = 210 - barWidth - 10;
    
    // Subtotal and Tax
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal', barX + 5, totalsStartY - 10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${subtotal} ${currency}`, 200, totalsStartY - 10, { align: 'right' });
    
    doc.setTextColor(100, 100, 100);
    doc.text('Tax', barX + 5, totalsStartY - 4);
    doc.setTextColor(0, 0, 0);
    doc.text(`${vatAmount} ${currency}`, 200, totalsStartY - 4, { align: 'right' });

    // Total Bar
    doc.setFillColor(30, 58, 138); // Blue 900
    // Increased padding: height from 12 to 18
    doc.roundedRect(barX, totalsStartY, barWidth, 18, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    // Combined text to avoid overlap and spacing issues
    doc.text(`TOTAL ${currency} ${total}`, barX + barWidth - 20, totalsStartY + 11, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 18);

    // Bottom Shape (Reduced height)
    // h=8% (24mm)
    doc.setFillColor(30, 58, 138);
    doc.saveGraphicsState();
    setOpacity(doc, 0.1);
    // Skew -20deg.
    doc.path([
        { op: 'm', c: [-10, 297 - 24] },
        { op: 'l', c: [210 * 0.4, 297 - 24] },
        { op: 'l', c: [(210 * 0.4) - 8, 297] },
        { op: 'l', c: [-10 - 8, 297] },
        { op: 'h' }
    ]);
    doc.fill();
    doc.restoreGraphicsState();

  } else if (template === 'business') {
    // === Business Corp Template ===
    doc.setFillColor(5, 150, 105); // Emerald-600
    doc.rect(0, 0, 210, 4, 'F'); 

    // Header Container
    let logoH = 0;
    
    // Logo
    if (logoBase64) {
      // Preview h-8 is ~32px ~ 8mm.
      const { w, h } = getLogoDimensions(30, 40); // Allow taller logos up to 40mm
      doc.addImage(logoBase64, logoFormat, 14, 20, w, h);
      logoH = h;
    } else {
      // Icon
      doc.setFillColor(5, 150, 105);
      doc.roundedRect(14, 20, 10, 10, 0, 0, 'F');
      logoH = 10;
    }
    
    // Provider Info - Below Logo
    const providerY = addProviderInfo(doc, 14, Math.max(55, 20 + logoH + 10), 12, 4, [30, 41, 59]);

    // INVOICE Right
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 190, 22, { align: 'right' });

    // Gray Bar
    const barY = Math.max(70, providerY + 10); // Dynamic bar position
    const barHeight = 35; 
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.rect(0, barY, 210, barHeight, 'F');
    doc.setDrawColor(243, 244, 246);
    doc.line(0, barY, 210, barY);
    doc.line(0, barY + barHeight, 210, barY + barHeight);

    // Inside Gray Bar
    // Left: Invoice To
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE TO:', 14, barY + 8);
    
    // Client Info
    const clientEndY = addClientInfo(doc, 14, barY + 14, 11, 4.5, [31, 41, 55]);

    // Right side of Gray Bar: Grid columns
    // Invoice No
    const col1X = 120;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE NO', col1X, barY + 8);
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber, col1X, barY + 14);

    // Date
    const col2X = 160;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', col2X, barY + 8);
    
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(issueDate, col2X, barY + 14);

    // Table
    autoTable(doc, {
      startY: Math.max(barY + barHeight + 10, clientEndY + 10),
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [5, 150, 105], // Emerald-600
        textColor: 255,
        fontSize: 8,
        halign: 'left',
        cellPadding: 2
      },
      bodyStyles: { 
        lineColor: [236, 253, 245], // emerald-50
        lineWidth: { bottom: 0.1 },
        fontSize: 9,
        textColor: 70,
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

    // Totals
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Push totals to bottom
    const totalsStartY = finalY + 10;
    
    const totalsX = 130;
    const rightX = 130;
    const rightEdge = 196;
    let currentTotalY = totalsStartY;

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Sub Total', totalsX, currentTotalY);
    
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${subtotal}`, rightEdge, currentTotalY, { align: 'right' });
    
    doc.setDrawColor(229, 231, 235);
    doc.line(totalsX, currentTotalY + 2, rightEdge, currentTotalY + 2);

    // Tax
    currentTotalY += 8;
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax', totalsX, currentTotalY);
    
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${vatAmount}`, rightEdge, currentTotalY, { align: 'right' });

    doc.line(totalsX, currentTotalY + 2, rightEdge, currentTotalY + 2);

    // Total Green Box
    currentTotalY += 6;
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(totalsX, currentTotalY, rightEdge - totalsX, 10, 1, 1, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', rightEdge - 40, currentTotalY + 6, { align: 'right' });
    doc.text(`${total} ${currency}`, rightEdge - 2, currentTotalY + 6, { align: 'right' });

    contentEndY = Math.max(contentEndY, currentTotalY + 6);

  } else if (template === 'horizon') {
    // === Horizon Gradient Template ===
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
    setOpacity(doc, 0.2);
    doc.ellipse(105, 25, 120, 10, 'F');
    doc.restoreGraphicsState();

    let logoH = 0;
    if (logoBase64) {
      const { w, h } = getLogoDimensions(60, 40);
      doc.addImage(logoBase64, logoFormat, 14, 30, w, h);
      logoH = h;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(2);
    doc.text('INVOICE', 14, 18);
    doc.setCharSpace(0);

    doc.setFontSize(6);
    doc.text('AMOUNT DUE', 190, 12, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`${total} ${currency}`, 190, 18, { align: 'right' });

    // Body
    const startBody = Math.max(70, 30 + logoH + 10); // Dynamic body start
    
    // Issued By (Left)
    doc.setTextColor(8, 145, 178); // Cyan-600
    doc.setFontSize(10); // Increased from 9
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED BY', 14, startBody);
    
    const providerY = addProviderInfo(doc, 14, startBody + 5, 10, 4.5, [31, 41, 55]); // Increased from 9

    // Issued To (Left, below Provider)
    const issuedToY = providerY + 10; // Increased spacing
    doc.setTextColor(8, 145, 178);
    doc.setFontSize(10); // Increased from 9
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED TO', 14, issuedToY);
    
    const clientInfoEndY = addClientInfo(doc, 14, issuedToY + 5, 10, 4.5, [31, 41, 55]); // Increased from 9

    // Details (Right, aligned with Issued To)
    // In Preview, ISSUED TO and DETAILS are on the same row.
    doc.setTextColor(8, 145, 178);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILS', 190, issuedToY, { align: 'right' });
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, 190, issuedToY + 5, { align: 'right' });
    doc.text(issueDate, 190, issuedToY + 10, { align: 'right' });

    // Table
    autoTable(doc, {
      startY: Math.max(clientInfoEndY, issuedToY + 25) + 10, // Dynamic table start
      head: [tableColumn], 
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [8, 145, 178], // Cyan-600
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        lineColor: [229, 231, 235],
        lineWidth: { bottom: 0.1 },
        cellPadding: 4,
        fontSize: 7
      },
      columnStyles: {
        0: { textColor: [55, 65, 81], fontStyle: 'bold' },
        4: { textColor: [37, 99, 235], fontStyle: 'bold', halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 4) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = { top: 4, right: 8, bottom: 4, left: 4 };
        }
      }
    });

    // Footer Total
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Push totals to bottom
    const totalsStartY = finalY + 30;
    const rightX = 130;

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Sub Total', rightX, totalsStartY - 10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${subtotal} ${currency}`, 190, totalsStartY - 10, { align: 'right' });

    // Tax
    doc.setTextColor(100, 100, 100);
    doc.text('Tax', rightX, totalsStartY - 4);
    doc.setTextColor(0, 0, 0);
    doc.text(`${vatAmount} ${currency}`, 190, totalsStartY - 4, { align: 'right' });

    doc.setFillColor(249, 250, 251); // Gray-50
    doc.roundedRect(120, totalsStartY, 76, 12, 2, 2, 'F');
    
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(8);
    doc.text('Total Amount', 190 - 40, totalsStartY + 8, { align: 'right' });
    
    doc.setTextColor(8, 145, 178);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 8, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 8);

  } else if (template === 'neon') {
    // === Neon Cyber Template ===
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, 210, 297, 'F');
    
    // Top Gradient Line
    doc.setFillColor(236, 72, 153); // Pink
    doc.rect(0, 0, 70, 1.5, 'F');
    doc.setFillColor(168, 85, 247); // Purple
    doc.rect(70, 0, 70, 1.5, 'F');
    doc.setFillColor(6, 182, 212); // Cyan
    doc.rect(140, 0, 70, 1.5, 'F');

    let logoH = 0;
    if (logoBase64) {
      const { w, h } = getLogoDimensions(40, 12);
      doc.addImage(logoBase64, logoFormat, 14, 15, w, h);
      logoH = h;
    }
    
    // Status Box (Right)
    doc.setDrawColor(51, 65, 85); // Slate-700
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.roundedRect(170, 15, 26, 8, 1, 1, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(244, 114, 182); // Pink-400
    doc.text(`STATUS: ${(invoice.status || 'PAID').toUpperCase()}`, 183, 20, { align: 'center' });

    // From / To Boxes (Side by Side)
    const boxY = Math.max(26, 15 + logoH + 10); // Dynamic boxY
    const boxHeight = 65; // Increased from 45 to fit more info
    const boxWidth = 88;
    
    doc.saveGraphicsState();
    setOpacity(doc, 0.5);
    doc.setFillColor(30, 41, 59);
    doc.setDrawColor(51, 65, 85);
    
    // Box 1 (Left - FROM)
    doc.roundedRect(14, boxY, boxWidth, boxHeight, 1, 1, 'FD');
    // Box 2 (Right - TO)
    doc.roundedRect(108, boxY, boxWidth, boxHeight, 1, 1, 'FD');
    
    doc.restoreGraphicsState();

    // Content inside boxes
    // FROM
    doc.setTextColor(148, 163, 184); // Gray-400
    doc.setFontSize(7);
    doc.text('FROM', 18, boxY + 6);
    
    addProviderInfo(doc, 18, boxY + 12, 9, 4, [255, 255, 255]);

    // TO
    doc.setTextColor(148, 163, 184); // Gray-400
    doc.setFontSize(7);
    doc.text('TO', 112, boxY + 6);
    
    // Client Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(client.name, 112, boxY + 12);
    
    // Client Address
    const clientEndY = addClientInfo(doc, 112, boxY + 17, 8, 4, [148, 163, 184], 'left', true); // Gray-400

    // Table
    autoTable(doc, {
      startY: Math.max(boxY + boxHeight + 10, clientEndY + 10), // Reduced spacing
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        textColor: [34, 211, 238], // Cyan-400
        fillColor: [15, 23, 42], 
        lineColor: [51, 65, 85],
        lineWidth: { bottom: 0.1 },
        fontSize: 8
      },
      bodyStyles: { 
        textColor: [209, 213, 219], // Gray-300
        fillColor: [15, 23, 42],
        lineColor: [30, 41, 59], // Slate-800
        lineWidth: { bottom: 0.1 },
        fontSize: 9,
        cellPadding: 4
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

    // Total
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Push totals to bottom
    const totalsStartY = finalY + 10;
    const rightX = 140;

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Gray-400
    doc.text('SUBTOTAL', rightX, totalsStartY);
    doc.setTextColor(209, 213, 219); // Gray-300
    doc.text(`${subtotal} ${currency}`, 190, totalsStartY, { align: 'right' });

    // Tax
    doc.setTextColor(148, 163, 184); // Gray-400
    doc.text('TAX', rightX, totalsStartY + 5);
    doc.setTextColor(209, 213, 219); // Gray-300
    doc.text(`${vatAmount} ${currency}`, 190, totalsStartY + 5, { align: 'right' });

    doc.setTextColor(100, 116, 139); // Gray-500
    doc.text('TOTAL AMOUNT', 190, totalsStartY + 15, { align: 'right' });
    
    // Gradient text simulation (Pink to Purple)
    // We'll just use Pink for now as gradient text is hard in jsPDF
    doc.setTextColor(232, 121, 249);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 23, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 23);

  } else if (template === 'minimalist') {
    // === Ultra Minimalist Template ===
    // Header
    // Preview: INVOICE #ID (Left), Logo (Right)
    
    // Left: INVOICE and ID
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.setCharSpace(1.5);
    doc.text('INVOICE', 14, 20); 
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.setFontSize(8);
    doc.text(`#${invoice.invoiceNumber}`, 14, 25); 

    // Right: Logo
    let logoH = 0;
    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 40);
      // Right align logo: 210 - 14 - w
      doc.addImage(logoBase64, logoFormat, 210 - 14 - w, 15, w, h);
      logoH = h;
    }

    // 3 Cols layout
    const colY = Math.max(50, 15 + logoH + 10); // Dynamic colY
    
    // Col 1 - From (Left)
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('From', 14, colY);
    const fromY = addProviderInfo(doc, 14, colY + 6, 10, 4, [0, 0, 0]);

    // Col 2 - Billed To (Center-ish)
    const col2X = 80;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Billed To', col2X, colY);
    
    const clientEndY = addClientInfo(doc, col2X, colY + 6, 10, 4, [0, 0, 0]);

    // Col 3 - Issued (Right)
    // Preview has "Issued" label (text-gray-400) and Date (text-black).
    // And "Total" label and Amount below it in the same column.
    const col3X = 150; // Align block start
    
    // Issued
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Issued', col3X, colY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(issueDate, col3X, colY + 6);
    
    // Total (Below Issued)
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('Total', 196, colY + 15, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total}`, 196, colY + 21, { align: 'right' });

    // Table
    autoTable(doc, {
      startY: Math.max(fromY, colY + 30, clientEndY + 10) + 10, // Reduced spacing
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [156, 163, 175], // Gray-400
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: { 
        lineColor: [243, 244, 246], // Gray-100
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

    // Footer
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Adjusted to be closer to table (removed Math.max which pushed it to bottom)
    const totalsStartY = finalY + 20;
    const rightX = 140;

    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('Thank you.', 14, totalsStartY + 10);

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('Subtotal', rightX, totalsStartY);
    doc.setTextColor(0, 0, 0);
    doc.text(`${subtotal} ${currency}`, 190, totalsStartY, { align: 'right' });

    // Tax
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('Tax', rightX, totalsStartY + 5);
    doc.setTextColor(0, 0, 0);
    doc.text(`${vatAmount} ${currency}`, 190, totalsStartY + 5, { align: 'right' });

    // Total
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('Total', 190, totalsStartY + 10, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 190, totalsStartY + 16, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 16);

  } else if (template === 'modern') {
    // === Modern Blue Template ===
    const headerH = 17;
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 210, headerH, 'F'); 

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10); // Preview 14px ~ 10.5pt
    doc.setFont('helvetica', 'bold');
    
    // Header Content
    let logoW = 0;
    if (logoBase64) {
      // Logo inside bar
      const { w, h } = getLogoDimensions(40, 10); // max 10mm height
      // Center vertically in 17mm bar: (17 - h)/2
      const logoY = (headerH - h) / 2;
      doc.addImage(logoBase64, logoFormat, 14, logoY, w, h);
      logoW = w + 4;
    }
    
    // INVOICE Text
    doc.setCharSpace(1);
    doc.text('INVOICE', 14 + logoW, 11);
    doc.setCharSpace(0);

    // Invoice ID
    doc.setFontSize(6); // Preview 8px
    doc.text(invoice.invoiceNumber, 190, 11, { align: 'right' });

    // Info
    const infoY = 25; // Moved down slightly to accommodate larger text
    
    // Left - Provider Info
    const providerEndY = addProviderInfo(doc, 14, infoY, 9, 4, [107, 114, 128]); // Increased font

    // Right - Bill To
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 190, infoY, { align: 'right' });
    
    // Client Address
    const clientEndY = addClientInfo(doc, 190, infoY + 5, 9, 4, [107, 114, 128], 'right'); // Increased font

    // Table
    autoTable(doc, {
      startY: Math.max(infoY + 45, providerEndY + 10, clientEndY + 10), // Dynamic table start
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [37, 99, 235], // Blue-600
        textColor: 255,
        fontSize: 5, // Reduced
        halign: 'left',
        fontStyle: 'bold'
      },
      bodyStyles: { 
        lineColor: [249, 250, 251], 
        lineWidth: { bottom: 0.1 },
        textColor: 75,
        fontSize: 5, // Reduced
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

    // Total
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Push totals to bottom
    const totalsStartY = finalY + 10;
    const rightX = 140;

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('Subtotal', rightX, totalsStartY - 10);
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(`${subtotal} ${currency}`, 200, totalsStartY - 10, { align: 'right' });

    // Tax
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('Tax', rightX, totalsStartY - 4);
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(`${vatAmount} ${currency}`, 200, totalsStartY - 4, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('Total Due', 200, totalsStartY + 5, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 200, totalsStartY + 12, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 12);

  } else if (template === 'professional') {
    // === Professional Dark Template ===
    // Top Bar (Thin)
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 4.5, 'F'); 

    // Logo (Right)
    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 25);
      doc.addImage(logoBase64, logoFormat, 196 - w, 15, w, h);
    }

    // Header
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(12); // Preview 16px ~ 12pt
    doc.setFont('times', 'bold'); // Serif
    doc.text('INVOICE', 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); // Preview tinyText
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text(`No: ${invoice.invoiceNumber} • ${issueDate}`, 14, 25);

    // Grid 2 cols
    const gridY = 45; // Moved down as requested
    
    // From
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'bold');
    doc.text('FROM', 14, gridY);
    
    const providerEndY = addProviderInfo(doc, 14, gridY + 6, 10, 4.5, [107, 114, 128]); // Increased font

    // To
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'bold');
    doc.text('TO', 105, gridY); 
    
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'normal');
    // Client Address
    const clientEndY = addClientInfo(doc, 105, gridY + 6, 10, 4.5, [107, 114, 128]);

    // Table
    autoTable(doc, {
      startY: Math.max(gridY + 60, providerEndY + 10, clientEndY + 10), // Dynamic table start
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [243, 244, 246], // Gray-100
        textColor: [30, 41, 59], // Slate-800
        fontSize: 7, // Reduced
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: { 
        textColor: [75, 85, 99], // Gray-600
        lineColor: [243, 244, 246], // Gray-100
        lineWidth: { bottom: 0.1 },
        fontSize: 7, // Reduced
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

    // Footer
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    
    // Push totals to bottom
    const totalsStartY = finalY + 20;
    const rightX = 140;

    // Left: Thank you
    doc.setFontSize(6);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you', 14, totalsStartY + 5);
    doc.setFont('helvetica', 'normal');

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // gray-500
    doc.text('Subtotal', rightX, totalsStartY - 10);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`${subtotal} ${currency}`, 196, totalsStartY - 10, { align: 'right' });

    // Tax
    doc.setTextColor(100, 116, 139); // gray-500
    doc.text('Tax', rightX, totalsStartY - 4);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`${vatAmount} ${currency}`, 196, totalsStartY - 4, { align: 'right' });

    // Separator Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.1);
    doc.line(rightX, totalsStartY, 196, totalsStartY);

    // Total
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // gray-500
    doc.text('Total', 196, totalsStartY + 1, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 196, totalsStartY + 6, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 6);

  } else if (template === 'creative') {
    // === Creative Bold Template ===
    // Sidebar (Thin)
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 17, 297, 'F');

    // Sidebar Content (Vertical Text)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); // Increased size (was 10)
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 11, 50, { angle: 90 }); // Adjusted Y slightly to accommodate larger text

    // Main Content Area
    const mainX = 25;
    let currentY = 20;

    // Logo (Top Right)
    if (logoBase64) {
      const { w, h } = getLogoDimensions(50, 25);
      doc.addImage(logoBase64, logoFormat, 210 - 14 - w, 15, w, h);
    }
    
    // Invoice ID
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18); // Restored to 18
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber, mainX, currentY);
    currentY += 8;

    // Date
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont('helvetica', 'normal');
    doc.text(issueDate, mainX, currentY);
    currentY += 8; // Reduced spacing from 15

    // Provider Info
    const providerEndY = addProviderInfo(doc, mainX, currentY, 10, 4.5, [107, 114, 128]); // Increased font
    currentY = providerEndY + 8; // Increased spacing

    // Bill To Section
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', mainX, currentY);
    currentY += 6;

    // Client Name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, mainX, currentY);
    currentY += 6;

    // Client Address
    const clientEndY = addClientInfo(doc, mainX, currentY, 10, 4.5, [107, 114, 128], 'left', true); // Increased font
    currentY = clientEndY + 10; // Increased spacing

    // Table
    autoTable(doc, {
      startY: currentY + 10, // Moved table back up (was +60)
      margin: { left: mainX },
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [79, 70, 229],
        fontSize: 7,
        fontStyle: 'bold',
        lineWidth: { bottom: 0.5 },
        lineColor: [79, 70, 229]
      },
      bodyStyles: { 
        lineColor: [224, 231, 255], 
        lineWidth: { bottom: 0.1 },
        fontSize: 7,
        textColor: [31, 41, 55]
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
    
    // Total Box
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    // Push totals to bottom
    const totalsStartY = finalY + 60;
    const rightX = 60; // Increased width even more (was 100, now 60 -> width 145)

    // Background box for totals
    doc.setFillColor(238, 242, 255); // Indigo-50
    doc.roundedRect(rightX - 5, totalsStartY - 15, 210 - rightX - 5, 30, 2, 2, 'F');

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.text('Subtotal', rightX, totalsStartY - 8);
    doc.setTextColor(55, 48, 163); // indigo-800
    doc.text(`${subtotal} ${currency}`, 195, totalsStartY - 8, { align: 'right' });

    // Tax
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.text('Tax', rightX, totalsStartY - 2);
    doc.setTextColor(55, 48, 163); // indigo-800
    doc.text(`${vatAmount} ${currency}`, 195, totalsStartY - 2, { align: 'right' });

    // Total
    doc.setFontSize(8);
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.text('Total', 195, totalsStartY + 3, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.text(`${total} ${currency}`, 195, totalsStartY + 8, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 8);

  } else {
    // === Default Simple Template ===
    // Header
    let headerY = 20;
    
    // Left: Logo + Invoice Info
    let logoW = 0;
    if (logoBase64) {
      const { w, h } = getLogoDimensions(40, 10);
      doc.addImage(logoBase64, logoFormat, 14, 15, w, h);
      logoW = w + 4;
    }
    
    const titleX = 14 + logoW;
    doc.setFontSize(8); // Preview headerText (8px)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text(t('invoiceTitle', 'INVOICE'), titleX, 19);
    
    doc.setFontSize(5); // Preview tinyText
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(`#${invoice.invoiceNumber}`, titleX, 23);
    
    // Right: Provider Info (all company details)
    doc.setFontSize(10); // Increased
    doc.setTextColor(31, 41, 55); // Gray-800
    const providerLines = [
      settings.companyName,
      settings.address,
      [settings.city, settings.zipCode].filter(Boolean).join(", "),
      settings.country,
      settings.cui ? `VAT ID: ${settings.cui}` : null,
      settings.regCom ? `Reg: ${settings.regCom}` : null,
      settings.iban ? `IBAN: ${settings.iban}` : null,
      settings.bank ? `Bank: ${settings.bank}` : null,
      settings.swift ? `SWIFT: ${settings.swift}` : null,
      settings.email,
      settings.phone,
      settings.website
    ].filter(Boolean);
    
    let pY = 19;
    providerLines.forEach(line => {
      doc.text(line || '', 196, pY, { align: 'right' });
      pY += 4; // Increased spacing
    });
    
    headerY = Math.max(pY, 25);
    
    // Divider Section
    const dividerY = headerY + 5; // Increased spacing
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setLineWidth(0.1);
    doc.line(14, dividerY, 196, dividerY);
    
    const contentY = dividerY + 5; // Increased spacing
    
    // Left: Client
    doc.setFontSize(10); // Increased
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.text(t('to', 'Client:'), 14, contentY);
    
    // Client Address
    const clientEndY = addClientInfo(doc, 14, contentY + 5, 10, 4.5, [107, 114, 128]); // Increased font
    
    // Right: Date
    doc.setFontSize(5); // Preview tinyText
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.text(t('date', 'Date:'), 196, contentY, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(issueDate, 196, contentY + 3, { align: 'right' });
    
    const sectionBottomY = Math.max(contentY + 10, clientEndY + 5); // Reduced spacing from 15
    doc.line(14, sectionBottomY, 196, sectionBottomY);
    
    // Table
    autoTable(doc, {
      startY: sectionBottomY + 20,
      head: [tableColumn],
      body: tableRows,
      theme: 'plain',
      headStyles: { 
        fillColor: [243, 244, 246], // Gray-100
        textColor: [55, 65, 81], // Gray-700
        fontSize: 5, // Reduced
        fontStyle: 'bold',
        cellPadding: 2
      },
      bodyStyles: { 
        textColor: [75, 85, 99], // Gray-600
        fontSize: 5, // Reduced
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
    
    // Footer
    // @ts-expect-error jspdf-autotable attaches lastAutoTable dynamically
    const finalY = (doc.lastAutoTable?.finalY as number | undefined) || 150;
    
    // Total
    const totalsStartY = finalY + 30;
    const rightX = 140;

    doc.setDrawColor(31, 41, 55); // gray-800
    doc.setLineWidth(0.5);
    doc.line(rightX, totalsStartY - 15, 200, totalsStartY - 15);

    // Subtotal
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(t('subtotal', 'Subtotal'), rightX, totalsStartY - 10);
    doc.setTextColor(31, 41, 55); // gray-800
    doc.text(`${subtotal} ${currency}`, 200, totalsStartY - 10, { align: 'right' });

    // Tax
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(t('tax', 'Tax'), rightX, totalsStartY - 4);
    doc.setTextColor(31, 41, 55); // gray-800
    doc.text(`${vatAmount} ${currency}`, 200, totalsStartY - 4, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(t('total', 'Total'), 200, totalsStartY + 3, { align: 'right' });
    doc.text(`${total} ${currency}`, 200, totalsStartY + 8, { align: 'right' });

    contentEndY = Math.max(contentEndY, totalsStartY + 8);
  }

  const hasNotes = !!invoice.notes && invoice.notes.trim().length > 0;
  const hasPaymentTerms = !!invoice.paymentTerms && invoice.paymentTerms.trim().length > 0;

  if (hasNotes || hasPaymentTerms) {
    const pageHeight = getPageHeight(doc);
    const bottomMargin = 20;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    const lines: string[] = [];

    if (hasPaymentTerms && invoice.paymentTerms) {
      lines.push(`Payment terms: ${invoice.paymentTerms}`);
    }

    if (hasNotes && invoice.notes) {
      if (lines.length > 0) {
        lines.push("");
      }
      const splitNotes = doc.splitTextToSize(invoice.notes, 180);
      lines.push(...splitNotes);
    }

    const notesHeight = lines.length * 5;

    const lastTableY =
      (((doc as unknown) as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY as number | undefined) ??
      pageHeight / 2;

    const contentBaseY = Math.max(lastTableY, contentEndY || 0);

    let baseOffset = 40;
    if (template === "creative") {
      baseOffset = 100;
    }

    if (["neon", "modern", "geometric"].includes(template)) {
      baseOffset += 20;
    }

    const desiredY = contentBaseY + baseOffset;
    const maxY = pageHeight - bottomMargin - notesHeight;
    const notesY = Math.min(desiredY, maxY);

    doc.text(lines, 14, notesY);
  }

  // Sanitize filename
  const safeInvoiceNumber = invoice.invoiceNumber.replace(/[^a-z0-9]/gi, '_');
  const filename = `invoice-${safeInvoiceNumber}.pdf`;

  // Explicitly save as Blob to ensure correct MIME type and better compatibility
  const pdfBlob = doc.output('blob');
  
  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.type = 'application/pdf'; // Explicit MIME type
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};
