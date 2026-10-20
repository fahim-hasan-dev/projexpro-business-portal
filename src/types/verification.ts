export type APPROVAL_STATUS = "pending" | "approved" | "rejected";

export interface ILicenseInformation {
  licenseType?: string;
  licenseNumber?: string;
  issuingAuthority?: string;
  expiryDate?: string;
}

export interface IVerificationDocument {
  title: string;
  file?: File | null;
  fileUrl?: string;
  type?: string;
}

export interface IServiceProviderProfile {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  skills?: string[];
  companyName?: string;
  officeAddress?: string;
  officeCity?: string;
  officeState?: string;
  officeZipCode?: string;
  officePhone?: string;
  taxId?: string;
  yearsInBusiness?: number;
  licenses?: ILicenseInformation[];
  governmentId?: string;
  proofOfInsurance?: string;
  documents?: { title: string; fileUrl: string; type?: string }[];
  isAccountPaused?: boolean;
  approvalStatus?: APPROVAL_STATUS;
  rejectionReason?: string;
}

export interface IPropertyManagerProfile {
  contactFullName?: string;
  jobTitle?: string;
  businessEmail?: string;
  businessPhone?: string;
  companyName?: string;
  legalBusinessName?: string;
  dbaTradeName?: string;
  companyWebsiteUrl?: string;
  businessAddress?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  portfolioSize?: number | string;
  activeUnits?: number;
  maintenanceInfrastructure?: string;
  maintenanceApproach?: string;
  propertyTypes?: string[];
  approvalStatus?: APPROVAL_STATUS;
  rejectionReason?: string;
}

export interface VerificationFormData {
  fullName: string;
  jobTitle: string;
  businessEmail: string;
  contactNumber: string;

  companyName: string;
  legalName: string;
  dbaName: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  taxId: string;

  // Property Manager Specific
  portfolioSize: string;
  maintenance: string;
  propertyTypes: string[];

  // Service Provider: Personal / Business Info
  bio: string;
  skills: string[];
  streetAddress?: string;
  homeCity?: string;
  homeState?: string;
  homeZipCode?: string;

  // Service Provider: Office Info
  officeAddress?: string;
  officeCity?: string;
  officeState?: string;
  officeZipCode?: string;
  officePhone?: string;

  // Service Provider Specific - Years & Licenses
  yearsInBusiness?: string;
  serviceRadius?: string;
  serviceCategories?: string[];
  licenseNumber?: string;
  licenses?: ILicenseInformation[];

  // Service Provider: File Uploads
  profileImage?: File | string | null;
  governmentIdFile?: File | string | null;
  proofOfInsuranceFile?: File | string | null;
  additionalDocuments?: IVerificationDocument[];
}
