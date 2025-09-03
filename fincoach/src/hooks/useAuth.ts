// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setReady(true); }), []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login timestamp in Firestore
    const userDocRef = doc(db, 'users', result.user.uid);
    await setDoc(userDocRef, {
      lastLoginAt: new Date()
    }, { merge: true });
    
    return result.user;
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    
    // Save user data to Firestore
    const userDocRef = doc(db, 'users', result.user.uid);
    await setDoc(userDocRef, {
      uid: result.user.uid,
      email: result.user.email,
      displayName: displayName,
      createdAt: new Date(),
      lastLoginAt: new Date()
    });
    
    return result.user;
  };

  const signOutUser = () => signOut(auth);

  const getUserData = async (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  };

  return { 
    user, 
    ready, 
    signIn, 
    signUp, 
    signOut: signOutUser,
    getUserData
  };
}