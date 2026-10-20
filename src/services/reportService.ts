import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ReportItem, ModerationLog, ReportReason, ReportStatus } from '../types';

export const createReport = async (reportData: {
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail?: string;
  reason: ReportReason;
  details?: string;
}): Promise<ReportItem> => {
  const colRef = collection(db, 'reports');
  const newDocRef = doc(colRef);
  const report: ReportItem = {
    ...reportData,
    id: newDocRef.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(newDocRef, report);
    return report;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${newDocRef.id}`);
  }
};

export const getAllReports = async (): Promise<ReportItem[]> => {
  const colRef = collection(db, 'reports');
  try {
    const snap = await getDocs(colRef);
    const reports = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReportItem));
    return reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'reports');
  }
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus
): Promise<void> => {
  const docRef = doc(db, 'reports', reportId);
  try {
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
};

export const addModerationLog = async (logData: {
  action: string;
  targetType: 'resource' | 'user' | 'report' | 'settings';
  targetId: string;
  moderatorId: string;
  moderatorEmail?: string;
  note?: string;
}): Promise<void> => {
  const colRef = collection(db, 'moderationLogs');
  const newDocRef = doc(colRef);
  const log: ModerationLog = {
    ...logData,
    id: newDocRef.id,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(newDocRef, log);
  } catch (error) {
    console.error('Could not write moderation log:', error);
  }
};

export const getModerationLogs = async (): Promise<ModerationLog[]> => {
  const colRef = collection(db, 'moderationLogs');
  try {
    const snap = await getDocs(colRef);
    const logs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ModerationLog));
    return logs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.warn('Could not read moderation logs:', error);
    return [];
  }
};
