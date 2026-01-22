"use client";
import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { Users, Building, CreditCard, FileText, TrendingUp, Send, Clock, Shield, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const api = useApi();
  const [stats, setStats] = useState({ 
    vendors: 0, 
    customers: 0, 
    subscribers: 0,
    totalInvoices: 0,
    mrr: 0,
    planDistribution: { FREE: 0, STARTER: 0, PRO: 0 },
    recentUsers: [] as any[],
    recentSubscribers: [] as any[]
  });

  const [broadcast, setBroadcast] = useState({ subject: '', message: '', type: 'all' });
  const [broadcasting, setBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'subscribers'>('users');

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
        const response = await api.post('/admin/broadcast', broadcast);
        
        if (response.data.warning) {
             toast('Broadcast sent with some errors', { icon: '⚠️' });
             console.warn('Broadcast partial errors:', response.data.errors);
        } else {
             toast.success(response.data.message || 'Broadcast sent successfully!');
        }
        
        setBroadcast({ subject: '', message: '', type: 'all' });
    } catch (error: any) {
            console.error('Broadcast error:', error);
            const resData = error.response?.data;
            const msg = resData?.error || resData?.message || 'Failed to send broadcast';
            const details = resData?.details;
            
            if (details) {
                console.error('Error details:', details);
                // Handle array of errors (bulk send failure)
                if (Array.isArray(details) && details.length > 0) {
                     const firstError = details[0];
                     // Extract message from nested error object structure common in Resend
                     const errorMsg = firstError.error?.message || firstError.error?.name || JSON.stringify(firstError.error);
                     toast.error(`Failed for ${details.length} users. Reason: ${errorMsg}`);
                } 
                // Handle single error object
                else if (details.name === 'validation_error') {
                    toast.error(`Validation Error: ${details.message}`);
                } else {
                    toast.error(`${msg}: ${JSON.stringify(details)}`);
                }
            } else {
                toast.error(msg);
            }
    } finally {
        setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Admin Overview</h1>
        <span className="text-sm text-black">Live system stats</span>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-black flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-black">Vendors</p>
            <p className="text-2xl font-bold text-black">{stats.vendors}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-black">Portal Users</p>
            <p className="text-2xl font-bold text-black">{stats.customers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black flex items-center space-x-4">
          <div className="p-3 bg-pink-100 text-pink-600 rounded-lg">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-black">Subscribers</p>
            <p className="text-2xl font-bold text-black">{stats.subscribers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-black">MRR (Est.)</p>
            <p className="text-2xl font-bold text-black">€{stats.mrr}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-black flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-black">Total Invoices</p>
            <p className="text-2xl font-bold text-black">{stats.totalInvoices}</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Signups / Subscribers - Spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-black overflow-hidden">
             <div className="p-6 border-b border-black flex justify-between items-center">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`text-lg font-semibold transition-colors ${activeTab === 'users' ? 'text-black' : 'text-gray-400'}`}
                    >
                        Recent Signups
                    </button>
                    <button 
                        onClick={() => setActiveTab('subscribers')}
                        className={`text-lg font-semibold transition-colors ${activeTab === 'subscribers' ? 'text-black' : 'text-gray-400'}`}
                    >
                        Subscribers
                    </button>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-black flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last 5
                </div>
             </div>
             <div className="overflow-x-auto">
                {activeTab === 'users' ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Company</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recentUsers?.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-black">{user.companyName}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            user.plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
                                            user.plan === 'STARTER' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {user.plan || 'FREE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {(!stats.recentUsers || stats.recentUsers.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No recent signups found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Subscribed Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recentSubscribers?.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-black">{sub.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {sub.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {(!stats.recentSubscribers || stats.recentSubscribers.length === 0) && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                                        No subscribers yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
             </div>
        </div>

        {/* Right Column Stack */}
        <div className="space-y-6">
            {/* Plan Distribution Mini-Widget */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-black">
            <h3 className="text-lg font-semibold text-black mb-4">Plan Distribution</h3>
            <div className="space-y-4">
                <div>
                <div className="flex justify-between text-sm mb-1 text-black">
                    <span>Free Plan</span>
                    <span className="font-medium">{stats.planDistribution?.FREE || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 border border-black">
                    <div 
                    className="bg-black h-2 rounded-full" 
                    style={{ width: `${(stats.planDistribution?.FREE / (stats.vendors || 1)) * 100}%` }}
                    ></div>
                </div>
                </div>
                <div>
                <div className="flex justify-between text-sm mb-1 text-black">
                    <span>Starter Plan</span>
                    <span className="font-medium">{stats.planDistribution?.STARTER || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 border border-black">
                    <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(stats.planDistribution?.STARTER / (stats.vendors || 1)) * 100}%` }}
                    ></div>
                </div>
                </div>
                <div>
                <div className="flex justify-between text-sm mb-1 text-black">
                    <span>Pro Plan</span>
                    <span className="font-medium">{stats.planDistribution?.PRO || 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 border border-black">
                    <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(stats.planDistribution?.PRO / (stats.vendors || 1)) * 100}%` }}
                    ></div>
                </div>
                </div>
            </div>
            </div>

            {/* Broadcast Widget */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-black">
                <div className="flex items-center gap-2 mb-4">
                    <Send className="w-5 h-5 text-black" />
                    <h3 className="text-lg font-semibold text-black">Broadcast</h3>
                </div>
                <form onSubmit={handleBroadcast} className="space-y-3">
                    <div className="flex gap-2">
                        <select
                            className="w-1/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                            value={broadcast.type}
                            onChange={e => setBroadcast({...broadcast, type: e.target.value})}
                        >
                            <option value="all">All Users</option>
                            <option value="newsletter">Newsletter Subscribers</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder="Subject" 
                            className="w-2/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                            value={broadcast.subject}
                            onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                            required
                        />
                    </div>
                    <textarea 
                        placeholder={`Message to ${broadcast.type === 'newsletter' ? 'Subscribers' : 'Platform Users'}...`} 
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none resize-none"
                        value={broadcast.message}
                        onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                        required
                    ></textarea>
                    <button 
                        type="submit" 
                        disabled={broadcasting}
                        className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        {broadcasting ? 'Sending...' : 'Send Announcement'}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
