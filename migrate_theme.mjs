import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

const replacements = [
  // Backgrounds
  { from: /bg-slate-950\/85/g, to: 'bg-white/90' },
  { from: /bg-slate-950\/90/g, to: 'bg-white/90' },
  { from: /bg-slate-950/g, to: 'bg-white' },
  { from: /bg-slate-900/g, to: 'bg-gray-50' },
  { from: /bg-slate-800/g, to: 'bg-gray-100' },
  
  // Borders
  { from: /border-slate-800\/50/g, to: 'border-gray-200/50' },
  { from: /border-slate-800/g, to: 'border-gray-200' },
  { from: /border-slate-700/g, to: 'border-gray-300' },
  
  // Text
  // We avoid global text-white to text-black because it breaks buttons.
  // We'll replace text-slate-* safely.
  { from: /text-slate-100/g, to: 'text-gray-900' },
  { from: /text-slate-200/g, to: 'text-gray-800' },
  { from: /text-slate-300/g, to: 'text-gray-600' },
  { from: /text-slate-400/g, to: 'text-gray-500' },
  { from: /text-slate-500/g, to: 'text-gray-400' },
  
  // Emerald / Brand colors
  { from: /bg-emerald-500/g, to: 'bg-black' },
  { from: /hover:bg-emerald-600/g, to: 'hover:bg-gray-800' },
  { from: /bg-emerald-400\/10/g, to: 'bg-gray-200/50' },
  { from: /bg-emerald-500\/10/g, to: 'bg-gray-200/50' },
  { from: /bg-emerald-500\/20/g, to: 'bg-gray-200' },
  { from: /text-emerald-400/g, to: 'text-black' },
  { from: /text-emerald-500/g, to: 'text-black' },
  { from: /border-emerald-500\/30/g, to: 'border-gray-300' },
  { from: /border-emerald-500/g, to: 'border-black' },
  { from: /hover:border-emerald-500/g, to: 'hover:border-black' },
  { from: /hover:text-emerald-400/g, to: 'hover:text-black' },
  { from: /hover:text-emerald-300/g, to: 'hover:text-black' },
  { from: /ring-emerald-500/g, to: 'ring-black' },
  
  // Specific UI patterns in modals
  { from: /text-white/g, to: 'text-black' },
  { from: /bg-black text-black/g, to: 'bg-black text-white' }, // Fix button text if we accidentally overwrite it
  { from: /bg-gradient-to-r from-emerald-400 to-teal-400/g, to: 'bg-black' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Custom button fix: before we replace text-white with text-black, 
  // let's protect buttons that have bg-black or similar.
  // Actually, a simpler way is to replace `text-white` with `text-black` everywhere, 
  // but then find `bg-black` and ensure it has `text-white`.
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  // Fix button text contrast
  content = content.replace(/bg-black text-black/g, 'bg-black text-white');
  content = content.replace(/bg-black(.*?)text-black/g, 'bg-black$1text-white');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

// Target specific files
const targetFiles = [
  'AuthModal.tsx',
  'InstitutionRegistrationModal.tsx',
  'StudentPortalModal.tsx',
  'InstitutionDashboardModal.tsx',
  'KitchenDashboardModal.tsx',
  'SuperAdminDashboardModal.tsx',
  'PortalAccessModal.tsx',
];

targetFiles.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    processFile(filePath);
  } else {
    console.warn(`File not found: ${file}`);
  }
});
