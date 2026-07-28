export interface LXChatMessage {
  id: string;
  sender: 'user' | 'lx';
  text: string;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: 'order' | 'view_map' | 'split_bill' | 'locker';
    payload?: any;
  };
  metadata?: {
    vendor?: string;
    prepTimeMins?: number;
    price?: number;
    calories?: number;
    macros?: { protein: string; carbs: string; fat: string };
  };
}

export interface DemoFormData {
  fullName: string;
  email: string;
  role: 'University Admin' | 'Dining Director' | 'Campus Vendor / Franchise' | 'Student Rep';
  institutionName: string;
  campusStudentCount: string;
  preferredDate: string;
  notes: string;
}

export interface InstitutionRequestInsert {
  institution_name: string;
  campus: string;
  city: string;
  state: string;
  country: string;
  institution_email: string;
  contact_person: string;
  role: string;
  phone_number: string;
  institution_website: string;
  student_population: string;
  food_courts: number;
  vendors: number;
  message: string;
  status: 'pending';
}

export type UserRole = 'student' | 'faculty' | 'guest' | 'institution_admin' | 'kitchen_staff' | 'canteen_manager' | 'super_admin';

export interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  institution_id: string | null;
  role: UserRole | null;
  created_at: string;
  institution_code: string | null;
  department: string | null;
  semester: string | null;
  programme: string | null;
  campus_block: string | null;
  designation: string | null;
}

export interface InstitutionData {
  institution_id: string;
  institution_name: string;
  campus: string;
  city: string;
  state: string;
  country: string;
  institution_code: string;
  logo_url?: string | null;
}

export interface Banner {
  id: string;
  institution_id: string | null;
  title: string;
  subtitle: string;
  image_url: string | null;
  cta_label: string;
  cta_link: string;
  is_active: boolean;
  order: number;
}

export interface Announcement {
  id: string;
  institution_id: string | null;
  title: string;
  message: string;
  type: string;
  is_published: boolean;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  target_user: string;
  monthly_price: number;
  annual_price: number;
  description: string;
  popular: boolean;
  features: string[];
  cta_label: string;
  currency: string;
  is_active: boolean;
  order: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_published: boolean;
  order: number;
}

export interface PlatformFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon_name: string;
  badge: string;
  highlights: string[];
  graphic_type: string;
  is_active: boolean;
  order: number;
}

export interface HeroStat {
  id: string;
  value: string;
  label: string;
  is_active: boolean;
  order: number;
}

export interface PartnerUniversity {
  id: string;
  name: string;
  campus: string;
  location: string;
  short_name: string;
  logo_url: string | null;
  is_active: boolean;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  counter: string;
  counter_name: string;
  counter_id: string | null;
  price: number;
  offer_price: number | null;
  offer_label: string | null;
  prep_time: string | null;
  rating: number;
  category: string;
  category_id: string | null;
  image_url: string | null;
  description: string;
  is_available: boolean;
  is_published: boolean;
  popular: boolean;
  nutrition: string | null;
  institution_id: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  institution_id: string | null;
  is_active: boolean;
  order: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id?: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  email: string;
  role: UserRole | null;
  institution_id: string | null;
  institution_code: string | null;
  counter_id: string | null;
  category_id: string | null;
  order_id: string;
  counter: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  payment_status: string;
  pickup_code: string | null;
  qr_code: string | null;
  qr_code_data: string | null;
  locker_number: string | null;
  created_at: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
  read: boolean;
}

export interface CampusFeature {
  id: string;
  category: string;
  title: string;
  icon_name: string;
  badge: string;
  description: string;
  preview_type: string;
  highlights: string[];
  is_active: boolean;
  order: number;
}

export interface ImpactStat {
  id: string;
  icon_name: string;
  title: string;
  description: string;
  stat_label: string;
  stat_value: string;
  is_active: boolean;
  order: number;
}