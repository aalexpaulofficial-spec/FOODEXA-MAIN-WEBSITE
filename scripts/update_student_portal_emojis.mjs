import fs from 'fs';

let content = fs.readFileSync('src/components/StudentPortalModal.tsx', 'utf-8');

// Replace getCategoryEmoji body
content = content.replace(
  /const getCategoryEmoji = \(cat: string\): string => {[\s\S]*?return '🍽️';\n};/,
  "const getCategoryEmoji = (cat: string): string => { return ''; };"
);

// Replace getCategoryGradient body
content = content.replace(
  /const getCategoryGradient = \(idx: number\) => {[\s\S]*?return gradients\[idx % gradients\.length\];\n};/,
  `const getCategoryGradient = (idx: number) => {
  const styles = [
    'bg-[#F5F5F7] border-[#E8E8ED] text-[#1D1D1F]',
    'bg-[#FBFBFD] border-[#E8E8ED] text-[#1D1D1F]'
  ];
  return styles[idx % styles.length];
};`
);

// Replace roleColor body
content = content.replace(
  /const roleColor = \(role: UserRole \| null \| undefined\) => {[\s\S]*?return 'text-gray-600 border-gray-300 bg-gray-50';\n};/,
  `const roleColor = (role: UserRole | null | undefined) => {
  if (role === 'student') return 'text-[#1D1D1F] border-[#1D1D1F]/10 bg-[#F5F5F7]';
  if (role === 'faculty') return 'text-[#0071E3] border-[#0071E3]/20 bg-[#F5F5F7]';
  if (role === 'guest') return 'text-[#86868B] border-[#86868B]/20 bg-[#F5F5F7]';
  return 'text-[#1D1D1F] border-[#E8E8ED] bg-[#F5F5F7]';
};`
);

// Replace roleGradient body
content = content.replace(
  /const roleGradient = \(role: UserRole \| null \| undefined\) => {[\s\S]*?return 'from-slate-500 to-slate-600';\n};/,
  `const roleGradient = (role: UserRole | null | undefined) => {
  return 'bg-[#F5F5F7]';
};`
);

fs.writeFileSync('src/components/StudentPortalModal.tsx', content);
