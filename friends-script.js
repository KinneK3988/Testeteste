// Friends page functionality
console.log('🚀 Script friends-script.js carregado!');

// Definir funções de navegação primeiro para garantir disponibilidade
function goBack() {
    window.location.href = 'chat.html';
}

function goToChats() {
    window.location.href = 'chat.html';
}

// Função para ir para configurações
function goToSettings() {
    console.log('Navegando para configurações...');
    window.location.href = 'settings.html';
}

// Função para ir para busca global
function goToGlobalSearch() {
    console.log('🔍 Função goToGlobalSearch chamada!');
    console.log('🌐 window.location atual:', window.location.href);
    
    try {
        console.log('🚀 Redirecionando para search.html...');
        window.location.href = 'search.html';
    } catch (error) {
        console.error('❌ Erro ao redirecionar:', error);
        // Fallback
        try {
            window.open('search.html', '_self');
        } catch (fallbackError) {
            console.error('❌ Erro no fallback:', fallbackError);
            alert('Erro ao abrir a página de busca. Verifique o console.');
        }
    }
}

// Tornar globais imediatamente
window.goBack = goBack;
window.goToChats = goToChats;
window.goToGlobalSearch = goToGlobalSearch;

// Teste para verificar se a função foi registrada
console.log('✅ Função goToGlobalSearch registrada:', typeof window.goToGlobalSearch);

// Função para debug da collection friends
function debugFriendsCollection() {
    console.log('🔍 === DEBUG FRIENDS COLLECTION ===');
    
    if (!window.db || !window.currentUser) {
        console.log('❌ Firebase não disponível ou usuário não autenticado');
        return;
    }
    
    setTimeout(async () => {
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const friendsSnapshot = await getDocs(collection(window.db, 'friends'));
            console.log('📊 Total de documentos na collection friends:', friendsSnapshot.size);
            
            friendsSnapshot.forEach(doc => {
                console.log('📄 Documento ID:', doc.id);
                console.log('📄 Dados:', doc.data());
            });
            
        } catch (error) {
            console.error('❌ Erro no debug da collection:', error);
        }
    }, 2000);
    
    console.log('=== FIM DEBUG FRIENDS COLLECTION ===');
}

// Função para atualizar status de conexão
function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const indicatorElement = document.getElementById('connectionIndicator');
    
    // Verificar se Firebase está disponível
    const isFirebaseConnected = !!(window.auth && window.db);
    const isUserAuthenticated = !!(window.currentUser || (window.auth && window.auth.currentUser));
    
    let status = 'Desconectado';
    let statusClass = 'offline';
    
    if (isFirebaseConnected && isUserAuthenticated) {
        status = 'Online';
        statusClass = 'online';
    } else if (isFirebaseConnected) {
        status = 'Conectando...';
        statusClass = 'connecting';
    }
    
    // Atualizar elementos se existirem
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `connection-status ${statusClass}`;
    }
    
    if (indicatorElement) {
        indicatorElement.className = `connection-indicator ${statusClass}`;
    }
    
    console.log('🌐 Status de conexão atualizado:', status);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, inicializando página de amigos...');
    initializeFriendsPage();
});

function initializeFriendsPage() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });    });    
    
    // Configurar event listeners alternativos para botões de busca
    setupSearchButtons();
      // Botões agora usam onclick no HTML (goToGlobalSearch)
      // Load initial data
    loadFriendsData();
    
    // Debug: Listar estrutura da collection friends
    setTimeout(() => {
        debugFriendsCollection();
    }, 3000);
    
    // Atualizar status de conexão inicialmente
    updateConnectionStatus();
    
    // Auto-reload pending requests every 30 seconds if user is on that tab
    setInterval(() => {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab && activeTab.dataset.tab === 'pendentes') {
            loadPendingRequests();
        }
    }, 30000);
    
    // Search functionality
    const userSearchInput = document.getElementById('userSearch');
    if (userSearchInput) {
        userSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchUser();
            }
        });
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load data for the selected tab
    loadTabData(tabName);
}

function loadTabData(tabName) {
    console.log('🔄 Carregando aba:', tabName);    switch(tabName) {
        case 'online':
            loadOnlineFriends();
            break;
        case 'todos':
            loadAllFriends();
            break;
        case 'pendentes':
            console.log('📋 Usuário acessou aba Pendentes');
            // Executar diagnóstico quando acessar pendentes
            diagnosticFirebase();
            // Atualizar status de conexão
            updateConnectionStatus();
            // Sempre tentar carregar, mesmo que Firebase não esteja pronto
            loadPendingRequests();
            break;
        case 'bloqueados':
            loadBlockedUsers();
            break;
    }
}

function loadFriendsData() {
    // Só carregar se Firebase estiver pronto, senão esperar
    if (!window.db || !window.currentUser) {
        console.log('⏳ Aguardando Firebase e usuário para carregar dados...');
        setTimeout(() => {
            if (window.db && window.currentUser) {
                loadFriendsData();
            }
        }, 1000);
        return;
    }
    
    // Load all friends data - implement with Firebase
    console.log('✅ Carregando dados dos amigos...');
    loadOnlineFriends();
    loadAllFriends(); // Agora carrega os amigos reais
    // Não carregar pendentes automaticamente - só quando clicar na aba
    // loadPendingRequests();
    loadBlockedUsers();
}

function loadOnlineFriends() {
    const onlineList = document.querySelector('#online-tab .friends-list');
    
    console.log('🔄 Carregando amigos online...');
    
    if (!onlineList) {
        console.error('❌ Elemento online friends-list não encontrado!');
        return;
    }
    
    // Se Firebase ou usuário não estão disponíveis, mostrar estado de carregamento
    if (!window.db || !window.currentUser) {
        console.log('❌ Firebase não disponível ou usuário não logado');
        onlineList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" stroke="#6b7280" stroke-width="2"/>
                        <path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="empty-title">Carregando amigos online...</h3>
                <p class="empty-subtitle">Aguardando conexão com Firebase</p>
            </div>
        `;
        return;
    }
    
    // Carregar amigos online do Firebase
    loadFirebaseOnlineFriends(onlineList);
}

async function loadFirebaseOnlineFriends(onlineList) {
    try {
        console.log('✅ Carregando amigos online do Firebase...');
        
        // Importar funções do Firebase
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Primeiro, buscar amigos do usuário atual
        const friendsRef = collection(window.db, 'friends');
        const friendsQuery = query(
            friendsRef,
            where('userId', '==', window.currentUser.uid),
            where('status', '==', 'active')
        );
        
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendIds = [];
        
        friendsSnapshot.forEach((doc) => {
            const friendData = doc.data();
            friendIds.push(friendData.friendId);
        });
        
        console.log('👥 IDs dos amigos:', friendIds);
        
        if (friendIds.length === 0) {
            onlineList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2"/>
                            <path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Nenhum amigo online</h3>
                    <p class="empty-subtitle">Seus amigos aparecerão aqui quando estiverem online</p>
                </div>
            `;
            return;
        }
        
        // Buscar dados dos amigos que estão online
        const usersRef = collection(window.db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const onlineFriends = [];
        
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            
            // Verificar se é amigo e se está online
            if (friendIds.includes(doc.id) && userData.online === true) {
                onlineFriends.push({
                    id: doc.id,
                    username: userData.username || userData.email?.split('@')[0] || 'usuario',
                    name: userData.displayName || userData.name || 'Usuário',
                    email: userData.email || '',
                    online: userData.online,
                    lastSeen: userData.lastSeen,
                    avatar: userData.avatar || null
                });
            }
        });
        
        console.log('🟢 Amigos online encontrados:', onlineFriends.length);
        
        if (onlineFriends.length === 0) {
            onlineList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2"/>
                            <path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Nenhum amigo online</h3>
                    <p class="empty-subtitle">Seus amigos não estão online no momento</p>
                </div>
            `;
        } else {
            displayOnlineFriends(onlineFriends, onlineList);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar amigos online:', error);
        onlineList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="empty-title">Erro ao carregar amigos online</h3>
                <p class="empty-subtitle">Verifique sua conexão e tente novamente</p>
                <div style="margin-top: 10px; color: #ef4444; font-size: 12px;">
                    ${error.message}
                </div>
            </div>
        `;
    }
}

