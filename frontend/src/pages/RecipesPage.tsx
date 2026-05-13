import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Search, Plus, Sparkles, Clock, Users, Flame, ChefHat,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, X, Heart,
  Filter, Star, ArrowRight, Wand2,
} from 'lucide-react';

type Difficulty = 'Dễ' | 'Trung bình' | 'Khó';
type Category = 'personal' | 'community';

interface Ingredient {
  name: string;
  amount: string;
  available: boolean;
}

interface Recipe {
  id: number;
  name: string;
  category: Category;
  author?: string;
  servings: string;
  time: string;
  difficulty: Difficulty;
  calories: string;
  readyPercent: number;
  image: string;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  rating: number;
  likes?: number;
}

const initialRecipes: Recipe[] = [
  {
    id: 1, name: 'Canh chua cá cà chua', category: 'personal', servings: '4 người', time: '30 phút',
    difficulty: 'Dễ', calories: '320 kcal', readyPercent: 100, rating: 4.8,
    image: 'https://images.unsplash.com/photo-1680084570772-1da0c78362a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Cá hồi phi lê', amount: '400g', available: true },
      { name: 'Cà chua', amount: '300g', available: true },
      { name: 'Rau muống', amount: '200g', available: true },
      { name: 'Đậu bắp', amount: '100g', available: true },
      { name: 'Nước mắm', amount: '2 thìa', available: true },
      { name: 'Me chua', amount: '50g', available: true },
    ],
    steps: [
      'Làm sạch cá, cắt khúc vừa ăn. Ướp với nước mắm, tiêu trong 15 phút.',
      'Cà chua rửa sạch, cắt múi cau. Đậu bắp cắt lát. Rau muống nhặt sạch.',
      'Đun nước sôi, cho me vào nấu tan, lọc lấy nước cốt me.',
      'Phi thơm hành, cho cà chua vào xào đến khi mềm, đổ nước me vào.',
      'Cho cá vào nấu đến chín, nêm nếm cho vừa miệng.',
      'Cho đậu bắp và rau muống vào, đun thêm 2 phút rồi tắt bếp.',
    ],
    tags: ['Canh', 'Hải sản', 'Miền Nam'],
  },
  {
    id: 2, name: 'Thịt kho tàu', category: 'personal', servings: '4 người', time: '60 phút',
    difficulty: 'Trung bình', calories: '480 kcal', readyPercent: 100, rating: 4.9,
    image: 'https://images.unsplash.com/photo-1585116782242-a8ee668a7b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Thịt ba chỉ', amount: '500g', available: true },
      { name: 'Trứng gà', amount: '4 quả', available: true },
      { name: 'Nước mắm', amount: '3 thìa', available: true },
      { name: 'Đường', amount: '2 thìa', available: true },
      { name: 'Nước dừa tươi', amount: '200ml', available: true },
    ],
    steps: [
      'Thịt ba chỉ rửa sạch, cắt miếng 4x5cm. Trứng luộc chín, bóc vỏ.',
      'Ướp thịt với nước mắm, đường, tiêu, tỏi băm trong 30 phút.',
      'Thắng đường đến màu caramel, cho thịt vào đảo đều.',
      'Đổ nước dừa vào, nấu sôi rồi hạ lửa nhỏ kho 40 phút.',
      'Cho trứng vào, kho thêm 15 phút cho thấm gia vị.',
    ],
    tags: ['Kho', 'Thịt', 'Cổ điển'],
  },
  {
    id: 3, name: 'Gà xào sả ớt', category: 'personal', servings: '3 người', time: '20 phút',
    difficulty: 'Dễ', calories: '280 kcal', readyPercent: 60, rating: 4.5,
    image: 'https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Thịt gà tươi', amount: '600g', available: true },
      { name: 'Ớt đỏ', amount: '2 quả', available: true },
      { name: 'Dầu ăn', amount: '2 thìa', available: true },
      { name: 'Sả tươi', amount: '3 nhánh', available: false },
      { name: 'Lá chanh', amount: '5 lá', available: false },
    ],
    steps: [
      'Thịt gà chặt miếng vừa, rửa sạch với muối, để ráo.',
      'Sả đập dập, cắt khúc. Ớt bổ dọc. Lá chanh thái chỉ.',
      'Phi thơm sả với dầu ăn ở lửa vừa.',
      'Cho gà vào xào đến chín vàng, nêm gia vị.',
      'Cho ớt và lá chanh vào, xào thêm 2 phút rồi tắt bếp.',
    ],
    tags: ['Xào', 'Thịt gà', 'Cay'],
  },
  {
    id: 101, name: 'Bún bò Huế chuẩn vị', category: 'community', author: 'Chị Hằng - Huế', servings: '4 người', time: '120 phút',
    difficulty: 'Khó', calories: '520 kcal', readyPercent: 45, rating: 4.9, likes: 1243,
    image: 'https://images.unsplash.com/photo-1771573754093-376c871475a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Thịt bò bắp', amount: '400g', available: true },
      { name: 'Nước mắm', amount: '3 thìa', available: true },
      { name: 'Sả', amount: '4 nhánh', available: false },
      { name: 'Mắm ruốc Huế', amount: '2 thìa', available: false },
      { name: 'Bún bò tươi', amount: '400g', available: false },
    ],
    steps: [
      'Ninh xương bò với hành tím nướng 2 tiếng.',
      'Cho sả, mắm ruốc vào nước dùng, nêm nếm.',
      'Thịt bò thái lát mỏng, chần tái với nước lèo.',
      'Bún tươi trụng qua nước sôi, cho ra tô.',
      'Chan nước dùng, xếp thịt, thêm rau và sa tế.',
    ],
    tags: ['Bún', 'Bò', 'Đặc sản Huế'],
  },
  {
    id: 102, name: 'Gỏi cuốn tôm thịt', category: 'community', author: 'Anh Tuấn - Sài Gòn', servings: '2 người', time: '25 phút',
    difficulty: 'Dễ', calories: '220 kcal', readyPercent: 72, rating: 4.6, likes: 856,
    image: 'https://images.unsplash.com/photo-1560162071-da4c4a91077a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Tôm sú', amount: '200g', available: true },
      { name: 'Thịt ba chỉ', amount: '150g', available: true },
      { name: 'Rau sống tổng hợp', amount: '1 bó', available: true },
      { name: 'Bánh tráng', amount: '10 miếng', available: false },
      { name: 'Mắm nêm', amount: '50ml', available: false },
    ],
    steps: [
      'Tôm luộc chín, bóc vỏ, chẻ đôi. Thịt luộc, thái lát mỏng.',
      'Rau sống rửa sạch, để ráo.',
      'Bánh tráng nhúng nước cho mềm.',
      'Xếp rau, bún, thịt, tôm vào giữa rồi cuộn chặt.',
      'Pha nước chấm mắm nêm với tỏi ớt, đường, đậu phộng.',
    ],
    tags: ['Cuốn', 'Hải sản', 'Nhẹ nhàng'],
  },
  {
    id: 103, name: 'Bánh xèo miền Tây', category: 'community', author: 'Bếp Mai Linh', servings: '4 người', time: '45 phút',
    difficulty: 'Trung bình', calories: '410 kcal', readyPercent: 55, rating: 4.7, likes: 632,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Bột bánh xèo', amount: '300g', available: false },
      { name: 'Tôm tươi', amount: '200g', available: true },
      { name: 'Thịt ba chỉ', amount: '200g', available: true },
      { name: 'Giá đỗ', amount: '300g', available: false },
      { name: 'Nước cốt dừa', amount: '200ml', available: false },
    ],
    steps: [
      'Pha bột bánh xèo với nước cốt dừa, nghệ, hành lá.',
      'Tôm bóc vỏ, thịt thái lát. Xào sơ với hành tỏi.',
      'Đổ bột vào chảo nóng, dàn mỏng.',
      'Cho tôm, thịt, giá vào nửa bánh rồi gập đôi.',
      'Ăn kèm rau sống và nước mắm chua ngọt.',
    ],
    tags: ['Bánh', 'Đặc sản', 'Miền Tây'],
  },
];

