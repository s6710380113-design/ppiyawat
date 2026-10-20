import React from 'react';
import { Search, FolderOpen, Bookmark, Plus } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'favorites' | 'my-resources' | 'general';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'general',
  title,
  description,
  actionText,
  onAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="w-8 h-8 text-blue-500" />;
      case 'favorites':
        return <Bookmark className="w-8 h-8 text-amber-500" />;
      case 'my-resources':
        return <FolderOpen className="w-8 h-8 text-indigo-500" />;
      default:
        return <FolderOpen className="w-8 h-8 text-slate-400" />;
    }
  };

  const defaultTitle =
    title ||
    (type === 'search'
      ? 'ไม่พบสื่อการเรียนรู้ที่ตรงกับเงื่อนไข'
      : type === 'favorites'
      ? 'ยังไม่มีรายการโปรดที่บันทึกไว้'
      : type === 'my-resources'
      ? 'คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้'
      : 'ยังไม่มีข้อมูลในระบบ');

  const defaultDescription =
    description ||
    (type === 'search'
      ? 'ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองหมวดหมู่และระดับชั้นใหม่'
      : type === 'favorites'
      ? 'กดรูปไอคอนบุ๊กมาร์กบนการ์ดสื่อการเรียนรู้ที่คุณสนใจเพื่อเก็บไว้ดูภายหลัง'
      : type === 'my-resources'
      ? 'ร่วมเป็นส่วนหนึ่งในการแบ่งปันความรู้และบทเรียนดีๆ ให้กับเพื่อนนักเรียนและครู'
      : 'ระบบพร้อมใช้งาน ข้อมูลจะแสดงเมื่อมีการบันทึกเข้ามา');

  return (
    <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
        {getIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{defaultTitle}</h3>
      <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
        {defaultDescription}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
