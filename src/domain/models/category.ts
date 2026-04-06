export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  supplierId?: string;
  supplierCategoryId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Categoría en árbol - campos de fecha son opcionales para allow static fallback
export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children: CategoryTreeNode[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  
  // First pass: create all nodes with empty children arrays
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });
  
  // Second pass: build tree relationships
  const rootCategories: CategoryTreeNode[] = [];
  
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!;
    
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!;
      parent.children.push(node);
    } else if (!cat.parentId) {
      rootCategories.push(node);
    }
  });
  
  return rootCategories;
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
