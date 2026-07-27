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

export interface CampusVendor {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  avgPrepTime: string;
  currentRush: 'Low' | 'Medium' | 'High';
  popularItem: string;
  image: string;
  tags: string[];
}

export interface PlatformFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badge: string;
  highlights: string[];
  graphicType: 'app_mock' | 'locker' | 'group_cart' | 'kds' | 'lx_ai';
}

export interface PricingPlan {
  id: string;
  name: string;
  targetUser: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  popular?: boolean;
  features: string[];
  ctaLabel: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'students' | 'vendors' | 'universities';
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
}
