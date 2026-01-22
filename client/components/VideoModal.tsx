"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Mail, Bell, Send, FileText, User, Calendar, LayoutDashboard, Palette, Settings, HelpCircle, ChevronDown, Clock, AlertTriangle, Plus, CreditCard, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string; 
}

export default function VideoModal({ isOpen, onClose, videoUrl }: VideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 100 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-black/50 hover:bg-black/70 text-white/80 hover:text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Video Content */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              ) : (
                <DemoAnimation />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- Demo Animation Components ---

function DemoAnimation() {
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Base width for desktop layout is 1280px (standard laptop/desktop view)
        // We scale down if the container is smaller than 1280px
        const baseWidth = 1280;
        const newScale = width < baseWidth ? width / baseWidth : 1;
        setScale(newScale);
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Steps:
  // 0: Create Invoice
  // 1: Send Invoice
  // 2: Activate Automation (Navigate to Automation -> Toggle)
  // 3: Payment Settings (Configure payment method & link)
  // 4: Reminder Sent (Show notification)
  // 5: Paid
  // 6: Dashboard Update
  
  useEffect(() => {
    // Timings for each step
    const times = [4000, 3000, 4000, 4000, 3000, 3000, 5000]; 
    let currentTimer: NodeJS.Timeout;

    const runSequence = async () => {
       if (step >= 7) {
         setStep(0);
         return;
       }
       
       currentTimer = setTimeout(() => {
         setStep(s => (s + 1) % 7);
       }, times[step]);
    };

    runSequence();

    return () => clearTimeout(currentTimer);
  }, [step]);

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50 relative flex flex-col font-sans overflow-hidden">
      {/* Scaled Content Wrapper */}
      <div 
        style={{ 
          width: '1280px', 
          height: '720px', // Assuming aspect-video (16:9) of 1280 is 720
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        className="flex flex-col bg-white"
      >
      {/* Mock Browser Header */}
      <div className="h-8 bg-gray-200 border-b border-gray-300 flex items-center px-4 gap-2 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 text-center text-xs text-gray-500 font-medium">InvoiceFlow - Pro Dashboard</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Mock Sidebar */}
        <div className="w-64 bg-[#0B0F19] border-r border-gray-800 text-gray-400 p-4 flex flex-col transition-all duration-300 shrink-0">
          <div className="flex items-center gap-2 text-white font-bold mb-8 px-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs">I</div>
            <span className="text-base">InvoiceFlow</span>
          </div>
          <div className="space-y-1 text-sm flex-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={step === 6} />
            <SidebarItem icon={FileText} label="Invoices" active={step === 0 || step === 1 || step === 4} />
            <SidebarItem icon={User} label="Clients" />
            <SidebarItem icon={Palette} label="Templates" />
            <SidebarItem icon={Bell} label="Automation" active={step === 2} />
            <SidebarItem icon={CreditCard} label="Payment Settings" active={step === 3} />
            <SidebarItem icon={Settings} label="Settings" />
            <SidebarItem icon={HelpCircle} label="Support" />
          </div>
          
          <div className="pt-4 border-t border-gray-800">
             <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">JD</div>
                <div className="text-xs">
                   <div className="text-white font-medium">John Doe</div>
                   <div className="text-blue-400 text-[10px] uppercase font-bold">Pro Plan</div>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 && <StepCreateInvoice key="step0" />}
            {step === 1 && <StepSendInvoice key="step1" />}
            {step === 2 && <StepActivateAutomation key="step2" />}
            {step === 3 && <StepPaymentSettings key="step3" />}
            {step === 4 && <StepReminder key="step4" />}
            {step === 5 && <StepPaid key="step5" />}
            {step === 6 && <StepDashboard key="step6" />}
          </AnimatePresence>
        </div>
      </div>
      </div>

      {/* Step Indicator / Progress Bar - Keep this overlay independent of scale if we want it readable, or scale it too? 
          User said "identical", so scale it too. But it's outside the scaled wrapper in my new structure.
          Let's move it INSIDE the scaled wrapper to maintain relative position/size.
      */}
      <div 
        style={{ 
          width: '1280px',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom left',
          position: 'absolute',
          bottom: 0,
          left: 0
        }}
      >
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 flex">
        {[0, 1, 2, 3, 4, 5, 6].map((s) => (
           <div key={s} className="flex-1 h-full bg-gray-300 relative border-r border-white/20">
              {step === s && (
                <motion.div 
                  className="absolute inset-0 bg-blue-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: [4, 3, 4, 4, 3, 3, 5][s] / 1000, ease: "linear" }}
                />
              )}
              {step > s && <div className="absolute inset-0 bg-blue-600" />}
           </div>
        ))}
      </div>
      
      {/* Step Label Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md shadow-lg border border-white/10 flex items-center gap-2 whitespace-nowrap z-50">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        {step === 0 && "Step 1: Create Invoice"}
        {step === 1 && "Step 2: Send to Client"}
        {step === 2 && "Step 3: Activate Automation"}
        {step === 3 && "Step 4: Configure Payment Settings"}
        {step === 4 && "Step 5: Auto Reminder Sent"}
        {step === 5 && "Step 6: Get Paid"}
        {step === 6 && "Step 7: Dashboard Update"}
      </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false }: { icon: LucideIcon, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? 'bg-blue-900/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
      <Icon className="w-[18px] h-[18px]" /> 
      <span className="text-sm">{label}</span>
    </div>
  );
}

// --- Individual Step Components ---

function StepCreateInvoice() {
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [items, setItems] = useState<Array<{ name: string; qty: number; price: number }>>([]);
  const [isHoveringCreate, setIsHoveringCreate] = useState(false);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    // 1. Client selection
    timers.push(setTimeout(() => setClientOpen(true), 500));
    timers.push(setTimeout(() => setSelectedClient("Acme Corp Inc."), 1000));
    timers.push(setTimeout(() => setClientOpen(false), 1200));

    // 2. Type Service Name
    // "Web Development" length 15.
    const text = "Web Development";
    for (let i = 0; i <= text.length; i++) {
        timers.push(setTimeout(() => setServiceName(text.slice(0, i)), 1500 + i * 50));
    }

    // 3. Type Price
    // "1000" length 4.
    const priceText = "1000";
    for (let i = 0; i <= priceText.length; i++) {
        timers.push(setTimeout(() => setPrice(priceText.slice(0, i)), 2500 + i * 100));
    }

    // 4. Add Item
    timers.push(setTimeout(() => {
        setItems([{ name: "Web Development", qty: 1, price: 1000 }]);
        setServiceName("");
        setPrice("");
    }, 3200));

    // 5. Hover Create Button
    timers.push(setTimeout(() => setIsHoveringCreate(true), 3800));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const vat = subtotal * 0.19;
  const total = subtotal + vat;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="max-w-5xl mx-auto w-full"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Invoice</h2>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-8">
        {/* Top Section: Client & Details */}
        <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Client</label>
                    <div className="relative">
                        <div className="h-10 bg-white rounded border border-gray-300 flex items-center justify-between px-3 text-sm text-gray-900 shadow-sm">
                             <span className={selectedClient ? "text-gray-900" : "text-gray-500"}>
                                {selectedClient || "Select client"}
                             </span>
                             <motion.div
                                animate={{ rotate: clientOpen ? 180 : 0 }}
                                transition={{ duration: 0.15 }}
                                className="text-gray-400"
                             >
                                <ChevronDown className="w-4 h-4" />
                             </motion.div>
                        </div>
                        <AnimatePresence>
                            {clientOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20"
                                >
                                    {["Select client", "Acme Corp Inc.", "Globex LLC", "Soylent Corp"].map((name) => (
                                        <div
                                            key={name}
                                            className={[
                                                "px-3 py-2 text-sm",
                                                name === "Select client" ? "text-gray-400" : "text-gray-700",
                                                name === "Acme Corp Inc." ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-gray-50",
                                            ].join(" ")}
                                        >
                                            {name}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Issue date</label>
                    <div className="h-10 bg-white rounded border border-gray-300 flex items-center justify-between px-3 text-sm text-gray-900 shadow-sm">
                        <span>12-01-2026</span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Due date</label>
                    <div className="h-10 bg-white rounded border border-gray-300 flex items-center justify-between px-3 text-sm text-gray-900 shadow-sm">
                        <span>26-01-2026</span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Invoice number</label>
                     <div className="h-10 bg-white rounded border border-gray-300 flex items-center px-3 text-sm text-gray-900 shadow-sm">
                        INV-0001
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                     <div className="h-10 bg-white rounded border border-gray-300 flex items-center justify-between px-3 text-sm text-gray-900 shadow-sm">
                        <span>Net 14 Days</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>

        <hr className="border-gray-100" />

        {/* Services Section */}
        <div className="space-y-4">
             <h3 className="font-semibold text-gray-800 text-base">Services / Items</h3>
             
             {/* Input Row */}
             <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500">Service Name</label>
                    <div className="h-10 bg-white rounded border border-gray-300 flex items-center px-3 text-sm text-gray-900 shadow-sm">
                        {serviceName || <span className="text-gray-400">e.g. Web Development</span>}
                    </div>
                </div>
                 <div className="w-20 space-y-1">
                    <label className="text-xs text-gray-500">Qty</label>
                    <div className="h-10 bg-white rounded border border-gray-300 flex items-center px-3 text-sm text-gray-900 shadow-sm">
                        1
                    </div>
                </div>
                 <div className="w-32 space-y-1">
                    <label className="text-xs text-gray-500">Price (€)</label>
                    <div className="h-10 bg-white rounded border border-gray-300 flex items-center px-3 text-sm text-gray-900 shadow-sm">
                        {price || "0.00"}
                    </div>
                </div>
                <button className="h-10 w-10 bg-blue-600 rounded text-white flex items-center justify-center shadow-sm">
                    <Plus className="w-5 h-5" />
                </button>
             </div>

             {/* List */}
             <div className="min-h-[100px] py-4">
                {items.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-sm">No services added yet.</div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, i) => (
                             <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200"
                             >
                                <div>
                                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                </div>
                                <div className="flex gap-8 text-sm">
                                    <div className="w-10 text-center">{item.qty}</div>
                                    <div className="w-24 text-right">€{item.price.toFixed(2)}</div>
                                </div>
                             </motion.div>
                        ))}
                    </div>
                )}
             </div>

             {/* Totals */}
             <div className="flex flex-col items-end gap-2 pt-4 border-t border-gray-100">
                <div className="w-64 flex justify-between text-sm text-gray-600">
                    <span>Subtotal (excl. VAT)</span>
                    <span>€{subtotal.toFixed(2)}</span>
                </div>
                 <div className="w-64 flex justify-between text-sm text-gray-600 items-center">
                    <span>VAT Rate (%)</span>
                    <div className="flex items-center gap-2">
                         <div className="w-12 h-8 border border-gray-300 rounded flex items-center justify-center bg-white text-gray-900 text-sm">19</div>
                         <span>€{vat.toFixed(2)}</span>
                    </div>
                </div>
                 <div className="w-64 flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total (incl. VAT)</span>
                    <span>€{total.toFixed(2)}</span>
                </div>
             </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-start pt-4">
             <motion.button
               animate={isHoveringCreate ? { scale: 1.05 } : { scale: 1 }}
               className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-600/20 text-base"
             >
               Create Invoice
             </motion.button>
             <button className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-base">
                Cancel
             </button>
        </div>
      </div>
    </motion.div>
  );
}

