/* ============================================================
   Train N Grain — AI Fitness Coach Chat Widget (chat.js)
   Loaded on all pages. Dynamically creates chatbot UI.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine page context
    const path = window.location.pathname;
    let pageContext = 'home';
    let coachTitle = '🤖 TNG Coach';
    let welcomeMsg = 'Hello! I\'m your Train N Grain AI assistant. Ask me anything about fitness, workouts, diets, or health!';

    if (path.includes('fitness.html')) {
        pageContext = 'fitness';
        coachTitle = '🏋️ Fitness Coach';
        welcomeMsg = 'Hey there! Ready to crush your workouts? I am your AI Fitness Trainer. Ask me about exercises, forms, or your routine!';
    } else if (path.includes('nutrition.html')) {
        pageContext = 'nutrition';
        coachTitle = '🥦 Nutrition Coach';
        welcomeMsg = 'Hi! Ready to fuel your body? I am your AI Nutrition Coach. Ask me about meal prep, macros, calories, or recipes!';
    }

    // 2. Inject Chat HTML structure into body
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.id = 'tng-chat-widget';
    widget.innerHTML = `
        <div class="chat-bubble" id="tng-chat-bubble">💬</div>
        <div class="chat-window">
            <div class="chat-header">
                <h4>${coachTitle}</h4>
                <button class="chat-close-btn" id="tng-chat-close">✕</button>
            </div>
            <div class="chat-messages" id="tng-chat-messages">
                <div class="chat-message assistant">${welcomeMsg}</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="tng-chat-input" placeholder="Ask a fitness/nutrition question..." autocomplete="off">
                <button class="chat-send-btn" id="tng-chat-send">➤</button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // 3. UI References & Open/Close toggles
    const bubble = document.getElementById('tng-chat-bubble');
    const closeBtn = document.getElementById('tng-chat-close');
    const input = document.getElementById('tng-chat-input');
    const sendBtn = document.getElementById('tng-chat-send');
    const messagesContainer = document.getElementById('tng-chat-messages');

    bubble.addEventListener('click', () => widget.classList.toggle('active'));
    closeBtn.addEventListener('click', () => widget.classList.remove('active'));

    // 4. Conversation state logger
    const chatLog = [
        { role: 'assistant', text: welcomeMsg }
    ];

    // Get Firebase user's first name if logged in
    function getUsername() {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user && user.displayName) {
                    return user.displayName.trim().split(' ')[0];
                }
            }
        } catch (e) {
            // Silence silent auth retrieval failures
        }
        return null;
    }

    // Helper to format basic markdown (bold/italic) and escape HTML for XSS prevention
    function formatMessageText(text) {
        let safe = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Convert **bold** to <strong>bold</strong>
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* to <em>italic</em>
        safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return safe;
    }

    // Append a message bubble to UI
    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        msgDiv.innerHTML = formatMessageText(text);
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Toggle typing indicator
    let typingIndicator = null;
    function showTyping(show) {
        if (show) {
            if (typingIndicator) return;
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'chat-typing-indicator';
            typingIndicator.innerHTML = `
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
            `;
            messagesContainer.appendChild(typingIndicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
                typingIndicator = null;
            }
        }
    }

    // Message sending handler
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // Clear input textbox
        input.value = '';

        // Add user message to UI and logs
        appendMessage('user', text);
        chatLog.push({ role: 'user', text: text });

        // Show loading state
        showTyping(true);

        const username = getUsername();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: chatLog,
                    page: pageContext,
                    username: username
                })
            });

            showTyping(false);

            if (!response.ok) {
                const errData = await response.json();
                appendMessage('system-error', errData.error || 'Failed to connect. Please try again.');
                return;
            }

            const data = await response.json();
            appendMessage('assistant', data.reply);
            chatLog.push({ role: 'assistant', text: data.reply });

        } catch (err) {
            showTyping(false);
            appendMessage('system-error', 'Server error. Please verify your connection.');
        }
    }

    // Send on button click
    sendBtn.addEventListener('click', sendMessage);

    // Send on Enter key press
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});
