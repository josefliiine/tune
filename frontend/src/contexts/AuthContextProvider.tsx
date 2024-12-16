import React, {
  createContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { auth } from "../services/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  User,
  UserCredential,
} from "firebase/auth";
import { db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

interface AuthContextType {
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  currentUser: User | null;
  reloadUser: () => boolean;
  setEmail: (email: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  userEmail: string | null;
  userId: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const login = (email: string, password: string): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = (): Promise<void> => {
    return signOut(auth);
  };

  const reloadUser = (): boolean => {
    if (!currentUser) return false;
    setUserEmail(currentUser.email);
    setUserId(currentUser.uid);
    return true;
  };

  const resetPassword = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email, {
      url: window.location.origin + "/login",
    });
  };

  const setEmail = (email: string): Promise<void> => {
    if (!currentUser)
      throw new Error("Log in to change your e-mail");
    return updateEmail(currentUser, email);
  };

  const setPassword = (password: string): Promise<void> => {
    if (!currentUser)
      throw new Error("Log in to change your password");
    return updatePassword(currentUser, password);
  };

  const signup = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const userRef = doc(db, "users", user.uid);

    await setDoc(userRef, {
      email: user.email,
    });

    return userCredential;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setUserEmail(user.email);
        setUserId(user.uid);
      } else {
        setUserEmail(null);
        setUserId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        reloadUser,
        resetPassword,
        setEmail,
        setPassword,
        signup,
        userEmail,
        userId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;