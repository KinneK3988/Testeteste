import { auth, db } from './firebase-config.js';

// Variáveis globais
let currentUser = null;
let unsubscribeAuth = null;

// --- FUNÇÕES AUXILIARES ---
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notification-toast');
    toast.textContent = message;
    toast.className = `fixed bottom-5 right-5 py-2 px-4 rounded-lg shadow-xl z-[101] ${
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showCustomPrompt(title, message) {
    return new Promise((resolve) => {
        const response = prompt(`${title}\n\n${message}`);
        resolve(response);
    });
}

function showCustomConfirm(title, message) {
    return new Promise((resolve) => {
        const response = confirm(`${title}\n\n${message}`);
        resolve(response);
    });
}

// Função para gerar nome único
function generateGuestName() {
    const adjectives = ['Incrível', 'Fantástico', 'Brilhante', 'Épico', 'Mágico', 'Corajoso', 'Sábio', 'Veloz'];
    const nouns = ['Guerreiro', 'Mago', 'Ninja', 'Dragão', 'Fênix', 'Lobo', 'Águia', 'Leão'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${adjective}${noun}${number}`;
}

// Função para upload de imagem
function uploadPhoto() {
    const input = document.getElementById('photo-upload-input');
    input.click();
    
    input.onchange = function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentUser.photoURL = e.target.result;
                updateUserProfile();
                showNotification('Foto atualizada com sucesso!');
            };
            reader.readAsDataURL(file);
        }
    };
}

// Função para atualizar perfil do usuário
async function updateUserProfile() {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            status: currentUser.status,
            nameEffect: currentUser.nameEffect || 'none',
            nameBanner: currentUser.nameBanner || 'none'
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
    }
}

// Renderizar tela principal - NOVA VERSÃO COM TELA DE CHATS
function renderMainApp() {
    const appContent = document.getElementById('app-content');
    const bottomNav = document.getElementById('bottom-nav');
    
    // Tela principal será a de Chats
    appContent.innerHTML = `
        <!-- Tela de Chats (Principal) -->
        <div id="chats-screen" class="h-full flex flex-col">
            <!-- Header com notificação e perfil -->
            <div class="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                <button onclick="openNotifications()" class="text-gray-400 hover:text-white relative">
                    <i class="fas fa-bell text-xl"></i>
                    <div id="notifications-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</div>
                </button>
                <h1 class="text-xl font-bold text-white">Chats</h1>
                <button onclick="openSettings()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-user-circle text-xl"></i>
                </button>
            </div>
            
            <!-- Barra de busca -->
            <div class="p-4">
                <div class="relative">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input id="chat-search-input" type="text" placeholder="Buscar" 
                           class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           onclick="openGlobalSearch()">
                </div>
            </div>
            
            <!-- Lista de conversas -->
            <div id="conversations-list" class="flex-1 overflow-y-auto">
                <!-- Estado inicial sem conversas -->
                <div class="flex flex-col items-center justify-center h-full px-8 text-center">
                    <div class="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <i class="fas fa-comments text-3xl text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">Nenhuma conversa ainda</h3>
                    <p class="text-gray-400 mb-6">Adicione amigos ou crie salas para começar</p>
                    <button onclick="openGlobalSearch()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">
                        Encontrar pessoas
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Tela de Salas (oculta inicialmente) -->
        <div id="rooms-screen" class="hidden h-full flex flex-col">
            <div class="bg-gray-800 border-b border-gray-700 p-4">
                <h1 class="text-xl font-bold text-white text-center">Salas</h1>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                <div class="space-y-3">
                    <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" onclick="joinRoom('geral')">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-white">Sala Geral</h3>
                                <p class="text-sm text-gray-400">Converse sobre tudo</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span class="text-sm text-gray-400" id="geral-count">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" onclick="joinRoom('games')">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-white">Sala Games</h3>
                                <p class="text-sm text-gray-400">Para gamers</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span class="text-sm text-gray-400" id="games-count">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" onclick="joinRoom('tech')">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-white">Sala Tech</h3>
                                <p class="text-sm text-gray-400">Tecnologia e programação</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span class="text-sm text-gray-400" id="tech-count">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors" onclick="joinRoom('musica')">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold text-white">Sala Música</h3>
                                <p class="text-sm text-gray-400">Compartilhe seus gostos musicais</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span class="text-sm text-gray-400" id="musica-count">0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tela de Amigos (oculta inicialmente) -->
        <div id="friends-screen" class="hidden h-full flex flex-col">
            <!-- Conteúdo da tela de amigos será renderizado aqui -->
        </div>
        
        <!-- Tela de Sala específica (oculta inicialmente) -->
        <div id="room-screen" class="hidden h-full flex flex-col">
            <!-- Conteúdo da sala será renderizado aqui -->
        </div>
    `;
    
    // Navegação inferior atualizada
    bottomNav.innerHTML = `
        <div class="bg-gray-800 border-t border-gray-700 px-4 py-2 flex justify-around">
            <button id="nav-friends" class="flex flex-col items-center p-2 text-gray-400" onclick="showFriendsScreen()">
                <i class="fas fa-users text-xl mb-1"></i>
                <span class="text-xs">Amigos</span>
            </button>
            <button id="nav-chats" class="flex flex-col items-center p-2 text-blue-400" onclick="showChatsScreen()">
                <i class="fas fa-comments text-xl mb-1"></i>
                <span class="text-xs">Chats</span>
            </button>
            <button id="nav-settings" class="flex flex-col items-center p-2 text-gray-400" onclick="openSettings()">
                <i class="fas fa-cog text-xl mb-1"></i>
                <span class="text-xs">Configuração</span>
            </button>
        </div>
    `;
    
    // Mostrar tela de chats por padrão
    showChatsScreen();
    
    // Carregar conversas existentes
    loadConversations();
}

