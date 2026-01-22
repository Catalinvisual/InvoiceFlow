'use client';

import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { formatDate } from '@/utils/dateFormatter';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

type Transaction = {
  id: string;
  user: string;
  plan: string;
  amount: number;
  date: string;
  status: string;
};

export default function AdminRevenuePage() {
  const api = useApi();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await api.get('/admin/revenue');
        setTransactions(response.data.transactions);
        setTotalRevenue(response.data.totalRevenue);
      } catch (error) {
        console.error('Error fetching revenue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  if (loading) return <div className="p-8 text-black">Loading financial data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Revenue & Subscriptions</h1>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black">
           <div className="flex items-center space-x-3 mb-2">
             <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
             </div>
             <span className="text-black text-sm">Total Projected Revenue</span>
           </div>
           <p className="text-3xl font-bold text-black">€{totalRevenue}</p>
           <p className="text-xs text-black mt-1">Based on active plans</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black">
           <div className="flex items-center space-x-3 mb-2">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
             </div>
             <span className="text-black text-sm">Active Subscriptions</span>
           </div>
           <p className="text-3xl font-bold text-black">{transactions.length}</p>
           <p className="text-xs text-black mt-1">Paid plans (Starter/Pro)</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black">
           <div className="flex items-center space-x-3 mb-2">
             <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Calendar className="w-5 h-5" />
             </div>
             <span className="text-black text-sm">Next Payout</span>
           </div>
           <p className="text-lg font-semibold text-black">End of Month</p>
           <p className="text-xs text-black mt-1">Automated Schedule</p>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
        <div className="p-6 border-b border-black">
          <h3 className="text-lg font-semibold text-black">Recent Subscription Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">User / Company</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-black">
                      {tx.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.plan === 'PRO' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      €{tx.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-black">
                    No paid subscriptions found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
