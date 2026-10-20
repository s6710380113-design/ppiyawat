import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SiteSettings, Resource } from '../types';

export const DEFAULT_CATEGORIES = [
  'คอมพิวเตอร์และเทคโนโลยี',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และฟิสิกส์',
  'ภาษาต่างประเทศ',
  'ภาษาไทย',
  'สังคมและประวัติศาสตร์',
  'ศิลปะและดนตรี',
  'การงานอาชีพและธุรกิจ',
  'สุขศึกษาและกีฬา',
  'เตรียมสอบและทั่วไป',
];

export const DEFAULT_EDUCATION_LEVELS = [
  'ทุกระดับชั้น',
  'ประถมศึกษา',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
  'อาชีวศึกษา (ปวช./ปวส.)',
  'อุดมศึกษา/มหาวิทยาลัย',
  'บุคคลทั่วไป/ผู้สนใจ',
];

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'คลังปัญญา (PanyaHub)',
  siteDescription: 'ศูนย์รวมสื่อการเรียนรู้และคลังความรู้แบบเปิด สำหรับนักเรียน นักศึกษา และครูอาจารย์ทั่วประเทศ',
  announcement: 'ยินดีต้อนรับสู่ คลังปัญญา! แหล่งรวมบทเรียน วิดีโอสอน เอกสาร PDF และสรุปความรู้คุณภาพเพื่อการศึกษาไทย',
  announcementActive: true,
  categories: DEFAULT_CATEGORIES,
  educationLevels: DEFAULT_EDUCATION_LEVELS.filter(l => l !== 'ทุกระดับชั้น'),
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const settingsDocRef = doc(db, 'settings', 'global');
  try {
    const snap = await getDoc(settingsDocRef);
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    } else {
      // First time initialization
      await setDoc(settingsDocRef, {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSiteSettings = async (settings: Partial<SiteSettings>, updatedBy: string): Promise<void> => {
  const settingsDocRef = doc(db, 'settings', 'global');
  const payload = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  try {
    await updateDoc(settingsDocRef, payload);
  } catch (error) {
    // If doesn't exist, create it
    try {
      await setDoc(settingsDocRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    }
  }
};

// Initial realistic Thai educational resources
export const SAMPLE_RESOURCES: Omit<Resource, 'id'>[] = [
  {
    title: 'สรุปครบ จบทุกสูตร แคลคูลัส 1 สำหรับม.ปลายและปี 1',
    description: 'เอกสารสรุปสูตรแคลคูลัสพื้นฐาน ลิมิต อนุพันธ์ และการอินทิเกรต พร้อมตัวอย่างโจทย์และการประยุกต์ใช้งาน เหมาะสำหรับการทบทวนสอบปลายภาค',
    category: 'คณิตศาสตร์',
    educationLevel: 'มัธยมศึกษาตอนปลาย',
    mediaType: 'pdf',
    url: 'https://www.math.science.cmu.ac.th',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    authorId: 'system_seed',
    authorName: 'อ.ดร. ธีรภัทร วิทยากิจ',
    authorRole: 'ครู/อาจารย์',
    tags: ['แคลคูลัส', 'คณิตมปลาย', 'สรุปสูตร', 'อินทิเกรต'],
    viewsCount: 248,
    likesCount: 42,
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    title: 'คอร์สปูพื้นฐาน Python สำหรับวิทยาการคำนวณและ Data Science',
    description: 'วิดีโอคลิปสอนเขียนโปรแกรมภาษา Python ตั้งแต่เริ่มต้น ตัวแปร, ลูป, ฟังก์ชัน, การจัดการข้อมูล และการสร้างโครงงานอย่างง่าย เข้าใจง่าย ปฏิบัติตามได้ทันที',
    category: 'คอมพิวเตอร์และเทคโนโลยี',
    educationLevel: 'มัธยมศึกษาตอนปลาย',
    mediaType: 'video',
    url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    authorId: 'system_seed',
    authorName: 'ครูณัฐพล เทคโนพาร์ท',
    authorRole: 'ครูคอมพิวเตอร์',
    tags: ['Python', 'เขียนโปรแกรม', 'วิทยาการคำนวณ', 'โค้ดดิ้ง'],
    viewsCount: 685,
    likesCount: 89,
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    title: 'แบบจำลองฟิสิกส์เสมือนจริง: การเคลื่อนที่แบบโพรเจกไทล์ และวงกลม',
    description: 'เว็บไซต์จำลองแล็บทดลองฟิสิกส์แบบอินเตอร์แอคทีฟ ปรับค่าความเร็วต้น มุมยิง และแรงโน้มถ่วงเพื่อสังเกตผลการเคลื่อนที่ได้แบบ 3D',
    category: 'วิทยาศาสตร์และฟิสิกส์',
    educationLevel: 'มัธยมศึกษาตอนต้น',
    mediaType: 'website',
    url: 'https://phet.colorado.edu/th/simulations/projectile-motion',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    authorId: 'system_seed',
    authorName: 'ศูนย์สะเต็มศึกษาแห่งชาติ',
    authorRole: 'สถาบันการศึกษา',
    tags: ['ฟิสิกส์', 'โพรเจกไทล์', 'การทดลองเสมือน', 'STEM'],
    viewsCount: 412,
    likesCount: 67,
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    title: 'สไลด์บรรยาย: ไวยากรณ์ภาษาอังกฤษ 12 Tenses ฉบับจำง่ายใช้งานได้จริง',
    description: 'สไลด์ประกอบการสอนไวยากรณ์ภาษาอังกฤษ ตารางเปรียบเทียบ Tense รูปแบบประโยค Active/Passive Voice พร้อมเทคนิคการทำข้อสอบ TGAT Eng',
    category: 'ภาษาต่างประเทศ',
    educationLevel: 'อุดมศึกษา/มหาวิทยาลัย',
    mediaType: 'slides',
    url: 'https://www.canva.com/design',
    thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    authorId: 'system_seed',
    authorName: 'อ.ศศิธร ศุภรัตน์',
    authorRole: 'อาจารย์ภาษาศาสตร์',
    tags: ['English', 'Tenses', 'TGAT', 'ไวยากรณ์'],
    viewsCount: 395,
    likesCount: 51,
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    title: 'คู่มือการทำวิจัยและโครงงานวิทยาศาสตร์ฉบับปฏิบัติการ',
    description: 'เอกสารแนวทางการตั้งสมมติฐาน ออกแบบการทดลอง การเก็บรวบรวมข้อมูล สถิติเบื้องต้น และการเขียนรายงานโครงงานวิจัย 5 บท',
    category: 'วิทยาศาสตร์และฟิสิกส์',
    educationLevel: 'อุดมศึกษา/มหาวิทยาลัย',
    mediaType: 'document',
    url: 'https://www.nstda.or.th',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
    authorId: 'system_seed',
    authorName: 'ดร.กิตติศักดิ์ พัฒนพันธุ์',
    authorRole: 'นักวิจัยและอาจารย์',
    tags: ['โครงงาน', 'วิจัย', 'วิทยาศาสตร์', 'สถิติ'],
    viewsCount: 180,
    likesCount: 29,
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    title: 'สื่อการสอน: ประวัติศาสตร์ไทยสมัยสุโขทัยและอยุธยาผ่านแผนที่โบราณ',
    description: 'รวมแผนที่ การค้า และลำดับเหตุการณ์สำคัญทางประวัติศาสตร์ พร้อมภาพถ่ายวัตถุโบราณและเกร็ดความรู้ทางวัฒนธรรม',
    category: 'สังคมและประวัติศาสตร์',
    educationLevel: 'มัธยมศึกษาตอนต้น',
    mediaType: 'website',
    url: 'https://www.finearts.go.th',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
    authorId: 'system_seed',
    authorName: 'ครูสมพร เจริญจิตต์',
    authorRole: 'ครูสังคมศึกษา',
    tags: ['ประวัติศาสตร์', 'อยุธยา', 'สุโขทัย', 'สังคมศึกษา'],
    viewsCount: 156,
    likesCount: 23,
    status: 'published',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  }
];

export const seedInitialDatabase = async (authorId: string, authorName: string): Promise<number> => {
  const resourcesRef = collection(db, 'resources');
  const existingDocs = await getDocs(resourcesRef);
  if (!existingDocs.empty) {
    return 0; // Already has resources
  }

  const batch = writeBatch(db);
  let count = 0;

  for (const item of SAMPLE_RESOURCES) {
    const newDocRef = doc(resourcesRef);
    const resourceData: Resource = {
      ...item,
      id: newDocRef.id,
      authorId: authorId || 'system_author',
      authorName: authorName || item.authorName,
      status: 'published',
      createdAt: item.createdAt,
      updatedAt: new Date().toISOString(),
    };
    batch.set(newDocRef, resourceData);
    count++;
  }

  await batch.commit();
  return count;
};
