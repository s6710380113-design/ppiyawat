import React, { useState } from 'react';
import { X, User, Mail, Shield, Building2, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, userProfile, updateProfileDetails, resendVerificationEmail, isAdmin, isModerator } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [institution, setInstitution] = useState(userProfile?.institution || '');
  const [educationLevel, setEducationLevel] = useState(userProfile?.educationLevel || 'นักเรียน/นักศึกษา');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  React.useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setInstitution(userProfile.institution || '');
      setEducationLevel(userProfile.educationLevel || 'นักเรียน/นักศึกษา');
      setBio(userProfile.bio || '');
    }
  }, [userProfile, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileDetails({
        displayName: displayName.trim(),
        institution: institution.trim(),
        educationLevel,
        bio: bio.trim(),
      });
      onSuccess('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setVerificationSent(true);
      onSuccess('ส่งอีเมลยืนยันตัวตนไปยัง ' + currentUser.email + ' เรียบร้อยแล้ว');
    } catch (e) {
      alert('ไม่สามารถส่งอีเมลยืนยันได้ โปรดลองอีกครั้งในภายหลัง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">ข้อมูลส่วนตัวและโปรไฟล์</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar and Role */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {displayName.slice(0, 2) || 'ผู้ใช้'}
            </div>
            <div>
              <p className="font-bold text-slate-900">{displayName || 'ผู้ใช้งาน'}</p>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {isAdmin ? '👑 ผู้ดูแลระบบสูงสุด (Admin)' : isModerator ? '🛡️ ผู้ช่วยดูแล (Moderator)' : '🎓 สมาชิกทั่วไป (Member)'}
                </span>
              </div>
            </div>
          </div>

          {/* Email Verification Status */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {currentUser.emailVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800 font-medium">ยืนยันอีเมลแล้ว</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-800 font-medium">ยังไม่ยืนยันอีเมล</span>
                </>
              )}
            </div>
            {!currentUser.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={verificationSent}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Send className="w-3 h-3" />
                <span>{verificationSent ? 'ส่งแล้ว' : 'ส่งอีเมลยืนยัน'}</span>
              </button>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อที่แสดง</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Role / Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานะผู้เรียน/ผู้สอน</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white"
              >
                <option value="นักเรียน/นักศึกษา">นักเรียน / นักศึกษา</option>
                <option value="ครู/อาจารย์">ครู / อาจารย์</option>
                <option value="นักวิชาการ/วิจัย">นักวิชาการ / วิจัย</option>
                <option value="บุคคลทั่วไป">บุคคลทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานศึกษา / องค์กร</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="เช่น โรงเรียน... หรือ มหาวิทยาลัย..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">แนะนำตัวสั้นๆ (Bio)</label>
            <textarea
              rows={2}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="ความสนใจหรือความเชี่ยวชาญพิเศษของคุณ..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
