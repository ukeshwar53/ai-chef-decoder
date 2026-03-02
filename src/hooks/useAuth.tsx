import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: new Error('AuthProvider not mounted') }),
  signIn: async () => ({ error: new Error('AuthProvider not mounted') }),
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const runWithNetworkRetry = async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      const isNetworkError = error instanceof TypeError && /Failed to fetch/i.test(error.message);

      if (!isNetworkError) throw error;

      // Retry once for transient connectivity issues
      return await operation();
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    try {
      const { error } = await runWithNetworkRetry(() =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
            },
          },
        })
      );

      return { error };
    } catch (error: any) {
      return {
        error: new Error(
          "Network error while signing up. Please check your connection and try again."
        ),
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await runWithNetworkRetry(() =>
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );

      return { error };
    } catch (error: any) {
      return {
        error: new Error(
          "Network error while signing in. Please check your connection and try again."
        ),
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
