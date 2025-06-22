// Importa as funções necessárias do Firebase e da UI.
// Assume que firebase-config.js exporta os objetos db e auth inicializados.
// Assume que ui.js exporta funções para notificações e modais.
import { auth, db } from './firebase-config.js';
import { 
    collection, query, where, onSnapshot, getDocs, doc, getDoc, 
    addDoc, updateDoc, deleteDoc, serverTimestamp, documentId 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showNotification, showCustomConfirm } from './ui.js';

// --- Gestão de Estado ---
let friendsList = [];
let friendRequests = [];
let blockedUsers = [];
let currentTab = 'online';

// Funções de cancelamento de subscrição para evitar perdas de memória
let unsubscribeFriends = () => {};
let unsubscribeRequests = () => {};
let unsubscribeBlocked = () => {};


// --- Função Principal de Renderização ---

/**
 * Renderiza a estrutura principal do ecrã de amigos e inicializa os event listeners.
 */
function renderFriendsScreen() {
    const friendsScreen = document.getElementById('friends-screen');
    if (!friendsScreen) return;

    // Define a estrutura HTML principal para o ecrã de amigos
    friendsScreen.innerHTML = `
        <div class="flex-1 flex flex-col bg-gray-800 text-white h-full">
            <!-- Cabeçalho -->
            <div class="border-b border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
                <h1 class="text-xl font-bold">Amigos</h1>
                <button data-action="open-global-search" class="text-gray-400 hover:text-white">
                    <i class="fas fa-search text-xl"></i>
                </button>
            </div>
            
            <!-- Separadores de Filtro -->
            <div class="bg-gray-800 border-b border-gray-700 flex-shrink-0">
                <div id="friends-tabs" class="flex px-4">
                    <button data-tab="online" class="tab-button flex-1 py-3 px-4 text-center font-medium">Online</button>
                    <button data-tab="todos" class="tab-button flex-1 py-3 px-4 text-center font-medium">Todos</button>
                    <button data-tab="pendentes" class="tab-button flex-1 py-3 px-4 text-center font-medium">Pendentes <span id="notifications-badge" class="hidden bg-red-500 text-white text-xs font-bold ml-1 px-2 py-0.5 rounded-full"></span></button>
                    <button data-tab="bloqueados" class="tab-button flex-1 py-3 px-4 text-center font-medium">Bloqueados</button>
                </div>
            </div>
            
            <!-- Conteúdo do Separador -->
            <div id="friends-content" class="flex-1 overflow-y-auto p-2">
                <!-- O conteúdo será renderizado aqui por renderTabContent() -->
            </div>
        </div>
    `;

    // Inicializa os listeners para todo o ecrã
    initializeFriendsListeners();
    
    // Carrega os dados iniciais e define o separador padrão
    loadInitialData();
    switchFriendsTab('online');
}

/**
 * Configura os event listeners para o ecrã de amigos usando delegação de eventos.
 */
function initializeFriendsListeners() {
    const friendsScreen = document.getElementById('friends-screen');
    if (!friendsScreen) return;

    friendsScreen.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action], [data-tab]');
        if (!target) return;

        const action = target.dataset.action;
        const tab = target.dataset.tab;
        const id = target.dataset.id;
        const requestId = target.dataset.requestId;

        // Lidar com a troca de separadores
        if (tab) {
            switchFriendsTab(tab);
            return;
        }

        // Lidar com as ações
        switch (action) {
            case 'open-global-search':
                // Assumindo que openGlobalSearch() está definida globalmente ou foi importada
                if (window.openGlobalSearch) window.openGlobalSearch();
                break;
            case 'accept-request':
                acceptFriendRequest(requestId);
                break;
            case 'reject-request':
                rejectFriendRequest(requestId);
                break;
            case 'unblock-user':
                unblockUser(id);
                break;
            case 'show-options':
                showFriendOptions(id);
                break;
            case 'open-chat':
                // Assumindo que openPrivateChat() está definida globalmente ou foi importada
                if(window.openPrivateChat) window.openPrivateChat(id);
                break;
        }
    });
}

/**
 * Carrega todos os dados necessários do Firestore.
 */
