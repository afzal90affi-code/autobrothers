// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBg1olFoXaoMPUntoihiYcQohFyiBC73Xc",
  authDomain: "autobrothers-affi.firebaseapp.com",
  projectId: "autobrothers-affi",
  storageBucket: "autobrothers-affi.firebasestorage.app",
  messagingSenderId: "1007079647846",
  appId: "1:1007079647846:web:9b8f58fecb07434d919ba7"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);