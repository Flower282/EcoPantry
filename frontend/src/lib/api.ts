const BASE_URL = 'http://localhost:6390/api';

function getToken(): string | null {
  return localStorage.getItem('ecopantry_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ email: string; token: string; name: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string) =>
    request<{ email: string; token: string; name: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// ─── Ingredients (Inventory) ──────────────────────────
export interface IngredientItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  emoji: string;
  storage: 'cold' | 'freezer' | 'dry';
  daysLeft: number;
  expiryDate: string;
  addedDate: string;
  status: 'fresh' | 'expiring' | 'expired';
  notes?: string;
}

export const ingredientsApi = {
  getAll: () =>
    request<{ ingredients: IngredientItem[] }>('/ingredients'),

  update: (ingredients: IngredientItem[]) =>
    request<{ ingredients: IngredientItem[] }>('/ingredients/update', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    }),
};

// ─── Recipes ──────────────────────────────────────────
export interface RecipeItem {
  id: number;
  title: string;
  instructions: string;
  image_url: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  saved: number[];
  user_uuid?: number | null;
  created_by_name: string;
  createdAt: string;
  // extra frontend fields
  time?: string;
  servings?: string;
  difficulty?: string;
  calories?: string;
  tags?: string[];
}

export const recipesApi = {
  getAll: () =>
    request<RecipeItem[]>('/recipes'),

  getCommunity: () =>
    request<RecipeItem[]>('/recipes/community'),

  getById: (id: number) =>
    request<RecipeItem>(`/recipes/${id}`),

  add: (recipe: Omit<RecipeItem, 'id' | 'saved' | 'createdAt' | 'user_uuid'>) =>
    request<RecipeItem[]>('/recipes/add', {
      method: 'POST',
      body: JSON.stringify({ recipe }),
    }),

  delete: (id: number) =>
    request<RecipeItem[]>(`/recipes/${id}`, { method: 'DELETE' }),

  save: (recipe_id: number) =>
    request<RecipeItem[]>('/recipes/save', {
      method: 'POST',
      body: JSON.stringify({ recipe_id }),
    }),
};

// ─── Shopping List ────────────────────────────────────
export interface ShoppingItem {
  id: number;
  group_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  category?: string;
  emoji?: string;
  added_by?: string;
  updatedAt?: string;
}

export const shoppingApi = {
  getAll: () =>
    request<ShoppingItem[]>('/shopping'),

  add: (item: { item_name: string; quantity: number; unit: string; category?: string; emoji?: string }) =>
    request<ShoppingItem>('/shopping', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  toggle: (id: number) =>
    request<ShoppingItem>(`/shopping/${id}/toggle`, { method: 'PATCH' }),

  delete: (id: number) =>
    request<void>(`/shopping/${id}`, { method: 'DELETE' }),

  clearPurchased: () =>
    request<void>('/shopping/clear-purchased', { method: 'DELETE' }),
};

// ─── Meal Plan ────────────────────────────────────────
export interface MealPlanItem {
  id: number;
  group_id: number;
  recipe_id: number;
  plan_date: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  Recipe?: RecipeItem;
}

export const mealPlanApi = {
  getAll: () =>
    request<MealPlanItem[]>('/meal-plans'),

  add: (plan: { recipe_id: number; plan_date: string; meal_type: string }) =>
    request<MealPlanItem>('/meal-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),

  delete: (id: number) =>
    request<void>(`/meal-plans/${id}`, { method: 'DELETE' }),
};

// ─── Preferences ─────────────────────────────────────
export const preferencesApi = {
  get: () =>
    request<{ preferences: string }>('/preferences'),

  set: (preferences: string) =>
    request<{ preferences: string }>('/preferences/set', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    }),

  getName: () =>
    request<{ name: string }>('/preferences/name'),

  setName: (name: string) =>
    request<{ name: string }>('/preferences/name/set', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
};

// ─── Family Groups ─────────────────────────────────────────
export interface FamilyGroup {
  id: number;
  group_name: string;
  invite_code: string;
  members?: {
    id: number;
    name: string;
    email: string;
    GroupMember?: { role: 'Admin' | 'Member' };
  }[];
}

export const groupsApi = {
  current: () =>
    request<{ group: FamilyGroup }>('/groups/current'),

  create: (group_name: string) =>
    request<{ group: FamilyGroup }>('/groups', {
      method: 'POST',
      body: JSON.stringify({ group_name }),
    }),

  join: (invite_code: string) =>
    request<{ group: FamilyGroup }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code }),
    }),
};

// ─── Reports ───────────────────────────────────────────────
export interface ReportSummary {
  inventory: {
    total: number;
    expiringSoon: number;
    expired: number;
    categoryCounts: Record<string, number>;
    storageCounts: Record<string, number>;
  };
  shopping: {
    total: number;
    purchased: number;
    pending: number;
    categoryCounts: Record<string, number>;
  };
  meals: {
    planned: number;
    savedRecipes: number;
  };
  waste: {
    expiredItems: number;
  };
}

export const reportsApi = {
  summary: () =>
    request<ReportSummary>('/reports/summary'),
};
