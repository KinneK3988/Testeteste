import { auth, db } from './firebase-config.js';
import { showNotification, showCustomPrompt, showCustomConfirm } from './ui.js';

let friendsList = [];
let friendRequests = [];
let blockedUsers = [];
let currentTab = 'online';

// Renderizar tela de amigos
function renderFriendsScreen() {
    const friendsScreen = document.getElementById('friends-screen');
    
    friendsScreen.innerHTML = `
        <div class="flex-1 flex flex-col">
            <!-- Header com busca -->
            <div class="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                <h1 class="text-xl font-bold text-white">Amigos</h1>
                <button onclick="openGlobalSearch()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-search text-xl"></i>
                </button>
            </div>
            
            <!-- Tabs de filtros -->
            <div class="bg-gray-800 border-b border-gray-700">
                <div class="flex px-4">
                    <button id="online-tab" class="tab-button flex-1 py-3 px-4 text-center font-medium border-b-2 border-blue-500 text-blue-400" onclick="switchFriendsTab('online')">
                        Online
                    </button>
                    <button id="todos-tab" class="tab-button flex-1 py-3 px-4 text-center font-medium border-b-2 border-transparent text-gray-400" onclick="switchFriendsTab('todos')">
                        Todos
                    </button>
                    <button id="pendentes-tab" class="tab-button flex-1 py-3 px-4 text-center font-medium border-b-2 border-transparent text-gray-400" onclick="switchFriendsTab('pendentes')">
                        Pendentes
                    </button>
                    <button id="bloqueados-tab" class="tab-button flex-1 py-3 px-4 text-center font-medium border-b-2 border-transparent text-gray-400" onclick="switchFriendsTab('bloqueados')">
                        Bloqueados
                    </button>
                </div>
            </div>
            
            <!-- Conteúdo das tabs -->
            <div id="friends-content" class="flex-1 overflow-y-auto">
                <!-- Conteúdo será renderizado aqui -->
            </div>
        </div>
    `;
    
    // Carregar dados iniciais
    loadFriends();
    loadFriendRequests();
    loadBlockedUsers();
    
    // Mostrar tab online por padrão
    switchFriendsTab('online');
}

function switchFriendsTab(tab) {
    currentTab = tab;
    
    // Atualizar visual das tabs
    const tabs = ['online', 'todos', 'pendentes', 'bloqueados'];
    tabs.forEach(tabName => {
        const tabButton = document.getElementById(`${tabName}-tab`);
        if (tabName === tab) {
            tabButton.classList.remove('text-gray-400', 'border-transparent');
            tabButton.classList.add('text-blue-400', 'border-blue-500');
        } else {
            tabButton.classList.remove('text-blue-400', 'border-blue-500');
            tabButton.classList.add('text-gray-400', 'border-transparent');
        }
    });
    
    // Renderizar conteúdo da tab
    renderTabContent(tab);
}

function renderTabContent(tab) {
    const content = document.getElementById('friends-content');
    
    switch (tab) {
        case 'online':
            renderOnlineFriends(content);
            break;
        case 'todos':
            renderAllFriends(content);
            break;
        case 'pendentes':
            renderPendingRequests(content);
            break;
        case 'bloqueados':
            renderBlockedUsers(content);
            break;
    }
}