function displayOnlineFriends(onlineFriends, onlineList) {
    console.log('🎨 Exibindo', onlineFriends.length, 'amigos online');
    
    const html = `
        <div class="friends-header">
            <h4>Amigos Online (${onlineFriends.length})</h4>
            <p>Amigos que estão disponíveis agora</p>
        </div>
        <div class="friends-grid">
            ${onlineFriends.map((friend, index) => {
                const avatarLetter = friend.name ? friend.name.charAt(0).toUpperCase() : 'A';
                
                return `
                <div class="friend-item online" style="animation-delay: ${index * 0.1}s">
                    <div class="friend-avatar">
                        ${avatarLetter}
                        <div class="friend-status online"></div>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.name}</div>
                        <div class="friend-since">@${friend.username} • Online agora</div>
                    </div>
                    <div class="friend-actions">
                        <button class="message-btn" onclick="openChatWithFriend('${friend.id}', '${friend.name}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Chat
                        </button>                        <button class="more-btn" onclick="showFriendMenu('${friend.id}', '${friend.name}', event, '${friend.docId || friend.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                                <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                                <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
    
    onlineList.innerHTML = html;
    console.log('✅ Lista de amigos online atualizada!');
}

function loadAllFriends() {
    const friendsList = document.querySelector('#todos-tab .friends-list');
    
    console.log('🔄 Carregando todos os amigos...');
    
    if (!friendsList) {
        console.error('❌ Elemento friends-list não encontrado!');
        return;
    }
    
    // Se Firebase ou usuário não estão disponíveis, mostrar estado de carregamento
    if (!window.db || !window.currentUser) {
        console.log('❌ Firebase não disponível ou usuário não logado');
        friendsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" stroke="#6b7280" stroke-width="2"/>
                        <path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="empty-title">Carregando amigos...</h3>
                <p class="empty-subtitle">Aguardando conexão com Firebase</p>
            </div>
        `;
        return;
    }
    
    // Carregar amigos do Firebase
    loadFirebaseAllFriends(friendsList);
}

async function loadFirebaseAllFriends(friendsList) {
    try {
        console.log('✅ Carregando amigos do Firebase...');
          // Importar funções do Firebase
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Buscar amigos na collection 'friends' onde userId é o usuário atual
        const friendsRef = collection(window.db, 'friends');
        const friendsQuery = query(
            friendsRef,
            where('userId', '==', window.currentUser.uid),
            where('status', '==', 'active')
        );
        
        console.log('🔍 Executando query para buscar amigos...');
        const friendsSnapshot = await getDocs(friendsQuery);
        console.log('📊 Documentos retornados pela query:', friendsSnapshot.size);
        
        const friends = [];
        
        friendsSnapshot.forEach((doc) => {
            const friendData = doc.data();
            console.log('📋 Documento encontrado:', {
                docId: doc.id,
                friendId: friendData.friendId,
                friendName: friendData.friendName,
                status: friendData.status
            });
            
            friends.push({
                id: doc.id,
                friendId: friendData.friendId,
                friendName: friendData.friendName,
                createdAt: friendData.createdAt,
                status: friendData.status
            });
        });
        
        console.log('👥 Amigos encontrados:', friends.length);
        
        if (friends.length === 0) {
            friendsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#6b7280" stroke-width="2"/>
                            <circle cx="9" cy="7" r="4" stroke="#6b7280" stroke-width="2"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#6b7280" stroke-width="2"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#6b7280" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Nenhum amigo ainda</h3>
                    <p class="empty-subtitle">Use a busca para adicionar amigos</p>
                </div>
            `;
        } else {
            displayAllFriends(friends, friendsList);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar amigos:', error);
        friendsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="empty-title">Erro ao carregar amigos</h3>
                <p class="empty-subtitle">Verifique sua conexão e tente novamente</p>
                <div style="margin-top: 10px; color: #ef4444; font-size: 12px;">
                    ${error.message}
                </div>
            </div>
        `;
    }
}

function displayAllFriends(friends, friendsList) {
    console.log('🎨 Exibindo', friends.length, 'amigos');
    
    // Ordenar por data de amizade (mais recente primeiro)
    friends.sort((a, b) => {
        const timeA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const timeB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return timeB - timeA;
    });
    
    const html = `
        <div class="friends-header">
            <h4>Seus Amigos (${friends.length})</h4>
            <p>Amigos que aceitaram suas solicitações</p>
        </div>
        <div class="friends-grid">
            ${friends.map((friend, index) => {
                const avatarLetter = friend.friendName ? friend.friendName.charAt(0).toUpperCase() : 'A';
                const friendSince = getTimeAgo(friend.createdAt);
                
                return `
                <div class="friend-item" style="animation-delay: ${index * 0.1}s">
                    <div class="friend-avatar">
                        ${avatarLetter}
                        <div class="friend-status online"></div>
                    </div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.friendName}</div>
                        <div class="friend-since">Amigos desde ${friendSince}</div>
                    </div>
                    <div class="friend-actions">
                        <button class="message-btn" onclick="openChatWithFriend('${friend.friendId}', '${friend.friendName}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Chat
                        </button>                        <button class="more-btn" onclick="showFriendMenu('${friend.friendId}', '${friend.friendName}', event, '${friend.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                                <circle cx="19" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                                <circle cx="5" cy="12" r="1" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                `;
            }).join('')}

            <div class="load-more">
                <button class="load-more-btn" onclick="loadMoreFriends()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M8 11h8M8 15h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Carregar mais amigos
                </button>
            </div>
        </div>
    `;
    
    friendsList.innerHTML = html;
    console.log('✅ Lista de amigos atualizada!');
}

function loadPendingRequests() {
    const pendingList = document.querySelector('#pendentes-tab .pending-list');
    
    console.log('🔄 loadPendingRequests chamada');
    console.log('Firebase DB:', !!window.db);
    console.log('Current User:', !!window.currentUser);
    console.log('Pending List Element:', !!pendingList);
    
    // Atualizar status de conexão
    updateConnectionStatus();
    
    // Se Firebase ou usuário não estão disponíveis, aguardar um pouco e tentar novamente
    if (!window.db || !window.currentUser) {
        console.log('❌ Firebase não disponível ou usuário não logado - aguardando...');
        console.log('- window.db:', !!window.db);
        console.log('- window.currentUser:', !!window.currentUser);
        
        // Mostrar estado de carregamento
        if (pendingList) {
            pendingList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="8" stroke="#6b7280" stroke-width="2"/>
                            <path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="empty-title">Carregando solicitações...</h3>
                <p class="empty-subtitle">Aguardando conexão com Firebase</p>
                <div style="margin-top: 15px; color: #9ca3af; font-size: 12px;">
                    DB: ${!!window.db} | User: ${!!window.currentUser}
                </div>
            </div>
            `;
        }
        
        // Tentar novamente em 2 segundos, mas só se ainda estivermos na aba pendentes
        setTimeout(() => {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.dataset.tab === 'pendentes') {
                loadPendingRequests();
            }
        }, 2000);
        
        return;
    }
    
    // Tudo disponível - carregar solicitações do Firebase
    console.log('✅ Firebase e usuário disponíveis - carregando solicitações...');
    loadFirebasePendingRequests(pendingList);
}

