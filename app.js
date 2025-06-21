import { initAuth, handleLogout } from './auth.js';
import ChatManager from './chat.js';
import { setupNotificationsListener, setupFriendsListener } from './friends.js';
import { renderAppLayout, injectAllModals, showNotification, updateNav, updateUserInterface } from './ui.js';

// --- VARIÁVEIS GLOBAIS DO APP ---
window.currentUserData = null;
let chatManager;
let activeListeners = [];

// --- FUNÇÕES DE CALLBACK DA AUTENTICAÇÃO ---
export function onLogin(user, userData) {
    window.currentUserData = userData;
    document.getElementById('login-screen').classList.add('hidden');
    const mainApp = document.getElementById('main-app');
    mainApp.classList.remove('hidden');
    
    // Renderiza a UI e binda os eventos
    renderAppLayout();
    injectAllModals();
    bindCoreUIEvents();
    updateUserInterface(userData); // Atualiza a UI com os dados do usuário
    
    setupRealtimeServices(user.uid);
}

export function onLogout() {
    window.currentUserData = null;
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    cleanupListeners();
}

// --- CONFIGURAÇÃO DE SERVIÇOS EM TEMPO REAL ---
function setupRealtimeServices(uid) {
    cleanupListeners();
    
    const unsubNotifications = setupNotificationsListener(uid, (requests) => {
        console.log("Solicitações de amizade:", requests);
        // Aqui você chamaria uma função para renderizar 'requests' na UI
    });

    const unsubFriends = setupFriendsListener(uid, (friends) => {
        console.log("Lista de amigos:", friends);
        // Aqui você chamaria uma função para renderizar 'friends' na UI
    });
    
    activeListeners.push(unsubNotifications, unsubFriends);
}

function cleanupListeners() {
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = [];
    console.log('Listeners em tempo real limpos.');
}

// --- EVENTOS DA INTERFACE ---
function bindCoreUIEvents() {
    // Navegação Principal
    const navRoomsBtn = document.getElementById('nav-rooms');
    const navFriendsBtn = document.getElementById('nav-friends');
    const navSettingsBtn = document.getElementById('nav-settings');

    navRoomsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('rooms-screen').classList.remove('hidden');
        document.getElementById('friends-screen').classList.add('hidden');
        updateNav('nav-rooms');
    });

    navFriendsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('rooms-screen').classList.add('hidden');
        document.getElementById('friends-screen').classList.remove('hidden');
        updateNav('nav-friends');
    });

    navSettingsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('settings-modal')?.classList.remove('hidden');
    });

    // Logout e fechamento de modais
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Adiciona um listener genérico para fechar modais
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('[data-close-modal]')) {
            const modalId = e.target.getAttribute('data-close-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    });
}


// --- PONTO DE ENTRADA PRINCIPAL ---
function main() {
    console.log('🚀 Aplicação 7Chat iniciada...');
    
    // Inicia o módulo de autenticação
    initAuth();
    
    // Inicia o gerenciador de conversas
    chatManager = new ChatManager();
    window.chatManager = chatManager; // Torna acessível globalmente
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', main);
