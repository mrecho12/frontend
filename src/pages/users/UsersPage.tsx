import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, User, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';

interface UserFormData {
  id?: number;
  name: string;
  mobile: string;
  email: string;
  address?: string;
  roleId?: number;
}

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    mobile: '',
    email: '',
    address: '',
    roleId: undefined,
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiService.get('/roles'),
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => apiService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      handleCloseModal();
    },
    onError: () => toast.error('Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => apiService.updateUser(data.id!.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      handleCloseModal();
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteUser(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: () => toast.error('Failed to delete user'),
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      apiService.post(`/roles/users/${userId}/roles`, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Roles assigned successfully');
      setShowRoleModal(false);
    },
    onError: () => toast.error('Failed to assign roles'),
  });

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', mobile: '', email: '', address: '', roleId: undefined });
    setShowModal(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email || '',
      address: user.address || '',
      roleId: user.roles?.[0]?.id,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate role is selected for new users
    if (!editingUser && !formData.roleId) {
      toast.error('Please select a role');
      return;
    }
    
    if (editingUser) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleManageRoles = (user: any) => {
    setSelectedUserId(user.id);
    setUserRole(user.roles?.[0]?.id);
    setShowRoleModal(true);
  };

  const handleSaveRoles = () => {
    if (selectedUserId && userRole) {
      assignRolesMutation.mutate({
        userId: selectedUserId,
        roleIds: [userRole],
      });
    }
  };

  const filteredUsers = users?.DDMS_data?.filter((user: any) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile.includes(searchTerm) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="animate-pulse p-6">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('navigation.users')}</h1>
        {canCreate('users') && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Users ({users?.DDMS_data?.length || 0})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <Input
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Mobile</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Roles</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Last Login</th>
                <th className="table-header-cell">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user: any) => (
                <tr key={user.id} className="hover:bg-secondary-50">
                  <td className="table-cell font-medium">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-secondary-400" />
                      {user.name}
                    </div>
                  </td>
                  <td className="table-cell">{user.mobile}</td>
                  <td className="table-cell">{user.email || '-'}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role: any) => (
                        <span
                          key={role.id}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {role.name}
                        </span>
                      )) || '-'}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {canUpdate('users') && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canUpdate('users') && (
                        <Button variant="ghost" size="sm" title="Manage Roles" onClick={() => handleManageRoles(user)}>
                          <Shield className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {canDelete('users') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Mobile *"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Role *
            </label>
            <select
              value={formData.roleId || ''}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a role *</option>
              {roles?.DDMS_data?.roles?.map((role: any) => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Manage User Roles"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary-600">
            Select roles for this user in the current store:
          </p>
          <div>
            <select
              value={userRole || ''}
              onChange={(e) => setUserRole(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a role</option>
              {roles?.DDMS_data?.roles?.map((role: any) => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles}>
              Save Roles
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