async function loadFirebasePendingRequests(pendingList) {
    try {
        // Importar funções do Firebase
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Buscar solicitações recebidas E enviadas pelo usuário atual
        const friendRequestsRef = collection(window.db, 'friendRequests');
        
        // Query para solicitações recebidas (sem orderBy para evitar erro de índice)
        const receivedQuery = query(
            friendRequestsRef,
            where('toUserId', '==', window.currentUser.uid),
            where('status', '==', 'pending')
        );
        
        // Query para solicitações enviadas (sem orderBy para evitar erro de índice)
        const sentQuery = query(
            friendRequestsRef,
            where('fromUserId', '==', window.currentUser.uid),
            where('status', '==', 'pending')
        );
        
        // Executar ambas as queries
        const [receivedSnapshot, sentSnapshot] = await Promise.all([
            getDocs(receivedQuery),
            getDocs(sentQuery)
        ]);
        
        const receivedRequests = [];
        const sentRequests = [];        receivedSnapshot.forEach((doc) => {
            const requestData = {
                ...doc.data(),
                id: doc.id,
                type: 'received' // Definir por último para não ser sobrescrito
            };
            console.log('➕ Adicionando solicitação recebida:', requestData);
            receivedRequests.push(requestData);
        });
        
        sentSnapshot.forEach((doc) => {
            const requestData = {
                ...doc.data(),
                id: doc.id,
                type: 'sent' // Definir por último para não ser sobrescrito
            };
            console.log('➕ Adicionando solicitação enviada:', requestData);
            sentRequests.push(requestData);
        });
        
        // Ordenar manualmente por timestamp
        receivedRequests.sort((a, b) => {
            const timeA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
            const timeB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
            return timeB - timeA; // Mais recente primeiro
        });
        
        sentRequests.sort((a, b) => {
            const timeA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
            const timeB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
            return timeB - timeA; // Mais recente primeiro
        });
          console.log('📨 Solicitações recebidas:', receivedRequests.length);
        console.log('📤 Solicitações enviadas:', sentRequests.length);
        
        const allRequests = [...receivedRequests, ...sentRequests];
        console.log('📦 Array completo de solicitações:', allRequests);
        
        if (allRequests.length === 0) {
            pendingList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2"/>
                            <path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Nenhuma solicitação pendente</h3>
                    <p class="empty-subtitle">Solicitações enviadas e recebidas aparecerão aqui</p>
                </div>            `;
            updatePendingBadge(0);
        } else {
            console.log('✅ Chamando displayPendingRequests com', allRequests.length, 'solicitações');
            displayPendingRequests(allRequests, pendingList);
            updatePendingBadge(receivedRequests.length); // Badge só para recebidas
            console.log('✅ Badge atualizado para:', receivedRequests.length);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar solicitações:', error);
        pendingList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="empty-title">Erro ao carregar solicitações</h3>
                <p class="empty-subtitle">Verifique sua conexão e tente novamente</p>
                <div style="margin-top: 10px; color: #ef4444; font-size: 12px;">
                    ${error.message}
                </div>
            </div>
        `;
    }
}

function displayPendingRequests(requests, pendingList) {
    console.log('🎨 Exibindo solicitações pendentes:', requests.length);
    console.log('📍 Elemento pendingList:', !!pendingList);
    console.log('📋 Todas as solicitações recebidas:', requests);
    
    if (!pendingList) {
        console.error('❌ Elemento pendingList não encontrado!');
        return;
    }
      // Separar solicitações por tipo - método alternativo mais robusto
    const receivedRequests = requests.filter(req => {
        // Solicitação recebida: toUserId é igual ao usuário atual
        const isReceived = req.toUserId === window.currentUser.uid;
        console.log('🔍 Filtrando solicitação:', req.id, 'toUserId:', req.toUserId, 'currentUser:', window.currentUser.uid, 'é recebida?', isReceived);
        return isReceived;
    });
    
    const sentRequests = requests.filter(req => {
        // Solicitação enviada: fromUserId é igual ao usuário atual  
        const isSent = req.fromUserId === window.currentUser.uid;
        console.log('🔍 Filtrando solicitação:', req.id, 'fromUserId:', req.fromUserId, 'currentUser:', window.currentUser.uid, 'é enviada?', isSent);
        return isSent;
    });
    
    console.log('📨 Solicitações recebidas para exibir:', receivedRequests.length);
    console.log('📤 Solicitações enviadas para exibir:', sentRequests.length);
    
    let html = '';
    
    // Seção de solicitações recebidas
    if (receivedRequests.length > 0) {
        console.log('✅ Criando HTML para solicitações recebidas');
        html += `
        <div class="requests-section">
            <div class="requests-header">
                <h4>Solicitações Recebidas (${receivedRequests.length})</h4>
                <p>Pessoas que querem ser seus amigos</p>
            </div>
            <div class="requests-list">
                ${receivedRequests.map((request, index) => {
                    const avatarLetter = request.fromUserName ? request.fromUserName.charAt(0).toUpperCase() : 'U';
                    const timeAgo = getTimeAgo(request.createdAt);
                    
                    return `
                    <div class="friend-request-item received" style="animation-delay: ${index * 0.1}s">
                        <div class="request-avatar">
                            ${avatarLetter}
                        </div>
                        <div class="request-info">
                            <div class="request-name">
                                ${request.fromUserName}
                                <span class="request-username">@${request.fromUserUsername}</span>
                            </div>
                            <div class="request-time">${timeAgo}</div>
                            <div class="request-email">${request.fromUserEmail}</div>
                        </div>
                        <div class="request-actions">
                            <button class="accept-btn" onclick="acceptFriendRequest('${request.id}', '${request.fromUserId}', '${request.fromUserName}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Aceitar
                            </button>
                            <button class="decline-btn" onclick="declineFriendRequest('${request.id}', '${request.fromUserName}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Recusar
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}

                <div class="load-more">
                    <button class="load-more-btn" onclick="loadMoreRequests('received')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M8 11h8M8 15h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Carregar mais solicitações recebidas
                    </button>
                </div>
            </div>
        </div>
        `;
    }
    
    // Seção de solicitações enviadas
    if (sentRequests.length > 0) {
        html += `
        <div class="requests-section">
            <div class="requests-header">
                <h4>Solicitações Enviadas (${sentRequests.length})</h4>
                <p>Aguardando resposta</p>
            </div>
            <div class="requests-list">
                ${sentRequests.map((request, index) => {
                    const avatarLetter = request.toUserName ? request.toUserName.charAt(0).toUpperCase() : 'U';
                    const timeAgo = getTimeAgo(request.createdAt);
                    
                    return `
                    <div class="friend-request-item sent" style="animation-delay: ${(receivedRequests.length + index) * 0.1}s">
                        <div class="request-avatar sent">
                            ${avatarLetter}
                        </div>
                        <div class="request-info">
                            <div class="request-name">
                                ${request.toUserName}
                                <span class="request-username">@${request.toUserUsername}</span>
                            </div>
                            <div class="request-time">${timeAgo}</div>
                            <div class="request-status">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
                                    <path d="M12 6v6l4 2" stroke="#f59e0b" stroke-width="2"/>
                                </svg>
                                Aguardando resposta
                            </div>
                        </div>
                        <div class="request-actions">
                            <button class="cancel-request-btn" onclick="cancelFriendRequest('${request.id}', '${request.toUserName}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Cancelar
                            </button>
                        </div>
                    </div>
                    `;
                }).join('')}

                <div class="load-more">
                    <button class="load-more-btn" onclick="loadMoreRequests('sent')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M8 11h8M8 15h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Carregar mais solicitações enviadas
                    </button>
                </div>
            </div>        </div>
        `;
    }
    
    console.log('🎨 Atualizando HTML da lista de pendentes...');
    console.log('📏 Tamanho do HTML:', html.length);
    pendingList.innerHTML = html;
    console.log('✅ HTML atualizado com sucesso!');
}

async function loadBlockedUsers() {
    console.log('📋 Carregando usuários bloqueados...');
    
    const blockedList = document.querySelector('#bloqueados-tab .blocked-list');
    if (!blockedList) return;
    
    // Mostrar loading
    blockedList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando usuários bloqueados...</p>
        </div>
    `;
    
    try {
        if (!window.db || !window.currentUser) {
            throw new Error('Firebase não está configurado');
        }

        const { collection, getDocs, query, where, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Buscar usuários bloqueados por este usuário
        const blockedQuery = query(
            collection(window.db, 'blockedUsers'),
            where('blockedBy', '==', window.currentUser.uid)
        );
        
        const blockedSnapshot = await getDocs(blockedQuery);
        const blockedUsers = [];
        
        // Para cada usuário bloqueado, buscar os dados do usuário
        for (const blockDoc of blockedSnapshot.docs) {
            const blockData = blockDoc.data();
            const userDoc = await getDoc(doc(window.db, 'users', blockData.blockedUser));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                blockedUsers.push({
                    id: blockData.blockedUser,
                    name: userData.name || userData.displayName || 'Usuário',
                    email: userData.email || '',
                    blockedAt: blockData.blockedAt,
                    reason: blockData.reason || 'Sem motivo especificado'
                });
            }
        }
        
        console.log('🚫 Usuários bloqueados encontrados:', blockedUsers.length);
        
        if (blockedUsers.length === 0) {
            blockedList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2"/>
                            <path d="M4.93 4.93l14.14 14.14" stroke="#6b7280" stroke-width="2"/>
                        </svg>
                    </div>
                    <h3 class="empty-title">Nenhum usuário bloqueado</h3>
                    <p class="empty-subtitle">Usuários bloqueados aparecerão aqui</p>
                </div>
            `;
        } else {
            displayBlockedUsers(blockedUsers);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar usuários bloqueados:', error);
        blockedList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" stroke-width="2"/>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" stroke-width="2"/>
                    </svg>
                </div>
                <h3 class="error-title">Erro ao carregar</h3>
                <p class="error-subtitle">Não foi possível carregar os usuários bloqueados</p>
                <button class="retry-btn" onclick="loadBlockedUsers()">Tentar novamente</button>
            </div>
        `;
    }
}

// Função para exibir usuários bloqueados
function displayBlockedUsers(blockedUsers) {
    const blockedList = document.querySelector('#bloqueados-tab .blocked-list');
    if (!blockedList) return;
    
    blockedList.innerHTML = blockedUsers.map(user => `
        <div class="blocked-user-item" data-user-id="${user.id}">
            <div class="blocked-user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <div class="blocked-user-info">
                <div class="blocked-user-name">${user.name}</div>
                <div class="blocked-user-email">${user.email}</div>
                <div class="blocked-user-date">
                    Bloqueado em ${user.blockedAt ? formatDate(user.blockedAt.toDate()) : 'Data desconhecida'}
                </div>
            </div>
            <div class="blocked-user-actions">
                <button class="unblock-btn" onclick="unblockUser('${user.id}', '${user.name}')" title="Desbloquear usuário">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Desbloquear
                </button>
            </div>
        </div>
    `).join('');
}

// Função para desbloquear usuário
async function unblockUser(userId, userName) {
    try {
        if (!window.db || !window.currentUser) {
            throw new Error('Firebase não está configurado');
        }

        const { collection, doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        console.log('✅ Desbloqueando usuário:', userName);
        
        // Remover o documento de bloqueio
        const blockDocId = `${window.currentUser.uid}_${userId}`;
        const blockDoc = doc(collection(window.db, 'blockedUsers'), blockDocId);
        await deleteDoc(blockDoc);
        
        // Mostrar notificação de sucesso
        showNotification('success', `${userName} foi desbloqueado com sucesso!`);
        
        // Recarregar lista de bloqueados
        loadBlockedUsers();
        
        console.log('✅ Usuário desbloqueado com sucesso:', userName);
        
    } catch (error) {
        console.error('❌ Erro ao desbloquear usuário:', error);
        showNotification('error', 'Erro ao desbloquear usuário. Tente novamente.');
    }
}

// Função utilitária para formatar data
function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função utilitária para mostrar tempo decorrido
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Agora mesmo';
    
    const now = new Date();
    let date;
    
    // Se timestamp tem toDate() (Firebase Timestamp)
    if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        return 'Agora mesmo';
    }
    
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Agora mesmo';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min${minutes > 1 ? '' : ''} atrás`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h atrás`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d atrás`;
    } else {
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: '2-digit'
        });
    }
}

