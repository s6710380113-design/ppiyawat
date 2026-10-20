import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole, UserStatus } from '../types';

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const colRef = collection(db, 'users');
  try {
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'users');
  }
};

export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...snap.data(), uid: snap.id } as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  try {
    await updateDoc(docRef, {
      role,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  try {
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};
