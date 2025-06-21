// ATENÇÃO: Suas credenciais do Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyCyidXzqqe-rrcF0QrBQ2iSIR_mf0tpMd0",
    authDomain: "seu-projeto-chat.firebaseapp.com",
    databaseURL: "https://seu-projeto-chat-default-rtdb.firebaseio.com",
    projectId: "seu-projeto-chat",
    storageBucket: "seu-projeto-chat.firebasestorage.app",
    messagingSenderId: "259194791953",
    appId: "1:259194791953:web:587ea979f1f26aff2629b0"
};

// CORREÇÃO: Pega a referência ao objeto 'firebase' global ANTES de qualquer outra coisa.
// Isso garante que ele esteja definido dentro do escopo deste módulo.
const firebase = window.firebase;

// Agora, inicializa o app usando a referência que acabamos de pegar.
try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    // Evita erro caso o app já tenha sido inicializado (útil para recarregamento em desenvolvimento)
    if (!/already exists/.test(e.message)) {
        console.error("Erro ao inicializar o Firebase.", e);
    }
}

// Inicializa os serviços usando a referência local 'firebase'.
const auth = firebase.auth();
const db = firebase.firestore();
const fieldValue = firebase.firestore.FieldValue;

console.log('🔥 Firebase inicializado com sucesso!');

// Exporta tudo. Agora a variável 'firebase' está corretamente definida e pode ser exportada.
export { auth, db, fieldValue, firebase };
