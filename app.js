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
    // Apenas configurar o visualizador de fotos
    setupPhotoViewer();
    console.log('✅ Event listeners globais configurados');
}

// Efeitos disponíveis
const nameEffects = [
    { name: 'Sem efeito', style: 'color: #ffffff' },
    { name: 'Arco-íris', style: 'background: linear-gradient(90deg, #ff0000, #ff8c00, #ffd700, #32cd32, #00bfff, #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;' },
    { name: 'Dourado', style: 'color: #ffd700; text-shadow: 0 0 10px #ffd700;' },
    { name: 'Neon', style: 'color: #00ffff; text-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff;' },
    { name: 'Holográfico', style: 'background: linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: holographic 2s ease-in-out infinite;' },
    { name: 'Pôr do Sol', style: 'background: linear-gradient(45deg, #ff6b6b, #feca57, #ff9ff3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;' },
    { name: 'Cristal', style: 'color: #b19cd9; text-shadow: 0 0 15px #b19cd9, 0 0 25px #b19cd9;' },
    { name: 'Fogo', style: 'background: linear-gradient(45deg, #ff4757, #ff6b00, #ffa502); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;' },
    { name: 'Oceano', style: 'background: linear-gradient(45deg, #3742fa, #2f3542, #70a1ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;' }
];

// NOVOS BANNERS COM SUPORTE A PNG E SVG
const nameBanners = [
    { 
        name: 'Sem banner', 
        type: 'none',
        value: null,
        preview: '<div class="w-16 h-8 bg-transparent border border-gray-500 rounded flex items-center justify-center text-xs text-gray-400">Sem</div>'
    },
    { 
        name: 'Dragão',
        type: 'png',
        value: 'https://i.imgur.com/ITORmcD.png',
        preview: '<img src="https://i.imgur.com/ITORmcD.png" alt="Banner Dragão" class="w-16 h-8 object-cover rounded">'
    }
];

// CSS para animações
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes holographic {
        0% { filter: hue-rotate(0deg); }
        50% { filter: hue-rotate(180deg); }
        100% { filter: hue-rotate(360deg); }
    }
    
    .photo-viewer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .photo-viewer-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
    }
    
    .photo-viewer-image {
        width: 300px;
        height: 300px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #60a5fa;
        box-shadow: 0 0 30px rgba(96, 165, 250, 0.5);
    }
    
    .photo-viewer-close {
        position: absolute;
        top: -15px;
        right: -15px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #ef4444;
        color: white;
        border: none;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .photo-viewer-close:hover {
        background: #dc2626;
        transform: scale(1.1);
    }

    .modal-header-btn {
        color: #60a5fa; /* Cor azul do Tailwind (blue-400) */
        font-weight: 700; /* Equivalente a font-bold */
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        transition: background-color 0.2s, color 0.2s;
    }
    .modal-header-btn:hover {
        color: #93c5fd; /* Cor azul do Tailwind (blue-300) */
        background-color: rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(styleSheet);

// Funções expostas para o escopo global
window.openSettings = function() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        createSettingsModal();
    }
    updateSettingsUserData();
    document.getElementById('settings-modal').classList.remove('hidden');
};