// Add Friend Modal
function showAddFriendModal() {
    const modal = document.getElementById('addFriendModal');
    modal.classList.add('show');
    
    // Focus na input de busca
    setTimeout(() => {
        document.getElementById('userSearch').focus();
    }, 300);
    
    // Close modal quando clicar fora
    modal.querySelector('.modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAddFriendModal();
        }
    });
}

function closeAddFriendModal() {
    const modal = document.getElementById('addFriendModal');
    modal.classList.remove('show');
    
    // Limpar resultados da busca
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('userSearch').value = '';
}

function searchUser() {
    const searchTerm = document.getElementById('userSearch').value.trim();
    const searchResults = document.getElementById('searchResults');
    
    if (!searchTerm) {
        searchResults.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">Digite um email ou nome para buscar</p>';
        return;
    }
    
    // Mostrar loading
    searchResults.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #6b7280;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #4a5568; border-top: 2px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 10px;">Buscando usuários...</p>
        </div>
    `;
    
    // Simular busca (implementar com Firebase)
    setTimeout(() => {
        // Por enquanto, mostrar que não encontrou resultados
        searchResults.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6b7280;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style="margin-bottom: 10px; opacity: 0.5;">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>Nenhum usuário encontrado</p>
                <p style="font-size: 12px; margin-top: 5px;">Verifique se o email ou nome está correto</p>
            </div>
        `;
    }, 1500);
    
    console.log('Buscando usuário:', searchTerm);
    
    // Implementar busca real no Firebase:
    /*
    try {
        const users = await searchUsersInFirebase(searchTerm);
        displaySearchResults(users);
    } catch (error) {
        console.error('Erro na busca:', error);
        searchResults.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">Erro ao buscar usuários</p>';
    }
    */
}

function displaySearchResults(users) {
    const searchResults = document.getElementById('searchResults');
    
    if (users.length === 0) {
        searchResults.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">Nenhum usuário encontrado</p>';
        return;
    }
    
    searchResults.innerHTML = users.map(user => `
        <div class="user-result">
            <div class="friend-avatar">
                ${user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div class="friend-info">
                <div class="friend-name">${user.name || user.email}</div>
                <div class="friend-status">${user.email}</div>
            </div>
            <button class="add-friend-btn" onclick="sendFriendRequest('${user.id}', '${user.name || user.email}')">
                Adicionar
            </button>
        </div>
    `).join('');
}

