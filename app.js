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
        if (UI.elements.chatRoomName) {
            UI.elements.chatRoomName.textContent = chatName;
        }
        UI.showOverlay('chatRoom');
        FirebaseService.listenToMessages(chatId);
    },

    setupEventListeners() {
        const { elements } = UI;
        
        // CORREÇÃO: Usar função segura para adicionar event listeners
        elements.navItems.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    UI.showTab(button.dataset.tab);
                    // Renderizar conteúdo específico da aba
                    this.handleTabChange(button.dataset.tab);
                });
            }
        });
        
        UI.safeAddEventListener(elements.backToListButton, 'click', () => {
            UI.hideOverlay('chatRoom');
            if (appState.unsubscribeMessages) appState.unsubscribeMessages();
            appState.currentChatId = null;
        });
        
        UI.safeAddEventListener(elements.messageForm, 'submit', async (e) => {
            e.preventDefault();
            const text = elements.messageInput?.value?.trim();
            if (text && appState.currentChatId) {
                if (elements.messageInput) elements.messageInput.value = '';
                await FirebaseService.sendMessage(appState.currentChatId, text);
            }
        });

        // Modais
        UI.safeAddEventListener(elements.newChatButton, 'click', () => {
            if (elements.newChatModal) elements.newChatModal.classList.remove('hidden');
        });
        
        UI.safeAddEventListener(elements.closeModalButton, 'click', () => {
            if (elements.newChatModal) elements.newChatModal.classList.add('hidden');
        });
        
        UI.safeAddEventListener(elements.notificationBell, 'click', () => {
            if (elements.friendRequestsModal) elements.friendRequestsModal.classList.remove('hidden');
        });
        
        UI.safeAddEventListener(elements.closeFriendRequestsModalButton, 'click', () => {
            if (elements.friendRequestsModal) elements.friendRequestsModal.classList.add('hidden');
        });
        
        UI.safeAddEventListener(elements.sendFriendRequestButton, 'click', async () => {
            const friendId = prompt("Digite o ID do usuário para adicionar como amigo:");
            if (friendId && friendId.trim() !== '' && friendId.trim() !== appState.currentUser?.uid) {
                await FirebaseService.sendFriendRequest(friendId.trim());
                alert("Pedido de amizade enviado!");
                if (elements.newChatModal) elements.newChatModal.classList.add('hidden');
            } else {
                alert("ID inválido ou você não pode adicionar a si mesmo.");
            }
        });
        
        // Modal de Perfil
        UI.safeAddEventListener(elements.profileButton, 'click', () => {
            if (elements.profileModal) elements.profileModal.classList.remove('hidden');
        });
        
        UI.safeAddEventListener(elements.closeProfileModalButton, 'click', () => {
            if (elements.profileModal) elements.profileModal.classList.add('hidden');
        });

        // Event listener para upload de foto de perfil
        UI.safeAddEventListener(elements.profilePictureInput, 'change', (e) => {
            const file = e.target.files[0];
            if (file) {
                FirebaseService.uploadProfilePicture(file);
            }
        });

        // Event listener para clicar na imagem do perfil para trocar
        UI.safeAddEventListener(elements.profileModalPicture, 'click', () => {
            if (elements.profilePictureInput) elements.profilePictureInput.click();
        });

        // Fechar modais clicando fora deles
        UI.safeAddEventListener(elements.newChatModal, 'click', (e) => {
            if (e.target === elements.newChatModal) {
                elements.newChatModal.classList.add('hidden');
            }
        });

        UI.safeAddEventListener(elements.friendRequestsModal, 'click', (e) => {
            if (e.target === elements.friendRequestsModal) {
                elements.friendRequestsModal.classList.add('hidden');
            }
        });

        UI.safeAddEventListener(elements.profileModal, 'click', (e) => {
            if (e.target === elements.profileModal) {
                elements.profileModal.classList.add('hidden');
            }
        });
    },

    handleTabChange(tabName) {
        switch(tabName) {
            case 'amigos':
                FirebaseService.loadFriendsList();
                break;
            case 'configuracao':
                UI.renderConfigTab();
                break;
            case 'salas':
                // Já está sendo gerenciado pelo listenToChatList
                break;
        }
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