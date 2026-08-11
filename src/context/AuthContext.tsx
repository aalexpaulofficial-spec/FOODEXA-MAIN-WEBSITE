import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import type { UserRole, Profile, InstitutionData } from '../types';

export interface DirectSession {
  session_id: string;
  temporarySessionId: string;
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'guest';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isEmailVerified: boolean;
  isPendingOtpVerification: boolean;
  institutionData: InstitutionData | null;
  setInstitutionData: (data: InstitutionData | null) => void;
  validateInstitutionCode: (code: string) => Promise<{ error: string | null; data: InstitutionData | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; session: Session | null; user: User | null; profile: Profile | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string, role: UserRole, metadata?: { institutionCode?: string; institutionId?: string; phone?: string; department?: string; semester?: string; programme?: string; campusBlock?: string; facultyId?: string; }) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null; profile: Profile | null; institution: InstitutionData | null }>;
  joinWithCodeRoleName: (institutionCode: string, role: 'student' | 'faculty' | 'guest', displayName: string) => Promise<{ error: string | null; profile: Profile | null; institution: InstitutionData | null }>;
  joinWithDirectAccess: (institutionCode: string, role: 'student' | 'faculty' | 'guest', displayName: string, email: string) => Promise<{ error: string | null; profile: Profile | null; institution: InstitutionData | null }>;
  signOut: () => Promise<void>;
  clearAllSessionData: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  leaveInstitution: () => Promise<{ error: Error | null }>;
  switchInstitution: (institutionCode: string) => Promise<{ error: string | null }>;
  directSession: DirectSession | null;
  clearDirectSession: () => void;
  isDirectUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (value: unknown): UserRole | null => {
  const allowed: UserRole[] = ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'];
  return allowed.includes(value as UserRole) ? (value as UserRole) : null;
};

