/**
 * Helper to recursively find all descendant category names for a given category name.
 * Useful for filtering products belonging to any sub or sub-sub category.
 */
export const getCategoryDescendants = (categoryName, categories = []) => {
  if (!categoryName) return [];
  const root = categories.find(c => c.name?.toLowerCase() === categoryName.toLowerCase());
  if (!root) return [];
  
  const descendants = [];
  const findChildren = (parentId) => {
    const children = categories.filter(c => Number(c.parent_id) === Number(parentId));
    children.forEach(child => {
      if (child.name) {
        descendants.push(child.name.toLowerCase());
      }
      findChildren(child.id);
    });
  };
  findChildren(root.id);
  return descendants;
};

/**
 * Determines the nesting level of a category (1, 2, or 3).
 * Level 1: Parent
 * Level 2: Subcategory
 * Level 3: Midsub Category
 */
export const getCategoryLevel = (catId, categories = []) => {
  if (!catId) return 1;
  const cat = categories.find(c => Number(c.id) === Number(catId));
  if (!cat || !cat.parent_id) return 1;
  const parent = categories.find(c => Number(c.id) === Number(cat.parent_id));
  if (!parent || !parent.parent_id) return 2;
  return 3;
};
