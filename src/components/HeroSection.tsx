import React from 'react';
import { Search, Sparkles, BookOpen, Users, Video, FileText, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
  totalResources: number;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  onSelectCategory,
  categories,
  totalResources,
  onExploreClick,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-sky-400 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[450px] h-[450px] rounded-full bg-blue-500 blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-sky-200">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>คลังความรู้เปิดเพื่อการศึกษาไทยทุกคน</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          รวบรวมและแบ่งปัน <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-300 via-sky-200 to-blue-200 bg-clip-text text-transparent">
            ความรู้เพื่อทุกคน
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-blue-100/90 max-w-2xl mx-auto font-light leading-relaxed">
          ศูนย์รวมสื่อการเรียนรู้ เอกสารสรุป แบบฝึกหัด วิดีโอสอน และเว็บไซต์การศึกษา สำหรับนักเรียน นักศึกษา และคุณครู ค้นหาได้ง่าย เชื่อมต่อฐานข้อมูลจริง
        </p>

        {/* Large Hero Search Bar */}
        <div className="pt-2 max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-1.5 sm:p-2 border border-blue-200/40">
            <div className="pl-3 sm:pl-4 text-slate-400">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อบทเรียน, วิชา, หัวข้อ หรือคำสำคัญ เช่น แคลคูลัส, Python, ฟิสิกส์..."
              className="w-full px-3 py-2 sm:py-3 text-slate-800 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-normal bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ล้าง
              </button>
            )}
            <button
              onClick={onExploreClick}
              className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <span>ค้นหา</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="pt-2">
          <p className="text-xs text-blue-200/80 mb-2 font-medium">หมวดหมู่วิชายอดนิยม:</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-3xl mx-auto">
            <button
              onClick={() => onSelectCategory('ทั้งหมด')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === 'ทั้งหมด'
                  ? 'bg-sky-400 text-slate-900 shadow-md font-semibold'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
              }`}
            >
              ทั้งหมด
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-sky-400 text-slate-900 shadow-md font-semibold'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="pt-6 sm:pt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto border-t border-white/10 text-center">
          <div className="py-2">
            <p className="text-xl sm:text-3xl font-bold text-white">{totalResources || 6}+</p>
            <p className="text-[11px] sm:text-xs text-blue-200 font-light">สื่อการเรียนรู้</p>
          </div>
          <div className="py-2 border-x border-white/10">
            <p className="text-xl sm:text-3xl font-bold text-white">{categories.length}</p>
            <p className="text-[11px] sm:text-xs text-blue-200 font-light">กลุ่มสาระการเรียนรู้</p>
          </div>
          <div className="py-2">
            <p className="text-xl sm:text-3xl font-bold text-white">100%</p>
            <p className="text-[11px] sm:text-xs text-blue-200 font-light">เปิดกว้าง & ฟรี</p>
          </div>
        </div>
      </div>
    </div>
  );
};
