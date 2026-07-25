import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsGuest: () => void;
  logOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInAsGuest: () => {},
  logOut: async () => {},
  getToken: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createGuestUserObj = (uid: string) => ({
    uid,
    email: 'guest@tradelog.app',
    displayName: 'Guest Trader',
    getIdToken: async () => `guest-token-${uid}`,
  });

  useEffect(() => {
    const savedGuest = localStorage.getItem('tradelog_guest_user');
    if (savedGuest) {
      try {
        const { uid } = JSON.parse(savedGuest);
        const guestObj = createGuestUserObj(uid);
        setUser(guestObj as any);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('tradelog_guest_user');
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          console.error('Failed to sync user', e);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user && name) {
      await updateProfile(res.user, { displayName: name });
    }
  };

  const signInAsGuest = () => {
    const existing = localStorage.getItem('tradelog_guest_user');
    let uid = 'guest_default';
    if (existing) {
      try { uid = JSON.parse(existing).uid; } catch(e) {}
    } else {
      uid = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('tradelog_guest_user', JSON.stringify({ uid }));
    }
    const guestUser = createGuestUserObj(uid);
    setUser(guestUser as any);
  };

  const logOut = async () => {
    localStorage.removeItem('tradelog_guest_user');
    await signOut(auth).catch(() => {});
    setUser(null);
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithEmail, signUpWithEmail, signInAsGuest, logOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

