import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { ingredientsApi, type IngredientItem } from '@/lib/api';

type StorageArea = 'cold' | 'freezer' | 'dry';
type StatusFilter = 'all' | 'fresh' | 'expiring' | 'expired';

const storageAreas: { id: StorageArea; label: string; temp: string }[] = [
  { id: 'cold',    label: 'Ngăn mát',    temp: '2–8°C' },
  { id: 'freezer', label: 'Ngăn đông',   temp: '-18°C' },
  { id: 'dry',     label: 'Tủ đồ khô',   temp: 'Nhiệt độ phòng' },
];

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: 'all',      label: 'Tất cả' },
  { id: 'fresh',    label: 'Còn hạn' },
  { id: 'expiring', label: 'Sắp hết hạn' },
  { id: 'expired',  label: 'Đã hết hạn' },
];

const categoryOptions = ['Rau củ', 'Thịt cá', 'Hải sản', 'Sữa & trứng', 'Ngũ cốc', 'Gia vị', 'Thực phẩm chế biến'];

function computeStatus(daysLeft: number): IngredientItem['status'] {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'expiring';
  return 'fresh';
}

function ExpiryBar({ daysLeft, status }: { daysLeft: number; status: IngredientItem['status'] }) {
  if (status === 'expired') {
    return (
      <div className="space-y-1">
        <div className="h-1.5 bg-red-200 rounded-full w-full relative overflow-hidden">
          <div className="h-full bg-red-500 rounded-full w-full" />
        </div>
        <p className="text-red-600" style={{ fontSize: '0.68rem', fontWeight: 500 }}>
          Hết hạn {Math.abs(daysLeft)} ngày trước
        </p>
      </div>
    );
  }
  const maxDays = daysLeft > 365 ? 365 : daysLeft > 90 ? 180 : daysLeft > 30 ? 90 : daysLeft > 7 ? 30 : 7;
  const pct = Math.min(100, Math.max(3, (daysLeft / maxDays) * 100));
  const barColor = status === 'expiring' ? (daysLeft <= 1 ? 'bg-red-500' : 'bg-orange-400') : 'bg-green-500';
  const textColor = status === 'expiring' ? (daysLeft <= 1 ? 'text-red-600' : 'text-orange-600') : 'text-gray-500';
  const label = daysLeft <= 0 ? 'Hôm nay!' : daysLeft === 1 ? '1 ngày' : daysLeft < 30 ? `${daysLeft} ngày` : daysLeft < 365 ? `${Math.round(daysLeft / 30)} tháng` : '1+ năm';
  return (
    <div className="space-y-1">
      <div className="h-1.5 bg-gray-100 rounded-full w-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className={textColor} style={{ fontSize: '0.68rem', fontWeight: 500 }}>Còn {label}</p>
    </div>
  );
}

