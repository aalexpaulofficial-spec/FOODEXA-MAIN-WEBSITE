import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src', 'components', 'AuthModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add 'quick' to mode state
content = content.replace(
  "const [mode, setMode] = useState<'login' | 'create'>(initialMode);",
  "const [mode, setMode] = useState<'login' | 'create' | 'quick'>(initialMode);"
);

// Add state for quick code
content = content.replace(
  "const [loginEmail, setLoginEmail] = useState('');",
  "const [quickCode, setQuickCode] = useState('');\n  const [isQuickLoading, setIsQuickLoading] = useState(false);\n  const [quickError, setQuickError] = useState<string | null>(null);\n  const [loginEmail, setLoginEmail] = useState('');"
);

// Add handleQuickAccess method before handleLoginInstitutionVerify
const quickAccessMethod = `
  const handleQuickAccess = async () => {
    setQuickError(null);
    if (!quickCode.trim()) {
      setQuickError('Please enter an institution code');
      return;
    }
    setIsQuickLoading(true);
    const { error, profile, institution } = await anonymousSignIn(quickCode.trim(), selectedAccountRole);
    setIsQuickLoading(false);
    
    if (error || !profile) {
      setQuickError(error?.message || 'Invalid code');
    } else {
      setStep('success');
      if (onLoginSuccess) {
        onLoginSuccess({ profile, institution });
      }
    }
  };

  const handleLoginInstitutionVerify = async () => {`;
content = content.replace("const handleLoginInstitutionVerify = async () => {", quickAccessMethod);


// Add the "Quick Access" mode in the JSX
// We'll replace the top tabs:
const tabsJSX = `{/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl relative z-10 mb-6">`;

const newTabsJSX = `{/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-2xl relative z-10 mb-6 flex-wrap">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'create' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'quick' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Quick Access
              </button>
            </div>
            
            {mode === 'quick' && (
              <div className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-xl font-bold text-black">Fast Dashboard Access</h3>
                  <p className="text-xs text-gray-500">Enter your institution code to instantly view menus without an account. (Order history will not be saved).</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Institution Code</label>
                  <input
                    type="text"
                    required
                    value={quickCode}
                    onChange={(e) => setQuickCode(e.target.value)}
                    placeholder="e.g. YAWEHH264881"
                    className="w-full bg-white border border-gray-300 focus:border-black rounded-xl px-3 py-2 text-xs text-black font-mono font-bold focus:outline-none"
                  />
                  {quickError && <p className="text-[10px] text-red-500 mt-1">{quickError}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleQuickAccess}
                  disabled={!quickCode.trim() || isQuickLoading}
                  className="w-full py-3 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isQuickLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enter Dashboard</span>}
                  {!isQuickLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            )}
            
            {mode !== 'quick' && (
              <div className="space-y-4">`; // We must close this div after the form

// Find the form block wrapper and inject our tabs
content = content.replace(tabsJSX, newTabsJSX);

// Now we need to close the {mode !== 'quick' && (<div> wrapper before the </form> or at the end of the form block.
// The form block ends before:
// {/* INSTITUTION VERIFICATION STEP (for students/faculty after login/create) */}
const stepFormEnd = `{/* INSTITUTION VERIFICATION STEP (for students/faculty after login/create) */}`;
content = content.replace(stepFormEnd, `              </div>\n            )}\n            ${stepFormEnd}`);

// Also fix the original tabs that we replaced, we need to remove them if we didn't exactly match the whole original tabs block.
// The original was:
/*
            <div className="flex bg-gray-100 p-1 rounded-2xl relative z-10 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'create' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Create Account
              </button>
            </div>
*/

// Let's just do a string replace of the original tabs
content = content.replace(
  `<div className="flex bg-gray-100 p-1 rounded-2xl relative z-10 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={\`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer \${mode === 'create' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}\`}
              >
                Create Account
              </button>
            </div>`,
  ""
);

fs.writeFileSync(file, content);
console.log('Successfully updated AuthModal.tsx with Quick Access.');
