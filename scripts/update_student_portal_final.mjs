import fs from 'fs';

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // Bottom Nav specific
  content = content.replace(/bg-slate-900/g, 'bg-[#1D1D1F]');
  content = content.replace(/bg-slate-800/g, 'bg-[#1D1D1F]');
  content = content.replace(/border-slate-700\/80/g, 'border-transparent');
  content = content.replace(/text-cyan-300/g, 'text-[#0071E3]');
  content = content.replace(/text-blue-600/g, 'text-[#0071E3]');
  content = content.replace(/bg-blue-500\/10/g, 'bg-[#0071E3]/10');
  content = content.replace(/border-blue-500\/20/g, 'border-transparent');
  content = content.replace(/bg-red-500/g, 'bg-[#FF3B30]');
  content = content.replace(/bg-blue-600/g, 'bg-[#0071E3]');
  
  // Headers and general
  content = content.replace(/shadow-xl/g, 'shadow-md');
  content = content.replace(/shadow-2xl/g, 'shadow-lg');
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/StudentDashboard/PremiumBottomNav.tsx',
  'src/components/StudentDashboard/PremiumHeader.tsx',
  'src/components/StudentDashboard/ExploreTab.tsx',
  'src/components/StudentDashboard/ActiveLiveOrder.tsx',
  'src/components/StudentPortalModal.tsx'
];

files.forEach(updateFile);
console.log('Apple aesthetic final touches applied.');
