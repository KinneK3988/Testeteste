import { App } from './app.js';
import { appState } from './config.js';
import { FirebaseService } from './firebaseService.js';

export const UI = {
    elements: {
        loadingScreen: document.getElementById('loading-screen'),
        mainScreen: document.getElementById('main-screen'),
        chatRoomScreen: document.getElementById('chat-room-screen'),
        
        chatListContainer: document.getElementById('chat-list-container'),
        messagesContainer: document.getElementById('messages-container'),
        messageForm: document.getElementById('message-form'),
        messageInput: document.getElementById('message-input'),
        backToListButton: document.getElementById('back-to-list-button'),
        
        newChatButton: document.getElementById('new-chat-button'),
        newChatModal: document.getElementById('new-chat-modal'),
        closeModalButton: document.getElementById('close-modal-button'),
        sendFriendRequestButton: document.getElementById('send-friend-request-button'),
        
        friendRequestsModal: document.getElementById('friend-requests-modal'),
        friendRequestsContainer: document.getElementById('friend-requests-container'),
        closeFriendRequestsModalButton: document.getElementById('close-friend-requests-modal-button'),

        noChatsMessage: document.getElementById('no-chats-message'),
        // CORREÇÃO: ID correto conforme o HTML
        chatRoomName: document.getElementById('chat-room-title'),
        chatRoomPicture: document.getElementById('chat-room-picture'),

        notificationBell: document.getElementById('notification-bell'),
        notificationBadge: document.getElementById('notification-badge'),
        profileButton: document.getElementById('profile-button'),
        profilePicture: document.getElementById('profile-picture'),
        
        profileModal: document.getElementById('profile-modal'),
        profileModalPicture: document.getElementById('profile-modal-picture'),
        closeProfileModalButton: document.getElementById('close-profile-modal-button'),
        profilePictureInput: document.getElementById('profile-picture-input'),

        navItems: document.querySelectorAll('.nav-item'),
        tabContents: {
            salas: document.getElementById('salas-tab-content'),
            amigos: document.getElementById('amigos-tab-content'),
            configuracao: document.getElementById('configuracao-tab-content')
        }
    },

    // Função para verificar se elementos existem antes de usar
    safeAddEventListener(element, event, callback) {
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, callback);
        } else {
            console.warn('Elemento não encontrado para evento:', event);
        }
    },

    // Função para forçar a renderização dos ícones
    renderIcons() {
        if (typeof lucide !== 'undefined' && lucide) {
            lucide.createIcons();
        }
    },
    
    showScreen(screenName) {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.mainScreen.classList.add('hidden');
        if (this.elements[screenName]) {
            this.elements[screenName].classList.remove('hidden');
            this.elements[screenName].classList.add('flex');
        }
        this.renderIcons();
    },

    showTab(tabName) {
        Object.values(this.elements.tabContents).forEach(content => {
            if (content) content.classList.add('hidden');
        });
        this.elements.navItems.forEach(item => {
            item.classList.remove('active', 'text-white');
            item.classList.add('text-gray-400');
        });
        if (this.elements.tabContents[tabName]) {
            this.elements.tabContents[tabName].classList.remove('hidden');
        }
        const activeButton = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active', 'text-white');
            activeButton.classList.remove('text-gray-400');
        }
        this.renderIcons();
    },
    
    showOverlay(screenName) {
        const element = this.elements[`${screenName}Screen`];
        if (element) {
            element.classList.remove('hidden');
            element.classList.add('flex');
        }
        this.renderIcons();
    },

    hideOverlay(screenName) {
        const element = this.elements[`${screenName}Screen`];
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('flex');
        }
        this.renderIcons();
    },
    
    renderFriendRequests(requests) {
        const container = this.elements.friendRequestsContainer;
        if (!container) return;
        
        container.innerHTML = '';
        if (requests.length === 0) {
            container.innerHTML = `<p class="text-gray-400 text-center">Nenhum pedido de amizade.</p>`;
            if (this.elements.notificationBadge) {
                this.elements.notificationBadge.classList.add('hidden');
            }
        } else {
            if (this.elements.notificationBadge) {
                this.elements.notificationBadge.classList.remove('hidden');
            }
            requests.forEach(req => {
                const requestEl = document.createElement('div');
                requestEl.className = 'flex items-center justify-between bg-gray-700/50 p-3 rounded-lg';
                requestEl.innerHTML = `
                    <span class="text-white">Pedido de: ${req.from.substring(0, 12)}...</span>
                    <div class="flex gap-2">
                        <button data-id="${req.id}" data-from="${req.from}" class="accept-request-btn p-2 bg-green-600 rounded-full hover:bg-green-500">
                            <i data-lucide="check" class="w-4 h-4 text-white"></i>
                        </button>
                        <button data-id="${req.id}" class="reject-request-btn p-2 bg-red-600 rounded-full hover:bg-red-500">
                            <i data-lucide="x" class="w-4 h-4 text-white"></i>
                        </button>
                    </div>
                `;
                container.appendChild(requestEl);
            });
            
            document.querySelectorAll('.accept-request-btn').forEach(btn => {
                btn.addEventListener('click', (e) => FirebaseService.acceptFriendRequest(e.currentTarget.dataset.id, e.currentTarget.dataset.from));
            });
            document.querySelectorAll('.reject-request-btn').forEach(btn => {
                btn.addEventListener('click', (e) => FirebaseService.rejectFriendRequest(e.currentTarget.dataset.id));
            });
        }
        this.renderIcons();
    },

    updateProfilePicture(url) {
        if (appState.currentUser) {
            const placeholder = `https://placehold.co/40x40/7c3aed/ffffff?text=${appState.currentUser.uid.charAt(0).toUpperCase()}`;
            if (this.elements.profilePicture) {
                this.elements.profilePicture.src = url || placeholder;
            }
            if (this.elements.profileModalPicture) {
                this.elements.profileModalPicture.src = url || placeholder.replace('40x40', '256x256');
            }
        }
    },

    renderChatList(chats) {
        const container = this.elements.chatListContainer;
        if (!container) return;
        
        container.innerHTML = '';
        if (chats.length === 0) {
            if (this.elements.noChatsMessage) {
                this.elements.noChatsMessage.classList.remove('hidden');
            }
        } else {
            if (this.elements.noChatsMessage) {
                this.elements.noChatsMessage.classList.add('hidden');
            }
            chats.forEach(chat => {
                const otherUserId = chat.members.find(id => id !== appState.currentUser.uid) || appState.currentUser.uid;
                let chatName = chat.name || `Conversa com ${otherUserId.substring(0, 8)}...`;
                let lastMessageText = chat.lastMessage?.text || "Nenhuma mensagem ainda.";
                
                const chatElement = document.createElement('div');
                chatElement.className = "flex items-center p-3 m-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors";
                chatElement.innerHTML = `
                    <img src="https://placehold.co/52x52/7c3aed/ffffff?text=${chatName.charAt(0).toUpperCase()}" class="w-12 h-12 rounded-full mr-4">
                    <div class="flex-grow overflow-hidden">
                        <p class="font-semibold truncate text-gray-200">${chatName}</p>
                        <p class="text-sm text-gray-400 truncate">${lastMessageText}</p>
                    </div>`;
                chatElement.addEventListener('click', () => App.openChatRoom(chat.id, chatName));
                container.appendChild(chatElement);
            });
        }
        this.renderIcons();
    },

    renderMessages(messages) {
        if (!this.elements.messagesContainer) return;
        
        this.elements.messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const isMe = msg.senderId === appState.currentUser.uid;
            const text = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`;
            const messageBubble = `<div class="max-w-xs md:max-w-md p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-[#2a2d37] text-gray-200 rounded-bl-lg'}">${text}</div>`;
            messageWrapper.innerHTML = isMe ? messageBubble : `<img src="https://placehold.co/32x32/a78bfa/ffffff?text=O" class="w-8 h-8 rounded-full"> ${messageBubble}`;
            this.elements.messagesContainer.appendChild(messageWrapper);
        });
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    },

    // Função para renderizar a aba de amigos
    renderFriendsList(friends) {
        const friendsContent = this.elements.tabContents.amigos;
        if (!friendsContent) return;
        
        friendsContent.innerHTML = '';
        if (friends.length === 0) {
            friendsContent.innerHTML = `
                <div class="text-center text-gray-500 mt-20 px-4">
                    <i data-lucide="users" class="w-16 h-16 mx-auto mb-4 opacity-50"></i>
                    <p class="text-lg mb-2">Nenhum amigo ainda</p>
                    <p class="text-sm">Adicione amigos para começar a conversar!</p>
                </div>
            `;
        } else {
            const friendsList = document.createElement('div');
            friendsList.className = 'p-2';
            friends.forEach(friend => {
                const friendElement = document.createElement('div');
                friendElement.className = 'flex items-center p-3 m-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors';
                friendElement.innerHTML = `
                    <img src="https://placehold.co/52x52/7c3aed/ffffff?text=${friend.uid.charAt(0).toUpperCase()}" class="w-12 h-12 rounded-full mr-4">
                    <div class="flex-grow overflow-hidden">
                        <p class="font-semibold truncate text-gray-200">${friend.uid.substring(0, 20)}...</p>
                        <p class="text-sm text-gray-400 truncate">${friend.status || 'Disponível'}</p>
                    </div>
                `;
                friendElement.addEventListener('click', () => {
                    // Criar ou abrir chat privado com o amigo
                    FirebaseService.createPrivateChat(friend.uid);
                });
                friendsList.appendChild(friendElement);
            });
            friendsContent.appendChild(friendsList);
        }
        this.renderIcons();
    },

    // Função para renderizar a aba de configurações
    renderConfigTab() {
        const configContent = this.elements.tabContents.configuracao;
        if (!configContent) return;
        
        configContent.innerHTML = `
            <div class="p-4 space-y-6">
                <div class="text-center mb-6">
                    <img id="config-profile-picture" src="${this.elements.profilePicture?.src || 'https://placehold.co/128x128/7c3aed/ffffff?text=U'}" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-500">
                    <h3 class="text-xl font-bold text-white">Meu Perfil</h3>
                    <p class="text-gray-400 text-sm">${appState.currentUser?.uid || 'Usuário'}</p>
                </div>
                
                <div class="space-y-4">
                    <button id="change-profile-picture-btn" class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="camera" class="w-5 h-5"></i>
                        <span>Alterar Foto do Perfil</span>
                    </button>
                    
                    <button id="copy-user-id-btn" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="copy" class="w-5 h-5"></i>
                        <span>Copiar Meu ID</span>
                    </button>
                    
                    <div class="border-t border-gray-700 pt-4">
                        <h4 class="text-lg font-semibold text-white mb-3">Configurações</h4>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-300">Notificações</span>
                                <button class="toggle-btn bg-indigo-600 w-12 h-6 rounded-full relative">
                                    <div class="toggle-dot bg-white w-5 h-5 rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                                </button>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-300">Som</span>
                                <button class="toggle-btn bg-indigo-600 w-12 h-6 rounded-full relative">
                                    <div class="toggle-dot bg-white w-5 h-5 rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event listeners para a aba de configuração
        const changePictureBtn = document.getElementById('change-profile-picture-btn');
        const copyIdBtn = document.getElementById('copy-user-id-btn');
        
        if (changePictureBtn) {
            changePictureBtn.addEventListener('click', () => {
                if (this.elements.profilePictureInput) {
                    this.elements.profilePictureInput.click();
                }
            });
        }
        
        if (copyIdBtn) {
            copyIdBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(appState.currentUser.uid);
                    alert('ID copiado para a área de transferência!');
                } catch (err) {
                    console.error('Erro ao copiar ID:', err);
                    alert('Erro ao copiar ID');
                }
            });
        }
        
        this.renderIcons();
    }
};