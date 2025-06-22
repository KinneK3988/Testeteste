import { db, storage } from './firebase-config.js';
import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

let currentChatId = null;
let messagesListener = null;

// --- Variáveis de Estado para Gravação de Áudio ---
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isRecordingLocked = false;
let recordingStartTime;
let timerInterval;
let startX, startY;
const CANCEL_THRESHOLD = -100; // Pixels para a esquerda para cancelar
const LOCK_THRESHOLD = -80;   // Pixels para cima para travar

/**
 * Inicia uma conversa privada com um amigo.
 * @param {string} friendId - O ID do amigo.
 */
export async function openPrivateChat(friendId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    try {
        const friendDoc = await db.collection('users').doc(friendId).get();
        if (!friendDoc.exists) {
            return showNotification("Utilizador não encontrado.", "error");
        }
        const friendData = friendDoc.data();
        const chatId = [currentUser.uid, friendId].sort().join('_');
        currentChatId = chatId;
        document.getElementById('main-app-content').classList.add('hidden');
        document.getElementById('bottom-nav').classList.add('hidden');
        const roomScreen = document.getElementById('room-screen');
        roomScreen.classList.remove('hidden');
        renderChatScreen(friendData);
        loadMessages(chatId);
    } catch (error) {
        console.error("Erro ao abrir chat privado:", error);
        showNotification("Não foi possível abrir a conversa.", "error");
    }
}

/**
 * Volta para a tela principal, limpando ouvintes e estados.
 */
export function backToMain() {
    if (messagesListener) messagesListener();
    if (isRecording) cancelRecording();
    messagesListener = null;
    currentChatId = null;
    document.getElementById('room-screen').classList.add('hidden');
    document.getElementById('main-app-content').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
}

/**
 * Desenha a estrutura do ecrã de chat com a nova UI de gravação.
 * @param {object} friendData - Os dados do amigo.
 */
function renderChatScreen(friendData) {
    const roomScreen = document.getElementById('room-screen');
    if (!roomScreen) return;
    roomScreen.innerHTML = `
        <style>
            #recording-overlay { transition: opacity 0.3s ease-out; }
            #record-btn { transition: transform 0.1s linear; }
            .slide-to-cancel-text.active { color: #ef4444; }
            #lock-icon-container {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s ease-out, transform 0.3s ease-out, background-color 0.2s ease-out;
            }
            #lock-icon-container.visible { opacity: 1; transform: translateY(0); }
            #lock-icon-container.active { background-color: #3b82f6; transform: scale(1.1) translateY(0); }
            .waveform-svg-progress { clip-path: inset(0 100% 0 0); }
        </style>
        <div class="flex flex-col h-full bg-gray-900">
            <!-- Cabeçalho -->
            <div class="bg-gray-800 border-b border-gray-700 p-3 flex items-center shadow-md flex-shrink-0">
                <div class="w-12"><button onclick="window.App.backToMain()" class="text-gray-300 hover:text-white p-2 rounded-full"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button></div>
                <div class="flex-1 text-center"><h2 class="font-bold text-white text-lg truncate">${friendData.displayName}</h2></div>
                <div class="w-12 flex justify-end"><img src="${friendData.photoURL}" alt="${friendData.displayName}" class="w-10 h-10 rounded-full"></div>
            </div>

            <!-- Área de Mensagens -->
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-4 space-y-reverse"></div>

            <!-- UI de Gravação (Overlay) -->
            <div id="recording-overlay" class="absolute bottom-0 left-0 w-full bg-gray-900 bg-opacity-75 flex flex-col justify-end hidden pointer-events-none">
                <div class="pointer-events-auto">
                    <!-- UI de arrastar (default) -->
                    <div id="recording-ui-default">
                        <div class="bg-gray-800 p-2 flex items-center w-full">
                            <div class="w-24 text-center"><span id="recording-timer" class="font-mono text-white">0:00</span></div>
                            <div class="flex-1 text-center"><span class="slide-to-cancel-text text-gray-400">&lt; Arraste para cancelar</span></div>
                            <div class="w-24 flex justify-center relative">
                                <div id="lock-icon-container" class="absolute -top-20 bg-gray-700 p-4 rounded-full"><i class="fas fa-lock text-white text-xl"></i></div>
                                <div id="record-btn" class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center"><i id="record-icon" class="fas fa-microphone text-white text-2xl"></i></div>
                            </div>
                        </div>
                    </div>
                    <!-- UI travada -->
                    <div id="recording-ui-locked" class="hidden">
                        <div class="bg-gray-800 p-2 flex items-center w-full">
                            <div class="w-24 text-center"><span id="locked-recording-timer" class="font-mono text-red-500 animate-pulse">0:00</span></div>
                            <div class="flex-1 text-center"><button id="cancel-locked-btn" class="text-gray-400 hover:text-white">Cancelar</button></div>
                            <div class="w-24 flex justify-center"><button id="send-locked-btn" class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center"><i class="fas fa-stop text-white text-2xl"></i></button></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Área de Input Padrão -->
            <div id="input-area" class="bg-gray-800 border-t border-gray-700 p-2 flex items-center space-x-2">
                <div class="flex-1 bg-gray-700 rounded-full flex items-center"><input id="message-input" type="text" placeholder="Digite sua mensagem..." class="w-full bg-transparent px-4 py-2 text-white focus:outline-none"></div>
                <button id="action-btn" type="button" class="bg-blue-500 text-white w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"><i id="action-icon" class="fas fa-microphone text-xl"></i></button>
            </div>
        </div>`;

    setupInputListeners();
}