function DifficultyBadge({ level }: { level: Difficulty }) {
  const styles = {
    'Dễ': 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    'Trung bình': 'bg-amber-50 text-amber-700 ring-amber-100',
    'Khó': 'bg-rose-50 text-rose-700 ring-rose-100',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full ring-1 ${styles[level]}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>
      {level}
    </span>
  );
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [category, setCategory] = useState<Category>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number>(initialRecipes[0].id);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set([2]));
  const [cookingId, setCookingId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Forms
  const [addOpen, setAddOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  /* ── Derived ───────────────────────────────── */
  const visibleList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes
      .filter((r) => r.category === category)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)));
  }, [recipes, category, searchQuery]);

  const selected = recipes.find((r) => r.id === selectedId) ?? visibleList[0] ?? recipes[0];
  const missing = selected.ingredients.filter((i) => !i.available);
  const available = selected.ingredients.filter((i) => i.available);

  /* ── Handlers ──────────────────────────────── */
  const toggleBookmark = (id: number, name: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.success(`Đã bỏ lưu "${name}"`); }
      else { next.add(id); toast.success(`Đã lưu "${name}"`); }
      return next;
    });
  };

  const handleAddToShopping = () => {
    toast.success(`Đã thêm ${missing.length} nguyên liệu vào danh sách đi chợ`);
  };

  const startCooking = () => {
    setCookingId(selected.id);
    setActiveStep(0);
    toast.info('Bắt đầu nấu — chúc ngon miệng!');
  };

  const handleCreateRecipe = (data: NewRecipeData) => {
    const id = Date.now();
    const ingredients: Ingredient[] = data.ingredients
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, amount = ''] = line.split('|').map((s) => s.trim());
        return { name, amount, available: true };
      });
    const steps = data.steps.split('\n').map((s) => s.trim()).filter(Boolean);

    const newRecipe: Recipe = {
      id,
      name: data.name,
      category: 'personal',
      servings: data.servings || '4 người',
      time: data.time || '30 phút',
      difficulty: data.difficulty,
      calories: data.calories || '— kcal',
      readyPercent: 100,
      rating: 0,
      image: data.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
      ingredients: ingredients.length ? ingredients : [{ name: 'Chưa thêm nguyên liệu', amount: '', available: true }],
      steps: steps.length ? steps : ['Chưa có hướng dẫn'],
      tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    setRecipes((r) => [newRecipe, ...r]);
    setCategory('personal');
    setSelectedId(id);
    setAddOpen(false);
    toast.success(`Đã tạo công thức "${data.name}"`);
  };

  const handleAISuggest = (requirements: string) => {
    setAiOpen(false);
    toast.success('AI đã gợi ý 3 công thức phù hợp với yêu cầu của bạn');
    // Surface a representative suggestion based on requirements keyword (mock)
    const match = recipes.find((r) =>
      requirements.toLowerCase().split(/\s+/).some((kw) => kw && (r.name.toLowerCase().includes(kw) || r.tags.join(' ').toLowerCase().includes(kw))),
    ) ?? recipes[0];
    setCategory(match.category);
    setSelectedId(match.id);
  };

  /* ── Render ────────────────────────────────── */
  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* ── LEFT: Master list (30%) ────────────── */}
      <div className="w-[30%] min-w-[300px] max-w-[420px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        {/* Header: search + tabs + filter */}
        <div className="px-4 py-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Công thức</p>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              style={{ fontSize: '0.72rem', fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            {(['personal', 'community'] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); }}
                className={`py-1.5 rounded-lg transition-all ${
                  category === c ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {c === 'personal' ? 'Của tôi' : 'Cộng đồng'}
                <span className="ml-1 opacity-60" style={{ fontSize: '0.66rem' }}>
                  ({recipes.filter((r) => r.category === c).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc thẻ..."
              className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              style={{ fontSize: '0.78rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* AI Suggest CTA */}
          <button
            onClick={() => setAiOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 ring-1 ring-emerald-100 text-emerald-700 rounded-lg hover:from-emerald-100 hover:to-teal-100 transition-all"
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI gợi ý công thức
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {visibleList.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Filter className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-500 mt-3" style={{ fontSize: '0.8rem' }}>Không có công thức phù hợp</p>
              <p className="text-slate-400 mt-1" style={{ fontSize: '0.7rem' }}>Thử thay đổi từ khoá hoặc tab</p>
            </div>
          ) : (
            visibleList.map((r) => {
              const isSelected = selected.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelectedId(r.id); setCookingId(null); }}
                  className={`w-full text-left border-b border-slate-50 transition-all ${
                    isSelected ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex gap-3 p-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`truncate ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {r.name}
                      </p>
                      {r.author && (
                        <p className="text-slate-400 truncate" style={{ fontSize: '0.66rem' }}>{r.author}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <DifficultyBadge level={r.difficulty} />
                        <span className="text-slate-400" style={{ fontSize: '0.68rem' }}>{r.time}</span>
                        {bookmarked.has(r.id) && (
                          <BookmarkCheck className="w-3 h-3 text-emerald-600 ml-auto" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.readyPercent === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${r.readyPercent}%` }} />
                        </div>
                        <span className={`shrink-0 ${r.readyPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                          {r.readyPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
          <p className="text-slate-500 text-center" style={{ fontSize: '0.7rem' }}>
            {visibleList.length} công thức · {visibleList.filter((r) => r.readyPercent === 100).length} nấu ngay được
          </p>
        </div>
      </div>

      {/* ── RIGHT: Detail (70%) ───────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">

          {/* Hero */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-200 shadow-sm">
            <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 backdrop-blur-sm rounded-full ${selected.category === 'personal' ? 'bg-white/95 text-emerald-700 ring-1 ring-emerald-200' : 'bg-violet-500/95 text-white'}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                {selected.category === 'personal' ? <ChefHat className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                {selected.category === 'personal' ? 'Của tôi' : 'Cộng đồng'}
              </span>
              {selected.author && (
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-slate-700 rounded-full" style={{ fontSize: '0.68rem', fontWeight: 500 }}>
                  bởi {selected.author}
                </span>
              )}
            </div>

            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1.5 rounded-full backdrop-blur-sm ${selected.readyPercent === 100 ? 'bg-emerald-500/95 text-white' : 'bg-amber-50/95 text-amber-800 ring-1 ring-amber-200'}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {selected.readyPercent === 100 ? '✓ Nấu ngay được' : `${selected.readyPercent}% nguyên liệu`}
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-white" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{selected.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {selected.rating > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-300" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        <Star className="w-3.5 h-3.5 fill-current" /> {selected.rating}
                      </span>
                    )}
                    {selected.likes && (
                      <span className="inline-flex items-center gap-1 text-rose-300" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        <Heart className="w-3.5 h-3.5 fill-current" /> {selected.likes}
                      </span>
                    )}
                    <DifficultyBadge level={selected.difficulty} />
                  </div>
                </div>
                <button
                  onClick={() => toggleBookmark(selected.id, selected.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-sm text-slate-800 rounded-xl hover:bg-white transition-colors shadow-sm"
                  style={{ fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {bookmarked.has(selected.id) ? <><BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" /> Đã lưu</> : <><Bookmark className="w-3.5 h-3.5" /> Lưu</>}
                </button>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { Icon: Clock, label: 'Thời gian', value: selected.time },
              { Icon: Users, label: 'Khẩu phần', value: selected.servings },
              { Icon: ChefHat, label: 'Độ khó', value: selected.difficulty },
              { Icon: Flame, label: 'Calories', value: selected.calories },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                <m.Icon className="w-4 h-4 text-slate-400 mx-auto" />
                <p className="text-slate-900 mt-1.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.value}</p>
                <p className="text-slate-400 mt-0.5" style={{ fontSize: '0.65rem' }}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {selected.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-full" style={{ fontSize: '0.7rem' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50/60 border-b border-emerald-100">
                <p className="text-emerald-800" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Nguyên liệu đã có ({available.length})
                </p>
              </div>
              <div className="p-3 space-y-1">
                {available.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-emerald-50/50">
                    <span className="text-slate-700" style={{ fontSize: '0.8rem' }}>{ing.name}</span>
                    <span className="text-slate-400" style={{ fontSize: '0.72rem' }}>{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`bg-white rounded-xl border overflow-hidden ${missing.length > 0 ? 'border-amber-100' : 'border-slate-100'}`}>
              <div className={`px-4 py-3 border-b ${missing.length > 0 ? 'bg-amber-50/60 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                <p className={missing.length > 0 ? 'text-amber-800' : 'text-slate-600'} style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Cần mua thêm ({missing.length})
                </p>
              </div>
              <div className="p-3 space-y-1">
                {missing.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-slate-400" style={{ fontSize: '0.78rem' }}>Đã có đủ nguyên liệu!</p>
                  </div>
                ) : missing.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-amber-50/40">
                    <span className="text-slate-700" style={{ fontSize: '0.8rem' }}>{ing.name}</span>
                    <span className="text-slate-400" style={{ fontSize: '0.72rem' }}>{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          {missing.length > 0 && (
            <button onClick={handleAddToShopping} className="w-full p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm hover:shadow inline-flex items-center justify-center gap-2" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Thêm {missing.length} đồ thiếu vào danh sách đi chợ <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {selected.readyPercent === 100 && cookingId !== selected.id && (
            <button onClick={startCooking} className="w-full p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm hover:shadow inline-flex items-center justify-center gap-2" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              <ChefHat className="w-4 h-4" /> Bắt đầu nấu ngay!
            </button>
          )}

          {/* Steps */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <p className="text-slate-900" style={{ fontSize: '0.88rem', fontWeight: 600 }}>Hướng dẫn nấu ăn</p>
              {cookingId === selected.id && (
                <span className="text-emerald-600" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                  Bước {activeStep + 1}/{selected.steps.length}
                </span>
              )}
            </div>
            <div className="p-5 space-y-2.5">
              {selected.steps.map((step, i) => {
                const isCooking = cookingId === selected.id;
                const isDone = isCooking && i < activeStep;
                const isCurrent = isCooking && i === activeStep;
                return (
                  <button
                    key={i}
                    onClick={() => isCooking && setActiveStep(i)}
                    disabled={!isCooking}
                    className={`w-full flex gap-3.5 text-left rounded-lg p-2.5 transition-all ${
                      isCurrent ? 'bg-emerald-50 ring-1 ring-emerald-200' : isDone ? 'opacity-60' : 'hover:bg-slate-50'
                    } ${isCooking ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white'
                    }`} style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <p className={`pt-0.5 ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`} style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {step}
                    </p>
                  </button>
                );
              })}

              {cookingId === selected.id && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                    disabled={activeStep === 0}
                    className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1"
                    style={{ fontSize: '0.78rem', fontWeight: 500 }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Bước trước
                  </button>
                  {activeStep < selected.steps.length - 1 ? (
                    <button
                      onClick={() => setActiveStep((s) => s + 1)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center justify-center gap-1"
                      style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      Bước tiếp <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setCookingId(null); toast.success('Hoàn thành! Chúc cả nhà ngon miệng.'); }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      Hoàn thành ✓
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {addOpen && <AddRecipeForm onClose={() => setAddOpen(false)} onSubmit={handleCreateRecipe} />}
      {aiOpen && <AISuggestionForm onClose={() => setAiOpen(false)} onSubmit={handleAISuggest} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sub-component: AddRecipeForm
───────────────────────────────────────────────── */
interface NewRecipeData {
  name: string;
  servings: string;
  time: string;
  difficulty: Difficulty;
  calories: string;
  image: string;
  tags: string;
  ingredients: string;
  steps: string;
}

function AddRecipeForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: NewRecipeData) => void }) {
  const [form, setForm] = useState<NewRecipeData>({
    name: '', servings: '4 người', time: '30 phút',
    difficulty: 'Dễ', calories: '', image: '', tags: '',
    ingredients: '', steps: '',
  });

  const update = <K extends keyof NewRecipeData>(k: K, v: NewRecipeData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên công thức'); return; }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700 }}>Thêm công thức mới</p>
            <p className="text-slate-500 mt-0.5" style={{ fontSize: '0.72rem' }}>Lưu công thức của riêng bạn</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Tên công thức *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="VD: Cá kho tộ"
              className="form-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Khẩu phần">
              <input type="text" value={form.servings} onChange={(e) => update('servings', e.target.value)} className="form-input" />
            </Field>
            <Field label="Thời gian">
              <input type="text" value={form.time} onChange={(e) => update('time', e.target.value)} className="form-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Độ khó">
              <select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value as Difficulty)} className="form-input">
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khó">Khó</option>
              </select>
            </Field>
            <Field label="Calories">
              <input type="text" value={form.calories} onChange={(e) => update('calories', e.target.value)} placeholder="VD: 350 kcal" className="form-input" />
            </Field>
          </div>

          <Field label="URL hình ảnh">
            <input type="text" value={form.image} onChange={(e) => update('image', e.target.value)} placeholder="https://..." className="form-input" />
          </Field>

          <Field label="Thẻ (cách nhau bằng dấu phẩy)">
            <input type="text" value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="Canh, Hải sản, Miền Trung" className="form-input" />
          </Field>

          <Field label="Nguyên liệu (mỗi dòng: tên | số lượng)">
            <textarea
              value={form.ingredients}
              onChange={(e) => update('ingredients', e.target.value)}
              rows={4}
              placeholder={'Cá lóc | 500g\nCà chua | 200g\nNước mắm | 2 thìa'}
              className="form-input font-mono"
            />
          </Field>

          <Field label="Các bước (mỗi dòng là một bước)">
            <textarea
              value={form.steps}
              onChange={(e) => update('steps', e.target.value)}
              rows={5}
              placeholder={'Sơ chế cá, ướp gia vị 15 phút\nPhi thơm hành tỏi\n...'}
              className="form-input"
            />
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            Huỷ
          </button>
          <button onClick={submit} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            <Plus className="w-3.5 h-3.5" /> Lưu công thức
          </button>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.55rem 0.75rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          color: #334155;
          font-size: 0.82rem;
          outline: none;
          transition: all 0.15s;
        }
        .form-input:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(167,243,208,0.5);
          background: white;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Sub-component: AISuggestionForm
───────────────────────────────────────────────── */
function AISuggestionForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (requirements: string) => void }) {
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    'Bữa tối nhẹ nhàng cho 4 người',
    'Món chay dễ làm',
    'Tận dụng cà chua và cá sắp hết hạn',
    'Món cay đậm vị miền Trung',
  ];

  const handleSubmit = () => {
    if (!requirements.trim()) { toast.error('Vui lòng mô tả yêu cầu của bạn'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onSubmit(requirements.trim()); }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm ring-1 ring-emerald-100 flex items-center justify-center shrink-0">
              <Wand2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700 }}>AI Gợi ý công thức</p>
              <p className="text-slate-600 mt-0.5" style={{ fontSize: '0.74rem' }}>
                Mô tả nhu cầu — AI sẽ chọn công thức phù hợp từ kho thực phẩm
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Yêu cầu tuỳ chỉnh">
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="VD: Tôi muốn nấu bữa tối ít calo, ưu tiên dùng cá hồi và rau muống đang có sẵn..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all resize-none"
              style={{ fontSize: '0.82rem', lineHeight: 1.55 }}
            />
          </Field>

          <div>
            <p className="text-slate-600 mb-2" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Hoặc chọn gợi ý nhanh:</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setRequirements(p)}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 rounded-lg transition-colors"
                  style={{ fontSize: '0.72rem' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg shadow-sm"
            style={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            {loading ? <>Đang phân tích...</> : <><Sparkles className="w-3.5 h-3.5" /> Gợi ý ngay</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-slate-700 mb-1.5" style={{ fontSize: '0.74rem', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}
