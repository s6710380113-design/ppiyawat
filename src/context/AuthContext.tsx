import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, BOOTSTRAP_ADMIN_EMAIL, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    institution?: string,
    educationLevel?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateProfileDetails: (details: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile from Firestore or bootstrap user document
  const syncUserProfile = async (fbUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Check if user is bootstrap admin and update role if needed
        if (fbUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin', updatedAt: new Date().toISOString() });
          data.role = 'admin';
        }
        setUserProfile(data);
      } else {
        // Create new user profile document
        const isBootstrapAdmin = fbUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: fbUser.photoURL || '',
          role: isBootstrapAdmin ? 'admin' : 'member',
          status: 'active',
          institution: '',
          educationLevel: 'นักเรียน/นักศึกษา',
          bio: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching/creating user profile:', err);
      // Fallback local representation if rules block initial fetch
      const isBootstrapAdmin = fbUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      setUserProfile({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'ผู้ใช้งาน',
        photoURL: fbUser.photoURL || '',
        role: isBootstrapAdmin ? 'admin' : 'member',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserProfile(cred.user);
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    institution?: string,
    educationLevel?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    // Real email verification trigger
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Could not send verification email:', e);
    }

    const isBootstrapAdmin = cred.user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || '',
      displayName: displayName.trim() || 'ผู้ใช้งาน',
      photoURL: '',
      role: isBootstrapAdmin ? 'admin' : 'member',
      status: 'active',
      institution: institution?.trim() || '',
      educationLevel: educationLevel || 'นักเรียน/นักศึกษา',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cred.user.uid}`);
    }
    setUserProfile(newProfile);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    await syncUserProfile(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await syncUserProfile(auth.currentUser);
    }
  };

  const updateProfileDetails = async (details: Partial<UserProfile>) => {
    if (!auth.currentUser) throw new Error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const updatePayload = {
      ...details,
      updatedAt: new Date().toISOString(),
    };
    try {
      await updateDoc(userDocRef, updatePayload);
      if (details.displayName && details.displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: details.displayName });
      }
      setUserProfile((prev) => (prev ? { ...prev, ...updatePayload } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const role: UserRole = userProfile?.role || 'member';
  const isAdmin = role === 'admin' || currentUser?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const isModerator = isAdmin || role === 'moderator';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: isAdmin ? 'admin' : role,
        isAdmin,
        isModerator,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        resendVerificationEmail,
        refreshUserProfile,
        updateProfileDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
