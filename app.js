import { initAuth } from './auth.js';
import { renderFriendsScreen } from './friends.js';
import { showNotification, showCustomPrompt } from './ui.js';
import { auth, db } from './firebase-config.js';

let currentUser = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Aplicação iniciada');
    initAuth();
    setupGlobalEventListeners();
});

function setupGlobalEventListeners() {
    setupGlobalSearch();
    setupNotifications();
    setupPhotoViewer();
}

// Configurações - NOVA VERSÃO
function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        createSettingsModal();
    }
    
    // Atualizar dados do usuário no modal
    updateSettingsUserData();
    document.getElementById('settings-modal').classList.remove('hidden');
}

function createSettingsModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-gray-900">
            <!-- Header com botão voltar -->
            <div class="modal-header bg-gray-800 border-b border-gray-700">
                <button id="close-settings-btn" class="text-gray-400 hover:text-white mr-4 text-xl">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 class="text-xl font-bold text-white">Configurações</h2>
            </div>
            
            <!-- Perfil do usuário -->
            <div class="p-6 border-b border-gray-700">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                        <img id="settings-user-photo" src="" alt="Foto do usuário" class="w-16 h-16 rounded-full cursor-pointer" onclick="uploadPhoto()">
                    </div>
                    <div>
                        <h3 id="settings-user-name" class="text-lg font-semibold text-white">teste99</h3>
                        <p class="text-sm text-gray-400">Olá! Eu estou usando o 7Chat...</p>
                    </div>
                </div>
            </div>
            
            <!-- Opções de configuração -->
            <div class="flex-1 overflow-y-auto">
                <!-- Nome -->
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="editName()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Nome</p>
                            <p id="settings-display-name" class="text-white font-medium">teste99</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                
                <!-- Recados -->
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="editStatus()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Recados</p>
                            <p id="settings-status" class="text-white font-medium">Olá! Eu estou usando o 7Chat...</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                
                <!-- Efeitos do Nome -->
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="openNameEffects()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Efeitos do Nome</p>
                            <p class="text-white font-medium">Personalizar aparência</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                
                <!-- Banner do Nome -->
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="openNameBanners()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Banner do Nome</p>
                            <p class="text-white font-medium">Decorações nas salas</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                
                <!-- Sair -->
                <div class="settings-option p-4 cursor-pointer hover:bg-gray-800 transition-colors" onclick="confirmLogout()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-red-400 font-medium">Sair</p>
                            <p class="text-sm text-gray-400">Fazer logout</p>
                        </div>
                        <i class="fas fa-sign-out-alt text-red-400"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modalsContainer.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

// Atualizar dados do usuário no modal de configurações
async function updateSettingsUserData() {
    if (!auth.currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentUser = { uid: auth.currentUser.uid, ...userData };
            
            // Atualizar elementos do modal
            const userPhoto = document.getElementById('settings-user-photo');
            const userName = document.getElementById('settings-user-name');
            const displayName = document.getElementById('settings-display-name');
            const userStatus = document.getElementById('settings-status');
            
            if (userPhoto) userPhoto.src = userData.photoURL || '';
            if (userName) userName.textContent = userData.displayName || 'Usuário';
            if (displayName) displayName.textContent = userData.displayName || 'Usuário';
            if (userStatus) userStatus.textContent = userData.status || 'Olá! Eu estou usando o 7Chat...';
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Busca global
function openGlobalSearch() {
    const modal = document.getElementById('global-search-modal');
    if (!modal) {
        createGlobalSearchModal();
    }
    document.getElementById('global-search-modal').classList.remove('hidden');
    document.getElementById('global-search-input').focus();
}

function createGlobalSearchModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    const modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <button id="close-global-search-btn" class="text-2xl text-gray-400 hover:text-white mr-4">×</button>
                <h2 class="text-xl font-bold text-white">Buscar Usuários</h2>
            </div>
            
            <div class="p-6">
                <div class="mb-6">
                    <input id="global-search-input" type="text" placeholder="Digite o nome do usuário..." 
                           class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div id="search-results" class="space-y-3">
                    <div class="text-center py-8">
                        <i class="fas fa-search text-4xl text-gray-500 mb-4"></i>
                        <p class="text-gray-400">Digite para buscar usuários</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modalsContainer.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-global-search-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Busca com debounce
    let searchTimeout;
    document.getElementById('global-search-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performGlobalSearch(e.target.value.trim());
        }, 500);
    });
}

