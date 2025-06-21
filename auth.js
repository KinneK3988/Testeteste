import { auth, db, fieldValue } from './firebase-config.js';
import { showNotification, showCustomPrompt } from './ui.js';
import { onLogin, onLogout } from './app.js'; // Funções de callback do app principal

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.classList.remove('hidden');
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        showNotification(`Falha no login: ${err.message}`, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

async function handleGuestLogin() {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.classList.remove('hidden');
    try {
        await auth.signInAnonymously();
    } catch (err) {
        showNotification(`Falha no login de convidado: ${err.message}`, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

async function handleLogout() {
    try {
        const user = auth.currentUser;
        if (user) {
            await db.collection('users').doc(user.uid).update({
                lastSeen: fieldValue.serverTimestamp(),
                status: 'offline'
            });
        }
        await auth.signOut();
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showNotification('Erro ao tentar sair.', 'error');
    }
}

async function fetchOrCreateUserProfile(user) {
    const userRef = db.collection('users').doc(user.uid);
    let userSnap = await userRef.get();
    
    if (!userSnap.exists) {
        let username = user.isAnonymous ? `Convidado_${user.uid.substring(0, 5)}` : user.email.split('@')[0];
        const guestName = user.isAnonymous ? await showCustomPrompt("Bem-vindo(a)!", "Digite um nome de convidado para continuar.") : null;
        
        if (user.isAnonymous && !guestName) {
            await handleLogout();
            return null;
        }
        if (guestName) username = guestName;

        const newUserProfile = {
            uid: user.uid,
            username,
            email: user.isAnonymous ? null : user.email,
            statusMessage: 'Olá! Estou usando o 7Chat.',
            photoURL: null,
            friends: [],
            createdAt: fieldValue.serverTimestamp(),
            lastSeen: fieldValue.serverTimestamp(),
            status: 'online' // online, offline, away
        };
        await userRef.set(newUserProfile);
        return newUserProfile;
    } else {
        await userRef.update({ lastSeen: fieldValue.serverTimestamp(), status: 'online' });
        return userSnap.data();
    }
}

function initAuth() {
    auth.onAuthStateChanged(async (user) => {
        const loadingIndicator = document.getElementById('loading-indicator');
        loadingIndicator.classList.remove('hidden');

        if (user) {
            const userData = await fetchOrCreateUserProfile(user);
            if (userData) {
                onLogin(user, userData); // Chama a função do app.js
            }
        } else {
            onLogout(); // Chama a função do app.js
        }
        loadingIndicator.classList.add('hidden');
    });

    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('main-guest-login-btn')?.addEventListener('click', handleGuestLogin);
}

export { initAuth, handleLogout };
