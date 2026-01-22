'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useApi from '@/hooks/useApi';
import { formatDate } from '@/utils/dateFormatter';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

type InvoiceClient = {
  name: string;
  email?: string | null;
  cui?: string | null;
  regCom?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  zipCode?: string | null;
  phone?: string | null;
};

type InvoiceDetails = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: string | InvoiceItem[];
  total: string | number;
  subtotal?: string | number;
  vatRate?: string | number;
  vatAmount?: string | number;
  status: string;
  client: InvoiceClient;
  notes?: string | null;
};

type Settings = {
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  iban?: string | null;
  bank?: string | null;
  email?: string | null;
  phone?: string | null;
  currency?: string | null;
  invoiceTemplate?: string | null;
  logoUrl?: string | null;
};

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const api = useApi();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [invoiceRes, settingsRes] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get('/settings')
      ]);
      setInvoice(invoiceRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    try {
      await api.patch(`/invoices/${invoice.id}/mark-paid`);
      setInvoice({ ...invoice, status: 'paid' });
      toast.success('Invoice marked as paid!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status.');
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice || !settings) {
      toast.error('Data not fully loaded.');
      return;
    }
    try {
      generateInvoicePDF(invoice, invoice.client, settings);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Error generating PDF.');
    }
  };

  const handleSendEmailClick = () => {
    setShowEmailModal(true);
  };

  const handleConfirmSendEmail = async () => {
    setShowEmailModal(false);
    setSendingEmail(true);
    try {
      await api.post(`/invoices/${id}/send`);
      toast.success('Email sent successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Error sending email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted.');
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error(error);
      toast.error('Error deleting invoice.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!invoice) return <div className="p-8 text-center">Invoice not found.</div>;

  // Parse items if string
  const items: InvoiceItem[] = (() => {
    if (Array.isArray(invoice.items)) return invoice.items;
    if (typeof invoice.items !== "string") return [];
    try {
      const parsed: unknown = JSON.parse(invoice.items);
      return Array.isArray(parsed) ? (parsed as InvoiceItem[]) : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Link href="/dashboard/invoices" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Invoices
        </Link>
        <div className="flex gap-3">
           <button 
            onClick={handleDeleteClick}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
           >
             Delete
           </button>
           <button 
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
             Download PDF
           </button>
           {invoice.status !== 'paid' && (
             <button 
              onClick={handleMarkAsPaid}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
               Mark as Paid
             </button>
           )}
           <button 
            onClick={handleSendEmailClick}
            disabled={sendingEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
           >
             {sendingEmail ? 'Sending...' : (
               <>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                 Send Email
               </>
             )}
           </button>
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Send Invoice</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to send this invoice via email to the client?
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Yes, Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Invoice</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Invoice Header */}
        <div className="p-8 bg-gray-50 border-b border-gray-100 grid grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-gray-500">#{invoice.invoiceNumber}</p>
            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-medium uppercase tracking-wide
              ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
            >
              {invoice.status}
            </div>
          </div>
          <div className="text-right">
             <div className="text-sm text-gray-500 mb-1">Total Due</div>
             <div className="text-4xl font-bold text-gray-900">
               {invoice.total} {settings?.currency || '€'}
             </div>
             <div className="mt-4 text-sm text-gray-600">
               <div>Issued: {formatDate(invoice.issueDate)}</div>
               <div>Due: {formatDate(invoice.dueDate)}</div>
             </div>
          </div>
        </div>

        {/* Party Details */}
        <div className="p-8 grid grid-cols-2 gap-12">
           <div>
             {settings?.logoUrl && (
                <div className="mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={settings.logoUrl.startsWith('/') ? `http://localhost:5000${settings.logoUrl}` : settings.logoUrl} 
                    alt="Company Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
             )}
             <div className="text-gray-900 font-medium">{settings?.companyName}</div>
             <div className="text-gray-600 mt-2 text-sm leading-relaxed">
               {settings?.cui && <div>Tax ID: {settings.cui}</div>}
               {settings?.regCom && <div>Trade Reg: {settings.regCom}</div>}
               {settings?.address && <div>{settings.address}</div>}
               {(settings?.city || settings?.country) && <div>{[settings.city, settings.country].filter(Boolean).join(', ')}</div>}
               {settings?.iban && <div className="mt-2 font-mono bg-gray-50 p-2 rounded border border-gray-100 inline-block">{settings.iban}</div>}
             </div>
           </div>
           <div>
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Client</h3>
             <div className="text-gray-900 font-medium">{invoice.client.name}</div>
             <div className="text-gray-600 mt-2 text-sm leading-relaxed">
               {invoice.client.email && <div>{invoice.client.email}</div>}
               {invoice.client.cui && <div>Tax ID: {invoice.client.cui}</div>}
               {invoice.client.regCom && <div>Reg: {invoice.client.regCom}</div>}
               {invoice.client.address && <div>{invoice.client.address}</div>}
               {(invoice.client.city || invoice.client.county) && <div>{[invoice.client.city, invoice.client.county].filter(Boolean).join(', ')}</div>}
               {(invoice.client.country || invoice.client.zipCode) && <div>{[invoice.client.country, invoice.client.zipCode].filter(Boolean).join(' ')}</div>}
             </div>
           </div>
        </div>

        {/* Products Table */}
        <div className="p-8 pt-0">
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
              {items.map((item, i: number) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-4">{item.description}</td>
                  <td className="py-4 text-right">{item.quantity}</td>
                  <td className="py-4 text-right">{Number(item.price).toFixed(2)}</td>
                  <td className="py-4 text-right font-medium">{(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex flex-col md:flex-row justify-between border-t border-gray-100 pt-8 gap-8">
            <div className="flex-1 max-w-md">
                {invoice.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Notes / Terms</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                )}
            </div>

            <div className="w-64 space-y-3">
                 <div className="flex justify-between text-gray-600">
                       <span>Subtotal</span>
                       <span>{Number(invoice.subtotal || invoice.total).toFixed(2)} {settings?.currency || '€'}</span>
                 </div>
                 {invoice.vatAmount !== undefined && invoice.vatAmount !== null && (
                   <div className="flex justify-between text-gray-600">
                       <span>VAT ({Number(invoice.vatRate)}%)</span>
                       <span>{Number(invoice.vatAmount).toFixed(2)} {settings?.currency || '€'}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-3">
                     <span>Total</span>
                     <span>{Number(invoice.total).toFixed(2)} {settings?.currency || '€'}</span>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
