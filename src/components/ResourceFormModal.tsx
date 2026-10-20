import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { Resource, MediaType } from '../types';
import { useAuth } from '../context/AuthContext';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Resource, 'id'>, editId?: string) => Promise<void>;
  editResource?: Resource | null;
  categories: string[];
  educationLevels: string[];
}

const DEFAULT_THUMBNAILS: Record<string, string> = {
  คณิตศาสตร์: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
  'คอมพิวเตอร์และเทคโนโลยี': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
  'วิทยาศาสตร์และฟิสิกส์': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
  ภาษาต่างประเทศ: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
  ภาษาไทย: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
  'สังคมและประวัติศาสตร์': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
  'ศิลปะและดนตรี': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
};

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editResource,
  categories,
  educationLevels,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
  const [educationLevel, setEducationLevel] = useState(educationLevels[0] || 'มัธยมศึกษาตอนปลาย');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editResource) {
      setTitle(editResource.title);
      setDescription(editResource.description);
      setCategory(editResource.category);
      setEducationLevel(editResource.educationLevel);
      setMediaType(editResource.mediaType);
      setUrl(editResource.url);
      setThumbnailUrl(editResource.thumbnailUrl || '');
      setTagsInput(editResource.tags ? editResource.tags.join(', ') : '');
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
      setEducationLevel(educationLevels[0] || 'มัธยมศึกษาตอนปลาย');
      setMediaType('video');
      setUrl('');
      setThumbnailUrl(DEFAULT_THUMBNAILS[categories[0]] || '');
      setTagsInput('');
    }
    setError(null);
  }, [editResource, isOpen, categories, educationLevels]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!thumbnailUrl || Object.values(DEFAULT_THUMBNAILS).includes(thumbnailUrl)) {
      if (DEFAULT_THUMBNAILS[newCat]) {
        setThumbnailUrl(DEFAULT_THUMBNAILS[newCat]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อ');
      return;
    }

    if (!title.trim()) {
      setError('กรุณากรอกชื่อสื่อการเรียนรู้');
      return;
    }

    if (!description.trim()) {
      setError('กรุณากรอกคำอธิบายเนื้อหา');
      return;
    }

    if (!url.trim()) {
      setError('กรุณากรอกลิงก์สื่อการเรียนรู้ (URL)');
      return;
    }

    // Process tags
    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0)
      .slice(0, 10);

    const payload: Omit<Resource, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      category,
      educationLevel,
      mediaType,
      url: url.trim(),
      thumbnailUrl:
        thumbnailUrl.trim() ||
        DEFAULT_THUMBNAILS[category] ||
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
      authorId: editResource ? editResource.authorId : currentUser.uid,
      authorName: editResource
        ? editResource.authorName
        : userProfile?.displayName || currentUser.displayName || 'ผู้ใช้งาน',
      authorEmail: currentUser.email || '',
      authorRole: userProfile?.educationLevel || 'สมาชิก',
      tags,
      viewsCount: editResource ? editResource.viewsCount : 0,
      likesCount: editResource ? editResource.likesCount : 0,
      status: 'published',
      createdAt: editResource ? editResource.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onSubmit(payload, editResource ? editResource.id : undefined);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editResource ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
              </h3>
              <p className="text-xs text-slate-500">
                ร่วมสร้างสรรค์สังคมแห่งการเรียนรู้ แบ่งปันให้กับนักเรียนและครูทั่วประเทศ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อสื่อ / หัวข้อบทเรียน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรตรีโกณมิติ ม.5 หรือ สอนเขียนโปรแกรม Python เบื้องต้น"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Category & Education Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระดับการศึกษา <span className="text-rose-500">*</span>
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {educationLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Type & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ประเภทสื่อ <span className="text-rose-500">*</span>
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="video">🎥 วิดีโอ / คลิปสอน</option>
                <option value="pdf">📄 PDF / เอกสาร</option>
                <option value="website">🌐 เว็บไซต์ / ลิงก์</option>
                <option value="slides">📊 สไลด์ประกอบสอน</option>
                <option value="document">📝 บทความ / โน้ตย่อ</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ลิงก์สื่อ (URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                maxLength={2000}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="เช่น https://www.youtube.com/watch?v=... หรือ ลิงก์ Google Drive / PDF"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Thumbnail URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                URL ภาพหน้าปก (Thumbnail)
              </label>
              <span className="text-[11px] text-slate-400">ระบบจะเลือกให้อัตโนมัติตามหมวดหมู่</span>
            </div>
            <input
              type="url"
              maxLength={2000}
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              คำอธิบายรายละเอียด <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายเนื้อหาที่ผู้เรียนจะได้รับ วิธีการใช้สื่อ หรือคำแนะนำประกอบการเรียน..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              แท็ก / คำสำคัญ (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="เช่น แคลคูลัส, สรุปสอบ, ปลายภาค, มปลาย"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{editResource ? 'บันทึกการแก้ไข' : 'เผยแพร่สู่ระบบ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
