import React, { createContext, useContext, useEffect, useState } from 'react';
import { observeAuth, type AuthUser } from '../services/auth';
import { errorMessage } from '../services/errors';

type Session = {
  user: AuthUser | null;
  loading: boolean;
  error: string;
  retry: () => void;
};
const AuthContext = createContext<Session | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    setLoading(true);
    return observeAuth(
      next => {
        setUser(next);
        setLoading(false);
        setError('');
      },
      failure => {
        setError(errorMessage(failure));
        setLoading(false);
      },
    );
  }, [version]);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        retry: () => setVersion(value => value + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthProvider chưa được khởi tạo.');
  }
  return context;
}
