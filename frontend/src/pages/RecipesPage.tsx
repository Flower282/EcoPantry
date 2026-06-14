import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Search, Plus, Sparkles, Clock, Users, Flame, ChefHat,
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, X, Heart,
  Filter, Star, ArrowRight, Wand2, Loader2,
} from 'lucide-react';
import { ingredientsApi, recipesApi, shoppingApi, type IngredientItem, type RecipeItem, type RecipeSuggestionItem } from '@/lib/api';
import { normaliseWeight, parseQty } from '@/lib/quantity';
import { useRecipeDataStore } from '@/stores/recipeDataStore';

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
      { name: 'Cá há»“i phi lê', amount: '400g', available: true },
      { name: 'Cà chua', amount: '300g', available: true },
      { name: 'Rau muá»‘ng', amount: '200g', available: true },
      { name: 'Đậu bắp', amount: '100g', available: true },
      { name: 'Nưá»›c mắm', amount: '2 thìa', available: true },
      { name: 'Me chua', amount: '50g', available: true },
    ],
    steps: [
      'Làm sạch cá, cắt khúc vừa Äƒn. Ưá»›p vá»›i nưá»›c mắm, tiêu trong 15 phút.',
      'Cà chua rửa sạch, cắt múi cau. Đậu bắp cắt lát. Rau muá»‘ng nhặt sạch.',
      'Đun nưá»›c sôi, cho me vào nấu tan, lọc lấy nưá»›c cá»‘t me.',
      'Phi thơm hành, cho cà chua vào xào Ä‘ến khi mềm, Ä‘á»• nưá»›c me vào.',
      'Cho cá vào nấu Ä‘ến chín, nêm nếm cho vừa miá»‡ng.',
      'Cho Ä‘ậu bắp và rau muá»‘ng vào, Ä‘un thêm 2 phút rá»“i tắt bếp.',
    ],
    tags: ['Canh', 'Hải sản', 'Miền Nam'],
  },
  {
    id: 2, name: 'Thá»‹t kho tàu', category: 'personal', servings: '4 người', time: '60 phút',
    difficulty: 'Trung bình', calories: '480 kcal', readyPercent: 100, rating: 4.9,
    image: 'https://images.unsplash.com/photo-1585116782242-a8ee668a7b9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Thá»‹t ba chá»‰', amount: '500g', available: true },
      { name: 'Trứng gà', amount: '4 quả', available: true },
      { name: 'Nưá»›c mắm', amount: '3 thìa', available: true },
      { name: 'Đường', amount: '2 thìa', available: true },
      { name: 'Nưá»›c dừa tươi', amount: '200ml', available: true },
    ],
    steps: [
      'Thá»‹t ba chá»‰ rửa sạch, cắt miếng 4x5cm. Trứng luá»™c chín, bóc vỏ.',
      'Ưá»›p thá»‹t vá»›i nưá»›c mắm, Ä‘ường, tiêu, tỏi bÄƒm trong 30 phút.',
      'Thắng Ä‘ường Ä‘ến màu caramel, cho thá»‹t vào Ä‘ảo Ä‘ều.',
      'Đá»• nưá»›c dừa vào, nấu sôi rá»“i hạ lửa nhỏ kho 40 phút.',
      'Cho trứng vào, kho thêm 15 phút cho thấm gia vá»‹.',
    ],
    tags: ['Kho', 'Thá»‹t', 'Cá»• Ä‘iá»ƒn'],
  },
  {
    id: 3, name: 'Gà xào sả á»›t', category: 'personal', servings: '3 người', time: '20 phút',
    difficulty: 'Dễ', calories: '280 kcal', readyPercent: 60, rating: 4.5,
    image: 'https://images.unsplash.com/photo-1614955177711-2540ad25432b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Thá»‹t gà tươi', amount: '600g', available: true },
      { name: 'á»št Ä‘ỏ', amount: '2 quả', available: true },
      { name: 'Dầu Äƒn', amount: '2 thìa', available: true },
      { name: 'Sả tươi', amount: '3 nhánh', available: false },
      { name: 'Lá chanh', amount: '5 lá', available: false },
    ],
    steps: [
      'Thá»‹t gà chặt miếng vừa, rửa sạch vá»›i muá»‘i, Ä‘á»ƒ ráo.',
      'Sả Ä‘ập dập, cắt khúc. á»št bá»• dọc. Lá chanh thái chá»‰.',
      'Phi thơm sả vá»›i dầu Äƒn á»Ÿ lửa vừa.',
      'Cho gà vào xào Ä‘ến chín vàng, nêm gia vá»‹.',
      'Cho á»›t và lá chanh vào, xào thêm 2 phút rá»“i tắt bếp.',
    ],
    tags: ['Xào', 'Thá»‹t gà', 'Cay'],
  },
  {
    id: 101, name: 'Bún bò Huế chuẩn vá»‹', category: 'community', author: 'Chá»‹ Hằng - Huế', servings: '4 người', time: '120 phút',
    difficulty: 'Khó', calories: '520 kcal', readyPercent: 45, rating: 4.9, likes: 1243,
    image: 'https://images.unsplash.com/photo-1771573754093-376c871475a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Thá»‹t bò bắp', amount: '400g', available: true },
      { name: 'Nưá»›c mắm', amount: '3 thìa', available: true },
      { name: 'Sả', amount: '4 nhánh', available: false },
      { name: 'Mắm ruá»‘c Huế', amount: '2 thìa', available: false },
      { name: 'Bún bò tươi', amount: '400g', available: false },
    ],
    steps: [
      'Ninh xương bò vá»›i hành tím nưá»›ng 2 tiếng.',
      'Cho sả, mắm ruá»‘c vào nưá»›c dùng, nêm nếm.',
      'Thá»‹t bò thái lát mỏng, chần tái vá»›i nưá»›c lèo.',
      'Bún tươi trụng qua nưá»›c sôi, cho ra tô.',
      'Chan nưá»›c dùng, xếp thá»‹t, thêm rau và sa tế.',
    ],
    tags: ['Bún', 'Bò', 'Đặc sản Huế'],
  },
  {
    id: 102, name: 'Gỏi cuá»‘n tôm thá»‹t', category: 'community', author: 'Anh Tuấn - Sài Gòn', servings: '2 người', time: '25 phút',
    difficulty: 'Dễ', calories: '220 kcal', readyPercent: 72, rating: 4.6, likes: 856,
    image: 'https://images.unsplash.com/photo-1560162071-da4c4a91077a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Tôm sú', amount: '200g', available: true },
      { name: 'Thá»‹t ba chá»‰', amount: '150g', available: true },
      { name: 'Rau sá»‘ng tá»•ng hợp', amount: '1 bó', available: true },
      { name: 'Bánh tráng', amount: '10 miếng', available: false },
      { name: 'Mắm nêm', amount: '50ml', available: false },
    ],
    steps: [
      'Tôm luá»™c chín, bóc vỏ, chẻ Ä‘ôi. Thá»‹t luá»™c, thái lát mỏng.',
      'Rau sá»‘ng rửa sạch, Ä‘á»ƒ ráo.',
      'Bánh tráng nhúng nưá»›c cho mềm.',
      'Xếp rau, bún, thá»‹t, tôm vào giữa rá»“i cuá»™n chặt.',
      'Pha nưá»›c chấm mắm nêm vá»›i tỏi á»›t, Ä‘ường, Ä‘ậu phá»™ng.',
    ],
    tags: ['Cuá»‘n', 'Hải sản', 'Nhẹ nhàng'],
  },
  {
    id: 103, name: 'Bánh xèo miền Tây', category: 'community', author: 'Bếp Mai Linh', servings: '4 người', time: '45 phút',
    difficulty: 'Trung bình', calories: '410 kcal', readyPercent: 55, rating: 4.7, likes: 632,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: [
      { name: 'Bá»™t bánh xèo', amount: '300g', available: false },
      { name: 'Tôm tươi', amount: '200g', available: true },
      { name: 'Thá»‹t ba chá»‰', amount: '200g', available: true },
      { name: 'Giá Ä‘á»—', amount: '300g', available: false },
      { name: 'Nưá»›c cá»‘t dừa', amount: '200ml', available: false },
    ],
    steps: [
      'Pha bá»™t bánh xèo vá»›i nưá»›c cá»‘t dừa, nghá»‡, hành lá.',
      'Tôm bóc vỏ, thá»‹t thái lát. Xào sơ vá»›i hành tỏi.',
      'Đá»• bá»™t vào chảo nóng, dàn mỏng.',
      'Cho tôm, thá»‹t, giá vào nửa bánh rá»“i gập Ä‘ôi.',
      'Ä‚n kèm rau sá»‘ng và nưá»›c mắm chua ngọt.',
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ä‘/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUnit(unit: string) {
  const value = normalizeText(unit);
  if (['g', 'gram', 'gam'].includes(value)) return 'g';
  if (['kg', 'kilogram'].includes(value)) return 'kg';
  if (['ml', 'mililit'].includes(value)) return 'ml';
  if (['l', 'lit', 'lít'].includes(unit.toLowerCase())) return 'l';
  return value;
}

function parseAmount(amount: string) {
  const parsed = parseQty(amount);
  if (!parsed) return null;
  return { value: parsed.value, unit: normalizeUnit(parsed.unit) };
}

function ingredientNameMatches(recipeName: string, inventoryName: string) {
  const recipe = normalizeText(recipeName);
  const inventory = normalizeText(inventoryName);
  return recipe === inventory || recipe.includes(inventory) || inventory.includes(recipe);
}

function findInventoryMatch(ingredient: Ingredient, inventoryItems: IngredientItem[]) {
  return inventoryItems.find((item) => ingredientNameMatches(ingredient.name, item.name));
}

function hasEnoughIngredient(ingredient: Ingredient, inventoryItems: IngredientItem[]) {
  const item = findInventoryMatch(ingredient, inventoryItems);
  if (!item) return false;

  const needed = parseAmount(ingredient.amount);
  const stock = parseAmount(`${item.quantity} ${item.unit}`);
  if (!needed || !stock) return Number(item.quantity) > 0;

  const neededNorm = normaliseWeight(needed.value, needed.unit);
  const stockNorm = normaliseWeight(stock.value, stock.unit);
  if (neededNorm.base !== stockNorm.base) return Number(item.quantity) > 0;
  if (neededNorm.base === 'other' && needed.unit !== stock.unit) return Number(item.quantity) > 0;

  return stockNorm.value >= neededNorm.value;
}

function applyInventoryToRecipe(recipe: Recipe, inventoryItems: IngredientItem[]): Recipe {
  const ingredients = recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    available: hasEnoughIngredient(ingredient, inventoryItems),
  }));
  const availableCount = ingredients.filter((ingredient) => ingredient.available).length;

  return {
    ...recipe,
    ingredients,
    readyPercent: ingredients.length ? Math.round((availableCount / ingredients.length) * 100) : 0,
  };
}