function StepSendInvoice() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center h-full"
    >
       <motion.div 
         className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative z-10"
         initial={{ y: 20 }}
         animate={{ y: 0 }}
       >
          <div className="flex justify-between items-center mb-2 sm:mb-4 border-b pb-2 sm:pb-4">
             <div className="font-bold text-sm sm:text-lg">Invoice #INV-001</div>
             <div className="text-lg sm:text-xl font-bold text-gray-900">$2,500.00</div>
          </div>
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
             <div className="h-2 bg-gray-100 rounded w-3/4"></div>
             <div className="h-2 bg-gray-100 rounded w-1/2"></div>
             <div className="h-2 bg-gray-100 rounded w-5/6"></div>
          </div>
          
          <motion.button
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 text-base"
            animate={{ 
              backgroundColor: ["#2563eb", "#1d4ed8", "#10b981"]
            }}
            transition={{ delay: 1, duration: 0.5 }}
          >
             <Send className="w-[18px] h-[18px]" /> 
             <motion.span
                initial={{ display: "inline-block" }}
                animate={{ display: "none" }}
                transition={{ delay: 1, duration: 0 }}
             >
               Send to Client
             </motion.span>
             <motion.span
                initial={{ display: "none" }}
                animate={{ display: "inline-block" }}
                transition={{ delay: 1, duration: 0 }}
             >
               Sent!
             </motion.span>
          </motion.button>
       </motion.div>

       {/* Email Flying Animation */}
       <motion.div
         initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
         animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 0.8, 0],
            x: [0, 0, 200, 400],
            y: [0, -50, -100, -200]
         }}
         transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
         className="absolute z-20 text-blue-500"
       >
          <Mail className="w-16 h-16 text-blue-100 stroke-blue-600" fill="currentColor" />
       </motion.div>
    </motion.div>
  );
}

