// --- Funções de Notificação e Utilitários de UI ---

export function showNotification(message, type = 'info') {
    const toast = document.getElementById('notification-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `fixed bottom-20 md:bottom-5 right-5 py-2 px-4 rounded-lg shadow-xl z-[1001] text-white ${type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

export function showCustomPrompt(titleText, messageText) {
    return new Promise((resolve) => {
        const modalId = 'custom-prompt-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            const modalHTML = `
                <div id="${modalId}" class="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4">
                    <div class="modal-content bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md space-y-4 border border-gray-700">
                        <h3 id="custom-prompt-title" class="text-2xl font-bold text-white"></h3>
                        <p id="custom-prompt-message" class="text-gray-300 text-lg"></p>
                        <input type="text" id="custom-prompt-input" placeholder="Digite aqui..." class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white" maxlength="30">
                        <div class="flex space-x-3 pt-2">
                            <button id="custom-prompt-cancel-btn" class="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cancelar</button>
                            <button id="custom-prompt-ok-btn" class="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirmar</button>
                        </div>
                    </div>
                </div>`;
            document.getElementById('modals-container').insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById(modalId);
        }

        const title = modal.querySelector('#custom-prompt-title');
        const message = modal.querySelector('#custom-prompt-message');
        const input = modal.querySelector('#custom-prompt-input');
        const okBtn = modal.querySelector('#custom-prompt-ok-btn');
        const cancelBtn = modal.querySelector('#custom-prompt-cancel-btn');

        title.textContent = titleText;
        message.textContent = messageText;
        input.value = '';

        const closeModal = (value) => {
            modal.classList.add('hidden');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(value);
        };
        
        okBtn.onclick = () => {
            if (input.value.trim()) closeModal(input.value.trim());
        };
        cancelBtn.onclick = () => closeModal(null);

        modal.classList.remove('hidden');
        input.focus();
    });
}

export function updateNav(activeId) {
    document.querySelectorAll('#bottom-nav a').forEach(item => {
        item.classList.remove('text-indigo-400', 'border-t-2', 'border-indigo-500');
        item.classList.add('text-gray-400');
    });
    const activeElement = document.getElementById(activeId);
    if(activeElement) {
        activeElement.classList.remove('text-gray-400');
        activeElement.classList.add('text-indigo-400', 'border-t-2', 'border-indigo-500');
    }
}

// --- FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO ---

// Função que constrói a estrutura principal do aplicativo após o login
export function renderAppLayout() {
    const mainApp = document.getElementById('main-app');
    if (!mainApp) return;

    // Previne a reinjeção do layout se ele já existir
    if (mainApp.querySelector('#app-content')) return;

    mainApp.innerHTML = `
        <div id="app-content" class="flex-1 overflow-y-auto">
            <!-- Tela de Salas (Conversas) -->
            <div id="rooms-screen" class="main-screen flex flex-col h-full">
                <header id="app-header" class="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
                    <button id="notifications-btn" class="relative w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <i class="fas fa-bell text-gray-300 text-lg"></i>
                        <span id="notifications-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"></span>
                    </button>
                    <h1 class="text-white font-semibold text-xl">Conversas</h1>
                    <div id="header-profile-btn" class="w-10 h-10 rounded-full bg-gray-600 border-2 border-gray-500 overflow-hidden cursor-pointer">
                        <img class="user-profile-pic w-full h-full object-cover hidden" alt="Perfil">
                        <div class="user-profile-icon w-full h-full flex items-center justify-center"><i class="fas fa-user text-gray-400"></i></div>
                    </div>
                </header>
                <div id="conversations-list" class="p-4 flex-1 overflow-y-auto">
                    <!-- Lista de conversas será renderizada aqui -->
                </div>
            </div>

            <!-- Tela de Amigos -->
            <div id="friends-screen" class="main-screen flex-col h-full hidden">
                 <header id="friends-header" class="bg-gray-800 px-4 py-3 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
                    <div class="w-10"></div>
                    <h1 class="text-white font-semibold text-xl">Amigos</h1>
                    <button id="global-search-btn" class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <i class="fas fa-search text-gray-300 text-lg"></i>
                    </button>
                </header>
                <div class="bg-gray-800 border-b border-gray-700 flex-shrink-0">
                    <div id="friends-tabs" class="flex">
                        <button data-tab="online" class="tab-button flex-1 py-3 px-4 text-center font-medium active">Online</button>
                        <button data-tab="all" class="tab-button flex-1 py-3 px-4 text-center font-medium text-gray-400">Todos</button>
                        <button data-tab="pending" class="tab-button flex-1 py-3 px-4 text-center font-medium text-gray-400">Pendentes</button>
                    </div>
                </div>
                <div id="friends-content-container" class="p-4 flex-1 overflow-y-auto">
                    <!-- Conteúdo das abas de amigos será renderizado aqui -->
                </div>
            </div>
        </div>
        <nav id="bottom-nav" class="bg-gray-900 border-t border-gray-700 shadow-lg z-50 flex-shrink-0">
            <div class="flex justify-around text-gray-400">
                <a href="#" id="nav-rooms" class="flex flex-col items-center justify-center p-3 text-center w-full text-indigo-400 border-t-2 border-indigo-500">
                    <i class="fas fa-comments text-xl"></i><span class="text-xs font-medium">Salas</span>
                </a>
                <a href="#" id="nav-friends" class="flex flex-col items-center justify-center p-3 text-center w-full text-gray-400">
                    <i class="fas fa-user-friends text-xl"></i><span class="text-xs font-medium">Amigos</span>
                </a>
                <a href="#" id="nav-settings" class="flex flex-col items-center justify-center p-3 text-center w-full text-gray-400">
                    <i class="fas fa-cog text-xl"></i><span class="text-xs font-medium">Config.</span>
                </a>
            </div>
        </nav>
    `;
}


// Função que injeta o HTML de todos os modais na página
export function injectAllModals() {
    const modalsContainer = document.getElementById('modals-container');
    if (!modalsContainer || modalsContainer.innerHTML !== '') return; // Previne reinjeção
    
    modalsContainer.innerHTML = `
        <!-- Modal de Busca Global (exemplo) -->
        <div id="global-search-modal" class="fullscreen-modal hidden fixed inset-0 bg-gray-900 z-[1000] flex flex-col">
            <header class="modal-header flex items-center px-4 py-3">
                 <button id="close-search-btn" class="text-gray-400 hover:text-white"><i class="fas fa-arrow-left text-xl"></i></button>
                 <h3 class="text-white font-semibold text-lg ml-4">Buscar Usuários</h3>
            </header>
            <div class="p-4">
                <input id="search-users-input" class="w-full bg-gray-700 text-white rounded-lg p-3" placeholder="Digite um nome de usuário...">
            </div>
            <div id="search-results-container" class="p-4 flex-1 overflow-y-auto"></div>
        </div>

        <!-- Modal de Notificações -->
        <div id="notifications-modal" class="fullscreen-modal hidden fixed inset-0 bg-gray-900 z-[1000] flex flex-col">
            <header class="modal-header flex items-center px-4 py-3">
                 <button id="close-notifications-btn" class="text-gray-400 hover:text-white"><i class="fas fa-arrow-left text-xl"></i></button>
                 <h3 class="text-white font-semibold text-lg ml-4">Notificações</h3>
            </header>
            <div id="friend-requests-list" class="p-4 flex-1 overflow-y-auto"></div>
        </div>

        <!-- Modal de Configurações -->
        <div id="settings-modal" class="fullscreen-modal hidden fixed inset-0 bg-gray-900 z-[1000] flex flex-col">
             <header class="modal-header flex items-center px-4 py-3">
                 <button id="close-settings-btn" class="text-gray-400 hover:text-white"><i class="fas fa-arrow-left text-xl"></i></button>
                 <h3 class="text-white font-semibold text-lg ml-4">Configurações</h3>
            </header>
            <div class="p-6 flex-1 overflow-y-auto">
                <!-- Opções de Configurações Aqui -->
                <button id="logout-btn" class="w-full mt-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Sair da Conta</button>
            </div>
        </div>
        
        <!-- Chat Screen (agora é um modal também) -->
        <div id="chat-screen"></div>
    `;
}

// Função para atualizar a interface do usuário com os dados recebidos
export function updateUserInterface(userData) {
    if (!userData) return;

    // Atualiza avatares
    document.querySelectorAll('.user-profile-pic').forEach(img => {
        if (userData.photoURL) {
            img.src = userData.photoURL;
            img.classList.remove('hidden');
            img.nextElementSibling?.classList.add('hidden'); // Esconde o ícone placeholder
        } else {
            img.classList.add('hidden');
            img.nextElementSibling?.classList.remove('hidden'); // Mostra o ícone placeholder
        }
    });

    // Atualiza nomes
    document.querySelectorAll('.user-display-name').forEach(el => {
        el.textContent = userData.username || 'Usuário';
    });
}
