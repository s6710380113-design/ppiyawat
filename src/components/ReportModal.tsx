import React, { useState } from 'react';
import { X, Flag, AlertCircle, CheckCircle } from 'lucide-react';
import { Resource, ReportReason } from '../types';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../services/reportService';

interface ReportModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'broken_link', label: '🔗 ลิงก์เสีย / ไฟล์เปิดไม่ได้', desc: 'ไม่สามารถดาวน์โหลดหรือเข้าถึงสื่อตาม URL ได้' },
  { value: 'copyright', label: '©️ ละเมิดลิขสิทธิ์', desc: 'นำสื่อหรือผลงานที่มีลิขสิทธิ์มาเผยแพร่โดยไม่ได้รับอนุญาต' },
  { value: 'inappropriate', label: '⚠️ เนื้อหาไม่เหมาะสม', desc: 'มีเนื้อหาหยาบคาย ความรุนแรง หรือขัดต่อศีลธรรมอันดี' },
  { value: 'inaccurate', label: '❌ ข้อมูลผิดพลาดหรือคลาดเคลื่อน', desc: 'เนื้อหาทางวิชาการมีข้อผิดพลาดร้ายแรง' },
  { value: 'spam', label: '📢 สแปม หรือโฆษณาแอบแฝง', desc: 'ไม่ใช่สื่อการเรียนรู้ แต่เป็นการโฆษณาพาณิชย์' },
  { value: 'other', label: '📝 อื่นๆ', desc: 'เหตุผลอื่นๆ โปรดระบุเพิ่มเติมด้านล่าง' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนทำการรายงานเนื้อหา');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createReport({
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || '',
        reason,
        details: details.trim(),
      });
      onSuccess('ส่งรายงานเรียบร้อยแล้ว ทีมงานและผู้ดูแลระบบจะดำเนินการตรวจสอบโดยเร็ว');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2 text-rose-700">
            <Flag className="w-5 h-5" />
            <h3 className="font-bold text-base text-rose-900">รายงานสื่อการเรียนรู้</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-500">สื่อที่รายงาน: </span>
            <span className="font-bold text-slate-800">{resource.title}</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              เหตุผลในการรายงาน <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    reason === r.value
                      ? 'border-rose-400 bg-rose-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{r.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="ระบุจุดที่พบปัญหา เช่น หน้าที่พบข้อมูลผิดพลาด หรือลิงก์ที่เข้าถึงไม่ได้..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>ส่งรายงาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
