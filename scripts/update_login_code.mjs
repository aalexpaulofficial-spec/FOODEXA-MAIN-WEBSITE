import fs from 'fs';

const paths = [
  'src/components/AuthModal.tsx',
  'foodexa/src/components/AuthModal.tsx'
];

for (const p of paths) {
  let content = fs.readFileSync(p, 'utf8');

  // Find the onLoginSuccess call
  if (!content.includes('if (liveProfile && instData && liveProfile.institution_id !== instData.id)')) {
    content = content.replace(
      /setStep\('success'\);\n\s*if \(onLoginSuccess\) \{/,
      `if (liveProfile && instData && liveProfile.institution_id !== instData.id) {
        console.info('[Auth] User logged in with different institution code, updating profile...');
        await updateProfile({ institution_id: instData.id });
        liveProfile.institution_id = instData.id;
      }

      setStep('success');
      if (onLoginSuccess) {`
    );
  }

  fs.writeFileSync(p, content);
  console.log('Updated ' + p);
}