function renderOnlineFriends(container) {
    const onlineFriends = friendsList.filter(friend => friend.isOnline);
    
    if (onlineFriends.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full px-8 text-center">
                <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-users text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">Nenhum amigo online</h3>
                <p class="text-gray-400">Seus amigos aparecerão aqui quando estiverem online</p>
            </div>
        `;
        return;
    }
    
    const friendsHTML = onlineFriends.map(friend => `
        <div class="friend-item p-4 border-b border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${friend.photoURL}" alt="${friend.displayName}" class="w-12 h-12 rounded-full">
                    <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div>
                    <h3 class="font-semibold text-white">${friend.displayName}</h3>
                    <p class="text-sm text-green-400">Online</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button onclick="openPrivateChat('${friend.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                    <i class="fas fa-comment"></i>
                </button>
                <button onclick="showFriendOptions('${friend.id}')" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = friendsHTML;
}

function renderAllFriends(container) {
    if (friendsList.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full px-8 text-center">
                <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-user-friends text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">Você ainda não tem amigos</h3>
                <p class="text-gray-400 mb-6">Use a busca para encontrar pessoas</p>
                <button onclick="openGlobalSearch()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">
                    Encontrar pessoas
                </button>
            </div>
        `;
        return;
    }
    
    const friendsHTML = friendsList.map(friend => `
        <div class="friend-item p-4 border-b border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${friend.photoURL}" alt="${friend.displayName}" class="w-12 h-12 rounded-full">
                    <div class="absolute bottom-0 right-0 w-3 h-3 ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div>
                </div>
                <div>
                    <h3 class="font-semibold text-white">${friend.displayName}</h3>
                    <p class="text-sm ${friend.isOnline ? 'text-green-400' : 'text-gray-400'}">${friend.isOnline ? 'Online' : 'Offline'}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button onclick="openPrivateChat('${friend.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                    <i class="fas fa-comment"></i>
                </button>
                <button onclick="showFriendOptions('${friend.id}')" class="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = friendsHTML;
}

function renderPendingRequests(container) {
    if (friendRequests.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full px-8 text-center">
                <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-user-plus text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">Nenhuma solicitação pendente</h3>
                <p class="text-gray-400">As solicitações de amizade aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    const requestsHTML = friendRequests.map(request => `
        <div class="friend-request-item p-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <img src="${request.senderData.photoURL}" alt="${request.senderData.displayName}" class="w-12 h-12 rounded-full">
                    <div>
                        <h3 class="font-semibold text-white">${request.senderData.displayName}</h3>
                        <p class="text-sm text-gray-400">Quer ser seu amigo</p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="acceptFriendRequest('${request.id}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium">
                        Aceitar
                    </button>
                    <button onclick="rejectFriendRequest('${request.id}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium">
                        Recusar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = requestsHTML;
}

function renderBlockedUsers(container) {
    if (blockedUsers.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full px-8 text-center">
                <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                    <i class="fas fa-user-slash text-3xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">Nenhum usuário bloqueado</h3>
                <p class="text-gray-400">Usuários bloqueados aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    const blockedHTML = blockedUsers.map(user => `
        <div class="blocked-user-item p-4 border-b border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <img src="${user.photoURL}" alt="${user.displayName}" class="w-12 h-12 rounded-full opacity-50">
                <div>
                    <h3 class="font-semibold text-white">${user.displayName}</h3>
                    <p class="text-sm text-red-400">Bloqueado</p>
                </div>
            </div>
            <button onclick="unblockUser('${user.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">
                Desbloquear
            </button>
        </div>
    `).join('');
    
    container.innerHTML = blockedHTML;
}

// Carregar lista de amigos
async function loadFriends() {
    if (!auth.currentUser) return;
    
    try {
        const friendsRef = db.collection('friendships')
            .where('users', 'array-contains', auth.currentUser.uid)
            .where('status', '==', 'accepted');
        
        friendsRef.onSnapshot(async (snapshot) => {
            const friendsData = [];
            
            for (const doc of snapshot.docs) {
                const friendship = doc.data();
                const friendId = friendship.users.find(id => id !== auth.currentUser.uid);
                
                // Buscar dados do amigo
                const friendDoc = await db.collection('users').doc(friendId).get();
                if (friendDoc.exists) {
                    friendsData.push({
                        id: friendId,
                        ...friendDoc.data()
                    });
                }
            }
            
            friendsList = friendsData;
            // Re-renderizar se estiver na tab atual
            if (currentTab === 'online' || currentTab === 'todos') {
                renderTabContent(currentTab);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar amigos:', error);
    }
}

// Carregar solicitações de amizade
async function loadFriendRequests() {
    if (!auth.currentUser) return;
    
    try {
        const requestsRef = db.collection('friendRequests')
            .where('to', '==', auth.currentUser.uid)
            .where('status', '==', 'pending');
        
        requestsRef.onSnapshot(async (snapshot) => {
            const requestsData = [];
            
            for (const doc of snapshot.docs) {
                const request = { id: doc.id, ...doc.data() };
                
                // Buscar dados do remetente
                const senderDoc = await db.collection('users').doc(request.from).get();
                if (senderDoc.exists) {
                    request.senderData = senderDoc.data();
                    requestsData.push(request);
                }
            }
            
            friendRequests = requestsData;
            updateNotificationsBadge();
            
            // Re-renderizar se estiver na tab de pendentes
            if (currentTab === 'pendentes') {
                renderTabContent(currentTab);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
    }
}

// Carregar usuários bloqueados
async function loadBlockedUsers() {
    if (!auth.currentUser) return;
    
    try {
        const blockedRef = db.collection('blockedUsers')
            .where('blockedBy', '==', auth.currentUser.uid);
        
        blockedRef.onSnapshot(async (snapshot) => {
            const blockedData = [];
            
            for (const doc of snapshot.docs) {
                const blockData = doc.data();
                
                // Buscar dados do usuário bloqueado
                const userDoc = await db.collection('users').doc(blockData.blockedUser).get();
                if (userDoc.exists) {
                    blockedData.push({
                        id: blockData.blockedUser,
                        blockId: doc.id,
                        ...userDoc.data()
                    });
                }
            }
            
            blockedUsers = blockedData;
            
            // Re-renderizar se estiver na tab de bloqueados
            if (currentTab === 'bloqueados') {
                renderTabContent(currentTab);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar usuários bloqueados:', error);
    }
}

// Aceitar solicitação de amizade
async function acceptFriendRequest(requestId) {
    try {
        const requestDoc = await db.collection('friendRequests').doc(requestId).get();
        if (!requestDoc.exists) return;
        
        const request = requestDoc.data();
        
        // Criar amizade
        await db.collection('friendships').add({
            users: [request.from, request.to],
            status: 'accepted',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar status da solicitação
        await db.collection('friendRequests').doc(requestId).update({
            status: 'accepted'
        });
        
        showNotification('Solicitação aceita!');
    } catch (error) {
        console.error('Erro ao aceitar solicitação:', error);
        showNotification('Erro ao aceitar solicitação', 'error');
    }
}

// Recusar solicitação de amizade
async function rejectFriendRequest(requestId) {
    try {
        await db.collection('friendRequests').doc(requestId).update({
            status: 'rejected'
        });
        
        showNotification('Solicitação recusada');
    } catch (error) {
        console.error('Erro ao recusar solicitação:', error);
        showNotification('Erro ao recusar solicitação', 'error');
    }
}

// Mostrar opções do amigo
function showFriendOptions(friendId) {
    const friend = friendsList.find(f => f.id === friendId);
    if (!friend) return;
    
    const options = [
        { text: 'Conversar', action: () => openPrivateChat(friendId) },
        { text: 'Ver perfil', action: () => viewUserProfile(friendId) },
        { text: 'Bloquear', action: () => blockUser(friendId) },
        { text: 'Remover amigo', action: () => removeFriend(friendId) }
    ];
    
    // Criar modal de opções simples
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 m-4 max-w-sm w-full">
            <h3 class="text-lg font-semibold text-white mb-4">${friend.displayName}</h3>
            <div class="space-y-2">
                ${options.map(option => `
                    <button onclick="${option.action.toString().replace('function', 'window.friendOptionAction')}(); this.closest('.fixed').remove();" 
                            class="w-full text-left p-3 text-white hover:bg-gray-700 rounded">
                        ${option.text}
                    </button>
                `).join('')}
                <button onclick="this.closest('.fixed').remove();" class="w-full text-left p-3 text-gray-400 hover:bg-gray-700 rounded">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Remover amigo
async function removeFriend(friendId) {
    const confirm = await showCustomConfirm('Remover Amigo', 'Tem certeza que deseja remover este amigo?');
    if (!confirm) return;
    
    try {
        // Buscar e remover amizade
        const friendshipQuery = await db.collection('friendships')
            .where('users', 'array-contains', auth.currentUser.uid)
            .where('status', '==', 'accepted')
            .get();
        
        for (const doc of friendshipQuery.docs) {
            const friendship = doc.data();
            if (friendship.users.includes(friendId)) {
                await doc.ref.delete();
                break;
            }
        }
        
        showNotification('Amigo removido');
    } catch (error) {
        console.error('Erro ao remover amigo:', error);
        showNotification('Erro ao remover amigo', 'error');
    }
}

// Bloquear usuário
async function blockUser(userId) {
    const confirm = await showCustomConfirm('Bloquear Usuário', 'Tem certeza que deseja bloquear este usuário?');
    if (!confirm) return;
    
    try {
        // Adicionar à lista de bloqueados
        await db.collection('blockedUsers').add({
            blockedBy: auth.currentUser.uid,
            blockedUser: userId,
            blockedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Remover amizade se existir
        const friendshipQuery = await db.collection('friendships')
            .where('users', 'array-contains', auth.currentUser.uid)
            .where('status', '==', 'accepted')
            .get();
        
        for (const doc of friendshipQuery.docs) {
            const friendship = doc.data();
            if (friendship.users.includes(userId)) {
                await doc.ref.delete();
                break;
            }
        }
        
        showNotification('Usuário bloqueado');
    } catch (error) {
        console.error('Erro ao bloquear usuário:', error);
        showNotification('Erro ao bloquear usuário', 'error');
    }
}

// Desbloquear usuário
async function unblockUser(userId) {
    try {
        const blockQuery = await db.collection('blockedUsers')
            .where('blockedBy', '==', auth.currentUser.uid)
            .where('blockedUser', '==', userId)
            .get();
        
        for (const doc of blockQuery.docs) {
            await doc.ref.delete();
        }
        
        showNotification('Usuário desbloqueado');
    } catch (error) {
        console.error('Erro ao desbloquear usuário:', error);
        showNotification('Erro ao desbloquear usuário', 'error');
    }
}

// Visualizar perfil do usuário
function viewUserProfile(userId) {
    // Implementar modal de perfil
    console.log('Ver perfil de:', userId);
}

// Enviar solicitação de amizade
async function sendFriendRequest(userId) {
    if (!auth.currentUser || userId === auth.currentUser.uid) return;
    
    try {
        // Verificar se já existe solicitação pendente
        const existingRequest = await db.collection('friendRequests')
            .where('from', '==', auth.currentUser.uid)
            .where('to', '==', userId)
            .where('status', '==', 'pending')
            .get();
        
        if (!existingRequest.empty) {
            showNotification('Solicitação já enviada', 'error');
            return;
        }
        
        // Verificar se já são amigos
        const existingFriendship = await db.collection('friendships')
            .where('users', 'array-contains', auth.currentUser.uid)
            .where('status', '==', 'accepted')
            .get();
        
        for (const doc of existingFriendship.docs) {
            const friendship = doc.data();
            if (friendship.users.includes(userId)) {
                showNotification('Vocês já são amigos', 'error');
                return;
            }
        }
        
        // Verificar se o usuário está bloqueado
        const blockedCheck = await db.collection('blockedUsers')
            .where('blockedBy', '==', userId)
            .where('blockedUser', '==', auth.currentUser.uid)
            .get();
        
        if (!blockedCheck.empty) {
            showNotification('Não é possível enviar solicitação', 'error');
            return;
        }
        
        // Criar nova solicitação
        await db.collection('friendRequests').add({
            from: auth.currentUser.uid,
            to: userId,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Solicitação enviada!');
    } catch (error) {
        console.error('Erro ao enviar solicitação:', error);
        showNotification('Erro ao enviar solicitação', 'error');
    }
}

// Atualizar badge de notificações
function updateNotificationsBadge() {
    const badge = document.getElementById('notifications-badge');
    if (!badge) return;
    
    const count = friendRequests.length;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Exportar funções para uso global
window.renderFriendsScreen = renderFriendsScreen;
window.switchFriendsTab = switchFriendsTab;
window.acceptFriendRequest = acceptFriendRequest;
window.rejectFriendRequest = rejectFriendRequest;
window.removeFriend = removeFriend;
window.sendFriendRequest = sendFriendRequest;
window.showFriendOptions = showFriendOptions;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.viewUserProfile = viewUserProfile;

export {
    renderFriendsScreen,
    loadFriends,
    loadFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    sendFriendRequest,
    friendsList,
    friendRequests
};