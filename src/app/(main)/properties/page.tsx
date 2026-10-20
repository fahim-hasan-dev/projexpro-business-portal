"use client";

import {
  Building2,
  Eye,
  Home,
  MapPin,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
  Loader2,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useMemo, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useGetMyPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
} from "@/features/property/propertyApi";
import { IProperty, PropertyStatus, IPropertyCategory } from "@/types/property";
import { getPropertyImageUrl } from "@/utils/propertyUtils";

type FilterType = "all" | "residential" | "commercial" | "mixed-use";

// Helper to find the parent category matching type
const findCategoryByType = (
  cats: IPropertyCategory[],
  type: "residential" | "commercial" | "mixed-use"
): IPropertyCategory | null => {
  if (!cats || cats.length === 0) return null;
  if (type === "residential") {
    return (
      cats.find((c) => c.name.trim().toLowerCase() === "residential") ||
      cats.find((c) => c.name.toLowerCase().startsWith("resident")) ||
      cats[0]
    );
  }
  if (type === "commercial") {
    return (
      cats.find((c) => c.name.trim().toLowerCase() === "commercial") ||
      cats.find((c) => c.name.toLowerCase().startsWith("commer")) ||
      cats[0]
    );
  }
  if (type === "mixed-use") {
    return (
      cats.find((c) => c.name.trim().toLowerCase() === "mixed-use") ||
      cats.find((c) => c.name.toLowerCase().includes("mixed")) ||
      cats[0]
    );
  }
  return cats[0];
};

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  // Fetch properties from backend
  const { data: propertiesRes, isLoading: isPropertiesLoading, refetch } =
    useGetMyPropertiesQuery(undefined);

  // Fetch top-level categories
  const { data: categoriesRes } = useGetCategoriesQuery();

  // Mutations
  const [createProperty, { isLoading: isCreating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: isUpdating }] = useUpdatePropertyMutation();
  const [deleteProperty, { isLoading: isDeleting }] = useDeletePropertyMutation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingProperty, setViewingProperty] = useState<IProperty | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<IProperty | null>(null);

  // Modal Form State
  const [selectedCategoryType, setSelectedCategoryType] = useState<"residential" | "commercial" | "mixed-use">("residential");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formAddress, setFormAddress] = useState<string>("");
  const [formTotalUnits, setFormTotalUnits] = useState<string>("");
  const [formUnitNumber, setFormUnitNumber] = useState<string>("");
  const [formFloorRange, setFormFloorRange] = useState<string>("");
  const [formStatus, setFormStatus] = useState<PropertyStatus>("Active");
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract categories safely
  const categories: IPropertyCategory[] = useMemo(() => {
    if (!categoriesRes?.data) return [];
    if (Array.isArray(categoriesRes.data)) return categoriesRes.data;
    if (Array.isArray((categoriesRes.data as any)?.categories)) {
      return (categoriesRes.data as any).categories;
    }
    return [];
  }, [categoriesRes]);

  // Match parent category based on selected type
  const activeParentCategory = useMemo(() => {
    return findCategoryByType(categories, selectedCategoryType);
  }, [categories, selectedCategoryType]);

  // Keep selectedCategoryId in sync with selectedCategoryType and loaded categories
  useEffect(() => {
    if (categories.length > 0) {
      const matched = findCategoryByType(categories, selectedCategoryType);
      if (matched && matched._id !== selectedCategoryId) {
        setSelectedCategoryId(matched._id);
      }
    }
  }, [categories, selectedCategoryType, selectedCategoryId]);

  // Fetch sub-categories for currently selected parent category
  const { data: subCategoriesRes, isLoading: isSubCatsLoading } =
    useGetSubCategoriesQuery(selectedCategoryId, {
      skip: !selectedCategoryId,
    });

  // Extract subCategories safely from response ({ data: { subCategories: [...] } } or { data: [...] })
  const subCategories: IPropertyCategory[] = useMemo(() => {
    if (!subCategoriesRes?.data) return [];
    if (Array.isArray(subCategoriesRes.data)) return subCategoriesRes.data;
    if (Array.isArray(subCategoriesRes.data?.subCategories)) {
      return subCategoriesRes.data.subCategories;
    }
    if (Array.isArray((subCategoriesRes as any)?.subCategories)) {
      return (subCategoriesRes as any).subCategories;
    }
    return [];
  }, [subCategoriesRes]);

  // Auto-select first sub-category if none selected or if previous selection is not in list
  useEffect(() => {
    if (subCategories.length > 0) {
      const exists = subCategories.some((s) => s._id === selectedSubCategoryId);
      if (!exists) {
        setSelectedSubCategoryId(subCategories[0]._id);
      }
    }
  }, [subCategories, selectedSubCategoryId]);

  const properties: IProperty[] = useMemo(() => {
    if (!propertiesRes?.data) return [];
    if (Array.isArray(propertiesRes.data)) return propertiesRes.data;
    if (Array.isArray((propertiesRes.data as any)?.properties)) {
      return (propertiesRes.data as any).properties;
    }
    return [];
  }, [propertiesRes]);

  // Handle Type switcher click
  const handleTypeChange = (type: "residential" | "commercial" | "mixed-use") => {
    setSelectedCategoryType(type);
    const matched = findCategoryByType(categories, type);
    if (matched) {
      setSelectedCategoryId(matched._id);
      setSelectedSubCategoryId("");
    }
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setFormImagePreview(imageUrl);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  // Handle File Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setFormImagePreview(imageUrl);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  // Open Modal for Create
  const handleOpenAddModal = () => {
    setEditingId(null);
    setSelectedCategoryType("residential");
    const matched = findCategoryByType(categories, "residential");
    if (matched) {
      setSelectedCategoryId(matched._id);
    }
    setSelectedSubCategoryId("");
    setFormName("");
    setFormAddress("");
    setFormTotalUnits("");
    setFormUnitNumber("");
    setFormFloorRange("");
    setFormStatus("Active");
    setFormImagePreview("");
    setSelectedFile(null);
    setErrors({});
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (prop: IProperty) => {
    setEditingId(prop._id);

    const catObj = typeof prop.category === "object" ? prop.category : null;
    const catName = catObj?.name?.toLowerCase() || "";

    const type: "residential" | "commercial" | "mixed-use" = catName.includes("commercial")
      ? "commercial"
      : catName.includes("mixed")
      ? "mixed-use"
      : "residential";

    setSelectedCategoryType(type);

    const catId = typeof prop.category === "object" ? prop.category._id : prop.category;
    const subCatId = typeof prop.subCategory === "object" ? prop.subCategory._id : prop.subCategory;

    setSelectedCategoryId(catId || "");
    setSelectedSubCategoryId(subCatId || "");
    setFormName(prop.name || "");
    setFormAddress(prop.address || "");
    setFormTotalUnits(prop.totalUnits ? String(prop.totalUnits) : "");
    setFormUnitNumber(prop.unitSuiteNo || "");
    setFormFloorRange(prop.floorRange || "");
    setFormStatus(prop.status || "Active");
    setFormImagePreview(getPropertyImageUrl(prop.coverPhoto));
    setSelectedFile(null);
    setErrors({});
    setIsModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingProperty) return;
    try {
      await deleteProperty(deletingProperty._id).unwrap();
      toast.success("Property deleted successfully");
      setDeletingProperty(null);
      refetch();
    } catch (err: any) {
      console.error("Delete property error:", err);
      const msg = err?.data?.message || err?.message || "Failed to delete property";
      toast.error(msg);
    }
  };

  // Form Submit (Create or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formName.trim()) newErrors.name = "Property Name is required";
    if (!formAddress.trim()) newErrors.address = "Property Address is required";

    const targetCategoryId = selectedCategoryId || activeParentCategory?._id;
    if (!targetCategoryId) newErrors.category = "Category is required";

    const targetSubCategoryId =
      selectedSubCategoryId || (subCategories.length > 0 ? subCategories[0]._id : "");
    if (!targetSubCategoryId) {
      newErrors.subCategory = "Sub-Category is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const propertyPayload: any = {
        name: formName.trim(),
        address: formAddress.trim(),
        category: targetCategoryId,
        subCategory: targetSubCategoryId,
        unitSuiteNo: formUnitNumber.trim() || undefined,
        totalUnits: formTotalUnits ? Number(formTotalUnits) : 1,
        floorRange: formFloorRange.trim() || undefined,
        status: formStatus,
      };

      let bodyData: FormData | typeof propertyPayload;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("data", JSON.stringify(propertyPayload));
        bodyData = formData;
      } else {
        bodyData = propertyPayload;
      }

      if (editingId) {
        await updateProperty({ id: editingId, data: bodyData }).unwrap();
        toast.success("Property updated successfully");
      } else {
        await createProperty(bodyData).unwrap();
        toast.success("Property created successfully");
      }

      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error("Save property error:", err);
      const msg = err?.data?.message || err?.message || "Failed to save property";
      toast.error(msg, { duration: 5000 });
    }
  };

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter((item) => {
      const catObj = typeof item.category === "object" ? item.category : null;
      const subCatObj = typeof item.subCategory === "object" ? item.subCategory : null;
      const catName = catObj?.name || "";
      const subCatName = subCatObj?.name || "";

      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.unitSuiteNo && item.unitSuiteNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const isResidential = catName.toLowerCase().includes("residential");
      const isCommercial = catName.toLowerCase().includes("commercial");
      const isMixed = catName.toLowerCase().includes("mixed");

      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "residential" && isResidential) ||
        (selectedFilter === "commercial" && isCommercial) ||
        (selectedFilter === "mixed-use" && isMixed);

      return matchesSearch && matchesFilter;
    });
  }, [properties, searchTerm, selectedFilter]);

  return (
    <div className="space-y-6">
      {/* Top Title & Add Button Row */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-relaxed">
            Properties
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5 sm:mt-1">
            {isPropertiesLoading
              ? "Loading properties..."
              : `${filteredProperties.length} ${filteredProperties.length === 1 ? "property" : "properties"} total`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#5B1B95] hover:bg-[#4a157a] text-white font-semibold px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-2 sm:p-2.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-7/12">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search properties by name, address, or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#5B1B95] transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E5E7EB] p-1.5 rounded-lg w-full md:w-auto overflow-x-auto">
          {(["all", "residential", "commercial", "mixed-use"] as FilterType[]).map((tab) => {
            const isSelected = selectedFilter === tab;
            const labels: Record<FilterType, string> = {
              all: "All Properties",
              residential: "Residential",
              commercial: "Commercial",
              "mixed-use": "Mixed-use",
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isPropertiesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden h-80">
              <div className="h-52 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isPropertiesLoading && filteredProperties.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-[#5B1B95] flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">
              {searchTerm ? "No matching properties found" : "No properties added yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
              {searchTerm
                ? "Try adjusting your search query or switching category filters."
                : "Add your first residential, commercial, or mixed-use property to manage units and service requests."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-2 bg-[#5B1B95] hover:bg-[#4a157a] text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      )}

      {/* Property Cards Grid */}
      {!isPropertiesLoading && filteredProperties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop, index) => {
            const catObj = typeof prop.category === "object" ? prop.category : null;
            const subCatObj = typeof prop.subCategory === "object" ? prop.subCategory : null;
            const catName = catObj?.name || "Property";
            const subCatName = subCatObj?.name || "";
            const isCommercial = catName.toLowerCase().includes("commercial");
            const isMixed = catName.toLowerCase().includes("mixed");

            const imageUrl = getPropertyImageUrl(prop.coverPhoto, index + 1);

            return (
              <div
                key={prop._id}
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg overflow-hidden shadow-2xs flex flex-col justify-between transition-all hover:shadow-md"
              >
                {/* Top Image & Overlay Badges */}
                <div
                  onClick={() => setViewingProperty(prop)}
                  className="h-52 w-full relative overflow-hidden bg-gray-100 cursor-pointer group/img"
                >
                  <img
                    src={imageUrl}
                    alt={prop.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/images/prop_${((index % 6) + 1)}.png`;
                    }}
                  />

                  {/* Type Badge (Top-Left) */}
                  <div className="absolute top-3.5 left-3.5">
                    {isCommercial ? (
                      <span className="bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] font-semibold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        Commercial
                      </span>
                    ) : isMixed ? (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Layers className="w-3.5 h-3.5" />
                        Mixed-use
                      </span>
                    ) : (
                      <span className="bg-[#E5D7F6] text-[#5B1B95] border border-[#E1D4F4] font-semibold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Home className="w-3.5 h-3.5" />
                        Residential
                      </span>
                    )}
                  </div>

                  {/* Status Badge (Top-Right) */}
                  <div className="absolute top-3.5 right-3.5">
                    <span
                      className={`font-semibold text-xs px-3 py-1 rounded-full border shadow-xs ${
                        prop.status === "Active"
                          ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                          : prop.status === "Pending"
                          ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                          : "bg-gray-200 text-gray-600 border-gray-300"
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3
                      onClick={() => setViewingProperty(prop)}
                      className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1 cursor-pointer hover:text-[#5B1B95] transition-colors"
                    >
                      {prop.name}
                    </h3>

                    {/* Location */}
                    <div className="text-sm text-gray-500 font-normal flex items-center gap-1.5 mb-2 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{prop.address}</span>
                    </div>

                    {/* Category & Units Info */}
                    <div className="text-sm text-gray-500 font-normal flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="line-clamp-1">
                        {subCatName || catName}
                        {prop.totalUnits ? ` • ${prop.totalUnits} ${prop.totalUnits === 1 ? "unit" : "units"}` : ""}
                        {prop.unitSuiteNo ? ` • Unit ${prop.unitSuiteNo}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-300/50">
                    <button
                      type="button"
                      onClick={() => setViewingProperty(prop)}
                      className="flex-1 py-2.5 px-3 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(prop)}
                      className="py-2.5 px-3 border border-gray-300 hover:bg-purple-50 text-[#5B1B95] font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProperty(prop)}
                      className="py-2.5 px-3 border border-gray-300 hover:bg-red-50 text-[#E53935] font-semibold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deletingProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 text-[#E53935]">
              <Trash2 className="w-8 h-8 text-[#E53935]" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Property?</h3>
            <p className="text-sm text-gray-500 mb-6 font-normal">
              Are you sure you want to delete <span className="font-semibold text-gray-800">&quot;{deletingProperty.name}&quot;</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeletingProperty(null)}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 bg-[#E53935] hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Property Details Modal */}
      {viewingProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#FFFFFF] rounded-xl p-6 sm:p-8 sm:max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-200 ease-out space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
                <p className="text-xs text-gray-500 font-normal mt-0.5">View complete property information</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProperty(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Property Cover Image & Overlay Badges */}
            <div className="h-56 w-full relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={getPropertyImageUrl(viewingProperty.coverPhoto)}
                alt={viewingProperty.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/prop_1.png";
                }}
              />
              <div className="absolute top-3.5 left-3.5">
                <span className="bg-[#E5D7F6] text-[#5B1B95] border border-[#E1D4F4] font-semibold text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                  <Home className="w-3.5 h-3.5" />
                  {typeof viewingProperty.category === "object" ? viewingProperty.category.name : "Property"}
                </span>
              </div>
              <div className="absolute top-3.5 right-3.5">
                <span
                  className={`font-semibold text-xs px-3 py-1 rounded-full border shadow-xs ${
                    viewingProperty.status === "Active"
                      ? "bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]"
                      : viewingProperty.status === "Pending"
                      ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]"
                      : "bg-gray-200 text-gray-600 border-gray-300"
                  }`}
                >
                  {viewingProperty.status}
                </span>
              </div>
            </div>

            {/* Main Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{viewingProperty.name}</h3>
                <div className="text-sm text-gray-600 font-medium flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{viewingProperty.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50/80 rounded-lg border border-gray-200/80">
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Category</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {typeof viewingProperty.category === "object" ? viewingProperty.category.name : "Category"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Sub-Category</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {typeof viewingProperty.subCategory === "object" ? viewingProperty.subCategory.name : "Standard"}
                  </span>
                </div>
                {viewingProperty.totalUnits !== undefined && (
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">Total Units</span>
                    <span className="text-sm font-semibold text-gray-800">{viewingProperty.totalUnits} Units</span>
                  </div>
                )}
                {viewingProperty.unitSuiteNo && (
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">Unit / Suite</span>
                    <span className="text-sm font-semibold text-gray-800">{viewingProperty.unitSuiteNo}</span>
                  </div>
                )}
                {viewingProperty.floorRange && (
                  <div>
                    <span className="text-xs text-gray-400 font-medium block">Floor Range</span>
                    <span className="text-sm font-semibold text-gray-800">{viewingProperty.floorRange}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Current Status</span>
                  <span className="text-sm font-semibold text-gray-800">{viewingProperty.status}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = viewingProperty;
                  setViewingProperty(null);
                  handleOpenEditModal(target);
                }}
                className="flex-1 py-3 px-4 bg-[#5B1B95] hover:bg-[#4a157a] text-white font-semibold rounded-lg shadow-xs text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Property</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingProperty(null)}
                className="py-3 px-5 bg-[#EBEBEB] hover:bg-gray-300/80 text-gray-800 font-semibold rounded-lg text-sm sm:text-base transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Property Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#FFFFFF] rounded-lg p-6 sm:p-8 sm:max-w-2xl w-full shadow-2xl max-h-[94vh] overflow-y-auto custom-scrollbar border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-200 ease-out">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Property Details" : "Add New Property"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Property Type Switcher */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Property Type
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("residential")}
                    className={`py-3 px-3 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      selectedCategoryType === "residential"
                        ? "border-2 border-[#5B1B95] bg-[#F2E7FC] text-[#5B1B95]"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>Residential</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange("commercial")}
                    className={`py-3 px-3 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      selectedCategoryType === "commercial"
                        ? "border-2 border-[#5B1B95] bg-[#F2E7FC] text-[#5B1B95]"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Commercial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange("mixed-use")}
                    className={`py-3 px-3 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      selectedCategoryType === "mixed-use"
                        ? "border-2 border-[#5B1B95] bg-[#F2E7FC] text-[#5B1B95]"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Mixed-use</span>
                  </button>
                </div>
              </div>

              {/* Sub-Category Dropdown */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Sub-Category *
                </label>
                <Select
                  value={selectedSubCategoryId || undefined}
                  onValueChange={(val) => {
                    setSelectedSubCategoryId(val);
                    setErrors((prev) => ({ ...prev, subCategory: "" }));
                  }}
                  disabled={isSubCatsLoading}
                >
                  <SelectTrigger className="w-full h-[48px] px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer shadow-none">
                    <SelectValue placeholder={isSubCatsLoading ? "Loading sub-categories..." : "Select Sub-Category"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-lg border border-gray-200 shadow-lg z-[60]">
                    {subCategories.length > 0 ? (
                      subCategories.map((cat) => (
                        <SelectItem key={cat._id} className="py-2.5 cursor-pointer" value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {isSubCatsLoading ? "Loading sub-categories..." : "No sub-categories available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.subCategory && <p className="text-xs text-red-500 mt-1">{errors.subCategory}</p>}
              </div>

              {/* Property Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  {selectedCategoryType === "commercial" ? "Building / Plaza Name *" : "Property Name *"}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Sunset Apartments"
                  className={`w-full px-4 py-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                    errors.name ? "border-red-500 bg-red-50/20" : "border-gray-300 focus:border-[#5B1B95]"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Property / Building Address */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  {selectedCategoryType === "commercial" ? "Building Address *" : "Property Address *"}
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => {
                    setFormAddress(e.target.value);
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="Full property address"
                  className={`w-full px-4 py-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                    errors.address ? "border-red-500 bg-red-50/20" : "border-gray-300 focus:border-[#5B1B95]"
                  }`}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              {/* Unit / Suite # & Total Units (2 Cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Unit / Suite #
                  </label>
                  <input
                    type="text"
                    value={formUnitNumber}
                    onChange={(e) => setFormUnitNumber(e.target.value)}
                    placeholder="e.g. Suite 402, Unit 1A"
                    className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5B1B95] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Total Number of Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalUnits}
                    onChange={(e) => setFormTotalUnits(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5B1B95] transition-all"
                  />
                </div>
              </div>

              {/* Floor Range & Status (2 Cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Floor Range
                  </label>
                  <input
                    type="text"
                    value={formFloorRange}
                    onChange={(e) => setFormFloorRange(e.target.value)}
                    placeholder="e.g. Floors 1-5"
                    className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5B1B95] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                    Status
                  </label>
                  <Select
                    value={formStatus}
                    onValueChange={(val) => setFormStatus(val as PropertyStatus)}
                  >
                    <SelectTrigger className="w-full h-[48px] py-5.5 px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-sm text-gray-900 focus:outline-none transition-all cursor-pointer shadow-none">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-lg border border-gray-200 shadow-lg z-[60]">
                      <SelectItem className="py-2.5" value="Active">Active</SelectItem>
                      <SelectItem className="py-2.5" value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Property Cover Photo Upload Area */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                  Property Cover Photo (Optional)
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
                  className="border-2 border-dashed border-gray-300 bg-gray-50/60 hover:bg-gray-100/60 rounded-xl p-5 text-center cursor-pointer transition-all"
                >
                  {formImagePreview ? (
                    <div className="relative group">
                      <img
                        src={formImagePreview}
                        alt="Property preview"
                        className="w-full h-36 object-cover rounded-lg shadow-xs"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                        Click or drop new image to change
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-600 font-medium">
                        Drag & drop photos here, or{" "}
                        <span className="text-[#5B1B95] font-bold">browse</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        PNG, JPG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 py-3.5 px-4 bg-[#5B1B95] hover:bg-[#4a157a] disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreating || isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  <span>{editingId ? "Save Changes" : "Add Property"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 px-4 bg-[#EBEBEB] hover:bg-gray-300/80 text-gray-800 font-semibold rounded-lg text-sm sm:text-base transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}