import { useEffect, useRef, useState } from 'react';
import type { ElementType, FormEvent } from 'react';
import { Home, Refrigerator, ChefHat, ShoppingCart, Search, Bell, Leaf, ChevronLeft, ChevronRight, Calendar, LogOut } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useAuthStore } from '@/stores/authStore';
import type { TabType } from '@/lib/tabs';
import { HomePage } from '@/pages/HomePage';
import { InventoryPage } from '@/pages/InventoryPage';
import { MealPlannerPage } from '@/pages/MealPlannerPage';
import { LoginPage } from './LoginPage';
import { SettingsModal } from '@/components/SettingsModal';
import { RecipesPage } from '@/pages/RecipesPage';
import { ShoppingPage } from './ShoppingPage';
import type { FamilyGroup } from '@/lib/api';
import { useRecipeDataStore } from '@/stores/recipeDataStore';
import { useAppDataStore } from '@/stores/appDataStore';

const navItems: { id: TabType; label: string; icon: ElementType; badge?: number }[] = [
  { id: 'home',      label: 'Trang chủ',     icon: Home },
  { id: 'inventory', label: 'Kho thực phẩm', icon: Refrigerator },
  { id: 'recipes',   label: 'Công thức',     icon: ChefHat },
  { id: 'planner',   label: 'Kế hoạch',      icon: Calendar },
  { id: 'shopping',  label: 'Đi chợ',        icon: ShoppingCart },
];

const pageTitles: Record<TabType, { title: string; subtitle: string }> = {
  home:      { title: 'Tổng quan',          subtitle: '' },
  inventory: { title: 'Kho thực phẩm',      subtitle: 'Quản lý nguyên liệu theo khu vực lưu trữ' },
  recipes:   { title: 'Công thức nấu ăn',   subtitle: 'Gợi ý món ăn từ nguyên liệu sẵn có' },
  planner:   { title: 'Kế hoạch nấu ăn',    subtitle: 'Lên thực đơn theo ngày và theo tuần' },
  shopping:  { title: 'Danh sách đi chợ',   subtitle: 'Mua sắm thông minh cùng gia đình' },
};

const notifications = [
  { id: 1, title: 'Cà chua bi sắp hết hạn', desc: 'Còn 1 ngày — hãy dùng ngay hôm nay', time: '2 phút trước', unread: true },
  { id: 2, title: 'Mẹ đã thêm Rau cải vào giỏ', desc: 'Danh sách đi chợ đã được cập nhật', time: '2 giờ trước', unread: true },
  { id: 3, title: 'Cá hồi phi lê đã hết hạn', desc: 'Vui lòng kiểm tra và xoá khỏi kho', time: 'Hôm qua', unread: false },
];

function getInitials(value: string | undefined) {
  return (value || 'EcoPantry')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'EP';
}

type NotificationItem = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
};