/** Configura os ouvintes de evento para a área de input. */
function setupInputListeners() {
    const messageInput = document.getElementById('message-input');
    const actionBtn = document.getElementById('action-btn');
    const actionIcon = document.getElementById('action-icon');
    
    if (!messageInput || !actionBtn || !actionIcon) return;

    messageInput.addEventListener('input', () => {
        actionIcon.className = messageInput.value.trim() ? 'fas fa-paper-plane' : 'fas fa-microphone text-xl';
    });

    actionBtn.addEventListener('click', () => {
        if (messageInput.value.trim()) { handleSendMessage(); }
    });
    
    actionBtn.addEventListener('mousedown', handleGestureStart);
    actionBtn.addEventListener('touchstart', handleGestureStart);
}

// --- LÓGICA DE GRAVAÇÃO DE ÁUDIO ---

function handleGestureStart(e) {
    const messageInput = document.getElementById('message-input');
    if (isRecordingLocked || (messageInput && messageInput.value.trim())) return;
    
    e.preventDefault();
    isRecording = true;
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    window.addEventListener('mousemove', handleGestureMove);
    window.addEventListener('touchmove', handleGestureMove, { passive: false });
    window.addEventListener('mouseup', handleGestureEnd);
    window.addEventListener('touchend', handleGestureEnd);
    
    setTimeout(() => { if (isRecording) { startRecording(); } }, 150);
}

function handleGestureMove(e) {
    if (!isRecording || isRecordingLocked) return;
    e.preventDefault();

    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    let deltaX = currentX - startX;
    let deltaY = currentY - startY;
    
    const finalDeltaX = Math.min(0, deltaX);
    const finalDeltaY = Math.min(0, deltaY);

    const clampedDeltaX = Math.max(CANCEL_THRESHOLD, finalDeltaX);
    const clampedDeltaY = Math.max(LOCK_THRESHOLD, finalDeltaY);

    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) { recordBtn.style.transform = `translate(${clampedDeltaX}px, ${clampedDeltaY}px)`; }
    
    const cancelText = document.querySelector('.slide-to-cancel-text');
    if(cancelText) { cancelText.classList.toggle('active', deltaX < CANCEL_THRESHOLD); }

    const lockIconContainer = document.getElementById('lock-icon-container');
    if(lockIconContainer) { lockIconContainer.classList.toggle('active', deltaY < LOCK_THRESHOLD); }
}

