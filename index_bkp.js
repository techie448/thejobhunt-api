const firebase = require("firebase");
const fetch = require("node-fetch");
const firebaseConfig = {
    apiKey: "AIzaSyDEjk6reCr1hdAOvKfOpRG_JqpSVIMC5c0",
    authDomain: "hairdresser-c7068.firebaseapp.com",
    databaseURL: "https://hairdresser-c7068.firebaseio.com",
    projectId: "hairdresser-c7068",
    storageBucket: "hairdresser-c7068.appspot.com",
    messagingSenderId: "741243961909",
    appId: "1:741243961909:web:a4563087c3a8fff41de77c",
    measurementId: "G-HXLKGSS5ES"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

const githubAPI = async () => {
    const req_url = "https://jobs.github.com/positions.json?page=";
    let resultSet = [];
    let count = 0;
    let result = [1];
    while(result.length>0){
        try {

            const res = await fetch(`${req_url}${count}`);
            result = await res.json();
            console.log(`fetched: ${result.length}`);
        } catch(err) {
            console.log(err);
            result = [];
        }
        resultSet.push(...result);
        console.log(`added: ${result.length}`);
        console.log(`resultSet: ${resultSet.length}`);
        console.log(`count: ${count}`);
        count++;
    }
    return resultSet;
};

githubAPI().then(res => {

    while(res.length>0){
        commit(res.slice(0,100));
    }
    const commit = (input) => {
        db.collection("github").doc("github").set(Object.assign({},input)).then(function(docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
            .catch(function(error) {
                console.error("Error adding document: ", error);
            });;
    }


})
