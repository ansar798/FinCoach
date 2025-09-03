// src/hooks/useUserData.ts
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export function useUserData(uid?: string) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUserData(null);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date()
        });
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { userData, loading };
}
