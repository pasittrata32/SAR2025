
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER'
}

export type Language = 'TH' | 'EN';

export enum AchievementType {
  COMPETITION = 'แข่งขัน',
  TRAINING = 'อบรม',
  SEMINAR = 'สัมมนา',
  DEVELOPMENT = 'กิจกรรมพัฒนาผู้เรียน',
  INNOVATION = 'นวัตกรรม',
  AWARD = 'รางวัล'
}

export enum AchievementLevel {
  SCHOOL = 'โรงเรียน',
  DISTRICT = 'เขต',
  PROVINCE = 'จังหวัด',
  REGION = 'ภาค',
  COUNTRY = 'ประเทศ'
}

export interface StandardMapping {
  id: string;
  standard: number;
  label: string;
  labelEn: string;
  group: number;
  description: string;
  details?: string;
  detailsEn?: string;
  application?: string;
  applicationEn?: string;
  evidence?: string;
  evidenceEn?: string;
}

export interface TeacherInfo {
  prefix: string;
  fullName: string;
  position: string;
  department: string;
  levels: string[];
}

export interface CertificateEntry {
  id: string;
  teacher: TeacherInfo;
  activityName: string;
  type: AchievementType;
  organization: string;
  level: AchievementLevel;
  dateStart: string;
  dateEnd: string;
  imageData: string; // Base64
  selectedStandards: string[];
  status: 'PENDING' | 'APPROVED';
  submittedAt: number;
}
