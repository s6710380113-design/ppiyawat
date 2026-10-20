import React, { useState, useEffect } from 'react';
import {
  Shield,
  Flag,
  FileText,
  Users,
  Settings,
  History,
  CheckCircle,
  XCircle,
  EyeOff,
  Eye,
  Trash2,
  Plus,
  Search,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  Resource,
  ReportItem,
  UserProfile,
  SiteSettings,
  ModerationLog,
  UserRole,
  UserStatus,
  ReportStatus,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { getAllReports, updateReportStatus, addModerationLog, getModerationLogs } from '../services/reportService';
import { getAllUsers, updateUserRole, updateUserStatus } from '../services/userService';
import { updateSiteSettings, seedInitialDatabase } from '../services/settingsService';
import { updateResource, deleteResource } from '../services/resourceService';
import { ConfirmModal } from './ConfirmModal';

interface AdminDashboardProps {
  resources: Resource[];
  settings: SiteSettings;
  onRefreshData: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewResource: (r: Resource) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  resources,
  settings,
  onRefreshData,
  onShowToast,
  onViewResource,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'reports' | 'resources' | 'users' | 'settings' | 'logs'>('reports');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [userSearch, setUserSearch] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');

  // Settings form state
  const [siteName, setSiteName] = useState(settings.siteName);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement || '');
  const [announcementActive, setAnnouncementActive] = useState(settings.announcementActive || false);
  const [categories, setCategories] = useState<string[]>(settings.categories);
  const [newCatInput, setNewCatInput] = useState('');

  // Confirm Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [reps, usrs, modLogs] = await Promise.all([
        getAllReports().catch(() => []),
        getAllUsers().catch(() => []),
        getModerationLogs().catch(() => []),
      ]);
      setReports(reps);
      setUsers(usrs);
      setLogs(modLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    setSiteName(settings.siteName);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement || '');
    setAnnouncementActive(settings.announcementActive || false);
    setCategories(settings.categories);
  }, [settings]);

  // Handle Report Status update
  const handleUpdateReport = async (reportId: string, status: ReportStatus, note: string) => {
    try {
      await updateReportStatus(reportId, status);
      await addModerationLog({
        action: `update_report_${status}`,
        targetType: 'report',
        targetId: reportId,
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        note,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, updatedAt: new Date().toISOString() } : r))
      );
      onShowToast(`ปรับสถานะรายงานเป็น "${status === 'resolved' ? 'แก้ไขแล้ว' : 'ยกเลิก'}" เรียบร้อยแล้ว`, 'success');
    } catch (err: any) {
      onShowToast('เกิดข้อผิดพลาดในการปรับสถานะรายงาน', 'error');
    }
  };

  // Toggle Resource Visibility
  const handleToggleResourceStatus = async (resource: Resource) => {
    const nextStatus = resource.status === 'published' ? 'hidden' : 'published';
    try {
      await updateResource(resource.id, { status: nextStatus });
      await addModerationLog({
        action: nextStatus === 'hidden' ? 'hide_resource' : 'publish_resource',
        targetType: 'resource',
        targetId: resource.id,
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        note: `เปลี่ยนสถานะสื่อ ${resource.title} เป็น ${nextStatus}`,
      });
      await onRefreshData();
      onShowToast(`เปลี่ยนสถานะสื่อเป็น "${nextStatus === 'published' ? 'เผยแพร่' : 'ซ่อน'}" เรียบร้อยแล้ว`, 'success');
    } catch (e) {
      onShowToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะสื่อ', 'error');
    }
  };

  // Delete Resource with confirmation
  const requestDeleteResource = (resource: Resource) => {
    setConfirmConfig({
      title: 'ยืนยันการลบสื่อการเรียนรู้?',
      message: `คุณกำลังจะลบสื่อ "${resource.title}" ออกจากฐานข้อมูลอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้`,
      onConfirm: async () => {
        try {
          await deleteResource(resource.id);
          await addModerationLog({
            action: 'delete_resource',
            targetType: 'resource',
            targetId: resource.id,
            moderatorId: currentUser?.uid || '',
            moderatorEmail: currentUser?.email || '',
            note: `ลบสื่อ ${resource.title}`,
          });
          await onRefreshData();
          onShowToast('ลบสื่อการเรียนรู้เรียบร้อยแล้ว', 'success');
          setConfirmModalOpen(false);
        } catch (e) {
          onShowToast('เกิดข้อผิดพลาดในการลบสื่อ', 'error');
        }
      },
    });
    setConfirmModalOpen(true);
  };

  // Change User Role
  const handleChangeRole = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!isAdmin) {
      onShowToast('เฉพาะผู้ดูแลระบบสูงสุด (Admin) เท่านั้นที่สามารถปรับเปลี่ยนบทบาทได้', 'error');
      return;
    }

    try {
      await updateUserRole(targetUser.uid, newRole);
      await addModerationLog({
        action: 'change_user_role',
        targetType: 'user',
        targetId: targetUser.uid,
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        note: `เปลี่ยนบทบาทของ ${targetUser.email} เป็น ${newRole}`,
      });
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: newRole } : u))
      );
      onShowToast(`ปรับบทบาทของ ${targetUser.displayName} เป็น "${newRole}" เรียบร้อยแล้ว`, 'success');
    } catch (e) {
      onShowToast('เกิดข้อผิดพลาดในการเปลี่ยนบทบาทผู้ใช้', 'error');
    }
  };

  // Toggle User Suspension
  const handleToggleUserSuspension = async (targetUser: UserProfile) => {
    const nextStatus: UserStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setConfirmConfig({
      title: nextStatus === 'suspended' ? 'ยืนยันการระงับบัญชีผู้ใช้?' : 'ยืนยันการปลดระงับบัญชี?',
      message:
        nextStatus === 'suspended'
          ? `ผู้ใช้ ${targetUser.displayName} (${targetUser.email}) จะไม่สามารถเข้าใช้งานหรือโพสต์สื่อได้จนกว่าจะได้รับการปลดระงับ`
          : `ผู้ใช้ ${targetUser.displayName} จะสามารถเข้าใช้งานระบบได้ตามปกติ`,
      onConfirm: async () => {
        try {
          await updateUserStatus(targetUser.uid, nextStatus);
          await addModerationLog({
            action: nextStatus === 'suspended' ? 'suspend_user' : 'unsuspend_user',
            targetType: 'user',
            targetId: targetUser.uid,
            moderatorId: currentUser?.uid || '',
            moderatorEmail: currentUser?.email || '',
            note: `ปรับสถานะผู้ใช้ ${targetUser.email} เป็น ${nextStatus}`,
          });
          setUsers((prev) =>
            prev.map((u) => (u.uid === targetUser.uid ? { ...u, status: nextStatus } : u))
          );
          onShowToast(`ปรับสถานะผู้ใช้เป็น "${nextStatus}" เรียบร้อยแล้ว`, 'success');
          setConfirmModalOpen(false);
        } catch (e) {
          onShowToast('เกิดข้อผิดพลาดในการปรับสถานะผู้ใช้', 'error');
        }
      },
    });
    setConfirmModalOpen(true);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onShowToast('เฉพาะผู้ดูแลระบบสูงสุด (Admin) เท่านั้นที่สามารถตั้งค่าเว็บไซต์ได้', 'error');
      return;
    }

    try {
      await updateSiteSettings(
        {
          siteName: siteName.trim(),
          siteDescription: siteDescription.trim(),
          announcement: announcement.trim(),
          announcementActive,
          categories,
        },
        currentUser?.uid || ''
      );
      await addModerationLog({
        action: 'update_settings',
        targetType: 'settings',
        targetId: 'global',
        moderatorId: currentUser?.uid || '',
        moderatorEmail: currentUser?.email || '',
        note: 'อัปเดตการตั้งค่าเว็บไซต์และหมวดหมู่',
      });
      await onRefreshData();
      onShowToast('บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว', 'success');
    } catch (e) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    }
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    if (categories.includes(newCatInput.trim())) {
      onShowToast('มีหมวดหมู่นี้อยู่ในระบบแล้ว', 'info');
      return;
    }
    setCategories([...categories, newCatInput.trim()]);
    setNewCatInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) {
      onShowToast('ต้องมีหมวดหมู่อย่างน้อย 1 รายการ', 'error');
      return;
    }
    setCategories(categories.filter((c) => c !== cat));
  };

  // Seed default educational items
  const handleSeedData = async () => {
    try {
      const count = await seedInitialDatabase(
        currentUser?.uid || '',
        userProfile?.displayName || 'ผู้ดูแลระบบ'
      );
      await onRefreshData();
      if (count > 0) {
        onShowToast(`เพิ่มชุดข้อมูลการศึกษาตัวอย่างสำเร็จ ${count} รายการ!`, 'success');
      } else {
        onShowToast('ระบบมีข้อมูลสื่อการเรียนรู้อยู่แล้ว ไม่จำเป็นต้องใส่ข้อมูลซ้ำ', 'info');
      }
    } catch (e) {
      onShowToast('เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง', 'error');
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (reportFilter === 'all') return true;
    return r.status === reportFilter;
  });

  // Filtered resources
  const filteredResources = resources.filter((r) => {
    if (!resourceSearch.trim()) return true;
    const q = resourceSearch.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.authorName.toLowerCase().includes(q);
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.institution?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Admin & Moderator Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            แผงควบคุมระบบคลังปัญญา
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            จัดการเนื้อหาสื่อการเรียนรู้ ตรวจสอบรายงานสมาชิก จัดการบัญชีผู้ใช้ และตั้งค่าเว็บไซต์แบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs sm:text-sm font-medium backdrop-blur-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">สื่อทั้งหมด</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{resources.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รายงานรอดำเนินการ</span>
            <Flag className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            {reports.filter((r) => r.status === 'pending').length}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">สมาชิกในระบบ</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{users.length || 1}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">หมวดหมู่วิชา</span>
            <Settings className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{categories.length}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-rose-600 text-rose-600 bg-rose-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>รายงานเนื้อหา ({reports.filter((r) => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'resources'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>สื่อทั้งหมด ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าเว็บไซต์</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-slate-800 text-slate-800 bg-slate-100'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>บันทึกประวัติการดูแล</span>
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">กรองสถานะ:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                {(['pending', 'resolved', 'dismissed', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportFilter(st)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                      reportFilter === st ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {st === 'pending'
                      ? 'รอดำเนินการ'
                      : st === 'resolved'
                      ? 'แก้ไขแล้ว'
                      : st === 'dismissed'
                      ? 'ยกเลิก'
                      : 'ทั้งหมด'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-900">ไม่มีรายงานที่รอดำเนินการ</h4>
              <p className="text-xs text-slate-500 mt-1">
                ระบบปลอดภัย สื่อทั้งหมดผ่านการดูแลเรียบร้อยแล้ว
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => {
                const targetRes = resources.find((r) => r.id === report.resourceId);
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            report.status === 'pending'
                              ? 'bg-rose-100 text-rose-700'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {report.status === 'pending'
                            ? 'รอดำเนินการ'
                            : report.status === 'resolved'
                            ? 'แก้ไขแล้ว'
                            : 'ยกเลิก'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(report.createdAt).toLocaleString('th-TH')}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base">
                        สื่อ: {report.resourceTitle}
                      </h4>

                      <p className="text-xs text-rose-700 font-medium">
                        เหตุผล: {report.reason}
                      </p>
                      {report.details && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          รายละเอียดจากผู้รายงาน: "{report.details}"
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        ผู้รายงาน: {report.reporterEmail || report.reporterId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                      {targetRes && (
                        <button
                          onClick={() => onViewResource(targetRes)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                        >
                          เปิดดูสื่อ
                        </button>
                      )}

                      {targetRes && (
                        <button
                          onClick={() => handleToggleResourceStatus(targetRes)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                            targetRes.status === 'published'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {targetRes.status === 'published' ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>ซ่อนสื่อ</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>เผยแพร่</span>
                            </>
                          )}
                        </button>
                      )}

                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateReport(report.id, 'resolved', 'ตรวจสอบและดำเนินการแก้ไขแล้ว')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                          >
                            ทำเครื่องหมายว่าแก้ไขแล้ว
                          </button>
                          <button
                            onClick={() => handleUpdateReport(report.id, 'dismissed', 'รายงานไม่พบข้อผิดพลาด')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            ยกเลิกรายงาน
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESOURCES */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="ค้นหาชื่อสื่อ หรือผู้เขียน..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">ชื่อสื่อการเรียนรู้</th>
                    <th className="p-3.5">หมวดหมู่</th>
                    <th className="p-3.5">ระดับชั้น</th>
                    <th className="p-3.5">ผู้แบ่งปัน</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900 max-w-xs truncate">
                        {res.title}
                      </td>
                      <td className="p-3.5 text-slate-600">{res.category}</td>
                      <td className="p-3.5 text-slate-600">{res.educationLevel}</td>
                      <td className="p-3.5 text-slate-600">{res.authorName}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {res.status === 'published' ? 'เผยแพร่ปกติ' : 'ถูกซ่อน'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onViewResource(res)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          ดู
                        </button>
                        <button
                          onClick={() => handleToggleResourceStatus(res)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
                        >
                          {res.status === 'published' ? 'ซ่อน' : 'แสดง'}
                        </button>
                        <button
                          onClick={() => requestDeleteResource(res)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล, สถานศึกษา..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">สมาชิก</th>
                    <th className="p-3.5">อีเมล</th>
                    <th className="p-3.5">สถาบัน/สังกัด</th>
                    <th className="p-3.5">บทบาท (Role)</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{u.displayName}</td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3.5 text-slate-600">{u.institution || '-'}</td>
                      <td className="p-3.5">
                        <select
                          disabled={!isAdmin}
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white font-medium disabled:opacity-50"
                        >
                          <option value="member">สมาชิกทั่วไป</option>
                          <option value="moderator">ผู้ช่วยดูแล (Mod)</option>
                          <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status === 'active' ? 'ปกติ' : 'ถูกระงับ'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleUserSuspension(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6 shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900">ตั้งค่าเว็บไซต์และคลังปัญญา</h3>
            <p className="text-xs text-slate-500">
              แก้ไขชื่อเว็บไซต์ สโลแกน แถบประกาศสำคัญ และจัดการหมวดหมู่วิชาได้โดยตรงผ่านหน้าเว็บ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อเว็บไซต์</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สโลแกน / คำอธิบายสั้น
              </label>
              <input
                type="text"
                required
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Announcement Banner Configuration */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-900">แถบประกาศสำคัญด้านบนสุด (Banner)</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>เปิดใช้งานแถบประกาศ</span>
              </label>
            </div>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="ข้อความประกาศ เช่น 'ยินดีต้อนรับสู่ คลังปัญญา! แหล่งรวมสื่อการสอนออนไลน์ฟรี'"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>

          {/* Manage Categories */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              หมวดหมู่วิชาและกลุ่มสาระการเรียนรู้
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-slate-400 hover:text-rose-600 rounded p-0.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="เพิ่มหมวดหมู่วิชาใหม่..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="shrink-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSeedData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>สร้างชุดข้อมูลการศึกษาตัวอย่าง (Seed Data)</span>
            </button>

            <button
              type="submit"
              disabled={!isAdmin}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-base">ประวัติการปฏิบัติงานของผู้ดูแลระบบ (Audit Trail)</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500">ยังไม่มีบันทึกการปฏิบัติงาน</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 mr-2">[{log.action}]</span>
                    <span className="text-slate-600">{log.note}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] shrink-0 ml-4">
                    {new Date(log.createdAt).toLocaleString('th-TH')} • {log.moderatorEmail || log.moderatorId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  );
};
