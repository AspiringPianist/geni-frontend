import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        const userData = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          idToken,
        };
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });

    // Check localStorage on mount
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Refresh token periodically
  useEffect(() => {
    if (!currentUser) return;

    const refreshToken = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true);
        setCurrentUser(prev => ({
          ...prev,
          idToken: newToken
        }));
        localStorage.setItem('currentUser', JSON.stringify({
          ...currentUser,
          idToken: newToken
        }));
      }
    }, 45 * 60 * 1000); // Refresh every 45 minutes

    return () => clearInterval(refreshToken);
  }, [currentUser]);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}