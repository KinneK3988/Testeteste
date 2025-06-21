import { db, fieldValue, auth } from './firebase-config.js';

class ChatManager {
    constructor() {
        this.currentConversationId = null;
        this.unsubscribeMessages = null;
        this.chatScreenEl = document.getElementById('chat-screen');
    }

    // Abre a tela de chat para uma conversa específica
    async openChat(targetUserId, targetUserData) {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Cria um ID de conversa consistente entre os dois usuários
        this.currentConversationId = [currentUser.uid, targetUserId].sort().join('_');
        
        // Renderiza a interface do chat
        this.renderChatScreen(targetUserData);
        this.chatScreenEl.classList.add('show');
        
        // Começa a escutar por novas mensagens em tempo real
        this.listenForMessages();
    }

    // Renderiza a estrutura da tela de chat
    renderChatScreen(targetUserData) {
        const { username, photoURL, status } = targetUserData;
        this.chatScreenEl.innerHTML = `
            <header class="chat-header flex items-center">
                <button id="back-to-conversations-btn" class="w-10 h-10 flex items-center justify-center"><i class="fas fa-arrow-left text-xl"></i></button>
                <img src="${photoURL || `https://placehold.co/40x40/4f46e5/ffffff?text=${username.charAt(0)}`}" class="w-10 h-10 rounded-full object-cover ml-2">
                <div class="ml-3">
                    <h3 class="font-bold text-white">${username}</h3>
                    <p class="text-sm text-gray-400 capitalize">${status}</p>
                </div>
            </header>
            <div id="chat-messages" class="chat-messages"></div>
            <div class="chat-input-container">
                <textarea id="chat-input" placeholder="Digite uma mensagem..." rows="1"></textarea>
                <button id="chat-send-btn" class="chat-send-btn" disabled><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        this.addChatEventListeners();
    }
    
    addChatEventListeners() {
        document.getElementById('back-to-conversations-btn').addEventListener('click', () => this.closeChat());
        document.getElementById('chat-send-btn').addEventListener('click', () => this.sendMessage());
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('input', () => {
            document.getElementById('chat-send-btn').disabled = !chatInput.value.trim();
        });
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    // Escuta por mensagens na subcoleção do Firestore
    listenForMessages() {
        if (this.unsubscribeMessages) this.unsubscribeMessages(); // Cancela listener anterior

        const messagesRef = db.collection('conversations')
                              .doc(this.currentConversationId)
                              .collection('messages')
                              .orderBy('timestamp', 'desc')
                              .limit(50);
        
        this.unsubscribeMessages = messagesRef.onSnapshot(snapshot => {
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.innerHTML = ''; // Limpa antes de renderizar
            snapshot.docs.forEach(doc => {
                this.renderMessage(doc.data());
            });
        });
    }
    
    // Renderiza uma única mensagem ou grupo de mensagens
    renderMessage(msgData) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const currentUser = auth.currentUser;
        const isSent = msgData.senderId === currentUser.uid;

        const messageGroup = document.createElement('div');
        messageGroup.className = `message-group ${isSent ? 'sent' : 'received'}`;
        
        // Adicionar avatar apenas para mensagens recebidas
        if (!isSent) {
             messageGroup.innerHTML += `<img src="${msgData.senderAvatar || `https://placehold.co/32x32/78716c/ffffff?text=${msgData.senderName.charAt(0)}`}" class="message-avatar">`;
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = msgData.text;
        
        messageGroup.appendChild(bubble);
        messagesContainer.appendChild(messageGroup);
    }

    // Envia a mensagem para o Firestore
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !this.currentConversationId) return;

        const currentUser = auth.currentUser;
        const userProfile = window.currentUserData; // Pega os dados do usuário do escopo global do app

        const messageData = {
            text: text,
            senderId: currentUser.uid,
            senderName: userProfile.username,
            senderAvatar: userProfile.photoURL,
            timestamp: fieldValue.serverTimestamp()
        };

        // Adiciona a mensagem na subcoleção
        await db.collection('conversations').doc(this.currentConversationId).collection('messages').add(messageData);
        
        // Atualiza os metadados da conversa principal
        await db.collection('conversations').doc(this.currentConversationId).set({
            lastMessage: text,
            lastUpdate: fieldValue.serverTimestamp(),
            participants: this.currentConversationId.split('_')
        }, { merge: true });

        input.value = '';
        input.focus();
        document.getElementById('chat-send-btn').disabled = true;
    }

    // Fecha a tela de chat e cancela o listener
    closeChat() {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
            this.unsubscribeMessages = null;
        }
        this.chatScreenEl.classList.remove('show');
        this.currentConversationId = null;
    }
}

export default ChatManager;
