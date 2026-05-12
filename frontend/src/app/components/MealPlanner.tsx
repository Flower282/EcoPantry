import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Calendar, Sparkles, Heart, Clock, Plus, X, ChefHat, Users,
  Flame, ChevronLeft, ChevronRight, TrendingUp, Trash2, Search,
  CheckCircle2,
} from 'lucide-react';

/* ─────────────────────────────────────────────────
   Types & Mock Data
───────────────────────────────────────────────── */
type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface InventoryItem {
  name: string;
  daysLeft: number;
  quantity: string;
}

interface RecipeIngredient {
  name: string;
  amount: string;
}

interface Recipe {
  id: number;
  name: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  rating: number;
  scheduledCount: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
}

interface PlannedMeal {
  recipeId: number;
  scheduledAt: number;
}

type Slot = string;
type Plan = Record<Day, Record<Slot, PlannedMeal | null>>;

const DAYS: { id: Day; short: string; full: string }[] = [
  { id: 'mon', short: 'T2', full: 'Thứ 2' },
  { id: 'tue', short: 'T3', full: 'Thứ 3' },
  { id: 'wed', short: 'T4', full: 'Thứ 4' },
  { id: 'thu', short: 'T5', full: 'Thứ 5' },
  { id: 'fri', short: 'T6', full: 'Thứ 6' },
  { id: 'sat', short: 'T7', full: 'Thứ 7' },
  { id: 'sun', short: 'CN', full: 'Chủ nhật' },
];

const MAIN_SLOTS: { id: Slot; label: string; time: string }[] = [
  { id: 'breakfast', label: 'Sáng', time: '07:00' },
  { id: 'lunch',     label: 'Trưa', time: '12:00' },
  { id: 'dinner',    label: 'Tối',  time: '18:30' },
];

const inventory: InventoryItem[] = [
  { name: 'Cà chua bi',        daysLeft: 1, quantity: '500g' },
  { name: 'Cá hồi phi lê',     daysLeft: 1, quantity: '400g' },
  { name: 'Sữa tươi',          daysLeft: 2, quantity: '1L' },
  { name: 'Thịt gà tươi',      daysLeft: 3, quantity: '700g' },
  { name: 'Rau muống',         daysLeft: 4, quantity: '300g' },
  { name: 'Đậu bắp',           daysLeft: 5, quantity: '200g' },
  { name: 'Trứng gà',          daysLeft: 14, quantity: '10 quả' },
  { name: 'Thịt ba chỉ',       daysLeft: 5, quantity: '500g' },
  { name: 'Nước mắm',          daysLeft: 200, quantity: '500ml' },
  { name: 'Đường',             daysLeft: 365, quantity: '1kg' },
  { name: 'Nước dừa tươi',     daysLeft: 6, quantity: '500ml' },
  { name: 'Ớt đỏ',             daysLeft: 7, quantity: '5 quả' },
  { name: 'Dầu ăn',            daysLeft: 90, quantity: '1L' },
];

