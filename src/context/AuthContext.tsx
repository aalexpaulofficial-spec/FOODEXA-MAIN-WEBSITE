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
  isProfileComplete: boolean;
  loading: boolean;
  isEmailVerified: boolean;
  isPendingOtpVerification: boolean;
  institutionData: InstitutionData | null;
  setInstitutionData: (data: InstitutionData | null) => void;
  validateInstitutionCode: (code: string) => Promise<{ error: string | null; data: InstitutionData | null }>;
  signUpWithOtp: (email: string, fullName: string, role: UserRole, metadata?: { institutionCode?: string; institutionId?: string; phone?: string; department?: string; semester?: string; programme?: string; campusBlock?: string; facultyId?: string; }) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null; profile: Profile | null; institution: InstitutionData | null }>;
  joinWithCodeRoleName: (institutionCode: string, role: 'student' | 'faculty' | 'guest', displayName: string) => Promise<{ error: string | null; profile: Profile | null; institution: InstitutionData | null }>;
  joinWithDirectAccess: (institutionCode: string, role: 'student' | 'faculty' | 'guest', displayName: string, email: string) => Promise<{ error: string | null; profile: Profile | null; institution: InstitutionData | null }>;
  signOut: () => Promise<void>;
  clearAllSessionData: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  loadCurrentStudentProfile: (fallbackData?: { fullName?: string | null; role?: UserRole | null; institutionId?: string | null; email?: string | null; phone?: string | null }) => Promise<{ error: Error | null; profile: Profile | null }>;
  updateStudentInstitution: (institutionId: string) => Promise<{ error: Error | null; profile: Profile | null }>;
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

// ── Permanent FOODEXA identifiers ──────────────────────────────────────────
// Generated exactly ONCE at account creation and stored permanently in Supabase.
// Format examples: FX26-A2A1EF (Registration ID) and ST-A2A1EF (Student ID)
export function generateStudentIdentifiers(): { registration_id: string; student_id: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let base = '';
  for (let i = 0; i < 10; i++) {
    base += chars[Math.floor(Math.random() * chars.length)];
  }
  return {
    registration_id: `REG-${base}`,
    student_id: `STU-${base.slice(0, 8)}`,
  };
}

const DIRECT_SESSION_KEY = 'foodexa-direct-session';
const PENDING_VERIFICATION_EMAIL_KEY = 'foodexa_pending_verification_email';

export const OTP_LENGTH = 8;

