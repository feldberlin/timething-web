import React, { useEffect, useState, useContext } from 'react';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import supabase from '../../supabaseClient.ts';

interface AuthContext {
  session: Session | null;
  user: User | null;
  authChangeEvent: AuthChangeEvent | null;
}

const initialState = { session: null, user: null } as AuthContext;
const authContext = React.createContext(initialState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(session?.user ?? null);
  const [authChangeEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, _session: Session | null) => {
        setSession(_session);
        setUser(_session?.user ?? null);
        setAuthEvent(_event);
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value = { authChangeEvent, session, user };
  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}

export function useAuth() {
  const context = useContext(authContext);
  if (context === undefined) throw Error('useAuth must be used within AuthProvider');
  return context;
}