function StatusBadge({ status, daysLeft }: { status: IngredientItem['status']; daysLeft: number }) {
  if (status === 'expired') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Hết hạn</span>;
  if (status === 'expiring') return <span className={`px-2 py-0.5 rounded-full ${daysLeft <= 1 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>{daysLeft <= 1 ? 'Hôm nay' : `${daysLeft}n`}</span>;
  return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Tốt</span>;
}

export function InventoryPage({ initialSearch = '', onClearSearch }: { initialSearch?: string; onClearSearch?: () => void }) {
  const [items, setItems] = useState<IngredientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<StorageArea>('cold');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<IngredientItem | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'Rau củ', quantity: '', unit: 'gram',
    emoji: '🥦', storage: 'cold' as StorageArea, daysLeft: 7,
  });

  // ── Fetch from API ──────────────────────────────────
  const applyItems = (sourceItems: IngredientItem[]) => {
    setItems(sourceItems.map((item) => ({
      ...item,
      status: computeStatus(item.daysLeft),
    })));
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await ingredientsApi.getAll();
      applyItems(data.ingredients || []);
    } catch (err) {
      toast.error('Không thể tải danh sách thực phẩm: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // Sync search from header
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setSelectedStatus('all');
      onClearSearch?.();
    }
  }, [initialSearch]);

  // Auto-switch to the corresponding storage tab when searching
  useEffect(() => {
    if (searchQuery.trim() && items.length > 0) {
      const q = searchQuery.toLowerCase();
      const firstMatch = items.find(item => 
        item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      );
      if (firstMatch && firstMatch.storage !== selectedStorage) {
        setSelectedStorage(firstMatch.storage);
      }
    }
  }, [searchQuery, items]);

  // ── Persist to API ──────────────────────────────────
  const persistItems = async (newItems: IngredientItem[]) => {
    setIsSaving(true);
    try {
      await ingredientsApi.update(newItems);
    } catch (err) {
      toast.error('Lưu thất bại: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Filter ──────────────────────────────────────────
  const isSearching = searchQuery.trim().length > 0;
  const filtered = items.filter((item) => {
    const matchStorage = isSearching || item.storage === selectedStorage;
    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStorage && matchStatus && matchSearch;
  });

  const storageCounts = (id: StorageArea) => items.filter(i => i.storage === id).length;
  const currentStorage = storageAreas.find(s => s.id === selectedStorage)!;

  const openAdd = () => {
    setEditItem(null);
    setIsSaving(false);
    setForm({ name: '', category: 'Rau củ', quantity: '', unit: 'gram', emoji: '🥦', storage: selectedStorage, daysLeft: 7 });
    setAddOpen(true);
  };

  const openEdit = (item: IngredientItem) => {
    setEditItem(item);
    setIsSaving(false);
    const safeDaysLeft = Number.isFinite(item.daysLeft) ? item.daysLeft : 7;
    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, emoji: item.emoji, storage: item.storage, daysLeft: safeDaysLeft });
    setAddOpen(true);
    setOpenMenu(null);
  };

  const isMissingIngredientError = (error: unknown) => {
    const message = (error as Error).message || '';
    return message.includes('404') || message.includes('No such ingredient');
  };

  const handleSave = async () => {
    if (isSaving) {
      console.log('[handleSave] blocked: isSaving=true');
      return;
    }

    if (!form.name.trim() || !String(form.quantity).trim()) {
      toast.error('Vui lòng nhập tên và số lượng');
      return;
    }

    const safeDaysLeft = Number.isFinite(Number(form.daysLeft)) ? Number(form.daysLeft) : 7;
    const safeForm = { ...form, daysLeft: safeDaysLeft };
    console.log('[handleSave] start', { editItem: editItem?.id, safeForm });

    setIsSaving(true);
    try {
      if (editItem) {
        console.log('[handleSave] calling updateOne id=', editItem.id);
        const optimistic = { ...editItem, ...safeForm, status: computeStatus(safeForm.daysLeft) };
        let newItems: IngredientItem[];
        try {
          const result = await ingredientsApi.updateOne(editItem.id, safeForm);
          console.log('[handleSave] updateOne success', result);
          const updated = { ...result.ingredient, status: computeStatus(result.ingredient.daysLeft) };
          newItems = items.map(i => i.id === editItem.id ? updated : i);
        } catch (err) {
          console.warn('[handleSave] updateOne failed:', (err as Error).message, 'isMissing:', isMissingIngredientError(err));
          if (!isMissingIngredientError(err)) throw err;
          newItems = items.map(i => i.id === editItem.id ? optimistic : i);
          const result = await ingredientsApi.update(newItems);
          newItems = (result.ingredients || newItems).map((item) => ({ ...item, status: computeStatus(item.daysLeft) }));
        }
        setItems(newItems);
        toast.success(`Đã cập nhật "${safeForm.name}"`);
      } else {
        const result = await ingredientsApi.add(safeForm);
        const created = { ...result.ingredient, status: computeStatus(result.ingredient.daysLeft) };
        const newItems = [created, ...items];
        setItems(newItems);
        toast.success(`Đã thêm "${safeForm.name}" vào ${storageAreas.find(s => s.id === safeForm.storage)!.label}`);
      }
      setAddOpen(false);
      setEditItem(null);
    } catch (err) {
      console.error('[handleSave] OUTER ERROR:', err);
      toast.error('Lưu thất bại: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('[handleSaveSubmit] form submit fired, isSaving=', isSaving, 'editItem=', editItem?.id);
    void handleSave();
  };

  const handleSaveClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void handleSave();
  };

  const handleDelete = async (id: string, name: string) => {
    setIsSaving(true);
    try {
      await ingredientsApi.delete(id);
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      setOpenMenu(null);
      toast.success(`Đã xoá "${name}"`);
    } catch (err) {
      toast.error('Xoá thất bại: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="ml-3 text-slate-500">Đang tải kho thực phẩm...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Kho thực phẩm</h2>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.8rem' }}>
            {items.length} mặt hàng · {items.filter(i => i.status === 'expiring').length} sắp hết hạn · {items.filter(i => i.status === 'expired').length} đã hết hạn
            {isSaving && <span className="ml-2 inline-flex items-center gap-1 text-emerald-600"><Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchItems} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Làm mới">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
            + Thêm thực phẩm
          </button>
        </div>
      </div>

      {/* Storage tabs */}
      <div className="grid grid-cols-3 gap-3">
        {storageAreas.map((area) => {
          const isActive = selectedStorage === area.id;
          const count = storageCounts(area.id);
          return (
            <button
              key={area.id}
              onClick={() => setSelectedStorage(area.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-12 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <p className={isActive ? 'text-green-900' : 'text-gray-700'} style={{ fontSize: '0.85rem', fontWeight: 600 }}>{area.label}</p>
                  <p className={isActive ? 'text-green-600' : 'text-gray-400'} style={{ fontSize: '0.7rem' }}>{count} mặt hàng · {area.temp}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder={`Tìm trong ${currentStorage.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
            style={{ fontSize: '0.8rem' }}
          />
        </div>
        <div className="flex items-center gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedStatus === f.id
                  ? f.id === 'expired' ? 'bg-red-600 text-white'
                    : f.id === 'expiring' ? 'bg-orange-500 text-white'
                    : f.id === 'fresh' ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="ml-auto text-gray-400" style={{ fontSize: '0.75rem' }}>{filtered.length} kết quả</p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="col-span-4"><span className="text-gray-500 uppercase tracking-wider" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Thực phẩm</span></div>
          <div className="col-span-2"><span className="text-gray-500 uppercase tracking-wider" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Danh mục</span></div>
          <div className="col-span-2"><span className="text-gray-500 uppercase tracking-wider" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Số lượng</span></div>
          <div className="col-span-3"><span className="text-gray-500 uppercase tracking-wider" style={{ fontSize: '0.65rem', fontWeight: 600 }}>Hạn sử dụng</span></div>
          <div className="col-span-1" />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>
              {items.length === 0 ? 'Kho trống — hãy thêm thực phẩm đầu tiên!' : 'Không tìm thấy thực phẩm nào'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item) => (
              <div key={item.id} className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50/60 transition-colors ${item.status === 'expired' ? 'bg-red-50/30' : item.status === 'expiring' ? 'bg-orange-50/20' : ''}`}>
                <div className="col-span-4 flex items-center gap-3">

                  <div>
                    <p className={item.status === 'expired' ? 'text-gray-400 line-through' : 'text-gray-900'} style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {item.name}
                    </p>
                    <p className="text-gray-400 flex items-center gap-1.5" style={{ fontSize: '0.7rem' }}>
                      <span>Thêm {item.addedDate}</span>
                      {isSearching && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded" style={{ fontSize: '0.62rem', fontWeight: 500 }}>
                          {storageAreas.find(s => s.id === item.storage)?.label}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="col-span-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded" style={{ fontSize: '0.72rem' }}>{item.category}</span>
                </div>

                <div className="col-span-2">
                  <p className="text-gray-700" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                    {item.quantity} <span className="text-gray-400">{item.unit}</span>
                  </p>
                </div>

                <div className="col-span-3">
                  <ExpiryBar daysLeft={item.daysLeft} status={item.status} />
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1">
                  <StatusBadge status={item.status} daysLeft={item.daysLeft} />
                  <div className="relative ml-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === item.id ? null : item.id);
                      }}
                      className="px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ fontSize: '0.95rem', fontWeight: 700 }}
                    >
                      ⋯
                    </button>
                    {openMenu === item.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          style={{ fontSize: '0.78rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(item);
                          }}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          style={{ fontSize: '0.78rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id, item.name);
                          }}
                        >
                          Xoá
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>
            Hiển thị {filtered.length} / {storageCounts(selectedStorage)} mặt hàng trong {currentStorage.label}
          </p>
          <button onClick={openAdd} className="text-gray-500 hover:text-gray-700 transition-colors" style={{ fontSize: '0.75rem' }}>
            + Thêm thực phẩm
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAddOpen(false)}>
          <form
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveSubmit}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-gray-900" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {editItem ? 'Chỉnh sửa thực phẩm' : 'Thêm thực phẩm mới'}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Tên</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Cà chua bi"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200" style={{ fontSize: '0.82rem' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Số lượng</label>
                  <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="500"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200" style={{ fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Đơn vị</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-200" style={{ fontSize: '0.82rem' }}>
                    {['gram', 'kg', 'ml', 'hộp', 'quả', 'cây', 'cái', 'bó', 'gói'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Danh mục</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-200" style={{ fontSize: '0.82rem' }}>
                  {categoryOptions.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Khu vực</label>
                <select value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value as StorageArea })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-200" style={{ fontSize: '0.82rem' }}>
                  {storageAreas.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Còn lại (ngày)</label>
                <input type="number" value={form.daysLeft} onChange={(e) => setForm({ ...form, daysLeft: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200" style={{ fontSize: '0.82rem' }} />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50" style={{ fontSize: '0.82rem' }}>
                Huỷ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                style={{ fontSize: '0.82rem', fontWeight: 500 }}
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editItem ? 'Lưu thay đổi' : 'Thêm vào kho'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
