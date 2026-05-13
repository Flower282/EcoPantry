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

const initialItems: ShoppingItem[] = [
  { id: 1, name: "Bánh tráng", category: "Thực phẩm khô", checked: false, quantity: "1 gói", addedBy: "Bạn" },
  { id: 2, name: "Bún tươi", category: "Thực phẩm khô", checked: false, quantity: "300g", addedBy: "Bạn" },
  { id: 3, name: "Đậu phộng rang", category: "Thực phẩm khô", checked: true, quantity: "100g", actualQuantity: "100g", addedBy: "Mẹ" },
  { id: 4, name: "Cà rốt", category: "Rau củ", checked: false, quantity: "3 củ", addedBy: "Bạn" },
  { id: 5, name: "Khoai tây", category: "Rau củ", checked: true, quantity: "500g", actualQuantity: "450g", addedBy: "Chị" },
  { id: 6, name: "Cải xanh", category: "Rau củ", checked: false, quantity: "1 bó", note: "Loại không phun thuốc", addedBy: "Mẹ" },
  { id: 7, name: "Thịt bò Mỹ", category: "Thịt cá", checked: false, quantity: "400g", addedBy: "Ba" },
  { id: 8, name: "Cá hồi tươi", category: "Thịt cá", checked: false, quantity: "300g", note: "Loại phi lê", addedBy: "Bạn" },
  { id: 9, name: "Tôm sú", category: "Thịt cá", checked: true, quantity: "200g", actualQuantity: "250g", addedBy: "Mẹ" },
  { id: 10, name: "Nước mắm Phú Quốc", category: "Gia vị", checked: true, quantity: "1 chai", actualQuantity: "1 chai", addedBy: "Mẹ" },
  { id: 11, name: "Dầu ô liu", category: "Gia vị", checked: false, quantity: "250ml", addedBy: "Chị" },
  { id: 12, name: "Sả tươi", category: "Gia vị", checked: false, quantity: "1 bó", addedBy: "Bạn" },
];

type AddItemInput = Omit<ShoppingItem, "id"> & { id?: number };

interface ShoppingListStore {
  items: ShoppingItem[];
  addItem: (item: AddItemInput) => void;
  removeItem: (id: number) => void;
  confirmPurchase: (id: number, actualQuantity: string) => void;
  uncheckItem: (id: number) => void;
  resetForNewList: () => void;
}

export const useShoppingListStore = create<ShoppingListStore>((set) => ({
  items: initialItems,
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
