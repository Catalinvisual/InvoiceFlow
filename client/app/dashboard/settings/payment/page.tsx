'use client';

import { useState, useEffect } from 'react';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';

export default function PaymentSettingsPage() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    payment_method: 'paypal',
    payment_link_base: '',
    payment_instructions: ''
  });

  const getDefaultLinkForMethod = (method: string) => {
    if (method === 'paypal') return 'https://paypal.me/yourname';
    if (method === 'stripe_link') return 'https://pay.stripe.com/your-link';
    if (method === 'revolut') return 'https://revolut.me/yourname';
    return '';
  };

  const normalizePaymentMethodFromServer = (value?: string | null) => {
    if (!value) return 'paypal';
    const v = value.toLowerCase();
    if (v.includes('paypal')) return 'paypal';
    if (v.includes('stripe')) return 'stripe_link';
    if (v.includes('revolut')) return 'revolut';
    if (v.includes('bank')) return 'bank_transfer';
    return 'paypal';
  };

  const getPaymentLinkPlaceholder = () => {
    if (formData.payment_method === 'paypal') return 'https://paypal.me/yourname';
    if (formData.payment_method === 'stripe_link') return 'https://pay.stripe.com/your-link';
    if (formData.payment_method === 'revolut') return 'https://revolut.me/yourname';
    return '';
  };

  const getPaymentLinkHelpText = () => {
    if (formData.payment_method === 'paypal') {
      return 'e.g. https://paypal.me/yourname (We will append invoice number automatically)';
    }
    if (formData.payment_method === 'stripe_link') {
      return 'Paste your Stripe Payment Link URL here. We will append invoice number if needed.';
    }
    if (formData.payment_method === 'revolut') {
      return 'e.g. https://revolut.me/yourname (You can add invoice number in the note).';
    }
    return 'For bank transfer you can leave this empty and use the instructions field.';
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/payment');
      const data = response.data;
      if (data) {
        const normalizedMethod = normalizePaymentMethodFromServer(data.paymentMethod);
        setFormData({
          payment_method: normalizedMethod,
          payment_link_base: normalizedMethod === 'bank_transfer'
            ? ''
            : (data.paymentLinkBase || getDefaultLinkForMethod(normalizedMethod)),
          payment_instructions: data.paymentInstructions || ''
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'payment_method') {
      setFormData(prev => ({
        ...prev,
        payment_method: value,
        payment_link_base: getDefaultLinkForMethod(value)
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/settings/payment', formData);
      toast.success('Payment settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      toast.error(error.response?.data?.message || 'Error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Payment Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Receive Payments</h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure how your clients will pay you. These details will appear on your invoices and emails.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="paypal">PayPal</option>
                <option value="stripe_link">Stripe Payment Link</option>
                <option value="revolut">Revolut</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Link (Base URL)</label>
            <div className="text-xs text-gray-500 mb-1">
              {getPaymentLinkHelpText()}
            </div>
            <input
              type="text"
              name="payment_link_base"
              value={formData.payment_link_base}
              onChange={handleChange}
              placeholder={getPaymentLinkPlaceholder()}
              disabled={formData.payment_method === 'bank_transfer'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Instructions</label>
              <div className="text-xs text-gray-500 mb-1">
                These instructions will be shown on the invoice PDF and email.
              </div>
              <textarea
                name="payment_instructions"
                value={formData.payment_instructions}
                onChange={handleChange}
                rows={4}
                placeholder="Please include invoice number as reference..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Saving...' : 'Save Payment Settings'}
              </button>
            </div>

          </form>
        </div>

        {/* Information & Roadmap */}
        <div className="space-y-6">
          
          {/* How it Works */}
          <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">How Payments Work (MVP)</h3>
            <ul className="space-y-2 text-sm text-blue-800 list-disc list-inside">
              <li><strong>Direct Payments:</strong> Your clients pay YOU directly via the link provided (PayPal, Revolut, etc.).</li>
              <li><strong>No Middleman:</strong> We do not touch your money. No fees from us.</li>
              <li><strong>Semi-Unique Links:</strong> We automatically append the invoice number to your base link (e.g., ?invoice=INV-001) so you can track payments.</li>
              <li><strong>Manual Status:</strong> When you receive money, you must manually mark the invoice as "PAID" in your dashboard.</li>
            </ul>
          </div>

          {/* Edge Cases */}
          <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">Important Notes & Edge Cases</h3>
            <ul className="space-y-2 text-sm text-yellow-800 list-disc list-inside">
              <li><strong>Missing Link:</strong> If you don't set a Payment Link, clients will only see the "Payment Instructions" text.</li>
              <li><strong>Partial Payments:</strong> This system does not track partial payments. Only mark as PAID when fully settled.</li>
              <li><strong>Refunds:</strong> Handle refunds directly in your payment provider (PayPal/Stripe). Then, if needed, you can mark the invoice as "Unpaid" or issue a credit note (future feature).</li>
            </ul>
          </div>

          {/* Roadmap */}
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Future Roadmap: Stripe Connect</h3>
            <p className="text-sm text-gray-600 mb-3">
              This project is designed to be "Future-Proof". When you are ready to automate everything, we can upgrade to Stripe Connect without breaking your data.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                 <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                 <div>
                   <p className="text-sm font-bold text-gray-800">Current (MVP)</p>
                   <p className="text-xs text-gray-500">Manual payments, 0% platform fees, manual status updates.</p>
                 </div>
              </div>
              <div className="flex items-start gap-3">
                 <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                 <div>
                   <p className="text-sm font-bold text-gray-400">Phase 2: Stripe Connect</p>
                   <p className="text-xs text-gray-400">Automated status updates via Webhooks. Platform fees optional. Refund management inside dashboard.</p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
