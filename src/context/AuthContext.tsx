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

interface InstitutionData {
  institution_id: string;
  institution_name: string;
  campus: string;
  city: string;
  state: string;
  country: string;
  institution_code: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  institutionData: InstitutionData | null;
  setInstitutionData: (data: InstitutionData | null) => void;
  validateInstitutionCode: (code: string) => Promise<{ error: string | null; data: InstitutionData | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'faculty' | 'guest', institutionCode?: string) => Promise<{ error: Error | null }>;
  signInWithOtp: (email: string, fullName: string, role: 'student' | 'faculty' | 'guest', institutionCode?: string, phone?: string) => Promise<{ error: Error | null }>;
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
  const [institutionData, setInstitutionData] = useState<InstitutionData | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Profile fetch error:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err);
    }
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
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

  const signInWithOtp = async (email: string, fullName: string, role: 'student' | 'faculty' | 'guest', institutionCode?: string, phone?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: fullName,
          role,
          institution_code: institutionCode,
          phone,
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
    
    if (!error && authData?.user?.id) {
      const userId = authData.user.id;
      
      const userData = authData.user.user_metadata || {};
      const fullName = userData.full_name || null;
      const role = userData.role as 'student' | 'faculty' | 'guest' || 'guest';
      const institutionCode = userData.institution_code || null;
      const phone = userData.phone || null;
      const institutionId = institutionData?.institution_id || null;
      
      await supabase
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
        });
      
      await fetchProfile(userId);
      
      if (institutionId) {
        const { data: instData } = await supabase
          .from('institutions')
          .select('id, name, campus, city, state, country, institution_code')
          .eq('id', institutionId)
          .single();
        
        if (instData) {
          setInstitutionData({
            institution_id: instData.id,
            institution_name: instData.name,
            campus: instData.campus || '',
            city: instData.city || '',
            state: instData.state || '',
            country: instData.country || '',
            institution_code: instData.institution_code,
          });
        }
      } else if (institutionCode) {
        const { data: instData } = await supabase
          .from('institutions')
          .select('id, name, campus, city, state, country, institution_code')
          .ilike('institution_code', institutionCode)
          .single();
        
        if (instData) {
          setInstitutionData({
            institution_id: instData.id,
            institution_name: instData.name,
            campus: instData.campus || '',
            city: instData.city || '',
            state: instData.state || '',
            country: instData.country || '',
            institution_code: instData.institution_code,
          });
        }
      } else if (institutionCode) {
        const { data: instData } = await supabase
          .from('institutions')
          .select('id, name, campus, city, state, country, institution_code')
          .ilike('institution_code', institutionCode)
          .single();
        
        if (instData) {
          setInstitutionData({
            institution_id: instData.id,
            institution_name: instData.name,
            campus: instData.campus || '',
            city: instData.city || '',
            state: instData.state || '',
            country: instData.country || '',
            institution_code: instData.institution_code,
          });
        }
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
      institutionData,
      setInstitutionData,
      validateInstitutionCode,
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