async function sendFriendRequest(userId, userName) {
    console.log('🤝 Enviando solicitação para:', userName);
    
    try {
        if (!window.db || !window.currentUser) {
            alert('Firebase não está disponível');
            return;
        }
        
        // Verificar se usuário está configurado para receber solicitações
        const { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const btn = event.target;
        const originalText = btn.textContent;
        
        btn.textContent = 'Verificando...';
        btn.disabled = true;
        
        // 1. Verificar se usuário aceita solicitações
        const targetUserRef = doc(window.db, 'users', userId);
        const targetUserDoc = await getDoc(targetUserRef);
        
        if (targetUserDoc.exists()) {
            const userData = targetUserDoc.data();
            if (userData.acceptRequests === false) {
                btn.textContent = 'Usuário não aceita solicitações';
                btn.style.background = '#ef4444';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.style.background = '';
                }, 3000);
                console.log('❌ Usuário não aceita solicitações');
                return;
            }
        }
        
        // 2. Verificar se já são amigos
        const friendshipQuery1 = query(
            collection(window.db, 'friends'),
            where('userId', '==', window.currentUser.uid),
            where('friendId', '==', userId),
            where('status', '==', 'active')
        );
        
        const friendshipQuery2 = query(
            collection(window.db, 'friends'),
            where('userId', '==', userId),
            where('friendId', '==', window.currentUser.uid),
            where('status', '==', 'active')
        );
        
        const [friendshipSnapshot1, friendshipSnapshot2] = await Promise.all([
            getDocs(friendshipQuery1),
            getDocs(friendshipQuery2)
        ]);
        
        if (friendshipSnapshot1.size > 0 || friendshipSnapshot2.size > 0) {
            btn.textContent = 'Já são amigos!';
            btn.style.background = '#3b82f6';
            setTimeout(() => {
                btn.textContent = 'Remover Amigo';
                btn.onclick = () => showRemoveFriendFromAdd(userId, userName);
                btn.disabled = false;
                btn.style.background = '#ef4444';
            }, 2000);
            console.log('ℹ️ Usuários já são amigos');
            return;
        }
        
        // 3. Verificar se já existe solicitação pendente
        const pendingRequestQuery1 = query(
            collection(window.db, 'friendRequests'),
            where('fromUserId', '==', window.currentUser.uid),
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
        );
        
        const pendingRequestQuery2 = query(
            collection(window.db, 'friendRequests'),
            where('fromUserId', '==', userId),
            where('toUserId', '==', window.currentUser.uid),
            where('status', '==', 'pending')
        );
        
        const [pendingSnapshot1, pendingSnapshot2] = await Promise.all([
            getDocs(pendingRequestQuery1),
            getDocs(pendingRequestQuery2)
        ]);
        
        if (pendingSnapshot1.size > 0) {
            btn.textContent = 'Solicitação já enviada';
            btn.style.background = '#f59e0b';
            setTimeout(() => {
                btn.textContent = 'Cancelar Solicitação';
                btn.onclick = () => cancelPendingRequest(pendingSnapshot1.docs[0].id, userName);
                btn.disabled = false;
                btn.style.background = '#6b7280';
            }, 2000);
            console.log('⏳ Solicitação já foi enviada');
            return;
        }
        
        if (pendingSnapshot2.size > 0) {
            btn.textContent = 'Solicitação recebida!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.textContent = 'Aceitar Solicitação';
                btn.onclick = () => acceptPendingRequest(pendingSnapshot2.docs[0].id, userId, userName);
                btn.disabled = false;
                btn.style.background = '#10b981';
            }, 2000);
            console.log('📬 Usuário já enviou solicitação para você');
            return;
        }
        
        // 4. Enviar nova solicitação
        btn.textContent = 'Enviando...';
        
        const currentUserData = await getDoc(doc(window.db, 'users', window.currentUser.uid));
        const currentUserName = currentUserData.exists() ? 
            (currentUserData.data().name || window.currentUser.displayName || 'Usuário') : 
            'Usuário';
        
        await addDoc(collection(window.db, 'friendRequests'), {
            fromUserId: window.currentUser.uid,
            fromUserName: currentUserName,
            toUserId: userId,
            toUserName: userName,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        
        btn.textContent = 'Solicitação Enviada!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = 'Cancelar Solicitação';
            btn.disabled = false;
            btn.style.background = '#6b7280';
            btn.onclick = () => location.reload(); // Atualizar página para mostrar estado atual
        }, 2000);
        
        console.log('✅ Solicitação enviada para:', userName);
        
    } catch (error) {
        console.error('❌ Erro ao enviar solicitação:', error);
        
        const btn = event.target;
        btn.textContent = 'Erro - Tente Novamente';
        btn.style.background = '#ef4444';
        
        setTimeout(() => {
            btn.textContent = 'Adicionar';
            btn.disabled = false;
            btn.style.background = '';
        }, 3000);
    }
}

// Função para abrir chat com amigo
function openChatWithFriend(friendId, friendName) {
    console.log('💬 Abrindo chat com:', friendName);
    // TODO: Implementar navegação para chat individual
    // Poderia redirecionar para chat.html com parâmetros do amigo
    alert(`Chat com ${friendName} será implementado em breve!`);
}

// Função para mostrar menu personalizado do amigo
function showFriendMenu(friendId, friendName, event, friendshipDocId) {
    // Parar propagação do evento
    if (event) {
        event.stopPropagation();
    }
      console.log('⚙️ Abrindo menu do amigo:', friendName);
    console.log('🔍 ID do amigo no menu:', friendId);
    console.log('🔍 ID do documento da amizade:', friendshipDocId);
    console.log('🔍 Tipo do ID:', typeof friendId);
      // Armazenar dados do amigo atual
    window.currentFriendMenu = {
        id: friendId,
        name: friendName,
        email: 'amigo@exemplo.com', // Placeholder para debug
        docId: friendshipDocId // ID do documento da amizade
    };
    
    // Atualizar conteúdo do modal
    const friendMenuAvatar = document.getElementById('friendMenuAvatar');
    const friendMenuName = document.getElementById('friendMenuName');
    const friendMenuStatus = document.getElementById('friendMenuStatus');
    const friendMenuOverlay = document.getElementById('friendMenuOverlay');
    
    if (friendMenuAvatar) {
        friendMenuAvatar.textContent = friendName.charAt(0).toUpperCase();
    }
    
    if (friendMenuName) {
        friendMenuName.textContent = friendName;
    }
    
    if (friendMenuStatus) {
        friendMenuStatus.textContent = 'Online'; // TODO: Status real
    }
    
    // Mostrar modal
    if (friendMenuOverlay) {
        friendMenuOverlay.classList.add('show');
        
        // Fechar ao clicar fora
        friendMenuOverlay.addEventListener('click', function(e) {
            if (e.target === friendMenuOverlay) {
                closeFriendMenu();
            }
        });
    }
}

// Função para fechar menu do amigo
function closeFriendMenu() {
    const friendMenuOverlay = document.getElementById('friendMenuOverlay');
    if (friendMenuOverlay) {
        friendMenuOverlay.classList.remove('show');
    }
    
    // Limpar dados temporários
    window.currentFriendMenu = null;
}

// Função para enviar mensagem
function chatWithFriend() {
    if (!window.currentFriendMenu) return;
    
    closeFriendMenu();
    openChatWithFriend(window.currentFriendMenu.id, window.currentFriendMenu.name);
}

