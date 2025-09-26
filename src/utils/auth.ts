export const AUTH_TOKEN_KEY = 'focus_patrimoine_token';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// Mock authentication - in real app this would call your API
export const login = async (credentials: LoginCredentials): Promise<{ token: string; user: any }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful login
  if (credentials.email && credentials.password) {
    const token = `mock_token_${Date.now()}`;
    const user = { id: '1', email: credentials.email };
    return { token, user };
  }
  
  throw new Error('Invalid credentials');
};

export const logout = (): void => {
  removeToken();
  window.location.reload();
};

// Authenticated fetch wrapper
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    removeToken();
    window.location.reload();
  }
  
  return response;
};