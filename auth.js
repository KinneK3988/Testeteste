import { auth, db } from './firebase-config.js';
import { showNotification, generateGuestName, renderMainApp } from './ui.js';

let currentUser = null;
let unsubscribeAuth = null;

// --- AUTENTICAÇÃO ---
function initAuth() {
    unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('✅ Usuário logado:', user.email || 'Convidado');
            
            // Buscar dados do usuário no Firestore
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    currentUser = { uid: user.uid, ...userDoc.data() };
                } else {
                    // Criar documento do usuário se não existir
                    currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || generateGuestName(),
                        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4f46e5&color=fff&size=128`,
                        status: 'Olá! Estou usando o 7Chat 👋',
                        isOnline: true,
                        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                        nameEffect: 'none',
                        nameBanner: 'none'
                    };
                    
                    await db.collection('users').doc(user.uid).set(currentUser);
                }
                
                // Atualizar status online
                await db.collection('users').doc(user.uid).update({
                    isOnline: true,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Mostrar app principal
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('main-app').classList.remove('hidden');
                renderMainApp();
                
            } catch (error) {
                console.error('Erro ao buscar dados do usuário:', error);
                showNotification('Erro ao carregar perfil', 'error');
            }
        } else {
            console.log('❌ Usuário não logado');
            currentUser = null;
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('main-app').classList.add('hidden');
        }
    });
}

// Login com email e senha
async function loginWithEmail(email, password) {
    try {
        document.getElementById('loading-indicator').classList.remove('hidden');
        await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login realizado com sucesso!');
    } catch (error) {
        console.error('Erro no login:', error);
        let message = 'Erro no login';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Usuário não encontrado';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta';
                break;
            case 'auth/invalid-email':
                message = 'Email inválido';
                break;
            default:
                message = error.message;
        }
        
        showNotification(message, 'error');
    } finally {
        document.getElementById('loading-indicator').classList.add('hidden');
    }
}

// Login como convidado
async function loginAsGuest() {
    try {
        document.getElementById('loading-indicator').classList.remove('hidden');
        await auth.signInAnonymously();
        showNotification('Conectado como convidado!');
    } catch (error) {
        console.error('Erro no login como convidado:', error);
        showNotification('Erro ao conectar como convidado', 'error');
    } finally {
        document.getElementById('loading-indicator').classList.add('hidden');
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

// Event listeners para formulário de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const guestLoginBtn = document.getElementById('main-guest-login-btn');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        await loginWithEmail(email, password);
    });
    
    guestLoginBtn.addEventListener('click', loginAsGuest);
});

// Atualizar status offline quando o usuário sair da página
window.addEventListener('beforeunload', async () => {
    if (currentUser) {
        await db.collection('users').doc(currentUser.uid).update({
            isOnline: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
});

// Inicializar autenticação
initAuth();

// Exportar funções para uso global
window.loginWithEmail = loginWithEmail;
window.loginAsGuest = loginAsGuest;
window.logout = logout;

export { currentUser, loginWithEmail, loginAsGuest, logout, initAuth };