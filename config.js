// 1. COLE AQUI O OBJETO DE CONFIGURAÇÃO DO SEU PROJETO FIREBASE
// Encontre isso nas configurações do seu projeto no console do Firebase.
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCyidXzqqe-rrcF0QrBQ2iSIR_mf0tpMd0",
  authDomain: "seu-projeto-chat.firebaseapp.com",
  projectId: "seu-projeto-chat",
  storageBucket: "seu-projeto-chat.firebasestorage.app",
  messagingSenderId: "259194791953",
  appId: "1:259194791953:web:587ea979f1f26aff2629b0"
};

// Objeto para manter o estado global do aplicativo
export const appState = {
    currentUser: null,
    currentChatId: null,
    unsubscribeChatList: null,
    unsubscribeMessages: null,
};

// Token de autenticação inicial (se fornecido pelo ambiente)
export const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
