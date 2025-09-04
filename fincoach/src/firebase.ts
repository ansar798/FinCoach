// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBny4WEiQKjTP48xuAAfLFOPwOpAxolQsg",
  authDomain: "fincoach-ecb70.firebaseapp.com",
  projectId: "fincoach-ecb70",
  storageBucket: "fincoach-ecb70.firebasestorage.app",
  messagingSenderId: "1022739648343",
  appId: "1:1022739648343:web:48195c031a87e4aa503812"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);