function deductIngredientFromInventory(ingredient: Ingredient, inventoryItems: IngredientItem[]) {
  let deducted = false;
  const needed = parseAmount(ingredient.amount);

  return inventoryItems
    .map((item) => {
      if (deducted || !ingredientNameMatches(ingredient.name, item.name)) return item;

      const stock = parseAmount(`${item.quantity} ${item.unit}`);
      if (!needed || !stock) return item;

      const neededNorm = normaliseWeight(needed.value, needed.unit);
      const stockNorm = normaliseWeight(stock.value, stock.unit);
      if (neededNorm.base !== stockNorm.base) return item;
      if (neededNorm.base === 'other' && needed.unit !== stock.unit) return item;

      const remainingBaseValue = Math.max(0, stockNorm.value - neededNorm.value);
      const itemUnit = normalizeUnit(item.unit);
      const remaining = itemUnit === 'kg' || itemUnit === 'l'
        ? remainingBaseValue / 1000
        : remainingBaseValue;

      deducted = true;
      return { ...item, quantity: Number(remaining.toFixed(2)).toString() };
    })
    .filter((item) => Number(item.quantity) > 0);
}

function normalizeDifficulty(value?: string | null): Difficulty {
  const normalized = normalizeText(value || '');
  if (normalized === 'kho') return 'Khó';
  if (normalized.includes('trung binh')) return 'Trung bình';
  return 'Dễ';
}

