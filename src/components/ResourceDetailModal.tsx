import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Heart,
  Eye,
  Flag,
  Share2,
  Calendar,
  User,
  School,
  Edit3,
  Trash2,
  FileText,
  Video,
  Globe,
  Presentation,
} from 'lucide-react';
import { Resource } from '../types';
import { getMediaTypeBadge } from './ResourceCard';

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (r: Resource) => void;
  onLike: (r: Resource) => void;
  hasLiked: boolean;
  onReport: (r: Resource) => void;
  onEdit?: (r: Resource) => void;
  onDelete?: (r: Resource) => void;
  canManage?: boolean;
  onCopyLink: (r: Resource) => void;
}

// Convert common YouTube URLs into embeddable URLs
export const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onLike,
  hasLiked,
  onReport,
  onEdit,
  onDelete,
  canManage,
  onCopyLink,
}) => {
  if (!isOpen || !resource) return null;

  const mediaBadge = getMediaTypeBadge(resource.mediaType);
  const ytEmbedUrl = resource.mediaType === 'video' ? getYouTubeEmbedUrl(resource.url) : null;
  const isPdf = resource.mediaType === 'pdf' || resource.url.endsWith('.pdf');

  const formattedDate = new Date(resource.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${mediaBadge.className}`}
            >
              {mediaBadge.icon}
              <span>{mediaBadge.label}</span>
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-1 rounded-md">
              {resource.category}
            </span>
            <span className="hidden sm:inline-block text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
              {resource.educationLevel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <div className="flex items-center gap-1 mr-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(resource)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="แก้ไขสื่อ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(resource)}
                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="ลบสื่อ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {/* Media Player / Interactive Preview Section */}
          {ytEmbedUrl ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
              <iframe
                src={ytEmbedUrl}
                title={resource.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isPdf && resource.url.startsWith('http') ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-800">เอกสารการเรียนรู้ฉบับเต็ม (PDF)</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                คุณสามารถเปิดอ่านหรือดาวน์โหลดเอกสารไฟล์ PDF ได้โดยตรงผ่านลิงก์ด้านล่างนี้
              </p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-md shadow-rose-600/20 transition-all"
              >
                <span>เปิดอ่าน PDF ฉบับเต็ม</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : resource.thumbnailUrl ? (
            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden shadow-md relative group">
              <img
                src={resource.thumbnailUrl}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-slate-900 hover:bg-blue-600 hover:text-white rounded-2xl font-semibold text-sm shadow-xl flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <span>เข้าสู่หน้าสื่อต้นฉบับ</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : null}

          {/* Title & Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {resource.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>เผยแพร่เมื่อ: {formattedDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" />
                <span>เข้าชมแล้ว {resource.viewsCount || 0} ครั้ง</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>{resource.likesCount || 0} ถูกใจ</span>
              </span>
            </div>
          </div>

          {/* Description Text */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              คำอธิบายรายละเอียด
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {resource.description}
            </p>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                {resource.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium bg-white text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg"
                  >
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Direct Media Link Box */}
          <div className="flex items-center justify-between p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3 overflow-hidden pr-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-blue-950">ลิงก์เข้าถึงสื่อการเรียนรู้</p>
                <p className="text-xs text-blue-700 truncate font-mono">{resource.url}</p>
              </div>
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>เปิดลิงก์</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Author info card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {resource.authorName.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{resource.authorName}</p>
              <p className="text-xs text-slate-500">
                {resource.authorRole || 'ผู้แบ่งปันความรู้'} • เผยแพร่ในระบบคลังปัญญา
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Like Button */}
            <button
              onClick={() => onLike(resource)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                hasLiked
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{hasLiked ? 'ถูกใจแล้ว' : 'กดถูกใจ'}</span>
              <span className="font-normal opacity-80">({resource.likesCount || 0})</span>
            </button>

            {/* Favorite Bookmark Button */}
            <button
              onClick={() => onToggleFavorite(resource)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isFavorite
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}</span>
            </button>

            {/* Share Link Button */}
            <button
              onClick={() => onCopyLink(resource)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              title="คัดลอกลิงก์เพื่อแชร์"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">แชร์</span>
            </button>
          </div>

          {/* Report Button */}
          <button
            onClick={() => onReport(resource)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>รายงานเนื้อหาไม่เหมาะสม / ลิงก์เสีย</span>
          </button>
        </div>
      </div>
    </div>
  );
};
