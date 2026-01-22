'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';
import { Shield, Lock, User } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Password State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email State
  const [emailForm, setEmailForm] = useState({
    email: session?.user?.email || '',
    password: '',
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
        await api.put('/auth/update-email', {
            email: emailForm.email,
            password: emailForm.password
        });
        toast.success('Email updated successfully! Please re-login.');
        setEmailForm(prev => ({ ...prev, password: '' }));
    } catch (error: any) {
        console.error('Error changing email:', error);
        const msg = error.response?.data?.message || 'Error changing email.';
        toast.error(msg);
    } finally {
        setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwords.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters long.');
        return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      const msg = error.response?.data?.message || 'Error changing password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const canConfirmDelete =
    deleteConfirmText.trim().toLowerCase() === `delete ${session?.user?.companyName || 'your'} account`.toLowerCase();

  const handleDeleteAccount = async () => {
    if (!canConfirmDelete) {
      toast.error(`Please type "delete ${session?.user?.companyName || 'your'} account" to confirm.`);
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete('/auth/delete-account');
      toast.success('Your account has been permanently deleted.');
      await signOut({ callbackUrl: '/' });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        'Error deleting account. Please try again.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-black rounded-xl">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-black">Admin Settings</h1>
          <p className="text-gray-500">Manage your admin account and security preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-black p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-black">
                <User className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-lg font-bold text-black">{session?.user?.name || session?.user?.email?.split('@')[0]}</h2>
              <p className="text-sm text-gray-500 mb-4">{session?.user?.email}</p>
              <div className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full uppercase tracking-wider">
                Super Admin
              </div>
            </div>
          </div>

          {/* Email Update Card */}
          <div className="bg-white rounded-xl border border-black p-6">
             <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
                <Shield className="w-4 h-4 text-black" />
                <h3 className="font-bold text-black">Login Email</h3>
             </div>
             <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">New Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={emailForm.email}
                        onChange={handleEmailChange}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Confirm with Password</label>
                    <input
                        type="password"
                        name="password"
                        value={emailForm.password}
                        onChange={handleEmailChange}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                        placeholder="Current password"
                    />
                </div>
                <button
                  type="submit"
                  disabled={emailLoading}
                  className={`w-full py-2 bg-white border border-black text-black rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm ${emailLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {emailLoading ? 'Updating...' : 'Update Email'}
                </button>
             </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-black p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <Lock className="w-5 h-5 text-black" />
              <h2 className="text-lg font-bold text-black">Security Settings</h2>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-red-500 p-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Deleting your Haplogic admin account is permanent. All data owned by this
          account, including settings, templates, clients, and invoices, will be removed.
          This action cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => {
            setDeleteConfirmText('');
            setIsDeleteModalOpen(true);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete Account
        </button>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-black shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2 text-left">Delete Account</h3>
            <p className="text-sm text-gray-700 mb-4 text-left">
              This will permanently delete your Haplogic account and all related data.
              You will not be able to recover this account or any associated information.
            </p>
            <p className="text-sm text-gray-700 mb-2 text-left">
              To confirm, please type{' '}
              <span className="font-mono font-semibold">
                delete {session?.user?.companyName || 'your'} account
              </span>{' '}
              in the box below.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`delete ${session?.user?.companyName || 'your'} account`}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-red-600 outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canConfirmDelete || deleteLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white border border-black ${
                  canConfirmDelete && !deleteLoading
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