function mapApiRecipe(r: RecipeItem, category: Category = 'personal'): Recipe {
  return {
    id: r.id,
    name: r.title,
    category,
    author: r.created_by_name || undefined,
    servings: r.servings || '4 người',
    time: r.time || '30 phút',
    difficulty: normalizeDifficulty(r.difficulty),
    calories: r.calories || '— kcal',
    readyPercent: 100,
    rating: 0,
    image: r.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients: (r.ingredients || []).map((ing) => ({
      name: ing.name,
      amount: `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}`,
      available: false,
    })),
    steps: r.instructions ? r.instructions.split('\n').filter(Boolean) : ['Chưa có hướng dẫn'],
    tags: r.tags || [],
  };
}

function buildSuggestionSteps(suggestion: RecipeSuggestionItem) {
  const matchedIngredients = suggestion.matchedIngredients || [];
  const missingIngredients = suggestion.missingIngredients || [];
  const dishType = suggestion.dishType || 'món ăn';

  const steps = [
    matchedIngredients.length
      ? `Chuẩn bị các nguyên liệu đang có: ${matchedIngredients.join(', ')}.`
      : 'Chuẩn bị các nguyên liệu hiện có trong kho.',
  ];

  if (missingIngredients.length) {
    steps.push(`Nếu muốn nấu đầy đủ, cần bổ sung thêm: ${missingIngredients.join(', ')}.`);
  }

  steps.push(`Sơ chế nguyên liệu và chia theo nhóm chính, rồi bắt đầu chế biến theo kiểu ${dishType}.`);

  if (normalizeText(dishType).includes('canh') || normalizeText(dishType).includes('mon nuoc')) {
    steps.push('Đun nước hoặc nước dùng, cho nguyên liệu chính vào trước, sau đó thêm rau và gia vị ở cuối để giữ vị tươi.');
  } else if (normalizeText(dishType).includes('xao')) {
    steps.push('Làm nóng chảo, phi thơm gia vị, xào nguyên liệu chính trước rồi thêm rau củ và nêm nếm vừa ăn.');
  } else if (normalizeText(dishType).includes('kho')) {
    steps.push('Ướp nguyên liệu với gia vị, đun lửa vừa cho sôi rồi hạ nhỏ lửa để món thấm đều.');
  } else {
    steps.push('Chế biến món theo khẩu vị gia đình, ưu tiên nấu chín nguyên liệu chính trước rồi hoàn thiện với gia vị.');
  }

  steps.push('Nêm nếm lại lần cuối, trình bày ra đĩa hoặc tô và dùng nóng.');
  return steps;
}

