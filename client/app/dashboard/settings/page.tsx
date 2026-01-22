'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import useApi from '@/hooks/useApi';
import { toast } from 'react-hot-toast';




export default function SettingsPage() {
  const { data: session } = useSession();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isPro = session?.user?.plan?.toUpperCase() === 'PRO';

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

  const [settings, setSettings] = useState<any>({});

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
      <h1 className="text-2xl font-bold text-gray-800">Account & Settings</h1>

      {/* Subscription Plan Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 relative z-10">Subscription Plan</h2>
        <div className="flex items-center justify-between relative z-10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-500">Current Plan:</span>
                    <span className={`text-xl font-bold ${
                         session?.user?.plan?.toUpperCase() === 'PRO' ? 'text-purple-600' :
                         session?.user?.plan?.toUpperCase() === 'STARTER' ? 'text-green-600' :
                         'text-gray-700'
                    }`}>
                        {session?.user?.plan || 'FREE'}
                    </span>
                </div>
                <p className="text-sm text-gray-600 max-w-md">
                    {isPro 
                        ? "You are currently on the Pro Plan. You can change your subscription plan at any time."
                        : "Upgrade to unlock advanced features like unlimited invoices, custom branding, and automated reminders."
                    }
                </p>
            </div>
            <div className="flex gap-3">
                {isPro ? (
                    <a href="/#pricing" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                        Change Plan
                    </a>
                ) : (
                    <a href="/#pricing" target="_blank" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Upgrade Plan
                    </a>
                )}
            </div>
        </div>
      </div>
      
      {/* Email Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Email Settings</h2>
        
        <form onSubmit={handleEmailSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={emailForm.email}
              onChange={handleEmailChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm with Password</label>
            <input
              type="password"
              name="password"
              value={emailForm.password}
              onChange={handleEmailChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Current password"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={emailLoading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${emailLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Security</h2>
        
        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-700 mb-4">
          Deleting your Haplogic account is permanent. All invoices, clients, templates,
          and settings associated with this account will be removed. This action cannot be undone.
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-700 mb-4">
              This will permanently delete your Haplogic account and all related data.
              You will not be able to recover this account or any invoices, clients,
              or templates.
            </p>
            <p className="text-sm text-gray-700 mb-2">
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canConfirmDelete || deleteLoading}
                className={`px-4 py-2 rounded-lg font-medium text-white ${
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
