export type UserRole = 'student' | 'faculty' | 'guest' | 'institution_admin' | 'kitchen_staff' | 'canteen_manager' | 'super_admin';

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

export interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  institution_id: string | null;
  role: UserRole | null;
  created_at: string;
  updated_at?: string;
  department: string | null;
  semester: string | null;
  programme: string | null;
  campus_block: string | null;
  designation: string | null;
  avatar_url: string | null;
  diet_preference: 'all' | 'veg' | 'non-veg' | null;
  wallet_balance?: number;
  total_orders?: number;
  favorite_counters?: string[];
}

export interface Canteen {
  id: string;
  institution_id: string | null;
  name: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  is_ordering_enabled: boolean;
  prep_time_minutes: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  institution_id: string | null;
  label: string;
  address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
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

export interface HomepageSection {
  id: string;
  institution_id: string | null;
  section_type: 'banner' | 'categories' | 'counters' | 'featured' | 'trending' | 'recently_added' | 'recommended' | 'ai_suggestions' | 'popular_today' | 'fast_pickup' | 'healthy_meals' | 'offers';
  title: string;
  subtitle?: string;
  display_order: number;
  is_active: boolean;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Counter {
  id: string;
  institution_id: string | null;
  name: string;
  description?: string;
  image_url?: string | null;
  is_active: boolean;
  order: number;
  avg_prep_time?: number;
  location?: string;
  floor?: string;
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
  food_name?: string;
  counter: string;
  counter_name: string;
  counter_id: string | null;
  canteen_id: string | null;
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
  status: string;
  available: boolean;
  availability: boolean;
  is_archived: boolean;
  popular: boolean;
  nutrition: string | null;
  institution_id: string | null;
  is_veg?: boolean;
  prep_time_minutes?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  is_healthy?: boolean;
  trending?: boolean;
  today_orders?: number;
  stock: number;
  ai_popularity_score?: number;
  tags?: string[];
  created_at?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  institution_id: string | null;
  is_active: boolean;
  order: number;
  image_url?: string | null;
  description?: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'cooking' | 'quality_check' | 'packed' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id?: string;
  name: string;
  variant?: string | null;
  quantity: number;
  price: number;
  image_url?: string | null;
  is_veg?: boolean;
}

export interface Order {
  id: string;
  student_id: string;
  user_id: string;
  email: string;
  customer_name: string | null;
  phone: string | null;
  role: UserRole | null;
  institution_id: string | null;
  canteen_id: string | null;
  counter_id: string | null;
  category_id: string | null;
  order_id: string;
  order_number?: string;
  items: OrderItem[];
  total_amount: number;
  transaction_amount: number;
  status: OrderStatus;
  order_status: string;
  payment_status: string;
  payment_method?: string | null;
  kitchen_status: string | undefined;
  counter_status: string | undefined;
  pickup_code: string | null;
  pickup_token: string | undefined;
  qr_pickup_code: string | null;
  qr_code: string | null;
  qr_code_data: string | null;
  locker_number: string | null;
  notes: string | null;
  created_at: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  estimated_ready_at?: string | null;
  completed_at: string | null;
  paid_at?: string | null;
  updated_at: string;
  token_number?: string;
  pickup_pin?: string;
  kitchen_queue_status?: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  counter?: string;
  institution_code?: string | null;
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

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type DietPreference = 'all' | 'veg' | 'non-veg';

export interface SavedDeliverySpot {
  id: string;
  user_id: string;
  label: string;
  address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodFilters {
  search?: string;
  veg?: boolean;
  nonVeg?: boolean;
  minPrice?: number;
  maxPrice?: number;
  maxPrepTime?: number;
  category?: string;
  counter?: string;
  sortBy?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'prep_time';
}

export interface CheckoutData {
  institutionId: string;
  institutionCode: string;
  counter: string;
  pickupTime: string;
  estimatedTime: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode: string;
  grandTotal: number;
  paymentMethod: 'razorpay' | 'wallet' | 'cash';
  notes: string;
}