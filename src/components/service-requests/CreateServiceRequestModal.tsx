"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { PriorityType } from "@/types/serviceRequest";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { useGetMyPropertiesQuery } from "@/features/property/propertyApi";
import { useCreateServiceRequestMutation } from "@/features/serviceRequest/serviceRequestApi";

interface CreateServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateServiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateServiceRequestModalProps) {
  const { data: propertiesRes, isLoading: isPropertiesLoading } = useGetMyPropertiesQuery(undefined, {
    skip: !isOpen,
  });
  const [createServiceRequest, { isLoading: isCreating }] = useCreateServiceRequestMutation();

  const properties = propertiesRes?.data?.properties || [];

  const [formPropertyId, setFormPropertyId] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formPriority, setFormPriority] = useState<PriorityType>("Medium");
  const [formIsOccupied, setFormIsOccupied] = useState<boolean>(false);
  const [formTenantName, setFormTenantName] = useState<string>("");
  const [formTenantPhone, setFormTenantPhone] = useState<string>("");
  const [formExtraTitle, setFormExtraTitle] = useState<string>("");
  const [formImage, setFormImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-select first property if none selected
  useEffect(() => {
    if (properties.length > 0 && !formPropertyId) {
      setFormPropertyId(properties[0]._id);
    }
  }, [properties, formPropertyId]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setFormImage(imageUrl);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setFormImage(imageUrl);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formPropertyId) {
      newErrors.property = "Property selection is required";
    }
    if (!formTitle.trim()) {
      newErrors.title = "Issue Title is required";
    }
    if (!formDescription.trim()) {
      newErrors.description = "Description is required";
    }

    if (formIsOccupied) {
      if (!formTenantName.trim()) {
        newErrors.tenantName = "Tenant Name is required";
      }
      if (!formTenantPhone.trim()) {
        newErrors.tenantPhone = "Phone Number is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        property: formPropertyId,
        issueTitle: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        isOccupied: formIsOccupied,
        tenantName: formIsOccupied ? formTenantName.trim() : undefined,
        tenantPhone: formIsOccupied ? formTenantPhone.trim() : undefined,
        locationDetails: formExtraTitle.trim() || undefined,
      };

      let bodyData: FormData | typeof payload;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("data", JSON.stringify(payload));
        bodyData = formData;
      } else {
        bodyData = payload;
      }

      await createServiceRequest(bodyData).unwrap();

      toast.success("Service request submitted successfully! Sent to Admin for review.");
      
      // Reset Form
      setFormTitle("");
      setFormDescription("");
      setFormPriority("Medium");
      setFormIsOccupied(false);
      setFormTenantName("");
      setFormTenantPhone("");
      setFormExtraTitle("");
      setFormImage("");
      setSelectedFile(null);
      setErrors({});

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Create service request error:", err);
      const msg = err?.data?.message || err?.message || "Failed to submit service request";
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-[#FFFFFF] rounded-lg p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-[#E5E7EB] max-h-[92vh] overflow-hidden relative flex flex-col animate-in fade-in zoom-in-95 duration-200 ease-out">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Create Service Request
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
              Submit a new maintenance request for your property.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {/* Select Property */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Select Property *
            </label>
            <Select
              value={formPropertyId}
              onValueChange={(val) => {
                setFormPropertyId(val);
                setErrors((prev) => ({ ...prev, property: "" }));
              }}
            >
              <SelectTrigger
                className={`w-full h-[46px] px-4 py-6 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer shadow-none ${
                  errors.property
                    ? "border-red-500 bg-red-50/20"
                    : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                }`}
              >
                <SelectValue placeholder={isPropertiesLoading ? "Loading properties..." : "Select Property"} />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-lg border border-gray-200 shadow-lg z-[60]">
                {properties.length > 0 ? (
                  properties.map((p) => (
                    <SelectItem key={p._id} className="py-2.5 cursor-pointer" value={p._id}>
                      {p.name} {p.address ? `(${p.address})` : ""}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {isPropertiesLoading ? "Loading properties..." : "No properties found. Please create a property first."}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.property && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.property}
              </p>
            )}
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Issue Title *
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => {
                setFormTitle(e.target.value);
                if (e.target.value.trim()) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder="e.g. Water Leak under Kitchen Sink"
              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                errors.title
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => {
                setFormDescription(e.target.value);
                if (e.target.value.trim()) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="Detailed description of the issue..."
              className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all resize-none ${
                errors.description
                  ? "border-red-500 bg-red-50/20"
                  : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.description}
              </p>
            )}
          </div>

          {/* Priority Level Pills */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Priority Level *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["Urgent", "High", "Medium", "Low"] as PriorityType[]).map((pri) => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setFormPriority(pri)}
                  className={`py-2.5 px-2 rounded-lg font-medium text-xs sm:text-sm text-center cursor-pointer transition-all ${
                    formPriority === pri
                      ? "border-2 border-[#6B1294] bg-[#F2E7FC] text-[#6B1294] font-bold"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pri}
                </button>
              ))}
            </div>
          </div>

          {/* Occupied Toggle */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Is unit / property occupied? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormIsOccupied(true)}
                className={`py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center cursor-pointer transition-all ${
                  formIsOccupied
                    ? "border-2 border-emerald-500 bg-emerald-100 text-emerald-800"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormIsOccupied(false)}
                className={`py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center cursor-pointer transition-all ${
                  !formIsOccupied
                    ? "border-2 border-red-300 bg-red-100 text-red-700"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Tenant fields if occupied */}
          {formIsOccupied && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    value={formTenantName}
                    onChange={(e) => {
                      setFormTenantName(e.target.value);
                      if (e.target.value.trim()) setErrors((prev) => ({ ...prev, tenantName: "" }));
                    }}
                    placeholder="e.g. John Doe"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                      errors.tenantName
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                    }`}
                  />
                  {errors.tenantName && (
                    <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {errors.tenantName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={formTenantPhone}
                    onChange={(e) => {
                      setFormTenantPhone(e.target.value);
                      if (e.target.value.trim()) setErrors((prev) => ({ ...prev, tenantPhone: "" }));
                    }}
                    placeholder="+1 (555) 255-2552"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                      errors.tenantPhone
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20"
                    }`}
                  />
                  {errors.tenantPhone && (
                    <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {errors.tenantPhone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Request Location Details (Unit / Room)
                </label>
                <input
                  type="text"
                  value={formExtraTitle}
                  onChange={(e) => setFormExtraTitle(e.target.value)}
                  placeholder="e.g. Unit 4B, 2nd floor, kitchen area"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#6B1294] focus:ring-2 focus:ring-[#6B1294]/20 focus:outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Photos Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Upload Photo (Optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                errors.image
                  ? "border-red-500 bg-red-50/30"
                  : formImage
                  ? "border-purple-400 bg-purple-50/30"
                  : "border-gray-300 bg-white hover:bg-purple-50/20"
              }`}
            >
              {formImage ? (
                <div className="relative group">
                  <img
                    src={formImage}
                    alt="Service request preview"
                    className="w-full h-36 object-cover rounded-lg shadow-xs"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                    Click to change photo
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-7 h-7 text-gray-400 mx-auto mb-1.5" />
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    Drag & drop photos here, or{" "}
                    <span className="text-[#6B1294] font-semibold underline">
                      browse
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    PNG, JPG up to 10MB
                  </p>
                </>
              )}
            </div>
            {errors.image && (
              <p className="text-red-500 text-xs mt-1 font-semibold flex items-center gap-1">
                <span>⚠️</span> {errors.image}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 py-3.5 px-4 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-semibold text-sm sm:text-base transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 py-3.5 px-4 bg-[#6B1294] hover:bg-[#580e7d] disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isCreating ? "Submitting..." : "Submit Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
