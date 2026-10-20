export type PriorityType = "Urgent" | "High" | "Medium" | "Low";

export type StatusType =
  | "Pending"
  | "Assigned"
  | "Accepted"
  | "Rejected"
  | "In Progress"
  | "Pending Approval"
  | "Completed"
  | "Cancelled";

export interface IServiceRequestProperty {
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

export interface IServiceRequestUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  phone?: string;
  contactNumber?: string;
  image?: string;
  role?: string;
}

export interface IServiceRequestProvider {
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

export interface IServiceRequestInvoice {
  _id: string;
  invoiceNo?: string;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  stripeCheckoutSessionId?: string;
  dueDate?: string;
}

export interface ISpecializedRate {
  isActive?: boolean;
  paymentType?: "Percentage" | "Flat Amount";
  value?: number;
  reason?: string;
}

export interface IServiceRequest {
  _id: string;
  id?: string;
  requestNo: string;
  user: IServiceRequestUser | string;
  property: IServiceRequestProperty | string;
  issueTitle: string;
  description: string;
  priority: PriorityType;
  isOccupied: boolean;
  tenantName?: string;
  tenantPhone?: string;
  locationDetails?: string;
  images?: string[];
  status: StatusType;
  assignedProvider?: IServiceRequestProvider | null;
  eta?: string;
  basePayment?: number;
  specializedRate?: ISpecializedRate;
  finalPayout?: number;
  rejectionReason?: string;
  completionImages?: string[];
  note?: string;
  invoice?: IServiceRequestInvoice | string | null;
  isPaid?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IServiceRequestsResponse {
  requests: IServiceRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  totalRequests: number;
}

export interface IGetServiceRequestsParams {
  searchTerm?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ICreateServiceRequestPayload {
  property: string;
  issueTitle: string;
  description: string;
  priority?: PriorityType;
  isOccupied?: boolean;
  tenantName?: string;
  tenantPhone?: string;
  locationDetails?: string;
  images?: string[];
}

export interface IUpdateServiceRequestStatusPayload {
  status: StatusType;
  reason?: string;
  note?: string;
  images?: string[];
}

// Legacy format used by UI components
export interface ServiceRequest {
  _id?: string;
  id: string;
  title: string;
  property: string;
  address: string;
  priority: PriorityType;
  status: StatusType;
  stage: number;
  stageText: string;
  contractor: string;
  contractorPhone?: string;
  createdDate: string;
  scheduledDate?: string;
  isOccupied?: boolean;
  tenantName?: string;
  tenantPhone?: string;
  raw?: IServiceRequest;
}
