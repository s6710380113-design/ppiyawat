import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

interface AnnouncementBannerProps {
  text?: string;
  active?: boolean;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ text, active }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!active || !text || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <span className="shrink-0 inline-flex items-center justify-center p-1 bg-white/20 rounded-md">
            <Megaphone className="w-3.5 h-3.5" />
          </span>
          <span className="truncate">{text}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
          title="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
