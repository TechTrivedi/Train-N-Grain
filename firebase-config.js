/* ============================================================
   Firebase Configuration — Train N Grain
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCna7CYfw3CP753YU5vySYm0UztIlPFhKI",
    authDomain: "train-n-grain.firebaseapp.com",
    projectId: "train-n-grain",
    storageBucket: "train-n-grain.firebasestorage.app",
    messagingSenderId: "458340605075",
    appId: "1:458340605075:web:8ec027af94a109abc9c166"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export auth and database instances globally
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const db = firebase.firestore();
