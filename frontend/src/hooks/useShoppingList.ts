import { useMemo, useState } from "react";
import { toast } from "sonner";

import { compareQty, normaliseWeight, parseQty } from "@/lib/quantity";
import {
  shoppingCategories,
  type ShoppingCategory,
  type ShoppingItem,
  useShoppingListStore,
} from "@/stores/shoppingListStore";

export function useShoppingList() {
  const items = useShoppingListStore((s) => s.items);
  const addItemToStore = useShoppingListStore((s) => s.addItem);
  const removeItemFromStore = useShoppingListStore((s) => s.removeItem);
  const confirmPurchase = useShoppingListStore((s) => s.confirmPurchase);
  const uncheckItem = useShoppingListStore((s) => s.uncheckItem);
  const resetForNewList = useShoppingListStore((s) => s.resetForNewList);

  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>(shoppingCategories[0]);
  const [addingItem, setAddingItem] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [adjustValue, setAdjustValue] = useState("");

  const startAdjust = (item: ShoppingItem) => {
    setAdjustingId(item.id);
    setAdjustValue(item.actualQuantity ?? item.quantity);
  };

  const cancelAdjust = () => {
    setAdjustingId(null);
    setAdjustValue("");
  };

  const confirmAdjust = (id: number) => {
    const value = adjustValue.trim();
    if (!value) {
      toast.error("Vui lòng nhập số lượng thực tế");
      return;
    }

    const it = items.find((i) => i.id === id);
    confirmPurchase(id, value);

    if (it) {
      const cmp = compareQty(it.quantity, value);
      if (cmp?.diff === "match") toast.success(`Đã mua đủ "${it.name}"`);
      else if (cmp?.diff === "under") toast.warning(`"${it.name}" mua thiếu ${cmp.deltaText}`);
      else if (cmp?.diff === "over") toast.info(`"${it.name}" mua dư ${cmp.deltaText}`);
      else toast.success(`Đã đánh dấu "${it.name}"`);
    }

    setAdjustingId(null);
    setAdjustValue("");
  };

  const handleCheckboxClick = (item: ShoppingItem) => {
    if (item.checked) {
      uncheckItem(item.id);
      return;
    }
    if (adjustingId === item.id) cancelAdjust();
    else startAdjust(item);
  };

  const deleteItem = (id: number, name: string) => {
    removeItemFromStore(id);
    toast.success(`Đã xoá "${name}" khỏi danh sách`);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;

    addItemToStore({
      name: newItemName.trim(),
      category: newItemCategory,
      checked: false,
      quantity: newItemQty.trim() || "1",
      addedBy: "Bạn",
    });

    toast.success(`Đã thêm "${newItemName.trim()}" vào ${newItemCategory}`);
    setNewItemName("");
    setNewItemQty("");
    setAddingItem(false);
  };

  const handleShare = async () => {
    const text = `Danh sách đi chợ EcoPantry:\n${items.map((i) => `- ${i.name} (${i.quantity})`).join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Danh sách đi chợ", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Đã sao chép danh sách vào clipboard");
      }
    } catch {
      toast.error("Không thể chia sẻ");
    }
  };

  const itemsByCategory = useMemo(
    () =>
      shoppingCategories
        .map((category) => ({ category, items: items.filter((i) => i.category === category) }))
        .filter((g) => g.items.length > 0),
    [items],
  );

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const categorySummary = useMemo(() => {
    return shoppingCategories
      .map((category) => {
        const catItems = items.filter((i) => i.category === category);
        if (catItems.length === 0) return null;

        const totals: Record<string, { target: number; actual: number; checked: boolean }> = {};
        for (const it of catItems) {
          const t = parseQty(it.quantity);
          if (!t) continue;
          const tn = normaliseWeight(t.value, t.unit);
          const key = tn.display;
          if (!totals[key]) totals[key] = { target: 0, actual: 0, checked: true };
          totals[key].target += tn.value;

          if (it.checked && it.actualQuantity) {
            const a = parseQty(it.actualQuantity);
            if (a) {
              const an = normaliseWeight(a.value, a.unit);
              if (an.display === key) totals[key].actual += an.value;
            }
          } else if (it.checked) {
            totals[key].actual += tn.value;
          } else {
            totals[key].checked = false;
          }
        }

        return {
          category,
          done: catItems.filter((i) => i.checked).length,
          total: catItems.length,
          weights: Object.entries(totals)
            .filter(([, v]) => v.target > 0)
            .map(([unit, v]) => ({ unit, target: v.target, actual: v.actual })),
        };
      })
      .filter(Boolean) as {
      category: ShoppingCategory;
      done: number;
      total: number;
      weights: { unit: string; target: number; actual: number }[];
    }[];
  }, [items]);

  const diffStats = useMemo(() => {
    let under = 0;
    let over = 0;
    let match = 0;
    for (const it of items) {
      if (!it.checked || !it.actualQuantity) continue;
      const c = compareQty(it.quantity, it.actualQuantity);
      if (!c) continue;
      if (c.diff === "under") under++;
      else if (c.diff === "over") over++;
      else match++;
    }
    return { under, over, match };
  }, [items]);

  const completeShopping = () => {
    setCompleted(true);
    toast.success(`${checkedCount} mặt hàng đã chuyển vào Kho thực phẩm`);
  };

  const startNewList = () => {
    resetForNewList();
    setCompleted(false);
    toast.info("Đã khởi tạo danh sách mới");
  };

  return {
    items,
    categories: shoppingCategories,
    itemsByCategory,
    categorySummary,
    checkedCount,
    totalCount,
    progress,
    diffStats,

    addingItem,
    setAddingItem,
    completed,
    adjustingId,
    adjustValue,
    setAdjustValue,

    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    newItemCategory,
    setNewItemCategory,

    startAdjust,
    cancelAdjust,
    confirmAdjust,
    handleCheckboxClick,
    deleteItem,
    addItem,
    handleShare,
    completeShopping,
    startNewList,
  };
}
