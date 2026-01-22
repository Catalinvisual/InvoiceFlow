"use client";

import useApi from "@/hooks/useApi";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Filter, Plus, Upload, X, Trash2, Edit, AlertTriangle, Send } from "lucide-react";

type Client = {
  id: string;
  name: string;
  contactPerson?: string | null;
  cui?: string | null;
  regCom?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  zipCode?: string | null;
  email?: string | null;
  phone?: string | null;
  portalUserId?: string | null;
  createdAt?: string | null;
};

export default function ClientsPage() {
  const api = useApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [portalFilter, setPortalFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"newest" | "name_asc" | "name_desc">("newest");
  
  // Edit & Delete State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [form, setForm] = useState({ 
    name: "", 
    contactPerson: "",
    cui: "", 
    regCom: "", 
    address: "", 
    city: "",
    county: "",
    country: "",
    zipCode: "",
    email: "", 
    phone: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (error) {
      console.error("Failed to load clients", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    api
      .get("/clients")
      .then((res) => {
        if (mounted) setClients(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [api]);

  const resetForm = () => {
    setForm({ name: "", contactPerson: "", cui: "", regCom: "", address: "", city: "", county: "", country: "", zipCode: "", email: "", phone: "" });
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenAnnouncement = () => {
    setAnnouncementSubject("");
    setAnnouncementMessage("");
    setIsAnnouncementModalOpen(true);
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementSubject || !announcementMessage) return;
    
    setIsSendingAnnouncement(true);
    try {
        await api.post("/dashboard/announcement", {
            subject: announcementSubject,
            message: announcementMessage
        });
        toast.success("Announcement sent successfully to all clients!");
        setIsAnnouncementModalOpen(false);
    } catch (error) {
        console.error(error);
        toast.error("Failed to send announcement");
    } finally {
        setIsSendingAnnouncement(false);
    }
  };

  const handleOpenEdit = (client: Client) => {
    setForm({
      name: client.name || "",
      contactPerson: client.contactPerson || "",
      cui: client.cui || "",
      regCom: client.regCom || "",
      address: client.address || "",
      city: client.city || "",
      county: client.county || "",
      country: client.country || "",
      zipCode: client.zipCode || "",
      email: client.email || "",
      phone: client.phone || "",
    });
    setEditingId(client.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Client name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        contactPerson: form.contactPerson || undefined,
        cui: form.cui || undefined,
        regCom: form.regCom || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        county: form.county || undefined,
        country: form.country || undefined,
        zipCode: form.zipCode || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
      };

      if (editingId) {
        await api.put(`/clients/${editingId}`, payload);
        toast.success("Client updated successfully!");
      } else {
        await api.post("/clients", payload);
        toast.success("Client added successfully!");
      }

      resetForm();
      setIsModalOpen(false);
      await load();
    } catch (e: unknown) {
      console.error(e);
      toast.error(editingId ? "Error updating client" : "Error adding client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteToPortal = async (client: Client) => {
    if (!client.email) {
      toast.error("Client must have an email to be invited.");
      return;
    }
    
    setInvitingId(client.id);
    try {
      const res = await api.post("/clients/invite", { clientId: client.id });
      toast.success(`Invitation sent! Temporary password: ${res.data.tempPassword}`, { duration: 6000 });
      await load();
    } catch (error: unknown) {
      const maybe = error as { response?: { data?: { message?: unknown } } };
      const message = maybe?.response?.data?.message;
      toast.error(typeof message === "string" && message.length > 0 ? message : "Error inviting client");
    } finally {
      setInvitingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      await api.delete(`/clients/${clientToDelete}`);
      toast.success("Client deleted successfully");
      setClientToDelete(null);
      await load();
    } catch (error) {
      console.error("Failed to delete client", error);
      toast.error("Error deleting client");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const loadingToast = toast.loading("Uploading and processing file...");

    try {
      // Use the server-side upload endpoint which has smarter logic and debug capabilities
      const res = await api.post("/upload/clients", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.dismiss(loadingToast);
      
      const { message, details } = res.data;
      toast.success(message || "Import completed successfully");
      
      if (details && details.imported > 0) {
        await load();
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.dismiss(loadingToast);
      const msg = error.response?.data?.message || "Error importing file";
      toast.error(msg);
    } finally {
      // Clear input
      e.target.value = "";
    }
  };

  if (loading) return <div className="p-8">Loading clients...</div>;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredClients = clients
    .filter((c) => {
      if (portalFilter === "active" && !c.portalUserId) return false;
      if (portalFilter === "inactive" && c.portalUserId) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        c.name,
        c.contactPerson,
        c.cui,
        c.regCom,
        c.address,
        c.city,
        c.county,
        c.country,
        c.email,
        c.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "newest") {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-black">Clients</h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={handleOpenAnnouncement}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium whitespace-nowrap"
          >
            <Send className="w-4 h-4 mr-2" />
            Announcement
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={handleImportClick}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium whitespace-nowrap"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-black">Send Announcement to All Clients</h2>
                    <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-gray-400 hover:text-black">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                            type="text"
                            required
                            value={announcementSubject}
                            onChange={(e) => setAnnouncementSubject(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                            placeholder="Announcement Subject"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message (HTML supported)</label>
                        <textarea
                            required
                            value={announcementMessage}
                            onChange={(e) => setAnnouncementMessage(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg h-64 focus:ring-2 focus:ring-black outline-none font-mono text-sm"
                            placeholder="<p>Important update...</p>"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsAnnouncementModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSendingAnnouncement}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSendingAnnouncement ? 'Sending...' : 'Send to All Clients'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Search by name, email, phone, CUI, address..."
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
            <select
              value={portalFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all" || value === "active" || value === "inactive") setPortalFilter(value);
              }}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-black shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All clients</option>
              <option value="active">Portal active</option>
              <option value="inactive">Portal not invited</option>
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "newest" || value === "name_asc" || value === "name_desc") setSortBy(value);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="newest">Newest</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Modal for Add/Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-black flex-1 text-center md:text-left">{editingId ? 'Edit Client' : 'Add New Client'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-black hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Company Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                    placeholder="Ex: Company Ltd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Contact Person</label>
                  <input
                    value={form.contactPerson}
                    onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                    placeholder="Ex: John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">CUI / CIF</label>
                  <input
                    value={form.cui}
                    onChange={(e) => setForm((f) => ({ ...f, cui: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                    placeholder="RO123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Reg. Com.</label>
                  <input
                    value={form.regCom}
                    onChange={(e) => setForm((f) => ({ ...f, regCom: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                    placeholder="J40/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                    placeholder="contact@client.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Street and Number</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                      placeholder="123 Main St, Apt 4B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Zip Code</label>
                    <input
                      value={form.zipCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 16).toUpperCase();
                        setForm((f) => ({ ...f, zipCode: val }));
                      }}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                      placeholder="1234AB"
                    />
                    <p className="text-xs text-black mt-1 text-center md:text-left">Format: Alphanumeric (max 16)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">City</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">County / State</label>
                    <input
                      value={form.county}
                      onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                      placeholder="County"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1 text-center md:text-left">Country</label>
                    <input
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center md:justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Client' : 'Add Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Delete Client</h3>
            <p className="text-sm text-black mb-6">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 font-medium transition-colors w-full"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium w-full shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredClients.length === 0 ? (
          <div className="text-center p-8 text-black bg-white rounded-xl border border-gray-100">
            No clients found.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-black">{client.name}</h3>
                  <p className="text-sm text-black">{(client.cui || '-').toUpperCase()}</p>
                </div>
                {client.portalUserId ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => inviteToPortal(client)}
                    disabled={invitingId === client.id || !client.email}
                    className="text-blue-600 hover:text-blue-900 text-xs font-medium disabled:opacity-50 border border-blue-200 px-2 py-1 rounded bg-blue-50"
                  >
                    {invitingId === client.id ? 'Sending...' : 'Invite'}
                  </button>
                )}
              </div>
              
              <div className="text-sm text-black space-y-1">
                 <p className="flex items-center gap-2">
                   <span className="text-black">📍</span>
                   <span className="truncate">{[client.address, client.city, client.county].filter(Boolean).join(", ") || '-'}</span>
                 </p>
                 {client.contactPerson && (
                    <p className="flex items-center gap-2">
                      <span className="text-black">👤</span>
                      <span>{client.contactPerson}</span>
                    </p>
                 )}
                 {client.email && (
                    <p className="flex items-center gap-2">
                      <span className="text-black">✉️</span>
                      <span className="truncate">{client.email}</span>
                    </p>
                 )}
                 {client.phone && (
                    <p className="flex items-center gap-2">
                      <span className="text-black">📞</span>
                      <span>{client.phone}</span>
                    </p>
                 )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="flex items-center px-3 py-1.5 text-sm text-black bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    <Edit className="w-3 h-3 mr-1.5" /> Edit
                  </button>
                  <button
                    onClick={() => setClientToDelete(client.id)}
                    className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                  </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-black">
            <tr>
              <th className="p-4">Company</th>
              <th className="p-4">Tax ID</th>
              <th className="p-4">Address</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Portal</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-black">
                  No clients found.
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-black">{client.name}</div>
                  </td>
                  <td className="p-4 text-black">{(client.cui || '-').toUpperCase()}</td>
                  <td className="p-4 text-black max-w-xs truncate">{[client.address, client.city, client.county, client.country].filter(Boolean).join(", ") || '-'}</td>
                  <td className="p-4 text-black">
                    <div className="flex flex-col text-sm">
                      {client.contactPerson && (
                        <span className="font-medium text-black mb-0.5">{client.contactPerson}</span>
                      )}
                      <span>{client.email}</span>
                      <span className="text-black">{client.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {client.portalUserId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => inviteToPortal(client)}
                        disabled={invitingId === client.id || !client.email}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {invitingId === client.id ? 'Sending...' : 'Invite'}
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="text-black hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                        title="Edit client"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        title="Delete client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
