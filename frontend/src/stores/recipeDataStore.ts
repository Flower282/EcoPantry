import { create } from 'zustand';
import { ingredientsApi, recipesApi, type IngredientItem, type RecipeItem } from '@/lib/api';

interface RecipeDataState {
  savedRecipes: RecipeItem[];
  communityRecipes: RecipeItem[];
  inventoryItems: IngredientItem[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadAll: (force?: boolean) => Promise<void>;
  setSavedRecipes: (recipes: RecipeItem[]) => void;
  setInventoryItems: (items: IngredientItem[]) => void;
  reset: () => void;
}

let recipeDataLoadPromise: Promise<void> | null = null;

export const useRecipeDataStore = create<RecipeDataState>((set, get) => ({
  savedRecipes: [],
  communityRecipes: [],
  inventoryItems: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  loadAll: async (force = false) => {
    const state = get();
    if (!force && recipeDataLoadPromise) return recipeDataLoadPromise;
    if (!force && (state.isLoading || state.hasLoaded)) return;

    set({ isLoading: true, error: null });

    recipeDataLoadPromise = (async () => {
      const [savedRecipes, communityResult, inventoryData] = await Promise.all([
        recipesApi.getAll(),
        recipesApi.getCommunity().catch(() => []),
        ingredientsApi.getAll(),
      ]);

      set({
        savedRecipes,
        communityRecipes: communityResult,
        inventoryItems: inventoryData.ingredients || [],
        isLoading: false,
        hasLoaded: true,
      });
    })();

    try {
      await recipeDataLoadPromise;
    } catch (err) {
      set({
        isLoading: false,
        hasLoaded: true,
        error: (err as Error).message,
      });
      throw err;
    } finally {
      recipeDataLoadPromise = null;
    }
  },

  setSavedRecipes: (recipes) => set({ savedRecipes: recipes }),
  setInventoryItems: (items) => set({ inventoryItems: items }),
  reset: () => set({
    savedRecipes: [],
    communityRecipes: [],
    inventoryItems: [],
    isLoading: false,
    hasLoaded: false,
    error: null,
  }),
}));
