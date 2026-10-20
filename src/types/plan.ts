export type PlanType = "prime" | "pro" | "enterprise";

export interface IBackendPlan {
  _id: string;
  title: string;
  description: string;
  planType: PlanType;
  price?: number;
  unitPrice?: number;
  minimumPrice?: number;
  duration: string;
  paymentType: string;
  maxUnits?: number;
  productId?: string;
  priceId?: string;
  status: "Active" | "Delete";
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IEnterpriseRequestPayload {
  planId: string;
}

export interface IEnterpriseRequestResponse {
  message: string;
  request: {
    _id: string;
    user: string;
    plan: string;
    status: "pending" | "approved" | "rejected";
    createdAt?: string;
    updatedAt?: string;
  };
}
