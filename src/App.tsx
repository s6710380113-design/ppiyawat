import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Bookmark,
  Share2,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen,
  ChevronRight,
  ArrowUpDown,
  Home,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { ResourceFormModal } from './components/ResourceFormModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ConfirmModal } from './components/ConfirmModal';
import { EmptyState } from './components/EmptyState';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  Resource,
  SiteSettings,
  ResourceFilterState,
  FavoriteItem,
  MediaType,
} from './types';
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
  incrementResourceViews,
  toggleResourceLike,
  subscribeToResources,
} from './services/resourceService';
import {
  addFavorite,
  removeFavorite,
  subscribeToFavorites,
} from './services/favoriteService';
import { getSiteSettings, DEFAULT_SETTINGS, seedInitialDatabase } from './services/settingsService';
import { testConnection } from './firebase';

function MainApp() {
  const { currentUser, userProfile, isAdmin, isModerator } = useAuth();

  // Navigation state: 'home' | 'browse' | 'favorites' | 'my-resources' | 'admin'
  const [currentView, setCurrentView] = useState<string>('home');

  // Site Settings & Data
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [resources, setResources] = useState<Resource[]>([]);
  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterState, setFilterState] = useState<ResourceFilterState>({
    searchQuery: '',
    category: 'ทั้งหมด',
    educationLevel: 'ทุกระดับชั้น',
    mediaType: 'ทั้งหมด',
    sortBy: 'latest',
  });

  // Modals State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Confirm delete dialog
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  // Liked resources set in local session
  const [likedResources, setLikedResources] = useState<Set<string>>(new Set());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Load & Realtime Subscriptions
  useEffect(() => {
    testConnection();

    // Fetch site settings
    getSiteSettings().then((s) => setSiteSettings(s));

    // Subscribe to resources collection
    const unsubResources = subscribeToResources(
      async (items) => {
        // If empty, auto-seed with high quality curriculum samples
        if (items.length === 0) {
          try {
            await seedInitialDatabase('system_seed', 'คลังปัญญา');
          } catch (e) {
            console.error('Auto-seed error:', e);
          }
        } else {
          setResources(items);
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubResources();
  }, []);

  // Subscribe to Favorites when user is logged in
  useEffect(() => {
    if (!currentUser) {
      setUserFavorites([]);
      return;
    }

    const unsubFav = subscribeToFavorites(currentUser.uid, (favs) => {
      setUserFavorites(favs);
    });

    return () => unsubFav();
  }, [currentUser]);

  // Handle Resource Click (Open detail + increment view)
  const handleOpenResourceDetail = (res: Resource) => {
    setSelectedResource(res);
    setDetailModalOpen(true);
    incrementResourceViews(res.id);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (resource: Resource) => {
    if (!currentUser) {
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      showToast('กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด', 'info');
      return;
    }

    const isFav = userFavorites.some((f) => f.resourceId === resource.id);
    try {
      if (isFav) {
        await removeFavorite(currentUser.uid, resource.id);
        showToast(`นำ "${resource.title}" ออกจากรายการโปรดแล้ว`, 'info');
      } else {
        await addFavorite(currentUser.uid, resource);
        showToast(`บันทึก "${resource.title}" เป็นรายการโปรดเรียบร้อยแล้ว`, 'success');
      }
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการบันทึกรายการโปรด', 'error');
    }
  };

  // Toggle Like
  const handleToggleLike = async (resource: Resource) => {
    const isLiked = likedResources.has(resource.id);
    const newLiked = new Set(likedResources);

    try {
      if (isLiked) {
        newLiked.delete(resource.id);
        await toggleResourceLike(resource.id, -1);
      } else {
        newLiked.add(resource.id);
        await toggleResourceLike(resource.id, 1);
      }
      setLikedResources(newLiked);

      // Optimistically update selected resource if detail modal is open
      if (selectedResource && selectedResource.id === resource.id) {
        setSelectedResource({
          ...selectedResource,
          likesCount: Math.max(0, (selectedResource.likesCount || 0) + (isLiked ? -1 : 1)),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy link
  const handleCopyLink = (resource: Resource) => {
    navigator.clipboard.writeText(resource.url || window.location.href);
    showToast('คัดลอกลิงก์สื่อการเรียนรู้ไปยังคลิปบอร์ดแล้ว', 'success');
  };

  // Save or Edit Resource
  const handleSaveResource = async (payload: Omit<Resource, 'id'>, editId?: string) => {
    if (editId) {
      await updateResource(editId, payload);
      showToast('อัปเดตสื่อการเรียนรู้เรียบร้อยแล้ว', 'success');
      if (selectedResource && selectedResource.id === editId) {
        setSelectedResource({ ...payload, id: editId });
      }
    } else {
      await createResource(payload);
      showToast('แบ่งปันสื่อการเรียนรู้สำเร็จ สื่อถูกเผยแพร่สู่ระบบแล้ว!', 'success');
    }
  };

  // Confirm delete handler
  const confirmDeleteAction = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete.id);
      showToast('ลบสื่อการเรียนรู้เรียบร้อยแล้ว', 'success');
      setConfirmDeleteOpen(false);
      setResourceToDelete(null);
      if (detailModalOpen && selectedResource?.id === resourceToDelete.id) {
        setDetailModalOpen(false);
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบสื่อ', 'error');
    }
  };

  // Filtered resources for current view
  const getDisplayedResources = () => {
    let list = [...resources];

    // Status filtering: normal users only see 'published'
    if (!isModerator) {
      list = list.filter((r) => r.status === 'published');
    }

    // View specific filtering
    if (currentView === 'favorites') {
      const favIds = new Set(userFavorites.map((f) => f.resourceId));
      list = list.filter((r) => favIds.has(r.id));
    } else if (currentView === 'my-resources') {
      if (currentUser) {
        list = list.filter((r) => r.authorId === currentUser.uid);
      }
    }

    // Keyword search
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q)) ||
          r.authorName.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterState.category && filterState.category !== 'ทั้งหมด') {
      list = list.filter((r) => r.category === filterState.category);
    }

    // Education Level filter
    if (filterState.educationLevel && filterState.educationLevel !== 'ทุกระดับชั้น') {
      list = list.filter((r) => r.educationLevel === filterState.educationLevel);
    }

    // Media type filter
    if (filterState.mediaType && filterState.mediaType !== 'ทั้งหมด') {
      list = list.filter((r) => r.mediaType === filterState.mediaType);
    }

    // Sorting
    if (filterState.sortBy === 'popular') {
      list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (filterState.sortBy === 'mostLiked') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  };

  const displayedResources = getDisplayedResources();

  // Refresh data function
  const refreshAllData = async () => {
    const [freshSettings, freshRes] = await Promise.all([
      getSiteSettings(),
      getResources(),
    ]);
    setSiteSettings(freshSettings);
    if (freshRes) setResources(freshRes);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. Global Announcement Banner */}
      <AnnouncementBanner
        text={siteSettings.announcement}
        active={siteSettings.announcementActive}
      />

      {/* 2. Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuth={(mode) => {
          setAuthInitialMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onOpenCreateModal={() => {
          setEditResource(null);
          setCreateModalOpen(true);
        }}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        favoritesCount={userFavorites.length}
        siteName={siteSettings.siteName}
      />

      {/* 3. Main Views */}
      <main className="flex-1">
        {/* VIEW 1: HOME & BROWSE */}
        {(currentView === 'home' || currentView === 'browse') && (
          <div>
            {/* Show Hero only in 'home' view */}
            {currentView === 'home' && (
              <HeroSection
                searchQuery={filterState.searchQuery}
                setSearchQuery={(q) => setFilterState((prev) => ({ ...prev, searchQuery: q }))}
                selectedCategory={filterState.category}
                onSelectCategory={(cat) => setFilterState((prev) => ({ ...prev, category: cat }))}
                categories={siteSettings.categories}
                totalResources={resources.length}
                onExploreClick={() => {
                  const exploreSection = document.getElementById('browse-section');
                  exploreSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            {/* Catalog & Filter Section */}
            <div id="browse-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
              {/* Breadcrumb & Section Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span
                      onClick={() => setCurrentView('home')}
                      className="hover:text-blue-600 cursor-pointer flex items-center gap-1"
                    >
                      <Home className="w-3.5 h-3.5" />
                      หน้าแรก
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-slate-600 font-medium">
                      {filterState.category !== 'ทั้งหมด' ? filterState.category : 'คลังความรู้ทั้งหมด'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    {filterState.category !== 'ทั้งหมด' ? filterState.category : 'สื่อการเรียนรู้แนะนำ'}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>พบสื่อการสอนทั้งหมด</span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {displayedResources.length} รายการ
                  </span>
                </div>
              </div>

              {/* Comprehensive Filter Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                {/* Search input in filter bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterState.searchQuery}
                    onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
                    placeholder="ค้นหาชื่อสื่อ, คำอธิบาย, หรือแฮชแท็ก..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm bg-slate-50/50"
                  />
                </div>

                {/* Dropdowns row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">หมวดหมู่วิชา</label>
                    <select
                      value={filterState.category}
                      onChange={(e) => setFilterState((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ทั้งหมด">ทั้งหมดทุกหมวดหมู่</option>
                      {siteSettings.categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Education Level */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ระดับการศึกษา</label>
                    <select
                      value={filterState.educationLevel}
                      onChange={(e) => setFilterState((prev) => ({ ...prev, educationLevel: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ทุกระดับชั้น">ทุกระดับชั้น</option>
                      {siteSettings.educationLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Media Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ประเภทสื่อ</label>
                    <select
                      value={filterState.mediaType}
                      onChange={(e) => setFilterState((prev) => ({ ...prev, mediaType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ทั้งหมด">ทุกประเภทสื่อ</option>
                      <option value="video">🎥 วิดีโอ / คลิปสอน</option>
                      <option value="pdf">📄 PDF / เอกสาร</option>
                      <option value="website">🌐 เว็บไซต์ / บทความ</option>
                      <option value="slides">📊 สไลด์ประกอบสอน</option>
                      <option value="document">📝 บทความ / โน้ตย่อ</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">เรียงลำดับตาม</label>
                    <select
                      value={filterState.sortBy}
                      onChange={(e) =>
                        setFilterState((prev) => ({
                          ...prev,
                          sortBy: e.target.value as 'latest' | 'popular' | 'mostLiked',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="latest">🌟 เพิ่มเข้ามาล่าสุด</option>
                      <option value="popular">🔥 ยอดเข้าชมสูงสุด</option>
                      <option value="mostLiked">❤️ ถูกใจมากที่สุด</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resource Grid / Loading / Empty */}
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">กำลังเชื่อมต่อฐานข้อมูล Cloud Firestore...</p>
                </div>
              ) : displayedResources.length === 0 ? (
                <EmptyState
                  type="search"
                  onAction={() =>
                    setFilterState({
                      searchQuery: '',
                      category: 'ทั้งหมด',
                      educationLevel: 'ทุกระดับชั้น',
                      mediaType: 'ทั้งหมด',
                      sortBy: 'latest',
                    })
                  }
                  actionText="ล้างตัวกรองทั้งหมด"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedResources.map((res) => {
                    const isFav = userFavorites.some((f) => f.resourceId === res.id);
                    const canManage = Boolean(
                      isModerator || (currentUser && res.authorId === currentUser.uid)
                    );

                    return (
                      <ResourceCard
                        key={res.id}
                        resource={res}
                        isFavorite={isFav}
                        onToggleFavorite={handleToggleFavorite}
                        onClick={handleOpenResourceDetail}
                        canManage={canManage}
                        onEdit={(r) => {
                          setEditResource(r);
                          setCreateModalOpen(true);
                        }}
                        onDelete={(r) => {
                          setResourceToDelete(r);
                          setConfirmDeleteOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: FAVORITES */}
        {currentView === 'favorites' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Bookmark className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">คลังรายการโปรดของคุณ</h2>
                <p className="text-xs text-slate-500">
                  สื่อและบทเรียนที่คุณกดบันทึกไว้ ซิงค์ตรงกับบัญชีผู้ใช้ ({currentUser?.email})
                </p>
              </div>
            </div>

            {displayedResources.length === 0 ? (
              <EmptyState
                type="favorites"
                actionText="สำรวจคลังความรู้"
                onAction={() => setCurrentView('browse')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={handleOpenResourceDetail}
                    canManage={Boolean(isModerator || (currentUser && res.authorId === currentUser.uid))}
                    onEdit={(r) => {
                      setEditResource(r);
                      setCreateModalOpen(true);
                    }}
                    onDelete={(r) => {
                      setResourceToDelete(r);
                      setConfirmDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MY RESOURCES */}
        {currentView === 'my-resources' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">สื่อการเรียนรู้ที่ฉันแบ่งปัน</h2>
                  <p className="text-xs text-slate-500">
                    จัดการ แก้ไข หรือลบสื่อที่คุณได้โพสต์ลงในระบบ
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditResource(null);
                  setCreateModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>แบ่งปันสื่อใหม่</span>
              </button>
            </div>

            {displayedResources.length === 0 ? (
              <EmptyState
                type="my-resources"
                actionText="เริ่มแบ่งปันสื่อแรกของคุณ"
                onAction={() => {
                  setEditResource(null);
                  setCreateModalOpen(true);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedResources.map((res) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    isFavorite={userFavorites.some((f) => f.resourceId === res.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={handleOpenResourceDetail}
                    canManage={true}
                    onEdit={(r) => {
                      setEditResource(r);
                      setCreateModalOpen(true);
                    }}
                    onDelete={(r) => {
                      setResourceToDelete(r);
                      setConfirmDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {currentView === 'admin' && isModerator && (
          <AdminDashboard
            resources={resources}
            settings={siteSettings}
            onRefreshData={refreshAllData}
            onShowToast={showToast}
            onViewResource={handleOpenResourceDetail}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-white">{siteSettings.siteName}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                {siteSettings.siteDescription} เชื่อมต่อ Cloud Firestore และ Firebase Authentication รองรับทุกอุปกรณ์เพื่อการศึกษาไทยที่เท่าเทียม
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-3">
                หมวดหมู่วิชายอดนิยม
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {siteSettings.categories.slice(0, 4).map((c) => (
                  <li
                    key={c}
                    onClick={() => {
                      setFilterState((prev) => ({ ...prev, category: c }));
                      setCurrentView('browse');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white cursor-pointer transition-colors"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-3">
                ระดับการศึกษา
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {siteSettings.educationLevels.slice(0, 4).map((lvl) => (
                  <li
                    key={lvl}
                    onClick={() => {
                      setFilterState((prev) => ({ ...prev, educationLevel: lvl }));
                      setCurrentView('browse');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white cursor-pointer transition-colors"
                  >
                    {lvl}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} {siteSettings.siteName}. เพื่อการศึกษาและการเรียนรู้แบบเปิด</p>
            <div className="flex items-center gap-4">
              <span>Cloud Firestore Connected</span>
              <span>•</span>
              <span>Firebase Auth Ready</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Overlays */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      <ResourceFormModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditResource(null);
        }}
        onSubmit={handleSaveResource}
        editResource={editResource}
        categories={siteSettings.categories}
        educationLevels={siteSettings.educationLevels}
      />

      <ResourceDetailModal
        resource={selectedResource}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedResource(null);
        }}
        isFavorite={selectedResource ? userFavorites.some((f) => f.resourceId === selectedResource.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onLike={handleToggleLike}
        hasLiked={selectedResource ? likedResources.has(selectedResource.id) : false}
        onReport={(r) => {
          setReportModalOpen(true);
        }}
        onCopyLink={handleCopyLink}
        canManage={Boolean(
          isModerator ||
            (currentUser && selectedResource && selectedResource.authorId === currentUser.uid)
        )}
        onEdit={(r) => {
          setDetailModalOpen(false);
          setEditResource(r);
          setCreateModalOpen(true);
        }}
        onDelete={(r) => {
          setResourceToDelete(r);
          setConfirmDeleteOpen(true);
        }}
      />

      <ReportModal
        resource={selectedResource}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="ยืนยันการลบสื่อการเรียนรู้?"
        message={`คุณต้องการลบ "${resourceToDelete?.title}" ออกจากฐานข้อมูลหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmDeleteAction}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setResourceToDelete(null);
        }}
      />

      {/* 6. Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
