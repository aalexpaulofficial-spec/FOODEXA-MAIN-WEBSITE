import fs from 'fs';

const paths = [
  'src/components/AuthModal.tsx',
  'foodexa/src/components/AuthModal.tsx'
];

for (const p of paths) {
  let content = fs.readFileSync(p, 'utf8');

  // Add state
  if (!content.includes('const [loginInstitutionCode')) {
    content = content.replace(
      /const \[loginEmail, setLoginEmail\] = useState\(''\);/,
      "const [loginInstitutionCode, setLoginInstitutionCode] = useState('');\n    const [loginEmail, setLoginEmail] = useState('');"
    );
  }

  // Add validation in handleLoginSubmit
  if (!content.includes('const instCode = loginInstitutionCode.trim();')) {
    content = content.replace(
      /const handleLoginSubmit = async \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*const normalizedLoginEmail = \(loginEmail \|\| ''\)\.trim\(\)\.toLowerCase\(\);/,
      `const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const instCode = loginInstitutionCode.trim();
      if (!instCode) {
        setLoginError('Please enter your Institution Code.');
        return;
      }
      const { data: instData, error: instErr } = await validateInstitutionCode(instCode);
      if (instErr || !instData) {
        setLoginError(instErr || 'Invalid Institution Code');
        return;
      }
      
      const normalizedLoginEmail = (loginEmail || '').trim().toLowerCase();`
    );
  }

  // Update profile if successful? Actually, we don't need to update profile, we just validated the code.
  // But wait, what if their profile has a DIFFERENT institution_id? 
  // For now, let's just add the check to verify the code.
  
  // Add UI field
  if (!content.includes('value={loginInstitutionCode}')) {
    content = content.replace(
      /<form onSubmit=\{handleLoginSubmit\} className="space-y-4">/,
      `<form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#86868B] mb-1 block">Institution Code</label>
                    <input
                      type="text"
                      required
                      value={loginInstitutionCode}
                      onChange={(e) => { setLoginInstitutionCode(e.target.value.toUpperCase()); setLoginError(null); }}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border-0 text-[#1D1D1F] focus:ring-2 focus:ring-[#0066CC] focus:bg-white transition-all placeholder:text-[#86868B]"
                      placeholder="e.g. CHRIST-BGR"
                    />
                  </div>`
    );
  }

  fs.writeFileSync(p, content);
  console.log('Updated ' + p);
}
