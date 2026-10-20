import React from 'react';
import {
  FileText,
  Video,
  Globe,
  Presentation,
  Bookmark,
  Heart,
  Eye,
  Calendar,
  User,
  Edit3,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Resource, MediaType } from '../types';

interface ResourceCardProps {
  resource: Resource;
  isFavorite: boolean;
  onToggleFavorite: (r: Resource) => void;
  onClick: (r: Resource) => void;
  onEdit?: (r: Resource) => void;
  onDelete?: (r: Resource) => void;
  canManage?: boolean;
}

export const getMediaTypeBadge = (type: MediaType) => {
  switch (type) {
    case 'pdf':
      return {
        label: 'PDF / เอกสาร',
        icon: <FileText className="w-3.5 h-3.5" />,
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'video':
      return {
        label: 'วิดีโอ / คลิปสอน',
        icon: <Video className="w-3.5 h-3.5" />,
        className: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'website':
      return {
        label: 'เว็บไซต์ / ลิงก์',
        icon: <Globe className="w-3.5 h-3.5" />,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'slides':
      return {
        label: 'สไลด์ประกอบสอน',
        icon: <Presentation className="w-3.5 h-3.5" />,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'document':
    default:
      return {
        label: 'บทความ / เอกสาร',
        icon: <FileText className="w-3.5 h-3.5" />,
        className: 'bg-sky-50 text-sky-700 border-sky-200',
      };
  }
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorite,
  onToggleFavorite,
  onClick,
  onEdit,
  onDelete,
  canManage,
}) => {
  const mediaBadge = getMediaTypeBadge(resource.mediaType);

  const formattedDate = new Date(resource.createdAt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Cover image or colored pattern banner */}
      <div
        onClick={() => onClick(resource)}
        className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer select-none"
      >
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback to placeholder if thumbnail fails to load
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-sky-600 to-indigo-700 flex items-center justify-center text-white/40 group-hover:scale-105 transition-transform duration-500">
            <FileText className="w-16 h-16 opacity-30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />

        {/* Media Type Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md shadow-xs border ${mediaBadge.className}`}
          >
            {mediaBadge.icon}
            <span>{mediaBadge.label}</span>
          </span>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(resource);
          }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${
            isFavorite
              ? 'bg-amber-500 text-white shadow-amber-500/30'
              : 'bg-white/80 hover:bg-white text-slate-700 hover:text-amber-500'
          }`}
          title={isFavorite ? 'นำออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Category & Grade Level overlay badges */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
          <span className="font-medium bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
            {resource.category}
          </span>
          <span className="bg-blue-600/80 px-2 py-0.5 rounded-md font-light backdrop-blur-xs">
            {resource.educationLevel}
          </span>
        </div>
      </div>

      {/* Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div onClick={() => onClick(resource)} className="cursor-pointer">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {resource.title}
          </h3>
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {resource.description}
          </p>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                >
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer info: Author, Stats, Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[150px]">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-700">{resource.authorName}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-[11px] text-slate-500" title="จำนวนเข้าชม">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{resource.viewsCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500" title="จำนวนถูกใจ">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{resource.likesCount || 0}</span>
            </span>

            {/* Management Buttons if owner or admin */}
            {canManage && (
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-200">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(resource);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="แก้ไขสื่อ"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(resource);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="ลบสื่อ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
