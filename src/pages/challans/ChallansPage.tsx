import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, Eye, Edit, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { apiService } from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';

interface ChallanFormData {
  supplierId: number;
  date: string;
  referenceNumber?: string;
  paymentMode: string;
  notes?: string;
  particulars: Array<{ particularId: number; amount: number }>;
}

export const ChallansPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canApprove } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<any>(null);

  const { data: challans, isLoading } = useQuery({
    queryKey: ['challans', searchTerm],
    queryFn: () => apiService.getChallans({ search: searchTerm }),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apiService.getSuppliers(),
  });

  const { data: particulars } = useQuery({
    queryKey: ['particulars', 'CHALLAN'],
    queryFn: () => apiService.getParticulars('CHALLAN'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiService.approveChallan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      toast.success('Challan approved successfully');
    },
    onError: () => toast.error('Failed to approve challan'),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100';
      case 'PARTIALLY_PAID': return 'text-yellow-600 bg-yellow-100';
      case 'UNPAID': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-secondary-900">Challans</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary-900">Challans Management</h1>
        {canCreate('challans') && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challan
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Challans ({challans?.DDMS_data?.total || 0})</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <Input
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {t('common.filter')}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {t('common.export')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Challan Number</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Supplier</th>
                <th className="table-header-cell">Total Amount</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Payment Mode</th>
                <th className="table-header-cell">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {challans?.DDMS_data?.challans?.map((challan: any) => (
                <tr key={challan.id} className="hover:bg-secondary-50">
                  <td className="table-cell font-medium">{challan.challanNumber}</td>
                  <td className="table-cell">{new Date(challan.date).toLocaleDateString()}</td>
                  <td className="table-cell">{challan.supplierName}</td>
                  <td className="table-cell">₹{challan.totalAmount.toLocaleString()}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challan.status)}`}>
                      {challan.status}
                    </span>
                  </td>
                  <td className="table-cell">{challan.paymentMode}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChallan(challan)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canUpdate('challans') && (
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canApprove('challans') && challan.approvalRequired && !challan.approvedBy && (
                        <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(challan.id.toString())}>
                          <Check className="w-4 h-4 text-green-600" />
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

      {/* Create Challan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Challan"
        size="lg"
      >
        <div className="space-y-4">
          <Select label="Supplier *">
            <option value="">Select Supplier</option>
            {suppliers?.DDMS_data?.map((supplier: any) => (
              <option key={supplier.id} value={supplier.id}>{supplier.companyName}</option>
            ))}
          </Select>
          <Input label="Date *" type="date" />
          <Input label="Reference Number" />
          <Select label="Payment Mode *">
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online</option>
          </Select>
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Particulars</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select label="Item" className="flex-1">
                  <option value="">Select Item</option>
                  {particulars?.DDMS_data?.particulars?.map((particular: any) => (
                    <option key={particular.id} value={particular.id}>{particular.name}</option>
                  ))}
                </Select>
                <Input label="Amount" type="number" className="w-32" />
                <Button type="button" size="sm" className="mt-6">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Input label="Notes" />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Challan Modal */}
      <Modal
        isOpen={!!selectedChallan}
        onClose={() => setSelectedChallan(null)}
        title={`Challan ${selectedChallan?.challanNumber}`}
        size="lg"
      >
        {selectedChallan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date</label>
                <p>{new Date(selectedChallan.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="form-label">Supplier</label>
                <p>{selectedChallan.supplierName}</p>
              </div>
              <div>
                <label className="form-label">Total Amount</label>
                <p>₹{selectedChallan.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <label className="form-label">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedChallan.status)}`}>
                  {selectedChallan.status}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSelectedChallan(null)}>
                {t('common.close')}
              </Button>
              <Button>Print Challan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
