"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import useApi from "@/hooks/useApi";
import { toast } from "react-hot-toast";
import { Check, Lock, Edit3, Plus, Trash2 } from "lucide-react";
import InvoiceTemplatePreview from "@/components/InvoiceTemplatePreview";

const ALLOWED_TEMPLATES_FREE = ['simple', 'minimalist', 'modern'];

const TEMPLATES = [
  {
    id: "editorial",
    name: "Editorial Serif",
    description: "Classic elegance with serif typography and clean lines.",
    color: "bg-[#faf9f6]",
  },
  {
    id: "geometric",
    name: "Geometric Blue",
    description: "Modern corporate design with dynamic angular shapes.",
    color: "bg-blue-50",
  },
  {
    id: "business",
    name: "Business Corp",
    description: "Structured and professional with clear data hierarchy.",
    color: "bg-emerald-50",
  },
  {
    id: "horizon",
    name: "Horizon Gradient",
    description: "Contemporary look featuring smooth color gradients.",
    color: "bg-cyan-50",
  },
  {
    id: "neon",
    name: "Neon Cyber",
    description: "Bold dark mode design with vibrant neon accents.",
    color: "bg-slate-900",
  },
  {
    id: "minimalist",
    name: "Ultra Minimalist",
    description: "Pure simplicity focusing strictly on the content.",
    color: "bg-white",
  },
  {
    id: "modern",
    name: "Modern Blue",
    description: "Clean professional design with blue accents.",
    color: "bg-blue-50",
  },
  {
    id: "professional",
    name: "Professional Dark",
    description: "High-contrast professional layout for corporate needs.",
    color: "bg-slate-100",
  },
  {
    id: "creative",
    name: "Creative Bold",
    description: "Bold headers and vibrant layout for creative agencies.",
    color: "bg-indigo-50",
  },
  {
    id: "simple",
    name: "Simple Clean",
    description: "A minimalist design focusing on clarity and readability.",
    color: "bg-gray-100",
  },
];

