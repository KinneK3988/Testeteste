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
        chatRoomName: document.getElementById('chat-room-name'),
        chatRoomPicture: document.getElementById('chat-room-picture'),

        notificationBell: document.getElementById('notification-bell'),
        notificationBadge: document.getElementById('notification-badge'),
        profileButton: document.getElementById('profile-button'),
        profilePicture: document.getElementById('profile-picture'),
        
        profileModal: document.getElementById('profile-modal'),
        profileModalPicture: document.getElementById('profile-modal-picture'),
        profileModalName: document.getElementById('profile-modal-name'),
        closeProfileModalButton: document.getElementById('close-profile-modal-button'),
        changePictureButton: document.getElementById('change-picture-button'),
        profilePictureInput: document.getElementById('profile-picture-input'),

        navItems: document.querySelectorAll('.nav-item'),
        tabContents: {
            salas: document.getElementById('salas-tab-content'),
            amigos: document.getElementById('amigos-tab-content'),
            configuracao: document.getElementById('configuracao-tab-content')
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
        Object.values(this.elements.tabContents).forEach(content => content.classList.add('hidden'));
        this.elements.navItems.forEach(item => {
            item.classList.remove('active', 'text-white');
            item.classList.add('text-gray-400');
        });
        this.elements.tabContents[tabName].classList.remove('hidden');
        const activeButton = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        activeButton.classList.add('active', 'text-white');
        activeButton.classList.remove('text-gray-400');
        this.renderIcons();
    },
    
    showOverlay(screenName) {
        if (this.elements[`${screenName}Screen`]) {
            this.elements[`${screenName}Screen`].classList.remove('hidden');
            this.elements[`${screenName}Screen`].classList.add('flex');
        }
        this.renderIcons();
    },

    hideOverlay(screenName) {
         if (this.elements[`${screenName}Screen`]) {
            this.elements[`${screenName}Screen`].classList.add('hidden');
            this.elements[`${screenName}Screen`].classList.remove('flex');
        }
    },
    
    renderFriendRequests(requests) {
        const container = this.elements.friendRequestsContainer;
        container.innerHTML = '';
        if (requests.length === 0) {
            container.innerHTML = `<p class="text-gray-400 text-center">Nenhum pedido de amizade.</p>`;
            this.elements.notificationBadge.classList.add('hidden');
        } else {
            this.elements.notificationBadge.classList.remove('hidden');
            requests.forEach(req => {
                const requestEl = document.createElement('div');
                requestEl.className = 'flex items-center justify-between bg-gray-700/50 p-3 rounded-lg';
                requestEl.innerHTML = `
                    <span class="text-white">Pedido de: ${req.from.substring(0, 12)}...</span>
                    <div class="flex gap-2">
                        <button data-id="${req.id}" data-from="${req.from}" class="accept-request-btn p-2 bg-green-600 rounded-full hover:bg-green-500"><i data-lucide="check" class="w-4 h-4 text-white"></i></button>
                        <button data-id="${req.id}" class="reject-request-btn p-2 bg-red-600 rounded-full hover:bg-red-500"><i data-lucide="x" class="w-4 h-4 text-white"></i></button>
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
            this.elements.profilePicture.src = url || placeholder;
            this.elements.profileModalPicture.src = url || placeholder.replace('40x40', '128x128');
        }
    },

    renderChatList(chats) {
        const container = this.elements.chatListContainer;
        container.innerHTML = '';
        if (chats.length === 0) {
            this.elements.noChatsMessage.classList.remove('hidden');
        } else {
            this.elements.noChatsMessage.classList.add('hidden');
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
};