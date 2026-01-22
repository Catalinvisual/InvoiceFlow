'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { formatDate } from '@/utils/dateFormatter';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

type DashboardInvoice = {
  id: string;
  total: string | number;
  status: string;
  createdAt: string;
  client: { name: string };
};

type DashboardStats = {
  counts: {
    activeInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
  };
  totals: {
    outstanding: string | number;
    recovered: string | number;
    overdue: string | number;
  } | null;
  totalRevenue: number | string; // Assuming we keep this separate or derived from totals?
  totalClients: number; // This comes from client count
  recentInvoices: DashboardInvoice[];
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const api = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isPro = session?.user?.plan?.toUpperCase() === 'PRO';

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
        return;
    }

    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
        fetchStats();
    }
  }, [session, router]);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
            <span className="p-2 bg-green-100 text-green-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
             {isPro && stats?.totals ? Number(stats.totals.recovered).toFixed(2) + ' €' : <span className="text-gray-400 text-lg">Upgrade for details</span>}
          </div>
          <div className="text-xs text-green-600 mt-1 flex items-center">
             <span className="font-medium">{stats?.counts?.paidInvoices || 0} paid invoices</span>
          </div>
        </div>

        {/* Card 2: Pending */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Pending Payments</h3>
            <span className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {isPro && stats?.totals ? Number(stats.totals.outstanding).toFixed(2) + ' €' : <span className="text-gray-400 text-lg">Upgrade for details</span>}
          </div>
          <div className="text-xs text-gray-500 mt-1">
             From {stats?.counts?.activeInvoices || 0} invoices
          </div>
        </div>

        {/* Card 3: Overdue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Overdue</h3>
            <span className="p-2 bg-red-100 text-red-600 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {isPro && stats?.totals ? Number(stats.totals.overdue).toFixed(2) + ' €' : <span className="text-gray-400 text-lg">Upgrade for details</span>}
          </div>
          <div className="text-xs text-red-600 mt-1 font-medium">
             {stats?.counts?.overdueInvoices || 0} overdue invoices
          </div>
        </div>

        {/* Card 4: Clients */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Active Clients</h3>
            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</div>
          <div className="text-xs text-blue-600 mt-1 hover:underline">
             <Link href="/dashboard/clients">View all clients &rarr;</Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Mobile */}
      <div className="md:hidden mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-black">Recent Invoices</h2>
          <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
            {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
              <div className="p-6 text-center text-black bg-white rounded-xl border border-gray-100">No invoices yet.</div>
            ) : (
              stats.recentInvoices.map((inv) => (
                <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-black">{inv.client.name}</div>
                    <div className="text-xs text-black">{formatDate(inv.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-black">{inv.total} €</div>
                    <span className={`text-xs font-bold uppercase ${
                      inv.status === 'paid' ? 'text-green-600' :
                      inv.status === 'overdue' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
        </div>
      </div>

      {/* Recent Invoices Table Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-black">Recent Invoices</h2>
          <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-black text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-black">No invoices yet.</td>
              </tr>
            ) : (
              stats.recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-black">{inv.client.name}</td>
                  <td className="p-4 text-black">{inv.total} €</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-black">{formatDate(inv.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
