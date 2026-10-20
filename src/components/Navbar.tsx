import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Bookmark,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  FolderHeart,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenCreateModal: () => void;
  onOpenProfileModal: () => void;
  favoritesCount: number;
  siteName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenCreateModal,
  onOpenProfileModal,
  favoritesCount,
  siteName,
}) => {
  const { currentUser, userProfile, isAdmin, isModerator, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                  {siteName || 'คลังปัญญา'}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Open Ed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษาไทย
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                currentView === 'home'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => handleNavClick('browse')}
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                currentView === 'browse'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              สำรวจคลังความรู้
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => handleNavClick('favorites')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors ${
                    currentView === 'favorites'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>รายการโปรด</span>
                  {favoritesCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      {favoritesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleNavClick('my-resources')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors ${
                    currentView === 'my-resources'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>สื่อที่ฉันแชร์</span>
                </button>
              </>
            )}

            {isModerator && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors ${
                  currentView === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                    : 'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/50'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>จัดการระบบ</span>
              </button>
            )}
          </nav>

          {/* Action Buttons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Share Resource Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('login');
                } else {
                  onOpenCreateModal();
                }
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">แบ่งปันความรู้</span>
              <span className="xs:hidden">เพิ่ม</span>
            </button>

            {/* Auth section */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt={userProfile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userProfile?.displayName?.slice(0, 2) || 'ผู้ใช้'
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight max-w-[100px] truncate">
                      {userProfile?.displayName || 'ผู้ใช้งาน'}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium">
                      {isAdmin ? 'แอดมิน' : isModerator ? 'ผู้ดูแล' : 'สมาชิก'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onClick={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {userProfile?.displayName || 'ผู้ใช้งาน'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isAdmin
                              ? 'bg-rose-100 text-rose-700'
                              : isModerator
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isAdmin ? '👑 ผู้ดูแลระบบสูงสุด' : isModerator ? '🛡️ ผู้ช่วยดูแล' : '🎓 สมาชิกทั่วไป'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={onOpenProfileModal}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        โปรไฟล์ของฉัน
                      </button>
                      <button
                        onClick={() => handleNavClick('favorites')}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        รายการโปรด ({favoritesCount})
                      </button>
                      <button
                        onClick={() => handleNavClick('my-resources')}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        สื่อที่ฉันแบ่งปัน
                      </button>

                      {isModerator && (
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-indigo-500" />
                          แผงควบคุมระบบ (Admin)
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentView === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              หน้าแรก
            </button>
            <button
              onClick={() => handleNavClick('browse')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentView === 'browse' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              สำรวจคลังความรู้
            </button>
            {currentUser && (
              <>
                <button
                  onClick={() => handleNavClick('favorites')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                    currentView === 'favorites' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <span>รายการโปรด</span>
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                    {favoritesCount}
                  </span>
                </button>
                <button
                  onClick={() => handleNavClick('my-resources')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                    currentView === 'my-resources' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                  }`}
                >
                  สื่อที่ฉันแชร์
                </button>
              </>
            )}
            {isModerator && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  currentView === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>จัดการระบบ (Admin Dashboard)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
