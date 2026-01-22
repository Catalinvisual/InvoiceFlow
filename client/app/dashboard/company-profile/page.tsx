'use client';

import { useState, useEffect, useRef } from 'react';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import { Upload, Image as ImageIcon, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function CompanyProfilePage() {
  const { data: session } = useSession();
  const isPro = session?.user?.plan?.toUpperCase() === 'PRO';
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    cui: '',
    regCom: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    iban: '',
    bank: '',
    swift: '',
    email: '',
    phone: '',
    website: '',
    currency: 'EUR',
    logoUrl: '',
    brandColor: '#2563eb',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data && Object.keys(response.data).length > 0) {
        setFormData((prev) => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Could not load company profile.');
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('logo', file);

    const toastId = toast.loading('Uploading logo...');
    try {
      const res = await api.post('/upload/logo', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newLogoUrl = res.data.url;
      setFormData((prev) => ({ ...prev, logoUrl: newLogoUrl }));

      try {
        await api.put('/settings', { logoUrl: newLogoUrl });
        toast.success('Logo uploaded and saved successfully!', { id: toastId });
      } catch (saveError) {
        console.error('Error saving logo to settings:', saveError);
        toast.success('Logo uploaded, but could not save settings automatically. Please save profile.', { id: toastId });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload logo.';
      
      // Handle specific server validation errors
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage, { id: toastId });
      
      // Reset file input to allow retry
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Zip Code: allow alphanumeric, max 16 chars (including spaces/dashes)
    if (name === 'zipCode') {
        const val = value.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 16).toUpperCase();
        setFormData((prev) => ({ ...prev, [name]: val }));
        return;
    }

    // Auto-uppercase for specific fields
    if (['iban', 'bank', 'swift', 'cui'].includes(name)) {
         setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
         return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', formData);
      toast.success('Company profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading company profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Company Profile</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Identification Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Company Identification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Soft IT Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <input
                  type="text"
                  name="cui"
                  value={formData.cui || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: US12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Reg.</label>
                <input
                  type="text"
                  name="regCom"
                  value={formData.regCom || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 12345/2024"
                />
              </div>
              
              {/* Brand Color Picker (Pro Only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color {isPro && <span className="text-xs text-blue-600 font-normal">(Pro)</span>}</label>
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        name="brandColor"
                        value={formData.brandColor || '#2563eb'}
                        onChange={handleChange}
                        disabled={!isPro}
                        className={`h-10 w-20 p-1 rounded border ${!isPro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    {!isPro && <span className="text-xs text-gray-500">Upgrade to Pro to customize brand color</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Company Logo</label>
                <div className="flex items-start gap-6 relative">
                    {/* Lock Overlay for Non-Pro */}
                    {!isPro && (
                        <div className="absolute inset-0 z-10 bg-gray-50/50 backdrop-blur-[1px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl">
                            <div className="text-center p-4 bg-white rounded-lg shadow-lg border border-gray-100">
                                <div className="bg-gray-900 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">Pro Feature</h3>
                                <p className="text-xs text-gray-500 mt-1 mb-3">Upgrade to upload your logo</p>
                                <a href="/#pricing" target="_blank" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors">
                                    Upgrade Now
                                </a>
                            </div>
                        </div>
                    )}

                    {formData.logoUrl ? (
                        <div className={`relative group ${!isPro ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="w-32 h-32 relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={formData.logoUrl} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => {
                                        console.error('Image failed to load:', formData.logoUrl);
                                        e.currentTarget.src = '/placeholder-logo.svg';
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => isPro && fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium rounded-xl backdrop-blur-sm"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => isPro && fileInputRef.current?.click()}
                            disabled={!isPro}
                            className={`w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all bg-gray-50 hover:bg-blue-50/50 group ${!isPro ? 'opacity-40' : ''}`}
                        >
                            <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                                <Upload className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="text-sm font-semibold text-blue-600">Upload Logo</span>
                        </button>
                    )}
                    
                    <div className={`flex-1 py-2 ${!isPro ? 'opacity-40 blur-[1px]' : ''}`}>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Upload your logo</h3>
                        <p className="text-sm text-gray-500 mb-3">
                            This logo will appear on your invoices and documents.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">JPG</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">PNG</span>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        disabled={!isPro}
                    />
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Headquarters Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street and Number</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Example Street, No. 1, Bl. A, Ap. 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: New York"
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                 <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode || ''}
                    onChange={handleChange}
                    maxLength={16}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234AB"
                 />
                 <p className="text-xs text-gray-500 mt-1">Format: Alphanumeric</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-500"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Financial Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Financial Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Main IBAN / Account No. *</label>
                <input
                  type="text"
                  name="iban"
                  value={formData.iban || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="US00 BANK 0000 0000 0000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Bank of America"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT Code (Optional)</label>
                <input
                  type="text"
                  name="swift"
                  value={formData.swift || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: BOFAUS3N"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                <select
                  name="currency"
                  value={formData.currency || 'EUR'}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="KRW">KRW - South Korean Won</option>
                  <option value="BRL">BRL - Brazilian Real</option>
                  <option value="MXN">MXN - Mexican Peso</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="HKD">HKD - Hong Kong Dollar</option>
                  <option value="SEK">SEK - Swedish Krona</option>
                  <option value="NOK">NOK - Norwegian Krone</option>
                  <option value="DKK">DKK - Danish Krone</option>
                  <option value="PLN">PLN - Polish Złoty</option>
                  <option value="CZK">CZK - Czech Koruna</option>
                  <option value="HUF">HUF - Hungarian Forint</option>
                  <option value="RON">RON - Romanian Leu</option>
                  <option value="BGN">BGN - Bulgarian Lev</option>
                  <option value="HRK">HRK - Croatian Kuna</option>
                  <option value="RUB">RUB - Russian Ruble</option>
                  <option value="TRY">TRY - Turkish Lira</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                  <option value="THB">THB - Thai Baht</option>
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="NZD">NZD - New Zealand Dollar</option>
                  <option value="ARS">ARS - Argentine Peso</option>
                  <option value="CLP">CLP - Chilean Peso</option>
                  <option value="COP">COP - Colombian Peso</option>
                  <option value="PEN">PEN - Peruvian Sol</option>
                  <option value="UYU">UYU - Uruguayan Peso</option>
                  <option value="VEF">VEF - Venezuelan Bolívar</option>
                  <option value="EGP">EGP - Egyptian Pound</option>
                  <option value="ILS">ILS - Israeli New Shekel</option>
                  <option value="KWD">KWD - Kuwaiti Dinar</option>
                  <option value="QAR">QAR - Qatari Riyal</option>
                  <option value="OMR">OMR - Omani Rial</option>
                  <option value="BHD">BHD - Bahraini Dinar</option>
                  <option value="JOD">JOD - Jordanian Dinar</option>
                  <option value="LBP">LBP - Lebanese Pound</option>
                  <option value="IQD">IQD - Iraqi Dinar</option>
                  <option value="TND">TND - Tunisian Dinar</option>
                  <option value="MAD">MAD - Moroccan Dirham</option>
                  <option value="DZD">DZD - Algerian Dinar</option>
                  <option value="NPR">NPR - Nepalese Rupee</option>
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="BDT">BDT - Bangladeshi Taka</option>
                  <option value="MMK">MMK - Myanmar Kyat</option>
                  <option value="KHR">KHR - Cambodian Riel</option>
                  <option value="LAK">LAK - Lao Kip</option>
                  <option value="VND">VND - Vietnamese Đồng</option>
                  <option value="ISK">ISK - Icelandic Króna</option>
                  <option value="GEL">GEL - Georgian Lari</option>
                  <option value="AMD">AMD - Armenian Dram</option>
                  <option value="AZN">AZN - Azerbaijani Manat</option>
                  <option value="KZT">KZT - Kazakhstani Tenge</option>
                  <option value="UZS">UZS - Uzbekistani Som</option>
                  <option value="TJS">TJS - Tajikistani Somoni</option>
                  <option value="TMT">TMT - Turkmenistani Manat</option>
                  <option value="AFN">AFN - Afghan Afghani</option>
                  <option value="MNT">MNT - Mongolian Tögrög</option>
                  <option value="CNH">CNH - Chinese Yuan (Offshore)</option>
                  <option value="XAU">XAU - Gold (Troy Ounce)</option>
                  <option value="XAG">XAG - Silver (Troy Ounce)</option>
                  <option value="XPT">XPT - Platinum (Troy Ounce)</option>
                  <option value="XPD">XPD - Palladium (Troy Ounce)</option>
                  <option value="BTC">BTC - Bitcoin</option>
                  <option value="ETH">ETH - Ethereum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
             <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Contact (Appears on invoice)</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: +1 (555) 123-4567"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                   <input
                      type="text"
                      name="website"
                      value={formData.website || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="www.example.com"
                   />
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
