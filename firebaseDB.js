import firebase from "firebase";

const firebaseConfigTesting = {
    apiKey: "AIzaSyDEjk6reCr1hdAOvKfOpRG_JqpSVIMC5c0",
    authDomain: "hairdresser-c7068.firebaseapp.com",
    databaseURL: "https://hairdresser-c7068.firebaseio.com",
    projectId: "hairdresser-c7068",
    storageBucket: "hairdresser-c7068.appspot.com",
    messagingSenderId: "741243961909",
    appId: "1:741243961909:web:a4563087c3a8fff41de77c",
    measurementId: "G-HXLKGSS5ES"
};

let firebaseConfig = {
    apiKey: "AIzaSyDmZc6M1hf0nT_A6klfwFEB_IrhmQnyfoo",
    authDomain: "thejobhuntinc-70120.firebaseapp.com",
    databaseURL: "https://thejobhuntinc-70120.firebaseio.com",
    projectId: "thejobhuntinc-70120",
    storageBucket: "thejobhuntinc-70120.appspot.com",
    messagingSenderId: "691705562088",
    appId: "1:691705562088:web:0e4ec3ae27ccefe525da5d",
    measurementId: "G-55YMNHDEBP"
};

let firebaseConfig3 = {
    apiKey: "AIzaSyBekBYiDu8qz4hcydS6hFSlTq9dehXIBs4",
    authDomain: "fir-test-a527c.firebaseapp.com",
    databaseURL: "https://fir-test-a527c.firebaseio.com",
    projectId: "fir-test-a527c",
    storageBucket: "fir-test-a527c.appspot.com",
    messagingSenderId: "287384582023",
    appId: "1:287384582023:web:2d169cc84fc9667a2fc522",
    measurementId: "G-6ZH57RS9YD"
};

firebaseConfig = firebaseConfigTesting;
// firebaseConfig = firebaseConfig3;

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
