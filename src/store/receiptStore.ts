import { create } from 'zustand';

export enum ReceiptState {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED'
}

interface ReceiptStateStore {
  // UI State only - no server data
  selectedReceiptId: number | null;
  isCreating: boolean;
  isEditing: boolean;
  showApprovalModal: boolean;
  showPaymentModal: boolean;
  
  // Actions
  setSelectedReceipt: (id: number | null) => void;
  setCreating: (creating: boolean) => void;
  setEditing: (editing: boolean) => void;
  setShowApprovalModal: (show: boolean) => void;
  setShowPaymentModal: (show: boolean) => void;
  reset: () => void;
}

export const useReceiptStateStore = create<ReceiptStateStore>((set) => ({
  selectedReceiptId: null,
  isCreating: false,
  isEditing: false,
  showApprovalModal: false,
  showPaymentModal: false,
  
  setSelectedReceipt: (id) => set({ selectedReceiptId: id }),
  setCreating: (creating) => set({ isCreating: creating }),
  setEditing: (editing) => set({ isEditing: editing }),
  setShowApprovalModal: (show) => set({ showApprovalModal: show }),
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),
  reset: () => set({
    selectedReceiptId: null,
    isCreating: false,
    isEditing: false,
    showApprovalModal: false,
    showPaymentModal: false
  })
}));

// State transition helpers
export const getValidTransitions = (currentState: ReceiptState): ReceiptState[] => {
  switch (currentState) {
    case ReceiptState.DRAFT:
      return [ReceiptState.UNPAID, ReceiptState.CANCELLED];
    case ReceiptState.UNPAID:
      return [ReceiptState.PENDING_APPROVAL, ReceiptState.PAID, ReceiptState.PARTIAL, ReceiptState.CANCELLED];
    case ReceiptState.PENDING_APPROVAL:
      return [ReceiptState.APPROVED, ReceiptState.UNPAID, ReceiptState.CANCELLED];
    case ReceiptState.APPROVED:
      return [ReceiptState.PAID, ReceiptState.PARTIAL, ReceiptState.CANCELLED];
    case ReceiptState.PAID:
      return [ReceiptState.CANCELLED];
    case ReceiptState.PARTIAL:
      return [ReceiptState.PAID, ReceiptState.CANCELLED];
    case ReceiptState.CANCELLED:
      return [];
    default:
      return [];
  }
};

export const canTransitionTo = (from: ReceiptState, to: ReceiptState): boolean => {
  return getValidTransitions(from).includes(to);
};

export const getStateColor = (state: ReceiptState): string => {
  switch (state) {
    case ReceiptState.DRAFT: return 'gray';
    case ReceiptState.UNPAID: return 'red';
    case ReceiptState.PENDING_APPROVAL: return 'yellow';
    case ReceiptState.APPROVED: return 'blue';
    case ReceiptState.PAID: return 'green';
    case ReceiptState.PARTIAL: return 'orange';
    case ReceiptState.CANCELLED: return 'red';
    default: return 'gray';
  }
};