async function performGlobalSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    
    if (!query) {
        resultsContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-search text-4xl text-gray-500 mb-4"></i>
                <p class="text-gray-400">Digite para buscar usuários</p>
            </div>
        `;
        return;
    }
    
    try {
        // Buscar usuários que começam com a query
        const usersQuery = await db.collection('users')
            .where('displayName', '>=', query)
            .where('displayName', '<=', query + '\uf8ff')
            .limit(10)
            .get();
        
        if (usersQuery.empty) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-user-slash text-4xl text-gray-500 mb-4"></i>
                    <p class="text-gray-400">Nenhum usuário encontrado</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = usersQuery.docs.map(doc => {
            const user = doc.data();
            if (doc.id === auth.currentUser?.uid) return ''; // Não mostrar o próprio usuário
            
            return `
                <div class="search-result-item bg-gray-700 p-4 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="relative">
                                <img src="${user.photoURL}" alt="${user.displayName}" class="w-12 h-12 rounded-full">
                                <div class="absolute bottom-0 right-0 w-3 h-3 ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div>
                            </div>
                            <div>
                                <h3 class="font-semibold text-white">${user.displayName}</h3>
                                <p class="text-sm text-gray-400">${user.status || 'Sem status'}</p>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="sendFriendRequest('${doc.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button onclick="openPrivateChat('${doc.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm">
                                <i class="fas fa-comment"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).filter(html => html).join('');
        
        resultsContainer.innerHTML = resultsHTML || `
            <div class="text-center py-8">
                <i class="fas fa-user-slash text-4xl text-gray-500 mb-4"></i>
                <p class="text-gray-400">Nenhum usuário encontrado</p>
            </div>
        `;
        
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-red-400">Erro na busca</p>
            </div>
        `;
    }
}

// Notificações
function openNotifications() {
    const modal = document.getElementById('notifications-modal');
    if (!modal) {
        createNotificationsModal();
    }
    document.getElementById('notifications-modal').classList.remove('hidden');
    renderNotifications();
}

function createNotificationsModal() {
    const modalsContainer = document.getElementById('modals-container');
    
    const modal = document.createElement('div');
    modal.id = 'notifications-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <button id="close-notifications-btn" class="text-2xl text-gray-400 hover:text-white mr-4">×</button>
                <h2 class="text-xl font-bold text-white">Notificações</h2>
            </div>
            
            <div id="notifications-content" class="flex-1 overflow-y-auto p-6">
                <!-- Conteúdo das notificações -->
            </div>
        </div>
    `;
    
    modalsContainer.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-notifications-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

function renderNotifications() {
    const content = document.getElementById('notifications-content');
    content.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-bell text-4xl text-gray-500 mb-4"></i>
            <p class="text-gray-400">Nenhuma notificação</p>
        </div>
    `;
}

// Visualizador de fotos
function setupPhotoViewer() {
    const modalsContainer = document.getElementById('modals-container');
    
    const modal = document.createElement('div');
    modal.id = 'photo-viewer-modal';
    modal.className = 'hidden';
    
    modal.innerHTML = `
        <div class="modal-content">
            <img id="photo-viewer-img" src="" alt="Foto">
            <button id="close-photo-viewer-btn">×</button>
        </div>
    `;
    
    modalsContainer.appendChild(modal);
    
    // Event listeners
    document.getElementById('close-photo-viewer-btn').addEventListener('click', () => {
        modal.classList.remove('show');
        modal.classList.add('hidden');
    });
}

// Editar nome
async function editName() {
    const newName = await showCustomPrompt('Editar Nome', 'Digite seu novo nome:');
    if (newName && newName.trim()) {
        try {
            await db.collection('users').doc(auth.currentUser.uid).update({
                displayName: newName.trim()
            });
            showNotification('Nome atualizado com sucesso!');
            updateSettingsUserData(); // Atualizar dados na tela
        } catch (error) {
            console.error('Erro ao atualizar nome:', error);
            showNotification('Erro ao atualizar nome', 'error');
        }
    }
}

// Editar status
async function editStatus() {
    const newStatus = await showCustomPrompt('Editar Recados', 'Digite seu novo recado:');
    if (newStatus && newStatus.trim()) {
        try {
            await db.collection('users').doc(auth.currentUser.uid).update({
                status: newStatus.trim()
            });
            showNotification('Recado atualizado com sucesso!');
            updateSettingsUserData(); // Atualizar dados na tela
        } catch (error) {
            console.error('Erro ao atualizar recado:', error);
            showNotification('Erro ao atualizar recado', 'error');
        }
    }
}

// Confirmar logout
async function confirmLogout() {
    const confirm = await showCustomConfirm('Sair', 'Tem certeza que deseja sair da sua conta?');
    if (confirm) {
        logout();
    }
}

// Logout
async function logout() {
    try {
        if (currentUser) {
            // Atualizar status offline antes de sair
            await db.collection('users').doc(currentUser.uid).update({
                isOnline: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        await auth.signOut();
        showNotification('Logout realizado com sucesso!');
    } catch (error) {
        console.error('Erro no logout:', error);
        showNotification('Erro no logout', 'error');
    }
}

// Upload de foto
function uploadPhoto() {
    const input = document.getElementById('photo-upload-input');
    input.click();
    
    input.onchange = function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                updateUserPhoto(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
}

async function updateUserPhoto(photoURL) {
    try {
        await db.collection('users').doc(auth.currentUser.uid).update({
            photoURL: photoURL
        });
        showNotification('Foto atualizada com sucesso!');
        updateSettingsUserData(); // Atualizar dados na tela
    } catch (error) {
        console.error('Erro ao atualizar foto:', error);
        showNotification('Erro ao atualizar foto', 'error');
    }
}

// Exportar funções para uso global
window.openSettings = openSettings;
window.openGlobalSearch = openGlobalSearch;
window.openNotifications = openNotifications;
window.editName = editName;
window.editStatus = editStatus;
window.confirmLogout = confirmLogout;
window.logout = logout;
window.uploadPhoto = uploadPhoto;

export {
    openSettings,
    openGlobalSearch,
    openNotifications,
    editName,
    editStatus,
    logout
};