function StepActivateAutomation() {
  const [reminderDaysBeforeEnabled, setReminderDaysBeforeEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number | "">("");
  const [reminderOnDueDate, setReminderOnDueDate] = useState(false);

  const [reminderDaysAfter1Enabled, setReminderDaysAfter1Enabled] = useState(false);
  const [reminderDaysAfter1, setReminderDaysAfter1] = useState<number | "">("");

  const [reminderDaysAfter2Enabled, setReminderDaysAfter2Enabled] = useState(false);
  const [reminderDaysAfter2, setReminderDaysAfter2] = useState<number | "">("");

  const [reminderDaysAfter3Enabled, setReminderDaysAfter3Enabled] = useState(false);
  const [reminderDaysAfter3, setReminderDaysAfter3] = useState<number | "">("");

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    timers.push(setTimeout(() => setReminderDaysBeforeEnabled(true), 600));
    timers.push(setTimeout(() => setReminderDaysBefore(3), 800));

    timers.push(setTimeout(() => setReminderOnDueDate(true), 1150));

    timers.push(setTimeout(() => setReminderDaysAfter1Enabled(true), 1500));
    timers.push(setTimeout(() => setReminderDaysAfter1(3), 1700));

    timers.push(setTimeout(() => setReminderDaysAfter2Enabled(true), 2000));
    timers.push(setTimeout(() => setReminderDaysAfter2(7), 2200));

    timers.push(setTimeout(() => setReminderDaysAfter3Enabled(true), 2450));
    timers.push(setTimeout(() => setReminderDaysAfter3(14), 2650));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto w-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Automation Rules</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Before Due Date</h3>
                <p className="text-sm text-gray-500">Send a friendly reminder before the invoice is due.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-12">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderDaysBeforeEnabled}
                readOnly
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Send reminder
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={reminderDaysBefore}
              readOnly
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
              disabled={!reminderDaysBeforeEnabled}
            />
            <span className="text-sm text-gray-600">days before due date</span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">On Due Date</h3>
                <p className="text-sm text-gray-500">Send a reminder on the day payment is due.</p>
              </div>
            </div>
          </div>

          <div className="ml-12">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderOnDueDate}
                readOnly
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Send reminder on the due date
            </label>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">After Due Date (Overdue)</h3>
                <p className="text-sm text-gray-500">Chase payments automatically when they become overdue.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 ml-12">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderDaysAfter1Enabled}
                  readOnly
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                1st Reminder:
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={reminderDaysAfter1}
                readOnly
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
                disabled={!reminderDaysAfter1Enabled}
              />
              <span className="text-sm text-gray-600">days after due date</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderDaysAfter2Enabled}
                  readOnly
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                2nd Reminder:
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={reminderDaysAfter2}
                readOnly
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
                disabled={!reminderDaysAfter2Enabled}
              />
              <span className="text-sm text-gray-600">days after due date</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderDaysAfter3Enabled}
                  readOnly
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                3rd Reminder:
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={reminderDaysAfter3}
                readOnly
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
                disabled={!reminderDaysAfter3Enabled}
              />
              <span className="text-sm text-gray-600">days after due date</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="absolute bottom-8 right-8 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm"
        >
          <CheckCircle size={14} className="w-4 h-4 text-green-400" />
          Automation Activated
        </motion.div>
      </div>
    </motion.div>
  );
}

