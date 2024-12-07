import React, { createContext, useState, useEffect, ReactNode } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

interface UserContextProps {
  user: User | null;
  userName: string | null;
  userEmail: string | null;
  photoURL: string | null;
}

export const UserContext = createContext<UserContextProps>({
  user: null,
  userName: null,
  userEmail: null,
  photoURL: null,
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserEmail(currentUser.email);
        setPhotoURL(currentUser.photoURL);

        const userDoc = doc(db, "users", currentUser.uid);
        const unsubscribeUser = onSnapshot(userDoc, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserName(data.displayName || null);
          } else {
            setUserName(null);
          }
        });

        return () => {
          unsubscribeUser();
        };
      } else {
        setUserEmail(null);
        setUserName(null);
        setPhotoURL(null);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  return (
    <UserContext.Provider value={{ user, userName, userEmail, photoURL }}>
      {children}
    </UserContext.Provider>
  );
};