const recipes: Recipe[] = [
  {
    id: 1, name: 'Canh chua cá cà chua',
    image: 'https://images.unsplash.com/photo-1680084570772-1da0c78362a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
    prepTime: 10, cookTime: 20, servings: 4, calories: 320, rating: 4.8, scheduledCount: 12,
    ingredients: [
      { name: 'Cá hồi phi lê', amount: '400g' },
      { name: 'Cà chua bi', amount: '300g' },
      { name: 'Rau muống', amount: '200g' },
      { name: 'Đậu bắp', amount: '100g' },
      { name: 'Nước mắm', amount: '2 thìa' },
    ],
    steps: [
      'Làm sạch cá, cắt khúc vừa ăn.',
      'Cà chua bổ múi cau, đậu bắp cắt lát.',
      'Phi thơm hành, xào cà chua đến mềm.',
      'Thêm nước, đun sôi, cho cá vào.',
      'Cho rau muống, đậu bắp, nêm nếm rồi tắt bếp.',
    ],
    tags: ['Canh', 'Hải sản'],
  },
  {
    id: 2, name: 'Thịt kho tàu',
    image: 'https://images.unsplash.com/photo-1585116782242-a8ee668a7b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
    prepTime: 15, cookTime: 60, servings: 4, calories: 480, rating: 4.9, scheduledCount: 18,
    ingredients: [
      { name: 'Thịt ba chỉ', amount: '500g' },
      { name: 'Trứng gà', amount: '4 quả' },
      { name: 'Nước mắm', amount: '3 thìa' },
      { name: 'Đường', amount: '2 thìa' },
      { name: 'Nước dừa tươi', amount: '200ml' },
    ],
    steps: [
      'Thịt rửa sạch, cắt miếng 4x5cm.',
      'Ướp thịt với gia vị 30 phút.',
      'Thắng đường caramel, cho thịt vào đảo đều.',
      'Đổ nước dừa, kho lửa nhỏ 40 phút.',
      'Cho trứng vào kho thêm 15 phút.',
    ],
    tags: ['Kho', 'Thịt', 'Cổ điển'],
  },
  {
    id: 3, name: 'Gà xào sả ớt',
    image: 'https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
    prepTime: 10, cookTime: 15, servings: 3, calories: 280, rating: 4.5, scheduledCount: 7,
    ingredients: [
      { name: 'Thịt gà tươi', amount: '600g' },
      { name: 'Ớt đỏ', amount: '2 quả' },
      { name: 'Dầu ăn', amount: '2 thìa' },
      { name: 'Sả tươi', amount: '3 nhánh' },
    ],
    steps: [
      'Gà chặt miếng vừa, rửa sạch.',
      'Sả đập dập, cắt khúc.',
      'Phi thơm sả, cho gà vào xào.',
      'Thêm ớt, nêm gia vị, đảo đều.',
    ],
    tags: ['Xào', 'Thịt gà'],
  },
  {
    id: 4, name: 'Salad sữa chua rau củ',
    image: 'https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
    prepTime: 10, cookTime: 0, servings: 2, calories: 180, rating: 4.4, scheduledCount: 4,
    ingredients: [
      { name: 'Sữa tươi', amount: '200ml' },
      { name: 'Cà chua bi', amount: '150g' },
      { name: 'Rau muống', amount: '100g' },
    ],
    steps: [
      'Rửa sạch rau củ, để ráo.',
      'Cắt cà chua làm đôi.',
      'Trộn đều với sữa chua, nêm muối tiêu.',
    ],
    tags: ['Salad', 'Nhẹ'],
  },
  {
    id: 5, name: 'Trứng chiên cà chua',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
    prepTime: 5, cookTime: 10, servings: 2, calories: 220, rating: 4.6, scheduledCount: 15,
    ingredients: [
      { name: 'Trứng gà', amount: '4 quả' },
      { name: 'Cà chua bi', amount: '150g' },
      { name: 'Dầu ăn', amount: '1 thìa' },
    ],
    steps: [
      'Đánh tan trứng với muối.',
      'Cà chua cắt nhỏ, xào sơ.',
      'Đổ trứng vào, chiên vàng đều.',
    ],
    tags: ['Trứng', 'Nhanh'],
  },
  {
    id: 6, name: 'Phở bò',
    image: 'https://images.unsplash.com/photo-1771573754093-376c871475a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
    prepTime: 20, cookTime: 90, servings: 4, calories: 450, rating: 4.9, scheduledCount: 22,
    ingredients: [
      { name: 'Thịt bò', amount: '400g' },
      { name: 'Bánh phở', amount: '400g' },
      { name: 'Hành lá', amount: '50g' },
      { name: 'Nước mắm', amount: '2 thìa' },
    ],
    steps: [
      'Ninh xương bò 60 phút.',
      'Nêm nếm gia vị nước dùng.',
      'Trụng bánh phở, xếp ra tô.',
      'Chan nước, xếp thịt bò.',
    ],
    tags: ['Phở', 'Bò'],
  },
];

/* Build empty week for main slots only; snack rows are added dynamically */
const emptyPlan: Plan = DAYS.reduce((acc, d) => {
  acc[d.id] = { breakfast: null, lunch: null, dinner: null };
  return acc;
}, {} as Plan);

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
function computeMatch(recipe: Recipe, inv: InventoryItem[]) {
  const invMap = new Map(inv.map((i) => [i.name.toLowerCase(), i]));
  let have = 0;
  let expiringUsed = 0;
  for (const ing of recipe.ingredients) {
    const found = invMap.get(ing.name.toLowerCase());
    if (found) {
      have++;
      if (found.daysLeft <= 3) expiringUsed++;
    }
  }
  const matchScore = Math.round((have / recipe.ingredients.length) * 100);
  return { matchScore, have, total: recipe.ingredients.length, expiringUsed };
}

function todayKey(): Day {
  const d = new Date().getDay(); // 0=Sun..6=Sat
  return (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Day[])[d];
}

/* ─────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────── */
interface SlotConfig { id: Slot; label: string; time: string; removable: boolean }

