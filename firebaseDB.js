import firebase from "firebase";
const firebaseConfig = {
    apiKey: "AIzaSyDmZc6M1hf0nT_A6klfwFEB_IrhmQnyfoo",
    authDomain: "thejobhuntinc-70120.firebaseapp.com",
    databaseURL: "https://thejobhuntinc-70120.firebaseio.com",
    projectId: "thejobhuntinc-70120",
    storageBucket: "thejobhuntinc-70120.appspot.com",
    messagingSenderId: "691705562088",
    appId: "1:691705562088:web:0e4ec3ae27ccefe525da5d",
    measurementId: "G-55YMNHDEBP"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
