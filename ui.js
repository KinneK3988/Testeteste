// Sistema de notificações e UI

let notificationContainer = null;

// Inicializar container de notificações
function initNotifications() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'fixed top-4 right-4 z-[101] space-y-2';
        document.body.appendChild(notificationContainer);
    }
}

// Função principal de notificação
export function showNotification(message, type = 'success', duration = 3000) {
    initNotifications();
    
    const notification = document.createElement('div');
    
    // Classes base
    notification.className = 'notification-item transform transition-all duration-300 ease-in-out translate-x-full opacity-0 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm border-l-4';
    
    // Adicionar cor da borda baseada no tipo
    if (type === 'error') {
        notification.style.borderLeftColor = '#ef4444'; // red-500
    } else if (type === 'warning') {
        notification.style.borderLeftColor = '#f59e0b'; // amber-500
    } else { // success
        notification.style.borderLeftColor = '#10b981'; // emerald-500
    }
    
    // Ícone baseado no tipo (Corrigido para evitar caracteres problemáticos)
    let icon = '✅';
    if (type === 'error') {
        icon = '❌';
    } else if (type === 'warning') {
        icon = '⚠'; 
    }
    
    // Criar estrutura HTML
    const flexDiv = document.createElement('div');
    flexDiv.className = 'flex items-center space-x-3';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'text-lg';
    iconSpan.textContent = icon;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex-1';
    
    const messageParagraph = document.createElement('p');
    messageParagraph.className = 'text-sm font-medium';
    messageParagraph.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-400 hover:text-white ml-2';
    closeButton.textContent = '✕';
    closeButton.onclick = function() {
        removeNotification(notification);
    };
    
    // Montar estrutura
    messageDiv.appendChild(messageParagraph);
    flexDiv.appendChild(iconSpan);
    flexDiv.appendChild(messageDiv);
    flexDiv.appendChild(closeButton);
    notification.appendChild(flexDiv);
    
    notificationContainer.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
        notification.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // Auto remover
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
}

// Remover notificação com animação
function removeNotification(notification) {
    if (notification && notification.parentElement) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }
}


/**
 * Gera um nome de convidado aleatório.
 * @returns {string}
 */