export default function App() {
  const { user, logout } = useAuthStore();
  const [activeTab,  setActiveTab]  = useState<TabType>('home');
  const [collapsed,  setCollapsed]  = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [navBadges, setNavBadges] = useState<Partial<Record<TabType, number>>>({});
  const cachedInventoryItems = useRecipeDataStore((state) => state.inventoryItems);
  const cachedShoppingItems = useAppDataStore((state) => state.shoppingItems);
  const cachedFamilyGroup = useAppDataStore((state) => state.familyGroup);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);
  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);

  const currentMember = familyGroup?.members?.find((member) => member.email === user?.email);
  const groupName = familyGroup?.group_name || user?.name || 'EcoPantry';
  const memberCount = familyGroup?.members?.length || (user ? 1 : 0);
  const currentRole = currentMember?.GroupMember?.role || 'Admin';
  const groupInitials = getInitials(groupName);
  const groupMeta = `${memberCount} thành viên • ${currentRole}`;
  const currentPage = activeTab === 'home'
    ? { ...pageTitles.home, subtitle: `Chào buổi sáng, ${groupName}!` }
    : pageTitles[activeTab];
  const sidebarItems = navItems.map((item) => ({
    ...item,
    badge: navBadges[item.id],
  }));

  useEffect(() => {
    if (!user) return;

    const dynamic = cachedInventoryItems
      .filter((item) => item.daysLeft <= 3)
      .slice(0, 6)
      .map((item, index) => ({
        id: index + 1,
        title: item.daysLeft < 0
          ? `${item.name} đã hết hạn`
          : item.daysLeft === 0
            ? `${item.name} hết hạn hôm nay`
            : `${item.name} sắp hết hạn`,
        desc: item.daysLeft < 0
          ? `Quá hạn ${Math.abs(item.daysLeft)} ngày, nên kiểm tra và xử lý`
          : `Còn ${item.daysLeft} ngày, ưu tiên dùng trong bữa gần nhất`,
        time: 'Từ kho thực phẩm',
        unread: true,
      }));

    setNotificationItems(dynamic);
    setUnreadCount(dynamic.filter((n) => n.unread).length);
  }, [user, cachedInventoryItems]);

  useEffect(() => {
    if (!user) return;
    setFamilyGroup(cachedFamilyGroup);
  }, [user, cachedFamilyGroup, settingsOpen]);

  useEffect(() => {
    if (!user) return;

    setNavBadges({
      inventory: cachedInventoryItems.length,
      shopping: cachedShoppingItems.filter((item) => !item.is_purchased).length,
    });
  }, [user, cachedInventoryItems, cachedShoppingItems]);

  if (!user) return <LoginPage />;

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info(`Đang tìm kiếm: "${searchQuery}"`);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Toaster position="bottom-right" richColors />

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className="relative flex flex-col bg-white border-r border-slate-200 shrink-0 overflow-visible"
        style={{
          width: collapsed ? '64px' : '256px',
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-6 z-50 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 transition-all"
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3 text-slate-500" />
            : <ChevronLeft  className="w-3 h-3 text-slate-500" />
          }
        </button>

        <div
          className="border-b border-slate-100 flex items-center shrink-0 overflow-hidden"
          style={{ padding: collapsed ? '18px 14px' : '18px 24px', transition: 'padding 0.28s ease' }}
        >
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div
            className="overflow-hidden"
            style={{
              width:   collapsed ? 0   : '160px',
              opacity: collapsed ? 0   : 1,
              marginLeft: collapsed ? 0 : '12px',
              transition: 'width 0.25s ease, opacity 0.2s ease, margin-left 0.25s ease',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <p className="text-slate-900 leading-tight" style={{ fontWeight: 600, fontSize: '1rem' }}>EcoPantry</p>
            <p className="text-slate-400" style={{ fontSize: '0.7rem' }}>Quản lý thực phẩm gia đình</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '12px 8px', transition: 'padding 0.28s ease' }}>
          <div
            className="overflow-hidden"
            style={{
              height:  collapsed ? 0    : '28px',
              opacity: collapsed ? 0    : 1,
              transition: 'height 0.25s ease, opacity 0.2s ease',
            }}
          >
            <p className="px-3 pb-2 text-slate-400 uppercase tracking-wider" style={{ fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Menu chính
            </p>
          </div>

          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group/nav">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center rounded-lg transition-all mb-0.5 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={{
                    padding:        collapsed ? '8px 10px' : '8px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap:            collapsed ? 0 : '12px',
                    transition: 'padding 0.28s ease, gap 0.28s ease',
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-emerald-100' : 'bg-slate-100 group-hover/nav:bg-slate-200'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  </div>

                  <span
                    className="flex-1 flex items-center justify-between overflow-hidden"
                    style={{
                      width:     collapsed ? 0   : 'auto',
                      opacity:   collapsed ? 0   : 1,
                      maxWidth:  collapsed ? 0   : '200px',
                      transition: 'max-width 0.25s ease, opacity 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500 }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                        style={{ fontSize: '0.68rem', fontWeight: 600 }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                </button>

                {collapsed && (
                  <div
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                      opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150"
                  >
                    <div className="bg-slate-900 text-white rounded-lg shadow-lg px-3 py-1.5 flex items-center gap-2 whitespace-nowrap">
                      <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-white/20 rounded-full" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-2 h-2 bg-slate-900 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className="border-t border-slate-100 overflow-hidden"
          style={{
            padding: collapsed ? '10px 12px' : '12px 16px',
            transition: 'padding 0.28s ease',
          }}
        >
          {collapsed ? (
            <div className="relative group/user flex justify-center">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{groupInitials}</span>
              </div>
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                opacity-0 group-hover/user:opacity-100 transition-opacity duration-150">
                <div className="bg-slate-900 text-white rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
                  <p style={{ fontSize: '0.78rem', fontWeight: 600 }}>{groupName}</p>
                  <p className="text-slate-300 mt-0.5" style={{ fontSize: '0.68rem' }}>{groupMeta}</p>
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-3 hover:bg-slate-50 -m-1 p-1 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{groupInitials}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-slate-900 truncate" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{groupName}</p>
                <p className="text-slate-400 truncate" style={{ fontSize: '0.7rem' }}>{groupMeta}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-slate-900 leading-tight" style={{ fontSize: '1rem', fontWeight: 600 }}>
              {currentPage.title}
            </h2>
            <p className="text-slate-500" style={{ fontSize: '0.75rem' }}>{currentPage.subtitle}</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thực phẩm, công thức..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all"
              style={{ fontSize: '0.78rem' }}
            />
          </form>

          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); setUnreadCount(0); }}
                className="relative p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 bg-rose-500 text-white rounded-full border border-white flex items-center justify-center" style={{ fontSize: '0.55rem', fontWeight: 700 }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-slate-900" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Thông báo</p>
                    <button
                      onClick={() => { toast.success('Đã đánh dấu tất cả là đã đọc'); setNotifOpen(false); }}
                      className="text-emerald-600 hover:text-emerald-700"
                      style={{ fontSize: '0.7rem', fontWeight: 500 }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationItems.length === 0 && (
                      <div className="px-4 py-6 text-center text-slate-400" style={{ fontSize: '0.78rem' }}>
                        Chưa có thông báo
                      </div>
                    )}
                    {notificationItems.map(n => (
                      <button
                        key={n.id}
                        onClick={() => { toast.info(n.title); setNotifOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex gap-3"
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-emerald-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{n.title}</p>
                          <p className="text-slate-500 mt-0.5" style={{ fontSize: '0.72rem' }}>{n.desc}</p>
                          <p className="text-slate-400 mt-0.5" style={{ fontSize: '0.65rem' }}>{n.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              >
                <span className="text-white" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                  {user?.name?.slice(0, 2).toUpperCase() || 'EP'}
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-slate-900" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'Người dùng'}</p>
                    <p className="text-slate-500" style={{ fontSize: '0.7rem' }}>{user?.email}</p>
                  </div>
                  <div className="py-1">
                    {[
                      { label: 'Hồ sơ', action: () => setSettingsOpen(true) },
                      { label: 'Cài đặt', action: () => setSettingsOpen(true) },
                    ].map(it => (
                      <button
                        key={it.label}
                        onClick={() => { it.action(); setProfileOpen(false); }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                        style={{ fontSize: '0.8rem' }}
                      >
                        {it.label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => { logout(); setProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                      style={{ fontSize: '0.8rem' }}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {activeTab === 'home'      && <HomePage onNavigate={setActiveTab} />}
          {activeTab === 'inventory' && <InventoryPage />}
          {activeTab === 'recipes'   && <RecipesPage />}
          {activeTab === 'planner'   && <MealPlannerPage />}
          {activeTab === 'shopping'  && <ShoppingPage />}
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
