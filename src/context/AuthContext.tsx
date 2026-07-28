import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import type { UserRole, Profile, InstitutionData } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  institutionData: InstitutionData | null;
  setInstitutionData: (data: InstitutionData | null) => void;
  validateInstitutionCode: (code: string) => Promise<{ error: string | null; data: InstitutionData | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; session: Session | null; user: User | null; profile: Profile | null }>;
  signInWithOtp: (email: string, fullName: string, role: UserRole, metadata?: { institutionCode?: string; phone?: string; department?: string; semester?: string; programme?: string; campusBlock?: string; designation?: string; }) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null; profile: Profile | null; institution: InstitutionData | null }>;
  signOut: () => Promise<void>;
  clearAllSessionData: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  setRememberMeFlag: (remember: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (value: unknown): UserRole | null => {
  const allowed: UserRole[] = ['student', 'faculty', 'guest', 'institution_admin', 'kitchen_staff', 'canteen_manager', 'super_admin'];
  return allowed.includes(value as UserRole) ? (value as UserRole) : null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionData, setInstitutionData] = useState<InstitutionData | null>(null);
  const [pendingOtpProfile, setPendingOtpProfile] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    institutionCode: string | null;
    institutionId: string | null;
    phone: string | null;
    department: string | null;
    semester: string | null;
    programme: string | null;
    campusBlock: string | null;
    designation: string | null;
  } | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Profile fetch error:', error);
        return null;
      }

      if (data) {
        const fetchedProfile = data as Profile;
        setProfile(fetchedProfile);
        return fetchedProfile;
      }
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err);
    }

    setProfile(null);
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [fetchProfile, user]);

  const setRememberMeFlag = useCallback((remember: boolean) => {
    if (remember) {
      localStorage.setItem('foodexa-remember-me', 'true');
      sessionStorage.removeItem('foodexa-remember-me');
    } else {
      sessionStorage.setItem('foodexa-remember-me', 'true');
      localStorage.removeItem('foodexa-remember-me');
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const remembered = localStorage.getItem('foodexa-remember-me') === 'true' || sessionStorage.getItem('foodexa-remember-me') === 'true';
      if (session && !remembered) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setInstitutionData(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.id);
      const remembered = localStorage.getItem('foodexa-remember-me') === 'true' || sessionStorage.getItem('foodexa-remember-me') === 'true';
      if (session && !remembered) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setInstitutionData(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, setRememberMeFlag]);

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

  const signInWithOtp = async (email: string, fullName: string, role: UserRole, metadata?: { institutionCode?: string; phone?: string; department?: string; semester?: string; programme?: string; campusBlock?: string; designation?: string; }) => {
    setPendingOtpProfile({
      email: email.trim(),
      fullName: fullName.trim(),
      role,
      institutionCode: metadata?.institutionCode?.trim() || institutionData?.institution_code || null,
      institutionId: institutionData?.institution_id || null,
      phone: metadata?.phone?.trim() || null,
      department: metadata?.department?.trim() || null,
      semester: metadata?.semester?.trim() || null,
      programme: metadata?.programme?.trim() || null,
      campusBlock: metadata?.campusBlock?.trim() || null,
      designation: metadata?.designation?.trim() || null,
    });

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: {
          full_name: fullName.trim(),
          role,
          institution_code: metadata?.institutionCode?.trim() || institutionData?.institution_code,
          institution_id: institutionData?.institution_id,
          phone: metadata?.phone?.trim() || null,
          department: metadata?.department?.trim() || null,
          semester: metadata?.semester?.trim() || null,
          programme: metadata?.programme?.trim() || null,
          campus_block: metadata?.campusBlock?.trim() || null,
          designation: metadata?.designation?.trim() || null,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const validateInstitutionCode = async (code: string) => {
    const trimmed = code?.trim() || '';
    if (!trimmed) {
      return { error: 'Institution Code is required.', data: null };
    }
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .ilike('institution_code', trimmed)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        return { error: 'Unable to verify Institution Code. Please try again.', data: null };
      }
      if (!data) {
        return { error: 'Invalid Institution Code. Please check and try again.', data: null };
      }

      return {
        error: null,
        data: {
          institution_id: data.id,
          institution_name: data.name,
          campus: data.campus,
          city: data.city,
          state: data.state,
          country: data.country,
          institution_code: data.institution_code,
        } as InstitutionData,
      };
    } catch (err) {
      return { error: 'Unable to verify Institution Code. Please try again.', data: null };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error, data: authData } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    let fetchedProfile: Profile | null = null;
    let fetchedInstitution: InstitutionData | null = null;

    if (!error && authData?.user?.id) {
      const userId = authData.user.id;

      const userData = authData.user.user_metadata || {};
      const role = normalizeRole(pendingOtpProfile?.role || userData.role);

      if (!role) {
        return { error: new Error('Account role is missing. Please restart registration and choose a valid role.'), profile: null, institution: null };
      }

      const fullName = pendingOtpProfile?.fullName || userData.full_name || null;
      const institutionCode = pendingOtpProfile?.institutionCode || userData.institution_code || null;
      const phone = pendingOtpProfile?.phone || userData.phone || null;
      const institutionId = pendingOtpProfile?.institutionId || userData.institution_id || institutionData?.institution_id || null;
      const department = pendingOtpProfile?.department || userData.department || null;
      const semester = pendingOtpProfile?.semester || userData.semester || null;
      const programme = pendingOtpProfile?.programme || userData.programme || null;
      const campusBlock = pendingOtpProfile?.campusBlock || userData.campus_block || null;
      const designation = pendingOtpProfile?.designation || userData.designation || null;

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          email: authData.user.email || email,
          full_name: fullName,
          phone,
          role,
          institution_id: institutionId,
          institution_code: institutionCode,
          department,
          semester,
          programme,
          campus_block: campusBlock,
          designation,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        console.error('[Auth] Profile upsert error:', upsertError);
      }

      fetchedProfile = await fetchProfile(userId);
      setPendingOtpProfile(null);

      if (institutionId) {
        const { data: instData } = await supabase
          .from('institutions')
          .select('id, name, campus, city, state, country, institution_code')
          .eq('id', institutionId)
          .single();

        if (instData) {
          fetchedInstitution = {
            institution_id: instData.id,
            institution_name: instData.name,
            campus: instData.campus || '',
            city: instData.city || '',
            state: instData.state || '',
            country: instData.country || '',
            institution_code: instData.institution_code,
          };
          setInstitutionData(fetchedInstitution);
        }
      } else if (institutionCode) {
        const { data: instData } = await supabase
          .from('institutions')
          .select('id, name, campus, city, state, country, institution_code')
          .ilike('institution_code', institutionCode)
          .single();

        if (instData) {
          fetchedInstitution = {
            institution_id: instData.id,
            institution_name: instData.name,
            campus: instData.campus || '',
            city: instData.city || '',
            state: instData.state || '',
            country: instData.country || '',
            institution_code: instData.institution_code,
          };
          setInstitutionData(fetchedInstitution);
        }
      }
    }

    return { error: error ? new Error(error.message) : null, profile: fetchedProfile, institution: fetchedInstitution };
  };

  const clearAllSessionData = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'foodexa-theme-preference' && key !== 'foodexa-remember-me') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
  };

  const signOut = async () => {
    clearAllSessionData();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setInstitutionData(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error: error ? new Error(error.message) : null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      institutionData,
      setInstitutionData,
      validateInstitutionCode,
      signIn,
      signInWithOtp,
      verifyOtp,
      signOut,
      clearAllSessionData,
      updateProfile,
      refreshProfile,
      setRememberMeFlag,
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
