importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBRSDeWQ74OPndJaGoMPVzaJMW-707x2k8",
  authDomain: "doces-da-rosa.firebaseapp.com",
  projectId: "doces-da-rosa",
  storageBucket: "doces-da-rosa.firebasestorage.app",
  messagingSenderId: "758761602176",
  appId: "1:758761602176:web:6df2c1d969441714ee3a65"
});

const messaging = firebase.messaging();