import { useState } from 'react';
import { toast } from 'sonner';

interface ShoppingItem {
  id: number;
  name: string;
  category: string;
  checked: boolean;
  quantity: string;          // target, e.g. "400g", "3 củ"
  actualQuantity?: string;   // actual purchased, set on confirm
  note?: string;
  addedBy: string;
}

/* ── Quantity parsing ────────────────────────────────────
   Splits a string like "400g", "1.5kg", "3 củ" into
   { value: number, unit: string }. Returns null if not parseable. */
function parseQty(s: string): { value: number; unit: string } | null {
  const m = s.trim().match(/^([\d.,]+)\s*([a-zA-ZÀ-ỹ%]+.*)?$/);
  if (!m) return null;
  const value = parseFloat(m[1].replace(',', '.'));
  if (isNaN(value)) return null;
  const unit = (m[2] || '').trim().toLowerCase();
  return { value, unit };
}

/* Normalise weight/volume units to grams or ml for comparison */
function normaliseWeight(v: number, unit: string): { value: number; base: 'g' | 'ml' | 'other'; display: string } {
  const u = unit.toLowerCase();
  if (u === 'kg')      return { value: v * 1000, base: 'g',  display: 'g' };
  if (u === 'g')       return { value: v,        base: 'g',  display: 'g' };
  if (u === 'l')       return { value: v * 1000, base: 'ml', display: 'ml' };
  if (u === 'ml')      return { value: v,        base: 'ml', display: 'ml' };
  return { value: v, base: 'other', display: u };
}

type Diff = 'match' | 'under' | 'over';
function compareQty(target: string, actual: string): { diff: Diff; deltaText: string } | null {
  const t = parseQty(target);
  const a = parseQty(actual);
  if (!t || !a) return null;
  const tn = normaliseWeight(t.value, t.unit);
  const an = normaliseWeight(a.value, a.unit);
  if (tn.base !== an.base || tn.base === 'other' && t.unit !== a.unit) {
    // Different unit families — fall back to raw value compare
    if (a.value === t.value) return { diff: 'match', deltaText: '' };
    return a.value < t.value
      ? { diff: 'under', deltaText: `−${(t.value - a.value).toLocaleString('vi-VN')} ${t.unit}` }
      : { diff: 'over',  deltaText: `+${(a.value - t.value).toLocaleString('vi-VN')} ${a.unit}` };
  }
  if (an.value === tn.value) return { diff: 'match', deltaText: '' };
  const delta = Math.abs(an.value - tn.value);
  const deltaText = `${delta.toLocaleString('vi-VN')} ${an.display}`;
  return an.value < tn.value
    ? { diff: 'under', deltaText: `−${deltaText}` }
    : { diff: 'over',  deltaText: `+${deltaText}` };
}

const familyMembers = [
  { initials: 'B',  name: 'Bạn', color: 'from-green-400 to-green-600',   online: true },
  { initials: 'M',  name: 'Mẹ',  color: 'from-pink-400 to-pink-600',     online: true },
  { initials: 'Ba', name: 'Ba',  color: 'from-blue-400 to-blue-600',     online: false },
  { initials: 'C',  name: 'Chị', color: 'from-purple-400 to-purple-600', online: true },
];