function mapSuggestionRecipe(suggestion: RecipeSuggestionItem, index: number): Recipe {
  const ingredientMatches = Array.isArray(suggestion.ingredientMatches)
    ? suggestion.ingredientMatches as Array<{
      ingredient_name?: string;
      ingredient_quantity?: string | null;
      stock_name?: string | null;
    }>
    : [];
  const ingredients = ingredientMatches.length > 0
    ? ingredientMatches.map((match) => ({
      name: match.ingredient_name || 'Nguyên liệu',
      amount: match.ingredient_quantity ? String(match.ingredient_quantity) : '',
      available: Boolean(match.stock_name),
    }))
    : [
      ...(suggestion.matchedIngredients || []).map((name) => ({ name, amount: '', available: true })),
      ...(suggestion.missingIngredients || []).map((name) => ({ name, amount: '', available: false })),
    ];

  return {
    id: -Date.now() - index,
    name: suggestion.title,
    category: 'community',
    author: suggestion.source === 'food-recommendation-api' ? 'KHDL Food Recommendation' : 'EcoPantry DB',
    servings: suggestion.servings || 'Theo công thức',
    time: suggestion.time || 'Không rõ',
    difficulty: normalizeDifficulty(suggestion.difficulty),
    calories: suggestion.calories || '— kcal',
    readyPercent: Math.round(Number(suggestion.matchScore || 0) * 100),
    rating: 0,
    image: suggestion.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
    ingredients,
    steps: suggestion.instructions
      ? suggestion.instructions.split('\n').filter(Boolean)
      : buildSuggestionSteps(suggestion),
    tags: [suggestion.dishType || 'Gợi ý'].filter(Boolean),
  };
}

