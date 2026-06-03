import { create } from "zustand";

export const shoppingCategories = [
  "Rau củ",
  "Thịt cá",
  "Thực phẩm khô",
  "Gia vị",
] as const;

export type ShoppingCategory = (typeof shoppingCategories)[number];

export interface ShoppingItem {
  id: number;
  name: string;
  category: ShoppingCategory;
  checked: boolean;
  quantity: string;
  actualQuantity?: string;
  note?: string;
  addedBy: string;
}

type AddItemInput = Omit<ShoppingItem, "id"> & { id?: number };

interface ShoppingListStore {
  items: ShoppingItem[];
  setItems: (items: ShoppingItem[]) => void;
  addItem: (item: AddItemInput) => void;
  removeItem: (id: number) => void;
  confirmPurchase: (id: number, actualQuantity: string) => void;
  uncheckItem: (id: number) => void;
  resetForNewList: () => void;
}

export const useShoppingListStore = create<ShoppingListStore>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => {
    const id = item.id ?? Date.now();
    set((state) => ({ items: [...state.items, { ...item, id }] }));
  },
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  confirmPurchase: (id, actualQuantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, checked: true, actualQuantity } : item,
      ),
    })),
  uncheckItem: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, checked: false, actualQuantity: undefined } : item,
      ),
    })),
  resetForNewList: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, checked: false, actualQuantity: undefined })),
    })),
}));
