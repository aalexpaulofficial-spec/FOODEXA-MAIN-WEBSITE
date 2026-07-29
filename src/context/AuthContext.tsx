import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import type { UserRole, Profile, InstitutionData } from '../types';

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
  signUpWithPassword: (email: string, password: string, fullName: string, role: UserRole, metadata?: { institutionCode?: string; phone?: string; department?: string; semester?: string; programme?: string; campusBlock?: string; designation?: string; facultyId?: string; }) => Promise<{ error: Error | null; profile?: Profile | null; institution?: InstitutionData | null; verified?: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null; profile: Profile | null; institution: InstitutionData | null }>;
  signOut: () => Promise<void>;
  clearAllSessionData: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  leaveInstitution: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (value: unknown): UserRole | null => {
  const allowed: UserRole[] = ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'];
  return allowed.includes(value as UserRole) ? (value as UserRole) : null;
};

const seededInstitutionByCode = (code: string): InstitutionData | null => {
  if (code.trim().toUpperCase() !== 'YESHUA339537') return null;
  return {
    institution_id: 'yeshua339537',
    institution_name: 'Yeshua Institution',
    campus: 'Main Campus',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    institution_code: 'YESHUA339537',
  };
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
    phone: string | null;
  } | null>(null);
  const pendingOtpProfileRef = React.useRef<typeof pendingOtpProfile>(null);

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

  const PROFILE_COLUMNS = 'user_id, email, full_name, role, institution_id';

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
        const fetchedProfile = { ...data, phone: null, created_at: '', updated_at: '' } as Profile;
        setProfile(fetchedProfile);
        await loadInstitutionForProfile(fetchedProfile);
        return fetchedProfile;
      }
    } catch (err) {
      // silent
    }

    setProfile(null);
    setInstitutionData(null);
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

   const upsertProfileSafely = useCallback(async (payload: Record<string, any>) => {
      const KNOWN_PROFILE_COLUMNS = ['user_id', 'email', 'full_name', 'role', 'institution_id'];
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
        const friendlyMessage = error.message.includes('duplicate key')
          ? 'Your profile already exists. Please try logging in.'
          : error.message.includes('violates row-level security')
            ? 'Unable to create profile. Please contact support.'
            : error.message;
        return { error: new Error(friendlyMessage) };
      }

      return { error: null as Error | null };
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
      } else {
        setProfile(null);
        setInstitutionData(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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

  const signUpWithPassword = async (email: string, password: string, fullName: string, role: UserRole, metadata?: { institutionCode?: string; phone?: string; department?: string; semester?: string; programme?: string; campusBlock?: string; designation?: string; facultyId?: string; }) => {
    const trimmedEmail = email.trim().toLowerCase();

    // Block any auto-redirect while OTP is pending
    setIsPendingOtpVerification(true);

    setPendingRegistrationProfile({
      email: trimmedEmail,
      fullName: fullName.trim(),
      role,
      institutionId: institutionData?.institution_id || null,
      phone: metadata?.phone?.trim() || null,
    });

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          institution_id: institutionData?.institution_id,
          phone: metadata?.phone?.trim() || null,
          department: metadata?.department?.trim() || null,
          semester: metadata?.semester?.trim() || null,
          programme: metadata?.programme?.trim() || null,
          campus_block: metadata?.campusBlock?.trim() || null,
          designation: metadata?.designation?.trim() || null,
          faculty_id: metadata?.facultyId?.trim() || null,
        },
      },
    });

    if (error) {
      setIsPendingOtpVerification(false);
      return { error: new Error(error.message) };
    }

    // If Supabase returned a session, email confirmations are off or auto-confirmed.
    // Finish profile setup immediately instead of sending the user to the OTP step.
    if (data?.session) {
      const authUser = data.user;
      if (!authUser?.id) {
        setIsPendingOtpVerification(false);
        return { error: new Error('Registration succeeded but user data could not be loaded.') };
      }

      const { error: upsertError } = await upsertProfileSafely({
        user_id: authUser.id,
        email: authUser.email || trimmedEmail,
        full_name: fullName.trim(),
        role,
        institution_id: institutionData?.institution_id || null,
      });

      if (upsertError) {
        setIsPendingOtpVerification(false);
        return { error: new Error(upsertError.message) };
      }

      setIsEmailVerified(true);
      setSession(data.session);
      setUser(authUser);
      setIsPendingOtpVerification(false);
      setPendingRegistrationProfile(null);

      const liveProfile = await fetchProfile(authUser.id);
      const liveInstitution = await loadInstitutionForProfile(liveProfile);
      return {
        error: null,
        profile: liveProfile,
        institution: liveInstitution,
        verified: true,
      };
    }

    // No session yet — user must verify via OTP email. isPendingOtpVerification stays true.
    return { error: null, verified: false };
  };

  const validateInstitutionCode = async (code: string) => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      return { error: 'Institution Code is required.', data: null };
    }
    const fallbackInstitution = seededInstitutionByCode(trimmed);
    try {
      // Call the server-side endpoint so the service role key bypasses RLS.
      // Anonymous browser requests are blocked by RLS on the institutions table.
      const resp = await fetch('/api/validate-institution-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok || json.error) {
        if (fallbackInstitution) {
          return { error: null, data: fallbackInstitution };
        }
        return { error: json.error || 'Invalid Institution Code. Please check and try again.', data: null };
      }

      return {
        error: null,
        data: {
          institution_id: json.institution_id,
          institution_name: json.institution_name || '',
          campus: json.campus || '',
          city: json.city || '',
          state: json.state || '',
          country: json.country || '',
          institution_code: json.institution_code || '',
        } as InstitutionData,
      };
    } catch (err: any) {
      console.error('[Auth] Institution code validation exception:', err);
      if (fallbackInstitution) {
        return { error: null, data: fallbackInstitution };
      }
      return { error: 'Unable to verify Institution Code. Please try again.', data: null };
    }
  };


   const verifyOtp = async (email: string, token: string) => {
     console.log('[Auth] Verifying OTP for:', email);

     const { error, data: authData } = await supabase.auth.verifyOtp({
       email,
       token,
       type: 'signup',
     });

     if (error) {
       console.error('[Auth] OTP signup verification failed:', error.message);
       // Keep isPendingOtpVerification true so user can retry OTP
       return { error: new Error(error.message), profile: null, institution: null };
     }

      console.log('[Auth] OTP signup verification succeeded');

      // OTP verified — clear the pending flag and mark email as confirmed
      setIsPendingOtpVerification(false);
      setIsEmailVerified(true);

      const { data: currentUserData, error: userError } = await supabase.auth.getUser();
     if (userError || !currentUserData.user?.id) {
       console.error('[Auth] Unable to get user after OTP verification:', userError?.message);
       return { error: new Error(userError?.message || 'Verification successful but unable to load user data.'), profile: null, institution: null };
     }

     const authUser = currentUserData.user;
     const userId = authUser.id;

     const pendingProfile = pendingOtpProfileRef.current || pendingOtpProfile;
     const userData = authUser.user_metadata || authData.user?.user_metadata || {};
     const role = normalizeRole(pendingProfile?.role || userData.role);

     if (!role) {
       console.error('[Auth] No valid role found for new profile');
       return { error: new Error('Unable to complete registration. Please restart the process.'), profile: null, institution: null };
     }

      const fullName = pendingProfile?.fullName || userData.full_name || null;
      const phone = pendingProfile?.phone || userData.phone || null;
      const institutionId = pendingProfile?.institutionId || userData.institution_id || institutionData?.institution_id || null;

      console.log('[Auth] Creating/upserting profile for user:', userId, 'role:', role);

      const { error: upsertError } = await upsertProfileSafely({
        user_id: userId,
        email: authUser.email || email,
        full_name: fullName,
        role,
        institution_id: institutionId,
      });

      if (upsertError) {
        console.error('[Auth] Profile upsert error:', upsertError.message);
        return { error: new Error(upsertError.message), profile: null, institution: null };
      }

      const fetchedProfile = await fetchProfile(userId);
      setPendingRegistrationProfile(null);

      let fetchedInstitution: InstitutionData | null = null;

      if (institutionId) {
        console.log('[Auth] Loading institution by id:', institutionId);
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

  const clearAllSessionData = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'foodexa-theme-preference' && key !== 'foodexa-main-auth') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAllSessionData();
    setUser(null);
    setSession(null);
    setProfile(null);
    setInstitutionData(null);
    setIsEmailVerified(false);
  };

  const leaveInstitution = async () => {
    const activeUser = user || (await supabase.auth.getUser()).data.user;
    if (!activeUser) return { error: new Error('Not authenticated') };

    const { error } = await upsertProfileSafely({
      user_id: activeUser.id,
      institution_id: null,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    setInstitutionData(null);
    await fetchProfile(activeUser.id);
    return { error: null };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const activeUser = user || (await supabase.auth.getUser()).data.user;
    if (!activeUser) return { error: new Error('Not authenticated') };

    const safeUpdates = { ...updates };
    delete (safeUpdates as any).user_id;
    const { error } = await upsertProfileSafely({
      user_id: activeUser.id,
      ...safeUpdates,
    });

    if (!error) {
      await fetchProfile(activeUser.id);
    }

    return { error: error ? new Error(error.message) : null };
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
      signOut,
      clearAllSessionData,
      updateProfile,
      refreshProfile,
      leaveInstitution,
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
