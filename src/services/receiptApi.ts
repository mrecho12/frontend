import { apiService } from './api';
import { ReceiptState } from '@/store/receiptStore';

export interface Receipt {
  id: number;
  receiptNumber: string;
  date: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  receiptState: ReceiptState;
  status: string;
  paymentMode?: string;
}

export interface ReceiptApproval {
  id: number;
  fromState: ReceiptState;
  toState: ReceiptState;
  approvedBy: {
    id: number;
    name: string;
  };
  approvedAt: string;
  approvalNotes?: string;
}

export class ReceiptApiService {
  
  async getReceipts(state?: ReceiptState): Promise<Receipt[]> {
    const params = state ? { state: state.toLowerCase() } : {};
    const response = await apiService.get('/receipts', { params });
    return response.DDMS_data?.receipts || [];
  }

  async getReceiptById(id: number): Promise<Receipt> {
    const response = await apiService.get(`/receipts/${id}`);
    return response.DDMS_data;
  }

  async createReceipt(receiptData: any): Promise<Receipt> {
    const response = await apiService.post('/receipts', receiptData);
    return response.DDMS_data;
  }

  async changeReceiptState(
    receiptId: number, 
    newState: ReceiptState, 
    notes?: string
  ): Promise<Receipt> {
    const response = await apiService.post(`/receipts/${receiptId}/state-change`, {
      newState: newState.toUpperCase(),
      notes
    });
    return response.DDMS_data;
  }

  async approveReceipt(receiptId: number, notes?: string): Promise<Receipt> {
    const response = await apiService.post(`/receipts/${receiptId}/approve`, {
      notes
    });
    return response.DDMS_data;
  }

  async markAsPaid(
    receiptId: number, 
    paidAmount: number, 
    paymentDetails: string
  ): Promise<Receipt> {
    const response = await apiService.post(`/receipts/${receiptId}/pay`, {
      paidAmount,
      paymentDetails
    });
    return response.DDMS_data;
  }

  async getReceiptApprovals(receiptId: number): Promise<ReceiptApproval[]> {
    const response = await apiService.get(`/receipts/${receiptId}/approvals`);
    return response.DDMS_data || [];
  }
}

export const receiptApiService = new ReceiptApiService();