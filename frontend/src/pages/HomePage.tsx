import { useState, useEffect } from 'react';
import {
  Package, AlertCircle, ChefHat,
  Clock, Users, ArrowRight, Plus, ShoppingCart,
  Sparkles, Flame, Leaf, Sun, Sandwich, Moon, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TabType } from '@/lib/tabs';
import type { IngredientItem, MealPlanItem, RecipeItem } from '@/lib/api';
import { useAppDataStore } from '@/stores/appDataStore';
import { useRecipeDataStore } from '@/stores/recipeDataStore';

interface HomePageProps {
  onNavigate: (tab: TabType) => void;
}

/* ── Data ─────────────────────────────────────────── */
const initialExpiring = [
  { id: 1, name: 'Cà chua bi',        daysLeft: 1, quantity: '500g',  emoji: '🍅', storage: 'Ngăn mát' },
  { id: 2, name: 'Sữa tươi Vinamilk', daysLeft: 2, quantity: '1 hộp', emoji: '🥛', storage: 'Ngăn mát' },
  { id: 3, name: 'Thịt gà tươi',      daysLeft: 3, quantity: '700g',  emoji: '🍗', storage: 'Ngăn mát' },
];
const initialMealSuggestions = [
  {
    id: 1, name: 'Canh chua cá cà chua', tagline: 'Bữa tối nhẹ nhàng',
    readyPercent: 100, time: '30 phút', servings: '4 người',
    cookable: true, missing: 0,
    image: 'https://images.unsplash.com/photo-1680084570772-1da0c78362a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    usesExpiring: ['Cà chua', 'Cá'],
  },
  {
    id: 2, name: 'Gà kho gừng', tagline: 'Đậm đà cho cả nhà',
    readyPercent: 85, time: '35 phút', servings: '4 người',
    cookable: false, missing: 1,
    image: 'https://images.unsplash.com/photo-1771573754093-376c871475a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    usesExpiring: ['Thịt gà'],
  },
  {
    id: 3, name: 'Salad sữa chua rau củ', tagline: 'Nhẹ nhàng & lành mạnh',
    readyPercent: 70, time: '15 phút', servings: '2 người',
    cookable: false, missing: 1,
    image: 'https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    usesExpiring: ['Sữa tươi', 'Cà chua'],
  },
];

interface ScheduledMeal {
  id: number;
  slot: 'breakfast' | 'lunch' | 'dinner';
  slotLabel: string;
  time: string;
  recipe: string;
  servings: string;
  image: string;
  status: 'done' | 'upcoming' | 'planned';
  icon: typeof Sun;
  accent: string;
}

