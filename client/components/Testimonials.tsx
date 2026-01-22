'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        name: "Sarah Jenkins",
        role: "Freelance Designer",
        content: "InvoiceFlow changed how I work. I used to spend hours on billing, now it takes seconds.",
        avatar: "SJ"
    },
    {
        name: "Marcus Chen",
        role: "Agency Owner",
        content: "The best invoicing platform for small businesses. Professional templates and great tracking.",
        avatar: "MC"
    },
    {
        name: "Elena Popescu",
        role: "Legal Consultant",
        content: "Finally, a tool that understands Romanian invoicing standards while looking modern.",
        avatar: "EP"
    }
];

export default function Testimonials() {
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Professionals</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Don't just take our word for it. Here's what our community has to say.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                        >
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                            </div>
                            <p className="text-gray-700 mb-6 italic">"{t.content}"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{t.name}</div>
                                    <div className="text-xs text-gray-500">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
