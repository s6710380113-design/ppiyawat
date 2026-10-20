import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Resource, ResourceFilterState } from '../types';

export const getResources = async (filters?: Partial<ResourceFilterState>): Promise<Resource[]> => {
  const colRef = collection(db, 'resources');
  try {
    const snap = await getDocs(colRef);
    let items: Resource[] = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Resource));

    // Client-side filtering to allow multi-field composite matching without requiring composite index creation errors
    if (filters) {
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        items = items.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.tags?.some((t) => t.toLowerCase().includes(q)) ||
            r.authorName.toLowerCase().includes(q)
        );
      }
      if (filters.category && filters.category !== 'ทั้งหมด') {
        items = items.filter((r) => r.category === filters.category);
      }
      if (filters.educationLevel && filters.educationLevel !== 'ทุกระดับชั้น') {
        items = items.filter((r) => r.educationLevel === filters.educationLevel);
      }
      if (filters.mediaType && filters.mediaType !== 'ทั้งหมด') {
        items = items.filter((r) => r.mediaType === filters.mediaType);
      }
      if (filters.sortBy === 'popular') {
        items.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
      } else if (filters.sortBy === 'mostLiked') {
        items.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
      } else {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'resources');
  }
};

export const getResourceById = async (id: string): Promise<Resource | null> => {
  const docRef = doc(db, 'resources', id);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as Resource;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `resources/${id}`);
  }
};

export const createResource = async (resourceData: Omit<Resource, 'id'>): Promise<Resource> => {
  const colRef = collection(db, 'resources');
  const newDocRef = doc(colRef);
  const resource: Resource = {
    ...resourceData,
    id: newDocRef.id,
    viewsCount: 0,
    likesCount: 0,
    status: resourceData.status || 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(newDocRef, resource);
    return resource;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `resources/${newDocRef.id}`);
  }
};

export const updateResource = async (id: string, updates: Partial<Resource>): Promise<void> => {
  const docRef = doc(db, 'resources', id);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resources/${id}`);
  }
};

export const deleteResource = async (id: string): Promise<void> => {
  const docRef = doc(db, 'resources', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `resources/${id}`);
  }
};

export const incrementResourceViews = async (id: string): Promise<void> => {
  const docRef = doc(db, 'resources', id);
  try {
    await updateDoc(docRef, {
      viewsCount: increment(1),
    });
  } catch (error) {
    console.warn('Could not increment view count:', error);
  }
};

export const toggleResourceLike = async (id: string, incrementBy: 1 | -1): Promise<void> => {
  const docRef = doc(db, 'resources', id);
  try {
    await updateDoc(docRef, {
      likesCount: increment(incrementBy),
    });
  } catch (error) {
    console.warn('Could not toggle like count:', error);
  }
};

export const subscribeToResources = (
  callback: (resources: Resource[]) => void,
  onError?: (error: Error) => void
) => {
  const colRef = collection(db, 'resources');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Resource));
      callback(items);
    },
    (error) => {
      console.error('Resource snapshot error:', error);
      onError?.(error);
    }
  );
};
