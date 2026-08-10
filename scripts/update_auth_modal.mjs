import fs from 'fs';

let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf-8');

// Modal container
content = content.replace(
  'bg-white/90 backdrop-blur-md',
  'bg-black/40 backdrop-blur-xl'
);
content = content.replace(
  'bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl',
  'bg-white border border-black/5 rounded-[24px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
);

// Close & Back buttons
content = content.replace(
  /bg-white border border-gray-200 text-gray-500 hover:text-black/g,
  'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED] hover:text-[#1D1D1F] border-transparent'
);

// Inputs
content = content.replace(
  /bg-white border border-gray-200 focus:border-black rounded-xl px-3\.5 py-2\.5 text-xs text-black placeholder-slate-500 focus:outline-none/g,
  'apple-input w-full'
);
content = content.replace(
  /bg-white border border-gray-200 focus:border-black rounded-xl px-3 py-2 text-xs text-black placeholder-slate-500 focus:outline-none/g,
  'apple-input w-full'
);
content = content.replace(
  /bg-white border border-black\/50 focus:border-black rounded-xl px-3\.5 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8/g,
  'apple-input font-mono font-bold w-full pr-8'
);
content = content.replace(
  /bg-white border border-black\/50 focus:border-black rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none pr-8/g,
  'apple-input font-mono font-bold w-full pr-8'
);
content = content.replace(
  /bg-white border border-black\/60 focus:border-emerald-400 rounded-2xl py-3 text-center text-xl font-mono tracking-\[0\.5em\] text-emerald-300 font-bold focus:outline-none shadow-inner/g,
  'apple-input py-3 text-center text-xl font-mono tracking-[0.5em] font-bold w-full'
);

// Primary Buttons
content = content.replace(
  /w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md/g,
  'w-full btn-primary'
);
content = content.replace(
  /w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md/g,
  'w-full btn-primary'
);
content = content.replace(
  /relative w-full overflow-hidden py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-80 disabled:cursor-not-allowed/g,
  'relative w-full overflow-hidden btn-primary mt-2'
);
content = content.replace(
  /w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-extrabold text-xs hover:from-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed/g,
  'w-full btn-primary'
);

// Headers / text
content = content.replace(/text-slate-950/g, 'text-white');
content = content.replace(/text-gray-600/g, 'text-[#86868B]');
content = content.replace(/text-gray-500/g, 'text-[#86868B]');
content = content.replace(/text-emerald-300/g, 'text-black');

// Icons backgrounds
content = content.replace(/bg-emerald-950 border border-black\/40/g, 'bg-[#F5F5F7] border-transparent');
content = content.replace(/bg-emerald-950 border border-black\/50/g, 'bg-[#F5F5F7] border-transparent');

// Errors
content = content.replace(/bg-red-950\/60 border border-red-500\/40 text-xs text-red-300/g, 'bg-[#FFF0F0] border border-[#FFD6D6] text-xs text-[#FF3B30]');
content = content.replace(/text-red-400/g, 'text-[#FF3B30]');

// Checkboxes
content = content.replace(/bg-white border-gray-200 text-black focus:ring-black/g, 'bg-white border-gray-300 text-[#0071E3] focus:ring-[#0071E3] rounded-sm');

// Progress bar
content = content.replace(/bg-gradient-to-r from-emerald-600 via-lime-300 to-emerald-400/g, 'bg-[#0071E3]');

// Badges
content = content.replace(/bg-white text-black border border-gray-300/g, 'bg-[#F5F5F7] text-[#1D1D1F] border-transparent');

// Typography
content = content.replace(/font-extrabold/g, 'font-bold');


fs.writeFileSync('src/components/AuthModal.tsx', content);
