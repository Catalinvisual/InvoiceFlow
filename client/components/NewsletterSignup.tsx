'use client';

import { useState } from 'react';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import { Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewsletterSignup() {
    const api = useApi();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            await api.post('/newsletter/subscribe', { email });
            setSuccess(true);
            toast.success("Successfully subscribed!");
            setEmail('');
            
            // Auto dismiss after 5 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 5000);
            
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Something went wrong";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-white border-t border-gray-100">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-black rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-gray-800 rounded-full blur-3xl opacity-50"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stay in the loop</h2>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                            Join our newsletter for invoicing tips, new features, and business growth strategies. No spam, ever.
                        </p>

                        {success ? (
                            <div className="flex flex-col items-center justify-center text-green-400 p-6 bg-gray-900 rounded-xl max-w-md mx-auto border border-gray-800">
                                <CheckCircle className="w-12 h-12 mb-2" />
                                <h3 className="text-xl font-bold">You're subscribed!</h3>
                                <p className="text-gray-400 text-sm mt-1">Check your inbox soon.</p>
                                <button 
                                    onClick={() => setSuccess(false)}
                                    className="mt-4 text-sm text-white underline hover:text-gray-300"
                                >
                                    Subscribe another email
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email address" 
                                    className="flex-1 px-5 py-3 rounded-xl bg-gray-900 border border-gray-700 !text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Joining...' : (
                                        <>
                                            Subscribe <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                        
                        <p className="text-gray-600 text-xs mt-6">
                            By subscribing, you agree to our Privacy Policy and provide consent to receive updates.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
