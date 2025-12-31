import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, firebaseReady } from '../firebase';
import { createUserProfile, getUserProfile } from '../supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authReady: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
    nickname?: string,
    avatarEmoji?: string,
    age?: number,
    gender?: string,
    domain?: string,
    experienceYears?: number,
    experienceLevel?: string,
    market_preference?: string,
    dob?: string,
    mobile?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getTestSkipAuth(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('test-skip-auth') === 'true';
  } catch {
    return false;
  }
}

function buildTestUser(): User {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
  } as User;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (getTestSkipAuth() ? buildTestUser() : null));
  const [loading, setLoading] = useState(() => !(getTestSkipAuth() || !auth));
  const authReady = firebaseReady && !!auth;

  useEffect(() => {
    // Check for test bypass
    if (getTestSkipAuth()) {
      setUser(buildTestUser());
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      setUser(user);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    nickname?: string,
    avatarEmoji?: string,
    age?: number,
    gender?: string,
    domain?: string,
    experienceYears?: number,
    experienceLevel?: string,
    market_preference?: string,
    dob?: string,
    mobile?: string
  ) => {
    if (!authReady || !auth) {
      throw new Error('Firebase auth is not configured. Set VITE_FIREBASE_* in frontend-react/.env and restart the dev server.');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Save user profile to Supabase
    try {
      await createUserProfile({
        firebase_uid: userCredential.user.uid,
        email: userCredential.user.email || email,
        name: displayName,
        nickname,
        avatar_emoji: avatarEmoji,
        age,
        gender,
        domain,
        experience_years: experienceYears,
        experience_level: experienceLevel,
        market_preference,
        dob,
        mobile
      });
    } catch (error) {
      console.error('Failed to create user profile in Supabase:', error);
    }
    
    setUser({ ...userCredential.user, displayName } as User);
  };

  const login = async (email: string, password: string) => {
    if (!authReady || !auth) {
      throw new Error('Firebase auth is not configured. Set VITE_FIREBASE_* in frontend-react/.env and restart the dev server.');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!authReady || !auth) {
      throw new Error('Firebase auth is not configured. Set VITE_FIREBASE_* in frontend-react/.env and restart the dev server.');
    }
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    if (!authReady || !auth) {
      throw new Error('Firebase auth is not configured. Set VITE_FIREBASE_* in frontend-react/.env and restart the dev server.');
    }
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user profile exists in Supabase, create if not
    try {
      const profile = await getUserProfile(result.user.uid);
      if (!profile) {
        await createUserProfile({
          firebase_uid: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || 'User'
        });
      }
    } catch (error) {
      console.error('Failed to sync Google user with Supabase:', error);
    }
  };

  const value = {
    user,
    loading,
    authReady,
    signup,
    login,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