function extractMaxMinutes(requirements: string) {
  const normalized = normalizeText(requirements);
  const hourMatch = normalized.match(/(\d+)\s*(gio|g|tieng)/);
  if (hourMatch) return Number(hourMatch[1]) * 60;

  const minuteMatch = normalized.match(/(\d+)\s*(phut|p)\b/);
  if (minuteMatch) return Number(minuteMatch[1]);

  if (
    normalized.includes('nhanh')
    || normalized.includes('gap')
    || normalized.includes('don gian')
    || normalized.includes('it thoi gian')
    || normalized.includes('nhanh gon')
  ) {
    return 30;
  }

  return undefined;
}

function parsePromptFilters(requirements: string) {
  const normalized = normalizeText(requirements);
  const requiredTypes = new Set<string>();

  const dishTypeMatchers: Array<{ keywords: string[]; value: string }> = [
    { keywords: ['mon chay', 'chay'], value: 'mon chay' },
    { keywords: ['canh', 'sup'], value: 'canh' },
    { keywords: ['xao'], value: 'xao' },
    { keywords: ['chien', 'ran'], value: 'chien' },
    { keywords: ['kho'], value: 'kho' },
    { keywords: ['nuong'], value: 'nuong' },
    { keywords: ['hap'], value: 'hap' },
    { keywords: ['lau'], value: 'lau' },
    { keywords: ['bun', 'pho', 'hu tieu', 'mi nuoc', 'mon nuoc'], value: 'mon nuoc' },
    { keywords: ['salad', 'goi'], value: 'salad' },
  ];

  let dishTypeFilter: string | undefined;
  for (const matcher of dishTypeMatchers) {
    if (matcher.keywords.some((keyword) => normalized.includes(keyword))) {
      dishTypeFilter = matcher.value;
      requiredTypes.add(matcher.value);
      break;
    }
  }

  if (normalized.includes('bua toi')) requiredTypes.add('mon man');
  if (normalized.includes('bua sang')) requiredTypes.add('mon nuoc');
  if (normalized.includes('an nhe') || normalized.includes('nhe nhang') || normalized.includes('it calo')) {
    if (!dishTypeFilter) dishTypeFilter = 'salad';
  }

  return {
    requirements,
    dishTypeFilter,
    requiredTypes: requiredTypes.size ? Array.from(requiredTypes) : undefined,
    maxMinutes: extractMaxMinutes(requirements),
  };
}

