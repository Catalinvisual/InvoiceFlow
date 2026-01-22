"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import useApi from "@/hooks/useApi";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  Zap, 
  Clock, 
  CreditCard, 
  ArrowRight, 
  Menu, 
  X,
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  Palette,
  HelpCircle
} from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import VideoModal from "@/components/VideoModal";

import Testimonials from '@/components/Testimonials';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [videoModalOpen, setVideoModalOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState('');
  const [selectedPrice, setSelectedPrice] = React.useState('');
  
  const { data: session, update } = useSession();
  const router = useRouter();
  const api = useApi();

  const handlePlanSelect = async (plan: string) => {
    if (!session) {
        router.push(`/register?plan=${plan.toLowerCase()}`);
        return;
    }

    if (session.user?.plan && session.user.plan.toUpperCase() === plan) {
        toast("You are already on this plan.");
        return;
    }

    const price = plan === 'STARTER' ? '€19.00' : '€49.00';
    setSelectedPlan(plan);
    setSelectedPrice(price);
    setPaymentModalOpen(true);
  };

  const handleUpgradeConfirm = async () => {
    try {
        await api.put('/settings/plan', { plan: selectedPlan });
        
        // Update session to reflect new plan immediately
        await update({ plan: selectedPlan });
        
        toast.success(`Successfully switched to ${selectedPlan} Plan!`);
        setPaymentModalOpen(false);
        window.location.reload(); 
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to update plan.");
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                I
              </div>
              <span className="font-bold text-xl tracking-tight">InvoiceFlow</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Features</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Pricing</Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Testimonials</Link>
              <div className="flex items-center space-x-4 ml-4">
                {session ? (
                   <Link href="/dashboard" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40">
                      Go to Dashboard
                   </Link>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-900 font-semibold hover:text-blue-600 transition-colors">
                      Log in
                    </Link>
                    <Link href="/register" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 absolute w-full">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link href="#features" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Features</Link>
              <Link href="#pricing" className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Pricing</Link>
              {session ? (
                  <Link href="/dashboard" className="block w-full text-center mt-4 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium">Go to Dashboard</Link>
              ) : (
                  <>
                      <Link href="/login" className="block px-3 py-2 text-gray-900 font-semibold hover:bg-gray-50 rounded-md">Log in</Link>
                      <Link href="/register" className="block w-full text-center mt-4 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium">Get Started</Link>
                  </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 border border-blue-100"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              New: Automated Payment Reminders
            </motion.div>
            
            <motion.h1 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight"
            >
              Stop Chasing Payments. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Start Growing.</span>
            </motion.h1>
            
            <motion.p 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Create professional invoices in seconds, automate reminders, and get paid 2x faster. 
              The all-in-one financial OS for modern freelancers and agencies.
            </motion.p>
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center justify-center gap-2">
                Start for Free <ArrowRight size={20} />
              </Link>
              <button 
                onClick={() => setVideoModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center"
              >
                View Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-16 relative mx-auto max-w-5xl"
            >
              <DashboardPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Trusted by 500+ Forward-Thinking Companies</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Mock Logos */}
             <div className="flex items-center gap-2 font-bold text-xl text-gray-800"><Zap className="text-blue-600"/> TechFlow</div>
             <div className="flex items-center gap-2 font-bold text-xl text-gray-800"><Shield className="text-blue-600"/> SecurePay</div>
             <div className="flex items-center gap-2 font-bold text-xl text-gray-800"><TrendingUp className="text-blue-600"/> GrowthInc</div>
             <div className="flex items-center gap-2 font-bold text-xl text-gray-800"><Clock className="text-blue-600"/> TimeWise</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to run your business</h2>
            <p className="text-xl text-gray-600">Powerful features designed to help you save time and get paid faster.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <CreditCard className="w-6 h-6 text-blue-600" />,
                title: "Smart Invoicing",
                desc: "Create beautiful, branded invoices in seconds. Recurring invoices? We handle those too."
              },
              {
                icon: <Clock className="w-6 h-6 text-blue-600" />,
                title: "Automated Reminders",
                desc: "Never chase a client again. Set up polite email reminders for overdue payments automatically."
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
                title: "Financial Insights",
                desc: "Track revenue, outstanding invoices, and business health with real-time analytics."
              },
              {
                icon: <Shield className="w-6 h-6 text-blue-600" />,
                title: "Secure & Compliant",
                desc: "Bank-grade security keeps your data safe. Fully compliant with local tax regulations."
              },
              {
                icon: <Zap className="w-6 h-6 text-blue-600" />,
                title: "Fast Payments",
                desc: "Accept credit cards and bank transfers directly on your invoices. Get paid 2x faster."
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
                title: "Client Portal",
                desc: "Give your clients a dedicated portal to view history, download invoices, and pay online."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeIn}
                className="p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why InvoiceFlow is better</h2>
              <p className="text-gray-400 text-lg mb-8">Stop struggling with Excel sheets or complex enterprise software. We built InvoiceFlow specifically for small businesses and freelancers.</p>
              
              <div className="space-y-6">
                {[
                  "Setup in less than 2 minutes",
                  "No hidden transaction fees",
                  "Unlimited clients and invoices",
                  "24/7 Priority Support"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                    <span className="font-medium text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30"></div>
              <div className="relative bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold mb-6">The Old Way vs. InvoiceFlow</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Manual Excel Invoices</span>
                    <span className="text-red-400 font-bold">2-3 hours/week</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <span className="text-white font-semibold">InvoiceFlow Automation</span>
                    <span className="text-green-400 font-bold">5 mins/week</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Late Payments</span>
                    <span className="text-red-400 font-bold">35% of invoices</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <span className="text-white font-semibold">With Auto-Reminders</span>
                    <span className="text-green-400 font-bold">&lt; 5% late</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Choose the right plan for your business</h2>
            <p className="text-xl text-gray-600">Start for free, upgrade as you grow. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
              <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Free Trial</h3>
                  <p className="text-sm text-gray-500">Test the value</p>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">€0<span className="text-lg text-gray-500 font-normal"></span></div>
              <p className="text-gray-600 mb-6 text-sm">No credit card required.</p>
              
              <Link href="/register" className="block w-full py-3 px-4 bg-blue-50 text-blue-700 font-bold text-center rounded-lg hover:bg-blue-100 transition-colors mb-8">Start Free</Link>
              
              <div className="space-y-4 flex-1">
                <p className="font-semibold text-gray-900">Includes:</p>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Dashboard overview</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Create & Send invoices</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Client management</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> 3 Templates</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> PDF download</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> 1 basic auto-reminder</li>
                </ul>

                <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="font-semibold text-gray-900 mb-3">Restrictions:</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> Max 3 invoices</li>
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> Max 3 clients</li>
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> No custom branding</li>
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> No data export</li>
                    </ul>
                </div>
              </div>
            </div>

            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col relative">
              <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                  <p className="text-sm text-gray-500">For freelancers & small firms</p>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">€19<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <p className="text-gray-600 mb-6 text-sm">The no-brainer plan.</p>
              
              <button onClick={() => handlePlanSelect('STARTER')} className="block w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 font-bold text-center rounded-lg hover:bg-blue-50 transition-colors mb-8">
                  {session && session.user?.plan === 'STARTER' ? 'Current Plan' : 'Get Starter'}
              </button>
              
              <div className="space-y-4 flex-1">
                <p className="font-semibold text-gray-900">Includes:</p>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> <strong>Unlimited invoices</strong></li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Invoice status tracking</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Basic auto-reminder (1 after due)</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> All 10 templates</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Company profile</li>
                    <li className="flex items-start gap-3 text-gray-600 text-sm"><CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> Email support</li>
                </ul>

                <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="font-semibold text-gray-900 mb-3">Restrictions:</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> Max 50 clients</li>
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> No custom branding</li>
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> No advanced reports</li>
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><X size={16} className="text-red-400 mt-0.5 shrink-0" /> No data export</li>
                    </ul>
                </div>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-800 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">MOST POPULAR</div>
              <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <p className="text-sm text-gray-400">For agencies & growing businesses</p>
              </div>
              <div className="text-4xl font-bold text-white mb-2">€49<span className="text-lg text-gray-400 font-normal">/mo</span></div>
              <p className="text-gray-400 mb-6 text-sm">Scale without limits.</p>
              
              <button onClick={() => handlePlanSelect('PRO')} className="block w-full py-3 px-4 bg-blue-600 text-white font-bold text-center rounded-lg hover:bg-blue-700 transition-colors mb-8 shadow-lg shadow-blue-900/50">
                  {session && session.user?.plan?.toUpperCase() === 'PRO' ? 'Current Plan' : 'Get Pro'}
              </button>
              
              <div className="space-y-4 flex-1">
                <p className="font-semibold text-white">Includes:</p>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> <strong>Unlimited clients</strong></li>
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> <strong>Unlimited invoices</strong></li>
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> Advanced auto-reminders</li>
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> Custom branding (logo + colors)</li>
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> Cashflow & overdue overview</li>
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> Data export (CSV)</li>
                    <li className="flex items-start gap-3 text-gray-300 text-sm"><CheckCircle size={16} className="text-blue-400 mt-0.5 shrink-0" /> Priority support</li>
                </ul>

                 <div className="border-t border-gray-800 pt-4 mt-4">
                    <p className="font-semibold text-gray-400 mb-3">Restrictions:</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-gray-500 text-sm"><CheckCircle size={16} className="text-blue-900 mt-0.5 shrink-0" /> None</li>
                    </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to streamline your invoicing?</h2>
          <p className="text-xl text-gray-600 mb-10">Join thousands of businesses who trust InvoiceFlow to handle their payments.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
                <Link href="/dashboard" className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-xl">
                  Go to Dashboard
                </Link>
            ) : (
                <Link href="/register" className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-xl">
                  Get Started Now
                </Link>
            )}
          </div>
        </div>
      </section>

      <Testimonials />
      <NewsletterSignup />

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
                <span className="font-bold text-xl">InvoiceFlow</span>
              </div>
              <p className="text-gray-500 max-w-xs">Making invoicing simple, fast, and automated for everyone.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#" className="hover:text-blue-600">About</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-600">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p>&copy; {new Date().getFullYear()} InvoiceFlow Inc. All rights reserved.</p>
              <p className="text-xs">Created by <Link href="https://www.haplogic.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 font-medium transition-colors">HapLogic</Link></p>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-gray-900">Terms</Link>
              <Link href="#" className="hover:text-gray-900">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
      
      <PaymentModal 
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        plan={selectedPlan}
        price={selectedPrice}
        onConfirm={handleUpgradeConfirm}
      />
      
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />
    </div>
  );
}

function DashboardPreview() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Base width for desktop layout is 1280px
        const baseWidth = 1280;
        const newScale = width < baseWidth ? width / baseWidth : 1;
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-gray-900 rounded-2xl p-2 shadow-2xl shadow-blue-900/20 ring-1 ring-gray-900/10">
      <div className="relative w-full aspect-video bg-white rounded-xl overflow-hidden border border-gray-200">
        <div 
          style={{ 
            width: '1280px', 
            height: '720px', 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className="flex flex-row bg-white"
        >
          {/* Sidebar */}
          <div className="w-64 bg-[#0B0F19] border-r border-gray-800 flex flex-col p-4 shrink-0">
            <div className="flex items-center gap-2 mb-8 px-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">I</div>
              <span className="font-bold text-white text-base">InvoiceFlow</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-900/20 text-blue-400 rounded-lg text-sm font-medium">
                  <LayoutDashboard className="w-[18px] h-[18px]" /> <span>Dashboard</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <FileText className="w-[18px] h-[18px]" /> <span>Invoices</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <Users className="w-[18px] h-[18px]" /> <span>Clients</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <Palette className="w-[18px] h-[18px]" /> <span>Templates</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <Bell className="w-[18px] h-[18px]" /> <span>Automation</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <CreditCard className="w-[18px] h-[18px]" /> <span>Payment Settings</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <Settings className="w-[18px] h-[18px]" /> <span>Settings</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg text-sm font-medium">
                  <HelpCircle className="w-[18px] h-[18px]" /> <span>Support</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white flex flex-col min-w-0">
            {/* Topbar */}
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
                <h2 className="font-semibold text-gray-800 text-base">Dashboard</h2>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <Bell className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                      JD
                  </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 bg-gray-50/50 flex-1 overflow-hidden">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-gray-500 text-xs font-medium mb-1">Total Revenue</div>
                      <div className="text-2xl font-bold text-gray-900">€24,500.00</div>
                      <div className="text-green-500 text-xs flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" /> +12% from last month
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-gray-500 text-xs font-medium mb-1">Pending Invoices</div>
                      <div className="text-2xl font-bold text-gray-900">€3,200.00</div>
                      <div className="text-orange-500 text-xs mt-1">
                        4 invoices pending
                      </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="text-gray-500 text-xs font-medium mb-1">Paid Invoices</div>
                      <div className="text-2xl font-bold text-gray-900">128</div>
                      <div className="text-blue-500 text-xs mt-1">
                        All time
                      </div>
                  </div>
                </div>

                {/* Recent Invoices */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 text-sm">Recent Invoices</h3>
                  </div>
                  <div className="p-0">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                              <th className="px-6 py-3">Client</th>
                              <th className="px-6 py-3">Amount</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                              { client: "Acme Corp", amount: "€1,200.00", status: "Paid", date: "Oct 24, 2023", color: "text-green-600 bg-green-50" },
                              { client: "Globex Inc", amount: "€3,450.00", status: "Pending", date: "Oct 22, 2023", color: "text-orange-600 bg-orange-50" },
                              { client: "Soylent Corp", amount: "€850.00", status: "Paid", date: "Oct 20, 2023", color: "text-green-600 bg-green-50" },
                            ].map((inv, i) => (
                              <tr key={i}>
                                  <td className="px-6 py-3 font-medium text-gray-900">{inv.client}</td>
                                  <td className="px-6 py-3 text-gray-600">{inv.amount}</td>
                                  <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.color}`}>
                                        {inv.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-gray-500">{inv.date}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
