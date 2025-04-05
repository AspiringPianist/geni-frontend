import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBASW7elHvgareyNTTpJ3ah5Zupfb7aCb4",
  authDomain: "tibby-teach.firebaseapp.com",
  projectId: "tibby-teach",
  storageBucket: "tibby-teach.firebasestorage.app",
  messagingSenderId: "1029758638073",
  appId: "1:1029758638073:web:b8f8fe5a5d8c0acec08f28",
  measurementId: "G-DPD63GZFJC"
};

const app = initializeApp(firebaseConfig);
export const googleProvider = new GoogleAuthProvider();
export const auth = getAuth(app);