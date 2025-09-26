import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';

export const AUTH_TOKEN_KEY = 'focus_patrimoine_token';

export interface LoginCredentials {
  email: string;
  password: string;
}

const hasWindow = typeof window !== 'undefined';

export const getToken = (): string | null => {
  if (!hasWindow) {
    return null;
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (!hasWindow) {
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeToken = (): void => {
  if (!hasWindow) {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

const syncTokenFromSession = (session: Session | null): void => {
  if (session?.access_token) {
    setToken(session.access_token);
  } else {
    removeToken();
  }
};

let supabase: ReturnType<typeof getSupabaseClient> | null = null;

try {
  supabase = getSupabaseClient();
} catch (error) {
  console.warn(error instanceof Error ? error.message : error);
}

if (supabase && hasWindow) {
  void supabase.auth.getSession().then(({ data }) => {
    syncTokenFromSession(data.session ?? null);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    syncTokenFromSession(session);
  });
}

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const login = async (credentials: LoginCredentials): Promise<{ token: string; user: any }> => {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré. Vérifiez vos variables d\'environnement.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.session || !data.user) {
    throw new Error(error?.message ?? 'Impossible de se connecter avec ces identifiants.');
  }

  const token = data.session.access_token;
  setToken(token);

  return { token, user: data.user };
};

export const logout = async (): Promise<void> => {
  if (supabase) {
    await supabase.auth.signOut();
  }

  removeToken();
  if (hasWindow) {
    window.location.reload();
  }
};

// Authenticated fetch wrapper
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  } as HeadersInit;

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    await logout();
  }

  return response;
};