const DIRECT_SESSION_KEY = 'foodexa-direct-session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPendingOtpVerification, setIsPendingOtpVerification] = useState(false);
  const [institutionData, setInstitutionData] = useState<InstitutionData | null>(null);
  const [pendingOtpProfile, setPendingOtpProfile] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    institutionId: string | null;
    institutionCode: string | null;
    phone: string | null;
  } | null>(null);
  const pendingOtpProfileRef = React.useRef<typeof pendingOtpProfile>(null);

  // ── Direct user session (institution code + name + role, no Supabase auth) ──
  const [directSession, setDirectSession] = useState<DirectSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(DIRECT_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.temporarySessionId && parsed.institutionId) return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  const isDirectUser = !!directSession && !user;

  const clearDirectSession = useCallback(() => {
    setDirectSession(null);
    sessionStorage.removeItem(DIRECT_SESSION_KEY);
    setInstitutionData(null);
  }, []);

  const loadInstitutionForProfile = useCallback(async (profileData: Profile | null): Promise<InstitutionData | null> => {
    if (!profileData?.institution_id) {
      setInstitutionData(null);
      return null;
    }

    const { data, error } = await supabase
      .from('institutions')
      .select('id, name, campus, city, state, country, institution_code')
      .eq('id', profileData.institution_id)
      .maybeSingle();

    if (error) {
      console.error('[Auth] Institution load error:', error.message);
      setInstitutionData(null);
      return null;
    }
    if (!data) {
      setInstitutionData(null);
      return null;
    }

    const institution = {
      institution_id: data.id,
      institution_name: data.name || '',
      campus: data.campus || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      institution_code: data.institution_code || '',
    };
    setInstitutionData(institution);
    return institution;
  }, []);

    const upsertProfileSafely = useCallback(async (payload: Record<string, any>) => {
        const KNOWN_PROFILE_COLUMNS = ['user_id', 'email', 'full_name', 'phone', 'role', 'institution_id', 'department', 'semester', 'programme', 'campus_block', 'profile_image'];
       const safePayload: Record<string, any> = {};
       for (const key of KNOWN_PROFILE_COLUMNS) {
         if (key in payload) {
           safePayload[key] = payload[key];
         }
       }

       const { error } = await supabase
         .from('profiles')
         .upsert(safePayload, { onConflict: 'user_id' });

       if (error) {
         console.error('[Auth] Profile upsert DB error:', error.message);
         const friendlyMessage = error.message.includes('duplicate key')
           ? 'Your profile already exists. Please try logging in.'
           : error.message.includes('violates row-level security')
             ? 'Unable to create profile (permission denied). Ensure the `profiles` table allows authenticated inserts, then contact support.'
             : error.message;
         return { error: new Error(friendlyMessage) };
       }

       return { error: null as Error | null };
     }, []);

   const PROFILE_COLUMNS = 'id, user_id, institution_id, full_name, email, phone, profile_image, role, created_at, updated_at, campus_block, programme, department, semester';

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
      try {
         const { data, error } = await supabase
           .from('profiles')
           .select(PROFILE_COLUMNS)
           .eq('user_id', userId)
           .maybeSingle();

         if (error) {
           console.error('[Auth] Profile fetch error:', error.message);
         }

        if (data) {
          const fetchedProfile = { ...data } as Profile;
          setProfile(fetchedProfile);
          await loadInstitutionForProfile(fetchedProfile);
          return fetchedProfile;
        }

        setProfile(null);
        setInstitutionData(null);
        return null;
      } catch (err: any) {
        console.error('[Auth] Profile fetch threw an exception:', err?.message || err);
      }

      return null;
    }, [loadInstitutionForProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [fetchProfile, user]);

    const setPendingRegistrationProfile = useCallback((value: typeof pendingOtpProfile) => {
      pendingOtpProfileRef.current = value;
      setPendingOtpProfile(value);
    }, []);

    // ── Session initialization — Supabase handles persistence natively ────────
   useEffect(() => {
     const initAuth = async () => {
       const { data: { session: existingSession } } = await supabase.auth.getSession();
       setSession(existingSession);
       setUser(existingSession?.user ?? null);
       setIsEmailVerified(!!existingSession?.user?.email_confirmed_at);
       if (existingSession?.user) {
         await fetchProfile(existingSession.user.id);
} else if (directSession) {
          // Direct user session: load institution data
          const inst = {
            institution_id: directSession.institutionId,
            institution_name: directSession.institutionName,
            campus: '',
            city: '',
            state: '',
            country: '',
            institution_code: directSession.institutionCode || '',
          };
          setInstitutionData(inst);
          setIsEmailVerified(true);
        }
       setLoading(false);
     };

     initAuth();

     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
       setSession(newSession);
       setUser(newSession?.user ?? null);
       setIsEmailVerified(!!newSession?.user?.email_confirmed_at);
       if (newSession?.user) {
         await fetchProfile(newSession.user.id);
       } else if (!directSession) {
         setProfile(null);
         setInstitutionData(null);
       }
       setLoading(false);
     });

     return () => subscription.unsubscribe();
   }, [fetchProfile, directSession]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        error: new Error(error.message),
        session: data.session,
        user: data.user,
        profile: null,
      };
    }

    const liveProfile = data.user?.id ? await fetchProfile(data.user.id) : null;
    return {
      error: null,
      session: data.session,
      user: data.user,
      profile: liveProfile,
    };
  };

  // FIX: Accept institutionId as a direct parameter to avoid relying on volatile context state
  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    metadata?: {
      institutionCode?: string;
      institutionId?: string; // PRODUCTION FIX: pass institution_id directly
      phone?: string;
      department?: string;
      semester?: string;
      programme?: string;
      campusBlock?: string;
      facultyId?: string;
    }
  ) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Resolve institution_id: prefer direct param, then context state
    const resolvedInstitutionId = metadata?.institutionId || institutionData?.institution_id || null;

    if (!resolvedInstitutionId) {
      console.warn('[Auth] signUpWithPassword: institution_id is NULL. Institution code may not have been validated.');
    }

    // Block any auto-redirect while OTP is pending
    setIsPendingOtpVerification(true);

     setPendingRegistrationProfile({
       email: trimmedEmail,
       fullName: fullName.trim(),
       role,
       institutionId: resolvedInstitutionId,
       institutionCode: metadata?.institutionCode?.trim() || null,
       phone: metadata?.phone?.trim() || null,
     });

     console.info('[Auth] Signup request → signUp() | email:', trimmedEmail, '| role:', role, '| institution_id:', resolvedInstitutionId || 'NULL (NOT VALIDATED)');

     const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          institution_id: resolvedInstitutionId,
          institution_code: metadata?.institutionCode?.trim() || null,
          phone: metadata?.phone?.trim() || null,
          department: metadata?.department?.trim() || null,
          semester: metadata?.semester?.trim() || null,
          programme: metadata?.programme?.trim() || null,
          campus_block: metadata?.campusBlock?.trim() || null,
          faculty_id: metadata?.facultyId?.trim() || null,
        },
      },
    });

    if (error) {
      console.error('[Auth] Signup signUp() error:', error.name, '-', error.message);
      setIsPendingOtpVerification(false);
      return { error: new Error(error.message) };
    }

    const authUser = data?.user;
    console.info('[Auth] Signup signUp() succeeded | authUser:', authUser?.id || '<none>', '| session:', !!data?.session, '| email_confirmed_at:', authUser?.email_confirmed_at || 'NULL');

    // PRODUCTION FIX: OTP verification is mandatory regardless of whether
    // `mailer_autoconfirm` is on or off. Supabase sends the OTP via the
    // "Magic Link" email template whenever signInWithOtp is invoked. Sending
    // the OTP explicitly (instead of relying solely on the confirm-signup email)
    // keeps the flow deterministic in BOTH autoconfirm modes.
    if (data?.session) {
      // autoconfirm ON → the user is instantly email-confirmed and logged in.
      // Sign out so they cannot reach the dashboard before completing OTP.
      console.info('[Auth] Signup returned an immediate session (autoconfirm ON). Signing out to enforce the OTP gate.');
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsEmailVerified(false);
    }

    // Always send the OTP email explicitly so the code path is identical
    // whether or not email confirmation is enabled in the dashboard.
    if (!authUser) {
      console.error('[Auth] Signup signUp() returned no user object despite success.');
      setIsPendingOtpVerification(false);
      return { error: new Error('Registration succeeded but no user was returned. Please try again.') };
    }

    console.info('[Auth] Sending OTP email via signInWithOtp for:', trimmedEmail, '| authUser:', authUser.id);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        // The account already exists (just created via signUp), so we only
        // need to deliver the verification OTP to an existing user.
        shouldCreateUser: false,
        data: {
          full_name: fullName.trim(),
          role,
          institution_id: resolvedInstitutionId,
          institution_code: metadata?.institutionCode?.trim() || null,
        },
      },
    });

    if (otpError) {
      // Common causes: rate limit (already-pending OTP/60-per-hour cap), or a
      // misconfigured / missing "Magic Link" email template in the dashboard.
      console.error('[Auth] OTP email request (signInWithOtp) failed:', otpError.name, '-', otpError.message);
      setIsPendingOtpVerification(false);
      return { error: new Error(otpError.message) };
    }

    console.info('[Auth] OTP email request accepted by Supabase. User must enter the code from the email.');
    return { error: null };
  };

  const validateInstitutionCode = async (code: string) => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      return { error: 'Institution Code is required.', data: null };
    }
    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_institution_by_code', { p_institution_code: trimmed.trim() });

      if (rpcError) {
        console.error('[Auth] validateInstitutionCode RPC error:', rpcError.message);
        return { error: 'Unable to verify Institution Code. Please try again.', data: null };
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { error: 'Invalid institution code. Please check your code and try again.', data: null };
      }

      const inst = Array.isArray(data) ? data[0] : data;

      if (inst.status && inst.status !== 'approved' && inst.status !== 'active') {
        return { error: 'This institution is currently unavailable. Please contact your institution administrator.', data: null };
      }

      return {
        error: null,
        data: {
          institution_id: inst.id,
          institution_name: inst.name || inst.institution_name || '',
          campus: inst.campus || '',
          city: inst.city || '',
          state: inst.state || '',
          country: inst.country || '',
          institution_code: inst.institution_code || trimmed.toUpperCase(),
        } as InstitutionData,
      };
    } catch (err: any) {
      console.error('[Auth] Institution code validation exception:', err);
      return { error: 'Unable to verify Institution Code. Please try again.', data: null };
    }
  };


  // FIX: Strengthened institution_id resolution with last-resort API lookup
   const verifyOtp = async (email: string, token: string) => {
     const normalizedEmail = (email || '').trim().toLowerCase();
     const safeToken = (token || '').trim();
     console.info('[Auth] OTP verification request | email:', normalizedEmail, '| token length:', safeToken.length, '| authUser:', user?.id || '<none>');

     if (!normalizedEmail) {
       return { error: new Error('An email address is required to verify the OTP.'), profile: null, institution: null };
     }
     if (!safeToken) {
       return { error: new Error('Please enter the OTP code sent to your email.'), profile: null, institution: null };
     }

     let authData = null as Awaited<ReturnType<typeof supabase.auth.verifyOtp>>['data'] | null;

      // PRIMARY: the OTP is issued by signInWithOtp (Magic Link flow) → type 'email'.
     // FALLBACK: if "Confirm email" is enabled in the dashboard, the signup
     // confirmation email uses an OTP verified with type 'signup'.
     console.info('[Auth] Attempting OTP verification with type "email" (Magic Link/OTP flow)...');
     const emailAttempt = await supabase.auth.verifyOtp({
       email: normalizedEmail,
       token: safeToken,
       type: 'email',
     });

     if (emailAttempt.error) {
       console.warn('[Auth] verifyOtp type=email failed:', emailAttempt.error.name, '-', emailAttempt.error.message);
       console.info('[Auth] Fallback: attempting OTP verification with type "signup" (email confirmation flow)...');
       const signupAttempt = await supabase.auth.verifyOtp({
         email: normalizedEmail,
         token: safeToken,
         type: 'signup',
       });

        if (signupAttempt.error) {
          console.error('[Auth] OTP verification FAILED — both types rejected. | email:', normalizedEmail, '| type=email error:', emailAttempt.error.message, '| type=signup error:', signupAttempt.error.message);
         return {
           error: new Error(signupAttempt.error.message || emailAttempt.error.message),
           profile: null,
           institution: null,
         };
       }

       authData = signupAttempt.data;
       console.info('[Auth] OTP verification SUCCEEDED via type "signup" | user:', authData?.user?.id || '<none>');
     } else {
       authData = emailAttempt.data;
       console.info('[Auth] OTP verification SUCCEEDED via type "email" | user:', authData?.user?.id || '<none>');
     }

     // OTP verified — clear the pending flag and mark email as confirmed
     setIsPendingOtpVerification(false);
     setIsEmailVerified(true);

     // verifyOtp already establishes a session; fetch the freshly authenticated user.
     const { data: currentUserData, error: userError } = await supabase.auth.getUser();
     const authUser = currentUserData?.user;
     const userId = authUser?.id;

     if (userError || !userId) {
       console.error('[Auth] Unable to get user after OTP verification:', userError?.name, '-', userError?.message);
       return {
         error: new Error(userError?.message || 'OTP verified but unable to load your account. Please try signing in.'),
         profile: null,
         institution: null,
       };
     }

     console.info('[Auth] Authenticated user after OTP verification | userId:', userId, '| email_confirmed_at:', authUser.email_confirmed_at || 'NULL', '| email:', authUser.email);

     const pendingProfile = pendingOtpProfileRef.current || pendingOtpProfile;
     const userData = authUser.user_metadata || {};
     const role = normalizeRole(pendingProfile?.role || userData.role);

     if (!role) {
       console.error('[Auth] No valid role found for new profile | userId:', userId, '| pending role:', pendingProfile?.role, '| metadata role:', userData.role);
       return {
         error: new Error('Unable to complete registration. The account has no valid role. Please restart the registration process.'),
         profile: null,
         institution: null,
       };
     }

     const fullName = String(pendingProfile?.fullName || userData.full_name || '').trim();
     const phone = pendingProfile?.phone || userData.phone || null;

     if (!fullName) {
       console.error('[Auth] No full name available for verified account | userId:', userId);
       return {
         error: new Error('Please enter your full name before opening the dashboard.'),
         profile: null,
         institution: null,
       };
     }

     // PRODUCTION FIX: Multi-source institution_id resolution with last-resort API lookup
     let institutionId: string | null =
       pendingProfile?.institutionId ||
       userData.institution_id ||
       institutionData?.institution_id ||
       null;

     // Last-resort: if we have an institution_code but no id, look it up now
     if (!institutionId) {
       const institutionCode = pendingProfile?.institutionCode || userData.institution_code || null;
       if (institutionCode) {
         console.info('[Auth] verifyOtp: institution_id missing; attempting last-resort lookup by code:', institutionCode);
         try {
           const { data: resolved } = await validateInstitutionCode(institutionCode);
           if (resolved?.institution_id) {
             institutionId = resolved.institution_id;
             console.info('[Auth] verifyOtp: resolved institution_id via code lookup:', institutionId);
           } else {
             console.warn('[Auth] verifyOtp: institution code lookup returned no id for code:', institutionCode);
           }
         } catch (lookupErr) {
           console.warn('[Auth] verifyOtp: last-resort institution lookup failed:', lookupErr);
         }
       }
     }

     if (!institutionId) {
       console.warn('[Auth] verifyOtp: institution_id is NULL after all resolution attempts | userId:', userId, '| institution_code:', pendingProfile?.institutionCode || userData.institution_code || 'NULL');
     }

     // Profile creation MUST happen only AFTER email verification has succeeded.
     console.info('[Auth] Creating/upserting profile | userId:', userId, '| role:', role, '| institution_id:', institutionId || 'NULL', '| email:', authUser.email);

     const { error: upsertError } = await upsertProfileSafely({
       user_id: userId,
       email: authUser.email || normalizedEmail,
       full_name: fullName,
       phone,
       role,
       institution_id: institutionId,
       department: userData.department || null,
       semester: userData.semester || null,
       programme: userData.programme || null,
       campus_block: userData.campus_block || null,
     });

     if (upsertError) {
       console.error('[Auth] Profile upsert error | userId:', userId, '| reason:', upsertError.message);
       return { error: new Error(upsertError.message), profile: null, institution: null };
     }

      console.info('[Auth] Profile upsert succeeded | userId:', userId);

      let fetchedProfile = await fetchProfile(userId);

      if (!fetchedProfile) {
        console.warn('[Auth] Profile fetch returned NULL after upsert, retrying once...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchedProfile = await fetchProfile(userId);
      }

      setPendingRegistrationProfile(null);

      let fetchedInstitution: InstitutionData | null = null;

     if (institutionId) {
       console.info('[Auth] Loading institution by id:', institutionId);
       const { data: instData, error: instError } = await supabase
         .from('institutions')
         .select('id, name, campus, city, state, country, institution_code')
         .eq('id', institutionId)
         .maybeSingle();

      if (instError) {
        console.error('[Auth] Institution fetch by id error:', instError.message);
      } else if (instData) {
        fetchedInstitution = {
          institution_id: instData.id,
          institution_name: instData.name || '',
          campus: instData.campus || '',
          city: instData.city || '',
          state: instData.state || '',
          country: instData.country || '',
          institution_code: instData.institution_code || '',
        };
        setInstitutionData(fetchedInstitution);
      }
    }

     return { error: null, profile: fetchedProfile, institution: fetchedInstitution };
   };

   const ensureProfileExists = async (userId: string): Promise<Profile | null> => {
     return await fetchProfile(userId);
   };

  const clearAllSessionData = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'foodexa-theme-preference' && key !== 'foodexa-main-auth') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem(DIRECT_SESSION_KEY);
  };

  const joinWithCodeRoleName = useCallback(async (
    institutionCode: string,
    role: 'student' | 'faculty' | 'guest',
    displayName: string
  ): Promise<{ error: string | null; profile: Profile | null; institution: InstitutionData | null }> => {
    try {
      // 1. Validate institution code against live Supabase
      const { error: instError, data: instData } = await validateInstitutionCode(institutionCode);
      if (instError || !instData) {
        return { error: instError || 'Invalid institution code.', profile: null, institution: null };
      }

      // 2. If an authenticated (Google) user exists, persist institution to their Supabase profile
      if (user) {
        const { error: upsertError } = await upsertProfileSafely({
          user_id: user.id,
          full_name: displayName.trim(),
          role,
          institution_id: instData.institution_id,
        });

        if (upsertError) {
          console.error('[Auth] joinWithCodeRoleName profile upsert error:', upsertError.message);
          return { error: upsertError.message, profile: null, institution: null };
        }

        const fetchedProfile = await fetchProfile(user.id);
        setInstitutionData(instData);
        return { error: null, profile: fetchedProfile, institution: instData };
      }

      // 3. Otherwise (Direct Access): create temporary frontend session (NO Supabase auth)
      const sessionId = crypto.randomUUID();
      const tempSession: DirectSession = {
        session_id: sessionId,
        temporarySessionId: sessionId,
        institutionId: instData.institution_id,
        institutionName: instData.institution_name,
        institutionCode: instData.institution_code,
        name: displayName.trim(),
        email: '',
        role,
      };

      setDirectSession(tempSession);
      sessionStorage.setItem(DIRECT_SESSION_KEY, JSON.stringify(tempSession));

      // 4. Set institution data for the portal
      setInstitutionData(instData);

      // 5. Build a minimal profile-like object for display purposes
      const profileLike: Profile = {
        user_id: '',
        email: '',
        full_name: displayName.trim(),
        phone: null,
        institution_id: instData.institution_id,
        role,
        department: null,
        semester: null,
        programme: null,
        campus_block: null,
        created_at: '',
        updated_at: '',
      };

      setProfile(profileLike);
      setIsEmailVerified(true);

      return { error: null, profile: profileLike, institution: instData };
    } catch (err: any) {
      console.error('[Auth] joinWithCodeRoleName exception:', err);
      return { error: err?.message || 'Something went wrong. Please try again.', profile: null, institution: null };
    }
  }, [user, validateInstitutionCode, upsertProfileSafely, fetchProfile, setInstitutionData]);

  // Direct Access flow: role + name + email + institution code → temporary session
  const joinWithDirectAccess = useCallback(async (
    institutionCode: string,
    role: 'student' | 'faculty' | 'guest',
    displayName: string,
    email: string
  ): Promise<{ error: string | null; profile: Profile | null; institution: InstitutionData | null }> => {
    try {
      // 1. Validate institution code against live Supabase
      const { error: instError, data: instData } = await validateInstitutionCode(institutionCode);
      if (instError || !instData) {
        return { error: instError || 'Invalid institution code.', profile: null, institution: null };
      }

      // 2. If an authenticated (Google) user exists, persist institution to their Supabase profile
      if (user) {
        const { error: upsertError } = await upsertProfileSafely({
          user_id: user.id,
          full_name: displayName.trim(),
          role,
          institution_id: instData.institution_id,
        });

        if (upsertError) {
          console.error('[Auth] joinWithDirectAccess profile upsert error:', upsertError.message);
          return { error: upsertError.message, profile: null, institution: null };
        }

        const fetchedProfile = await fetchProfile(user.id);
        setInstitutionData(instData);
        return { error: null, profile: fetchedProfile, institution: instData };
      }

      // 3. Otherwise (Direct Access): create temporary frontend session (NO Supabase auth)
      const sessionId = crypto.randomUUID();
      const tempSession: DirectSession = {
        session_id: sessionId,
        temporarySessionId: sessionId,
        institutionId: instData.institution_id,
        institutionName: instData.institution_name,
        institutionCode: instData.institution_code,
        name: displayName.trim(),
        email: email.trim().toLowerCase(),
        role,
      };

      setDirectSession(tempSession);
      sessionStorage.setItem(DIRECT_SESSION_KEY, JSON.stringify(tempSession));

      // 4. Set institution data for the portal
      setInstitutionData(instData);

      // 5. Build a minimal profile-like object for display purposes
      const profileLike: Profile = {
        user_id: '',
        email: email.trim().toLowerCase(),
        full_name: displayName.trim(),
        phone: null,
        institution_id: instData.institution_id,
        role,
        department: null,
        semester: null,
        programme: null,
        campus_block: null,
        created_at: '',
        updated_at: '',
      };

      setProfile(profileLike);
      setIsEmailVerified(true);

      return { error: null, profile: profileLike, institution: instData };
    } catch (err: any) {
      console.error('[Auth] joinWithDirectAccess exception:', err);
      return { error: err?.message || 'Something went wrong. Please try again.', profile: null, institution: null };
    }
  }, [user, validateInstitutionCode, upsertProfileSafely, fetchProfile, setInstitutionData]);

  const signOut = async () => {
    if (user) {
      // Google/email user: sign out from Supabase
      await supabase.auth.signOut();
    }
    // Clear direct user session if exists
    clearDirectSession();
    // Clear all session data
    clearAllSessionData();
    setUser(null);
    setSession(null);
    setProfile(null);
    setInstitutionData(null);
    setIsEmailVerified(false);
  };

  const leaveInstitution = async () => {
    if (user) {
      const { error } = await upsertProfileSafely({
        user_id: user.id,
        institution_id: null,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      setInstitutionData(null);
      await fetchProfile(user.id);
      return { error: null };
    } else if (directSession) {
      clearDirectSession();
      return { error: null };
    }
    return { error: new Error('Not authenticated') };
  };

  const getRedirectPath = useCallback((role: UserRole | null): string => {
    switch (role) {
      case 'student':
        return '/student-dashboard';
      case 'institution_admin':
        return '/institution-dashboard';
      case 'kitchen_staff':
        return '/institution-dashboard';
      case 'canteen_manager':
        return '/institution-dashboard';
      case 'faculty':
        return '/student-dashboard';
      case 'super_admin':
        return '/super-admin-portal';
      default:
        return '/';
    }
  }, []);

  const restoreSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Auth] Session restoration error:', error.message);
        return { error, restored: false };
      }

      if (!session || !session.user) {
        return { error: null, restored: false };
      }

      const userId = session.user.id;
      setUser(session.user);
      setSession(session);
      setIsEmailVerified(!!session.user.email_confirmed_at);

      try {
        const profile = await fetchProfile(userId);
        if (!profile) {
          return { error: new Error('Profile not found'), restored: false };
        }

        setProfile(profile);
        await loadInstitutionForProfile(profile);

        return { error: null, restored: true, profile, session };
      } catch (profileError) {
        console.error('[Auth] Profile loading error:', profileError);
        return { error: profileError as Error, restored: false };
      }
    } catch (err) {
      console.error('[Auth] Critical session restoration error:', err);
      return { error: err as Error, restored: false };
    }
  };

  const initializeAppSession = useCallback(async () => {
    try {
      const { error, restored, profile, session } = await restoreSession();
      if (error) {
        console.error('[Auth] Session initialization failed:', error.message);
      } else if (restored && profile) {
        console.info('[Auth] Session restored successfully');
      } else {
        console.info('[Auth] No existing session found');
      }
      setLoading(false);
    } catch (err) {
      console.error('[Auth] Critical session initialization error:', err);
      setLoading(false);
    }
  }, [restoreSession]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (user) {
      const safeUpdates = { ...updates };
      delete (safeUpdates as any).user_id;
      const { error } = await upsertProfileSafely({
        user_id: user.id,
        ...safeUpdates,
      });

      if (!error) {
        await fetchProfile(user.id);
      }

      return { error: error ? new Error(error.message) : null };
    } else if (directSession) {
      const updatedSession: DirectSession = {
        ...directSession,
        name: updates.full_name || directSession.name,
      };
      setDirectSession(updatedSession);
      sessionStorage.setItem(DIRECT_SESSION_KEY, JSON.stringify(updatedSession));
      const updatedProfile = { ...profile, ...updates } as Profile;
      setProfile(updatedProfile);
      return { error: null };
    }
    return { error: new Error('Not authenticated') };
  };

  const switchInstitution = async (institutionCode: string): Promise<{ error: string | null }> => {
    const trimmedCode = institutionCode.trim();
    if (!trimmedCode) return { error: 'Institution Code is required.' };

    try {
      const result = await validateInstitutionCode(trimmedCode);
      if (result.error || !result.data) {
        return { error: result.error || 'Invalid Institution Code.' };
      }

      const newInstitutionId = result.data.institution_id;

      if (user) {
        // Google/email user: update profile in Supabase
        const { error: updateError } = await upsertProfileSafely({
          user_id: user.id,
          institution_id: newInstitutionId,
        });

        if (updateError) {
          return { error: 'Failed to switch institution. Please try again.' };
        }

        await fetchProfile(user.id);
      } else if (directSession) {
        // Direct user: update temporary session
        const updatedSession: DirectSession = {
          ...directSession,
          institutionId: newInstitutionId,
          institutionName: result.data.institution_name,
        };
        setDirectSession(updatedSession);
        sessionStorage.setItem(DIRECT_SESSION_KEY, JSON.stringify(updatedSession));
      } else {
        return { error: 'Not authenticated.' };
      }

      setInstitutionData(result.data);

      return { error: null };
    } catch (err: any) {
      console.error('[Auth] switchInstitution error:', err);
      return { error: 'Something went wrong. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isEmailVerified,
      isPendingOtpVerification,
      institutionData,
      setInstitutionData,
      validateInstitutionCode,
      signIn,
      signUpWithPassword,
      verifyOtp,
      joinWithCodeRoleName,
      joinWithDirectAccess,
      signOut,
      clearAllSessionData,
      updateProfile,
      refreshProfile,
      leaveInstitution,
      switchInstitution,
      directSession,
      clearDirectSession,
      isDirectUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
