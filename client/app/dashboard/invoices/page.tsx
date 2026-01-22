'use client';

import { useState, useEffect } from 'react';
import useApi from '@/hooks/useApi';
import { formatDate } from '@/utils/dateFormatter';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: string | number;
  status: string;
  client: { name: string };
};

export default function InvoicesPage() {
  const { data: session } = useSession();
  const api = useApi();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate years (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedClient, selectedYear, searchQuery]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClient !== 'all') params.append('clientId', selectedClient);
      if (selectedYear !== 'all') params.append('year', selectedYear);
      if (searchQuery) params.append('q', searchQuery.trim());

      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (session?.user?.plan?.toUpperCase() !== 'PRO') {
      toast.error("Export feature is available only on Pro Plan.");
      return;
    }

    try {
        const response = await api.get('/invoices/export', {
            responseType: 'blob',
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'invoices_export.csv');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    } catch (error: any) {
        console.error("Export failed:", error);
        
        let errorMessage = "Failed to export invoices.";
        if (error.response?.data instanceof Blob) {
             try {
                 const text = await error.response.data.text();
                 const json = JSON.parse(text);
                 errorMessage = json.message || errorMessage;
             } catch (e) {
                 // fallback
             }
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        
        toast.error(errorMessage);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Invoices</h1>
        <div className="flex gap-3">
            <button
                onClick={handleExport}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export CSV
            </button>
            <Link 
            href="/dashboard/invoices/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Invoice
            </Link>
        </div>
      </div>

      {/* Intelligent Filtering */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
            <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>

        {/* Client Filter */}
        <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
        >
            <option value="all">All Clients</option>
            {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
            ))}
        </select>

        {/* Year Filter */}
        <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
        >
            <option value="all">All Years</option>
            {years.map(year => (
                <option key={year} value={year}>{year}</option>
            ))}
        </select>
        
        {/* Reset Filters */}
         <button
            onClick={() => {
                setSelectedClient('all');
                setSelectedYear('all');
                setSearchQuery('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center justify-center gap-2"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            Reset Filters
        </button>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading && invoices.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-100">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center p-8 text-black bg-white rounded-xl border border-gray-100">
            No invoices issued yet.
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/dashboard/invoices/${inv.id}`} className="font-bold text-black hover:text-blue-600">
                    #{inv.invoiceNumber}
                  </Link>
                  <p className="text-sm text-black">{inv.client.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                  ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                    inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {inv.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-black">
                 <div>
                   <p className="text-xs text-black">Issued</p>
                   <p>{formatDate(inv.issueDate)}</p>
                 </div>
                 <div>
                   <p className="text-xs text-black">Due</p>
                   <p>{formatDate(inv.dueDate)}</p>
                 </div>
                 <div className="col-span-2 mt-2 pt-2 border-t flex justify-between items-center">
                    <div>
                        <p className="text-xs text-black">Total</p>
                        <p className="font-bold text-black">{inv.total} €</p>
                    </div>
                    <Link 
                      href={`/dashboard/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    >
                      Details &rarr;
                    </Link>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-black">
              <th className="p-4">Number</th>
              <th className="p-4">Client</th>
              <th className="p-4">Issue Date</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                   <p className="mt-2 text-gray-500">Loading...</p>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-black">
                  No invoices issued yet.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-black">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-blue-600 hover:underline">
                      #{inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="p-4 text-black">{inv.client.name}</td>
                  <td className="p-4 text-black">{formatDate(inv.issueDate)}</td>
                  <td className="p-4 text-black">{formatDate(inv.dueDate)}</td>
                  <td className="p-4 font-medium text-black">{inv.total} €</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                      ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/dashboard/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                    >
                      Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