export default function TemplatesPage() {
  const { data: session } = useSession();
  const api = useApi();
  const [currentTemplate, setCurrentTemplate] = useState("simple");
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const isFree = session?.user?.plan?.toUpperCase() === 'FREE' || !session?.user?.plan;
  const isPro = session?.user?.plan?.toUpperCase() === 'PRO';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes] = await Promise.all([
        api.get("/settings"),
        api.get("/custom-templates")
      ]);
      
      setSettings(settingsRes.data);
      if (settingsRes.data?.invoiceTemplate) {
        setCurrentTemplate(settingsRes.data.invoiceTemplate);
      }
      setCustomTemplates(templatesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Could not load templates.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    if (isFree && !ALLOWED_TEMPLATES_FREE.includes(templateId) && !customTemplates.find(t => t.id === templateId)) {
      // Allow selecting custom templates even on free plan (or logic can be adjusted)
      // Assuming custom templates are allowed if created
      const isStandardLocked = !customTemplates.find(t => t.id === templateId) && !ALLOWED_TEMPLATES_FREE.includes(templateId);
      
      if (isStandardLocked) {
         toast.error("This template is not available on the Free plan. Please upgrade to unlock all templates.");
         return;
      }
    }

    setSaving(true);
    setCurrentTemplate(templateId); // Optimistic update
    const isStandard = ALLOWED_TEMPLATES_FREE.includes(templateId) || TEMPLATES.find(t => t.id === templateId);

    // If it's a custom template, we need to save its configuration to settings
    const selectedCustom = customTemplates.find(t => t.id === templateId);
    const updateData: any = { invoiceTemplate: templateId };
    
    if (selectedCustom) {
        updateData.templateConfig = selectedCustom.config;
    } else {
        updateData.templateConfig = null;
    }

    try {
      // We reuse the settings endpoint to update just the invoiceTemplate field
      await api.put("/settings", updateData);
      toast.success("Invoice template updated successfully!");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to update template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTemplateToDelete(id);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      await api.delete(`/custom-templates/${templateToDelete}`);
      setCustomTemplates(prev => prev.filter(t => t.id !== templateToDelete));
      if (currentTemplate === templateToDelete) {
        setCurrentTemplate("simple");
        await api.put("/settings", { invoiceTemplate: "simple" });
      }
      toast.success("Template deleted");
    } catch (error) {
      toast.error("Failed to delete template");
    } finally {
      setTemplateToDelete(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Templates</h1>
          <p className="text-gray-600 mt-2">
            Select a design for your invoices. This template will be used for all future PDF downloads.
          </p>
        </div>
          <div className="flex gap-3">
            {!isPro ? (
              <button
                onClick={() => toast.error("Template Editor is a Pro feature. Please upgrade to access.")}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 border border-gray-200 px-4 py-2 rounded-lg cursor-not-allowed font-medium shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Labels
              </button>
            ) : (
              <Link 
                href="/dashboard/template-editor"
                className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Labels
              </Link>
            )}

            {!isPro ? (
              <button
                onClick={() => toast.error("Create Custom Template is a Pro feature. Please upgrade to access.")}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 border border-gray-200 px-4 py-2 rounded-lg cursor-not-allowed font-medium shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Create Custom Template
              </button>
            ) : (
              <Link 
                href="/dashboard/custom-template"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Custom Template
              </Link>
            )}
          </div>
        </div>

      {/* Custom Templates Section */}
      {customTemplates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">My Custom Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTemplates.map((template) => {
              const isSelected = currentTemplate === template.id;
              
              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`
                    group relative rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer
                    ${isSelected 
                      ? "border-blue-600 ring-4 ring-blue-50" 
                      : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }
                  `}
                >
                  {/* Preview Area */}
                  <div className="aspect-[1/1.4] w-full bg-gray-50 p-6 flex flex-col items-center justify-center">
                     <div className={`w-full h-full shadow-lg transform transition-transform duration-300 group-hover:scale-[1.02]`}>
                        <InvoiceTemplatePreview templateId="custom" customConfig={template.config} />
                     </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4 bg-white border-t border-gray-100 relative">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate pr-2">{template.name}</h3>
                        {isSelected ? (
                            <div className="flex items-center text-blue-600 font-bold shrink-0">
                                <div className="bg-blue-600 text-white rounded-full p-1 mr-2">
                                    <Check className="w-4 h-4" />
                                </div>
                                <span className="text-sm">Selected</span>
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 shrink-0" />
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500">Custom Design</p>
                        <div className="flex gap-2">
                            {isPro ? (
                                <Link 
                                    href={`/dashboard/custom-template?id=${template.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </Link>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.error("Editing custom templates is a Pro feature.");
                                    }}
                                    className="p-1.5 text-gray-400 cursor-not-allowed hover:bg-gray-100 rounded transition-colors"
                                >
                                    <Lock className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                                onClick={(e) => handleDeleteCustomTemplate(e, template.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Standard Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((template) => {
          const isSelected = currentTemplate === template.id;
          const isLocked = isFree && !ALLOWED_TEMPLATES_FREE.includes(template.id);
          
          return (
            <div
              key={template.id}
              onClick={() => !isLocked && handleSelectTemplate(template.id)}
              className={`
                group relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                ${isSelected 
                  ? "border-blue-600 ring-4 ring-blue-50 cursor-default" 
                  : isLocked
                    ? "border-gray-200 opacity-75 cursor-not-allowed bg-gray-50"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
                }
              `}
            >
              {/* Preview Area */}
              <div className={`aspect-[1/1.4] w-full ${template.color} p-6 flex flex-col items-center justify-center`}>
                 <div className={`w-full h-full shadow-lg transform transition-transform duration-300 ${!isLocked && 'group-hover:scale-[1.02]'}`}>
                    <InvoiceTemplatePreview templateId={template.id} />
                 </div>
              </div>

              {/* Template Info */}
              <div className="p-4 bg-white border-t border-gray-100 relative">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{template.name}</h3>
                    {isSelected ? (
                        <div className="flex items-center text-blue-600 font-bold">
                            <div className="bg-blue-600 text-white rounded-full p-1 mr-2">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="text-sm">Selected</span>
                        </div>
                    ) : isLocked ? (
                         <div className="text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">Pro</div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                </div>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>

              {/* Hover Overlay */}
              <div className={`
                absolute inset-0 bg-blue-900/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                ${isSelected ? 'hidden' : ''}
              `}>
                  {isLocked ? (
                      <span className="bg-gray-900 text-white font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Lock className="w-4 h-4" /> Upgrade to unlock
                      </span>
                  ) : (
                      <span className="bg-white text-gray-900 font-medium px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          Use this template
                      </span>
                  )}
              </div>

              {/* Locked Indicator - Always on top */}
              {isLocked && (
                <div className="absolute top-3 right-3 z-50 bg-gray-900/90 text-white p-2 rounded-full shadow-sm backdrop-blur-sm pointer-events-none">
                    <Lock className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-black shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Delete Template?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this custom template? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