function handleGestureEnd(e) {
    window.removeEventListener('mousemove', handleGestureMove);
    window.removeEventListener('touchmove', handleGestureMove);
    window.removeEventListener('mouseup', handleGestureEnd);
    window.removeEventListener('touchend', handleGestureEnd);
    
    if (!isRecording) return;
    isRecording = false;

    if (isRecordingLocked) return;

    const deltaX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - startX;
    const deltaY = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - startY;
    
    if (deltaY < LOCK_THRESHOLD) {
        lockRecording();
    } else if (deltaX < CANCEL_THRESHOLD) {
        cancelRecording();
    } else {
        stopAndSendRecording();
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const overlay = document.getElementById('recording-overlay');
        const lockIconContainer = document.getElementById('lock-icon-container');
        if(overlay) overlay.classList.remove('hidden');
        if(lockIconContainer) lockIconContainer.classList.add('visible');

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                uploadAudio(audioBlob);
            }
        };
        mediaRecorder.start();
        recordingStartTime = Date.now();
        timerInterval = setInterval(updateTimer, 100);
    } catch (err) {
        console.error("Erro ao acessar o microfone:", err);
        showNotification("Permissão de microfone negada.", "error");
        resetRecordingUI();
    }
}

function lockRecording() {
    isRecordingLocked = true;
    const uiDefault = document.getElementById('recording-ui-default');
    const uiLocked = document.getElementById('recording-ui-locked');
    if(uiDefault) uiDefault.classList.add('hidden');
    if(uiLocked) uiLocked.classList.remove('hidden');

    document.getElementById('cancel-locked-btn').onclick = cancelRecording;
    document.getElementById('send-locked-btn').onclick = stopAndSendRecording;
}

function stopAndSendRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") { mediaRecorder.stop(); }
    resetRecordingUI();
}

function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.onstop = () => {
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            audioChunks = [];
        };
        mediaRecorder.stop();
    }
    resetRecordingUI();
    showNotification("Gravação cancelada", "info");
}

function resetRecordingUI() {
    clearInterval(timerInterval);
    isRecording = false;
    isRecordingLocked = false;
    audioChunks = [];
    
    const overlay = document.getElementById('recording-overlay');
    if (overlay) { overlay.classList.add('hidden'); }
    
    const uiDefault = document.getElementById('recording-ui-default');
    const uiLocked = document.getElementById('recording-ui-locked');
    if(uiDefault) uiDefault.classList.remove('hidden');
    if(uiLocked) uiLocked.classList.add('hidden');
    
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) { recordBtn.style.transform = 'translate(0,0)'; }
    const lockIcon = document.getElementById('lock-icon-container');
    if (lockIcon) { lockIcon.classList.remove('visible', 'active'); }
    const cancelText = document.querySelector('.slide-to-cancel-text');
    if(cancelText) { cancelText.classList.remove('active'); }
}

async function uploadAudio(audioBlob) {
    if (!currentChatId) return;
    showNotification("Enviando áudio...", "info");
    const user = getCurrentUser();
    const filePath = `chats/${currentChatId}/${user.uid}-${new Date().getTime()}.webm`;
    const storageRef = storage.ref(filePath);
    try {
        const snapshot = await storageRef.put(audioBlob);
        const downloadURL = await snapshot.ref.getDownloadURL();
        await db.collection('privateChats').doc(currentChatId).collection('messages').add({
            type: 'audio',
            audioURL: downloadURL,
            userId: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'sent' // Adiciona status inicial
        });
    } catch (error) {
        console.error("Erro ao enviar áudio:", error);
        showNotification("Falha ao enviar áudio.", "error");
    }
}

// --- Funções de Renderização e Envio de Mensagens ---

function loadMessages(chatId) {
    if (messagesListener) messagesListener();
    const messagesQuery = db.collection('privateChats').doc(chatId).collection('messages')
        .orderBy('timestamp', 'desc').limit(50);

    messagesListener = messagesQuery.onSnapshot(snapshot => {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        const currentUser = getCurrentUser();
        
        // Limpa e redesenha tudo para manter a ordem e o estado corretos
        messagesContainer.innerHTML = '';
        const docs = snapshot.docs.slice().reverse(); // Exibe do mais antigo ao mais novo

        docs.forEach(doc => {
             const message = doc.data();
             const msgDiv = renderSingleMessage(doc.id, message);
             messagesContainer.appendChild(msgDiv);
             setupAudioPlayer(msgDiv);
             
             // Marcar como vista
             if (message.userId !== currentUser.uid && message.status !== 'seen') {
                 doc.ref.update({ status: 'seen' }).catch(err => console.error("Erro ao marcar como visto:", err));
             }
        });

        // Rolar para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (snapshot.empty) {
            messagesContainer.innerHTML = `<p class="text-center text-gray-500 text-sm p-4">Ainda não há mensagens.</p>`;
        }
    });
}


