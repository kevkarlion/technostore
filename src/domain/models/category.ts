export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  supplierId?: string;
  supplierCategoryId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryResponseDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}