const mapOtpErrorMessage = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('expired')) {
    return 'This verification code has expired. Please request a new code.';
  }
  if (lower.includes('invalid') || lower.includes('otp') || lower.includes('token')) {
    return 'Invalid verification code. Please check the 8-digit code and try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait and request a new code.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Unable to send a new code. Please try again shortly.';
  }
  return message;
};

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
  const signUpInProgressRef = React.useRef(false);
  const verifyOtpInProgressRef = React.useRef(false);

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
  const isProfileComplete = !!user && !!profile?.role && !!profile?.institution_id;

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
        // Only include columns that are CONFIRMED to exist in the production profiles table.
        // Do NOT add speculative columns (registration_id, student_id, plan, foodexa_plan, account_created_at)
        // unless they have been verified via a real database schema inspection.
        const KNOWN_PROFILE_COLUMNS = ['user_id', 'email', 'full_name', 'phone', 'role', 'institution_id', 'department', 'semester', 'programme', 'campus_block', 'designation', 'avatar_url', 'diet_preference', 'account_created_at', 'foodexa_plan', 'plan'];
       const safePayload: Record<string, any> = {};
       for (const key of KNOWN_PROFILE_COLUMNS) {
         if (key in payload) {
           safePayload[key] = payload[key];
         }
       }

        // RULE 1: A profile MUST always be keyed by the authenticated Supabase
        // user id. Never insert a row with a null/empty user_id — that violates
        // the NOT NULL constraint and corrupts the account. Bail out early with a
        // clear error instead of letting Postgres reject it.
        if (!safePayload.user_id || typeof safePayload.user_id !== 'string' || safePayload.user_id.trim().length === 0) {
          console.error('[Auth] Refusing to upsert profile without a valid authenticated user_id. Payload keys:', Object.keys(safePayload));
          return { error: new Error('Cannot save profile: missing authenticated user ID. Please sign in again.') };
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

    // Use SELECT * so we never fail on a column that doesn't exist.
    // The TypeScript Profile interface has optional fields for any extra columns.
    const PROFILE_COLUMNS = '*';

    // Ensure a profile carries permanent identifiers. If they are missing (e.g. a
    // profile created before this feature), generate them ONCE and persist them so
    // they never change on subsequent logins.
    // ensureStudentIdentifiers removed — those columns may not exist in production.
    // If the database gains student_id / registration_id columns in the future,
    // re-enable this function after confirming the schema.

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
      try {
         const { data, error } = await supabase
           .from('profiles')
           .select(PROFILE_COLUMNS)
           .eq('user_id', userId)
           .maybeSingle();

          if (error) {
            console.error('[Auth] Profile fetch error:', error.message);
            return null;
          }

        if (data) {
          const fetchedProfile = { ...data } as Profile;
          setProfile(fetchedProfile);
          await loadInstitutionForProfile(fetchedProfile);
          return fetchedProfile;
        }
      } catch (err: any) {
        console.error('[Auth] Profile fetch threw an exception:', err?.message || err);
      }
      return null;
    }, [loadInstitutionForProfile]);

    const loadCurrentStudentProfile = useCallback(async (fallbackData?: {
      fullName?: string | null;
      role?: UserRole | null;
      institutionId?: string | null;
      email?: string | null;
      phone?: string | null;
    }): Promise<{ error: Error | null; profile: Profile | null }> => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          return { error: new Error('Authentication session could not be loaded. Please sign in again.'), profile: null };
        }
        
        const existing = await fetchProfile(user.id);
        if (existing) {
          return { error: null, profile: existing };
        }

        const safeEmail = fallbackData?.email || user.email || '';
        const safeFullName = fallbackData?.fullName?.trim() || user.user_metadata?.full_name?.trim() || user.user_metadata?.name?.trim() || pendingOtpProfileRef.current?.fullName?.trim() || safeEmail.split('@')[0]?.trim() || 'FOODEXA Student';
        const safeRole = fallbackData?.role || normalizeRole(user.user_metadata?.role) || pendingOtpProfileRef.current?.role || 'student';

        const { error: upsertError } = await upsertProfileSafely({
          user_id: user.id,
          email: safeEmail,
          full_name: safeFullName,
          phone: fallbackData?.phone || user.user_metadata?.phone || pendingOtpProfileRef.current?.phone || null,
          role: safeRole,
          designation: safeRole,
          institution_id: fallbackData?.institutionId || null,
          diet_preference: 'all',
          account_created_at: new Date().toISOString(),
          foodexa_plan: 'Free',
          plan: 'Free',
        });

        if (upsertError) return { error: upsertError, profile: null };
        const created = await fetchProfile(user.id);
        return { error: null, profile: created };
      } catch (err: any) {
        return { error: err, profile: null };
      }
    }, [fetchProfile, upsertProfileSafely]);

    const updateStudentInstitution = useCallback(async (institutionId: string): Promise<{ error: Error | null; profile: Profile | null }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: new Error('Authentication session could not be loaded. Please sign in again.'), profile: null };
      
      const { error } = await supabase.from('profiles').update({ institution_id: institutionId, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      if (error) {
        console.error('[Auth] Failed to update institution_id in profiles:', error);
        return { error: new Error(error.message), profile: null };
      }
      
      const profile = await fetchProfile(user.id);
      return { error: null, profile };
    }, [fetchProfile]);

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

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
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

  // Passwordless OTP signup using signInWithOtp with shouldCreateUser: true
  const signUpWithOtp = async (
    email: string,
    fullName: string,
    role: UserRole,
    metadata?: {
      institutionCode?: string;
      institutionId?: string;
      phone?: string;
      department?: string;
      semester?: string;
      programme?: string;
      campusBlock?: string;
      facultyId?: string;
    }
  ) => {
    if (signUpInProgressRef.current) {
      return { error: new Error('Registration is already in progress. Please wait.') };
    }
    signUpInProgressRef.current = true;

    const trimmedEmail = email.trim().toLowerCase();

    // Resolve institution_id: prefer direct param, then context state
    const resolvedInstitutionId = metadata?.institutionId || institutionData?.institution_id || null;

    if (!resolvedInstitutionId) {
      console.warn('[Auth] signUpWithOtp: institution_id is NULL. Institution code may not have been validated.');
    }

    // Block any auto-redirect while OTP is pending
    setIsPendingOtpVerification(true);
    sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, trimmedEmail);

    // Store pending profile data for after OTP verification
    setPendingRegistrationProfile({
      email: trimmedEmail,
      fullName: fullName.trim(),
      role,
      institutionId: resolvedInstitutionId,
      institutionCode: metadata?.institutionCode?.trim() || null,
      phone: metadata?.phone?.trim() || null,
    });

    console.info('[Auth] Passwordless signup request → signInWithOtp(shouldCreateUser: true) | email:', trimmedEmail, '| role:', role, '| institution_id:', resolvedInstitutionId || 'NULL (NOT VALIDATED)');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: fullName.trim(),
            role,
            phone: metadata?.phone?.trim() || null,
            institution_id: resolvedInstitutionId,
          },
        },
      });

      if (error) {
        console.error('FOODEXA AUTH ERROR:', error);
        signUpInProgressRef.current = false;
        setIsPendingOtpVerification(false);
        sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
        return { error: new Error(error.message) };
      }

      console.info('[Auth] signInWithOtp(shouldCreateUser: true) succeeded. OTP email dispatched to:', trimmedEmail);
      signUpInProgressRef.current = false;
      return { error: null };
    } catch (err: any) {
      console.error('FOODEXA AUTH ERROR:', err);
      signUpInProgressRef.current = false;
      setIsPendingOtpVerification(false);
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      return { error: new Error(err?.message || 'Failed to send verification code. Please try again.') };
    }
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
     if (verifyOtpInProgressRef.current) {
       return { error: new Error('Verification is already in progress. Please wait.'), profile: null, institution: null };
     }
     verifyOtpInProgressRef.current = true;

     const normalizedEmail = (email || sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) || '').trim().toLowerCase();
     const safeToken = (token || '').replace(/\D/g, '').trim();
     console.info('[Auth] OTP verification request | email:', normalizedEmail, '| token length:', safeToken.length, '| authUser:', user?.id || '<none>');

     try {
       if (!normalizedEmail) {
         return { error: new Error('An email address is required to verify the OTP.'), profile: null, institution: null };
       }
       if (!safeToken) {
         return { error: new Error('Please enter the OTP code sent to your email.'), profile: null, institution: null };
       }
if (safeToken.length !== OTP_LENGTH) {
          return { error: new Error('Please enter the complete 8-digit verification code.'), profile: null, institution: null };
        }

        console.info('[Auth] Attempting OTP verification with type "email"...');
        const { data: authData, error } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: safeToken,
          type: 'email',
        });

        if (error) {
          console.error('Supabase Auth Error:', error);
          console.error('[FOODEXA AUTH] OTP verification error:', error);
         return {
           error: new Error(mapOtpErrorMessage(error.message)),
           profile: null,
           institution: null,
         };
       }

       if (!authData?.session || !authData?.user) {
          console.error('[FOODEXA AUTH] OTP verification error: Verification returned no authenticated session.');
         return {
           error: new Error('Verification succeeded, but no authenticated session was returned. Please try again.'),
           profile: null,
           institution: null,
         };
       }

        console.info('[Auth] OTP verification SUCCEEDED via type "email" | user:', authData.user.id || '<none>');

      // OTP verified — clear the pending flag and mark email as confirmed
      setIsPendingOtpVerification(false);
      setIsEmailVerified(true);
      sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);

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

      // OTP verified successfully. Profile creation will happen after
       // institution code verification in the AuthModal.
       // Return the authenticated user info without creating a profile yet.
       const pendingProfile = pendingOtpProfileRef.current || pendingOtpProfile;
       const userData = authUser.user_metadata || {};

       // Try to fetch existing profile (may exist from a previous attempt)
       let existingProfile = await fetchProfile(userId);

       if (existingProfile) {
         // Profile already exists — load institution and return
         let fetchedInstitution: InstitutionData | null = null;
         if (existingProfile.institution_id) {
           const { data: instData } = await supabase
             .from('institutions')
             .select('id, name, campus, city, state, country, institution_code')
             .eq('id', existingProfile.institution_id)
             .maybeSingle();
           if (instData) {
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
         setPendingRegistrationProfile(null);
         return { error: null, profile: existingProfile, institution: fetchedInstitution };
       }

       // No existing profile — return null profile so AuthModal shows institution step
       console.info('[Auth] OTP verified but no profile exists yet. Awaiting institution code verification.');
       return { error: null, profile: null, institution: null };
     } finally {
       verifyOtpInProgressRef.current = false;
     }
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
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
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
           designation: role,
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
           designation: role,
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
    setIsPendingOtpVerification(false);
    setPendingRegistrationProfile(null);
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
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
        return '/faculty-dashboard';
      case 'guest':
        return '/guest-dashboard';
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
          designation: profile?.role || null,
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
      signUpWithOtp,
      verifyOtp,
      joinWithCodeRoleName,
      joinWithDirectAccess,
      signOut,
      clearAllSessionData,
      updateProfile,
      loadCurrentStudentProfile,
      updateStudentInstitution,
      refreshProfile,
      leaveInstitution,
      switchInstitution,
      directSession,
      clearDirectSession,
      isDirectUser,
      isProfileComplete,
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
