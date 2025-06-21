import { initAuth, handleLogout } from './auth.js';
import ChatManager from './chat.js';
import { setupNotificationsListener, setupFriendsListener } from './friends.js';
import { renderAppLayout, injectAllModals, showNotification, updateNav } from './ui.js';

// --- VARIÁVEIS GLOBAIS DO APP ---
window.currentUserData = null; // Torna os dados do usuário acessíveis globalmente
let chatManager;
let activeListeners = [];

// --- FUNÇÕES DE CALLBACK DA AUTENTICAÇÃO ---
export function onLogin(user, userData) {
    window.currentUserData = userData;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    renderAppLayout(); // Renderiza a UI principal do app
    bindCoreUIEvents(); // Binda os eventos da UI principal
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
    cleanupListeners(); // Garante que não haja listeners duplicados

    const unsubNotifications = setupNotificationsListener(uid, (requests) => {
        // Lógica para renderizar as solicitações de amizade na UI
        console.log("Solicitações de amizade recebidas:", requests);
    });

    const unsubFriends = setupFriendsListener(uid, (friends) => {
        // Lógica para renderizar a lista de amigos
        console.log("Lista de amigos atualizada:", friends);
    });
    
    // Armazena as funções de unsubscribe para limpar depois
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
    
    // Evento de Logout (no modal de configurações)
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Outros eventos de modais devem ser adicionados aqui
}


// --- PONTO DE ENTRADA PRINCIPAL ---
function main() {
    console.log('🚀 Aplicação 7Chat iniciada...');
    
    // Injeta o HTML dos modais no container
    injectAllModals();

    // Inicia o módulo de autenticação, que controla o fluxo do app
    initAuth();
    
    // Inicia o gerenciador de conversas
    chatManager = new ChatManager();
    
    // Disponibiliza o chatManager globalmente para ser acessado por outros módulos se necessário
    window.chatManager = chatManager;
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', main);
