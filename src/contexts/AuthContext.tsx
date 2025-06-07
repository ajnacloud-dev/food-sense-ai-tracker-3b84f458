
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST with enhanced persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        // Handle session persistence for all events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          console.log('Session established/refreshed for user:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          console.log('User signed out, session cleared');
        } else {
          // For other events, maintain current session if valid
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session with retry logic for mobile
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Don't clear session on network errors, maintain existing state
          if (error.message?.includes('network') || error.message?.includes('fetch')) {
            console.log('Network error detected, maintaining existing session');
            return;
          }
        }

        if (mounted) {
          console.log('Initial session check:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // On error, don't clear existing session, just mark as not loading
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Enhanced session refresh handling for mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh session when app becomes visible (mobile app switching)
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && mounted) {
            setSession(session);
            setUser(session.user);
            console.log('Session refreshed on visibility change');
          }
        });
      }
    };

    // Add event listeners for mobile app lifecycle
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      // Clear local state immediately
      setSession(null);
      setUser(null);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