// Função para ver perfil
function viewFriendProfile() {
    if (!window.currentFriendMenu) return;
    
    closeFriendMenu();
    
    // TODO: Implementar visualização de perfil
    const notification = document.createElement('div');
    notification.className = 'custom-notification success';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
            <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M18 8l3 3-3 3" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>Perfil de ${window.currentFriendMenu.name} será implementado em breve!</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Função para bloquear amigo
async function blockFriend() {
    if (!window.currentFriendMenu) return;
    
    const friendData = window.currentFriendMenu;
    showBlockConfirmationDialog(friendData);
}

// Função para mostrar diálogo de confirmação de bloqueio personalizado
function showBlockConfirmationDialog(friendData) {
    const dialog = document.createElement('div');
    dialog.className = 'block-confirmation-overlay';
    dialog.innerHTML = `
        <div class="block-confirmation-dialog">
            <div class="block-dialog-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M4.93 4.93l14.14 14.14"/>
                </svg>
                <h3>Bloquear Usuário</h3>
            </div>
            
            <div class="block-dialog-content">
                <div class="blocked-user-info">
                    <div class="blocked-user-avatar">${friendData.name.charAt(0).toUpperCase()}</div>
                    <div class="blocked-user-details">
                        <h4>${friendData.name}</h4>
                        <p>@${friendData.email}</p>
                    </div>
                </div>
                
                <div class="block-warning">
                    <p><strong>Ao bloquear este usuário:</strong></p>
                    <ul>
                        <li>Ele não poderá te enviar mensagens</li>
                        <li>Não poderá ver seu status online</li>
                        <li>Não poderá te adicionar como amigo</li>
                        <li>A amizade atual será removida</li>
                    </ul>
                </div>
            </div>
            
            <div class="block-dialog-actions">
                <button class="cancel-block-btn" onclick="closeBlockDialog()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Cancelar
                </button>
                <button class="confirm-block-btn" onclick="confirmBlockUser('${friendData.id}', '${friendData.name}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M4.93 4.93l14.14 14.14"/>
                    </svg>
                    Bloquear Usuário
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Fechar ao clicar fora do diálogo
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeBlockDialog();
        }
    });
}

// Função para fechar diálogo de bloqueio
function closeBlockDialog() {
    const dialog = document.querySelector('.block-confirmation-overlay');
    if (dialog) {
        dialog.remove();
    }
}

// Função para confirmar o bloqueio do usuário
async function confirmBlockUser(userId, userName) {
    try {
        if (!window.db || !window.currentUser) {
            throw new Error('Firebase não está configurado');
        }

        const { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        console.log('🚫 Iniciando bloqueio do usuário:', userName);
        
        // 1. Adicionar usuário à lista de bloqueados
        const blockDoc = doc(collection(window.db, 'blockedUsers'), `${window.currentUser.uid}_${userId}`);
        await setDoc(blockDoc, {
            blockedBy: window.currentUser.uid,
            blockedUser: userId,
            blockedAt: serverTimestamp(),
            reason: 'Bloqueado pelo usuário'
        });
        
        // 2. Remover amizade se existir
        const friendshipQuery = query(
            collection(window.db, 'friends'),
            where('user1', '==', window.currentUser.uid),
            where('user2', '==', userId)
        );
        
        const friendshipQuery2 = query(
            collection(window.db, 'friends'),
            where('user1', '==', userId),
            where('user2', '==', window.currentUser.uid)
        );
        
        const [friendshipSnapshot1, friendshipSnapshot2] = await Promise.all([
            getDocs(friendshipQuery),
            getDocs(friendshipQuery2)
        ]);
        
        // Remover documentos de amizade
        const deletePromises = [];
        friendshipSnapshot1.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        friendshipSnapshot2.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log('✅ Amizade removida');
        }
        
        // 3. Remover solicitações de amizade pendentes
        const pendingQuery1 = query(
            collection(window.db, 'friendRequests'),
            where('fromUserId', '==', window.currentUser.uid),
            where('toUserId', '==', userId)
        );
        
        const pendingQuery2 = query(
            collection(window.db, 'friendRequests'),
            where('fromUserId', '==', userId),
            where('toUserId', '==', window.currentUser.uid)
        );
        
        const [pendingSnapshot1, pendingSnapshot2] = await Promise.all([
            getDocs(pendingQuery1),
            getDocs(pendingQuery2)
        ]);
        
        const removePendingPromises = [];
        pendingSnapshot1.forEach(doc => {
            removePendingPromises.push(deleteDoc(doc.ref));
        });
        pendingSnapshot2.forEach(doc => {
            removePendingPromises.push(deleteDoc(doc.ref));
        });
        
        if (removePendingPromises.length > 0) {
            await Promise.all(removePendingPromises);
            console.log('✅ Solicitações de amizade removidas');
        }
        
        // Fechar diálogos
        closeBlockDialog();
        closeFriendMenu();
        
        // Mostrar notificação de sucesso
        showNotification('success', `${userName} foi bloqueado com sucesso!`);
        
        // Recarregar dados para atualizar a interface
        loadFriendsData();
          console.log('✅ Usuário bloqueado com sucesso:', userName);
        
    } catch (error) {
        console.error('❌ Erro ao bloquear usuário:', error);
        showNotification('error', 'Erro ao bloquear usuário. Tente novamente.');
    }
}

// Função para remover amizade
async function removeFriend() {
    if (!window.currentFriendMenu) return;
    
    const friendData = window.currentFriendMenu;
    showRemoveConfirmationDialog(friendData);
}

// Função para mostrar diálogo de confirmação de remoção personalizado
function showRemoveConfirmationDialog(friendData) {
    const dialog = document.createElement('div');
    dialog.className = 'remove-confirmation-overlay';
    dialog.innerHTML = `
        <div class="remove-confirmation-dialog">
            <div class="remove-dialog-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="18" y1="8" x2="23" y2="13"/>
                    <line x1="23" y1="8" x2="18" y2="13"/>
                </svg>
                <h3>Remover Amizade</h3>
            </div>
            
            <div class="remove-dialog-content">
                <div class="removed-friend-info">
                    <div class="removed-friend-avatar">${friendData.name.charAt(0).toUpperCase()}</div>
                    <div class="removed-friend-details">
                        <h4>${friendData.name}</h4>
                        <p>@${friendData.email}</p>
                    </div>
                </div>
                
                <div class="remove-warning">
                    <p><strong>Ao remover esta amizade:</strong></p>
                    <ul>
                        <li>Vocês não aparecerão mais na lista de amigos um do outro</li>
                        <li>O histórico de conversas será mantido</li>
                        <li>Vocês poderão se adicionar novamente no futuro</li>
                        <li>Esta ação pode ser desfeita apenas enviando uma nova solicitação</li>
                    </ul>
                </div>
            </div>
            
            <div class="remove-dialog-actions">
                <button class="cancel-remove-btn" onclick="closeRemoveDialog()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Cancelar
                </button>
                <button class="confirm-remove-btn" onclick="confirmRemoveFriend('${friendData.id}', '${friendData.name}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="18" y1="8" x2="23" y2="13"/>
                        <line x1="23" y1="8" x2="18" y2="13"/>
                    </svg>
                    Remover Amizade
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Fechar ao clicar fora do diálogo
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeRemoveDialog();
        }
    });
}

// Função para fechar diálogo de remoção
function closeRemoveDialog() {
    const dialog = document.querySelector('.remove-confirmation-overlay');
    if (dialog) {
        dialog.remove();
    }
}

