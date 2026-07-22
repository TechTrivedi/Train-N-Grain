import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCna7CYfw3CP753YU5vySYm0UztIlPFhKI",
    authDomain: "train-n-grain.firebaseapp.com",
    projectId: "train-n-grain",
    storageBucket: "train-n-grain.firebasestorage.app",
    messagingSenderId: "458340605075",
    appId: "1:458340605075:web:8ec027af94a109abc9c166"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
