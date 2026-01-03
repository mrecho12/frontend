import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { receiptApiService, Receipt } from '@/services/receiptApi';
import { useReceiptStateStore, ReceiptState, canTransitionTo, getStateColor } from '@/store/receiptStore';
import { usePermissions } from '@/hooks/usePermissions';
import toast from 'react-hot-toast';

interface ReceiptActionsProps {
  receipt: Receipt;
}

export const ReceiptActions: React.FC<ReceiptActionsProps> = ({ receipt }) => {
  const queryClient = useQueryClient();
  const { canUpdate } = usePermissions();
  const { setShowPaymentModal } = useReceiptStateStore();

  const changeStateMutation = useMutation({
    mutationFn: ({ newState, notes }: { newState: ReceiptState; notes?: string }) =>
      receiptApiService.changeReceiptState(receipt.id, newState, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt state updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.DDMS_error_code || 'State change failed';
      toast.error(message);
    }
  });

  const approveMutation = useMutation({
    mutationFn: (notes?: string) => receiptApiService.approveReceipt(receipt.id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Receipt approved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.DDMS_error_code || 'Approval failed';
      toast.error(message);
    }
  });

  const paymentMutation = useMutation({
    mutationFn: ({ amount, details }: { amount: number; details: string }) =>
      receiptApiService.markAsPaid(receipt.id, amount, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.DDMS_error_code || 'Payment failed';
      toast.error(message);
    }
  });

  const handleStateChange = (newState: ReceiptState) => {
    if (!canTransitionTo(receipt.receiptState, newState)) {
      toast.error(`Cannot transition from ${receipt.receiptState} to ${newState}`);
      return;
    }
    
    changeStateMutation.mutate({ newState });
  };

  const handleApprove = () => {
    if (!canUpdate('receipts')) {
      toast.error('Insufficient permissions');
      return;
    }
    
    approveMutation.mutate(receipt.id.toString());
  };

  const handleMarkPaid = () => {
    if (!canUpdate('receipts')) {
      toast.error('Insufficient permissions');
      return;
    }
    
    setShowPaymentModal(true);
  };

  const getAvailableActions = () => {
    const actions = [];
    const currentState = receipt.receiptState;

    // State-based action availability
    switch (currentState) {
      case ReceiptState.DRAFT:
        actions.push(
          <Button
            key="submit"
            onClick={() => handleStateChange(ReceiptState.UNPAID)}
            disabled={changeStateMutation.isPending}
          >
            Submit Receipt
          </Button>
        );
        break;

      case ReceiptState.UNPAID:
        actions.push(
          <Button
            key="approve"
            onClick={() => handleStateChange(ReceiptState.PENDING_APPROVAL)}
            disabled={changeStateMutation.isPending}
          >
            Send for Approval
          </Button>,
          <Button
            key="pay"
            onClick={handleMarkPaid}
            disabled={paymentMutation.isPending}
          >
            Mark as Paid
          </Button>
        );
        break;

      case ReceiptState.PENDING_APPROVAL:
        actions.push(
          <Button
            key="approve"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
          >
            Approve
          </Button>,
          <Button
            key="reject"
            variant="outline"
            onClick={() => handleStateChange(ReceiptState.UNPAID)}
            disabled={changeStateMutation.isPending}
          >
            Reject
          </Button>
        );
        break;

      case ReceiptState.APPROVED:
        actions.push(
          <Button
            key="pay"
            onClick={handleMarkPaid}
            disabled={paymentMutation.isPending}
          >
            Mark as Paid
          </Button>
        );
        break;

      case ReceiptState.PARTIAL:
        actions.push(
          <Button
            key="complete-payment"
            onClick={handleMarkPaid}
            disabled={paymentMutation.isPending}
          >
            Complete Payment
          </Button>
        );
        break;
    }

    // Cancel action (available for most states)
    if (currentState !== ReceiptState.CANCELLED && currentState !== ReceiptState.PAID) {
      actions.push(
        <Button
          key="cancel"
          variant="outline"
          onClick={() => handleStateChange(ReceiptState.CANCELLED)}
          disabled={changeStateMutation.isPending}
        >
          Cancel
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="flex space-x-2">
      <span 
        className={`px-2 py-1 rounded text-sm bg-${getStateColor(receipt.receiptState)}-100 text-${getStateColor(receipt.receiptState)}-800`}
      >
        {receipt.receiptState.replace('_', ' ')}
      </span>
      {canUpdate('receipts') && getAvailableActions()}
    </div>
  );
};