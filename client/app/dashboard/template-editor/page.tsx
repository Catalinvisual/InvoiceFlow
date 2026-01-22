'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import InvoiceTemplatePreview from '@/components/InvoiceTemplatePreview';
import { ArrowLeft, Save, Layout, Type, List, FileText, Eye, EyeOff, Palette } from 'lucide-react';
import Link from 'next/link';

export default function TemplateEditorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<any>(null);
  const [templateId, setTemplateId] = useState('simple');
  const [config, setConfig] = useState({
    labels: {
        invoiceTitle: 'INVOICE',
        from: 'From',
        to: 'Bill To',
        date: 'Date',
        due: 'Due Date',
        total: 'Total',
        item: 'Description',
        quantity: 'Qty',
        price: 'Unit Price',
        amount: 'Amount'
    },
    columns: {
        quantity: true,
        price: true,
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'labels' | 'columns'>('general');

  useEffect(() => {
    if (session && session.user?.plan?.toUpperCase() !== 'PRO') {
        toast.error("Template Editor is a Pro feature.");
        router.push('/dashboard/templates');
        return;
    }
    fetchSettings();
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
      if (response.data.invoiceTemplate) {
        setTemplateId(response.data.invoiceTemplate);
      }
      if (response.data.templateConfig) {
          // Merge with default to ensure all keys exist
          setConfig(prev => ({
              ...prev,
              ...response.data.templateConfig,
              labels: { ...prev.labels, ...response.data.templateConfig.labels },
              columns: { ...prev.columns, ...response.data.templateConfig.columns }
          }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        await api.put('/settings', {
            invoiceTemplate: templateId,
            templateConfig: config
        });
        toast.success('Template configuration saved!');
    } catch (error) {
        console.error('Error saving template:', error);
        toast.error('Failed to save configuration.');
    } finally {
        setSaving(false);
    }
  };

  const handleLabelChange = (key: string, value: string) => {
      setConfig(prev => ({
          ...prev,
          labels: { ...prev.labels, [key]: value }
      }));
  };

  const toggleColumn = (key: 'quantity' | 'price') => {
      setConfig(prev => ({
          ...prev,
          columns: { ...prev.columns, [key]: !prev.columns[key] }
      }));
  };

  if (loading) return <div className="p-8 text-center">Loading editor...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/templates" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-xl font-bold text-gray-900">Invoice Designer</h1>
                <p className="text-sm text-gray-500">Customize your invoice structure and labels</p>
            </div>
        </div>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-white border-r overflow-y-auto flex flex-col">
            <div className="p-4 border-b bg-indigo-50">
                <Link href="/dashboard/custom-template" className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-indigo-600 text-white text-center rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    <Palette size={18} />
                    Create Custom Template
                </Link>
                <p className="text-xs text-center text-indigo-600 mt-2">Design your invoice from scratch</p>
            </div>
            <div className="flex border-b">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('labels')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'labels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Labels
                </button>
                <button 
                    onClick={() => setActiveTab('columns')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'columns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Columns
                </button>
            </div>

            <div className="p-6 space-y-6">
                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Active Template</label>
                            <select 
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="simple">Simple Clean</option>
                                <option value="modern">Modern Blue</option>
                                <option value="minimalist">Ultra Minimalist</option>
                                <option value="editorial">Editorial Serif</option>
                                <option value="business">Business Corp</option>
                                <option value="geometric">Geometric Blue</option>
                                <option value="horizon">Horizon Gradient</option>
                                <option value="professional">Professional Dark</option>
                                <option value="neon">Neon Cyber</option>
                            </select>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                            <p>Pro Tip: Choose a template that matches your brand identity. You can customize the labels and columns regardless of the template.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'labels' && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Header Labels</h3>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Document Title</label>
                            <input 
                                type="text" 
                                value={config.labels.invoiceTitle}
                                onChange={(e) => handleLabelChange('invoiceTitle', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">From Label</label>
                                <input 
                                    type="text" 
                                    value={config.labels.from}
                                    onChange={(e) => handleLabelChange('from', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">To Label</label>
                                <input 
                                    type="text" 
                                    value={config.labels.to}
                                    onChange={(e) => handleLabelChange('to', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">Date Labels</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Issue Date</label>
                                <input 
                                    type="text" 
                                    value={config.labels.date}
                                    onChange={(e) => handleLabelChange('date', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                                <input 
                                    type="text" 
                                    value={config.labels.due}
                                    onChange={(e) => handleLabelChange('due', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">Table Labels</h3>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Item / Description</label>
                            <input 
                                type="text" 
                                value={config.labels.item}
                                onChange={(e) => handleLabelChange('item', e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                <input 
                                    type="text" 
                                    value={config.labels.quantity}
                                    onChange={(e) => handleLabelChange('quantity', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                                <input 
                                    type="text" 
                                    value={config.labels.price}
                                    onChange={(e) => handleLabelChange('price', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'columns' && (
                    <div className="space-y-4">
                         <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 mb-4">
                            Toggle columns visibility. Useful for flat-rate services where quantity or unit price might be irrelevant.
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                    <List size={16} />
                                </div>
                                <span className="font-medium text-gray-700">Quantity Column</span>
                            </div>
                            <button 
                                onClick={() => toggleColumn('quantity')}
                                className={`p-2 rounded-full transition-colors ${config.columns.quantity ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100'}`}
                            >
                                {config.columns.quantity ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded">
                                    <List size={16} />
                                </div>
                                <span className="font-medium text-gray-700">Unit Price Column</span>
                            </div>
                            <button 
                                onClick={() => toggleColumn('price')}
                                className={`p-2 rounded-full transition-colors ${config.columns.price ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100'}`}
                            >
                                {config.columns.price ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex items-start justify-center">
            <div className="w-full max-w-[210mm] shadow-2xl bg-white min-h-[297mm] transform scale-[0.8] origin-top">
                <InvoiceTemplatePreview 
                    templateId={templateId} 
                    settings={settings} 
                    customConfig={config}
                />
            </div>
        </div>
      </div>
    </div>
  );
}