import fs from 'fs';
import path from 'path';

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // General gradients to solid Apple colors
  content = content.replace(/bg-gradient-to-[a-z]+ from-[a-z]+-\d+ (via-[a-z]+-\d+ )?to-[a-z]+-\d+/g, 'bg-[#1D1D1F]');
  content = content.replace(/text-transparent bg-clip-text bg-gradient-to-[a-z]+ from-[a-z]+-\d+ (via-[a-z]+-\d+ )?to-[a-z]+-\d+/g, 'text-[#1D1D1F]');
  
  // Specific gradient replacements
  content = content.replace(/from-blue-600 to-cyan-500/g, 'bg-[#0071E3]');
  content = content.replace(/from-blue-500 via-indigo-500 to-purple-500/g, 'bg-[#1D1D1F]');
  content = content.replace(/shadow-blue-500\/30/g, 'shadow-md');
  
  // Slate colors to Apple colors
  content = content.replace(/text-slate-900/g, 'text-[#1D1D1F]');
  content = content.replace(/text-slate-800/g, 'text-[#1D1D1F]');
  content = content.replace(/text-slate-700/g, 'text-[#1D1D1F]');
  content = content.replace(/text-slate-600/g, 'text-[#6E6E73]');
  content = content.replace(/text-slate-500/g, 'text-[#86868B]');
  content = content.replace(/text-slate-400/g, 'text-[#86868B]');
  
  // Emerald / Teal accents to Apple Blue or Black
  content = content.replace(/text-emerald-500/g, 'text-[#0071E3]');
  content = content.replace(/bg-emerald-500/g, 'bg-[#30D158]'); // Status green
  content = content.replace(/bg-emerald-100/g, 'bg-[#E5F7EB]');
  content = content.replace(/text-emerald-600/g, 'text-[#30D158]');
  
  // Apple radius
  content = content.replace(/rounded-3xl/g, 'rounded-[24px]');
  content = content.replace(/rounded-2xl/g, 'rounded-[16px]');
  
  // Glass cards
  content = content.replace(/bg-white border border-slate-100 shadow-sm/g, 'glass-card');
  content = content.replace(/bg-white border border-gray-100 shadow-sm/g, 'glass-card');
  content = content.replace(/bg-gray-50/g, 'bg-[#F5F5F7]');
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/StudentPortalModal.tsx',
  'src/components/StudentDashboard/PremiumHeader.tsx',
  'src/components/StudentDashboard/PremiumBottomNav.tsx',
  'src/components/StudentDashboard/ExploreTab.tsx',
  'src/components/StudentDashboard/HistoryTab.tsx',
  'src/components/StudentDashboard/ProfileTab.tsx',
  'src/components/StudentDashboard/FoodCard.tsx',
  'src/components/StudentDashboard/ActiveLiveOrder.tsx',
  'src/components/StudentDashboard/OrderCompletionScreen.tsx'
];

files.forEach(updateFile);
console.log('Apple styles applied via script');
