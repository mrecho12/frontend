import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Shield, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';

interface RoleFormData {
  id?: number;
  name: string;
  description: string;
}

export const RolesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiService.get('/roles'),
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => apiService.get('/roles/permissions'),
  });

  const { data: roleDetails } = useQuery({
    queryKey: ['role', selectedRoleId],
    queryFn: () => apiService.get(`/roles/${selectedRoleId}`),
    enabled: !!selectedRoleId && showPermissionsModal,
  });

  const createMutation = useMutation({
    mutationFn: (data: RoleFormData) => apiService.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      handleCloseModal();
    },
    onError: () => toast.error('Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoleFormData) => apiService.put(`/roles/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      handleCloseModal();
    },
    onError: () => toast.error('Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: () => toast.error('Failed to delete role'),
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      apiService.post(`/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', selectedRoleId] });
      toast.success('Permissions assigned successfully');
      setShowPermissionsModal(false);
    },
    onError: () => toast.error('Failed to assign permissions'),
  });

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      id: role.id,
      name: role.name,
      description: role.description,
    });
    setShowModal(true);
  };

  const handleManagePermissions = (role: any) => {
    setSelectedRoleId(role.id);
    setShowPermissionsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedRoleId(null);
    setSelectedPermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = () => {
    if (selectedRoleId) {
      assignPermissionsMutation.mutate({
        roleId: selectedRoleId,
        permissionIds: selectedPermissions,
      });
    }
  };

  React.useEffect(() => {
    if (roleDetails?.DDMS_data?.permissions) {
      setSelectedPermissions(roleDetails.DDMS_data.permissions.map((p: any) => p.id));
    }
  }, [roleDetails]);

  if (isLoading) {
    return <div className="animate-pulse p-6">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
        {canCreate('roles') && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles ({roles?.DDMS_data?.total || 0})</CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="table-header-cell">Role Name</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Permissions</th>
                <th className="table-header-cell">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {roles?.DDMS_data?.roles?.map((role: any) => (
                <tr key={role.id} className="hover:bg-secondary-50">
                  <td className="table-cell font-medium">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-primary-600" />
                      {role.name}
                    </div>
                  </td>
                  <td className="table-cell">{role.description}</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {role.permissionCount} permissions
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {canUpdate('roles') && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canUpdate('roles') && (
                        <Button variant="ghost" size="sm" onClick={() => handleManagePermissions(role)}>
                          <Shield className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      {canDelete('roles') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)}>
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
        title={editingRole ? 'Edit Role' : 'Create Role'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Role Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
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
        isOpen={showPermissionsModal}
        onClose={handleClosePermissionsModal}
        title="Manage Permissions"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary-600">
            Select permissions for this role:
          </p>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {Object.entries(
              permissions?.DDMS_data?.permissions?.reduce((acc: any, perm: any) => {
                if (!acc[perm.resource]) acc[perm.resource] = [];
                acc[perm.resource].push(perm);
                return acc;
              }, {}) || {}
            ).map(([resource, perms]: [string, any]) => (
              <div key={resource} className="border rounded-lg p-3 bg-secondary-50">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 mr-2 text-primary-600" />
                  <h3 className="font-semibold text-sm capitalize">{resource}</h3>
                </div>
                <div className="ml-6 space-y-2">
                  {perms.map((permission: any) => (
                    <label
                      key={permission.id}
                      className="flex items-center p-2 bg-white border rounded hover:bg-secondary-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mr-3 h-4 w-4 text-primary-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{permission.action}</p>
                        {permission.description && (
                          <p className="text-xs text-secondary-500">{permission.description}</p>
                        )}
                      </div>
                      {selectedPermissions.includes(permission.id) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClosePermissionsModal}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
