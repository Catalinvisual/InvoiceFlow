'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatDate } from '@/utils/dateFormatter';

export default function PublicInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/public/${id}`);
      if (!res.ok) throw new Error('Invoice not found');
      const data = await res.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!invoice) return null;

  const settings = invoice.user?.settings || {};
  const user = invoice.user || {};
  const client = invoice.client || {};
  
  // Parse items
  let items = [];
  try {
      items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
  } catch (e) {}

  const paymentLink = invoice.paymentLink;
  const paymentInstructions = user.paymentInstructions;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
            {invoice.status === 'paid' ? (
                 <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">PAID</span>
            ) : (
                paymentLink && (
                    <a 
                        href={paymentLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-shadow shadow-lg flex items-center gap-2"
                    >
                        Pay Invoice
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </a>
                )
            )}
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-8">
                <div>
                    {settings.logoUrl && (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto mb-4" />
                    )}
                    <h2 className="text-xl font-bold text-gray-900">{user.companyName}</h2>
                    <div className="text-gray-500 mt-2 text-sm">
                        {user.cui && <p>CUI: {user.cui}</p>}
                        {user.regCom && <p>Reg. Com: {user.regCom}</p>}
                        {user.address && <p>{user.address}</p>}
                        {user.city && <p>{user.city}, {user.country}</p>}
                        {user.email && <p>{user.email}</p>}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Amount Due</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">{invoice.total} {settings.currency || 'EUR'}</p>
                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                        <p>Issue Date: <span className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</span></p>
                        <p>Due Date: <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span></p>
                    </div>
                </div>
            </div>

            {/* Client Info */}
            <div className="p-8 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bill To</p>
                <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                <div className="text-gray-600 mt-1 text-sm">
                    {client.email && <p>{client.email}</p>}
                    {client.address && <p>{client.address}</p>}
                    {(client.city || client.country) && <p>{[client.city, client.country].filter(Boolean).join(', ')}</p>}
                </div>
            </div>

            {/* Items */}
            <div className="p-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200 text-sm font-medium text-gray-500">
                            <th className="py-3">Description</th>
                            <th className="py-3 text-right">Qty</th>
                            <th className="py-3 text-right">Price</th>
                            <th className="py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-900">
                        {items.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-4">{item.description}</td>
                                <td className="py-4 text-right">{item.quantity}</td>
                                <td className="py-4 text-right">{Number(item.price).toFixed(2)}</td>
                                <td className="py-4 text-right font-medium">{(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-8 flex justify-end">
                    <div className="w-64 space-y-3">
                         <div className="flex justify-between text-gray-600">
                               <span>Subtotal</span>
                               <span>{Number(invoice.subtotal || invoice.total).toFixed(2)} {settings.currency || 'EUR'}</span>
                         </div>
                         {invoice.vatAmount !== undefined && invoice.vatAmount !== null && (
                           <div className="flex justify-between text-gray-600">
                               <span>VAT ({Number(invoice.vatRate)}%)</span>
                               <span>{Number(invoice.vatAmount).toFixed(2)} {settings.currency || 'EUR'}</span>
                           </div>
                         )}
                         <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3">
                             <span>Total</span>
                             <span>{Number(invoice.total).toFixed(2)} {settings.currency || 'EUR'}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Payment Section */}
            {(paymentLink || paymentInstructions) && invoice.status !== 'paid' && (
                <div className="p-8 bg-blue-50 border-t border-blue-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">How to Pay</h3>
                    
                    {paymentLink && (
                        <div className="mb-6">
                            <p className="text-sm text-blue-700 mb-2">Click the button below to pay online:</p>
                            <a 
                                href={paymentLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Pay Now
                            </a>
                        </div>
                    )}

                    {paymentInstructions && (
                        <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">Payment Instructions:</p>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">{paymentInstructions}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
