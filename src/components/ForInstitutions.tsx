import React, { useState } from 'react';
import {
  Building2,
  LayoutDashboard,
  Users,
  Store,
  UtensilsCrossed,
  Receipt,
  QrCode,
  BarChart3,
  LineChart,
  FileSpreadsheet,
  Megaphone,
  UserCheck,
  Lock,
  BellRing,
  Globe2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface ForInstitutionsProps {
  onOpenBookDemo: () => void;
  onOpenInstitutionRegister: () => void;
}

export const ForInstitutions: React.FC<ForInstitutionsProps> = ({
  onOpenBookDemo,
  onOpenInstitutionRegister,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'management' | 'operations' | 'analytics' | 'ecosystem'>('all');

  const campusFeatures = [
    {
      id: 'feat-campus-mgmt',
      category: 'management',
      title: 'Campus Management',
      icon: Building2,
      badge: 'Core Infrastructure',
      description: 'Centralized configuration for multiple campuses, blocks, hostels, and dining halls under one institutional umbrella.',
      previewType: 'campus_blocks',
      highlights: ['Multi-campus hierarchy support', 'Building & food court mapping', 'Operational hours & holiday schedules'],
    },
    {
      id: 'feat-inst-dash',
      category: 'management',
      title: 'Institution Dashboard',
      icon: LayoutDashboard,
      badge: 'Executive Command',
      description: 'Real-time overview of daily revenue, total orders processed, active vendor counts, student satisfaction scores, and peak rush heatmaps.',
      previewType: 'dashboard_overview',
      highlights: ['Live revenue & transaction ticker', 'Peak hour bottleneck indicators', 'Single-click executive export'],
    },
    {
      id: 'feat-student-mgmt',
      category: 'management',
      title: 'Student Management',
      icon: Users,
      badge: 'ID & Meal Plans',
      description: 'Seamless integration with university ERP systems, Student ID cards, meal plan credits, and dietary profile preferences.',
      previewType: 'student_profiles',
      highlights: ['Campus ID barcode/NFC sync', 'Meal credit auto-replenishment', 'Dietary & allergen safety logs'],
    },
    {
      id: 'feat-vendor-mgmt',
      category: 'operations',
      title: 'Vendor Management',
      icon: Store,
      badge: 'Merchant Portal',
      description: 'Onboard and manage private canteens, food trucks, franchises, and university-operated cafeterias with commission & menu controls.',
      previewType: 'vendor_grid',
      highlights: ['Flexible commission structure', 'Menu item approval workflow', 'Vendor payout reconciliation'],
    },
    {
      id: 'feat-kitchen-mgmt',
      category: 'operations',
      title: 'Kitchen Management',
      icon: UtensilsCrossed,
      badge: 'Smart KDS',
      description: 'Digital Kitchen Display Systems (KDS) sorting incoming prep tickets by prep duration, LX walking ETAs, and dietary flags.',
      previewType: 'kds_screen',
      highlights: ['Visual prep timer alerts', 'Instant stock outage toggles', 'Multi-station ticket routing'],
    },
    {
      id: 'feat-order-mgmt',
      category: 'operations',
      title: 'Order Management',
      icon: Receipt,
      badge: 'Express Pipeline',
      description: 'Unified order tracking pipeline connecting mobile pre-orders, kiosk walk-ups, and group carts into clean fulfillment streams.',
      previewType: 'order_pipeline',
      highlights: ['Real-time status updates', 'Batch kitchen preparation', 'Cancellation & refund controls'],
    },
    {
      id: 'feat-qr-pickup',
      category: 'operations',
      title: 'QR Pickup System',
      icon: QrCode,
      badge: 'Contactless Express',
      description: 'Zero-line pickup stations and smart locker pods unlocked instantly with student QR codes or NFC ID card taps.',
      previewType: 'qr_scanner',
      highlights: ['1-second QR verification', 'Heated & cooled locker pods', 'Automated SMS/push notifications'],
    },
    {
      id: 'feat-campus-analytics',
      category: 'analytics',
      title: 'Campus Analytics',
      icon: BarChart3,
      badge: 'Deep Intelligence',
      description: 'Macro insights into campus dining trends, peak sales hours, food preference shifts, and vendor performance benchmarks.',
      previewType: 'analytics_chart',
      highlights: ['Sales volume distribution', 'Vendor speed leaderboard', 'Student retention tracking'],
    },
    {
      id: 'feat-dept-analytics',
      category: 'analytics',
      title: 'Department Analytics',
      icon: LineChart,
      badge: 'Granular Breakdown',
      description: 'Break down dining usage by academic department, student year, residential hostel blocks, and faculty dining allowances.',
      previewType: 'department_bars',
      highlights: ['Departmental spend reports', 'Faculty meal quota tracking', 'Hostel vs day-scholar analysis'],
    },
    {
      id: 'feat-reports',
      category: 'analytics',
      title: 'Reports & Auditing',
      icon: FileSpreadsheet,
      badge: 'Compliance Ready',
      description: 'Automated financial statements, tax invoices, food safety audit logs, and FERPA/SOC2 compliant data exports.',
      previewType: 'report_table',
      highlights: ['Automated daily/monthly CSVs', 'Audit-ready financial logs', 'GST & tax compliance reports'],
    },
    {
      id: 'feat-announcements',
      category: 'management',
      title: 'Announcements & Broadcasts',
      icon: Megaphone,
      badge: 'Campus Reach',
      description: 'Send targeted push alerts and banner announcements for food court specials, emergency closures, or health & safety updates.',
      previewType: 'announcement_banner',
      highlights: ['Targeted hostel/block push', 'Scheduled promo banners', 'Emergency food court alerts'],
    },
    {
      id: 'feat-staff-mgmt',
      category: 'management',
      title: 'Staff Management',
      icon: UserCheck,
      badge: 'Workforce Hub',
      description: 'Manage dining hall personnel, kitchen shift rosters, counter staff logins, and performance activity metrics.',
      previewType: 'staff_roster',
      highlights: ['Shift scheduling & attendance', 'Individual staff logs', 'Counter speed benchmarking'],
    },
    {
      id: 'feat-role-access',
      category: 'management',
      title: 'Role Based Access Control',
      icon: Lock,
      badge: 'Enterprise Security',
      description: 'Granular permissions for University Admins, Campus Directors, Finance Managers, Canteen Owners, and Counter Staff.',
      previewType: 'role_matrix',
      highlights: ['Custom permission levels', 'SSO & OAuth2 integration', 'Security audit trail'],
    },
    {
      id: 'feat-notifications',
      category: 'operations',
      title: 'Real-time Notifications',
      icon: BellRing,
      badge: 'Instant Sync',
      description: 'Omnichannel alert system via Mobile Push, WhatsApp, SMS, and Canteen Audio chimes when orders are ready for pickup.',
      previewType: 'notification_feed',
      highlights: ['Multi-channel messaging', 'Audio queue calling', 'Automated pickup reminders'],
    },
    {
      id: 'feat-digital-ecosystem',
      category: 'ecosystem',
      title: 'Digital Campus Food Ecosystem',
      icon: Globe2,
      badge: 'Connected Campus',
      description: 'Unify all food courts, stationary stores, library cafes, and pop-up food stalls into a single unified digital currency & ordering app.',
      previewType: 'ecosystem_map',
      highlights: ['Single campus wallet', 'Unified loyalty rewards', 'Cross-vendor combo meals'],
    },
    {
      id: 'feat-future-ai',
      category: 'ecosystem',
      title: 'Future AI Features (LX AI)',
      icon: Sparkles,
      badge: 'Google Gemini Powered',
      description: 'Predictive exam period meal prep forecasting, LX AI automated inventory reordering, and student nutrition optimization.',
      previewType: 'ai_insights',
      highlights: ['Exam schedule rush prediction', 'AI inventory auto-restock', 'Dietary health index tracking'],
    },
  ];

  const filteredFeatures = campusFeatures.filter(
    (f) => activeCategory === 'all' || f.category === activeCategory
  );

  return (
    <section id="institutions" className="py-24 bg-slate-950 relative border-t border-slate-900">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Top Section Header & Large CTA */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-xs text-indigo-300 font-mono">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Complete Enterprise Campus Food OS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Everything Your University Receives <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              After Joining Foodexa
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Digitize campus food courts, eliminate cafeteria queues, streamline vendor operations, and provide students with a modern AI-powered dining experience.
          </p>

        </div>

        {/* Category Filters - Feature Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-800/80 pb-4">
          {[
            { id: 'all', label: 'All Features' },
            { id: 'management', label: 'Campus & Admin' },
            { id: 'operations', label: 'KDS & QR Operations' },
            { id: 'analytics', label: 'Analytics & Audits' },
            { id: 'ecosystem', label: 'Digital Ecosystem & AI' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 16 Premium Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/50 flex items-center justify-center text-emerald-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                      {feat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  {/* Feature Illustration Preview Component */}
                  <div className="pt-2">
                    <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800/80 space-y-2 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800/60 pb-1">
                        <span>LIVE PREVIEW</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>

                      {feat.previewType === 'campus_blocks' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Main Block Canteen</span>
                            <span className="text-emerald-400">4 Vendors</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Kengeri Hostel Hub</span>
                            <span className="text-emerald-400">2 Locker Pods</span>
                          </div>
                        </div>
                      )}

                      {feat.previewType === 'dashboard_overview' && (
                        <div className="space-y-1">
                          <div className="text-slate-200 font-bold text-xs">$14,820 Today's Volume</div>
                          <div className="text-[9px] text-emerald-400">+34% vs last week peak lunch</div>
                        </div>
                      )}

                      {feat.previewType === 'student_profiles' && (
                        <div className="space-y-1">
                          <div className="text-slate-200 font-bold">ID: 2130948 (CS Dept)</div>
                          <div className="text-[9px] text-slate-400">Meal Plan Balance: $140.50</div>
                        </div>
                      )}

                      {feat.previewType === 'vendor_grid' && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Main Food Court</span>
                            <span className="text-teal-300">8 Outlets Active</span>
                          </div>
                        </div>
                      )}

                      {feat.previewType === 'kds_screen' && (
                        <div className="space-y-1">
                          <div className="text-emerald-300 font-bold">KDS Ticket #402</div>
                          <div className="text-[9px] text-slate-400">2x Veg Bowls • ETA 2.5 min</div>
                        </div>
                      )}

                      {feat.previewType === 'order_pipeline' && (
                        <div className="space-y-1">
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-400 h-full w-3/4 rounded-full" />
                          </div>
                          <div className="text-[9px] text-right text-emerald-400">Prep 75%</div>
                        </div>
                      )}

                      {feat.previewType === 'qr_scanner' && (
                        <div className="space-y-1 text-center py-1">
                          <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 text-[9px]">
                            [QR TAP UNLOCKED]
                          </span>
                        </div>
                      )}

                      {feat.previewType === 'analytics_chart' && (
                        <div className="space-y-1">
                          <div className="text-slate-300 font-bold">Peak Rush: 12:45 PM - 1:30 PM</div>
                          <div className="text-[9px] text-slate-400">Avg prep time: 3.2 mins</div>
                        </div>
                      )}

                      {feat.previewType === 'department_bars' && (
                        <div className="space-y-1">
                          <div>School of Engineering: 42%</div>
                          <div>School of Business: 35%</div>
                        </div>
                      )}

                      {feat.previewType === 'report_table' && (
                        <div className="space-y-1">
                          <div className="text-slate-300">GST / Tax Invoice Exported</div>
                          <div className="text-[9px] text-emerald-400">SOC2 & FERPA Certified</div>
                        </div>
                      )}

                      {feat.previewType === 'announcement_banner' && (
                        <div className="space-y-1">
                          <div className="text-indigo-300 font-bold">📢 Lunch Special Live</div>
                          <div className="text-[9px] text-slate-400">Pushed to 4,200 students</div>
                        </div>
                      )}

                      {feat.previewType === 'staff_roster' && (
                        <div className="space-y-1">
                          <div>Staff Shift: 12 Active Counter Reps</div>
                        </div>
                      )}

                      {feat.previewType === 'role_matrix' && (
                        <div className="space-y-1">
                          <div className="text-slate-300">Admin / Manager / Vendor Roles</div>
                        </div>
                      )}

                      {feat.previewType === 'notification_feed' && (
                        <div className="space-y-1">
                          <div className="text-emerald-400">🔔 Push + WhatsApp Sync</div>
                        </div>
                      )}

                      {feat.previewType === 'ecosystem_map' && (
                        <div className="space-y-1">
                          <div className="text-teal-300 font-bold">Unified Campus Wallet</div>
                        </div>
                      )}

                      {feat.previewType === 'ai_insights' && (
                        <div className="space-y-1">
                          <div className="text-indigo-300 font-bold">✨ LX AI Exam Rush Model</div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Bullet Highlights */}
                  <ul className="space-y-1.5 pt-1">
                    {feat.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Banner Callout */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 text-center sm:text-left sm:flex items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <h4 className="text-xl font-bold text-white">Ready to register your campus institution?</h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Foodexa provides full white-glove onboarding, hardware setup for smart lockers, staff training, and ongoing technical support for Christ University and partner campuses.
            </p>
          </div>
          <button
            onClick={onOpenInstitutionRegister}
            className="mt-4 sm:mt-0 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg"
          >
            <Building2 className="w-4 h-4 text-slate-950" />
            <span>Register Your Institution</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

      </div>
    </section>
  );
};