export function MealPlanner() {
  const [view, setView] = useState<'daily' | 'weekly'>('weekly');
  const [activeDay, setActiveDay] = useState<Day>(todayKey());
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [favorites, setFavorites] = useState<Set<number>>(new Set([2, 6]));

  const [slots, setSlots] = useState<SlotConfig[]>(
    MAIN_SLOTS.map((s) => ({ ...s, removable: false })),
  );
  const [addSnackOpen, setAddSnackOpen] = useState(false);

  /* Sorted by time ascending — both main and snack slots */
  const visibleSlots = useMemo(
    () => [...slots].sort((a, b) => parseTime(a.time) - parseTime(b.time)),
    [slots],
  );

  const updateSlotTime = (id: Slot, time: string) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, time } : s)));
  };

  const addSnack = (label: string, time: string) => {
    const id = `snack-${Date.now()}`;
    setSlots((prev) => [...prev, { id, label, time, removable: true }]);
    setPlan((p) => {
      const next = { ...p };
      for (const d of DAYS) next[d.id] = { ...next[d.id], [id]: null };
      return next;
    });
    toast.success(`Đã thêm bữa "${label}" lúc ${time}`);
  };

  const removeSnack = (id: Slot) => {
    const target = slots.find((s) => s.id === id);
    if (!target?.removable) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setPlan((p) => {
      const next: Plan = { ...p };
      for (const d of DAYS) {
        const { [id]: _, ...rest } = next[d.id];
        next[d.id] = rest;
      }
      return next;
    });
    toast.success(`Đã xoá bữa "${target.label}"`);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modals
  const [picker, setPicker] = useState<{ day: Day; slot: Slot } | null>(null);
  const [detailRecipeId, setDetailRecipeId] = useState<number | null>(null);

  // Drag-drop
  const [draggingRecipeId, setDraggingRecipeId] = useState<number | null>(null);

  /* Match metadata for each recipe */
  const recipeMeta = useMemo(() => {
    const out: Record<number, ReturnType<typeof computeMatch>> = {};
    for (const r of recipes) out[r.id] = computeMatch(r, inventory);
    return out;
  }, []);

  /* Sidebar list — filtered */
  const sidebarRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes
      .filter((r) => !onlyFavorites || favorites.has(r.id))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => recipeMeta[b.id].matchScore - recipeMeta[a.id].matchScore);
  }, [searchQuery, onlyFavorites, favorites, recipeMeta]);

  /* Stats */
  const stats = useMemo(() => {
    let planned = 0;
    let expiringHit = 0;
    let totalScore = 0;
    let scoreCount = 0;
    for (const d of DAYS) {
      for (const s of visibleSlots) {
        const meal = plan[d.id][s.id];
        if (meal) {
          planned++;
          const meta = recipeMeta[meal.recipeId];
          expiringHit += meta.expiringUsed;
          totalScore += meta.matchScore;
          scoreCount++;
        }
      }
    }
    return {
      planned,
      total: DAYS.length * visibleSlots.length,
      avgMatch: scoreCount ? Math.round(totalScore / scoreCount) : 0,
      expiringHit,
    };
  }, [plan, recipeMeta, visibleSlots]);

  /* Handlers */
  const assignMeal = (day: Day, slot: Slot, recipeId: number) => {
    setPlan((p) => ({ ...p, [day]: { ...p[day], [slot]: { recipeId, scheduledAt: Date.now() } } }));
    const recipe = recipes.find((r) => r.id === recipeId);
    toast.success(`Đã thêm "${recipe?.name}" vào ${slots.find((s) => s.id === slot)?.label} ${DAYS.find((d) => d.id === day)?.full}`);
  };

  const removeMeal = (day: Day, slot: Slot) => {
    setPlan((p) => ({ ...p, [day]: { ...p[day], [slot]: null } }));
    toast.success('Đã gỡ bữa khỏi kế hoạch');
  };

  const clearWeek = () => {
    setPlan(emptyPlan);
    toast.success('Đã xoá kế hoạch tuần');
  };

  const generateAIPlan = () => {
    // Greedy fill: for each day/slot, pick the highest-expiring + match recipe not already used today
    const newPlan: Plan = { ...emptyPlan };
    DAYS.forEach((d) => { newPlan[d.id] = { breakfast: null, lunch: null, dinner: null }; });

    const ranked = [...recipes].sort((a, b) => {
      const ma = recipeMeta[a.id];
      const mb = recipeMeta[b.id];
      return (mb.expiringUsed * 100 + mb.matchScore) - (ma.expiringUsed * 100 + ma.matchScore);
    });

    for (const day of DAYS) {
      const usedToday = new Set<number>();
      for (const slot of visibleSlots) {
        const pick = ranked.find((r) => !usedToday.has(r.id) && recipeMeta[r.id].matchScore >= 50);
        if (pick) {
          newPlan[day.id][slot.id] = { recipeId: pick.id, scheduledAt: Date.now() };
          usedToday.add(pick.id);
        }
      }
    }
    setPlan(newPlan);
    toast.success('AI đã lên kế hoạch tuần tận dụng tối đa nguyên liệu sắp hết hạn!');
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      const recipe = recipes.find((r) => r.id === id);
      if (next.has(id)) { next.delete(id); toast.success(`Đã bỏ yêu thích "${recipe?.name}"`); }
      else { next.add(id); toast.success(`Đã thêm "${recipe?.name}" vào yêu thích`); }
      return next;
    });
  };

  const openPicker = (day: Day, slot: Slot) => setPicker({ day, slot });
  const openDetail = (recipeId: number) => setDetailRecipeId(recipeId);

  const handleDrop = (day: Day, slot: Slot) => {
    if (draggingRecipeId == null) return;
    assignMeal(day, slot, draggingRecipeId);
    setDraggingRecipeId(null);
  };

  /* ─────── Render ─────── */
  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 lg:py-8 space-y-6">

        {/* ── Header ───────────────────────────── */}
        <section className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-emerald-700 inline-flex items-center gap-1.5" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              <Calendar className="w-3.5 h-3.5" /> Kế hoạch nấu ăn
            </p>
            <h1 className="text-slate-900 mt-1" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Lên thực đơn cho gia đình
            </h1>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: '0.82rem' }}>
              Tận dụng nguyên liệu trong kho — giảm lãng phí, ăn ngon hơn
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              {(['daily', 'weekly'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    view === v ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {v === 'daily' ? 'Theo ngày' : 'Theo tuần'}
                </button>
              ))}
            </div>

            <button
              onClick={generateAIPlan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Lên kế hoạch bằng AI
            </button>

            <button
              onClick={clearWeek}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
              style={{ fontSize: '0.78rem', fontWeight: 500 }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Xoá
            </button>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Bữa đã lên', value: `${stats.planned}/${stats.total}`, icon: Calendar, accent: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
            { label: 'Điểm khớp TB', value: `${stats.avgMatch}%`, icon: TrendingUp, accent: 'bg-teal-50 text-teal-700 ring-teal-100' },
            { label: 'Tận dụng sắp hết hạn', value: `${stats.expiringHit}`, icon: Sparkles, accent: 'bg-amber-50 text-amber-700 ring-amber-100' },
            { label: 'Món yêu thích', value: `${favorites.size}`, icon: Heart, accent: 'bg-rose-50 text-rose-700 ring-rose-100' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl px-4 py-3 border border-slate-100 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0 ${s.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-500 truncate" style={{ fontSize: '0.7rem' }}>{s.label}</p>
                  <p className="text-slate-900" style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Main: Planner + Favorites Sidebar (~65/35 split) ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* PLANNER */}
          <div className="lg:col-span-8 space-y-4">
            {/* Slot toolbar: add snack */}
            <div className="bg-white rounded-2xl border border-slate-100 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-slate-500" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Các bữa trong ngày:</p>
                {visibleSlots.map((s) => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 ${
                      s.removable
                        ? 'bg-violet-50 text-violet-700 ring-violet-100'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                    }`}
                    style={{ fontSize: '0.68rem', fontWeight: 600 }}
                  >
                    {s.label} · {s.time}
                    {s.removable && (
                      <button
                        onClick={() => removeSnack(s.id)}
                        className="ml-0.5 w-3.5 h-3.5 rounded hover:bg-violet-200 flex items-center justify-center"
                        aria-label={`Xoá ${s.label}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setAddSnackOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                style={{ fontSize: '0.74rem', fontWeight: 600 }}
              >
                <Plus className="w-3.5 h-3.5" /> Thêm bữa phụ
              </button>
            </div>

            {view === 'weekly' ? (
              <WeeklyGrid
                plan={plan}
                slots={visibleSlots}
                onUpdateSlotTime={updateSlotTime}
                onRemoveSnack={removeSnack}
                onPickSlot={openPicker}
                onRemove={removeMeal}
                onOpenDetail={openDetail}
                onDrop={handleDrop}
                draggingRecipeId={draggingRecipeId}
                recipeMeta={recipeMeta}
              />
            ) : (
              <DailyView
                day={activeDay}
                onChangeDay={setActiveDay}
                plan={plan}
                slots={visibleSlots}
                onUpdateSlotTime={updateSlotTime}
                onRemoveSnack={removeSnack}
                onPickSlot={openPicker}
                onRemove={removeMeal}
                onOpenDetail={openDetail}
                onDrop={handleDrop}
                draggingRecipeId={draggingRecipeId}
                recipeMeta={recipeMeta}
              />
            )}
          </div>

          {/* SIDEBAR: Favorites & Quick Drag (~33%) */}
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-6">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-slate-900 inline-flex items-center gap-1.5" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> Món yêu thích
                  </p>
                  <button
                    onClick={() => setOnlyFavorites((v) => !v)}
                    className={`px-2 py-0.5 rounded-full ring-1 transition-colors ${
                      onlyFavorites ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100'
                    }`}
                    style={{ fontSize: '0.64rem', fontWeight: 600 }}
                  >
                    {onlyFavorites ? 'Chỉ ❤' : 'Tất cả'}
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm công thức..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                    style={{ fontSize: '0.75rem' }}
                  />
                </div>
                <p className="text-slate-400 mt-2" style={{ fontSize: '0.66rem' }}>
                  Kéo món vào ô bữa ăn để lên kế hoạch
                </p>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-3 space-y-2">
                {sidebarRecipes.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-slate-400" style={{ fontSize: '0.75rem' }}>Không có công thức</p>
                  </div>
                ) : sidebarRecipes.map((r) => (
                  <SidebarRecipeCard
                    key={r.id}
                    recipe={r}
                    meta={recipeMeta[r.id]}
                    isFavorite={favorites.has(r.id)}
                    onToggleFavorite={() => toggleFavorite(r.id)}
                    onClick={() => openDetail(r.id)}
                    onDragStart={() => setDraggingRecipeId(r.id)}
                    onDragEnd={() => setDraggingRecipeId(null)}
                  />
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>

      {/* ── Modals ───────────────────────────── */}
      {picker && (
        <RecipePickerModal
          day={picker.day}
          slot={picker.slot}
          recipes={recipes}
          recipeMeta={recipeMeta}
          favorites={favorites}
          onClose={() => setPicker(null)}
          onPick={(id) => { assignMeal(picker.day, picker.slot, id); setPicker(null); }}
        />
      )}

      {detailRecipeId != null && (
        <RecipeDetailModal
          recipe={recipes.find((r) => r.id === detailRecipeId)!}
          meta={recipeMeta[detailRecipeId]}
          inventory={inventory}
          isFavorite={favorites.has(detailRecipeId)}
          onToggleFavorite={() => toggleFavorite(detailRecipeId)}
          onClose={() => setDetailRecipeId(null)}
        />
      )}

      {addSnackOpen && (
        <AddSnackModal
          onClose={() => setAddSnackOpen(false)}
          onConfirm={(label, time) => { addSnack(label, time); setAddSnackOpen(false); }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Weekly Grid
───────────────────────────────────────────────── */
function WeeklyGrid({
  plan, slots, onUpdateSlotTime, onRemoveSnack, onPickSlot, onRemove, onOpenDetail, onDrop, draggingRecipeId, recipeMeta,
}: {
  plan: Plan;
  slots: SlotConfig[];
  onUpdateSlotTime: (id: Slot, time: string) => void;
  onRemoveSnack: (id: Slot) => void;
  onPickSlot: (day: Day, slot: Slot) => void;
  onRemove: (day: Day, slot: Slot) => void;
  onOpenDetail: (id: number) => void;
  onDrop: (day: Day, slot: Slot) => void;
  draggingRecipeId: number | null;
  recipeMeta: Record<number, ReturnType<typeof computeMatch>>;
}) {
  const today = todayKey();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Days header */}
          <div className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/60">
            <div className="px-3 py-3" />
            {DAYS.map((d) => (
              <div
                key={d.id}
                className={`px-3 py-3 text-center border-l border-slate-100 ${d.id === today ? 'bg-emerald-50/60' : ''}`}
              >
                <p className={d.id === today ? 'text-emerald-700' : 'text-slate-700'} style={{ fontSize: '0.78rem', fontWeight: 700 }}>{d.short}</p>
                <p className={d.id === today ? 'text-emerald-600' : 'text-slate-400'} style={{ fontSize: '0.62rem' }}>{d.id === today ? 'Hôm nay' : d.full}</p>
              </div>
            ))}
          </div>

          {/* Rows by slot */}
          {slots.map((slot) => (
            <div key={slot.id} className={`group/row grid grid-cols-[100px_repeat(7,1fr)] border-b border-slate-100 last:border-0 ${slot.removable ? 'bg-violet-50/20' : ''}`}>
              <div className="relative px-2.5 py-3 bg-slate-50/30 flex flex-col justify-center gap-1">
                <p className={`${slot.removable ? 'text-violet-700' : 'text-slate-700'}`} style={{ fontSize: '0.78rem', fontWeight: 700 }}>{slot.label}</p>
                <TimeEditor value={slot.time} onChange={(t) => onUpdateSlotTime(slot.id, t)} />
                {slot.removable && (
                  <button
                    onClick={() => onRemoveSnack(slot.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
                    aria-label="Xoá bữa phụ"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {DAYS.map((d) => (
                <SlotCell
                  key={d.id + slot.id}
                  day={d.id}
                  slot={slot.id}
                  meal={plan[d.id][slot.id]}
                  recipeMeta={recipeMeta}
                  isToday={d.id === today}
                  isDragging={draggingRecipeId != null}
                  onPick={() => onPickSlot(d.id, slot.id)}
                  onRemove={() => onRemove(d.id, slot.id)}
                  onOpenDetail={onOpenDetail}
                  onDrop={() => onDrop(d.id, slot.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Daily View
───────────────────────────────────────────────── */
function DailyView({
  day, onChangeDay, plan, slots, onUpdateSlotTime, onRemoveSnack, onPickSlot, onRemove, onOpenDetail, onDrop, draggingRecipeId, recipeMeta,
}: {
  day: Day;
  onChangeDay: (d: Day) => void;
  plan: Plan;
  slots: SlotConfig[];
  onUpdateSlotTime: (id: Slot, time: string) => void;
  onRemoveSnack: (id: Slot) => void;
  onPickSlot: (day: Day, slot: Slot) => void;
  onRemove: (day: Day, slot: Slot) => void;
  onOpenDetail: (id: number) => void;
  onDrop: (day: Day, slot: Slot) => void;
  draggingRecipeId: number | null;
  recipeMeta: Record<number, ReturnType<typeof computeMatch>>;
}) {
  const idx = DAYS.findIndex((d) => d.id === day);
  const current = DAYS[idx];
  const prev = () => onChangeDay(DAYS[(idx + DAYS.length - 1) % DAYS.length].id);
  const next = () => onChangeDay(DAYS[(idx + 1) % DAYS.length].id);

  return (
    <div className="space-y-4">
      {/* Day navigator */}
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between">
        <button onClick={prev} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700 }}>{current.full}</p>
          <p className="text-slate-400" style={{ fontSize: '0.7rem' }}>{day === todayKey() ? 'Hôm nay' : '—'}</p>
        </div>
        <button onClick={next} className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slot cards (chính + bữa phụ) — đã sort theo thời gian */}
      <div className={`grid grid-cols-1 gap-4 ${slots.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            day={day}
            meal={plan[day][slot.id]}
            recipeMeta={recipeMeta}
            isDragging={draggingRecipeId != null}
            onUpdateSlotTime={onUpdateSlotTime}
            onRemoveSnack={onRemoveSnack}
            onPick={() => onPickSlot(day, slot.id)}
            onRemove={() => onRemove(day, slot.id)}
            onOpenDetail={onOpenDetail}
            onDrop={() => onDrop(day, slot.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Slot Cell
───────────────────────────────────────────────── */
function SlotCell({
  day, slot, meal, recipeMeta, isToday, isDragging, onPick, onRemove, onOpenDetail, onDrop, tall,
}: {
  day: Day;
  slot: Slot;
  meal: PlannedMeal | null;
  recipeMeta: Record<number, ReturnType<typeof computeMatch>>;
  isToday?: boolean;
  isDragging?: boolean;
  onPick: () => void;
  onRemove: () => void;
  onOpenDetail: (id: number) => void;
  onDrop: () => void;
  tall?: boolean;
}) {
  const [over, setOver] = useState(false);
  const recipe = meal ? recipes.find((r) => r.id === meal.recipeId) : null;
  const meta = meal ? recipeMeta[meal.recipeId] : null;

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setOver(true); };
  const handleDragLeave = () => setOver(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setOver(false); onDrop(); };

  if (!recipe) {
    return (
      <button
        onClick={onPick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group/cell w-full ${tall ? 'min-h-[140px]' : 'min-h-[88px]'} border-l border-slate-100 transition-all flex items-center justify-center ${
          over ? 'bg-emerald-50 ring-2 ring-emerald-300 ring-inset' :
          isDragging ? 'bg-emerald-50/30' :
          isToday ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-center gap-1 text-slate-400 group-hover/cell:text-emerald-600 transition-colors">
          <div className="w-7 h-7 rounded-full border border-dashed border-current flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>Thêm món</span>
        </div>
      </button>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-l border-slate-100 p-2 group/meal ${
        over ? 'bg-emerald-50 ring-2 ring-emerald-300 ring-inset' : isToday ? 'bg-emerald-50/20' : ''
      }`}
      style={{ minHeight: tall ? 140 : 88 }}
    >
      <button onClick={() => onOpenDetail(recipe.id)} className="w-full text-left">
        <div className="relative h-14 rounded-lg overflow-hidden bg-slate-100">
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          {meta && meta.expiringUsed > 0 && (
            <span className="absolute top-1 left-1 px-1 py-0.5 bg-amber-500 text-white rounded" style={{ fontSize: '0.55rem', fontWeight: 700 }}>
              ⚡ {meta.expiringUsed}
            </span>
          )}
          {recipe.scheduledCount >= 15 && (
            <span className="absolute top-1 right-1 px-1 py-0.5 bg-rose-500 text-white rounded inline-flex items-center gap-0.5" style={{ fontSize: '0.55rem', fontWeight: 700 }}>
              🔥
            </span>
          )}
        </div>
        <p className="text-slate-900 mt-1.5 line-clamp-2" style={{ fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.25 }}>
          {recipe.name}
        </p>
        {meta && (
          <p className="text-emerald-700 mt-0.5" style={{ fontSize: '0.6rem', fontWeight: 600 }}>
            {meta.matchScore}% khớp · {meta.have}/{meta.total}
          </p>
        )}
      </button>
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 rounded bg-white/0 hover:bg-rose-50 text-slate-400 hover:text-rose-600 opacity-0 group-hover/meal:opacity-100 transition-opacity flex items-center justify-center"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sidebar Recipe Card (draggable)
───────────────────────────────────────────────── */
function SidebarRecipeCard({
  recipe, meta, isFavorite, onToggleFavorite, onClick, onDragStart, onDragEnd,
}: {
  recipe: Recipe;
  meta: ReturnType<typeof computeMatch>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const isPopular = recipe.scheduledCount >= 15 || recipe.rating >= 4.8;

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'copy'; onDragStart(); }}
      onDragEnd={onDragEnd}
      className="group/sb bg-white border border-slate-100 hover:border-emerald-200 rounded-xl p-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
    >
      <div className="flex gap-2.5">
        <button onClick={onClick} className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          {isPopular && (
            <span className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-rose-500 text-white rounded" style={{ fontSize: '0.5rem', fontWeight: 700 }}>
              HOT
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <button onClick={onClick} className="flex-1 min-w-0 text-left">
              <p className="text-slate-900 line-clamp-2" style={{ fontSize: '0.76rem', fontWeight: 600, lineHeight: 1.3 }}>
                {recipe.name}
              </p>
            </button>
            <button
              onClick={onToggleFavorite}
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                isFavorite ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded-full ring-1 ${
              meta.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
              meta.matchScore >= 50 ? 'bg-amber-50 text-amber-700 ring-amber-100' :
              'bg-slate-50 text-slate-500 ring-slate-200'
            }`} style={{ fontSize: '0.58rem', fontWeight: 700 }}>
              {meta.matchScore}%
            </span>
            {meta.expiringUsed > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-700 ring-1 ring-amber-100 rounded-full" style={{ fontSize: '0.58rem', fontWeight: 600 }}>
                ⚡ {meta.expiringUsed}
              </span>
            )}
          </div>

          <p className="text-slate-400 mt-1 inline-flex items-center gap-1" style={{ fontSize: '0.6rem' }}>
            <Clock className="w-2.5 h-2.5" /> {recipe.prepTime + recipe.cookTime}p
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Recipe Picker Modal
───────────────────────────────────────────────── */
function RecipePickerModal({
  day, slot, recipes, recipeMeta, favorites, onClose, onPick,
}: {
  day: Day;
  slot: Slot;
  recipes: Recipe[];
  recipeMeta: Record<number, ReturnType<typeof computeMatch>>;
  favorites: Set<number>;
  onClose: () => void;
  onPick: (id: number) => void;
}) {
  const [q, setQ] = useState('');
  const dayLabel = DAYS.find((d) => d.id === day)?.full;
  const slotLabel = MAIN_SLOTS.find((s) => s.id === slot)?.label;

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...recipes]
      .filter((r) => !query || r.name.toLowerCase().includes(query))
      .sort((a, b) => recipeMeta[b.id].matchScore - recipeMeta[a.id].matchScore);
  }, [q, recipes, recipeMeta]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700 }}>Chọn món cho {slotLabel} {dayLabel}</p>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: '0.72rem' }}>Sắp xếp theo độ khớp nguyên liệu</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm công thức..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              style={{ fontSize: '0.82rem' }}
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map((r) => {
            const meta = recipeMeta[r.id];
            return (
              <button
                key={r.id}
                onClick={() => onPick(r.id)}
                className="text-left flex gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-slate-900 line-clamp-1" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.name}</p>
                    {favorites.has(r.id) && <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0" />}
                  </div>
                  <p className="text-slate-400 inline-flex items-center gap-1 mt-0.5" style={{ fontSize: '0.66rem' }}>
                    <Clock className="w-2.5 h-2.5" /> {r.prepTime + r.cookTime}p · <Users className="w-2.5 h-2.5" /> {r.servings}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-1.5 py-0.5 rounded-full ring-1 ${
                      meta.matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
                      meta.matchScore >= 50 ? 'bg-amber-50 text-amber-700 ring-amber-100' :
                      'bg-slate-50 text-slate-500 ring-slate-200'
                    }`} style={{ fontSize: '0.6rem', fontWeight: 700 }}>
                      {meta.matchScore}% khớp
                    </span>
                    {meta.expiringUsed > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 ring-1 ring-amber-100 rounded-full" style={{ fontSize: '0.58rem', fontWeight: 600 }}>
                        ⚡ {meta.expiringUsed}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Recipe Detail Modal
───────────────────────────────────────────────── */
function RecipeDetailModal({
  recipe, meta, inventory, isFavorite, onToggleFavorite, onClose,
}: {
  recipe: Recipe;
  meta: ReturnType<typeof computeMatch>;
  inventory: InventoryItem[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}) {
  const invMap = new Map(inventory.map((i) => [i.name.toLowerCase(), i]));
  const ingredientStatus = recipe.ingredients.map((ing) => ({
    ...ing,
    inv: invMap.get(ing.name.toLowerCase()),
  }));
  const available = ingredientStatus.filter((i) => i.inv);
  const missing = ingredientStatus.filter((i) => !i.inv);
  const isPopular = recipe.scheduledCount >= 15 || recipe.rating >= 4.8;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Hero */}
        <div className="relative h-52 bg-slate-200">
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/95 hover:bg-white flex items-center justify-center text-slate-700">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isPopular && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500/95 text-white rounded-full" style={{ fontSize: '0.66rem', fontWeight: 700 }}>
                🔥 Phổ biến
              </span>
            )}
            <span className={`px-2 py-1 rounded-full ${
              meta.matchScore >= 80 ? 'bg-emerald-500/95 text-white' :
              meta.matchScore >= 50 ? 'bg-amber-500/95 text-white' :
              'bg-white/95 text-slate-700'
            }`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              {meta.matchScore}% khớp kho
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-white" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{recipe.name}</h2>
              <p className="text-white/80 mt-1" style={{ fontSize: '0.74rem' }}>
                ★ {recipe.rating} · Đã được lên kế hoạch {recipe.scheduledCount} lần
              </p>
            </div>
            <button
              onClick={onToggleFavorite}
              className={`px-3 py-1.5 rounded-xl backdrop-blur-sm inline-flex items-center gap-1.5 ${
                isFavorite ? 'bg-rose-500 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'
              }`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Yêu thích' : 'Yêu thích'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Meta row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { Icon: Clock, label: 'Sơ chế', value: `${recipe.prepTime}p` },
              { Icon: Flame, label: 'Nấu', value: `${recipe.cookTime}p` },
              { Icon: Users, label: 'Khẩu phần', value: `${recipe.servings}` },
              { Icon: ChefHat, label: 'Calories', value: `${recipe.calories}` },
            ].map((m) => (
              <div key={m.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                <m.Icon className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                <p className="text-slate-900 mt-1" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.value}</p>
                <p className="text-slate-400" style={{ fontSize: '0.6rem' }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Ingredients split */}
          <div>
            <p className="text-slate-900 mb-2" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nguyên liệu</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-emerald-50/40 rounded-xl border border-emerald-100 p-3">
                <p className="text-emerald-800 mb-2 inline-flex items-center gap-1.5" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Có sẵn ({available.length})
                </p>
                <ul className="space-y-1.5">
                  {available.map((ing, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-slate-700" style={{ fontSize: '0.76rem' }}>{ing.name}</span>
                      <span className="text-slate-500" style={{ fontSize: '0.68rem' }}>{ing.amount}</span>
                    </li>
                  ))}
                  {available.length === 0 && (
                    <li className="text-slate-400" style={{ fontSize: '0.72rem' }}>Chưa có nguyên liệu nào</li>
                  )}
                </ul>
              </div>

              <div className={`rounded-xl border p-3 ${missing.length > 0 ? 'bg-amber-50/40 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`mb-2 inline-flex items-center gap-1.5 ${missing.length > 0 ? 'text-amber-800' : 'text-slate-500'}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  <Plus className="w-3.5 h-3.5" /> Cần mua ({missing.length})
                </p>
                <ul className="space-y-1.5">
                  {missing.map((ing, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-slate-700" style={{ fontSize: '0.76rem' }}>{ing.name}</span>
                      <span className="text-slate-500" style={{ fontSize: '0.68rem' }}>{ing.amount}</span>
                    </li>
                  ))}
                  {missing.length === 0 && (
                    <li className="text-slate-400" style={{ fontSize: '0.72rem' }}>Đã đủ nguyên liệu ✨</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-slate-900 mb-2" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Các bước nấu</p>
            <ol className="space-y-2.5">
              {recipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <p className="pt-0.5 text-slate-700" style={{ fontSize: '0.8rem', lineHeight: 1.55 }}>{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
          <p className="text-slate-500" style={{ fontSize: '0.7rem' }}>
            Tổng: {recipe.prepTime + recipe.cookTime} phút · {meta.expiringUsed > 0 && <span className="text-amber-700">Dùng {meta.expiringUsed} nguyên liệu sắp hết hạn</span>}
          </p>
          {missing.length > 0 && (
            <button
              onClick={() => { toast.success(`Đã thêm ${missing.length} nguyên liệu vào danh sách đi chợ`); onClose(); }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1.5 shadow-sm"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" /> Thêm vào giỏ ({missing.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   SlotCard — reusable card for a single meal slot (daily view)
───────────────────────────────────────────────── */
function SlotCard({
  slot, day, meal, recipeMeta, isDragging,
  onUpdateSlotTime, onRemoveSnack, onPick, onRemove, onOpenDetail, onDrop,
}: {
  slot: SlotConfig;
  day: Day;
  meal: PlannedMeal | null;
  recipeMeta: Record<number, ReturnType<typeof computeMatch>>;
  isDragging: boolean;
  onUpdateSlotTime: (id: Slot, time: string) => void;
  onRemoveSnack: (id: Slot) => void;
  onPick: () => void;
  onRemove: () => void;
  onOpenDetail: (id: number) => void;
  onDrop: () => void;
}) {
  return (
    <div className={`relative bg-white rounded-2xl border overflow-hidden ${slot.removable ? 'border-violet-100' : 'border-slate-100'}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${slot.removable ? 'bg-violet-50/40 border-violet-100' : 'bg-slate-50/40 border-slate-100'}`}>
        <p className={slot.removable ? 'text-violet-800' : 'text-slate-900'} style={{ fontSize: '0.88rem', fontWeight: 700 }}>
          {slot.label}
        </p>
        <div className="flex items-center gap-1.5">
          <TimeEditor value={slot.time} onChange={(t) => onUpdateSlotTime(slot.id, t)} />
          {slot.removable && (
            <button
              onClick={() => onRemoveSnack(slot.id)}
              className="w-6 h-6 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
              aria-label={`Xoá ${slot.label}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        <SlotCell
          day={day}
          slot={slot.id}
          meal={meal}
          recipeMeta={recipeMeta}
          isDragging={isDragging}
          onPick={onPick}
          onRemove={onRemove}
          onOpenDetail={onOpenDetail}
          onDrop={onDrop}
          tall
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   AddSnackModal — name + time input
───────────────────────────────────────────────── */
function AddSnackModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (label: string, time: string) => void }) {
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('15:30');

  const presets = ['Bữa xế', 'Tráng miệng', 'Ăn đêm', 'Bữa nhẹ sáng'];

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed) { toast.error('Vui lòng nhập tên bữa ăn'); return; }
    if (!time) { toast.error('Vui lòng chọn thời gian'); return; }
    onConfirm(trimmed, time);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700 }}>Thêm bữa phụ</p>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: '0.72rem' }}>Đặt tên và chọn giờ cho bữa ăn mới</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block">
            <span className="block text-slate-700 mb-1.5" style={{ fontSize: '0.74rem', fontWeight: 600 }}>Tên bữa ăn *</span>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="VD: Bữa xế, Tráng miệng, Ăn đêm..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              style={{ fontSize: '0.85rem' }}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setLabel(p)}
                  className="px-2 py-0.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-600 hover:text-emerald-700 rounded-full transition-colors"
                  style={{ fontSize: '0.66rem' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
            <span className="block text-slate-700 mb-1.5" style={{ fontSize: '0.74rem', fontWeight: 600 }}>Thời gian *</span>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <p className="text-slate-400 mt-1.5" style={{ fontSize: '0.66rem' }}>
              Bữa phụ sẽ tự động sắp xếp theo thời gian
            </p>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            style={{ fontSize: '0.8rem', fontWeight: 500 }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            <Plus className="w-3.5 h-3.5" /> Xác nhận thêm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Editable time input — inline native time picker
───────────────────────────────────────────────── */
function TimeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="group/time relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer transition-colors">
      <Clock className="w-2.5 h-2.5 text-slate-400 group-hover/time:text-emerald-600" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-slate-700 outline-none cursor-pointer"
        style={{ fontSize: '0.66rem', fontWeight: 600, width: '52px' }}
      />
    </label>
  );
}