function StepPaymentSettings() {
  const [method, setMethod] = useState<'paypal' | 'stripe' | 'revolut' | 'bank'>('paypal');
  const [link, setLink] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    timers.push(setTimeout(() => setMethod('paypal'), 400));
    timers.push(setTimeout(() => setLink('https://paypal.me/yourname'), 900));
    timers.push(setTimeout(() => setInstructions('Clients can pay you via this secure payment link.'), 1500));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: 20 }}
      className="max-w-3xl mx-auto w-full flex flex-col items-center justify-center h-full"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Payment Settings</div>
              <div className="text-xs text-gray-500">Configure how clients pay your invoices</div>
            </div>
          </div>
          <div className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold uppercase tracking-wide">
            Step 4 of 7
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  method === 'paypal' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                PayPal
              </button>
              <button
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  method === 'stripe' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Stripe Link
              </button>
              <button
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  method === 'revolut' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Revolut
              </button>
              <button
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  method === 'bank' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Bank Transfer
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 font-mono truncate">
                  {link || 'https://your-payment-link'}
                </div>
              </div>
              <button className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100">
                Copy
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              This link will be included in the invoice email so clients can pay in one click.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Payment Instructions</label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 h-16 flex items-start">
              <span className="line-clamp-3">
                {instructions || 'Add friendly payment instructions that appear under the total on your invoices.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepReminder() {
  return (
    <motion.div 
      className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center h-full relative"
    >
       <div className="text-center mb-8">
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-gray-400 font-mono mb-2 text-base"
          >
             3 Days Before Due Date...
          </motion.div>
          <Calendar className="text-gray-300 mx-auto w-12 h-12" />
       </div>

       {/* Notification Card */}
       <motion.div
         initial={{ x: 100, opacity: 0 }}
         animate={{ x: 0, opacity: 1 }}
         transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
         className="bg-white rounded-lg shadow-xl border-l-4 border-blue-600 p-4 w-full max-w-sm flex items-start gap-4"
       >
          <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
             <Bell className="w-5 h-5" />
          </div>
          <div>
             <h4 className="font-bold text-gray-900 text-base">Automatic Reminder Sent</h4>
             <p className="text-sm text-gray-600">Reminder sent to Acme Corp for Invoice #001</p>
             <p className="text-xs text-gray-400 mt-1">Triggered by Before Due Date rule</p>
          </div>
       </motion.div>
    </motion.div>
  );
}

