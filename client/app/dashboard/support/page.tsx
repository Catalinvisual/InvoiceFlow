'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Mail, Phone, MessageSquare, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
  const { data: session } = useSession();
  const plan = session?.user?.plan?.toUpperCase() || 'FREE';

  const isPro = plan === 'PRO';
  const isStarter = plan === 'STARTER';
  const isFree = plan === 'FREE';

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I change my invoice template?",
      answer: "You can change your invoice template by navigating to Settings > Invoice Customization. Choose from our collection of professional templates and click 'Save Changes'."
    },
    {
      question: "Can I export my data?",
      answer: "Data export (CSV format) is available exclusively on the Pro plan. If you're on the Pro plan, you'll find the 'Export Data' option in the Settings menu."
    },
    {
      question: "How does the 30-day trial work?",
      answer: "When you sign up, you get full access to all Pro features for 30 days. No credit card is required. At the end of the trial, you can choose to upgrade or continue with the Free plan."
    },
    {
      question: "Billing and refunds policy",
      answer: "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team within 14 days of your purchase for a full refund."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Help & Support</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-full ${isPro ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isPro ? 'Priority Support' : 'Email Support'}
            </h2>
            <p className="text-gray-500">
              {isPro 
                ? 'As a Pro customer, your tickets are jumped to the front of the queue.' 
                : 'We usually respond within 24-48 hours.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="font-medium">
              {isPro ? 'priority@saas-invoice.com' : 'support@saas-invoice.com'}
            </span>
          </div>
          
          {isPro && (
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="font-medium">+1 (555) 123-4567 (Pro Line)</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="w-5 h-5 text-gray-400" />
            <span>Mon-Fri, 9:00 AM - 6:00 PM CET</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            FAQ
          </h3>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 last:border-0">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left py-3 flex justify-between items-center text-gray-700 hover:text-blue-600 transition-colors focus:outline-none bg-transparent"
                >
                  <span className="font-medium text-sm pr-4">{faq.question}</span>
                  {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === index && (
                    <motion.div
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 }
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-gray-500 pb-3 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Plan Benefits
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Response Time</span>
              <span className={`font-bold ${isPro ? 'text-green-600' : 'text-gray-600'}`}>
                {isPro ? '< 4 hours' : isStarter ? '< 24 hours' : '< 48 hours'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Phone Support</span>
              <span className={`font-bold ${isPro ? 'text-green-600' : 'text-gray-400'}`}>
                {isPro ? 'Included' : 'Not included'}
              </span>
            </div>
            {!isPro && (
              <div className="mt-4 text-center">
                <a href="/dashboard/settings" className="text-sm text-blue-600 font-medium hover:underline">
                  Upgrade to Pro for faster support &rarr;
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