export function generateGuestName() {
    const adjectives = ['Incrível', 'Fantástico', 'Brilhante', 'Épico', 'Mágico', 'Corajoso', 'Sábio', 'Veloz'];
    const nouns = ['Guerreiro', 'Mago', 'Ninja', 'Dragão', 'Fênix', 'Lobo', 'Águia', 'Leão'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${adjective}${noun}${number}`;
}


// Prompt customizado (Base para confirmações e alertas)
function showCustomPrompt(options) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]';
        
        const modal = document.createElement('div');
        modal.className = 'bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 border border-gray-700 shadow-xl';
        
        // Criar estrutura do modal
        const titleElement = document.createElement('h3');
        titleElement.className = 'text-lg font-semibold text-white mb-2 text-center';
        titleElement.textContent = options.title || 'Confirmação';
        
        const messageElement = document.createElement('p');
        messageElement.className = 'text-gray-300 mb-6 text-center';
        messageElement.textContent = options.message || 'Tem certeza?';
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'flex space-x-3';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors';
        cancelButton.textContent = options.cancelText || 'Cancelar';
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg transition-colors';
        confirmButton.textContent = options.confirmText || 'Confirmar';
        
        // Montar estrutura
        buttonsDiv.appendChild(cancelButton);
        buttonsDiv.appendChild(confirmButton);
        
        modal.appendChild(titleElement);
        modal.appendChild(messageElement);
        modal.appendChild(buttonsDiv);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Função para limpar e remover o modal
        const closeModal = (value) => {
            document.body.removeChild(overlay);
            resolve(value);
        };

        // Event listeners
        cancelButton.addEventListener('click', () => closeModal(false));
        confirmButton.addEventListener('click', () => closeModal(true));
        
        // Fechar ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(false);
            }
        });
    });
}

/**
 * Exibe um modal de confirmação simples, aceitando title e message como argumentos separados.
 * @param {string} title O título do modal.
 * @param {string} message A mensagem a ser exibida.
 * @returns {Promise<boolean>}
 */
export function showCustomConfirm(title, message) {
    return showCustomPrompt({
        title: title,
        message: message,
        confirmText: 'Sim',
        cancelText: 'Não'
    });
}

// Toast rápido
export function showToast(message, type = 'info') {
    showNotification(message, type, 2000);
}

// Loading overlay
export function showLoading(message = 'A carregar...') {
    // Remover loading existente para evitar duplicação
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[102]';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'bg-gray-800 rounded-lg p-6 text-center border border-gray-700 flex items-center space-x-4';
    
    const spinner = document.createElement('div');
    spinner.className = 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500';
    
    const messageElement = document.createElement('p');
    messageElement.className = 'text-white';
    messageElement.textContent = message;
    
    contentDiv.appendChild(spinner);
    contentDiv.appendChild(messageElement);
    overlay.appendChild(contentDiv);
    
    document.body.appendChild(overlay);
}

// Remover loading
export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// **CORREÇÃO: Funções de renderização principal e navegação adicionadas e exportadas**
export function renderMainApp() {
    const appContent = document.getElementById('app-content');
    const bottomNav = document.getElementById('bottom-nav');

    if (!appContent || !bottomNav) {
        console.error("Elementos principais da aplicação (app-content, bottom-nav) não encontrados.");
        return;
    }
    
    // O ideal é que o HTML da app seja injetado uma vez e depois apenas se manipulem as classes 'hidden'
    appContent.innerHTML = `
        <div id="chats-screen" class="h-full flex flex-col"></div>
        <div id="friends-screen" class="hidden h-full flex flex-col"></div>
        <div id="rooms-screen" class="hidden h-full flex flex-col"></div>
        <div id="room-screen" class="hidden h-full flex flex-col"></div>
    `;
    
    bottomNav.innerHTML = `
        <div class="bg-gray-800 border-t border-gray-700 px-4 py-2 flex justify-around">
            <button data-nav="friends" class="nav-button flex flex-col items-center p-2 text-gray-400">
                <i class="fas fa-users text-xl mb-1"></i>
                <span class="text-xs">Amigos</span>
            </button>
            <button data-nav="chats" class="nav-button flex flex-col items-center p-2 text-blue-400">
                <i class="fas fa-comments text-xl mb-1"></i>
                <span class="text-xs">Chats</span>
            </button>
            <button data-nav="settings" class="nav-button flex flex-col items-center p-2 text-gray-400">
                <i class="fas fa-cog text-xl mb-1"></i>
                <span class="text-xs">Configuração</span>
            </button>
        </div>
    `;

    // Adiciona event listeners para a navegação
    bottomNav.addEventListener('click', (e) => {
        const navButton = e.target.closest('.nav-button');
        if (!navButton) return;

        const navTarget = navButton.dataset.nav;
        switch(navTarget) {
            case 'friends':
                showFriendsScreen();
                break;
            case 'chats':
                showChatsScreen();
                break;
            case 'settings':
                // Assumindo que openSettings() está definida globalmente ou importada
                if (window.openSettings) window.openSettings();
                break;
        }
    });

    // Mostra o ecrã de chats por defeito
    showChatsScreen();
    // loadConversations(); // Esta chamada deve ser feita no contexto apropriado, não aqui.
}

export function showChatsScreen() {
    document.getElementById('chats-screen').classList.remove('hidden');
    document.getElementById('friends-screen').classList.add('hidden');
    document.getElementById('rooms-screen').classList.add('hidden');
    document.getElementById('room-screen').classList.add('hidden');
    updateNavigation('chats');
    // Aqui seria renderizada a tela de chats, se necessário.
    // Ex: renderChatsScreen();
}

export function showFriendsScreen() {
    document.getElementById('chats-screen').classList.add('hidden');
    document.getElementById('friends-screen').classList.remove('hidden');
    document.getElementById('rooms-screen').classList.add('hidden');
    document.getElementById('room-screen').classList.add('hidden');
    updateNavigation('friends');
    // Importar e chamar a função de renderização de amigos
    import('./friends.js').then(module => {
        module.renderFriendsScreen();
    });
}

export function showRoomsScreen() {
    document.getElementById('chats-screen').classList.add('hidden');
    document.getElementById('friends-screen').classList.add('hidden');
    document.getElementById('rooms-screen').classList.remove('hidden');
    document.getElementById('room-screen').classList.add('hidden');
    updateNavigation('rooms');
}

export function updateNavigation(active) {
    const navButtons = document.querySelectorAll('#bottom-nav .nav-button');
    navButtons.forEach(btn => {
        btn.classList.remove('text-blue-400');
        btn.classList.add('text-gray-400');
    });
    
    const activeBtn = document.querySelector(`#bottom-nav [data-nav="${active}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-blue-400');
    }
}


// Inicializar CSS (O CSS que você forneceu está bom)
const style = document.createElement('style');
style.textContent = `
    .notification-item {
        min-width: 300px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
    .notification-item:hover {
        transform: translateX(-5px);
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .animate-spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
