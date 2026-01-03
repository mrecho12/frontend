import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface CustomerFormData {
  id?: number;
  accountNumber?: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  familyDetails?: string;
  active: boolean;
}

export const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerFormData | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    accountNumber: '',
    name: '',
    mobile: '',
    email: '',
    address: '',
    familyDetails: '',
    active: true,
  });
  const [generatedAccountNumber, setGeneratedAccountNumber] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: () => apiService.getCustomers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully');
      handleCloseModal();
    },
    onError: () => toast.error('Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiService.updateCustomer(data.id!.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      handleCloseModal();
    },
    onError: () => toast.error('Failed to update customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteCustomer(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: () => toast.error('Failed to delete customer'),
  });

  const generateAccountNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CUST${timestamp}${random}`;
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    const accountNumber = generateAccountNumber();
    setGeneratedAccountNumber(accountNumber);
    setFormData({ 
      accountNumber,
      name: '', 
      mobile: '', 
      email: '', 
      address: '', 
      familyDetails: '', 
      active: true 
    });
    setShowModal(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setGeneratedAccountNumber('');
    setFormData({
      id: customer.id,
      accountNumber: customer.accountNumber,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      address: customer.address || '',
      familyDetails: customer.familyDetails || '',
      active: customer.active !== undefined ? customer.active : true,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setGeneratedAccountNumber('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure familyDetails is a JSON string with a 'members' property
    let familyDetailsJson = formData.familyDetails;
    let members = 4; // default
    if (familyDetailsJson && !isNaN(Number(familyDetailsJson))) {
      members = Number(familyDetailsJson);
    }
    const payload = {
      ...formData,
      familyDetails: JSON.stringify({ members }),
    };
    if (editingCustomer) {
      updateMutation.mutate({ ...payload, id: formData.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCustomers = customers?.DDMS_data?.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm) ||
    customer.accountNumber.includes(searchTerm)
  );

  if (isLoading) {
    return <div className="animate-pulse p-6">Loading customers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('navigation.customers')}</h1>
        {canCreate('customers') && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t('customer.createCustomer')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('navigation.customers')} ({customers?.DDMS_data?.length || 0})</CardTitle>
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
                <th className="table-header-cell">{t('customer.accountNumber')}</th>
                <th className="table-header-cell">{t('customer.name')}</th>
                <th className="table-header-cell">{t('customer.mobile')}</th>
                <th className="table-header-cell">{t('customer.email')}</th>
                <th className="table-header-cell">{t('customer.address')}</th>
                <th className="table-header-cell">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers?.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-secondary-50">
                  <td className="table-cell font-medium">{customer.accountNumber}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-secondary-400" />
                      {customer.name}
                    </div>
                  </td>
                  <td className="table-cell">{customer.mobile}</td>
                  <td className="table-cell">{customer.email || '-'}</td>
                  <td className="table-cell">{customer.address || '-'}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {canUpdate('customers') && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete('customers') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
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
        title={editingCustomer ? 'Edit Customer' : t('customer.createCustomer')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingCustomer && generatedAccountNumber && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium mb-1">Generated Account Number</p>
                  <p className="text-2xl font-bold text-blue-800">{generatedAccountNumber}</p>
                </div>
              </div>
            </div>
          )}
          <Input
            label={`${t('customer.name')} *`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={`${t('customer.mobile')} *`}
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            required
          />
          <Input
            label={t('customer.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('customer.address')}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="Family Details"
            value={formData.familyDetails}
            onChange={(e) => setFormData({ ...formData, familyDetails: e.target.value })}
          />
          <Input
            label="Active"
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
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
    </div>
  );
};