const initialItems: ShoppingItem[] = [
  { id: 1, name: 'Bánh tráng', category: 'Thực phẩm khô', checked: false, quantity: '1 gói', addedBy: 'Bạn' },
  { id: 2, name: 'Bún tươi', category: 'Thực phẩm khô', checked: false, quantity: '300g', addedBy: 'Bạn' },
  { id: 3, name: 'Đậu phộng rang', category: 'Thực phẩm khô', checked: true, quantity: '100g', actualQuantity: '100g', addedBy: 'Mẹ' },
  { id: 4, name: 'Cà rốt', category: 'Rau củ', checked: false, quantity: '3 củ', addedBy: 'Bạn' },
  { id: 5, name: 'Khoai tây', category: 'Rau củ', checked: true, quantity: '500g', actualQuantity: '450g', addedBy: 'Chị' },
  { id: 6, name: 'Cải xanh', category: 'Rau củ', checked: false, quantity: '1 bó', note: 'Loại không phun thuốc', addedBy: 'Mẹ' },
  { id: 7, name: 'Thịt bò Mỹ', category: 'Thịt cá', checked: false, quantity: '400g', addedBy: 'Ba' },
  { id: 8, name: 'Cá hồi tươi', category: 'Thịt cá', checked: false, quantity: '300g', note: 'Loại phi lê', addedBy: 'Bạn' },
  { id: 9, name: 'Tôm sú', category: 'Thịt cá', checked: true, quantity: '200g', actualQuantity: '250g', addedBy: 'Mẹ' },
  { id: 10, name: 'Nước mắm Phú Quốc', category: 'Gia vị', checked: true, quantity: '1 chai', actualQuantity: '1 chai', addedBy: 'Mẹ' },
  { id: 11, name: 'Dầu ô liu', category: 'Gia vị', checked: false, quantity: '250ml', addedBy: 'Chị' },
  { id: 12, name: 'Sả tươi', category: 'Gia vị', checked: false, quantity: '1 bó', addedBy: 'Bạn' },
];

const categories = ['Rau củ', 'Thịt cá', 'Thực phẩm khô', 'Gia vị'];

/* Small visual badge for diff state */
function DiffBadge({ diff, deltaText }: { diff: Diff; deltaText: string }) {
  if (diff === 'match') return (
    <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
      Đủ
    </span>
  );
  if (diff === 'under') return (
    <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
      ⚠ Thiếu {deltaText}
    </span>
  );
  return (
    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
      + Dư {deltaText}
    </span>
  );
}

