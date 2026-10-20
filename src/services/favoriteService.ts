import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FavoriteItem, Resource } from '../types';

export const getFavoriteDocId = (userId: string, resourceId: string) => `${userId}_${resourceId}`;

export const addFavorite = async (userId: string, resource: Resource): Promise<void> => {
  const favId = getFavoriteDocId(userId, resource.id);
  const docRef = doc(db, 'favorites', favId);
  const favData: FavoriteItem = {
    id: favId,
    userId,
    resourceId: resource.id,
    resourceTitle: resource.title,
    resourceCategory: resource.category,
    resourceMediaType: resource.mediaType,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, favData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `favorites/${favId}`);
  }
};

export const removeFavorite = async (userId: string, resourceId: string): Promise<void> => {
  const favId = getFavoriteDocId(userId, resourceId);
  const docRef = doc(db, 'favorites', favId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `favorites/${favId}`);
  }
};

export const checkIsFavorite = async (userId: string, resourceId: string): Promise<boolean> => {
  const favId = getFavoriteDocId(userId, resourceId);
  const docRef = doc(db, 'favorites', favId);
  try {
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (error) {
    return false;
  }
};

export const getUserFavorites = async (userId: string): Promise<FavoriteItem[]> => {
  const colRef = collection(db, 'favorites');
  const q = query(colRef, where('userId', '==', userId));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as FavoriteItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'favorites');
  }
};

export const subscribeToFavorites = (
  userId: string,
  callback: (favs: FavoriteItem[]) => void
) => {
  const colRef = collection(db, 'favorites');
  const q = query(colRef, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data() as FavoriteItem);
      callback(items);
    },
    (error) => {
      console.error('Favorites snapshot error:', error);
    }
  );
};
