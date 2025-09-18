// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBy2arOOfKK5DNTMSX_Rg74oi4Tr-jlYBE",
  authDomain: "myfirstapp-f19b5.firebaseapp.com",
  projectId: "myfirstapp-f19b5",
  storageBucket: "myfirstapp-f19b5.appspot.com",
  messagingSenderId: "895959913801",
  appId: "1:895959913801:web:940442e6b6baaff08ff698"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
