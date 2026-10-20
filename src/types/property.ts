export interface IPropertyCategory {
  _id: string;
  name: string;
  image?: string;
  parent?: string | IPropertyCategory | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PropertyStatus = "Active" | "Inactive" | "Pending";

export interface IProperty {
  _id: string;
  id?: string;
  user: {
    _id: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    email?: string;
    phone?: string;
    contactNumber?: string;
    image?: string;
    role?: string;
    totalUnitsUsed?: number;
  } | string;
  category: IPropertyCategory | string;
  subCategory: IPropertyCategory | string;
  name: string;
  address: string;
  unitSuiteNo?: string;
  totalUnits?: number;
  floorRange?: string;
  status: PropertyStatus;
  coverPhoto?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPropertiesPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IPropertiesResponse {
  properties: IProperty[];
  meta: IPropertiesPaginationMeta;
  totalProperties: number;
}

export interface IGetPropertiesParams {
  searchTerm?: string;
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  subCategory?: string;
  sort?: string;
}

export interface ICreatePropertyData {
  category: string;
  subCategory: string;
  name: string;
  address: string;
  unitSuiteNo?: string;
  totalUnits?: number | null;
  floorRange?: string;
  status?: PropertyStatus;
  coverPhoto?: string;
}
