"use client";
import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { CreditCard, Clock, Download, CheckCircle } from 'lucide-react';
import { formatDate } from '@/utils/dateFormatter';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { toast } from 'react-hot-toast';

type PortalInvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

type PortalInvoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  total: string;
  status: string;
  items: string | PortalInvoiceItem[];
  client: { name: string; cui?: string | null; regCom?: string | null; address?: string | null; email?: string | null };
  user?: { companyName?: string | null; settings?: { companyName?: string | null; currency?: string | null } | null } | null;
};

export default function PortalDashboard() {
  const api = useApi();
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvoices = () => {
    api.get('/portal/invoices').then(res => {
      setInvoices(res.data);
    }).catch(err => console.error(err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownload = (inv: PortalInvoice) => {
    try {
      const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
      const invoiceData = { ...inv, items } as unknown as {
        invoiceNumber: string;
        issueDate: string;
        dueDate: string;
        items: PortalInvoiceItem[];
        total: number;
        status: string;
      };
      
      // Ensure settings exists, otherwise provide empty object to avoid crash
      const settings = inv.user?.settings || { companyName: inv.user?.companyName };
      
      generateInvoicePDF(invoiceData, inv.client, settings);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Error generating PDF.');
    }
  };

  const handlePay = async (id: string) => {
    if (!confirm("Simulation: Confirm payment for this invoice?")) return;

    setProcessingId(id);
    try {
      await api.post(`/portal/pay/${id}`);
      toast.success('Payment recorded successfully!');
      fetchInvoices();
    } catch (error) {
      console.error(error);
      toast.error('Error processing payment.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingAmount = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome to your Portal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Amount</p>
            <p className="text-2xl font-bold text-gray-900">{pendingAmount.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Your Invoices</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm font-semibold text-gray-700">
            <tr>
              <th className="p-4">Invoice #</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
                <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>
            ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No invoices found.</td></tr>
            ) : (
                invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium">{inv.invoiceNumber}</td>
                        <td className="p-4 text-gray-600">{formatDate(inv.issueDate)}</td>
                        <td className="p-4 font-bold">{inv.total} €</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                  inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {inv.status}
                            </span>
                        </td>
                        <td className="p-4 flex justify-end gap-2">
                            <button 
                                onClick={() => handleDownload(inv)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Download PDF"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            
                            {inv.status !== 'paid' ? (
                                <button 
                                    onClick={() => handlePay(inv.id)}
                                    disabled={processingId === inv.id}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {processingId === inv.id ? '...' : 'Pay Now'}
                                </button>
                            ) : (
                                <span className="flex items-center text-green-600 text-sm font-medium px-3">
                                    <CheckCircle className="w-4 h-4 mr-1" /> Paid
                                </span>
                            )}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        <h2 className="text-lg font-semibold text-gray-800">Your Invoices</h2>
        {loading ? (
          <div className="p-6 text-center bg-white rounded-xl border border-gray-100">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-xl border border-gray-100">No invoices found.</div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">#{inv.invoiceNumber}</h3>
                  <p className="text-sm text-gray-500">{formatDate(inv.issueDate)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {inv.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-3 mt-2">
                <div>
                   <p className="text-xs text-gray-400">Total Amount</p>
                   <p className="font-bold text-lg text-gray-900">{inv.total} €</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleDownload(inv)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                        title="Download PDF"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    {inv.status !== 'paid' ? (
                        <button 
                            onClick={() => handlePay(inv.id)}
                            disabled={processingId === inv.id}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" />
                            {processingId === inv.id ? '...' : 'Pay'}
                        </button>
                    ) : (
                        <span className="flex items-center text-green-600 text-sm font-medium px-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-4 h-4 mr-1" /> Paid
                        </span>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
