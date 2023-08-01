importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyCd60UFFYe84cewoEiJNdKpsSL4PCkJntc",
    authDomain: "mywebapp-3ad6b.firebaseapp.com",
    projectId: "mywebapp-3ad6b",
    storageBucket: "mywebapp-3ad6b.appspot.com",
    messagingSenderId: "1075307155396",
    appId: "1:1075307155396:web:560df4a639f3206c7cde91"
  };

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();