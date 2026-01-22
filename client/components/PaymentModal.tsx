import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  price: string;
  onConfirm: () => Promise<void>;
}

export default function PaymentModal({ isOpen, onClose, plan, price, onConfirm }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    await onConfirm();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900">Upgrade to {plan}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total due today</p>
                <p className="text-2xl font-bold text-blue-900">{price}</p>
              </div>
              <div className="bg-white p-2 rounded-md">
                <CreditCard className="text-blue-600" size={24} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                  <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    required
                    value={expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                      setExpiry(v);
                    }}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      maxLength={3}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                    <Lock className="absolute right-3 top-2.5 text-gray-400" size={16} />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Lock size={18} /> Pay & Upgrade
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1 mt-4">
                <Lock size={12} /> Secure 256-bit SSL Encrypted Payment
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
