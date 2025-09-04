// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYQfltkDCGJvCgtgCNzVfyA5nUJy5KNNc",
  authDomain: "chamama-addfd.firebaseapp.com",
  projectId: "chamama-addfd",
  storageBucket: "chamama-addfd.firebasestorage.app",
  messagingSenderId: "542858138442",
  appId: "1:542858138442:web:abe34a5d9cccf70af5e7b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);