interface AISuggestionPayload {
  requirements: string;
  selectedIngredients: IngredientItem[];
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryItems, setInventoryItems] = useState<IngredientItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<Category>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [cookingId, setCookingId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Forms
  const [addOpen, setAddOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const loadRecipeData = useRecipeDataStore((state) => state.loadAll);
  const setCachedSavedRecipes = useRecipeDataStore((state) => state.setSavedRecipes);
  const setCachedInventoryItems = useRecipeDataStore((state) => state.setInventoryItems);

  // Fetch saved recipes from API and merge with local
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      try {
        await loadRecipeData(true);
        const {
          savedRecipes: apiRecipes,
          communityRecipes,
          inventoryItems: inventory,
          error,
        } = useRecipeDataStore.getState();
        if (error) throw new Error(error);

        const personalMapped: Recipe[] = apiRecipes.map((recipe) => applyInventoryToRecipe(mapApiRecipe(recipe, 'personal'), inventory));
        const communityMapped: Recipe[] = communityRecipes.map((recipe) => applyInventoryToRecipe(mapApiRecipe(recipe, 'community'), inventory));
        setInventoryItems(inventory);
        setRecipes([...personalMapped, ...communityMapped]);
        setSelectedId(null);
        if (personalMapped.length === 0 && communityMapped.length > 0) {
          setCategory('community');
        }
        setBookmarked(new Set(personalMapped.map((r) => r.id)));
      } catch (err) {
        toast.error('Không thể tải công thức: ' + (err as Error).message);
        setRecipes([]);
        setSelectedId(null);
        setBookmarked(new Set());
      }
      finally { setIsLoading(false); }
    };
    fetchRecipes();
  }, [loadRecipeData]);

  /* â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const visibleList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return recipes
      .filter((r) => r.category === category)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)));
  }, [recipes, category, searchQuery]);

  const selected = selectedId !== null ? recipes.find((r) => r.id === selectedId) ?? null : null;
  const missing = selected?.ingredients.filter((i) => !i.available) ?? [];
  const available = selected?.ingredients.filter((i) => i.available) ?? [];

  /* â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const toggleBookmarkLocal = (id: number, name: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.success(`Đã bỏ lưu "${name}"`); }
      else { next.add(id); toast.success(`Đã lưu "${name}"`); }
      return next;
    });
  };

  const reloadRecipes = async () => {
    await loadRecipeData(true);
    const {
      savedRecipes: apiRecipes,
      communityRecipes,
      inventoryItems: inventory,
    } = useRecipeDataStore.getState();
    const personalMapped = apiRecipes.map((recipe) => applyInventoryToRecipe(mapApiRecipe(recipe, 'personal'), inventory));
    const communityMapped = communityRecipes.map((recipe) => applyInventoryToRecipe(mapApiRecipe(recipe, 'community'), inventory));
    setInventoryItems(inventory);
    setRecipes([...personalMapped, ...communityMapped]);
    setBookmarked(new Set(personalMapped.map((r) => r.id)));
    setSelectedId((current) => current);
    if (personalMapped.length === 0 && communityMapped.length > 0) {
      setCategory('community');
    }
  };

  const toggleBookmark = async (id: number, name: string) => {
    try {
      if (id < 0) {
        const recipeToSave = recipes.find(r => r.id === id);
        if (!recipeToSave) return;
        
        const savedRecipes = await recipesApi.add({
          title: recipeToSave.name,
          instructions: recipeToSave.steps.join('\n') || 'Chưa có hướng dẫn',
          image_url: recipeToSave.image || '',
          ingredients: recipeToSave.ingredients.length 
            ? recipeToSave.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.amount || '',
                unit: ''
              })) 
            : [{ name: 'Chưa thêm nguyên liệu', quantity: '', unit: '' }],
          servings: recipeToSave.servings || '2 người',
          time: recipeToSave.time || '30 phút',
          difficulty: recipeToSave.difficulty || 'Trung bình',
          calories: recipeToSave.calories || '0 kcal',
          tags: recipeToSave.tags || [],
          created_by_name: '',
        });

        const mapped = savedRecipes.map((recipe) => applyInventoryToRecipe(mapApiRecipe(recipe, 'personal'), inventoryItems));
        setCachedSavedRecipes(savedRecipes);
        
        const newlyAdded = mapped.find(r => r.name === recipeToSave.name);
        
        setRecipes((prev) => [
          ...mapped,
          ...prev.filter((r) => r.category !== 'personal' && r.id !== id),
        ]);
        setBookmarked(new Set(mapped.map((r) => r.id)));
        
        if (newlyAdded) {
          setSelectedId(newlyAdded.id);
        }
        toast.success(`Đã lưu "${name}" vào công thức của tôi`);
        return;
      }

      if (bookmarked.has(id)) {
        await recipesApi.delete(id);
        toast.success(`Đã bỏ lưu "${name}"`);
      } else {
        await recipesApi.save(id);
        toast.success(`Đã lưu "${name}"`);
      }
      await reloadRecipes();
    } catch (err) {
      toast.error('Không thể cập nhật công thức: ' + (err as Error).message);
    }
  };

  const handleSelectRecipe = async (id: number) => {
    setSelectedId(id);
    setCookingId(null);

    if (id < 0) return;

    try {
      const detail = await recipesApi.getById(id);
      const currentCategory = recipes.find((recipe) => recipe.id === id)?.category ?? 'community';
      setRecipes((prev) => prev.map((recipe) =>
        recipe.id === id ? applyInventoryToRecipe(mapApiRecipe(detail, currentCategory), inventoryItems) : recipe,
      ));
    } catch (err) {
      toast.error('Không thể tải chi tiết công thức: ' + (err as Error).message);
    }
  };

  const handleAddToShopping = async () => {
    if (!selected) return;
    try {
      await Promise.all(missing.map((ing) => {
        const parsed = parseQty(ing.amount || '');
        return shoppingApi.add({
          item_name: ing.name,
          quantity: parsed?.value ?? 1,
          unit: parsed?.unit ?? ing.amount,
          category: 'Thực phẩm khô',
          emoji: '🛒',
        });
      }));
      toast.success(`Đã thêm ${missing.length} nguyên liệu vào danh sách đi chợ`);
    } catch (err) {
      toast.error('Không thể thêm vào danh sách đi chợ: ' + (err as Error).message);
    }
  };

  const startCooking = () => {
    if (!selected) return;
    setCookingId(selected.id);
    setActiveStep(0);
    toast.info('Bắt đầu nấu — chúc ngon miệng!');
  };

  const finishCooking = async () => {
    if (!selected) return;

    try {
      const updatedInventory = selected.ingredients.reduce(
        (items, ingredient) => deductIngredientFromInventory(ingredient, items),
        inventoryItems,
      );

      await ingredientsApi.update(updatedInventory);
      setCachedInventoryItems(updatedInventory);
      setInventoryItems(updatedInventory);
      setRecipes((prev) => prev.map((recipe) => applyInventoryToRecipe(recipe, updatedInventory)));
      setCookingId(null);
      toast.success('Hoàn thành! Kho nguyên liệu đã được cập nhật.');
    } catch (err) {
      toast.error('Không thể cập nhật kho sau khi nấu: ' + (err as Error).message);
    }
  };

  const handleCreateRecipe = async (data: NewRecipeData) => {
    const ingredients: Ingredient[] = data.ingredients
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, amount = ''] = line.split('|').map((s) => s.trim());
        return { name, amount, available: true };
      });
    const steps = data.steps.split('\n').map((s) => s.trim()).filter(Boolean);

    try {
      const savedRecipes = await recipesApi.add({
        title: data.name,
        instructions: steps.length ? steps.join('\n') : 'Chưa có hướng dẫn',
        image_url: data.image || '',
        ingredients: (ingredients.length ? ingredients : [{ name: 'Chưa thêm nguyên liá»‡u', amount: '', available: true }])
          .map((ing) => ({ name: ing.name, quantity: ing.amount, unit: '' })),
        servings: data.servings,
        time: data.time,
        difficulty: data.difficulty,
        calories: data.calories,
        tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
        created_by_name: '',
      });

      const mapped = savedRecipes.map((recipe) => applyInventoryToRecipe(mapApiRecipe(recipe, 'personal'), inventoryItems));
      setCachedSavedRecipes(savedRecipes);
      setRecipes((prev) => [
        ...mapped,
        ...prev.filter((r) => r.category === 'community'),
      ]);
      setCategory('personal');
      setSelectedId(mapped[0]?.id ?? selectedId);
      setBookmarked(new Set(mapped.map((r) => r.id)));
      setAddOpen(false);
      toast.success(`Đã tạo công thức "${data.name}"`);
    } catch (err) {
      toast.error('Không thể tạo công thức: ' + (err as Error).message);
    }
  };

  const handleAISuggest = async ({ requirements, selectedIngredients }: AISuggestionPayload) => {
    setAiOpen(false);

    try {
      const sourceInventory = selectedIngredients.length
        ? selectedIngredients
        : inventoryItems.length
          ? inventoryItems
          : (await ingredientsApi.getAll()).ingredients || [];

      if (!sourceInventory.length) {
        toast.error('Kho nguyên liệu đang trống, hãy thêm nguyên liệu trước.');
        return;
      }

      const result = await recipesApi.suggest(
        sourceInventory.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        })),
        {
          ...parsePromptFilters(requirements),
          limit: 10,
        },
      );
      const suggestedRecipes = result.dishes.map(mapSuggestionRecipe);

      if (!suggestedRecipes.length) {
        toast.info('Chưa tìm thấy món phù hợp với kho nguyên liệu hiện tại.');
        return;
      }

      setRecipes((prev) => [
        ...prev.filter((recipe) => recipe.category === 'personal'),
        ...suggestedRecipes,
      ]);
      setCategory('community');
      setSelectedId(suggestedRecipes[0].id);
      const sourceLabel = result.source === 'food-recommendation-api'
        ? 'KHDL Food Recommendation API'
        : 'EcoPantry DB';
      toast.success('Đã gợi ý ' + suggestedRecipes.length + ' công thức từ ' + sourceLabel);
    } catch (err) {
      toast.error('Không thể lấy gợi ý món ăn: ' + (err as Error).message);
    }
  };

  const openAISuggestionForm = async () => {
    try {
      const latestInventory = (await ingredientsApi.getAll()).ingredients || [];
      setInventoryItems(latestInventory);
      setCachedInventoryItems(latestInventory);
      setRecipes((prev) => prev.map((recipe) => applyInventoryToRecipe(recipe, latestInventory)));
    } catch (err) {
      toast.error('Không thể tải kho thực phẩm mới nhất: ' + (err as Error).message);
      return;
    }

    setAiOpen(true);
  };

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* â”€â”€ LEFT: Master list (30%) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
            onClick={openAISuggestionForm}
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
              const isSelected = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRecipe(r.id)}
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

      {/* â”€â”€ RIGHT: Detail (70%) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
          {!selected ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center max-w-md shadow-sm">
                <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-900" style={{ fontSize: '1rem', fontWeight: 700 }}>Chọn một công thức</p>
                <p className="text-slate-500 mt-1" style={{ fontSize: '0.82rem' }}>
                  Chọn món trong danh sách bên trái hoặc bấm AI gợi ý công thức để lấy món từ kho nguyên liệu.
                </p>
              </div>
            </div>
          ) : (
            <>

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
                  bá»Ÿi {selected.author}
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
                      {isDone ? 'âœ“' : i + 1}
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
                      onClick={finishCooking}
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
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {addOpen && <AddRecipeForm onClose={() => setAddOpen(false)} onSubmit={handleCreateRecipe} />}
      {aiOpen && (
        <AISuggestionForm
          inventoryItems={inventoryItems}
          onClose={() => setAiOpen(false)}
          onSubmit={handleAISuggest}
        />
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Sub-component: AddRecipeForm
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Sub-component: AISuggestionForm
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AISuggestionForm({
  inventoryItems,
  onClose,
  onSubmit,
}: {
  inventoryItems: IngredientItem[];
  onClose: () => void;
  onSubmit: (payload: AISuggestionPayload) => void;
}) {
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(inventoryItems.map((item) => item.id)));

  const allSelected = inventoryItems.length > 0 && selectedIds.size === inventoryItems.length;

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(inventoryItems.map((item) => item.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleSubmit = () => {
    const selectedIngredients = inventoryItems.filter((item) => selectedIds.has(item.id));
    if (!selectedIngredients.length) { toast.error('Hãy chọn ít nhất một thực phẩm'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit({
        requirements: requirements.trim(),
        selectedIngredients,
      });
    }, 250);
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
                Chọn thực phẩm từ kho rồi bấm gợi ý để lấy món phù hợp
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-700" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                Thực phẩm đang có trong kho
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={allSelected ? clearSelection : selectAll}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 rounded-lg transition-colors"
                  style={{ fontSize: '0.72rem', fontWeight: 600 }}
                >
                  {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <span className="text-slate-400" style={{ fontSize: '0.7rem' }}>
                  {selectedIds.size}/{inventoryItems.length} đã chọn
                </span>
              </div>
            </div>

            {inventoryItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500" style={{ fontSize: '0.8rem' }}>
                Kho thực phẩm đang trống.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {inventoryItems.map((item) => {
                  const checked = selectedIds.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                        checked ? 'bg-emerald-50/70' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIngredient(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-slate-900" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {item.name}
                        </p>
                        <p className="text-slate-500" style={{ fontSize: '0.72rem' }}>
                          {item.quantity} {item.unit} · {item.category}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>


          <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-500" style={{ fontSize: '0.72rem' }}>
            AI sẽ chỉ dùng những thực phẩm bạn đã chọn để gửi sang hệ gợi ý.
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
          <p className="text-slate-500" style={{ fontSize: '0.72rem' }}>
            {selectedIds.size > 0 ? `Sẵn sàng gợi ý từ ${selectedIds.size} thực phẩm` : 'Chưa chọn thực phẩm nào'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg shadow-sm"
              style={{ fontSize: '0.8rem', fontWeight: 600 }}
            >
              {loading ? <>Đang gợi ý...</> : <><Sparkles className="w-3.5 h-3.5" /> Gợi ý ngay</>}
            </button>
          </div>
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
