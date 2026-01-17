import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReceiptParticular {
  particularId: number;
  particularName: string;
  amount: number;
}

export const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    paymentMode: 'CASH',
    notes: '',
    isDue: false,
  });
  const [particulars, setParticulars] = useState<ReceiptParticular[]>([]);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiService.getCustomers(),
  });

  const { data: particularsList } = useQuery({
    queryKey: ['particulars', 'RECEIPT'],
    queryFn: () => apiService.getParticulars('RECEIPT'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiService.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt created successfully');
      handleClose();
    },
    onError: () => toast.error('Failed to create receipt'),
  });

  const addParticular = () => {
    setParticulars([...particulars, { particularId: 0, particularName: '', amount: 0 }]);
  };

  const removeParticular = (index: number) => {
    setParticulars(particulars.filter((_, i) => i !== index));
  };

  const updateParticular = (index: number, field: keyof ReceiptParticular, value: any) => {
    const updated = [...particulars];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'particularId') {
      const particular = particularsList?.DDMS_data?.particulars?.find((p: any) => p.id === Number(value));
      if (particular) updated[index].particularName = particular.name;
    }
    setParticulars(updated);
  };

  const getTotalAmount = () => particulars.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (particulars.length === 0) {
      toast.error('Please add at least one particular');
      return;
    }
    const { paymentMode, ...baseData } = formData;
    const submitData = {
      ...baseData,
      ...(formData.isDue ? {} : { paymentMode }),
      customerId: Number(formData.customerId),
      totalAmount: getTotalAmount(),
      particulars: particulars.map(p => ({
        particularId: p.particularId,
        amount: p.amount,
      })),
    };
    
    createMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      paymentMode: 'CASH',
      notes: '',
      isDue: false,
    });
    setParticulars([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('receipt.createReceipt')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Customer *"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            required
          >
            <option value="">Select Customer</option>
            {customers?.DDMS_data?.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.accountNumber})
              </option>
            ))}
          </Select>

          <Input
            label="Date *"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <Input
            label="Reference Number"
            value={formData.referenceNumber}
            onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
          />

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isDue}
                onChange={(e) => setFormData({ ...formData, isDue: e.target.checked, paymentMode: e.target.checked ? '' : 'CASH' })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">Receipt Due (No Payment)</span>
            </label>
            
            {!formData.isDue && (
              <Select
                label="Payment Mode *"
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                required
              >
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online</option>
              </Select>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Particulars</h3>
            <Button type="button" size="sm" onClick={addParticular}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {particulars.map((particular, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label={index === 0 ? 'Item' : ''}
                    value={particular.particularId}
                    onChange={(e) => updateParticular(index, 'particularId', e.target.value)}
                    required
                  >
                    <option value="">Select Item</option>
                    {particularsList?.DDMS_data?.particulars?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="w-32">
                  <Input
                    label={index === 0 ? 'Amount' : ''}
                    type="number"
                    value={particular.amount || ''}
                    onChange={(e) => updateParticular(index, 'amount', Number(e.target.value))}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParticular(index)}
                  className="mb-1"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {particulars.length > 0 && (
            <div className="mt-3 pt-3 border-t flex justify-between items-center font-semibold">
              <span>Total Amount:</span>
              <span className="text-lg">₹{getTotalAmount().toLocaleString()}</span>
            </div>
          )}
        </div>

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
