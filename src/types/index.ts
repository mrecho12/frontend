// API Response Format
export interface DDMSResponse<T = any> {
  DDMS_status: 'success' | 'error' | 'warning';
  DDMS_login_status: 'authenticated' | 'unauthenticated' | 'expired';
  DDMS_error_code?: string;
  DDMS_data: T;
}

// Authentication
export interface LoginRequest {
  mobile: string;
  password?: string;
  otp?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  roles: UserRole[];
  currentStoreId?: string;
  stores: Store[];
  permissions?: Permission[]; // <-- add this line for compatibility with backend response
}

// Store Management
export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  contact: string;
  receiptLayout: string;
  paymentOptions: PaymentOption[];
  onlinePaymentEnabled: boolean;
  subscriptionStatus: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOption {
  type: 'cash' | 'cheque' | 'online';
  enabled: boolean;
}

// User Management
export interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  familyDetails?: FamilyDetails;
  active: boolean;
  roles: UserRole[];
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyDetails {
  spouseName?: string;
  children?: string[];
  emergencyContact?: string;
}

// Role & Permission Management
export interface Role {
  id: string;
  name: string;
  description: string;
  storeId: string;
  permissions: Permission[];
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  parentId?: string;
  children?: Permission[];
}

// UserRole - supports both login response format (roleName) and users API format (name)
export interface UserRole {
  roleId?: string;
  id?: string;
  roleName?: string;
  name?: string;
  storeId: string;
  storeName?: string;
  permissions: Permission[];
}

// Customer Management
export interface Customer {
  id: string;
  accountNumber: string;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  familyDetails?: FamilyDetails;
  active: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// Supplier Management
export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  active: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// Particulars Management
export interface Particular {
  id: string;
  name: string;
  type: 'RECEIPT' | 'CHALLAN';
  active: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// Receipt Management
export interface Receipt {
  id: string;
  receiptNumber: string;
  date: string;
  referenceNumber?: string;
  customerId: string;
  customerName: string;
  items: ReceiptItem[];
  totalAmount: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  paymentMode: 'CASH' | 'CHEQUE' | 'ONLINE';
  onlinePaymentDetails?: OnlinePaymentDetails;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  storeId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  id: string;
  particularId: string;
  particularName: string;
  amount: number;
}

export interface OnlinePaymentDetails {
  upiId?: string;
  transactionReference: string;
  paymentGateway: string;
}

// Challan Management
export interface Challan {
  id: string;
  challanNumber: string;
  date: string;
  referenceNumber?: string;
  supplierId: string;
  supplierName: string;
  items: ChallanItem[];
  totalAmount: number;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  paymentMode: 'CASH' | 'CHEQUE' | 'ONLINE';
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  storeId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallanItem {
  id: string;
  particularId: string;
  particularName: string;
  amount: number;
}

// Transaction Management
export interface Transaction {
  id: string;
  type: 'RECEIPT' | 'CHALLAN';
  referenceId: string;
  referenceNumber: string;
  amount: number;
  paymentMode: 'CASH' | 'CHEQUE' | 'ONLINE';
  customerId?: string;
  supplierId?: string;
  storeId: string;
  createdAt: string;
}

// Notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  userId: string;
  storeId: string;
  createdAt: string;
}

// News & Events
export interface NewsEvent {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'event';
  publishDate: string;
  active: boolean;
  storeId: string;
  createdBy: string;
  createdAt: string;
}

// Reports
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  supplierId?: string;
  status?: string;
  paymentMode?: string;
}

// Form Types
export interface LoginFormData {
  mobile: string;
  password?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ReceiptFormData {
  date: string;
  referenceNumber?: string;
  customerId: string;
  items: {
    particularId: string;
    amount: number;
  }[];
  paymentMode: 'CASH' | 'CHEQUE' | 'ONLINE';
  onlinePaymentDetails?: {
    upiId?: string;
    transactionReference: string;
  };
}

export interface ChallanFormData {
  date: string;
  referenceNumber?: string;
  supplierId: string;
  items: {
    particularId: string;
    amount: number;
  }[];
  paymentMode: 'CASH' | 'CHEQUE' | 'ONLINE';
}

// Session Management
export interface SessionState {
  isSessionWarningVisible: boolean;
  remainingTime: number;
  lastActivityTime: number;
  isSessionActive: boolean;
}

export interface SessionConfig {
  timeoutDuration: number; // in milliseconds, default 15 minutes (900000ms)
  warningDuration: number; // in milliseconds, default 2 minutes (120000ms)
  warningCountdownInterval: number; // in milliseconds, default 1 second (1000ms)
}

export interface SessionActions {
  resetSession: () => void;
  showSessionWarning: () => void;
  hideSessionWarning: () => void;
  setRemainingTime: (time: number) => void;
  startSessionWarningCountdown: () => void;
  logout: () => Promise<void>;
  extendSession: () => void;
}
