// Importações corrigidas: 'firebase' foi adicionado e as importações foram agrupadas.
import { db, fieldValue, auth, firebase } from './firebase-config.js';
import { showNotification } from './ui.js';

// Notificações e Pedidos de Amizade
export function setupNotificationsListener(userId, callback) {
    const requestsRef = db.collection('friend_requests')
        .where('to', '==', userId)
        .where('status', '==', 'pending');

    return requestsRef.onSnapshot(snapshot => {
        const requests = [];
        snapshot.forEach(doc => {
            requests.push({ id: doc.id, ...doc.data() });
        });
        callback(requests);
    }, error => {
        console.error("Erro no listener de notificações:", error);
    });
}

export async function acceptFriendRequest(requestId, fromId) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const requestRef = db.collection('friend_requests').doc(requestId);
    const currentUserRef = db.collection('users').doc(currentUser.uid);
    const friendUserRef = db.collection('users').doc(fromId);
    
    const batch = db.batch();
    batch.update(requestRef, { status: 'accepted', acceptedAt: fieldValue.serverTimestamp() });
    batch.update(currentUserRef, { friends: fieldValue.arrayUnion(fromId) });
    batch.update(friendUserRef, { friends: fieldValue.arrayUnion(currentUser.uid) });

    try {
        await batch.commit();
        showNotification('Amigo adicionado com sucesso!', 'info');
    } catch (error) {
        console.error("Erro ao aceitar amigo:", error);
        showNotification('Erro ao adicionar amigo.', 'error');
    }
}

export async function rejectFriendRequest(requestId) {
    const requestRef = db.collection('friend_requests').doc(requestId);
    try {
        await requestRef.update({ status: 'rejected', rejectedAt: fieldValue.serverTimestamp() });
        showNotification('Solicitação rejeitada.', 'info');
    } catch (error) {
        console.error("Erro ao rejeitar amigo:", error);
    }
}


// Busca de Usuários
export async function searchUsers(query) {
    if (!query.trim()) return [];
    
    const usersRef = db.collection('users');
    const searchTerm = query.toLowerCase();
    
    // Uma busca mais eficaz para nomes de usuário
    const snapshot = await usersRef
        .orderBy('username')
        .startAt(searchTerm)
        .endAt(searchTerm + '\uf8ff')
        .limit(10)
        .get();

    const users = [];
    snapshot.forEach(doc => {
        if (doc.id !== auth.currentUser?.uid) {
            users.push({ id: doc.id, ...doc.data() });
        }
    });
    return users;
}

// Amigos
export function setupFriendsListener(userId, callback) {
    return db.collection('users').doc(userId).onSnapshot(async (doc) => {
        if (!doc.exists) {
            callback([]);
            return;
        }
        const userData = doc.data();
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) {
            callback([]);
            return;
        }
        
        // Corrigido: Usando a importação de 'firebase'
        const friendsSnapshot = await db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', friendIds).get();
        const friends = [];
        friendsSnapshot.forEach(friendDoc => {
            friends.push({ id: friendDoc.id, ...friendDoc.data() });
        });
        callback(friends);
    });
}
