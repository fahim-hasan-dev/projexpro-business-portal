export type InvoiceStatus =
  | "Unpaid"
  | "Paid"
  | "Cancelled"
  | "Deposit"
  | "Pending"
  | "Balance Due"
  | "Overdue";

export interface IInvoiceItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface IInvoiceProperty {
  _id: string;
  name?: string;
  title?: string;
  address?: string;
  propertyType?: string;
  totalUnits?: number;
  image?: string;
  coverPhoto?: string;
  category?: { _id: string; name: string };
  subCategory?: { _id: string; name: string };
}

export interface IInvoiceServiceRequest {
  _id: string;
  requestNo?: string;
  issueTitle?: string;
  status?: string;
  basePayment?: number;
  finalPayout?: number;
  createdAt?: string;
}

export interface IInvoiceUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  phone?: string;
  contactNumber?: string;
  image?: string;
  role?: string;
  profile?: any;
}

export interface IInvoice {
  _id: string;
  id?: string;
  invoiceNo: string;
  serviceRequest: IInvoiceServiceRequest | string;
  property: IInvoiceProperty | string;
  propertyManager: IInvoiceUser | string;
  serviceProvider?: IInvoiceUser | string | null;
  jobId?: string;
  dueDate: string;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IInvoicesResponse {
  invoices: IInvoice[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  totalInvoices: number;
}

export interface IGetInvoicesParams {
  searchTerm?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface IPayInvoiceResponse {
  checkoutUrl: string;
  session?: any;
}

// UI-compatible Line Item & Invoice representation
export interface InvoiceLineItem {
  id?: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id?: string;
  id: string; // e.g. "RF-8820"
  description: string;
  property: string;
  serviceProvider: string;
  totalAmount: number;
  deposit: number;
  totalDue: number;
  status: InvoiceStatus;
  startDate: string;
  issueDate?: string;
  dueDate?: string;
  finalInvoiceDate?: string;
  accountId?: string;
  serviceRequestTitle?: string;
  invoiceNo?: string;
  lineItems?: InvoiceLineItem[];
  items?: IInvoiceItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  depositAmountRequired?: number;
  finalBalanceDue?: number;
  raw?: IInvoice;
}
