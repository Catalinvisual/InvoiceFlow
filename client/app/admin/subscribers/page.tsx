'use client';

import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { Mail, Calendar, Trash2, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SubscribersPage() {
    const api = useApi();
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSendModal, setShowSendModal] = useState(false);
    const [newsletterSubject, setNewsletterSubject] = useState('');
    const [newsletterContent, setNewsletterContent] = useState('');
    const [sending, setSending] = useState(false);

    const fetchSubscribers = async () => {
        try {
            const res = await api.get('/admin/subscribers');
            setSubscribers(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load subscribers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleDelete = async (email: string) => {
        if (!confirm(`Are you sure you want to remove ${email}?`)) return;
        try {
            await api.post('/newsletter/unsubscribe', { email });
            toast.success('Subscriber removed');
            fetchSubscribers();
        } catch (error) {
            toast.error('Failed to remove subscriber');
        }
    };

    const handleSendNewsletter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterSubject || !newsletterContent) return;

        setSending(true);
        try {
            await api.post('/newsletter/send', {
                title: newsletterSubject,
                content: newsletterContent
            });
            toast.success('Newsletter sent successfully!');
            setShowSendModal(false);
            setNewsletterSubject('');
            setNewsletterContent('');
        } catch (error: any) {
            console.error(error);
            const resData = error.response?.data;
            // Prefer the detailed error message from the server if available
            const msg = resData?.error || resData?.message || 'Failed to send newsletter';
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8">Loading subscribers...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-black">Newsletter Subscribers</h1>
                    <p className="text-gray-500">Manage your newsletter audience</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowSendModal(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        Send Newsletter
                    </button>
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        {subscribers.length} Active Subscribers
                    </div>
                </div>
            </div>

            {showSendModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                        <h2 className="text-xl font-bold mb-4 text-black">Send Newsletter</h2>
                        <form onSubmit={handleSendNewsletter} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={newsletterSubject}
                                    onChange={(e) => setNewsletterSubject(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Newsletter Subject"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML supported)</label>
                                <textarea
                                    required
                                    value={newsletterContent}
                                    onChange={(e) => setNewsletterContent(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg h-64 focus:ring-2 focus:ring-black outline-none font-mono text-sm"
                                    placeholder="<p>Hello subscribers...</p>"
                                />
                                <p className="text-xs text-gray-500 mt-1">Basic HTML tags allowed for formatting.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowSendModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {sending ? 'Sending...' : 'Send to All Subscribers'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Subscribed At</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No subscribers found.
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-black">{sub.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(sub.email)}
                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove Subscriber"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