const scheduled_meals: ScheduledMeal[] = [
  {
    id: 1, slot: 'breakfast', slotLabel: 'Bữa sáng', time: '7:00',
    recipe: 'Phở bò truyền thống', servings: '4 người', status: 'done',
    image: 'https://images.unsplash.com/photo-1585116782242-a8ee668a7b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    icon: Sun, accent: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  {
    id: 2, slot: 'lunch', slotLabel: 'Bữa trưa', time: '12:00',
    recipe: 'Cơm gà xối mỡ', servings: '4 người', status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    icon: Sandwich, accent: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  {
    id: 3, slot: 'dinner', slotLabel: 'Bữa tối', time: '18:30',
    recipe: 'Canh chua cá cà chua', servings: '4 người', status: 'planned',
    image: 'https://images.unsplash.com/photo-1680084570772-1da0c78362a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    icon: Moon, accent: 'bg-violet-50 text-violet-700 ring-violet-100',
  },
];

/* ── Component ──────────────────────────────────────────────── */
function mealSlotMeta(mealType: MealPlanItem['meal_type']) {
  switch (mealType) {
    case 'Breakfast':
      return { slot: 'breakfast' as const, slotLabel: 'Bữa sáng', time: '7:00', icon: Sun, accent: 'bg-amber-50 text-amber-700 ring-amber-100' };
    case 'Lunch':
      return { slot: 'lunch' as const, slotLabel: 'Bữa trưa', time: '12:00', icon: Sandwich, accent: 'bg-sky-50 text-sky-700 ring-sky-100' };
    default:
      return { slot: 'dinner' as const, slotLabel: 'Bữa tối', time: '18:30', icon: Moon, accent: 'bg-violet-50 text-violet-700 ring-violet-100' };
  }
}

function mapTodayPlans(plans: MealPlanItem[]): ScheduledMeal[] {
  const today = new Date().toISOString().slice(0, 10);
  return plans
    .filter((plan) => plan.plan_date.slice(0, 10) === today && plan.Recipe)
    .map((plan) => {
      const meta = mealSlotMeta(plan.meal_type);
      const recipe = plan.Recipe as RecipeItem;
      return {
        id: plan.id,
        ...meta,
        recipe: recipe.title,
        servings: recipe.servings || '4 người',
        image: recipe.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
        status: 'planned' as const,
      };
    });
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [expiring, setExpiring] = useState<typeof initialExpiring>([]);
  const [mealSuggestions, setMealSuggestions] = useState<typeof initialMealSuggestions>([]);
  const [meals, setMeals] = useState<ScheduledMeal[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [cookableCount, setCookableCount] = useState(0);
  const [plannedMeals, setPlannedMeals] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const loadRecipeData = useRecipeDataStore((state) => state.loadAll);
  const loadAppData = useAppDataStore((state) => state.loadAll);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([loadRecipeData(true), loadAppData(true)]);
        const {
          inventoryItems: allItems,
          savedRecipes,
          communityRecipes,
        } = useRecipeDataStore.getState();
        const { mealPlans: apiPlans } = useAppDataStore.getState();

        const apiRecipes = [...savedRecipes, ...communityRecipes];
        const todayMeals = mapTodayPlans(apiPlans);

        // Expiring items (daysLeft <= 3)
        const soonExpiring = allItems
          .filter((i) => i.daysLeft >= 0 && i.daysLeft <= 3)
          .slice(0, 3)
          .map((i, idx) => ({
            id: idx + 1,
            name: i.name,
            daysLeft: i.daysLeft,
            quantity: `${i.quantity} ${i.unit}`,
            emoji: i.emoji || '🥬',
            storage: i.storage === 'cold' ? 'Ngăn mát' : i.storage === 'freezer' ? 'Ngăn đông' : 'Tủ đồ khô',
          }));
        setExpiring(soonExpiring);

        const inventoryNames = new Set(allItems.map((item) => item.name.trim().toLowerCase()));
        const mappedSuggestions = apiRecipes
          .map((recipe) => {
            const ingredients = recipe.ingredients || [];
            const have = ingredients.filter((ing) => inventoryNames.has(ing.name.trim().toLowerCase())).length;
            const readyPercent = ingredients.length ? Math.round((have / ingredients.length) * 100) : 0;
            return {
              id: recipe.id,
              name: recipe.title,
              tagline: recipe.tags?.[0] || 'Công thức đã lưu',
              readyPercent,
              time: recipe.time || '30 phút',
              servings: recipe.servings || '4 người',
              cookable: ingredients.length > 0 && have === ingredients.length,
              missing: Math.max(ingredients.length - have, 0),
              image: recipe.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
              usesExpiring: ingredients
                .map((ing) => allItems.find((item) => item.name.trim().toLowerCase() === ing.name.trim().toLowerCase()))
                .filter((item): item is IngredientItem => Boolean(item && item.daysLeft <= 3))
                .map((item) => item.name),
            };
          })
          .sort((a, b) => b.readyPercent - a.readyPercent)
          .slice(0, 3);

        setTotalItems(allItems.length);
        setExpiredCount(allItems.filter((item) => Number(item.daysLeft) < 0).length);
        setPlannedMeals(apiPlans.length);
        setMealSuggestions(mappedSuggestions);
        setCookableCount(mappedSuggestions.filter((recipe) => recipe.cookable).length);
        setMeals(todayMeals);
      } catch {
        setExpiring([]);
        setMealSuggestions([]);
        setMeals([]);
        setTotalItems(0);
        setCookableCount(0);
        setPlannedMeals(0);
        setExpiredCount(0);
      }
    };
    fetchData();
  }, [loadRecipeData, loadAppData]);

  const markCooked = (id: number, name: string) => {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, status: 'done' as const } : m));
    toast.success(`Đã đánh dấu "${name}" hoàn thành`);
  };

  /* Metric cards */
  const metrics = [
    {
      label: 'Tổng thực phẩm', value: totalItems.toString(), unit: 'mặt hàng',
      icon: Package, accent: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    },
    {
      label: 'Sắp hết hạn', value: expiring.length.toString(), unit: 'trong 3 ngày',
      icon: AlertCircle, accent: 'text-amber-700 bg-amber-50 ring-amber-100',
    },
    {
      label: 'Nấu ngay được', value: cookableCount.toString(), unit: 'công thức',
      icon: ChefHat, accent: 'text-teal-700 bg-teal-50 ring-teal-100',
    },
    {
      label: 'Đã lên kế hoạch', value: plannedMeals.toString(), unit: 'bữa ăn',
      icon: Clock, accent: 'text-sky-700 bg-sky-50 ring-sky-100',
    },
    {
      label: 'Lãng phí', value: expiredCount.toString(), unit: 'đã hết hạn',
      icon: Flame, accent: 'text-rose-700 bg-rose-50 ring-rose-100',
    },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 lg:py-8 space-y-6 lg:space-y-8">

        {/* ── 1. Breadcrumb + Quick Actions (cùng hàng) ─── */}
        <section className="flex items-center justify-between gap-4">
          <p className="text-emerald-700 inline-flex items-center gap-1.5" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
            <Leaf className="w-3.5 h-3.5" /> Bảng điều khiển
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { onNavigate('inventory'); toast.info('Mở kho thực phẩm'); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm hover:shadow transition-all"
              style={{ fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" /> Thêm thực phẩm
            </button>
            <button
              onClick={() => onNavigate('shopping')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all"
              style={{ fontSize: '0.8rem', fontWeight: 500 }}
            >
              <ShoppingCart className="w-4 h-4 text-slate-500" /> Đi chợ
            </button>
          </div>
        </section>

        {/* ── 2. Metric Cards: 3 cols, horizontal layout, slim ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="group bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all duration-200 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0 ${m.accent}`}>
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-500 truncate" style={{ fontSize: '0.72rem' }}>{m.label}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-900" style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                      {m.value}
                    </span>
                    <span className="text-slate-400 truncate" style={{ fontSize: '0.7rem' }}>{m.unit}</span>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" style={{ fontSize: '0.95rem' }}>→</span>
              </div>
            );
          })}
        </section>

        {/* ── 3. Main Grid: 12-col ─ Recipes (8 cols) | Alerts + Activity (4 cols) ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* LEFT: Recipe suggestions ─ 8/12 */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-slate-900 inline-flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Gợi ý bữa tối hôm nay<Sparkles className="w-4 h-4 text-emerald-600" /></h2>
                <p className="text-slate-500 mt-1" style={{ fontSize: '0.8rem' }}>
                  Dựa trên nguyên liệu sẵn có và sắp hết hạn
                </p>
              </div>
              <button
                onClick={() => onNavigate('recipes')}
                className="text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
                style={{ fontSize: '0.78rem', fontWeight: 600 }}
              >
                Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hero recipe card */}
            {mealSuggestions[0] ? (
              <FeaturedRecipeCard meal={mealSuggestions[0]} onCook={() => { onNavigate('recipes'); toast.info('Mở công thức nấu ngay'); }} />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400" style={{ fontSize: '0.82rem' }}>
                Chưa có công thức phù hợp từ API
              </div>
            )}

            {/* Secondary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {mealSuggestions.slice(1).map((meal) => (
                <RecipeCard
                  key={meal.id}
                  meal={meal}
                  onCook={() => onNavigate('recipes')}
                  onAddMissing={() => { onNavigate('shopping'); toast.success(`Đã thêm ${meal.missing} nguyên liệu thiếu vào giỏ`); }}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Today's Menu ─ 4/12 */}
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
              {/* Header with AI Recommendations primary button */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-slate-900" style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Thực đơn hôm nay
                  </p>
                  <p className="text-slate-500 mt-0.5" style={{ fontSize: '0.7rem' }}>
                    {meals.filter(m => m.status === 'done').length}/{meals.length} bữa đã hoàn thành
                  </p>
                </div>
                <button
                  onClick={() => { onNavigate('recipes'); toast.info('Đang phân tích kho thực phẩm để gợi ý…'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all shrink-0"
                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI gợi ý
                </button>
              </div>

              {/* Scheduled meals list */}
              <div className="p-4 space-y-3">
                {meals.map((meal) => {
                  const Icon = meal.icon;
                  const isDone = meal.status === 'done';
                  const isUpcoming = meal.status === 'upcoming';
                  return (
                    <article
                      key={meal.id}
                      className={`group relative rounded-xl border transition-all overflow-hidden ${
                        isUpcoming
                          ? 'border-emerald-200 ring-1 ring-emerald-100 bg-emerald-50/30'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex gap-3 p-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                          <img
                            src={meal.image}
                            alt={meal.recipe}
                            className={`w-full h-full object-cover ${isDone ? 'opacity-60' : ''}`}
                          />
                          {isDone && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-md ring-1 flex items-center justify-center shrink-0 ${meal.accent}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <p className="text-slate-500" style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                              {meal.slotLabel.toUpperCase()} · {meal.time}
                            </p>
                            {isUpcoming && (
                              <span className="ml-auto px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full" style={{ fontSize: '0.58rem', fontWeight: 700 }}>
                                Sắp tới
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                            style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3 }}
                          >
                            {meal.recipe}
                          </p>

                          <div className="flex items-center justify-between gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-slate-400" style={{ fontSize: '0.68rem' }}>
                              <Users className="w-3 h-3" /> {meal.servings}
                            </span>
                            {!isDone ? (
                              <button
                                onClick={() => markCooked(meal.id, meal.recipe)}
                                className="text-emerald-700 hover:text-emerald-800 transition-colors"
                                style={{ fontSize: '0.7rem', fontWeight: 600 }}
                              >
                                Đánh dấu xong
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                <CheckCircle2 className="w-3 h-3" /> Đã nấu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('recipes')}
                  className="w-full text-center text-emerald-700 hover:text-emerald-800 transition-colors"
                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Lên kế hoạch tuần này →
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────
   Sub-components
─────────────────────────────────────────────────── */

function FeaturedRecipeCard({ meal, onCook }: { meal: typeof initialMealSuggestions[0]; onCook: () => void }) {
  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-shadow duration-300">
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="md:col-span-3 relative h-56 md:h-72 overflow-hidden bg-slate-100">
          <img src={meal.image} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur rounded-full ring-1 ring-slate-200/60 shadow-sm">
            <Flame className="w-3 h-3 text-amber-500" />
            <span className="text-slate-700" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Đề xuất hôm nay</span>
          </div>
          {meal.cookable && (
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-emerald-500 text-white rounded-full shadow-sm" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              ✓ Sẵn sàng nấu
            </div>
          )}
        </div>

        <div className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <p className="text-emerald-700" style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}>
              {meal.tagline.toUpperCase()}
            </p>
            <h3 className="text-slate-900 mt-1" style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
              {meal.name}
            </h3>

            <div className="flex items-center gap-4 mt-3 text-slate-500">
              <span className="inline-flex items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                <Clock className="w-3.5 h-3.5" /> {meal.time}
              </span>
              <span className="inline-flex items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                <Users className="w-3.5 h-3.5" /> {meal.servings}
              </span>
            </div>

            {/* Ingredient match */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-slate-600" style={{ fontSize: '0.72rem', fontWeight: 500 }}>Khớp nguyên liệu</p>
                <span className="text-emerald-700" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{meal.readyPercent}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: `${meal.readyPercent}%` }} />
              </div>
            </div>

            {/* Uses expiring tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {meal.usesExpiring.map((ing) => (
                <span key={ing} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 ring-1 ring-amber-100 rounded-full" style={{ fontSize: '0.65rem', fontWeight: 500 }}>
                  <span className="w-1 h-1 rounded-full bg-amber-500" /> {ing}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onCook}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm hover:shadow transition-all"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            <ChefHat className="w-4 h-4" /> Nấu ngay
          </button>
        </div>
      </div>
    </article>
  );
}

function RecipeCard({ meal, onCook, onAddMissing }: { meal: typeof initialMealSuggestions[0]; onCook: () => void; onAddMissing: () => void }) {
  return (
    <article className="group bg-white rounded-2xl border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)] transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative h-36 overflow-hidden bg-slate-100">
        <img src={meal.image} alt={meal.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/95 backdrop-blur text-slate-700 rounded-full ring-1 ring-slate-200/60 shadow-sm" style={{ fontSize: '0.66rem', fontWeight: 600 }}>
          {meal.readyPercent}% khớp
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h4 className="text-slate-900" style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.3 }}>{meal.name}</h4>
        <p className="text-slate-400 mt-0.5" style={{ fontSize: '0.7rem' }}>{meal.tagline}</p>

        <div className="flex items-center gap-3 mt-2.5 text-slate-500">
          <span className="inline-flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
            <Clock className="w-3 h-3" /> {meal.time}
          </span>
          <span className="inline-flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
            <Users className="w-3 h-3" /> {meal.servings}
          </span>
        </div>

        {/* Match bar */}
        <div className="mt-3">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${meal.readyPercent}%` }} />
          </div>
          <p className="text-slate-500 mt-1.5" style={{ fontSize: '0.66rem' }}>
            Thiếu {meal.missing} nguyên liệu
          </p>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onAddMissing}
            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors border border-slate-200/60"
            style={{ fontSize: '0.72rem', fontWeight: 500 }}
          >
            Thêm vào giỏ
          </button>
          <button
            onClick={onCook}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            style={{ fontSize: '0.72rem', fontWeight: 600 }}
          >
            Nấu ngay
          </button>
        </div>
      </div>
    </article>
  );
}