// Navegação entre telas
function showChatsScreen() {
    document.getElementById('chats-screen').classList.remove('hidden');
    document.getElementById('friends-screen').classList.add('hidden');
    document.getElementById('rooms-screen').classList.add('hidden');
    document.getElementById('room-screen').classList.add('hidden');
    updateNavigation('chats');
    loadConversations();
}

function showFriendsScreen() {
    document.getElementById('chats-screen').classList.add('hidden');
    document.getElementById('friends-screen').classList.remove('hidden');
    document.getElementById('rooms-screen').classList.add('hidden');
    document.getElementById('room-screen').classList.add('hidden');
    updateNavigation('friends');
    renderFriendsScreen();
}

function showRoomsScreen() {
    document.getElementById('chats-screen').classList.add('hidden');
    document.getElementById('friends-screen').classList.add('hidden');
    document.getElementById('rooms-screen').classList.remove('hidden');
    document.getElementById('room-screen').classList.add('hidden');
    updateNavigation('rooms');
}

function updateNavigation(active) {
    const navButtons = document.querySelectorAll('#bottom-nav button');
    navButtons.forEach(btn => {
        btn.classList.remove('text-blue-400');
        btn.classList.add('text-gray-400');
    });
    
    const activeBtn = document.getElementById(`nav-${active}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-blue-400');
    }
}

// Carregar conversas existentes
async function loadConversations() {
    if (!auth.currentUser) return;
    
    try {
        // Buscar conversas privadas
        const chatsQuery = db.collection('privateChats')
            .where('participants', 'array-contains', auth.currentUser.uid)
            .orderBy('lastMessageTime', 'desc');
        
        chatsQuery.onSnapshot(async (snapshot) => {
            const conversations = [];
            
            for (const doc of snapshot.docs) {
                const chatData = doc.data();
                const otherUserId = chatData.participants.find(id => id !== auth.currentUser.uid);
                
                // Buscar dados do outro usuário
                const userDoc = await db.collection('users').doc(otherUserId).get();
                if (userDoc.exists) {
                    conversations.push({
                        id: doc.id,
                        user: userDoc.data(),
                        lastMessage: chatData.lastMessage || '',
                        lastMessageTime: chatData.lastMessageTime,
                        unreadCount: chatData.unreadCount || 0
                    });
                }
            }
            
            renderConversations(conversations);
        });
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full px-8 text-center">
                <div class="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-comments text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">Nenhuma conversa ainda</h3>
                <p class="text-gray-400 mb-6">Adicione amigos ou crie salas para começar</p>
                <button onclick="openGlobalSearch()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">
                    Encontrar pessoas
                </button>
            </div>
        `;
        return;
    }
    
    const conversationsHTML = conversations.map(conversation => {
        const timeString = conversation.lastMessageTime ? 
            formatMessageTime(conversation.lastMessageTime.toDate()) : '';
        
        return `
            <div class="conversation-item p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" 
                 onclick="openPrivateChat('${conversation.user.uid}')">
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <img src="${conversation.user.photoURL}" alt="${conversation.user.displayName}" 
                             class="w-12 h-12 rounded-full">
                        <div class="absolute bottom-0 right-0 w-3 h-3 ${conversation.user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h3 class="font-semibold text-white truncate">${conversation.user.displayName}</h3>
                            <span class="text-xs text-gray-400">${timeString}</span>
                        </div>
                        <p class="text-sm text-gray-400 truncate">${conversation.lastMessage || 'Toque para conversar'}</p>
                    </div>
                    ${conversation.unreadCount > 0 ? `
                        <div class="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            ${conversation.unreadCount}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    conversationsList.innerHTML = conversationsHTML;
}

function formatMessageTime(date) {
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 dias
        return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
}

// Sistema de efeitos para nomes (mantido igual)
function openNameEffects() {
    const modal = document.getElementById('name-effects-modal');
    if (!modal) {
        createNameEffectsModal();
    }
    document.getElementById('name-effects-modal').classList.remove('hidden');
}

function createNameEffectsModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    const modal = document.createElement('div');
    modal.id = 'name-effects-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <button id="close-name-effects-btn" class="text-2xl text-gray-400 hover:text-white mr-4">×</button>
                <h2 class="text-xl font-bold text-white">Efeitos do Nome</h2>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="space-y-4">
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="none">
                        <div class="flex items-center space-x-3">
                            <span class="text-white font-medium">Sem Efeito</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="rainbow">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-rainbow font-medium">Arco-íris</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="gold">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-gold font-medium">Ouro</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="neon">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-neon font-medium">Neon</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="holographic">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-holographic font-medium">Holográfico</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="sunset">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-sunset font-medium">Pôr do Sol</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="crystal">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-crystal font-medium">Cristal</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="fire">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-fire font-medium">Fogo</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                    
                    <div class="effect-option flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-effect="ocean">
                        <div class="flex items-center space-x-3">
                            <span class="name-effect-ocean font-medium">Oceano</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full effect-radio"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modalsContainer.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-name-effects-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Seleção de efeitos
    const effectOptions = modal.querySelectorAll('.effect-option');
    effectOptions.forEach(option => {
        option.addEventListener('click', () => {
            const effect = option.dataset.effect;
            selectNameEffect(effect);
        });
    });
}

function selectNameEffect(effect) {
    // Atualizar seleção visual
    const modal = document.getElementById('name-effects-modal');
    const radios = modal.querySelectorAll('.effect-radio');
    radios.forEach(radio => radio.classList.remove('selected'));
    
    const selectedOption = modal.querySelector(`[data-effect="${effect}"]`);
    const selectedRadio = selectedOption.querySelector('.effect-radio');
    selectedRadio.classList.add('selected');
    
    // Salvar efeito
    if (currentUser) {
        currentUser.nameEffect = effect;
        updateUserProfile();
        showNotification('Efeito do nome atualizado!');
    }
    
    // Fechar modal após 1 segundo
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 1000);
}