function StepPaid() {
  const [randomVals, setRandomVals] = useState<number[]>([]);

  useEffect(() => {
    setRandomVals(Array.from({ length: 10 }).map(() => Math.random()));
  }, []);

  return (
    <motion.div 
      className="max-w-2xl mx-auto w-full flex flex-col items-center justify-center h-full"
    >
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
         <div className="mb-4 text-gray-500 text-base">Invoice #INV-001</div>
         <div className="text-4xl font-bold text-gray-900 mb-8">$2,500.00</div>
         
         <div className="flex justify-center items-center gap-4">
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0.3, scale: 0.8 }}
              className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold text-sm"
            >
              Pending
            </motion.div>
            
            <ArrowRightIcon />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.2 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="bg-green-100 text-green-700 px-6 py-2 rounded-full font-bold text-lg flex items-center gap-2 shadow-sm border border-green-200"
            >
               <CheckCircle className="w-5 h-5" /> Paid
            </motion.div>
         </div>

         {/* Confetti */}
         {randomVals.map((val, i) => (
            <motion.div
               key={i}
               className={`absolute w-2 h-2 rounded-full ${['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400'][i % 4]}`}
               initial={{ opacity: 0, x: 0, y: 0 }}
               animate={{ 
                  opacity: [0, 1, 0],
                  x: (i - 4.5) * 22,
                  y: -120 - (i % 5) * 22,
                  rotate: i * 43
               }}
               transition={{ delay: 0.6, duration: 2 }}
               style={{ left: '50%', top: '50%' }}
            />
         ))}
      </div>
    </motion.div>
  );
}

function StepDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full p-4"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
          <div className="flex items-end gap-2">
            <motion.div 
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              <CountUp to={2500} />
            </motion.div>
            <span className="text-xs text-green-500 font-bold mb-1">+100%</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 opacity-50">
          <div className="text-sm text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-bold text-gray-900">$0.00</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 opacity-50">
          <div className="text-sm text-gray-500 mb-1">Clients</div>
          <div className="text-2xl font-bold text-gray-900">1</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Settings</div>
              <div className="text-xs text-gray-400">How clients pay you</div>
            </div>
            <div className="px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
              MVP
            </div>
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">PayPal Link</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Base URL</span>
              <span className="font-mono text-[11px] text-gray-900 truncate max-w-[180px]">
                paypal.me/yourname
              </span>
            </div>
            <div className="mt-2 p-2 rounded-lg bg-blue-50 text-[11px] text-blue-800">
              Invoice links include invoice number automatically for easier tracking.
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upcoming Features</div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Stripe Connect</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-500">Phase 2</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Auto status updates</span>
              <span className="text-[10px] text-gray-400">Roadmap</span>
            </div>
            <div className="mt-2 p-2 rounded-lg bg-gray-50 text-[11px] text-gray-600">
              Designed to be upgraded later without changing your existing invoices.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-40 flex items-end justify-between px-12 pb-4">
        {[30, 45, 35, 50, 40, 60, 80].map((h, i) => (
          <motion.div
            key={i}
            className={`w-8 rounded-t-lg ${i === 6 ? 'bg-blue-600' : 'bg-gray-100'}`}
            initial={{ height: 0 }}
            animate={{ height: `${i === 6 ? 100 : h}%` }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CountUp({ to }: { to: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = to / steps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [to]);
  
  return <>${count.toLocaleString()}</>;
}