/**
 * Formata o tempo em segundos para o formato M:SS.
 * @param {number} timeInSeconds - O tempo em segundos.
 * @returns {string} O tempo formatado.
 */
function formatPlayerTime(timeInSeconds) {
    if (isNaN(timeInSeconds) || timeInSeconds === Infinity) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Retorna o ícone de confirmação de leitura.
 * @param {string} status - O status da mensagem ('sent' ou 'seen').
 * @returns {string} O HTML do ícone.
 */
function getReceiptIcon(status) {
    if (status === 'seen') {
        return `<i class="fas fa-check-double text-blue-400"></i>`;
    }
    return `<i class="fas fa-check"></i>`;
}

/**
 * Configura a lógica para um player de áudio customizado.
 * @param {HTMLElement} playerElement - O elemento container do player.
 */
function setupAudioPlayer(playerElement) {
    const audio = playerElement.querySelector('.hidden-audio');
    if (!audio) return;

    const playPauseBtn = playerElement.querySelector('.play-pause-btn');
    const playIcon = playPauseBtn.querySelector('i');
    const progressClipper = playerElement.querySelector('.waveform-svg-progress');
    const progressHandle = playerElement.querySelector('.progress-handle');
    const timeDisplay = playerElement.querySelector('.time-display');
    const progressContainer = playerElement.querySelector('.progress-container');
    let totalDuration = 0;

    playPauseBtn.addEventListener('click', () => {
        document.querySelectorAll('.hidden-audio').forEach(el => {
            if (el !== audio) el.pause(); // Pausa outros áudios
        });
        if (audio.paused) audio.play();
        else audio.pause();
    });

    audio.addEventListener('play', () => playIcon.className = 'fas fa-pause text-lg');
    audio.addEventListener('pause', () => {
        playIcon.className = 'fas fa-play text-lg ml-1';
        if (timeDisplay) timeDisplay.textContent = formatPlayerTime(totalDuration);
    });
    audio.addEventListener('ended', () => {
        playIcon.className = 'fas fa-play text-lg ml-1';
        if (timeDisplay) timeDisplay.textContent = formatPlayerTime(totalDuration);
        if(progressClipper) progressClipper.style.clipPath = `inset(0 100% 0 0)`;
        if(progressHandle) progressHandle.style.left = `0%`;
    });

    audio.addEventListener('loadedmetadata', () => {
        totalDuration = audio.duration;
        if (timeDisplay) timeDisplay.textContent = formatPlayerTime(totalDuration);
    });

    audio.addEventListener('timeupdate', () => {
        if (!totalDuration || isNaN(totalDuration)) return;
        const progressPercent = (audio.currentTime / totalDuration) * 100;
        if (progressClipper) progressClipper.style.clipPath = `inset(0 ${100 - progressPercent}% 0 0)`;
        if (progressHandle) progressHandle.style.left = `${progressPercent}%`;
        if (timeDisplay) timeDisplay.textContent = formatPlayerTime(audio.currentTime);
    });

    function scrub(e) {
        e.preventDefault();
        const rect = progressContainer.getBoundingClientRect();
        const percent = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
        if (totalDuration) audio.currentTime = percent * totalDuration;
    }

    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => { isScrubbing = true; scrub(e); });
    document.addEventListener('mousemove', (e) => { if (isScrubbing) { scrub(e); } });
    document.addEventListener('mouseup', () => { isScrubbing = false; });
    progressContainer.addEventListener('touchstart', (e) => { isScrubbing = true; scrub(e.touches[0]); });
    document.addEventListener('touchmove', (e) => { if (isScrubbing) { e.preventDefault(); scrub(e.touches[0]); } });
    document.addEventListener('touchend', () => { isScrubbing = false; });
}

