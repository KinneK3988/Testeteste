import { FIREBASE_CONFIG, appState } from './config.js';
import { UI } from './ui.js';
import { FirebaseService } from './firebaseService.js';

export const App = {
    init() {
        if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === "SUA_API_KEY") {
            UI.elements.loadingScreen.innerHTML = `<div class="text-center text-red-500 p-4"><h2 class="font-bold text-xl">Configuração Necessária</h2><p>Por favor, preencha suas credenciais no arquivo <strong>js/config.js</strong>.</p></div>`;
            return;
        }
        
        this.setupEventListeners();
        this.setupPWA();
        FirebaseService.init();

        // Observador para garantir que os ícones sejam sempre renderizados
        const observer = new MutationObserver(() => {
            UI.renderIcons();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Renderização inicial
        UI.renderIcons();
    },

    openChatRoom(chatId, chatName) {
        appState.currentChatId = chatId;
        UI.elements.chatRoomName.textContent = chatName;
        UI.showOverlay('chatRoom');
        FirebaseService.listenToMessages(chatId);
    },

    setupEventListeners() {
        const { elements } = UI;
        elements.navItems.forEach(button => button.addEventListener('click', () => UI.showTab(button.dataset.tab)));
        
        elements.backToListButton.addEventListener('click', () => {
            UI.hideOverlay('chatRoom');
            if (appState.unsubscribeMessages) appState.unsubscribeMessages();
            appState.currentChatId = null;
        });
        
        elements.messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = elements.messageInput.value.trim();
            if (text && appState.currentChatId) {
                elements.messageInput.value = '';
                await FirebaseService.sendMessage(appState.currentChatId, text);
            }
        });

        // Modais
        elements.newChatButton.addEventListener('click', () => elements.newChatModal.classList.remove('hidden'));
        elements.closeModalButton.addEventListener('click', () => elements.newChatModal.classList.add('hidden'));
        
        elements.notificationBell.addEventListener('click', () => elements.friendRequestsModal.classList.remove('hidden'));
        elements.closeFriendRequestsModalButton.addEventListener('click', () => elements.friendRequestsModal.classList.add('hidden'));
        
        elements.sendFriendRequestButton.addEventListener('click', async () => {
            const friendId = prompt("Digite o ID do usuário para adicionar como amigo:");
            if (friendId && friendId.trim() !== '' && friendId.trim() !== appState.currentUser.uid) {
                await FirebaseService.sendFriendRequest(friendId.trim());
                alert("Pedido de amizade enviado!");
                elements.newChatModal.classList.add('hidden');
            } else {
                alert("ID inválido ou você não pode adicionar a si mesmo.");
            }
        });
        
        // Modal de Perfil
        elements.profileButton.addEventListener('click', () => elements.profileModal.classList.remove('hidden'));
        elements.closeProfileModalButton.addEventListener('click', () => elements.profileModal.classList.add('hidden'));
    },
    
    setupPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('Service Worker registrado com sucesso:', registration.scope))
                    .catch(error => console.log('Falha no registro do Service Worker:', error));
            });
        }
    }
};

// **CORREÇÃO PRINCIPAL:**
// Garante que a função App.init() só seja chamada depois que todo o 
// documento HTML for completamente carregado e analisado.
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