export function ShoppingTab() {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Rau củ');
  const [addingItem, setAddingItem] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Weight-adjust state: which item is currently being adjusted + draft value
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [adjustValue, setAdjustValue] = useState('');

  const startAdjust = (item: ShoppingItem) => {
    setAdjustingId(item.id);
    setAdjustValue(item.actualQuantity ?? item.quantity);
  };

  const cancelAdjust = () => {
    setAdjustingId(null);
    setAdjustValue('');
  };

  const confirmAdjust = (id: number) => {
    const value = adjustValue.trim();
    if (!value) { toast.error('Vui lòng nhập số lượng thực tế'); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: true, actualQuantity: value } : i));
    const it = items.find(i => i.id === id);
    if (it) {
      const cmp = compareQty(it.quantity, value);
      if (cmp?.diff === 'match')      toast.success(`Đã mua đủ "${it.name}"`);
      else if (cmp?.diff === 'under') toast.warning(`"${it.name}" mua thiếu ${cmp.deltaText}`);
      else if (cmp?.diff === 'over')  toast.info(`"${it.name}" mua dư ${cmp.deltaText}`);
      else                            toast.success(`Đã đánh dấu "${it.name}"`);
    }
    setAdjustingId(null);
    setAdjustValue('');
  };

  const uncheckItem = (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: false, actualQuantity: undefined } : i));
  };

  const handleCheckboxClick = (item: ShoppingItem) => {
    if (item.checked) { uncheckItem(item.id); return; }
    if (adjustingId === item.id) cancelAdjust();
    else startAdjust(item);
  };

  const deleteItem = (id: number, name: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success(`Đã xoá "${name}" khỏi danh sách`);
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: ShoppingItem = {
      id: Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      checked: false,
      quantity: newItemQty.trim() || '1',
      addedBy: 'Bạn',
    };
    setItems(prev => [...prev, newItem]);
    toast.success(`Đã thêm "${newItem.name}" vào ${newItemCategory}`);
    setNewItemName('');
    setNewItemQty('');
    setAddingItem(false);
  };

  const handleShare = async () => {
    const text = `Danh sách đi chợ EcoPantry:\n${items.map(i => `- ${i.name} (${i.quantity})`).join('\n')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Danh sách đi chợ', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Đã sao chép danh sách vào clipboard');
      }
    } catch {
      toast.error('Không thể chia sẻ');
    }
  };

  const itemsByCategory = categories
    .map(cat => ({ category: cat, items: items.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0);

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  /* ── Weight-aware category summary ──
     For each category, aggregate target vs. actual by unit family (g / ml / other) */
  const categorySummary = categories.map((cat) => {
    const catItems = items.filter(i => i.category === cat);
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
      category: cat,
      done: catItems.filter(i => i.checked).length,
      total: catItems.length,
      weights: Object.entries(totals)
        .filter(([, v]) => v.target > 0)
        .map(([unit, v]) => ({ unit, target: v.target, actual: v.actual })),
    };
  }).filter(Boolean) as { category: string; done: number; total: number; weights: { unit: string; target: number; actual: number }[] }[];

  if (completed) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-96 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600" style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>✓</span>
        </div>
        <div>
          <h2 className="text-gray-900" style={{ fontSize: '1.3rem', fontWeight: 700 }}>Mua sắm hoàn tất!</h2>
          <p className="text-gray-500 mt-2" style={{ fontSize: '0.85rem' }}>
            {checkedCount} mặt hàng đã được chuyển vào kho thực phẩm.
          </p>
        </div>
        <button
          onClick={() => { setItems(prev => prev.map(i => ({ ...i, checked: false, actualQuantity: undefined }))); setCompleted(false); toast.info('Đã khởi tạo danh sách mới'); }}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          style={{ fontSize: '0.85rem', fontWeight: 500 }}
        >
          Tạo danh sách mới
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-3xl space-y-6">

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-gray-900" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Danh sách hôm nay</h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.8rem' }}>
                  {checkedCount}/{totalCount} mặt hàng đã mua
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {familyMembers.map((member, i) => (
                    <div
                      key={member.initials}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${member.color} border-2 border-white flex items-center justify-center relative`}
                      style={{ zIndex: familyMembers.length - i }}
                      title={member.name}
                    >
                      <span className="text-white" style={{ fontSize: '0.65rem', fontWeight: 700 }}>{member.initials}</span>
                      {member.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={handleShare} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  Chia sẻ
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500" style={{ fontSize: '0.75rem' }}>Tiến độ mua sắm</span>
                <span className="text-green-600" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(progress)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-gray-400" style={{ fontSize: '0.68rem' }}>{familyMembers.filter(m => m.online).length} thành viên đang online</span>
                <span className="text-gray-400" style={{ fontSize: '0.68rem' }}>{totalCount - checkedCount} còn lại</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-5">
            {itemsByCategory.map(({ category, items: catItems }) => {
              const catChecked = catItems.filter(i => i.checked).length;
              return (
                <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-gray-800" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400" style={{ fontSize: '0.72rem' }}>{catChecked}/{catItems.length}</span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${catItems.length > 0 ? (catChecked / catItems.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {catItems.map((item) => {
                      const cmp = item.actualQuantity ? compareQty(item.quantity, item.actualQuantity) : null;
                      const isAdjusting = adjustingId === item.id;
                      return (
                        <div key={item.id} className={`group transition-colors ${item.checked ? 'bg-gray-50/60' : isAdjusting ? 'bg-green-50/40' : 'hover:bg-gray-50/40'}`}>
                          <div className="flex items-center gap-4 px-5 py-3.5">
                            <button
                              onClick={() => handleCheckboxClick(item)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                item.checked ? 'bg-green-600 border-green-600'
                                  : isAdjusting ? 'bg-white border-green-500'
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {item.checked && <span className="text-white" style={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>✓</span>}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className={item.checked ? 'line-through text-gray-400' : 'text-gray-800'} style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-gray-400" style={{ fontSize: '0.68rem' }}>
                                  Mục tiêu: <span className="text-gray-600">{item.quantity}</span>
                                </span>
                                {item.actualQuantity && (
                                  <>
                                    <span className="text-gray-200">·</span>
                                    <span className="text-gray-400" style={{ fontSize: '0.68rem' }}>
                                      Thực tế: <span className="text-gray-700" style={{ fontWeight: 600 }}>{item.actualQuantity}</span>
                                    </span>
                                  </>
                                )}
                                {cmp && <DiffBadge diff={cmp.diff} deltaText={cmp.deltaText} />}
                                {item.note && (
                                  <>
                                    <span className="text-gray-200">·</span>
                                    <span className="text-blue-500" style={{ fontSize: '0.68rem' }}>{item.note}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.checked && (
                                <button
                                  onClick={() => startAdjust(item)}
                                  className="px-2 py-1 text-gray-500 hover:text-green-600 rounded transition-colors"
                                  style={{ fontSize: '0.7rem', fontWeight: 500 }}
                                >
                                  Sửa SL
                                </button>
                              )}
                              <span className="text-gray-300" style={{ fontSize: '0.68rem' }}>+{item.addedBy}</span>
                              <button
                                onClick={() => deleteItem(item.id, item.name)}
                                className="px-2 py-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                                style={{ fontSize: '0.72rem' }}
                              >
                                Xoá
                              </button>
                            </div>
                          </div>

                          {/* Inline adjust panel */}
                          {isAdjusting && (
                            <div className="px-5 pb-4 pt-1 ml-9 border-l-2 border-green-300 mb-2">
                              <div className="bg-white border border-green-200 rounded-lg p-3 shadow-sm">
                                <p className="text-gray-700 mb-2" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                                  Xác nhận khối lượng thực tế
                                </p>
                                <p className="text-gray-500 mb-3" style={{ fontSize: '0.7rem' }}>
                                  Mục tiêu ban đầu: <span className="text-gray-700" style={{ fontWeight: 600 }}>{item.quantity}</span>. Nhập số lượng bạn thực sự đã mua để hệ thống tính toán chính xác.
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  <input
                                    autoFocus
                                    type="text"
                                    placeholder={`VD: ${item.quantity}`}
                                    value={adjustValue}
                                    onChange={(e) => setAdjustValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') confirmAdjust(item.id);
                                      if (e.key === 'Escape') cancelAdjust();
                                    }}
                                    className="flex-1 min-w-[140px] px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
                                    style={{ fontSize: '0.82rem' }}
                                  />
                                  {/* Quick presets */}
                                  <div className="flex gap-1">
                                    {(() => {
                                      const t = parseQty(item.quantity);
                                      if (!t) return null;
                                      const presets = [0.5, 1, 1.25].map(mult => {
                                        const v = +(t.value * mult).toFixed(2);
                                        return `${v}${t.unit ? (t.unit.length === 1 || ['g','kg','ml','l'].includes(t.unit) ? t.unit : ' ' + t.unit) : ''}`;
                                      });
                                      return presets.map(p => (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() => setAdjustValue(p)}
                                          className="px-2 py-1 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                                          style={{ fontSize: '0.7rem' }}
                                        >
                                          {p}
                                        </button>
                                      ));
                                    })()}
                                  </div>
                                  <button
                                    onClick={() => confirmAdjust(item.id)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    style={{ fontSize: '0.78rem', fontWeight: 600 }}
                                  >
                                    Xác nhận
                                  </button>
                                  <button
                                    onClick={cancelAdjust}
                                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                                    style={{ fontSize: '0.78rem' }}
                                  >
                                    Huỷ
                                  </button>
                                </div>
                                {/* Live preview */}
                                {adjustValue.trim() && (() => {
                                  const cmp = compareQty(item.quantity, adjustValue.trim());
                                  if (!cmp) return null;
                                  return (
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="text-gray-500" style={{ fontSize: '0.7rem' }}>Trạng thái:</span>
                                      <DiffBadge diff={cmp.diff} deltaText={cmp.deltaText} />
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add */}
          {addingItem ? (
            <div className="bg-white rounded-xl border border-green-300 p-4 space-y-3">
              <p className="text-gray-700" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thêm mặt hàng mới</p>
              <div className="flex gap-3 flex-wrap">
                <input
                  autoFocus
                  type="text"
                  placeholder="Tên mặt hàng..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
                  style={{ fontSize: '0.82rem' }}
                />
                <input
                  type="text"
                  placeholder="SL (VD: 500g)"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  className="w-28 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                  style={{ fontSize: '0.82rem' }}
                />
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-200 text-gray-700"
                  style={{ fontSize: '0.8rem' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addItem} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  Thêm vào danh sách
                </button>
                <button onClick={() => setAddingItem(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontSize: '0.8rem' }}>
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-green-300 hover:text-green-600 hover:bg-green-50/30 transition-all"
              style={{ fontSize: '0.82rem', fontWeight: 500 }}
            >
              + Thêm mặt hàng mới
            </button>
          )}

          <div className="h-20" />
        </div>
      </div>

      {/* Side panel */}
      <div className="w-72 border-l border-gray-200 bg-white flex flex-col shrink-0 p-5 space-y-5 overflow-y-auto">
        <h3 className="text-gray-900" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tóm tắt</h3>

        {/* Per-category breakdown with weight totals */}
        <div className="space-y-3">
          {categorySummary.map(({ category, done, total, weights }) => {
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <div key={category}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600" style={{ fontSize: '0.78rem' }}>{category}</span>
                  <span className="text-gray-400" style={{ fontSize: '0.72rem' }}>{done}/{total}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {weights.map((w) => {
                  if (w.unit === 'g' || w.unit === 'ml') {
                    const tDisp = w.target >= 1000 ? `${(w.target / 1000).toFixed(2)} ${w.unit === 'g' ? 'kg' : 'l'}` : `${w.target.toFixed(0)} ${w.unit}`;
                    const aDisp = w.actual >= 1000 ? `${(w.actual / 1000).toFixed(2)} ${w.unit === 'g' ? 'kg' : 'l'}` : `${w.actual.toFixed(0)} ${w.unit}`;
                    const diff = w.actual - w.target;
                    const color = diff === 0 ? 'text-gray-500' : diff < 0 ? 'text-yellow-700' : 'text-blue-700';
                    return (
                      <div key={w.unit} className="flex justify-between mt-1">
                        <span className="text-gray-400" style={{ fontSize: '0.66rem' }}>
                          Đã mua / Mục tiêu
                        </span>
                        <span className={color} style={{ fontSize: '0.66rem', fontWeight: 600 }}>
                          {aDisp} / {tDisp}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500" style={{ fontSize: '0.78rem' }}>Đã mua</span>
            <span className="text-green-600" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{checkedCount} mặt hàng</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500" style={{ fontSize: '0.78rem' }}>Còn lại</span>
            <span className="text-orange-600" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{totalCount - checkedCount} mặt hàng</span>
          </div>
          {(() => {
            // Aggregate diff stats across all checked items
            let under = 0, over = 0, match = 0;
            for (const it of items) {
              if (!it.checked || !it.actualQuantity) continue;
              const c = compareQty(it.quantity, it.actualQuantity);
              if (!c) continue;
              if (c.diff === 'under') under++;
              else if (c.diff === 'over') over++;
              else match++;
            }
            if (under + over + match === 0) return null;
            return (
              <div className="pt-2 border-t border-gray-50 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500" style={{ fontSize: '0.72rem' }}>Đủ định lượng</span>
                  <span className="text-green-600" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{match}</span>
                </div>
                {under > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500" style={{ fontSize: '0.72rem' }}>⚠ Thiếu</span>
                    <span className="text-yellow-700" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{under}</span>
                  </div>
                )}
                {over > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500" style={{ fontSize: '0.72rem' }}>+ Dư</span>
                    <span className="text-blue-700" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{over}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="bg-green-50 rounded-xl border border-green-100 p-3 space-y-2">
          <p className="text-green-800" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {familyMembers.filter(m => m.online).length} thành viên đang online
          </p>
          {familyMembers.map(m => (
            <div key={m.initials} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                <span className="text-white" style={{ fontSize: '0.55rem', fontWeight: 700 }}>{m.initials}</span>
              </div>
              <span className="text-gray-700" style={{ fontSize: '0.75rem' }}>{m.name}</span>
              {m.online && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => { setCompleted(true); toast.success(`${checkedCount} mặt hàng đã chuyển vào Kho thực phẩm`); }}
          disabled={checkedCount === 0}
          className={`w-full p-4 rounded-xl transition-all ${checkedCount > 0 ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          style={{ fontSize: '0.85rem', fontWeight: 600 }}
        >
          Hoàn tất — Chuyển vào kho →
        </button>
        {checkedCount > 0 && (
          <p className="text-center text-gray-400" style={{ fontSize: '0.68rem' }}>
            {checkedCount} mặt hàng sẽ được đồng bộ vào Kho thực phẩm
          </p>
        )}
      </div>
    </div>
  );
}
