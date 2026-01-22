"use client";

import useApi from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Trash2, Plus } from "lucide-react";

type Client = { id: string; name: string };
type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
};

export default function NewInvoicePage() {
  const api = useApi();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>("");
  
  // Initialize dates
  const today = new Date();
  const issueDateDefault = today.toISOString().slice(0, 10);
  
  const due = new Date(today);
  due.setDate(due.getDate() + 14);
  const dueDateDefault = due.toISOString().slice(0, 10);

  const [form, setForm] = useState({
    clientId: "",
    issueDate: issueDateDefault,
    dueDate: dueDateDefault,
    paymentTerms: "Net 14",
    notes: "",
  });
  
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({ description: "", quantity: 1, price: "" });
  const [vatRate, setVatRate] = useState<string>("19");
  
  const [error, setError] = useState("");

  // Update Due Date when Payment Terms or Issue Date changes
  useEffect(() => {
    if (form.paymentTerms === 'Custom') return;

    const days = form.paymentTerms === 'Net 7' ? 7 :
                 form.paymentTerms === 'Net 14' ? 14 :
                 form.paymentTerms === 'Net 30' ? 30 : 0;

    if (days > 0) {
        const issue = new Date(form.issueDate);
        if (!isNaN(issue.getTime())) {
            const newDue = new Date(issue);
            newDue.setDate(issue.getDate() + days);
            setForm(f => ({ ...f, dueDate: newDue.toISOString().slice(0, 10) }));
        }
    }
  }, [form.paymentTerms, form.issueDate]);

  useEffect(() => {
    let mounted = true;
    Promise.all([api.get("/clients"), api.get("/invoices/next-number")])
      .then(([clientsRes, nextRes]) => {
        if (!mounted) return;
        setClients(clientsRes.data);
        const value = (nextRes.data as { nextInvoiceNumber?: unknown } | undefined)?.nextInvoiceNumber;
        if (typeof value === "string") setNextInvoiceNumber(value);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [api]);

  const addItem = () => {
    if (!newItem.description || !newItem.price) return;
    const price = parseFloat(newItem.price);
    if (isNaN(price)) return;

    setItems([
      ...items,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: newItem.description,
        quantity: newItem.quantity,
        price,
      },
    ]);
    setNewItem({ description: "", quantity: 1, price: "" });
  };
  
  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const vatRateVal = parseFloat(vatRate) || 0;
  const vatAmount = subtotal * (vatRateVal / 100);
  const total = subtotal + vatAmount;

  const submit = async () => {
    setError("");
    if (!form.clientId) {
        setError("Please select a client");
        return;
    }
    if (items.length === 0) {
        setError("Please add at least one service/item");
        return;
    }

    try {
      const res = await api.post("/invoices", {
        clientId: form.clientId,
        items, // Backend handles array
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        paymentTerms: form.paymentTerms,
        notes: form.notes,
        vatRate: vatRateVal, // Send VAT rate
        // Backend calculates totals based on items and vatRate
      });
      router.push(`/dashboard/invoices/${res.data.id}`);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const message = (e.response?.data as { message?: unknown } | undefined)?.message;
        if (typeof message === "string" && message.length > 0) {
          setError(message);
          return;
        }
      }
      setError("Failed to create invoice");
    }
  };

  if (loading) return <div className="text-gray-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Add Invoice</h2>
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 rounded border bg-white p-4 md:grid-cols-2">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700">Client</div>
          <select
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700">Invoice number</div>
          <input
            value={nextInvoiceNumber}
            readOnly
            className="w-full cursor-not-allowed rounded border bg-gray-50 px-3 py-2 text-sm text-gray-700"
            placeholder="INV-0001"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700">Issue date</div>
          <input
            value={form.issueDate}
            onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
            className="w-full rounded border px-3 py-2 text-sm"
            type="date"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700">Payment Terms</div>
          <select
            value={form.paymentTerms}
            onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="Custom">Custom</option>
            <option value="Net 7">Net 7 Days</option>
            <option value="Net 14">Net 14 Days</option>
            <option value="Net 30">Net 30 Days</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-700">Due date</div>
          <input
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value, paymentTerms: 'Custom' }))}
            className="w-full rounded border px-3 py-2 text-sm"
            type="date"
          />
        </div>
      </div>
      
      {/* Services Section */}
      <div className="rounded border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Services / Items</h3>
        
        {/* Add Item Form */}
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-500">Service Name</label>
                <input 
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="e.g. Web Development"
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>
             <div className="w-24 space-y-1">
                <label className="text-xs font-medium text-gray-500">Qty</label>
                <input 
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>
            <div className="w-32 space-y-1">
                <label className="text-xs font-medium text-gray-500">Price (€)</label>
                <input 
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full rounded border px-3 py-2 text-sm"
                />
            </div>
            <button 
                onClick={addItem}
                className="flex h-[38px] w-[38px] items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700"
            >
                <Plus size={20} />
            </button>
        </div>

        {/* Items List */}
        {items.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-3 py-2">Description</th>
                            <th className="px-3 py-2 w-20">Qty</th>
                            <th className="px-3 py-2 w-28">Price</th>
                            <th className="px-3 py-2 w-28">Total</th>
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-900">
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-3 py-2">{item.description}</td>
                                <td className="px-3 py-2">{item.quantity}</td>
                                <td className="px-3 py-2">€{item.price.toFixed(2)}</td>
                                <td className="px-3 py-2">€{(item.quantity * item.price).toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">
                                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="py-4 text-center text-sm text-gray-500">No services added yet.</div>
        )}
        
        {/* Totals */}
        <div className="mt-6 flex justify-end border-t pt-4">
            <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal (excl. VAT)</span>
                    <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <span>VAT Rate (%)</span>
                        <input 
                            value={vatRate}
                            onChange={(e) => setVatRate(e.target.value)}
                            className="w-12 rounded border px-1 py-0.5 text-right text-xs"
                        />
                    </div>
                    <span>€{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                    <span>Total (incl. VAT)</span>
                    <span>€{total.toFixed(2)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Notes / Terms */}
      <div className="rounded border bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Notes / Terms</h3>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full rounded border px-3 py-2 text-sm min-h-[80px]"
          placeholder="E.g. Thank you for your business, payment due in 14 days."
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={submit}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Create Invoice
        </button>
        <button
          onClick={() => router.back()}
          className="rounded bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
