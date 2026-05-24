import { useState, useEffect } from 'react';
import { X, User, Shield, CheckCircle2, Loader2, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { preferencesApi } from '@/lib/api';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'preferences';

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [dietary, setDietary] = useState('');

  // Fetch preferences when opened
  useEffect(() => {
    if (open) {
      setName(user?.name || '');
      const fetchPrefs = async () => {
        setIsLoading(true);
        try {
          const data = await preferencesApi.get();
          setDietary(data.preferences || '');
        } catch (err) {
          console.error('Failed to load preferences:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPrefs();
    }
  }, [open, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'profile') {
        if (!name.trim()) {
          toast.error('Tên không được để trống');
          setIsSaving(false);
          return;
        }
        await preferencesApi.setName(name);
        if (updateUser) updateUser(name);
        toast.success('Đã cập nhật hồ sơ');
      } else {
        await preferencesApi.set(dietary);
        toast.success('Đã lưu sở thích ăn uống');
      }
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'profile' ? 'Hồ sơ cá nhân' : 'Cài đặt'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-50/50 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            <User className="w-4 h-4" /> Hồ sơ
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:bg-slate-100/50'
            }`}
          >
            <Utensils className="w-4 h-4" /> Sở thích ăn uống
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Nhập tên của bạn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  {user?.email}
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Email đã được xác thực
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ghi chú sở thích / Dị ứng
                </label>
                <textarea
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                  placeholder="Ví dụ: Ăn chay, Không ăn cay, Dị ứng đậu phộng..."
                />
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  EcoPantry sẽ dựa vào thông tin này để gợi ý công thức và nhắc nhở mua sắm phù hợp với gia đình bạn.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
