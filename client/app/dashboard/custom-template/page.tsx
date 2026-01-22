'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import InvoiceTemplatePreview, { TemplateConfig } from '@/components/InvoiceTemplatePreview';
import { ArrowLeft, Save, Layout, Type, Palette, MoveUp, MoveDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion, Reorder } from 'framer-motion';

// Default custom configuration
const DEFAULT_CUSTOM_CONFIG: TemplateConfig = {
    custom: {
        sections: [
            { id: 'header', label: 'Header (Logo & Title)', isVisible: true },
            { id: 'provider', label: 'Provider Details', isVisible: true },
            { id: 'client', label: 'Client Details', isVisible: true },
            { id: 'items', label: 'Items Table', isVisible: true },
            { id: 'totals', label: 'Totals', isVisible: true },
            { id: 'footer', label: 'Footer', isVisible: true },
        ],
        styles: {
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            primaryColor: '#2563eb',
            borderColor: '#e5e7eb',
            fontFamily: 'sans-serif',
        }
    },
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
        amount: 'Amount',
        subtotal: 'Subtotal',
        tax: 'Tax'
    },
    columns: {
        quantity: true,
        price: true,
    }
};

export default function CustomTemplateBuilder() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('My Custom Template');
  const [activeTab, setActiveTab] = useState<'sections' | 'styles' | 'labels'>('sections');
  
  const [settings, setSettings] = useState<any>(null);
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CUSTOM_CONFIG);

  useEffect(() => {
    if (session && session.user?.plan?.toUpperCase() !== 'PRO') {
        toast.error("Custom Template Builder is a Pro feature.");
        router.push('/dashboard/templates');
        return;
    }
    fetchData();
  }, [session, templateId]);

  const fetchData = async () => {
    try {
      const settingsRes = await api.get('/settings');
      setSettings(settingsRes.data);

      if (templateId) {
          const templateRes = await api.get(`/custom-templates/${templateId}`);
          setTemplateName(templateRes.data.name);
          if (templateRes.data.config) {
              setConfig(templateRes.data.config);
          }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (templateId) {
          toast.error("Could not load template");
          router.push('/dashboard/templates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
        toast.error('Please enter a template name');
        return;
    }

    setSaving(true);
    try {
        if (templateId) {
            await api.put(`/custom-templates/${templateId}`, {
                name: templateName,
                config: config
            });
            toast.success('Template updated successfully!');
        } else {
            await api.post('/custom-templates', {
                name: templateName,
                config: config
            });
            toast.success('Custom template created successfully!');
        }
        router.push('/dashboard/templates');
    } catch (error) {
        console.error('Error saving template:', error);
        toast.error('Failed to save template.');
    } finally {
        setSaving(false);
    }
  };

  // Section Management
  const handleReorder = (newOrder: any[]) => {
      setConfig(prev => ({
          ...prev,
          custom: {
              ...prev.custom!,
              sections: newOrder
          }
      }));
  };

  const toggleSectionVisibility = (id: string) => {
      setConfig(prev => ({
          ...prev,
          custom: {
              ...prev.custom!,
              sections: prev.custom!.sections.map(s => 
                  s.id === id ? { ...s, isVisible: !s.isVisible } : s
              )
          }
      }));
  };

  // Style Management
  const handleStyleChange = (key: string, value: string) => {
      setConfig(prev => ({
          ...prev,
          custom: {
              ...prev.custom!,
              styles: {
                  ...prev.custom!.styles,
                  [key]: value
              }
          }
      }));
  };

  // Label Management
  const handleLabelChange = (key: string, value: string) => {
      setConfig(prev => ({
          ...prev,
          labels: { ...prev.labels, [key]: value }
      }));
  };

  if (loading) return <div className="p-8 text-center">Loading builder...</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/dashboard/templates" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-xl font-bold text-gray-900">Custom Template Builder</h1>
                <p className="text-sm text-gray-500">Design your perfect invoice layout</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <input 
                type="text" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template Name"
                className="border rounded px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Template'}
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-white border-r overflow-y-auto flex flex-col">
            <div className="flex border-b">
                <button 
                    onClick={() => setActiveTab('sections')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Sections
                </button>
                <button 
                    onClick={() => setActiveTab('styles')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'styles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Styles
                </button>
                <button 
                    onClick={() => setActiveTab('labels')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'labels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Labels
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'sections' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 mb-4">Drag to reorder sections. Toggle eye icon to show/hide.</p>
                        <Reorder.Group axis="y" values={config.custom!.sections} onReorder={handleReorder}>
                            {config.custom!.sections.map((section) => (
                                <Reorder.Item key={section.id} value={section}>
                                    <div className="flex items-center justify-between p-3 bg-white border rounded-lg mb-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Layout size={16} className="text-gray-400" />
                                            <span className="font-medium text-gray-700 text-sm">{section.label}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent drag start
                                                toggleSectionVisibility(section.id);
                                            }}
                                            className={`p-1.5 rounded-full transition-colors ${section.isVisible ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100'}`}
                                        >
                                            {section.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                )}

                {activeTab === 'styles' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Colors</label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Background Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={config.custom!.styles.backgroundColor}
                                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={config.custom!.styles.backgroundColor}
                                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-sm uppercase"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Primary Color (Accents)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={config.custom!.styles.primaryColor}
                                            onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={config.custom!.styles.primaryColor}
                                            onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-sm uppercase"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Text Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={config.custom!.styles.textColor}
                                            onChange={(e) => handleStyleChange('textColor', e.target.value)}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={config.custom!.styles.textColor}
                                            onChange={(e) => handleStyleChange('textColor', e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-sm uppercase"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Border Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={config.custom!.styles.borderColor}
                                            onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                            className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={config.custom!.styles.borderColor}
                                            onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                            className="flex-1 border rounded px-2 py-1 text-sm uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Typography</label>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Font Family</label>
                                <select 
                                    value={config.custom!.styles.fontFamily}
                                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="sans-serif">Sans Serif (Modern)</option>
                                    <option value="serif">Serif (Classic)</option>
                                    <option value="mono">Monospace (Technical)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'labels' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {Object.entries(config.labels || {}).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={value as string}
                                        onChange={(e) => handleLabelChange(key, e.target.value)}
                                        className="w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex items-start justify-center">
            <div className="w-full max-w-[210mm] shadow-2xl bg-white min-h-[297mm] transform scale-[0.8] origin-top transition-all duration-300">
                <InvoiceTemplatePreview 
                    templateId="custom" 
                    settings={settings} 
                    customConfig={config}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
