// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2WOHr26pMQath9l3wnHtAfMH2dVP7rj4",
  authDomain: "chamama-forms.firebaseapp.com",
  projectId: "chamama-forms",
  storageBucket: "chamama-forms.firebasestorage.app",
  messagingSenderId: "957005949796",
  appId: "1:957005949796:web:db083a9257d517529f6871",
  measurementId: "G-2B6624CB2T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);