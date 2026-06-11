import { create } from 'zustand';
import {
  groupsApi,
  mealPlanApi,
  preferencesApi,
  reportsApi,
  shoppingApi,
  type FamilyGroup,
  type MealPlanItem,
  type ReportSummary,
  type ShoppingItem,
} from '@/lib/api';

interface AppDataState {
  shoppingItems: ShoppingItem[];
  mealPlans: MealPlanItem[];
  familyGroup: FamilyGroup | null;
  reportSummary: ReportSummary | null;
  preferences: string;
  profileName: string;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadAll: (force?: boolean) => Promise<void>;
  setShoppingItems: (items: ShoppingItem[]) => void;
  reset: () => void;
}

let appDataLoadPromise: Promise<void> | null = null;

export const useAppDataStore = create<AppDataState>((set, get) => ({
  shoppingItems: [],
  mealPlans: [],
  familyGroup: null,
  reportSummary: null,
  preferences: '',
  profileName: '',
  isLoading: false,
  hasLoaded: false,
  error: null,

  loadAll: async (force = false) => {
    const state = get();
    if (!force && appDataLoadPromise) return appDataLoadPromise;
    if (!force && (state.isLoading || state.hasLoaded)) return;

    set({ isLoading: true, error: null });

    appDataLoadPromise = (async () => {
      const [
        shoppingResult,
        mealPlansResult,
        groupResult,
        reportResult,
        preferencesResult,
        profileNameResult,
      ] = await Promise.allSettled([
        shoppingApi.getAll(),
        mealPlanApi.getAll(),
        groupsApi.current(),
        reportsApi.summary(),
        preferencesApi.get(),
        preferencesApi.getName(),
      ]);

      const errors = [
        shoppingResult,
        mealPlansResult,
        groupResult,
        reportResult,
        preferencesResult,
        profileNameResult,
      ]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason?.message || 'Không thể tải dữ liệu');

      set({
        shoppingItems: shoppingResult.status === 'fulfilled' ? shoppingResult.value : [],
        mealPlans: mealPlansResult.status === 'fulfilled' ? mealPlansResult.value : [],
        familyGroup: groupResult.status === 'fulfilled' ? groupResult.value.group : null,
        reportSummary: reportResult.status === 'fulfilled' ? reportResult.value : null,
        preferences: preferencesResult.status === 'fulfilled' ? preferencesResult.value.preferences : '',
        profileName: profileNameResult.status === 'fulfilled' ? profileNameResult.value.name : '',
        isLoading: false,
        hasLoaded: true,
        error: errors[0] || null,
      });
    })();

    try {
      await appDataLoadPromise;
    } finally {
      appDataLoadPromise = null;
    }
  },

  setShoppingItems: (items) => set({ shoppingItems: items }),

  reset: () => set({
    shoppingItems: [],
    mealPlans: [],
    familyGroup: null,
    reportSummary: null,
    preferences: '',
    profileName: '',
    isLoading: false,
    hasLoaded: false,
    error: null,
  }),
}));
