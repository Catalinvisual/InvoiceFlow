'use client';

import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { formatDate } from '@/utils/dateFormatter';
import { MoreVertical, Trash2, Edit, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

type User = {
  id: string;
  email: string;
  companyName: string;
  plan: string;
  createdAt: string;
  _count?: {
    invoices: number;
    clients: number;
  }
};

export default function AdminUsersPage() {
  const api = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    plan: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/admin/users/${userToDelete}`);
      setUsers(users.filter(u => u.id !== userToDelete));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      companyName: user.companyName || '',
      email: user.email || '',
      plan: user.plan || 'FREE'
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    
    try {
      // Send all fields
      const response = await api.put(`/admin/users/${editingUser.id}`, formData);
      
      // Update local state
      setUsers(users.map(u => u.id === editingUser.id ? { 
        ...u, 
        companyName: formData.companyName,
        email: formData.email,
        plan: formData.plan 
      } : u));
      
      setEditingUser(null);
      toast.success('User details updated');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update user');
    }
  };

  if (loading) return <div className="p-8 text-black">Loading users...</div>;

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">User Management</h1>
        <span className="text-sm text-black">{users.length} Total Users</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-black">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-xs font-medium text-black uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-black">{user.companyName || 'N/A'}</div>
                    <div className="text-xs text-black">ID: {user.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                     <div className="flex flex-col text-xs">
                        <span>{user._count?.invoices || 0} Invoices</span>
                        <span>{user._count?.clients || 0} Clients</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.plan?.toUpperCase() === 'PRO' ? 'bg-purple-100 text-purple-800' :
                      user.plan?.toUpperCase() === 'STARTER' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-black border border-black'
                    }`}>
                      {user.plan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                       <button 
                         onClick={() => startEdit(user)}
                         className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                         title="Edit User"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(user.id)}
                         className="p-1 text-red-600 hover:bg-red-50 rounded"
                         title="Delete User"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl border border-black">
            <h3 className="text-lg font-bold text-black mb-4">Edit User Details</h3>
            
            <div className="space-y-4 mb-6">
               {/* Company Name Input */}
               <div>
                 <label className="block text-sm font-medium text-black mb-1">Company Name</label>
                 <input 
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-black"
                 />
               </div>

               {/* Email Input */}
               <div>
                 <label className="block text-sm font-medium text-black mb-1">Email Address</label>
                 <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-black"
                 />
               </div>

               {/* Plan Selection */}
               <div>
                 <label className="block text-sm font-medium text-black mb-2">Subscription Plan</label>
                 <div className="space-y-2">
                   <label className="flex items-center space-x-3 p-2 border border-black rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="radio" 
                        name="plan" 
                        value="FREE" 
                        checked={formData.plan === 'FREE'} 
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        className="text-black focus:ring-black"
                      />
                      <div>
                        <span className="block font-medium text-black">Free Plan</span>
                      </div>
                   </label>
                   <label className="flex items-center space-x-3 p-2 border border-black rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="radio" 
                        name="plan" 
                        value="STARTER" 
                        checked={formData.plan === 'STARTER'} 
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        className="text-black focus:ring-black"
                      />
                      <div>
                        <span className="block font-medium text-black">Starter Plan</span>
                      </div>
                   </label>
                   <label className="flex items-center space-x-3 p-2 border border-black rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="radio" 
                        name="plan" 
                        value="PRO" 
                        checked={formData.plan === 'PRO'} 
                        onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        className="text-black focus:ring-black"
                      />
                      <div>
                        <span className="block font-medium text-black">Pro Plan</span>
                      </div>
                   </label>
                 </div>
               </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-black hover:bg-gray-100 rounded-lg text-sm font-medium border border-black"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-black shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Delete User?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