function loadInitialData() {
    // Cancela a subscrição dos listeners anteriores para evitar duplicados
    unsubscribeAll();

    // Inicia novos listeners
    loadFriends();
    loadFriendRequests();
    loadBlockedUsers();
}

/**
 * Cancela a subscrição de todos os listeners do Firestore.
 */
function unsubscribeAll() {
    unsubscribeFriends();
    unsubscribeRequests();
    unsubscribeBlocked();
}


// --- Troca de Separadores e Renderização de Conteúdo ---

/**
 * Troca o separador de amigos ativo e renderiza o conteúdo novamente.
 * @param {string} tab - O separador para o qual trocar ('online', 'todos', 'pendentes', 'bloqueados').
 */
function switchFriendsTab(tab) {
    currentTab = tab;
    const tabContainer = document.getElementById('friends-tabs');
    if (!tabContainer) return;

    // Atualiza os estilos dos botões dos separadores
    tabContainer.querySelectorAll('.tab-button').forEach(button => {
        if (button.dataset.tab === tab) {
            button.classList.add('text-blue-400', 'border-blue-500');
            button.classList.remove('text-gray-400', 'border-transparent');
        } else {
            button.classList.add('text-gray-400', 'border-transparent');
            button.classList.remove('text-blue-400', 'border-blue-500');
        }
    });
    
    renderTabContent(tab);
}

/**
 * Renderiza o conteúdo para o separador atualmente selecionado.
 * @param {string} tab - O separador ativo.
 */
function renderTabContent(tab) {
    const container = document.getElementById('friends-content');
    if (!container) return;

    switch (tab) {
        case 'online':
            renderOnlineFriends(container);
            break;
        case 'todos':
            renderAllFriends(container);
            break;
        case 'pendentes':
            renderPendingRequests(container);
            break;
        case 'bloqueados':
            renderBlockedUsers(container);
            break;
        default:
            container.innerHTML = `<p class="text-center text-gray-400 mt-8">Selecione um separador.</p>`;
    }
}


// --- Funções de Renderização de Templates ---

function getPlaceholderHTML(icon, title, text, buttonText = '', buttonAction = '') {
    const buttonHTML = buttonText ? 
        `<button data-action="${buttonAction}" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium mt-6">
            ${buttonText}
        </button>` : '';

    return `
        <div class="flex flex-col items-center justify-center h-full px-8 text-center text-gray-400">
            <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <i class="fas ${icon} text-3xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">${title}</h3>
            <p>${text}</p>
            ${buttonHTML}
        </div>
    `;
}