// Função para confirmar a remoção da amizade
async function confirmRemoveFriend(userId, userName) {
    try {
        if (!window.db || !window.currentUser) {
            throw new Error('Firebase não está configurado');
        }

        const { collection, doc, deleteDoc, getDocs, query, where, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');        console.log('🗑️ Iniciando remoção da amizade com:', userName);
        console.log('🔍 ID do usuário atual:', window.currentUser.uid);
        console.log('🔍 ID do amigo a remover:', userId);
        console.log('🔍 ID do documento da amizade:', window.currentFriendMenu?.docId);
          // Método 1: Tentar remover diretamente pelo ID do documento se disponível
        if (window.currentFriendMenu?.docId) {
            try {
                console.log('🗑️ Tentando remover documento diretamente:', window.currentFriendMenu.docId);
                const directDoc = doc(collection(window.db, 'friends'), window.currentFriendMenu.docId);
                await deleteDoc(directDoc);
                console.log('✅ Documento removido diretamente pelo ID:', window.currentFriendMenu.docId);
                  // Verificar se o documento foi realmente removido
                setTimeout(async () => {
                    try {
                        console.log('🔍 Verificando se documento foi removido...');
                        const checkDoc = await getDoc(directDoc);
                        if (!checkDoc.exists()) {
                            console.log('✅ Confirmado: Documento foi removido do Firebase');
                        } else {
                            console.log('⚠️ Documento ainda existe no Firebase!');
                        }
                    } catch (error) {
                        console.log('✅ Documento não encontrado (removido com sucesso)');
                    }
                    
                    console.log('🔄 Recarregando dados após remoção...');
                    loadFriendsData();
                }, 500);
                
                // Fechar diálogos
                closeRemoveDialog();
                closeFriendMenu();
                
                // Mostrar notificação de sucesso
                showNotification('success', `Amizade com ${userName} foi removida com sucesso!`);
                
                console.log('✅ Amizade removida com sucesso:', userName);
                return;
                
            } catch (directError) {
                console.log('⚠️ Não foi possível remover pelo ID direto, tentando busca:', directError.message);
            }
        }
        
        // Método 2: Buscar e remover a amizade em múltiplas estruturas possíveis
        
        // Estrutura 1: user1/user2
        const friendshipQuery1 = query(
            collection(window.db, 'friends'),
            where('user1', '==', window.currentUser.uid),
            where('user2', '==', userId)
        );
        
        const friendshipQuery2 = query(
            collection(window.db, 'friends'),
            where('user1', '==', userId),
            where('user2', '==', window.currentUser.uid)
        );
        
        // Estrutura 2: userId/friendId (estrutura atual)
        const friendshipQuery3 = query(
            collection(window.db, 'friends'),
            where('userId', '==', window.currentUser.uid),
            where('friendId', '==', userId)
        );
        
        const friendshipQuery4 = query(
            collection(window.db, 'friends'),
            where('userId', '==', userId),
            where('friendId', '==', window.currentUser.uid)
        );
        
        const [friendshipSnapshot1, friendshipSnapshot2, friendshipSnapshot3, friendshipSnapshot4] = await Promise.all([
            getDocs(friendshipQuery1),
            getDocs(friendshipQuery2),
            getDocs(friendshipQuery3),
            getDocs(friendshipQuery4)
        ]);
        
        console.log('🔍 Documentos encontrados estrutura user1/user2:', friendshipSnapshot1.size + friendshipSnapshot2.size);
        console.log('🔍 Documentos encontrados estrutura userId/friendId:', friendshipSnapshot3.size + friendshipSnapshot4.size);
        
        // Remover documentos de amizade
        const deletePromises = [];
        friendshipSnapshot1.forEach(doc => {
            console.log('🗑️ Removendo documento (user1/user2):', doc.id, doc.data());
            deletePromises.push(deleteDoc(doc.ref));
        });
        friendshipSnapshot2.forEach(doc => {
            console.log('🗑️ Removendo documento (user2/user1):', doc.id, doc.data());
            deletePromises.push(deleteDoc(doc.ref));
        });
        friendshipSnapshot3.forEach(doc => {
            console.log('🗑️ Removendo documento (userId/friendId):', doc.id, doc.data());
            deletePromises.push(deleteDoc(doc.ref));
        });
        friendshipSnapshot4.forEach(doc => {
            console.log('🗑️ Removendo documento (friendId/userId):', doc.id, doc.data());
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`✅ ${deletePromises.length} documentos de amizade removidos do Firebase`);
        } else {
            console.log('⚠️ Nenhuma amizade encontrada para remover');
        }
          // Fechar diálogos
        closeRemoveDialog();
        closeFriendMenu();
        
        // Mostrar notificação de sucesso
        showNotification('success', `Amizade com ${userName} foi removida com sucesso!`);
        
        // Aguardar um pouco antes de recarregar para dar tempo do Firebase se atualizar
        setTimeout(() => {
            console.log('🔄 Recarregando dados após remoção via busca...');
            loadFriendsData();
        }, 500);
        
        console.log('✅ Amizade removida com sucesso:', userName);
        
    } catch (error) {
        console.error('❌ Erro ao remover amizade:', error);
        showNotification('error', 'Erro ao remover amizade. Tente novamente.');
    }
}

// Função para aceitar solicitação de amizade
async function acceptFriendRequest(requestId, fromUserId, fromUserName) {
    try {
        if (!window.db || !window.currentUser) {
            alert('Firebase não está disponível');
            return;
        }

        const btn = event.target;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
            </svg>
            Aceitando...
        `;
        btn.disabled = true;

        const { doc, updateDoc, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Atualizar status da solicitação
        const requestRef = doc(window.db, 'friendRequests', requestId);
        await updateDoc(requestRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp()
        });
        
        // Adicionar amizade na collection friends
        const friendsRef = collection(window.db, 'friends');
        
        // Adicionar amizade bidirecional
        await addDoc(friendsRef, {
            userId: window.currentUser.uid,
            friendId: fromUserId,
            friendName: fromUserName,
            createdAt: serverTimestamp(),
            status: 'active'
        });
        
        await addDoc(friendsRef, {
            userId: fromUserId,
            friendId: window.currentUser.uid,
            friendName: window.currentUser.displayName || 'Usuário',
            createdAt: serverTimestamp(),
            status: 'active'
        });
          // Feedback de sucesso
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2"/>
            </svg>
            Aceito!
        `;        btn.style.background = '#10b981';
        
        // Recarregar solicitações e amigos após 1 segundo
        setTimeout(() => {
            loadPendingRequests();
            loadAllFriends(); // Recarregar lista de amigos também
        }, 1000);
        
        console.log('Solicitação aceita:', fromUserName);
        
    } catch (error) {
        console.error('Erro ao aceitar solicitação:', error);
        
        const btn = event.target;
        btn.innerHTML = 'Erro - Tente Novamente';
        btn.style.background = '#ef4444';
        btn.disabled = false;
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 3000);
    }
}

