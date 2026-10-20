export type UserRole = 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  institution?: string; // โรงเรียน/มหาวิทยาลัย/หน่วยงาน
  educationLevel?: string; // นักเรียน, นักศึกษา, ครูอาจารย์, บุคคลทั่วไป
  createdAt: string;
  updatedAt?: string;
}

export type MediaType = 'pdf' | 'video' | 'website' | 'document' | 'slides';

export type ResourceStatus = 'published' | 'hidden' | 'archived';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  educationLevel: string;
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorRole?: string;
  tags?: string[];
  viewsCount: number;
  likesCount: number;
  status: ResourceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory?: string;
  resourceMediaType?: MediaType;
  createdAt: string;
}

export type ReportReason = 'broken_link' | 'copyright' | 'inappropriate' | 'inaccurate' | 'spam' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReportItem {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ModerationLog {
  id: string;
  action: string;
  targetType: 'resource' | 'user' | 'report' | 'settings';
  targetId: string;
  moderatorId: string;
  moderatorEmail?: string;
  note?: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  announcement?: string;
  announcementActive?: boolean;
  categories: string[];
  educationLevels: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ResourceFilterState {
  searchQuery: string;
  category: string;
  educationLevel: string;
  mediaType: string;
  sortBy: 'latest' | 'popular' | 'mostLiked';
}