function renderOnlineFriends(container) {
    const onlineFriends = friendsList.filter(friend => friend.isOnline);

    if (onlineFriends.length === 0) {
        container.innerHTML = getPlaceholderHTML('fa-users', 'Nenhum amigo online', 'Os seus amigos aparecerão aqui quando estiverem online.');
        return;
    }
    
    container.innerHTML = onlineFriends.map(friend => `
        <div class="friend-item p-3 border-b border-gray-700 flex items-center justify-between hover:bg-gray-700/50 rounded-md">
            <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${friend.photoURL || 'https://placehold.co/48x48/718096/E2E8F0?text=?'}" alt="${friend.displayName}" class="w-12 h-12 rounded-full">
                    <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div>
                    <h3 class="font-semibold text-white">${friend.displayName}</h3>
                    <p class="text-sm text-green-400">Online</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button data-action="open-chat" data-id="${friend.id}" class="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
                    <i class="fas fa-comment"></i>
                </button>
                <button data-action="show-options" data-id="${friend.id}" class="bg-gray-600 hover:bg-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderAllFriends(container) {
    if (friendsList.length === 0) {
        container.innerHTML = getPlaceholderHTML('fa-user-friends', 'Você ainda não tem amigos', 'Use a busca para encontrar pessoas.', 'Encontrar Pessoas', 'open-global-search');
        return;
    }
    
    container.innerHTML = friendsList.map(friend => `
        <div class="friend-item p-3 border-b border-gray-700 flex items-center justify-between hover:bg-gray-700/50 rounded-md">
             <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${friend.photoURL || 'https://placehold.co/48x48/718096/E2E8F0?text=?'}" alt="${friend.displayName}" class="w-12 h-12 rounded-full">
                    <div class="absolute bottom-0 right-0 w-3.5 h-3.5 ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div>
                </div>
                <div>
                    <h3 class="font-semibold text-white">${friend.displayName}</h3>
                    <p class="text-sm ${friend.isOnline ? 'text-green-400' : 'text-gray-400'}">${friend.isOnline ? 'Online' : 'Offline'}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button data-action="open-chat" data-id="${friend.id}" class="bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
                    <i class="fas fa-comment"></i>
                </button>
                <button data-action="show-options" data-id="${friend.id}" class="bg-gray-600 hover:bg-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderPendingRequests(container) {
    if (friendRequests.length === 0) {
        container.innerHTML = getPlaceholderHTML('fa-user-plus', 'Nenhum pedido de amizade pendente', 'Os pedidos de amizade aparecerão aqui.');
        return;
    }
    
    container.innerHTML = friendRequests.map(request => `
        <div class="friend-request-item p-3 border-b border-gray-700 flex items-center justify-between hover:bg-gray-700/50 rounded-md">
            <div class="flex items-center space-x-3">
                <img src="${request.senderData.photoURL || 'https://placehold.co/48x48/718096/E2E8F0?text=?'}" alt="${request.senderData.displayName}" class="w-12 h-12 rounded-full">
                <div>
                    <h3 class="font-semibold text-white">${request.senderData.displayName}</h3>
                    <p class="text-sm text-gray-400">Quer ser seu amigo</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button data-action="accept-request" data-request-id="${request.id}" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Aceitar</button>
                <button data-action="reject-request" data-request-id="${request.id}" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Recusar</button>
            </div>
        </div>
    `).join('');
}

function renderBlockedUsers(container) {
    if (blockedUsers.length === 0) {
        container.innerHTML = getPlaceholderHTML('fa-user-slash', 'Nenhum utilizador bloqueado', 'Utilizadores bloqueados aparecerão aqui.');
        return;
    }
    
    container.innerHTML = blockedUsers.map(user => `
        <div class="blocked-user-item p-3 border-b border-gray-700 flex items-center justify-between hover:bg-gray-700/50 rounded-md">
            <div class="flex items-center space-x-3">
                <img src="${user.photoURL || 'https://placehold.co/48x48/718096/E2E8F0?text=?'}" alt="${user.displayName}" class="w-12 h-12 rounded-full opacity-50">
                <div>
                    <h3 class="font-semibold text-white">${user.displayName}</h3>
                    <p class="text-sm text-red-400">Bloqueado</p>
                </div>
            </div>
            <button data-action="unblock-user" data-id="${user.id}" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Desbloquear</button>
        </div>
    `).join('');
}

// --- Carregamento de Dados do Firestore (com SDK v9+) ---

/**
 * Função auxiliar para buscar dados de utilizadores em lotes.
 * A consulta 'in' do Firestore suporta um máximo de 30 elementos.
 * @param {Array<string>} userIds - Array de IDs de utilizador a serem buscados.
 * @returns {Object} Um mapa de userId para userData.
 */
async function fetchUsersData(userIds) {
    if (userIds.length === 0) return {};
    const usersData = {};
    
    // A consulta 'in' do Firestore é limitada a 30 itens. Processa em lotes se necessário.
    const MAX_IN_QUERY_SIZE = 30;
    for (let i = 0; i < userIds.length; i += MAX_IN_QUERY_SIZE) {
        const batchIds = userIds.slice(i, i + MAX_IN_QUERY_SIZE);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where(documentId(), 'in', batchIds));
        
        try {
            const userSnapshots = await getDocs(q);
            userSnapshots.forEach(doc => {
                usersData[doc.id] = { id: doc.id, ...doc.data() };
            });
        } catch (error) {
            console.error("Erro ao buscar lote de utilizadores:", error);
        }
    }
    return usersData;
}


