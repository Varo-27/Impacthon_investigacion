import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Claves de la base de datos Extraídas desde Firebase Console (Proyecto: impacthon-4c3bc)
const firebaseConfig = {
  apiKey: "AIzaSyB6ptL_Jh30a6HrRdJImG_q0hLOzwcJNx0",
  authDomain: "impacthon-4c3bc.firebaseapp.com",
  projectId: "impacthon-4c3bc",
  storageBucket: "impacthon-4c3bc.firebasestorage.app",
  messagingSenderId: "6849588883",
  appId: "1:6849588883:web:fb2e52176c4d3cb9d0e766"
};

// Inicializamos el motor de Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la Base de Datos, la Auth y el Provider de Google
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