// Função para recusar solicitação de amizade
async function declineFriendRequest(requestId, fromUserName) {
    try {
        if (!window.db || !window.currentUser) {
            alert('Firebase não está disponível');
            return;
        }

        const btn = event.target;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
            </svg>
            Recusando...
        `;
        btn.disabled = true;

        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Atualizar status da solicitação
        const requestRef = doc(window.db, 'friendRequests', requestId);
        await updateDoc(requestRef, {
            status: 'declined',
            declinedAt: serverTimestamp()
        });
          // Feedback de sucesso
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
            </svg>
            Recusado
        `;
        btn.style.background = '#ef4444';
        
        // Recarregar solicitações após 1 segundo
        setTimeout(() => {
            loadPendingRequests();
        }, 1000);
        
        console.log('Solicitação recusada:', fromUserName);
        
    } catch (error) {
        console.error('Erro ao recusar solicitação:', error);
        
        const btn = event.target;
        btn.innerHTML = 'Erro - Tente Novamente';
        btn.style.background = '#ef4444';
        btn.disabled = false;
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 3000);
    }
}

// Função para cancelar solicitação pendente
async function cancelPendingRequest(requestId, userName) {
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const btn = event.target;
        btn.textContent = 'Cancelando...';
        btn.disabled = true;
        
        await deleteDoc(doc(window.db, 'friendRequests', requestId));
        
        btn.textContent = 'Adicionar';
        btn.style.background = '';
        btn.onclick = () => sendFriendRequest(event.target.getAttribute('data-user-id'), userName);
        btn.disabled = false;
        
        console.log('✅ Solicitação cancelada para:', userName);
        
    } catch (error) {
        console.error('❌ Erro ao cancelar solicitação:', error);
        
        const btn = event.target;
        btn.textContent = 'Erro - Tente Novamente';
        btn.style.background = '#ef4444';
        btn.disabled = false;
    }
}

// Função para aceitar solicitação pendente diretamente da busca
async function acceptPendingRequest(requestId, fromUserId, fromUserName) {
    try {
        const { doc, updateDoc, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const btn = event.target;
        btn.textContent = 'Aceitando...';
        btn.disabled = true;
        
        // Atualizar status da solicitação
        await updateDoc(doc(window.db, 'friendRequests', requestId), {
            status: 'accepted',
            acceptedAt: serverTimestamp()
        });
        
        // Adicionar amizade bidirecional
        await addDoc(collection(window.db, 'friends'), {
            userId: window.currentUser.uid,
            friendId: fromUserId,
            friendName: fromUserName,
            createdAt: serverTimestamp(),
            status: 'active'
        });
        
        await addDoc(collection(window.db, 'friends'), {
            userId: fromUserId,
            friendId: window.currentUser.uid,
            friendName: window.currentUser.displayName || 'Usuário',
            createdAt: serverTimestamp(),
            status: 'active'
        });
        
        btn.textContent = 'Amigos!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = 'Remover Amigo';
            btn.style.background = '#ef4444';
            btn.onclick = () => showRemoveFriendFromAdd(fromUserId, fromUserName);
            btn.disabled = false;
        }, 2000);
        
        console.log('✅ Solicitação aceita de:', fromUserName);
        
    } catch (error) {
        console.error('❌ Erro ao aceitar solicitação:', error);
        
        const btn = event.target;
        btn.textContent = 'Erro - Tente Novamente';
        btn.style.background = '#ef4444';
        btn.disabled = false;
    }
}

// Função para remover amigo diretamente da tela de adicionar
async function showRemoveFriendFromAdd(friendId, friendName) {
    if (confirm(`Tem certeza que deseja remover ${friendName} da sua lista de amigos?`)) {
        try {
            const { collection, query, where, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Buscar e remover amizade
            const friendshipQuery1 = query(
                collection(window.db, 'friends'),
                where('userId', '==', window.currentUser.uid),
                where('friendId', '==', friendId)
            );
            
            const friendshipQuery2 = query(
                collection(window.db, 'friends'),
                where('userId', '==', friendId),
                where('friendId', '==', window.currentUser.uid)
            );
            
            const [snapshot1, snapshot2] = await Promise.all([
                getDocs(friendshipQuery1),
                getDocs(friendshipQuery2)
            ]);
            
            const deletePromises = [];
            snapshot1.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
            snapshot2.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
            
            await Promise.all(deletePromises);
            
            // Atualizar botão
            const btn = event.target;
            btn.textContent = 'Adicionar';
            btn.style.background = '';
            btn.onclick = () => sendFriendRequest(friendId, friendName);
            
            console.log('✅ Amizade removida:', friendName);
            
        } catch (error) {
            console.error('❌ Erro ao remover amizade:', error);
            alert('Erro ao remover amizade. Tente novamente.');
        }
    }
}

// Função para configurar botões de busca
function setupSearchButtons() {
    const searchButtons = document.querySelectorAll('.search-btn, .add-friend-btn');
    
    searchButtons.forEach(btn => {
        // Remover event listeners existentes
        btn.removeEventListener('click', goToGlobalSearch);
        
        // Adicionar novo event listener
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔍 Botão de busca clicado:', this.className);
            goToGlobalSearch();
        });
    });
    
    console.log('🎛️ Botões de busca configurados:', searchButtons.length);
}

// Função para diagnóstico do Firebase
function diagnosticFirebase() {
    console.log('🔍 === DIAGNÓSTICO FIREBASE ===');
    console.log('window.auth:', !!window.auth);
    console.log('window.db:', !!window.db);
    console.log('window.currentUser:', window.currentUser);
    
    if (window.auth) {
        console.log('Auth currentUser:', window.auth.currentUser);
        console.log('Auth state:', window.auth.currentUser ? 'authenticated' : 'not authenticated');
    }
    
    if (window.db) {
        console.log('Firestore database:', window.db);
    }
    
    console.log('=== FIM DIAGNÓSTICO ===');
}

// Função para debug da collection friends
function debugFriendsCollection() {
    console.log('🔍 === DEBUG FRIENDS COLLECTION ===');
    
    if (!window.db || !window.currentUser) {
        console.log('❌ Firebase não disponível ou usuário não autenticado');
        return;
    }
    
    setTimeout(async () => {
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const friendsSnapshot = await getDocs(collection(window.db, 'friends'));
            console.log('📊 Total de documentos na collection friends:', friendsSnapshot.size);
            
            friendsSnapshot.forEach(doc => {
                console.log('📄 Documento ID:', doc.id);
                console.log('📄 Dados:', doc.data());
            });
            
        } catch (error) {
            console.error('❌ Erro no debug da collection:', error);
        }
    }, 2000);
    
    console.log('=== FIM DEBUG FRIENDS COLLECTION ===');
}

// Função para atualizar status de conexão
function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const indicatorElement = document.getElementById('connectionIndicator');
    
    // Verificar se Firebase está disponível
    const isFirebaseConnected = !!(window.auth && window.db);
    const isUserAuthenticated = !!(window.currentUser || (window.auth && window.auth.currentUser));
    
    let status = 'Desconectado';
    let statusClass = 'offline';
    
    if (isFirebaseConnected && isUserAuthenticated) {
        status = 'Online';
        statusClass = 'online';
    } else if (isFirebaseConnected) {
        status = 'Conectando...';
        statusClass = 'connecting';
    }
    
    // Atualizar elementos se existirem
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `connection-status ${statusClass}`;
    }
    
    if (indicatorElement) {
        indicatorElement.className = `connection-indicator ${statusClass}`;
    }
    
    console.log('🌐 Status de conexão atualizado:', status);
}

// Função para mostrar notificações
function showNotification(type, message) {
    // Remove notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2"/>
                  </svg>`,

        warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.306 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" stroke-width="2"/>
                  </svg>`,

        error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
                </svg>`,

        info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                 <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                 <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
                 <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" stroke-width="2"/>
               </svg>`
    };
    
    notification.innerHTML = `
        <div class="notification-icon">
            ${icons[type] || icons.info}
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `;
    
    // Adicionar estilos inline para garantir que funcione
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6'};
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}