async function loadFriends() {
    if (!auth.currentUser) return;

    const q = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', auth.currentUser.uid),
        where('status', '==', 'accepted')
    );

    unsubscribeFriends = onSnapshot(q, async (snapshot) => {
        const friendIds = snapshot.docs.map(doc => {
            const users = doc.data().users;
            return users.find(id => id !== auth.currentUser.uid);
        }).filter(id => id); // Filtra quaisquer IDs indefinidos

        const usersData = await fetchUsersData(friendIds);
        friendsList = Object.values(usersData);
        
        // Renderiza novamente se os separadores relevantes estiverem ativos
        if (currentTab === 'online' || currentTab === 'todos') {
            renderTabContent(currentTab);
        }
    }, (error) => {
        console.error("Erro ao carregar amigos:", error);
        showNotification('Erro ao carregar amigos.', 'error');
    });
}

async function loadFriendRequests() {
    if (!auth.currentUser) return;
    
    const q = query(
        collection(db, 'friendRequests'),
        where('to', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
    );

    unsubscribeRequests = onSnapshot(q, async (snapshot) => {
        const senderIds = snapshot.docs.map(doc => doc.data().from).filter(id => id);
        const usersData = await fetchUsersData(senderIds);

        friendRequests = snapshot.docs.map(doc => {
            const request = { id: doc.id, ...doc.data() };
            request.senderData = usersData[request.from];
            return request;
        }).filter(req => req.senderData); // Garante que os dados do remetente foram carregados

        updateNotificationsBadge();
        
        if (currentTab === 'pendentes') {
            renderTabContent(currentTab);
        }
    }, (error) => {
        console.error("Erro ao carregar pedidos de amizade:", error);
        showNotification('Erro ao carregar pedidos de amizade.', 'error');
    });
}

async function loadBlockedUsers() {
    if (!auth.currentUser) return;

    const q = query(
        collection(db, 'blockedUsers'),
        where('blockedBy', '==', auth.currentUser.uid)
    );

    unsubscribeBlocked = onSnapshot(q, async (snapshot) => {
        const blockedUserIds = snapshot.docs.map(doc => doc.data().blockedUser).filter(id => id);
        const usersData = await fetchUsersData(blockedUserIds);

        blockedUsers = snapshot.docs.map(doc => {
            const blockData = { blockId: doc.id, ...doc.data() };
            const userData = usersData[blockData.blockedUser];
            return userData ? { ...userData, blockId: blockData.blockId } : null;
        }).filter(user => user);

        if (currentTab === 'bloqueados') {
            renderTabContent(currentTab);
        }
    }, (error) => {
        console.error("Erro ao carregar utilizadores bloqueados:", error);
        showNotification('Erro ao carregar utilizadores bloqueados.', 'error');
    });
}


// --- Funções de Ação do Firestore ---

async function acceptFriendRequest(requestId) {
    try {
        const requestRef = doc(db, 'friendRequests', requestId);
        const requestDoc = await getDoc(requestRef);
        if (!requestDoc.exists()) throw new Error("Pedido não encontrado");

        const request = requestDoc.data();
        
        // Cria o documento de amizade
        await addDoc(collection(db, 'friendships'), {
            users: [request.from, request.to],
            status: 'accepted',
            createdAt: serverTimestamp()
        });
        
        // Atualiza o estado do pedido para 'accepted' para o remover da lista de pendentes
        await updateDoc(requestRef, { status: 'accepted' });

        showNotification('Pedido de amizade aceite!');
    } catch (error) {
        console.error('Erro ao aceitar pedido:', error);
        showNotification('Erro ao aceitar pedido de amizade', 'error');
    }
}

async function rejectFriendRequest(requestId) {
    try {
        const requestRef = doc(db, 'friendRequests', requestId);
        // Atualiza o estado para 'rejected' para o remover da lista
        await updateDoc(requestRef, { status: 'rejected' });
        showNotification('Pedido de amizade recusado');
    } catch (error) {
        console.error('Erro ao recusar pedido:', error);
        showNotification('Erro ao recusar pedido de amizade', 'error');
    }
}

async function removeFriend(friendId) {
    // Usa um modal de confirmação personalizado
    const confirmed = await showCustomConfirm('Remover Amigo', 'Tem a certeza de que deseja remover este amigo? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
        const q = query(
            collection(db, 'friendships'),
            where('users', 'in', [[auth.currentUser.uid, friendId], [friendId, auth.currentUser.uid]]),
            where('status', '==', 'accepted')
        );
        
        const friendshipSnapshot = await getDocs(q);
        if (friendshipSnapshot.empty) throw new Error("Amizade não encontrada.");

        // Apaga o documento de amizade encontrado
        const friendshipDoc = friendshipSnapshot.docs[0];
        await deleteDoc(doc(db, 'friendships', friendshipDoc.id));
        
        showNotification('Amigo removido');
    } catch (error) {
        console.error('Erro ao remover amigo:', error);
        showNotification('Erro ao remover amigo', 'error');
    }
}

async function blockUser(userId) {
    const confirmed = await showCustomConfirm('Bloquear Utilizador', 'Tem a certeza de que deseja bloquear este utilizador? A amizade será desfeita e não poderão interagir.');
    if (!confirmed) return;
    
    try {
        // Remove a amizade se existir
        await removeFriend(userId).catch(() => {}); // Captura o erro se não forem amigos

        // Adiciona à lista de utilizadores bloqueados
        await addDoc(collection(db, 'blockedUsers'), {
            blockedBy: auth.currentUser.uid,
            blockedUser: userId,
            blockedAt: serverTimestamp()
        });

        showNotification('Utilizador bloqueado');
    } catch (error) {
        console.error('Erro ao bloquear utilizador:', error);
        showNotification('Erro ao bloquear utilizador', 'error');
    }
}

async function unblockUser(userId) {
    try {
        const q = query(
            collection(db, 'blockedUsers'),
            where('blockedBy', '==', auth.currentUser.uid),
            where('blockedUser', '==', userId)
        );
        
        const blockSnapshot = await getDocs(q);
        if (blockSnapshot.empty) return; // Nenhum registo de bloqueio encontrado

        // Apaga todos os registos de bloqueio encontrados (deve ser apenas um)
        for (const doc of blockSnapshot.docs) {
            await deleteDoc(doc.ref);
        }
        
        showNotification('Utilizador desbloqueado');
    } catch (error) {
        console.error('Erro ao desbloquear utilizador:', error);
        showNotification('Erro ao desbloquear utilizador', 'error');
    }
}


// --- Funções Auxiliares de UI ---

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

function showFriendOptions(friendId) {
    const friend = friendsList.find(f => f.id === friendId);
    if (!friend) return;
    
    // Cria e exibe um modal para opções. Isto evita JS inline complexo.
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50';
    modal.addEventListener('click', (e) => {
        // Fecha o modal se o fundo for clicado
        if (e.target === modal) {
            modal.remove();
        }
    });

    const modalContent = `
        <div class="bg-gray-800 rounded-lg p-4 m-4 max-w-sm w-full shadow-lg">
            <h3 class="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">${friend.displayName}</h3>
            <div class="space-y-2">
                <button data-action="chat" class="w-full text-left p-3 text-white hover:bg-gray-700 rounded transition-colors duration-200">Conversar</button>
                <button data-action="profile" class="w-full text-left p-3 text-white hover:bg-gray-700 rounded transition-colors duration-200">Ver Perfil</button>
                <button data-action="block" class="w-full text-left p-3 text-red-400 hover:bg-gray-700 rounded transition-colors duration-200">Bloquear</button>
                <button data-action="remove" class="w-full text-left p-3 text-red-400 hover:bg-gray-700 rounded transition-colors duration-200">Remover Amigo</button>
                <button data-action="cancel" class="w-full text-left mt-4 p-3 text-gray-400 hover:bg-gray-700 rounded transition-colors duration-200">Cancelar</button>
            </div>
        </div>
    `;
    modal.innerHTML = modalContent;

    // Adiciona event listener para os botões do modal
    modal.querySelector('.space-y-2').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        switch (button.dataset.action) {
            case 'chat':
                if (window.openPrivateChat) window.openPrivateChat(friendId);
                break;
            case 'profile':
                if (window.viewUserProfile) window.viewUserProfile(friendId);
                break;
            case 'block':
                blockUser(friendId);
                break;
            case 'remove':
                removeFriend(friendId);
                break;
        }
        modal.remove(); // Fecha o modal após a ação
    });

    document.body.appendChild(modal);
}

// --- Exportações ---
// Exporta as funções para serem usadas noutros módulos, se necessário.
export {
    renderFriendsScreen,
    loadInitialData,
    unsubscribeAll,
    friendsList,
    friendRequests
};
