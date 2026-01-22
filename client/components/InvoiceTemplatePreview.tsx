import React from 'react';

export interface TemplateConfig {
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
        sections: Array<{ id: string; label: string; isVisible: boolean }>;
        styles: {
            backgroundColor: string;
            textColor: string;
            primaryColor: string;
            borderColor: string;
            fontFamily: string;
        };
    };
}

type Props = {
  templateId: string;
  settings?: any;
  customConfig?: TemplateConfig;
};

export default function InvoiceTemplatePreview({ templateId, settings, customConfig }: Props) {
  const data = {
    id: "INV-001",
    date: "09/01/2024",
    dueDate: "09/02/2024",
    total: "€1,250.00",
    subtotal: "€1,050.42",
    vat: "€199.58",
    company: settings?.companyName || "Tech Solutions",
    address: settings?.address || "123 Business Rd",
    city: settings?.city || "New York",
    country: settings?.country || "USA",
    cui: settings?.cui || "US123456",
    regCom: settings?.regCom || "12345/2024",
    iban: settings?.iban || "US98BTRL...",
    bank: settings?.bank || "Bank of America",
    email: settings?.email || "contact@tech.com",
    phone: settings?.phone || "+1 700 000 000",
    website: "www.tech.com",
    client: "Acme Corp",
    clientCui: "RO123456",
    clientAddress: "123 Client Street",
    clientCity: "City",
    clientCountry: "Country",
    clientZip: "123456",
    clientPhone: "+1 555 0123",
    clientEmail: "client@acme.com",
    items: [
      { desc: "UX/UI Design", qty: 1, price: "500.00" },
      { desc: "Frontend Dev", qty: 1, price: "750.00" },
    ]
  };

  const logoUrl = settings?.logoUrl;
  
  // Helper styles
  const smallText = "text-[6px] leading-[8px]";
  const tinyText = "text-[5px] leading-[6px]";
  const headerText = "text-[8px] font-bold";
  const labelText = "text-[5px] uppercase tracking-wider text-gray-400 font-semibold";

  const clientFullAddress = [data.clientAddress, data.clientCity, data.clientCountry, data.clientZip].filter(Boolean).join(", ");
  
  const renderClientDetails = (textColor = "text-gray-500") => (
    <>
      <div className={`${tinyText} ${textColor}`}>{clientFullAddress}</div>
      <div className={`${tinyText} ${textColor}`}>VAT ID: {data.clientCui}</div>
      <div className={`${tinyText} ${textColor}`}>{data.clientPhone}</div>
      <div className={`${tinyText} ${textColor}`}>{data.clientEmail}</div>
    </>
  );

  const renderProviderDetails = (textColor = "text-gray-500", align = "text-left") => (
    <div className={`${tinyText} ${textColor} ${align} flex flex-col gap-[1px]`}>
      <div className="font-bold text-[6px]">{data.company}</div>
      <div>{data.address}</div>
      <div>{data.city}, {data.country}</div>
      <div>VAT ID: {data.cui}</div>
      <div>Trade Reg: {data.regCom}</div>
      <div>IBAN: {data.iban}</div>
      <div>Bank: {data.bank}</div>
      <div>{data.email}</div>
      <div>{data.phone}</div>
      <div>{data.website}</div>
    </div>
  );

  // Helper to get labels
  const t = (key: keyof NonNullable<TemplateConfig['labels']>, defaultVal: string) => {
      return customConfig?.labels?.[key] || defaultVal;
  };

  const showQty = customConfig?.columns?.quantity !== false;
  const showPrice = customConfig?.columns?.price !== false;

  // --- CUSTOM TEMPLATE RENDERER ---
  if (templateId === 'custom' && customConfig?.custom) {
      const { sections, styles } = customConfig.custom;
      
      const renderCustomSection = (id: string) => {
        switch (id) {
            case 'header':
                return (
                    <div className="flex justify-between items-center p-4 mb-2" style={{ borderBottom: `1px solid ${styles.borderColor}` }}>
                         <div className="flex items-center gap-2">
                            {logoUrl ? <img src={logoUrl} alt="Logo" className="h-8 object-contain" /> : <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[6px] text-gray-500">Logo</div>}
                        </div>
                        <h1 className="text-[16px] font-bold" style={{ color: styles.primaryColor }}>{t('invoiceTitle', 'INVOICE')}</h1>
                    </div>
                );
            case 'provider':
                return (
                    <div className="p-4 mb-2">
                        <h3 className="text-[6px] font-bold uppercase mb-1" style={{ color: styles.primaryColor }}>{t('from', 'From')}</h3>
                        {renderProviderDetails(styles.textColor === '#ffffff' ? 'text-white' : 'text-gray-600')}
                    </div>
                );
            case 'client':
                return (
                    <div className="p-4 mb-2 flex justify-between">
                        <div>
                            <h3 className="text-[6px] font-bold uppercase mb-1" style={{ color: styles.primaryColor }}>{t('to', 'Bill To')}</h3>
                            <div style={{ color: styles.textColor }}>
                                <p className="font-bold text-[6px]">{data.client}</p>
                            </div>
                            {renderClientDetails(styles.textColor === '#ffffff' ? 'text-white' : 'text-gray-500')}
                        </div>
                        <div className="text-right">
                             <h3 className="text-[6px] font-bold uppercase mb-1" style={{ color: styles.primaryColor }}>Details</h3>
                             <p className="text-[6px]" style={{ color: styles.textColor }}>{t('date', 'Date')}: {data.date}</p>
                             <p className="text-[6px]" style={{ color: styles.textColor }}>#: {data.id}</p>
                        </div>
                    </div>
                );
            case 'items':
                return (
                    <div className="p-4 mb-2">
                        <div className="flex border-b pb-2 mb-2" style={{ borderColor: styles.borderColor }}>
                            <div className="flex-1 font-bold text-[6px]" style={{ color: styles.primaryColor }}>{t('item', 'Description')}</div>
                            <div className="w-12 text-right font-bold text-[6px]" style={{ color: styles.primaryColor }}>{t('amount', 'Amount')}</div>
                        </div>
                        {data.items.map((item, i) => (
                            <div key={i} className="flex py-1 border-b border-dashed" style={{ borderColor: styles.borderColor }}>
                                <div className="flex-1 text-[6px]" style={{ color: styles.textColor }}>{item.desc}</div>
                                <div className="w-12 text-right text-[6px]" style={{ color: styles.textColor }}>{item.price}</div>
                            </div>
                        ))}
                    </div>
                );
            case 'totals':
                return (
                    <div className="p-4 mb-2 flex justify-end">
                        <div className="w-1/2">
                            <div className="flex justify-between mb-1">
                                <span className="text-[6px] opacity-70" style={{ color: styles.textColor }}>{t('subtotal', 'Subtotal')}</span>
                                <span className="text-[6px]" style={{ color: styles.textColor }}>{data.subtotal}</span>
                            </div>
                            <div className="flex justify-between mb-2 border-b pb-2" style={{ borderColor: styles.borderColor }}>
                                <span className="text-[6px] opacity-70" style={{ color: styles.textColor }}>{t('tax', 'Tax')}</span>
                                <span className="text-[6px]" style={{ color: styles.textColor }}>{data.vat}</span>
                            </div>
                            <div className="flex justify-between font-bold text-[8px]" style={{ color: styles.primaryColor }}>
                                <span>{t('total', 'Total')}</span>
                                <span>{data.total}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'footer':
                return (
                    <div className="p-4 mt-4 text-center text-[6px] opacity-60" style={{ color: styles.textColor, borderTop: `1px solid ${styles.borderColor}` }}>
                        Thank you for your business!
                    </div>
                );
            default:
                return null;
        }
      };

      return (
        <div 
            className="w-full h-full shadow-sm flex flex-col overflow-hidden"
            style={{ 
                backgroundColor: styles.backgroundColor,
                fontFamily: styles.fontFamily === 'mono' ? 'monospace' : styles.fontFamily === 'serif' ? 'serif' : 'sans-serif'
            }}
        >
            {sections.map(section => (
                section.isVisible && (
                    <div key={section.id}>
                        {renderCustomSection(section.id)}
                    </div>
                )
            ))}
        </div>
      );
  }

  // --- 1. Editorial (Classic Serif) ---
  if (templateId === 'editorial') {
    return (
      <div className="w-full h-full bg-[#faf9f6] text-black shadow-sm flex flex-col p-5 overflow-hidden font-serif relative">
         {logoUrl ? (
           <img src={logoUrl} alt="Logo" className="absolute top-4 left-5 w-8 h-8 object-contain" />
         ) : (
           <div className="absolute top-4 left-5 text-[24px] font-serif italic">&</div>
         )}
         <div className="text-right mb-6">
            <div className="text-[16px] uppercase tracking-widest font-normal">{t('invoiceTitle', 'INVOICE')}</div>
         </div>

         {/* Provider Info moved to top left below logo as per pdfGenerator */}
         <div className="mb-2 mt-4 ml-1">
            {renderProviderDetails("text-black")}
         </div>

         <div className="flex justify-between mb-6">
            <div>
               <div className={`${headerText} mb-1`}>{t('to', 'BILLED TO')}:</div>
               <div className={`${smallText}`}>{data.client}</div>
               {renderClientDetails("text-gray-500")}
            </div>
            <div className="text-right">
               <div className={`${smallText}`}>Invoice No. {data.id}</div>
               <div className={`${smallText}`}>{data.date}</div>
            </div>
         </div>

         <div className="flex-1">
            <div className="border-b border-black pb-1 mb-2 flex">
                <div className={`${tinyText} font-bold flex-1`}>{t('item', 'Item')}</div>
                {showQty && <div className={`${tinyText} font-bold w-[15%] text-center`}>{t('quantity', 'Qty')}</div>}
                {showPrice && <div className={`${tinyText} font-bold w-[15%] text-right`}>{t('price', 'Price')}</div>}
                <div className={`${tinyText} font-bold w-[20%] text-right`}>{t('amount', 'Total')}</div>
            </div>
            {data.items.map((item, i) => (
               <div key={i} className="flex border-b border-gray-200 py-1 mb-1">
                  <div className={`${tinyText} flex-1`}>{item.desc}</div>
                  {showQty && <div className={`${tinyText} w-[15%] text-center`}>1</div>}
                  {showPrice && <div className={`${tinyText} w-[15%] text-right`}>{item.price}</div>}
                  <div className={`${tinyText} w-[20%] text-right`}>{item.price}</div>
               </div>
            ))}
         </div>

         <div className="mt-auto border-t border-black pt-2 flex flex-col items-end">
             <div className="w-1/2 flex justify-between mb-1">
                 <div className={`${tinyText}`}>{t('subtotal', 'Subtotal')}</div>
                 <div className={`${tinyText}`}>{data.subtotal}</div>
             </div>
             <div className="w-1/2 flex justify-between mb-1">
                 <div className={`${tinyText}`}>{t('tax', 'Tax')}</div>
                 <div className={`${tinyText}`}>{data.vat}</div>
             </div>
             <div className="w-1/2 flex justify-end gap-10 items-center border-t border-gray-200 pt-1">
                 <div className={`${headerText}`}>{t('total', 'Total')}</div>
                 <div className="text-[14px] font-bold">{data.total}</div>
             </div>
         </div>
      </div>
    );
  }

  // --- 2. Geometric (Blue Angles) ---
  if (templateId === 'geometric') {
    return (
      <div className="w-full h-full bg-white shadow-sm flex flex-col overflow-hidden relative font-sans">
        {/* Top Shape */}
        <div className="absolute top-0 right-0 w-[60%] h-[15%] bg-blue-900 transform skew-x-[-20deg] translate-x-10 -translate-y-4 z-10"></div>
        {/* Light Blue - Below Dark Blue, same width, reduced height */}
        <div className="absolute top-[15%] right-0 w-[60%] h-[4%] bg-blue-400/80 transform skew-x-[-20deg] translate-x-10 -translate-y-4 z-0"></div>

        <div className="p-4 z-20 relative h-full flex flex-col">
            <div className="flex justify-between items-start mb-1">
                <div className="mt-1">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-8 object-contain mb-1" />
                    ) : (
                        <div className="w-8 h-8 bg-blue-900 flex items-center justify-center text-white font-bold text-xs rounded mb-1">T</div>
                    )}
                    {renderProviderDetails("text-blue-900")}
                </div>
                <div className="text-white text-right pt-2 pr-2">
                    <div className="text-[16px] font-bold">{t('invoiceTitle', 'INVOICE')}</div>
                    <div className={`${tinyText} opacity-90`}>#{data.id}</div>
                </div>
            </div>

            <div className="flex justify-between mb-4 mt-2">
                <div>
                    <div className={`${labelText} text-blue-800`}>{t('to', 'Invoice To')}:</div>
                    <div className={`${smallText} font-bold`}>{data.client}</div>
                    {renderClientDetails("text-gray-500")}
                </div>
                <div className="text-right">
                    <div className={`${labelText} text-blue-800`}>{t('date', 'Date')}:</div>
                    <div className={`${smallText}`}>{data.date}</div>
                </div>
            </div>

            <div className="flex-1 mt-2">
                <div className="bg-blue-900 text-white flex p-1 mb-1 text-[5px] font-bold">
                    <div className="flex-1 pl-1">{t('item', 'Description')}</div>
                    {showQty && <div className="w-6 text-center">{t('quantity', 'Qty')}</div>}
                    <div className="w-10 text-right pr-1">{t('amount', 'Total')}</div>
                </div>
                {data.items.map((item, i) => (
                    <div key={i} className="flex p-1 border-b border-blue-100 text-[5px] text-gray-600 even:bg-blue-50">
                        <div className="flex-1 pl-1">{item.desc}</div>
                        {showQty && <div className="w-6 text-center">{item.qty}</div>}
                        <div className="w-10 text-right pr-1">{item.price}</div>
                    </div>
                ))}
            </div>

            <div className="mt-auto self-end w-1/3">
                <div className="flex justify-between items-center mb-1 px-2">
                    <span className={`${tinyText} text-gray-600`}>{t('subtotal', 'Subtotal')}</span>
                    <span className={`${tinyText} text-gray-800`}>{data.subtotal}</span>
                </div>
                <div className="flex justify-between items-center mb-2 px-2">
                    <span className={`${tinyText} text-gray-600`}>{t('tax', 'Tax')}</span>
                    <span className={`${tinyText} text-gray-800`}>{data.vat}</span>
                </div>
                <div className="bg-blue-900 text-white px-8 py-4 flex justify-end gap-8 items-center rounded-l-lg shadow-md">
                    <span className={`${headerText}`}>{t('total', 'TOTAL')}</span>
                    <span className="text-[12px] font-bold">{data.total}</span>
                </div>
            </div>
            
            {/* Bottom Shape */}
            <div className="absolute bottom-0 left-0 w-[40%] h-[8%] bg-blue-900/10 transform skew-x-[-20deg] -translate-x-10 translate-y-4 -z-10"></div>
        </div>
      </div>
    );
  }

  // --- 3. Business (Green Structured) ---
  if (templateId === 'business') {
    return (
      <div className="w-full h-full bg-white shadow-sm flex flex-col p-0 overflow-hidden font-sans">
         <div className="bg-white p-4 border-t-4 border-emerald-600 flex justify-between items-start">
             <div className="flex items-start gap-1">
                 {logoUrl ? (
                     <img src={logoUrl} alt="Logo" className="h-8 object-contain mt-0" />
                 ) : (
                     <div className="w-6 h-6 bg-emerald-600 rounded-tr-lg rounded-bl-lg mt-0"></div>
                 )}
                 {renderProviderDetails("text-gray-800")}
             </div>
             <div className="text-right">
                 <div className="text-[18px] text-emerald-600 font-bold tracking-tight">{t('invoiceTitle', 'INVOICE')}</div>
             </div>
         </div>

         <div className="bg-gray-50 px-4 py-3 flex justify-between border-y border-gray-100 mt-12">
             <div>
                 <div className={`${labelText}`}>{t('to', 'Invoice To')}:</div>
                 <div className={`${smallText} font-bold text-gray-800`}>{data.client}</div>
                 {renderClientDetails("text-gray-500")}
             </div>
             <div className="grid grid-cols-2 gap-x-4">
                 <div>
                     <div className={`${labelText}`}>Invoice No</div>
                     <div className={`${smallText} font-bold`}>{data.id}</div>
                 </div>
                 <div>
                     <div className={`${labelText}`}>{t('date', 'Date')}</div>
                     <div className={`${smallText} font-bold`}>{data.date}</div>
                 </div>
             </div>
         </div>

         <div className="p-4 flex-1">
             <table className="w-full">
                 <thead className="bg-emerald-600 text-white">
                     <tr className={`${tinyText}`}>
                         <th className="text-left p-1 rounded-tl-sm">{t('item', 'Item Description')}</th>
                         {showPrice && <th className="text-center p-1">{t('price', 'Price')}</th>}
                         <th className="text-right p-1 rounded-tr-sm">{t('amount', 'Total')}</th>
                     </tr>
                 </thead>
                 <tbody className={`${tinyText} text-gray-600`}>
                     {data.items.map((item, i) => (
                         <tr key={i} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                             <td className="p-1.5">{item.desc}</td>
                             {showPrice && <td className="text-center p-1.5">{item.price}</td>}
                             <td className="text-right p-1.5">{item.price}</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>

         <div className="px-4 pb-4 flex justify-end">
             <div className="w-1/2">
                 <div className="flex justify-between border-b border-gray-200 py-1">
                     <span className={`${tinyText} font-bold text-gray-600`}>{t('subtotal', 'Sub Total')}</span>
                     <span className={`${tinyText} text-gray-800`}>{data.subtotal}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-200 py-1">
                     <span className={`${tinyText} font-bold text-gray-600`}>{t('tax', 'Tax')}</span>
                     <span className={`${tinyText} text-gray-800`}>{data.vat}</span>
                 </div>
                 <div className="flex justify-end gap-8 bg-emerald-600 text-white p-1 mt-1 rounded-sm">
                     <span className={`${smallText} font-bold`}>{t('total', 'TOTAL')}</span>
                     <span className={`${smallText} font-bold`}>{data.total}</span>
                 </div>
             </div>
         </div>
      </div>
    );
  }

  // --- 4. Horizon (Gradient Wave) ---
  if (templateId === 'horizon') {
    return (
      <div className="w-full h-full bg-white shadow-sm flex flex-col overflow-hidden relative">
         {/* Gradient Header */}
         <div className="h-20 w-full bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden text-white p-4">
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-white opacity-20 rounded-t-[100%] transform scale-x-150 translate-y-3"></div>
            <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 object-contain brightness-0 invert" />}
                    <div className="flex flex-col">
                        <div className={`${tinyText} uppercase opacity-80`}>{t('from', 'ISSUED BY')}</div>
                        <div className="text-[10px] font-medium leading-tight">
                            {settings?.companyName || 'Your Company'}
                        </div>
                        <div className="text-[16px] font-bold tracking-widest mt-1">
                            {t('invoiceTitle', 'INVOICE')}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`${tinyText} opacity-80`}>AMOUNT DUE</div>
                    <div className={`${headerText}`}>{data.total}</div>
                </div>
            </div>
         </div>

         <div className="p-4 flex-1 flex flex-col">
            <div className="flex justify-between mb-6">
                <div>
                    <div className={`${tinyText} text-cyan-600 font-bold mb-1`}>{t('to', 'ISSUED TO')}</div>
                    <div className={`${smallText} text-gray-800`}>{data.client}</div>
                    {renderClientDetails("text-gray-400")}
                </div>
                <div className="text-right">
                    <div className={`${tinyText} text-cyan-600 font-bold mb-1`}>DETAILS</div>
                    <div className={`${tinyText} text-gray-500`}>{data.id}</div>
                    <div className={`${tinyText} text-gray-500`}>{data.date}</div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 mb-2">
                    <div className={`${tinyText} text-cyan-600 font-bold uppercase w-1/2`}>{t('item', 'Description')}</div>
                    {showQty && <div className={`${tinyText} text-cyan-600 font-bold uppercase w-1/6 text-center`}>{t('quantity', 'Qty')}</div>}
                    <div className={`${tinyText} text-cyan-600 font-bold uppercase w-1/3 text-right`}>{t('amount', 'Total')}</div>
                </div>
                {data.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                        <div className="w-1/2">
                            <div className={`${smallText} text-gray-700 font-bold`}>{item.desc}</div>
                            <div className={`${tinyText} text-gray-400`}>Service type</div>
                        </div>
                        {showQty && <div className={`${smallText} text-gray-600 font-bold w-1/6 text-center`}>{item.qty}</div>}
                        <div className={`${smallText} text-blue-600 font-bold w-1/3 text-right`}>{item.price}</div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-2 flex justify-end">
                 <div className="w-1/2">
                    <div className="flex justify-between items-center mb-1 border-b border-gray-100 pb-1">
                        <span className={`${tinyText} text-gray-500`}>{t('subtotal', 'Sub Total')}</span>
                        <span className={`${tinyText} text-gray-700`}>{data.subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
                        <span className={`${tinyText} text-gray-500`}>{t('tax', 'Tax')}</span>
                        <span className={`${tinyText} text-gray-700`}>{data.vat}</span>
                    </div>
                    <div className="flex justify-end gap-8 items-center bg-gray-50 p-2 rounded-lg">
                        <span className={`${smallText} text-gray-600`}>{t('total', 'Total Amount')}</span>
                        <span className={`${headerText} text-cyan-600`}>{data.total}</span>
                    </div>
                 </div>
            </div>
         </div>
      </div>
    );
  }

  // --- 5. Neon (Dark Cyberpunk) ---
  if (templateId === 'neon') {
    return (
      <div className="w-full h-full bg-[#0f172a] shadow-sm flex flex-col p-4 overflow-hidden relative border border-slate-800">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"></div>
         
         <div className="flex justify-between items-center mb-3 mt-1">
             <div className="flex items-center gap-2">
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 object-contain" />}
             </div>
             <div className="bg-slate-800 px-2 py-1 rounded border border-slate-700">
                 <div className={`${tinyText} text-pink-400`}>STATUS: PAID</div>
             </div>
         </div>

         <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
                 <div className={`${tinyText} text-gray-400 mb-1`}>{t('from', 'FROM')}</div>
                 {renderProviderDetails("text-white")}
             </div>
             <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
                 <div className={`${tinyText} text-gray-400 mb-1`}>{t('to', 'TO')}</div>
                 <div className={`${smallText} text-white`}>{data.client}</div>
                 {renderClientDetails("text-gray-400")}
             </div>
         </div>

         <div className="flex-1">
             <div className="flex text-cyan-400 border-b border-slate-700 pb-1 mb-2">
                 <div className={`${tinyText} flex-1`}>{t('item', 'ITEM')}</div>
                 <div className={`${tinyText} w-20 text-right`}>{t('amount', 'TOTAL')}</div>
             </div>
             {data.items.map((item, i) => (
                 <div key={i} className="flex text-gray-300 py-1 mb-1 border-b border-slate-800/50">
                     <div className={`${tinyText} flex-1`}>{item.desc}</div>
                     <div className={`${tinyText} w-20 text-right`}>{item.price}</div>
                 </div>
             ))}
         </div>

         <div className="mt-auto flex justify-end">
                 <div className="text-right w-1/3">
                     <div className="flex justify-between mb-1 border-b border-slate-800/50 pb-1">
                         <span className={`${tinyText} text-gray-500`}>{t('subtotal', 'SUBTOTAL')}</span>
                         <span className={`${tinyText} text-gray-300`}>{data.subtotal}</span>
                     </div>
                     <div className="flex justify-between mb-2 border-b border-slate-800/50 pb-1">
                         <span className={`${tinyText} text-gray-500`}>{t('tax', 'TAX')}</span>
                         <span className={`${tinyText} text-gray-300`}>{data.vat}</span>
                     </div>
                     <div className={`${tinyText} text-gray-500 mt-2 text-right`}>{t('total', 'TOTAL AMOUNT')}</div>
                     <div className="text-[18px] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 font-bold">
                         {data.total}
                     </div>
                 </div>
             </div>
      </div>
    );
  }

  // --- 6. Minimalist (Ultra Clean) ---
  if (templateId === 'minimalist') {
    return (
      <div className="w-full h-full bg-white shadow-sm flex flex-col p-6 overflow-hidden">
         <div className="mb-16 flex justify-between items-start">
             <div>
                 <div className="text-[12px] font-bold tracking-[0.2em] text-gray-900 mb-1">{t('invoiceTitle', 'INVOICE')}</div>
                 <div className={`${tinyText} text-gray-400`}>#{data.id}</div>
             </div>
             {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 object-contain" />}
         </div>

         <div className="flex mb-8 gap-2">
             <div className="w-1/3">
                 <div className={`${tinyText} text-gray-400 mb-1`}>{t('from', 'From')}</div>
                 {renderProviderDetails("text-black")}
             </div>
             <div className="w-1/3">
                 <div className={`${tinyText} text-gray-400 mb-1`}>{t('to', 'Billed To')}</div>
                 <div className={`${smallText} text-black leading-tight`}>{data.client}</div>
                 {renderClientDetails("text-gray-500")}
             </div>
             <div className="w-1/3 text-right">
                 <div className={`${tinyText} text-gray-400 mb-1`}>Issued</div>
                 <div className={`${smallText} text-black`}>{data.date}</div>
                 <div className={`${tinyText} text-gray-400 mt-2 mb-1`}>{t('total', 'Total')}</div>
                 <div className={`${smallText} text-black font-medium`}>{data.total}</div>
             </div>
         </div>

         <div className="flex-1">
             <div className="flex justify-between py-2 border-b border-gray-200 mb-2">
                 <div className={`${tinyText} text-gray-400 uppercase w-1/2`}>{t('item', 'Description')}</div>
                 {showQty && <div className={`${tinyText} text-gray-400 uppercase w-1/6 text-center`}>{t('quantity', 'Qty')}</div>}
                 <div className={`${tinyText} text-gray-400 uppercase w-1/3 text-right`}>{t('amount', 'Total')}</div>
             </div>
             {data.items.map((item, i) => (
                 <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                     <div className={`${smallText} text-gray-800 w-1/2`}>{item.desc}</div>
                     {showQty && <div className={`${smallText} text-gray-800 w-1/6 text-center`}>{item.qty}</div>}
                     <div className={`${smallText} text-gray-800 w-1/3 text-right`}>{item.price}</div>
                 </div>
             ))}
         </div>
         
         <div className="mt-auto">
             <div className="flex justify-between pt-4 items-end">
                 <div className={`${tinyText} text-gray-400`}>Thank you.</div>
                 <div className="text-right w-1/3">
                    <div className="flex justify-between mb-1">
                        <span className={`${tinyText} text-gray-400`}>{t('subtotal', 'Subtotal')}</span>
                        <span className={`${tinyText} text-black`}>{data.subtotal}</span>
                    </div>
                    <div className="flex justify-between mb-2 border-b border-gray-100 pb-2">
                        <span className={`${tinyText} text-gray-400`}>{t('tax', 'Tax')}</span>
                        <span className={`${tinyText} text-black`}>{data.vat}</span>
                    </div>
                    <div className={`${headerText} text-black text-right`}>{data.total}</div>
                 </div>
             </div>
         </div>
      </div>
    );
  }

  // --- 7. Modern (Refined Blue) ---
  if (templateId === 'modern') {
      return (
        <div className="w-full h-full bg-white shadow-sm flex flex-col overflow-hidden relative">
          <div className="h-16 w-full bg-blue-600 p-3 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                  {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 object-contain brightness-0 invert" />}
                  <span className="text-[14px] font-bold tracking-wider">{t('invoiceTitle', 'INVOICE')}</span>
              </div>
              <span className={headerText}>{data.id}</span>
          </div>
          <div className="p-2 flex-1 flex flex-col">
              <div className="flex justify-between mb-2 items-start">
                  <div className="flex flex-col gap-1">
                      {renderProviderDetails("", "text-left")}
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                      <div className={`${headerText} text-gray-800`}>{t('to', 'Bill To')}:</div>
                      <div className={`${tinyText} text-gray-500`}>{data.client}</div>
                      {renderClientDetails()}
                  </div>
              </div>
              <div className="flex-1">
                  <div className={`bg-blue-600 text-white flex p-1 mb-1 ${tinyText} font-bold rounded-sm`}>
                      <div className="flex-1">{t('item', 'Description')}</div>
                      <div className="w-20 text-right">{t('amount', 'Total')}</div>
                  </div>
                  {data.items.map((item, i) => (
                      <div key={i} className={`flex p-1 border-b border-gray-100 ${tinyText} text-gray-600`}>
                          <div className="flex-1">{item.desc}</div>
                          <div className="w-20 text-right">{item.price}</div>
                      </div>
                  ))}
              </div>
              <div className="mt-auto self-end text-right w-1/3">
                  <div className="flex justify-between mb-1">
                      <span className={`${tinyText} text-gray-500`}>{t('subtotal', 'Subtotal')}</span>
                      <span className={`${tinyText} text-gray-800`}>{data.subtotal}</span>
                  </div>
                  <div className="flex justify-between mb-2 border-b border-gray-100 pb-1">
                      <span className={`${tinyText} text-gray-500`}>{t('tax', 'Tax')}</span>
                      <span className={`${tinyText} text-gray-800`}>{data.vat}</span>
                  </div>
                  <div className={`${tinyText} text-gray-400 text-right`}>{t('total', 'Total Due')}</div>
                  <div className={`${headerText} text-blue-600`}>{data.total}</div>
              </div>
          </div>
        </div>
      );
  }

  // --- 8. Professional (Refined Dark) ---
  if (templateId === 'professional') {
      return (
        <div className="w-full h-full bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="bg-slate-800 h-4 w-full"></div>
          <div className="p-4 flex-1 flex flex-col">
              <div className="mb-2">
                  <div className="text-[16px] font-serif font-bold text-slate-800 leading-none">{t('invoiceTitle', 'INVOICE')}</div>
                  <div className={`${tinyText} text-gray-400 mt-1`}>No: {data.id} • {data.date}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                      <div className={`${tinyText} font-bold text-slate-700 mb-1`}>{t('from', 'FROM')}</div>
                      {renderProviderDetails("text-gray-500")}
                  </div>
                  <div>
                      <div className={`${tinyText} font-bold text-slate-700 mb-1`}>{t('to', 'TO')}</div>
                      <div className={`${tinyText} text-gray-500`}>{data.client}</div>
                      {renderClientDetails("text-gray-500")}
                  </div>
              </div>
              <div className="flex-1">
                  <div className={`bg-gray-100 text-slate-800 flex p-1 mb-1 ${tinyText} font-bold`}>
                      <div className="flex-1">{t('item', 'Description')}</div>
                      <div className="w-20 text-right">{t('amount', 'Total')}</div>
                  </div>
                  {data.items.map((item, i) => (
                      <div key={i} className={`flex p-1 border-b border-gray-100 ${tinyText} text-gray-600`}>
                          <div className="flex-1">{item.desc}</div>
                          <div className="w-20 text-right">{item.price}</div>
                      </div>
                  ))}
              </div>
              <div className="mt-auto border-t border-slate-800 pt-2 flex justify-between items-end">
                  <div className={`${tinyText} text-gray-400 italic`}>Thank you</div>
                  <div className="text-right w-1/3">
                      <div className="flex justify-between mb-1">
                          <span className={`${tinyText} text-gray-500`}>{t('subtotal', 'Subtotal')}</span>
                          <span className={`${tinyText} text-slate-700`}>{data.subtotal}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                          <span className={`${tinyText} text-gray-500`}>{t('tax', 'Tax')}</span>
                          <span className={`${tinyText} text-slate-700`}>{data.vat}</span>
                      </div>
                      <div className={`${headerText} text-slate-800 border-t border-slate-200 pt-1`}>{data.total}</div>
                  </div>
              </div>
          </div>
        </div>
      );
  }

  // --- 9. Creative (Refined Bold) ---
  if (templateId === 'creative') {
      return (
        <div className="w-full h-full bg-white shadow-sm flex overflow-hidden">
          <div className="bg-indigo-600 w-16 h-full p-2 flex flex-col text-white">
              <div className="text-[10px] font-bold tracking-widest rotate-90 origin-bottom-left translate-x-3 -translate-y-4 whitespace-nowrap">
                  {t('invoiceTitle', 'INVOICE')}
              </div>
          </div>
          <div className="flex-1 p-3 flex flex-col">
              <div className="text-[18px] font-bold text-black mb-1">{data.id}</div>
              <div className={`${tinyText} text-gray-500 mb-4`}>{data.date}</div>
              
              {/* Provider Info */}
              <div className="mb-4">
                  {renderProviderDetails("text-gray-500")}
              </div>

              <div className="mb-4">
                  <div className={`${headerText} text-indigo-600 mb-1`}>{t('to', 'BILL TO')}</div>
                  <div className={`${tinyText} text-black font-medium`}>{data.client}</div>
                  {renderClientDetails("text-gray-500")}
              </div>
              <div className="flex-1">
                  <div className={`border-b-2 border-indigo-600 flex pb-1 mb-2 ${tinyText} font-bold text-indigo-600`}>
                      <div className="flex-1">{t('item', 'Item')}</div>
                      <div className="w-20 text-right">{t('amount', 'Total')}</div>
                  </div>
                  {data.items.map((item, i) => (
                      <div key={i} className={`flex py-1 border-b border-indigo-100 ${tinyText} text-gray-800`}>
                          <div className="flex-1">{item.desc}</div>
                          <div className="w-20 text-right">{item.price}</div>
                      </div>
                  ))}
              </div>
              <div className="mt-auto bg-indigo-50 p-2 rounded-lg text-right">
                  <div className="flex justify-between mb-1 border-b border-indigo-100 pb-1">
                      <span className={`${tinyText} text-indigo-400`}>{t('subtotal', 'Subtotal')}</span>
                      <span className={`${tinyText} text-indigo-800`}>{data.subtotal}</span>
                  </div>
                  <div className="flex justify-between mb-2 border-b border-indigo-100 pb-1">
                      <span className={`${tinyText} text-indigo-400`}>{t('tax', 'Tax')}</span>
                      <span className={`${tinyText} text-indigo-800`}>{data.vat}</span>
                  </div>
                  <div className={`${headerText} text-indigo-700`}>{data.total}</div>
              </div>
          </div>
        </div>
      );
  }

  // --- 10. Simple (Default) ---
  return (
    <div className="w-full h-full bg-white shadow-sm flex flex-col p-4 overflow-hidden border border-gray-100">
        <div className="flex justify-between items-start mb-2">
            <div className="flex gap-1.5">
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 object-contain" />}
                <div>
                    <div className={`${headerText} text-blue-600`}>{t('invoiceTitle', 'INVOICE')}</div>
                    <div className={`${tinyText} text-gray-400 mt-1`}>#{data.id}</div>
                </div>
            </div>
            <div className="text-right">
                {renderProviderDetails("", "text-right")}
            </div>
        </div>
        <div className="border-t border-b border-gray-200 py-2 mb-2 flex justify-between">
            <div>
                <div className={`${tinyText} font-bold text-gray-700`}>{t('to', 'Client')}:</div>
                <div className={`${tinyText} text-gray-600`}>{data.client}</div>
                {renderClientDetails()}
            </div>
            <div className="text-right">
                 <div className={`${tinyText} font-bold text-gray-700`}>{t('date', 'Date')}:</div>
                 <div className={`${tinyText} text-gray-600`}>{data.date}</div>
            </div>
        </div>
        <div className="flex-1">
             <div className={`bg-gray-50 text-gray-700 flex p-1 mb-1 ${tinyText} font-bold`}>
                <div className="flex-1">{t('item', 'Description')}</div>
                <div className="w-20 text-right">{t('amount', 'Total')}</div>
            </div>
            {data.items.map((item, i) => (
                <div key={i} className={`flex p-1 text-gray-600 ${tinyText}`}>
                    <div className="flex-1">{item.desc}</div>
                    <div className="w-20 text-right">{item.price}</div>
                </div>
            ))}
        </div>
        <div className="mt-auto border-t-2 border-blue-600 pt-2 text-right flex flex-col items-end">
             <div className="w-1/3 flex justify-between mb-1">
                 <span className={`${tinyText} text-gray-500`}>{t('subtotal', 'Subtotal')}</span>
                 <span className={`${tinyText} text-gray-800`}>{data.subtotal}</span>
             </div>
             <div className="w-1/3 flex justify-between mb-2">
                 <span className={`${tinyText} text-gray-500`}>{t('tax', 'Tax')}</span>
                 <span className={`${tinyText} text-gray-800`}>{data.vat}</span>
             </div>
             <div className={`${headerText} text-blue-600 w-1/3 text-right`}>{t('total', 'Total')}: {data.total}</div>
        </div>
    </div>
  );
}
