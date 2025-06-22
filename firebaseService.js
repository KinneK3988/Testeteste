import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, query, where, onSnapshot, updateDoc, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { FIREBASE_CONFIG, appState, initialAuthToken } from "./config.js";
import { UI } from "./ui.js";

export const FirebaseService = {
    db: null,
    auth: null,
    storage: null,

    init() {
        try {
            const app = initializeApp(FIREBASE_CONFIG);
            this.auth = getAuth(app);
            this.db = getFirestore(app);
            this.storage = getStorage(app);
            this.handleAuthState();
        } catch (error) { console.error("Firebase initialization failed:", error); }
    },
    
    handleAuthState() {
        onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                appState.currentUser = user;
                const userDoc = await this.ensureUserDocument(user.uid);
                
                // CORREÇÃO: Verifica se userDoc não é nulo antes de usá-lo
                if (userDoc) {
                    UI.updateProfilePicture(userDoc.photoURL);
                }

                UI.showScreen('mainScreen');
                this.listenToChatList();
                this.listenToFriendRequests();
            } else { this.signIn(); }
        });
    },
    
    async signIn() {
        try {
            if (initialAuthToken) await signInWithCustomToken(this.auth, initialAuthToken);
            else await signInAnonymously(this.auth);
        } catch (error) { console.error("Authentication failed:", error); }
    },
    
    async ensureUserDocument(userId) {
        const userRef = doc(this.db, "users", userId);
        try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                const newUser = { uid: userId, status: "Disponível", friends: [], photoURL: null };
                await setDoc(userRef, newUser);
                return newUser;
            }
            return userSnap.data();
        } catch (e) { 
            console.error("Error ensuring user document:", e);
            // CORREÇÃO: Retorna um objeto padrão em caso de erro para evitar crash
            return { uid: userId, status: "Erro", friends: [], photoURL: null };
        }
    },

    async uploadProfilePicture(file) {
        if (!appState.currentUser || !file) return;
        const filePath = `profile_pictures/${appState.currentUser.uid}`;
        const fileRef = ref(this.storage, filePath);
        
        try {
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            const userRef = doc(this.db, "users", appState.currentUser.uid);
            await updateDoc(userRef, { photoURL: url });
            UI.updateProfilePicture(url);
        } catch(error) {
            console.error("Error uploading photo:", error);
            alert("Erro ao enviar a foto.");
        }
    },
    
    listenToChatList() {
        if (appState.unsubscribeChatList) appState.unsubscribeChatList();
        const q = query(collection(this.db, "chats"), where("members", "array-contains", appState.currentUser.uid));
        appState.unsubscribeChatList = onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            UI.renderChatList(chats);
        });
    },

    listenToMessages(chatId) { /* ...código existente... */ },
    sendMessage(chatId, text) { /* ...código existente... */ },
    startPrivateChat(otherUserId) { /* ...código existente... */ },

    listenToFriendRequests() {
        const q = query(collection(this.db, "friend_requests"), where("to", "==", appState.currentUser.uid));
        onSnapshot(q, (snapshot) => UI.renderFriendRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    },

    async sendFriendRequest(friendId) {
        if (!appState.currentUser) return;
        try {
            await addDoc(collection(this.db, "friend_requests"), {
                from: appState.currentUser.uid, to: friendId, status: 'pending', createdAt: serverTimestamp()
            });
        } catch (error) { console.error("Error sending friend request:", error); }
    },

    async acceptFriendRequest(requestId, friendId) {
        if (!appState.currentUser) return;
        await this.startPrivateChat(friendId);
        await deleteDoc(doc(this.db, 'friend_requests', requestId));
    },

    async rejectFriendRequest(requestId) {
        await deleteDoc(doc(this.db, 'friend_requests', requestId));
    },
};
