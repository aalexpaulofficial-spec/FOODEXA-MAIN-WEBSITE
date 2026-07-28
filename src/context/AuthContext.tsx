import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  institution_id: string | null;
  role: 'student' | 'faculty' | 'guest';
  created_at: string;
  institution_code: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: Profile | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'faculty' | 'guest', institutionCode?: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (
    email: string,
    fullName: string,
    role: 'student' | 'faculty' | 'guest',
    institutionCode?: string,
    phone?: string,
    institutionId?: string,
    institutionName?: string,
    institutionCampus?: string
  ) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
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
        const nextProfile = data as Profile;
        setProfile(nextProfile);
        return nextProfile;
      }
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err);
    }

    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: new Error(error.message) };
    }

    const signedInProfile = data.user?.id ? await fetchProfile(data.user.id) : null;
    return { error: null, profile: signedInProfile };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'faculty' | 'guest', institutionCode?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          institution_code: institutionCode,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithOtp = async (
    email: string,
    fullName: string,
    role: 'student' | 'faculty' | 'guest',
    institutionCode?: string,
    phone?: string,
    institutionId?: string,
    institutionName?: string,
    institutionCampus?: string
  ) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: fullName,
          role,
          institution_code: institutionCode,
          institution_id: institutionId,
          institution_name: institutionName,
          institution_campus: institutionCampus,
          phone,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error, data: authData } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    
    if (!error && authData?.user?.id) {
      const userId = authData.user.id;
      
      const userData = authData.user.user_metadata || {};
      const fullName = userData.full_name || null;
      const role = userData.role as 'student' | 'faculty' | 'guest' || 'guest';
      const institutionCode = userData.institution_code || null;
      const institutionId = userData.institution_id || null;
      const phone = userData.phone || null;

      const { data: savedProfile } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          email: authData.user.email || email,
          full_name: fullName,
          phone,
          role,
          institution_id: institutionId,
          institution_code: institutionCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (savedProfile) {
        setProfile(savedProfile as Profile);
      }
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
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
      signIn,
      signUp,
      signInWithOtp,
      verifyOtp,
      signOut,
      updateProfile,
      refreshProfile,
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
