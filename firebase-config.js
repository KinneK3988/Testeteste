// Firebase Configuration - VERSÃO CORRIGIDA
const firebaseConfig = {
    apiKey: "AIzaSyCyidXzqqe-rrcF0QrBQ2iSIR_mf0tpMd0",
    authDomain: "seu-projeto-chat.firebaseapp.com",
    databaseURL: "https://seu-projeto-chat-default-rtdb.firebaseio.com",
    projectId: "seu-projeto-chat",
    storageBucket: "seu-projeto-chat.firebasestorage.app",
    messagingSenderId: "259194791953",
    appId: "1:259194791953:web:587ea979f1f26aff2629b0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const auth = firebase.auth();
const db = firebase.firestore();

console.log('🔥 Firebase inicializado com sucesso!');

// Exportar para uso em outros módulos
export { auth, db };