function renderSingleMessage(docId, message) {
    const user = getCurrentUser();
    const isOwnMessage = user && message.userId === user.uid;
    const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const messageId = `msg_${docId}`;

    let messageBody = '';

    if (message.type === 'audio') {
        const waveformSvgPath = "M0 7.5 Q 2.5 2.5, 5 7.5 T 10 7.5 T 15 7.5 Q 17.5 12.5, 20 7.5 T 25 7.5 T 30 7.5 Q 32.5 4, 35 7.5 T 40 7.5 T 45 7.5 Q 47.5 11, 50 7.5 T 55 7.5 T 60 7.5 Q 62.5 3, 65 7.5 T 70 7.5 T 75 7.5 Q 77.5 12, 80 7.5 T 85 7.5 T 90 7.5 Q 92.5 5, 95 7.5 T 100 7.5";
        
        messageBody = `
            <div class="custom-audio-player" style="width: 250px;">
                 <audio class="hidden-audio" src="${message.audioURL}" preload="metadata"></audio>
                 <div class="flex items-center gap-2">
                     <img src="${message.photoURL}" alt="avatar" class="w-10 h-10 rounded-full flex-shrink-0">
                    <button class="play-pause-btn text-white w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-500">
                        <i class="fas fa-play text-sm ml-0.5"></i>
                    </button>
                    <div class="flex-1 flex flex-col justify-center">
                        <div class="progress-container w-full h-2 relative flex items-center cursor-pointer">
                            <svg class="waveform-svg absolute w-full h-full" viewBox="0 0 100 15"><path d="${waveformSvgPath}" fill="none" stroke="${isOwnMessage ? 'rgba(255,255,255,0.4)' : 'rgba(107, 114, 128, 0.5)'}" stroke-width="1.5"/></svg>
                            <div class="waveform-svg-progress absolute h-full top-0 left-0 w-full">
                               <svg class="w-full h-full" viewBox="0 0 100 15"><path d="${waveformSvgPath}" fill="none" stroke="${isOwnMessage ? 'white' : '#60a5fa'}" stroke-width="1.5"/></svg>
                            </div>
                            <div class="progress-handle bg-white w-2.5 h-2.5 rounded-full absolute" style="left: 0%; top: 50%; transform: translate(-50%, -50%);"></div>
                        </div>
                        <div class="time-display text-xs text-gray-400 mt-1">0:00</div>
                    </div>
                 </div>
            </div>
        `;
    } else { // Mensagem de texto
        messageBody = `<p class="px-3 py-2 break-words">${message.text || ''}</p>`;
    }

    const msgDiv = document.createElement('div');
    msgDiv.id = messageId;
    msgDiv.className = `w-full flex items-start gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`;
    
    const messageBlock = `
        <div class="max-w-xs md:max-w-md">
            <div class="p-1 rounded-lg text-white break-words ${isOwnMessage ? 'bg-blue-700' : 'bg-gray-700'}">
                ${messageBody}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-500 mt-1 px-1 ${isOwnMessage ? 'justify-end' : ''}">
                <span>${time}</span>
                ${isOwnMessage ? `<span class="read-receipt-icon">${getReceiptIcon(message.status)}</span>` : ''}
            </div>
        </div>`;
        
    const avatar = `<img src="${message.photoURL}" alt="${message.displayName}" class="w-8 h-8 rounded-full flex-shrink-0">`;

    msgDiv.innerHTML = isOwnMessage ? messageBlock : (message.type === 'audio' ? "" : avatar) + messageBlock;
    
    return msgDiv;
}


async function handleSendMessage() {
    const input = document.getElementById('message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !currentChatId) return;
    const user = getCurrentUser();
    if (!user) return;
    input.value = '';
    const actionIcon = document.getElementById('action-icon');
    if (actionIcon) actionIcon.className = 'fas fa-microphone text-xl';
    try {
        await db.collection('privateChats').doc(currentChatId).collection('messages').add({
            type: 'text',
            text: text,
            userId: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'sent' // Adiciona status inicial
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem', 'error');
        input.value = text;
    }
}

// --- Funções Auxiliares ---

function updateTimer() {
    const timerElement = document.getElementById('recording-timer');
    if (timerElement) { timerElement.textContent = formatTime(Date.now() - recordingStartTime); }
    const lockedTimerElement = document.getElementById('locked-recording-timer');
    if (lockedTimerElement) { lockedTimerElement.textContent = formatTime(Date.now() - recordingStartTime); }
}

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
