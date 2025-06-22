import { auth, db } from './firebase-config.js';
import { showNotification } from './ui.js';

let currentRoom = null;
let messagesListener = null;
let currentChatUser = null;

// Entrar em uma sala
async function joinRoom(roomId) {
    currentRoom = roomId;
    
    // Renderizar tela da sala
    renderRoomScreen(roomId);
    
    // Carregar mensagens
    loadRoomMessages(roomId);
    
    // Atualizar navegação
    document.getElementById('rooms-screen').classList.add('hidden');
    document.getElementById('room-screen').classList.remove('hidden');
}

function renderRoomScreen(roomId) {
    const roomScreen = document.getElementById('room-screen');
    
    const roomNames = {
        'geral': 'Sala Geral',
        'games': 'Sala Games',
        'tech': 'Sala Tech',
        'musica': 'Sala Música'
    };
    
    roomScreen.innerHTML = `
        <div class="flex flex-col h-full">
            <!-- Header da sala -->
            <div class="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <button onclick="backToRooms()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <div>
                        <h2 class="font-bold text-white">${roomNames[roomId] || roomId}</h2>
                        <p class="text-sm text-gray-400" id="room-user-count">0 usuários online</p>
                    </div>
                </div>
                <button onclick="showRoomUsers()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-users text-xl"></i>
                </button>
            </div>
            
            <!-- Área de mensagens -->
            <div id="room-messages" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
            
            <!-- Input de mensagem -->
            <div class="bg-gray-800 border-t border-gray-700 p-4">
                <div class="flex space-x-3">
                    <input id="room-message-input" type="text" placeholder="Digite sua mensagem..." 
                           class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button id="room-send-btn" onclick="sendRoomMessage()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Event listener para Enter
    document.getElementById('room-message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendRoomMessage();
        }
    });
}

// Carregar mensagens da sala
function loadRoomMessages(roomId) {
    if (messagesListener) {
        messagesListener();
    }
    
    const messagesRef = db.collection('rooms').doc(roomId).collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(50);
    
    messagesListener = messagesRef.onSnapshot((snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        renderRoomMessages(messages);
        scrollMessagesToBottom();
    });
}

function renderRoomMessages(messages) {
    const messagesContainer = document.getElementById('room-messages');
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400">Seja o primeiro a enviar uma mensagem!</p>
            </div>
        `;
        return;
    }
    
    const messagesHTML = messages.map(message => {
        const isOwn = message.userId === auth.currentUser?.uid;
        const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : '';
        
        // Aplicar efeitos do nome
        let nameClass = '';
        if (message.nameEffect && message.nameEffect !== 'none') {
            nameClass = `name-effect-${message.nameEffect}`;
        }
        
        // Aplicar banner do nome
        let nameWrapper = message.displayName;
        if (message.nameBanner && message.nameBanner !== 'none') {
            nameWrapper = `<div class="name-banner-${message.nameBanner}"><span class="user-name">${message.displayName}</span></div>`;
        } else if (nameClass) {
            nameWrapper = `<span class="${nameClass}">${message.displayName}</span>`;
        }
        
        return `
            <div class="message-item ${isOwn ? 'own-message' : ''}">
                <div class="flex items-start space-x-3">
                    <img src="${message.photoURL}" alt="${message.displayName}" class="w-8 h-8 rounded-full">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <div class="font-semibold ${nameClass}">${nameWrapper}</div>
                            <span class="text-xs text-gray-500">${time}</span>
                        </div>
                        <p class="text-gray-200">${message.text}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messagesHTML;
}

// Enviar mensagem na sala
async function sendRoomMessage() {
    const input = document.getElementById('room-message-input');
    const text = input.value.trim();
    
    if (!text || !currentRoom || !auth.currentUser) return;
    
    try {
        // Buscar dados atualizados do usuário
        const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
        const userData = userDoc.data();
        
        await db.collection('rooms').doc(currentRoom).collection('messages').add({
            text: text,
            userId: auth.currentUser.uid,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            nameEffect: userData.nameEffect || 'none',
            nameBanner: userData.nameBanner || 'none',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem', 'error');
    }
}

function scrollMessagesToBottom() {
    const messagesContainer = document.getElementById('room-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function backToRooms() {
    if (messagesListener) {
        messagesListener();
        messagesListener = null;
    }
    
    currentRoom = null;
    document.getElementById('rooms-screen').classList.remove('hidden');
    document.getElementById('room-screen').classList.add('hidden');
}

// Sistema de chat privado
function openPrivateChat(userId) {
    currentChatUser = userId;
    
    // Buscar dados do usuário
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            renderPrivateChat(userData);
            loadPrivateMessages(userId);
        }
    });
}

function renderPrivateChat(userData) {
    const chatScreen = document.getElementById('chat-screen');
    
    // Atualizar header do chat
    document.getElementById('chat-user-avatar').src = userData.photoURL;
    document.getElementById('chat-user-name').textContent = userData.displayName;
    document.getElementById('chat-user-status').textContent = userData.isOnline ? 'Online' : 'Offline';
    
    // Mostrar tela de chat
    chatScreen.classList.add('show');
    
    // Event listener para botão de voltar
    document.getElementById('back-to-main-btn').addEventListener('click', () => {
        chatScreen.classList.remove('show');
        currentChatUser = null;
    });
    
    // Event listener para enviar mensagem
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    
    chatInput.addEventListener('input', () => {
        sendBtn.disabled = !chatInput.value.trim();
    });
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPrivateMessage();
        }
    });
    
    sendBtn.addEventListener('click', sendPrivateMessage);
}

function loadPrivateMessages(userId) {
    const chatId = [auth.currentUser.uid, userId].sort().join('_');
    
    const messagesRef = db.collection('privateChats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(50);
    
    messagesRef.onSnapshot((snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        renderPrivateMessages(messages);
    });
}

function renderPrivateMessages(messages) {
    const messagesContainer = document.getElementById('chat-messages');
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400">Início da conversa</p>
            </div>
        `;
        return;
    }
    
    const messagesHTML = messages.map(message => {
        const isOwn = message.senderId === auth.currentUser?.uid;
        const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : '';
        
        return `
            <div class="message ${isOwn ? 'sent' : 'received'}">
                <p>${message.text}</p>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messagesHTML;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendPrivateMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text || !currentChatUser || !auth.currentUser) return;
    
    try {
        const chatId = [auth.currentUser.uid, currentChatUser].sort().join('_');
        
        await db.collection('privateChats').doc(chatId).collection('messages').add({
            text: text,
            senderId: auth.currentUser.uid,
            receiverId: currentChatUser,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        document.getElementById('chat-send-btn').disabled = true;
    } catch (error) {
        console.error('Erro ao enviar mensagem privada:', error);
        showNotification('Erro ao enviar mensagem', 'error');
    }
}

// Exportar funções para uso global
window.joinRoom = joinRoom;
window.backToRooms = backToRooms;
window.sendRoomMessage = sendRoomMessage;
window.openPrivateChat = openPrivateChat;

export {
    joinRoom,
    backToRooms,
    sendRoomMessage,
    openPrivateChat,
    currentRoom
};