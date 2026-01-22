"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useApi from "@/hooks/useApi";
import { toast } from "react-hot-toast";
import { Bell, Lock, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function RemindersPage() {
  const { data: session } = useSession();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({});

  const plan = session?.user?.plan || "FREE";
  const isFree = plan === "FREE";
  const isStarter = plan === "STARTER";
  const isPro = plan === "PRO";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", settings);
      toast.success("Automation settings saved successfully!");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to save settings.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading automation settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          Reminder Automation
        </h1>
        <p className="text-gray-600 mt-2">
          Configure when to automatically send email reminders to clients for unpaid invoices.
        </p>
      </div>

      {/* Plan Status Banner */}
      <div className={`p-4 rounded-lg border flex items-start gap-3 ${
        isPro ? "bg-purple-50 border-purple-100" :
        isStarter ? "bg-green-50 border-green-100" :
        "bg-gray-50 border-gray-200"
      }`}>
        <div className="mt-1">
          {isPro ? <CheckCircle className="w-5 h-5 text-purple-600" /> :
           isStarter ? <CheckCircle className="w-5 h-5 text-green-600" /> :
           <AlertTriangle className="w-5 h-5 text-gray-500" />}
        </div>
        <div>
          <h3 className={`font-semibold ${
            isPro ? "text-purple-900" :
            isStarter ? "text-green-900" :
            "text-gray-900"
          }`}>
            Current Plan: {plan}
          </h3>
          <p className="text-sm mt-1 text-gray-600">
            {isPro ? "You have full access to advanced automation features." :
             isStarter ? "You have access to basic post-due reminders. Upgrade to Pro for pre-due reminders." :
             "Automation is disabled on the Free plan. Upgrade to automate your cash flow."}
          </p>
        </div>
        {!isPro && (
          <a href="/#pricing" target="_blank" className="ml-auto text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap">
            Upgrade Plan &rarr;
          </a>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        
        {/* 1. Before Due Date (Pro Only) */}
        <div className={`p-6 ${!isPro ? "opacity-60 grayscale-[0.5]" : ""}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Before Due Date</h3>
                <p className="text-sm text-gray-500">Send a friendly reminder before the invoice is due.</p>
              </div>
            </div>
            {!isPro && <Lock className="w-5 h-5 text-gray-400" />}
          </div>
          
          <div className="flex items-center gap-3 ml-12">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={!!settings.reminderDaysBefore}
                onChange={(e) => isPro && handleChange('reminderDaysBefore', e.target.checked ? 3 : null)}
                disabled={!isPro}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              Send reminder
            </label>
            <input 
              type="number" 
              min="1" 
              max="30"
              value={settings.reminderDaysBefore || ''}
              onChange={(e) => isPro && handleChange('reminderDaysBefore', parseInt(e.target.value) || 0)}
              disabled={!isPro || !settings.reminderDaysBefore}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-600">days before due date</span>
          </div>
        </div>

        {/* 2. On Due Date (Pro Only) */}
        <div className={`p-6 ${!isPro ? "opacity-60 grayscale-[0.5]" : ""}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">On Due Date</h3>
                <p className="text-sm text-gray-500">Send a reminder on the day payment is due.</p>
              </div>
            </div>
            {!isPro && <Lock className="w-5 h-5 text-gray-400" />}
          </div>
          
          <div className="ml-12">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={!!settings.reminderOnDueDate}
                onChange={(e) => isPro && handleChange('reminderOnDueDate', e.target.checked)}
                disabled={!isPro}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              Send reminder on the due date
            </label>
          </div>
        </div>

        {/* 3. After Due Date (Starter & Pro) */}
        <div className={`p-6 ${isFree ? "opacity-60 grayscale-[0.5]" : ""}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">After Due Date (Overdue)</h3>
                <p className="text-sm text-gray-500">Chase payments automatically when they become overdue.</p>
              </div>
            </div>
            {isFree && <Lock className="w-5 h-5 text-gray-400" />}
          </div>
          
          <div className="space-y-4 ml-12">
            {/* Reminder 1 (Starter+) */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={!!settings.reminderDaysAfter1}
                  onChange={(e) => !isFree && handleChange('reminderDaysAfter1', e.target.checked ? 3 : null)}
                  disabled={isFree}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                1st Reminder:
              </label>
              <input 
                type="number" 
                min="1" 
                max="90"
                value={settings.reminderDaysAfter1 || ''}
                onChange={(e) => !isFree && handleChange('reminderDaysAfter1', parseInt(e.target.value) || 0)}
                disabled={isFree || !settings.reminderDaysAfter1}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-600">days after due date</span>
            </div>

            {/* Reminder 2 (Pro Only) */}
            <div className={`flex items-center gap-3 ${!isPro ? "opacity-50" : ""}`}>
               <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={!!settings.reminderDaysAfter2}
                  onChange={(e) => isPro && handleChange('reminderDaysAfter2', e.target.checked ? 7 : null)}
                  disabled={!isPro}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                2nd Reminder:
              </label>
              <input 
                type="number" 
                min="1" 
                max="90"
                value={settings.reminderDaysAfter2 || ''}
                onChange={(e) => isPro && handleChange('reminderDaysAfter2', parseInt(e.target.value) || 0)}
                disabled={!isPro || !settings.reminderDaysAfter2}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-600">days after due date</span>
              {!isPro && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">PRO</span>}
            </div>

             {/* Reminder 3 (Pro Only) */}
             <div className={`flex items-center gap-3 ${!isPro ? "opacity-50" : ""}`}>
               <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={!!settings.reminderDaysAfter3}
                  onChange={(e) => isPro && handleChange('reminderDaysAfter3', e.target.checked ? 14 : null)}
                  disabled={!isPro}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                3rd Reminder:
              </label>
              <input 
                type="number" 
                min="1" 
                max="90"
                value={settings.reminderDaysAfter3 || ''}
                onChange={(e) => isPro && handleChange('reminderDaysAfter3', parseInt(e.target.value) || 0)}
                disabled={!isPro || !settings.reminderDaysAfter3}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-600">days after due date</span>
              {!isPro && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">PRO</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || isFree}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Save Automation Rules'}
        </button>
      </div>
    </div>
  );
}