function createSettingsModal() {
    const modalsContainer = document.getElementById('modals-container');
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content bg-gray-900">
            <div class="modal-header bg-gray-800 border-b border-gray-700">
                <button id="close-settings-btn" class="text-gray-400 hover:text-white mr-4 text-xl">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 class="text-xl font-bold text-white">Configurações</h2>
            </div>
            <div class="p-4 border-b border-gray-700 relative h-32 flex items-center bg-gray-800/50">
                <div id="settings-user-banner-container" class="absolute inset-0 w-full h-full" style="z-index: 1;"></div>
                <div class="absolute inset-0 w-full h-full bg-black/40" style="z-index: 2;"></div>
                <div class="relative w-full flex items-center space-x-4" style="z-index: 3;">
                     <div class="w-20 h-20 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-gray-600">
                        <img id="settings-user-photo" src="" alt="Foto do usuário" class="w-full h-full rounded-full cursor-pointer" onclick="viewPhoto(this.src)">
                    </div>
                    <div class="flex-grow">
                        <h3 id="settings-user-name" class="text-xl font-bold text-white px-2 py-1" style="text-shadow: 1px 1px 5px rgba(0,0,0,0.8);">Carregando...</h3>
                        <p id="settings-user-status" class="text-sm text-gray-200 mt-1 px-2 truncate" style="text-shadow: 1px 1px 4px rgba(0,0,0,0.9);">Carregando...</p>
                    </div>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto">
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="editName()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Nome</p>
                             <p id="settings-display-name" class="text-white font-medium px-2 py-1">Carregando...</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="editStatus()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Recados</p>
                            <p id="settings-status" class="text-white font-medium">Carregando...</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="openNameEffects()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Efeitos do Nome</p>
                            <p class="text-white font-medium">Personalizar aparência</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
                <div class="settings-option p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors" onclick="openNameBanners()">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-400 mb-1">Banner do Nome</p>
                            <p class="text-white font-medium">Imagens de fundo</p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                </div>
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
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

function applyNameBanner(containerElement, nameElement, bannerIndex) {
    if (!containerElement || !nameElement) return;
    containerElement.innerHTML = '';
    containerElement.style.backgroundImage = 'none';
    containerElement.style.backgroundColor = 'transparent';

    const banner = nameBanners[bannerIndex];
    if (!banner || banner.type === 'none') return;

    if (banner.type === 'svg') {
        containerElement.innerHTML = banner.value;
        const svgElement = containerElement.querySelector('svg');
        if (svgElement) {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            svgElement.style.objectFit = 'cover';
        }
    } else if (banner.type === 'png') {
        containerElement.style.backgroundImage = `url('${banner.value}')`;
        containerElement.style.backgroundSize = 'cover';
        containerElement.style.backgroundPosition = 'center';
        containerElement.style.backgroundRepeat = 'no-repeat';
    }
}

async function updateSettingsUserData() {
    if (!auth.currentUser) return;
    try {
        const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            currentUser = { uid: auth.currentUser.uid, ...userData };
            
            const userPhoto = document.getElementById('settings-user-photo');
            const userName = document.getElementById('settings-user-name');
            const displayName = document.getElementById('settings-display-name');
            const userStatus = document.getElementById('settings-status');
            const userStatusTop = document.getElementById('settings-user-status');
            const userBannerContainer = document.getElementById('settings-user-banner-container');
            
            const realName = userData.displayName || auth.currentUser.displayName || 'Usuário';
            const userCurrentStatus = userData.status || 'Olá! Eu estou usando o 7Chat...';
            
            let effectIndex = (typeof userData.nameEffect === 'number' && nameEffects[userData.nameEffect]) ? userData.nameEffect : 0;
            let bannerIndex = (typeof userData.nameBanner === 'number' && nameBanners[userData.nameBanner]) ? userData.nameBanner : 0;

            if (userPhoto) userPhoto.src = userData.photoURL || 'https://via.placeholder.com/64x64/4b5563/ffffff?text= ';
            if (userName) applyNameBanner(userBannerContainer, userName, bannerIndex);
            
            if (userName) {
                userName.textContent = realName;
                userName.style.cssText = nameEffects[effectIndex].style + " text-shadow: 1px 1px 5px rgba(0,0,0,0.8);";
            }
            if (displayName) {
                displayName.textContent = realName;
                displayName.style.cssText = nameEffects[effectIndex].style;
            }
            if (userStatus) userStatus.textContent = userCurrentStatus;
            if (userStatusTop) userStatusTop.textContent = userCurrentStatus;
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

window.viewPhoto = function(photoUrl) {
    if (!photoUrl || photoUrl.includes('placeholder')) return;
    const existingViewer = document.getElementById('photo-viewer');
    if (existingViewer) existingViewer.remove();
    
    const viewer = document.createElement('div');
    viewer.id = 'photo-viewer';
    viewer.className = 'photo-viewer-overlay';
    
    viewer.innerHTML = `
        <div class="photo-viewer-content">
            <img src="${photoUrl}" alt="Foto do perfil" class="photo-viewer-image">
            <button class="photo-viewer-close" onclick="closePhotoViewer()">×</button>
        </div>
    `;
    
    document.body.appendChild(viewer);
    viewer.addEventListener('click', (e) => {
        if (e.target === viewer) {
            window.closePhotoViewer();
        }
    });
}

window.closePhotoViewer = function() {
    const viewer = document.getElementById('photo-viewer');
    if (viewer) viewer.remove();
}

window.openGlobalSearch = function() {
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
                <div class="mb-6"><input id="global-search-input" type="text" placeholder="Digite o nome..." class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></div>
                <div id="search-results" class="space-y-3"><div class="text-center py-8"><i class="fas fa-search text-4xl text-gray-500 mb-4"></i><p class="text-gray-400">Digite para buscar</p></div></div>
            </div>
        </div>`;
    
    modalsContainer.appendChild(modal);
    document.getElementById('close-global-search-btn').addEventListener('click', () => modal.classList.add('hidden'));
    
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
        resultsContainer.innerHTML = `<div class="text-center py-8"><i class="fas fa-search text-4xl text-gray-500 mb-4"></i><p class="text-gray-400">Digite para buscar usuários</p></div>`;
        return;
    }
    
    try {
        const usersQuery = await db.collection('users').where('displayName', '>=', query).where('displayName', '<=', query + '\uf8ff').limit(10).get();
        if (usersQuery.empty) {
            resultsContainer.innerHTML = `<div class="text-center py-8"><i class="fas fa-user-slash text-4xl text-gray-500 mb-4"></i><p class="text-gray-400">Nenhum usuário encontrado</p></div>`;
            return;
        }
        
        const resultsHTML = usersQuery.docs.map(doc => {
            const user = doc.data();
            if (doc.id === auth.currentUser?.uid) return '';
            return `
                <div class="search-result-item bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="relative"><img src="${user.photoURL || 'https://via.placeholder.com/48x48/4b5563/ffffff?text=👤'}" alt="${user.displayName}" class="w-12 h-12 rounded-full"><div class="absolute bottom-0 right-0 w-3 h-3 ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full border-2 border-gray-800"></div></div>
                        <div><h3 class="font-semibold text-white">${user.displayName}</h3><p class="text-sm text-gray-400">${user.status || 'Sem status'}</p></div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="sendFriendRequest('${doc.id}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"><i class="fas fa-user-plus"></i></button>
                        <button onclick="openPrivateChat('${doc.id}')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"><i class="fas fa-comment"></i></button>
                    </div>
                </div>`;
        }).join('');
        
        resultsContainer.innerHTML = resultsHTML || `<div class="text-center py-8"><i class="fas fa-user-slash text-4xl text-gray-500 mb-4"></i><p class="text-gray-400">Nenhum usuário encontrado</p></div>`;
    } catch (error) {
        console.error('Erro na busca:', error);
        resultsContainer.innerHTML = `<div class="text-center py-8"><i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i><p class="text-red-400">Erro na busca</p></div>`;
    }
}

window.openNotifications = function() {
    const modal = document.getElementById('notifications-modal');
    if (!modal) createNotificationsModal();
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
            <div class="modal-header"><button id="close-notifications-btn" class="text-2xl text-gray-400 hover:text-white mr-4">×</button><h2 class="text-xl font-bold text-white">Notificações</h2></div>
            <div id="notifications-content" class="flex-1 overflow-y-auto p-6"></div>
        </div>`;
    modalsContainer.appendChild(modal);
    document.getElementById('close-notifications-btn').addEventListener('click', () => modal.classList.add('hidden'));
}

function renderNotifications() {
    document.getElementById('notifications-content').innerHTML = `<div class="text-center py-8"><i class="fas fa-bell text-4xl text-gray-500 mb-4"></i><p class="text-gray-400">Nenhuma notificação</p></div>`;
}

function setupPhotoViewer() {
    const modalsContainer = document.getElementById('modals-container');
    if (document.getElementById('photo-viewer-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'photo-viewer-modal';
    modal.className = 'hidden';
    modal.innerHTML = `<div class="modal-content"><img id="photo-viewer-img" src="" alt="Foto"><button id="close-photo-viewer-btn">×</button></div>`;
    modalsContainer.appendChild(modal);
    document.getElementById('close-photo-viewer-btn').addEventListener('click', () => modal.classList.add('hidden'));
}

window.editName = function() {
    const modal = document.getElementById('edit-name-modal');
    if (!modal) createEditNameModal();
    if (currentUser) document.getElementById('edit-name-input').value = currentUser.displayName || '';
    document.getElementById('edit-name-modal').classList.remove('hidden');
    document.getElementById('edit-name-input').focus();
}

function createEditNameModal() {
    const modalsContainer = document.getElementById('modals-container');
    const modal = document.createElement('div');
    modal.id = 'edit-name-modal';
    modal.className = 'hidden modal';
    modal.innerHTML = `
        <div class="modal-content max-w-sm" style="background-color: #1e293b; border-radius: 12px;">
            <div class="flex items-center justify-between p-4" style="border-bottom: 1px solid #334155;">
                <button id="cancel-edit-name-btn" class="modal-header-btn">Cancelar</button>
                <h2 class="text-white font-medium text-center">Usuário</h2>
                <button id="save-edit-name-btn" class="modal-header-btn">Salvar</button>
            </div>
            <div class="p-6">
                <div class="mb-2">
                    <label for="edit-name-input" class="block text-white text-sm font-medium mb-3">Nome</label>
                    <input id="edit-name-input" type="text" maxlength="30" class="w-full px-3 py-2 text-white placeholder-gray-400 focus:outline-none" style="background-color: #0f172a; border: 2px solid #1e40af; border-radius: 8px;">
                </div><p class="text-gray-400 text-xs">Máximo 30 caracteres</p>
            </div>
        </div>`;
    modalsContainer.appendChild(modal);
    document.getElementById('cancel-edit-name-btn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('save-edit-name-btn').addEventListener('click', saveNameEdit);
    const input = document.getElementById('edit-name-input');
    input.addEventListener('focus', () => input.style.borderColor = '#3b82f6');
    input.addEventListener('blur', () => input.style.borderColor = '#1e40af');
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveNameEdit(); });
}

async function saveNameEdit() {
    const newName = document.getElementById('edit-name-input').value.trim();
    if (!newName || newName.length > 30) {
        showNotification('Nome inválido. Máximo 30 caracteres.', 'error');
        return;
    }
    try {
        await db.collection('users').doc(auth.currentUser.uid).update({ displayName: newName });
        showNotification('Nome atualizado!');
        updateSettingsUserData();
        document.getElementById('edit-name-modal').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao atualizar nome:', error);
        showNotification('Erro ao atualizar nome.', 'error');
    }
}

window.editStatus = function() {
    const modal = document.getElementById('edit-status-modal');
    if (!modal) createEditStatusModal();
    if (currentUser) document.getElementById('edit-status-input').value = currentUser.status || '';
    document.getElementById('edit-status-modal').classList.remove('hidden');
    document.getElementById('edit-status-input').focus();
}

function createEditStatusModal() {
    const modalsContainer = document.getElementById('modals-container');
    const modal = document.createElement('div');
    modal.id = 'edit-status-modal';
    modal.className = 'hidden modal';
    modal.innerHTML = `
        <div class="modal-content max-w-sm" style="background-color: #1e293b; border-radius: 12px;">
            <div class="flex items-center justify-between p-4" style="border-bottom: 1px solid #334155;">
                <button id="cancel-edit-status-btn" class="modal-header-btn">Cancelar</button>
                <h2 class="text-white font-medium text-center">Recados</h2>
                <button id="save-edit-status-btn" class="modal-header-btn">Salvar</button>
            </div>
            <div class="p-6">
                <div class="mb-2">
                    <label for="edit-status-input" class="block text-white text-sm font-medium mb-3">Status</label>
                    <input id="edit-status-input" type="text" maxlength="150" class="w-full px-3 py-2 text-white placeholder-gray-400 focus:outline-none" style="background-color: #0f172a; border: 2px solid #1e40af; border-radius: 8px;">
                </div><p class="text-gray-400 text-xs">Máximo 150 caracteres</p>
            </div>
        </div>`;
    modalsContainer.appendChild(modal);
    document.getElementById('cancel-edit-status-btn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('save-edit-status-btn').addEventListener('click', saveStatusEdit);
}

async function saveStatusEdit() {
    const newStatus = document.getElementById('edit-status-input').value.trim();
    if (newStatus.length > 150) {
        showNotification('Status muito longo.', 'error');
        return;
    }
    try {
        await db.collection('users').doc(auth.currentUser.uid).update({ status: newStatus || 'Olá! Eu estou usando o 7Chat...' });
        showNotification('Status atualizado!');
        updateSettingsUserData();
        document.getElementById('edit-status-modal').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification('Erro ao atualizar status.', 'error');
    }
}

window.openNameEffects = function() {
    const modal = document.getElementById('name-effects-modal');
    if (!modal) createNameEffectsModal();
    document.getElementById('name-effects-modal').classList.remove('hidden');
}

function createNameEffectsModal() {
    const modalsContainer = document.getElementById('modals-container');
    const modal = document.createElement('div');
    modal.id = 'name-effects-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content max-w-sm" style="background-color: #1e293b; border-radius: 12px;">
            <div class="flex items-center justify-between p-4" style="border-bottom: 1px solid #334155;">
                <button id="cancel-name-effects-btn" class="modal-header-btn">Cancelar</button>
                <h2 class="text-white font-medium">Efeitos do Nome</h2>
                <button id="save-name-effects-btn" class="modal-header-btn">Salvar</button>
            </div>
            <div class="p-4 text-center" style="border-bottom: 1px solid #334155;">
                <p class="text-gray-400 text-sm mb-2">Prévia:</p>
                <h3 id="name-preview" class="text-xl font-bold">teste99</h3>
            </div>
            <div class="flex-1 overflow-y-auto max-h-96">
                ${nameEffects.map((effect, index) => `<div class="effect-option p-4 cursor-pointer hover:bg-gray-700 flex items-center justify-between" data-effect="${index}" style="border-bottom: 1px solid #334155;"><span class="text-white font-medium" style="${effect.style}">${effect.name}</span><div class="w-5 h-5 rounded-full border-2 border-gray-500 effect-radio" data-effect="${index}"></div></div>`).join('')}
            </div>
        </div>`;
    modalsContainer.appendChild(modal);

    let selectedEffect = currentUser?.nameEffect || 0;
    
    function selectEffect(index) {
        if (typeof index !== 'number' || !nameEffects[index]) return;
        selectedEffect = index;
        const preview = document.getElementById('name-preview');
        preview.textContent = currentUser?.displayName || 'teste99';
        preview.style.cssText = nameEffects[index].style;
        modal.querySelectorAll('.effect-radio').forEach((radio, i) => {
            radio.style.backgroundColor = i === index ? '#60a5fa' : 'transparent';
            radio.style.borderColor = i === index ? '#60a5fa' : '#6b7280';
        });
    }

    modal.querySelectorAll('.effect-option').forEach(option => {
        option.addEventListener('click', () => selectEffect(parseInt(option.dataset.effect)));
    });
    document.getElementById('cancel-name-effects-btn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('save-name-effects-btn').addEventListener('click', () => saveNameEffect(selectedEffect));
    
    selectEffect(selectedEffect);
}

async function saveNameEffect(effectIndex) {
    try {
        await db.collection('users').doc(auth.currentUser.uid).update({ nameEffect: effectIndex });
        showNotification('Efeito atualizado!');
        updateSettingsUserData();
        document.getElementById('name-effects-modal').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao salvar efeito:', error);
        showNotification('Erro ao salvar efeito.', 'error');
    }
}

window.openNameBanners = function() {
    const modal = document.getElementById('name-banners-modal');
    if (!modal) createNameBannersModal();
    document.getElementById('name-banners-modal').classList.remove('hidden');
}

function createNameBannersModal() {
    const modalsContainer = document.getElementById('modals-container');
    const modal = document.createElement('div');
    modal.id = 'name-banners-modal';
    modal.className = 'hidden modal';
    
    modal.innerHTML = `
        <div class="modal-content max-w-sm" style="background-color: #1e293b; border-radius: 12px;">
            <div class="flex items-center justify-between p-4" style="border-bottom: 1px solid #334155;">
                <button id="cancel-name-banners-btn" class="modal-header-btn">Cancelar</button>
                <h2 class="text-white font-medium">Banner do Nome</h2>
                <button id="save-name-banners-btn" class="modal-header-btn">Salvar</button>
            </div>
            <div class="p-4 text-center" style="border-bottom: 1px solid #334155;">
                 <p class="text-gray-400 text-sm mb-2">Prévia:</p>
                 <div class="relative inline-block w-full h-24 mx-auto rounded-lg overflow-hidden bg-gray-800">
                     <div id="banner-preview-container" class="absolute inset-0 z-10"></div>
                     <h3 id="banner-preview-name" class="relative z-20 text-2xl font-bold flex items-center justify-center h-full w-full">teste99</h3>
                 </div>
            </div>
            <div class="flex-1 overflow-y-auto max-h-80"><div class="grid grid-cols-3 gap-3 p-4">${nameBanners.map((banner, index) => `<div class="banner-option cursor-pointer p-2 rounded-lg hover:bg-gray-700 flex flex-col items-center justify-center relative" data-banner="${index}">${banner.preview}<p class="text-xs text-gray-300 mt-2 text-center">${banner.name}</p><div class="absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-gray-500 banner-radio"></div></div>`).join('')}</div></div>
        </div>`;
    modalsContainer.appendChild(modal);

    let selectedBanner = currentUser?.nameBanner || 0;
    
    function selectBanner(index) {
        selectedBanner = index;
        const previewName = document.getElementById('banner-preview-name');
        applyNameBanner(document.getElementById('banner-preview-container'), previewName, index);

        if (index > 0) {
            previewName.style.cssText = 'color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);';
        } else {
            let effectIndex = currentUser?.nameEffect || 0;
            if (typeof effectIndex !== 'number' || !nameEffects[effectIndex]) effectIndex = 0;
            previewName.style.cssText = nameEffects[effectIndex].style;
        }
        modal.querySelectorAll('.banner-radio').forEach((radio, i) => {
            radio.style.backgroundColor = i === index ? '#60a5fa' : 'transparent';
            radio.style.borderColor = i === index ? '#60a5fa' : '#6b7280';
        });
    }

    modal.querySelectorAll('.banner-option').forEach(option => {
        option.addEventListener('click', () => selectBanner(parseInt(option.dataset.banner)));
    });
    document.getElementById('cancel-name-banners-btn').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('save-name-banners-btn').addEventListener('click', () => saveNameBanner(selectedBanner));
    
    selectBanner(selectedBanner);
}

async function saveNameBanner(bannerIndex) {
    try {
        await db.collection('users').doc(auth.currentUser.uid).update({ nameBanner: bannerIndex });
        showNotification('Banner atualizado!');
        updateSettingsUserData();
        document.getElementById('name-banners-modal').classList.add('hidden');
    } catch (error) {
        console.error('Erro ao salvar banner:', error);
        showNotification('Erro ao salvar banner.', 'error');
    }
}

window.confirmLogout = function() {
    showCustomPrompt({
        title: 'Confirmar Saída',
        message: 'Você tem certeza que deseja sair?',
        confirmText: 'Sair',
        cancelText: 'Cancelar',
        onConfirm: logout
    });
}

function logout() {
    auth.signOut().then(() => {
        window.location.href = '/index.html';
    }).catch(error => {
        showNotification('Erro ao tentar sair.', 'error');
    });
}

window.sendFriendRequest = async function(userId) {
    if (!auth.currentUser) return;
    showNotification('Função de amizade ainda não implementada.');
}

window.openPrivateChat = function(userId) {
    if (!auth.currentUser) return;
    showNotification('Função de chat ainda não implementada.');
}