// Sistema de banners para nomes (mantido igual do código anterior)
function openNameBanners() {
    const modal = document.getElementById('name-banners-modal');
    if (!modal) {
        createNameBannersModal();
    }
    document.getElementById('name-banners-modal').classList.remove('hidden');
}

function createNameBannersModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    const modal = document.createElement('div');
    modal.id = 'name-banners-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <button id="close-name-banners-btn" class="text-2xl text-gray-400 hover:text-white mr-4">×</button>
                <h2 class="text-xl font-bold text-white">Banners do Nome</h2>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6">
                <div class="space-y-4">
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="none">
                        <div class="flex items-center space-x-3">
                            <span class="text-white font-medium">Sem Banner</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                    
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="heart-pink">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-6 bg-gradient-to-r from-pink-400 to-purple-400 rounded-sm relative overflow-hidden">
                                <div class="absolute inset-0 opacity-60"❤️✨</div>
                            </div>
                            <span class="text-white font-medium">Corações</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                    
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="stars-gold">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-sm relative overflow-hidden">
                                <div class="absolute inset-0 opacity-60">⭐✨</div>
                            </div>
                            <span class="text-white font-medium">Estrelas</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                    
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="nature-green">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-sm relative overflow-hidden">
                                <div class="absolute inset-0 opacity-60">🌿🍃</div>
                            </div>
                            <span class="text-white font-medium">Natureza</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                    
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="tech-blue">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-sm relative overflow-hidden">
                                <div class="absolute inset-0 opacity-60">💎⚡</div>
                            </div>
                            <span class="text-white font-medium">Tecnologia</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                    
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="romantic-purple">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-6 bg-gradient-to-r from-purple-400 to-purple-500 rounded-sm relative overflow-hidden">
                                <div class="absolute inset-0 opacity-60">🌸💜</div>
                            </div>
                            <span class="text-white font-medium">Romântico</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                    
                    <div class="banner-option flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors" data-banner="galaxy-space">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-6 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-sm relative overflow-hidden">
                                <div class="absolute inset-0 opacity-60">🌌🚀</div>
                            </div>
                            <span class="text-white font-medium">Galáxia</span>
                        </div>
                        <div class="w-4 h-4 border-2 border-blue-400 rounded-full banner-radio"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modalsContainer.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-name-banners-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Seleção de banners
    const bannerOptions = modal.querySelectorAll('.banner-option');
    bannerOptions.forEach(option => {
        option.addEventListener('click', () => {
            const banner = option.dataset.banner;
            selectNameBanner(banner);
        });
    });
}

