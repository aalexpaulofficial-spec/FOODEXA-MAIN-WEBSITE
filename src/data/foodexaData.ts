import { CampusVendor, FaqItem, PlatformFeature, PricingPlan } from '../types';

export const PARTNER_UNIVERSITIES = [
  {
    name: 'CHRIST (Deemed to be University)',
    campus: 'Kengeri Campus',
    location: 'Bengaluru',
    short: 'CHRIST',
    logoText: 'CHRIST',
  },
];

export const HERO_STATS = [
  { value: '45+', label: 'Partner Campuses' },
  { value: '1.4M+', label: 'Orders Processed' },
  { value: '3.2 min', label: 'Avg Express Pickup' },
  { value: '28,000 hrs', label: 'Student Line-time Saved' },
];

export const CAMPUS_VENDORS: CampusVendor[] = [
  {
    id: 'vendor-1',
    name: 'Science Quad Bistro',
    location: 'Science & Tech Building - 1st Floor',
    category: 'Healthy Bowls & Wraps',
    rating: 4.9,
    avgPrepTime: '3-5 min',
    currentRush: 'Low',
    popularItem: 'Avo-Quinoa Power Bowl',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    tags: ['High Protein', 'Gluten-Free', 'Halal Option'],
  },
  {
    id: 'vendor-2',
    name: 'Library Artisan Roast & Cafe',
    location: 'Main Library Plaza',
    category: 'Specialty Coffee & Bakery',
    rating: 4.8,
    avgPrepTime: '2 min',
    currentRush: 'Medium',
    popularItem: 'Iced Oat Vanilla Matcha',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    tags: ['Express Barista', 'Vegan Snacks', 'Study Fuel'],
  },
  {
    id: 'vendor-3',
    name: 'North Union Noodle House',
    location: 'Student Union Food Court',
    category: 'Asian Street Food & Ramen',
    rating: 4.9,
    avgPrepTime: '6-8 min',
    currentRush: 'High',
    popularItem: 'Spicy Sesame Tofu Tan Tan',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    tags: ['Vegan Friendly', 'Custom Spice', 'Student Deal'],
  },
  {
    id: 'vendor-4',
    name: 'Dorm Commons Pizza & Grill',
    location: 'West Campus Resident Hall',
    category: 'Artisanal Pizza & Wings',
    rating: 4.7,
    avgPrepTime: '8 min',
    currentRush: 'Low',
    popularItem: 'Truffle Mushroom Flatbread',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
    tags: ['Group Cart Fav', 'Late Night', 'Split Bill'],
  },
];

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: 'feat-1',
    title: 'LX AI Student Companion',
    subtitle: 'Conversational Dining Intelligence',
    description: 'LX understands campus locations, class schedules, budget limits, and dietary restrictions to deliver instant personalized meal recommendations.',
    iconName: 'Sparkles',
    badge: 'Powered by LX',
    highlights: [
      'Natural language meal discovery (e.g. "high protein under $8")',
      'Allergen & macro safety guardrails',
      'Context-aware prep time estimations between classes',
      'Evolves with student preferences over time'
    ],
    graphicType: 'lx_ai'
  },
  {
    id: 'feat-2',
    title: 'Pre-Ordering & Express Queue Jump',
    subtitle: 'Eliminate 25-Minute Lunch Wait Times',
    description: 'Students order in advance between lectures and skip long cafeteria lines with dedicated express pickup lanes and dynamic batch scheduling.',
    iconName: 'Zap',
    badge: 'Express Pickup',
    highlights: [
      'Smart arrival time estimation based on campus walking distance',
      'Real-time order prep tracking bar with push alerts',
      'Dynamic kitchen load balancing during peak lunch hours',
      'Zero standing line bottleneck'
    ],
    graphicType: 'app_mock'
  },
  {
    id: 'feat-3',
    title: 'Group Carts & Automated Split Bills',
    subtitle: 'Seamless Multi-Student Orders',
    description: 'Dormmates, study groups, and student clubs can pool orders together into a single cart with instant transparent Venmo/Zelle or meal credit splitting.',
    iconName: 'Users',
    badge: 'Dorm & Club Favorites',
    highlights: [
      'Shared real-time cart via 4-digit join codes',
      'Individual item billing without spreadsheet chaos',
      'Single pooled delivery or locker drop-off',
      'Club budget & event order management'
    ],
    graphicType: 'group_cart'
  },
  {
    id: 'feat-4',
    title: 'Smart Heated & Cooled Locker Hubs',
    subtitle: '24/7 Secure Contactless Pickup',
    description: 'Temperature-controlled smart locker pods installed across campus buildings allow safe, contactless pickup anytime with a simple QR tap.',
    iconName: 'ShieldCheck',
    badge: 'Hardware Sync',
    highlights: [
      'DUAL-ZONE climate control (Heated 140°F / Cooled 38°F)',
      'NFC Student ID or QR code unlock in 1 second',
      'Automatic UV-C sanitization cycle after each pick',
      'Zero food waste or misplaced order mixups'
    ],
    graphicType: 'locker'
  },
  {
    id: 'feat-5',
    title: 'Campus Kitchen Display System (KDS)',
    subtitle: 'Enterprise Merchant Operations',
    description: 'High-speed POS integration and digital kitchen touchscreens built specifically for fast-paced university dining halls and food trucks.',
    iconName: 'LayoutGrid',
    badge: 'Vendor Engine',
    highlights: [
      'Predictive prep queue sorting powered by LX',
      'One-tap stock & ingredient shortage toggles',
      'Direct integration with university campus card systems',
      'Automated sales analytics & peak hour heatmaps'
    ],
    graphicType: 'kds'
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'student-free',
    name: 'Student Pass',
    targetUser: 'For All Campus Students',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Full access to LX AI companion, express queue jumping, and group cart order splitting at no cost to students.',
    features: [
      'Unlimited access to LX AI Assistant',
      'Express queue jump pre-ordering',
      'Group cart creation & split billing',
      'Allergen & macro dietary filters',
      'Campus smart locker access',
      'Earn FOODEXA student perks & rewards'
    ],
    ctaLabel: 'Get Started Free'
  },
  {
    id: 'vendor-growth',
    name: 'Vendor Launch',
    targetUser: 'For On-Campus Cafes, Food Trucks & Franchises',
    monthlyPrice: 79,
    annualPrice: 65,
    popular: true,
    description: 'Everything local vendors need to digitize operations, eliminate lines, and increase peak order volume by 35%.',
    features: [
      'FOODEXA Merchant KDS & POS App',
      'LX AI order scheduling & load balancing',
      'Real-time inventory & shortage toggles',
      'Direct campus card & digital wallet payments',
      'Analytics dashboard (sales, peak rush, prep times)',
      'Dedicated hardware setup & 24/7 priority support'
    ],
    ctaLabel: 'Start Vendor Onboarding'
  },
  {
    id: 'university-enterprise',
    name: 'Campus Enterprise',
    targetUser: 'For Universities & Dining Services Management',
    monthlyPrice: 499,
    annualPrice: 399,
    description: 'Custom campus-wide deployment with locker hub integration, dining hall POS sync, and centralized analytics.',
    features: [
      'Full campus-wide white-labeled FOODEXA deployment',
      'Smart Heated/Cooled Locker Hub hardware network',
      'University Student ID & Meal Plan API integration',
      'Custom LX AI dining assistant instance for campus',
      'FERPA & SOC2 compliant enterprise security',
      'Dedicated Campus Success Manager & On-site support'
    ],
    ctaLabel: 'Book University Demo'
  }
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: 'What is LX and how does it power FOODEXA?',
    answer: 'LX is FOODEXA’s official AI companion built specifically for campus dining. Powered by Google Gemini under the hood, LX understands student preferences, diet needs, class schedules, budget limits, and real-time vendor wait times to deliver personalized meal recommendations and smart queue predictions.'
  },
  {
    id: 'faq-2',
    category: 'students',
    question: 'Is FOODEXA free for students to use?',
    answer: 'Yes! FOODEXA is 100% free for students. There are no subscription fees to use LX AI, place express pre-orders, split group cart bills, or pick up from smart lockers.'
  },
  {
    id: 'faq-3',
    category: 'students',
    question: 'How does the Express Queue Jump work?',
    answer: 'Instead of standing in a 20-minute line during rush hours, you place your order via FOODEXA while walking from class or studying in the library. LX calculates your walk time and schedules the kitchen to prepare your food right as you arrive. You walk up to the dedicated FOODEXA Express counter or Smart Locker and grab your food instantly.'
  },
  {
    id: 'faq-4',
    category: 'vendors',
    question: 'Can food trucks and local cafes integrate with FOODEXA?',
    answer: 'Absolutely. FOODEXA provides a lightweight KDS (Kitchen Display System) app that runs on standard tablets. Vendors can set up in less than 30 minutes, receive orders cleanly grouped by prep time, and manage stock toggles in one tap.'
  },
  {
    id: 'faq-5',
    category: 'universities',
    question: 'Does FOODEXA integrate with our existing University Student ID and Meal Plan cards?',
    answer: 'Yes. FOODEXA seamlessly connects with campus card systems (Atrium, Transact, CBORD, TouchNet) allowing students to pay using their meal plan dollars, flex points, or linked credit/debit cards seamlessly.'
  },
  {
    id: 'faq-6',
    category: 'universities',
    question: 'What hardware is needed for Smart Locker Hubs?',
    answer: 'FOODEXA offers modular, temperature-controlled locker units with dual-zone heating (140°F) and cooling (38°F). We handle full white-glove installation, network configuration, and ongoing maintenance.'
  }
];

export const SAMPLE_LX_PROMPTS = [
  'What can I eat under $8 near Science Bldg with 30g+ protein?',
  'I need a vegan iced oat matcha + bagel without nuts',
  'Which campus canteen has the shortest line right now?',
  'Start a group cart for dorm order with 4-way bill split',
];
