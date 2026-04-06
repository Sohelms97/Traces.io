import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type UserRole = 
  | 'admin' 
  | 'finance_manager' 
  | 'sales_executive' 
  | 'purchase_officer' 
  | 'warehouse_staff' 
  | 'investor_manager' 
  | 'traceability_officer' 
  | 'view_only';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          } else {
            // Check if a user was pre-created by email
            const emailDocRef = doc(db, 'users', user.email!);
            const emailDoc = await getDoc(emailDocRef);
            
            if (emailDoc.exists()) {
              const preData = emailDoc.data();
              const newRole = preData.role as UserRole;
              
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || preData.displayName || 'User',
                role: newRole,
                photoURL: user.photoURL || preData.photoURL || null,
                createdAt: serverTimestamp()
              });
              setRole(newRole);
              // Optional: delete the email-based document to clean up
              // await deleteDoc(emailDocRef);
            } else {
              // Default role for new users
              const isAdmin = user.email === 'sohelms97@gmail.com' || user.email === 'sohems97@gmail.com'; 
              const newRole: UserRole = isAdmin ? 'admin' : 'view_only';
              
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: newRole,
                createdAt: serverTimestamp()
              });
              setRole(newRole);
            }
          }
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error
        console.log("Login popup closed by user");
        return;
      }
      console.error("Login error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error("Login with email error:", error.code, error.message);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(user, { displayName: name });
      
      // The useEffect will handle the Firestore document creation
      const userDocRef = doc(db, 'users', user.uid);
      const isAdmin = email === 'sohelms97@gmail.com' || email === 'sohems97@gmail.com'; 
      const newRole: UserRole = isAdmin ? 'admin' : 'view_only';
      
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email,
        displayName: name,
        role: newRole,
        photoURL: null,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      setRole(newRole);
    } catch (error: any) {
      console.error("Registration error:", error.code, error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    role,
    loading,
    login,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
    isAdmin: role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