function selectNameBanner(banner) {
    // Atualizar seleção visual
    const modal = document.getElementById('name-banners-modal');
    const radios = modal.querySelectorAll('.banner-radio');
    radios.forEach(radio => radio.classList.remove('selected'));
    
    const selectedOption = modal.querySelector(`[data-banner="${banner}"]`);
    const selectedRadio = selectedOption.querySelector('.banner-radio');
    selectedRadio.classList.add('selected');
    
    // Salvar banner
    if (currentUser) {
        currentUser.nameBanner = banner;
        updateUserProfile();
        showNotification('Banner do nome atualizado!');
    }
    
    // Fechar modal após 1 segundo
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 1000);
}

// Exportar funções para uso global
window.showNotification = showNotification;
window.showCustomPrompt = showCustomPrompt;
window.showCustomConfirm = showCustomConfirm;
window.generateGuestName = generateGuestName;
window.uploadPhoto = uploadPhoto;
window.updateUserProfile = updateUserProfile;
window.renderMainApp = renderMainApp;
window.showChatsScreen = showChatsScreen;
window.showFriendsScreen = showFriendsScreen;
window.showRoomsScreen = showRoomsScreen;
window.updateNavigation = updateNavigation;
window.openNameEffects = openNameEffects;
window.openNameBanners = openNameBanners;

export {
    currentUser,
    showNotification,
    showCustomPrompt,
    showCustomConfirm,
    generateGuestName,
    uploadPhoto,
    updateUserProfile,
    renderMainApp,
    showChatsScreen,
    showFriendsScreen,
    showRoomsScreen,
    updateNavigation,
    openNameEffects,
    openNameBanners
};