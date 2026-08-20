let chatHistory = [];

function saveChatHistory() {
    localStorage.setItem('cw_chat_history', JSON.stringify(chatHistory));
}

function renderChatHistory() {
    const messages = document.getElementById("messages");
    const saved = localStorage.getItem('cw_chat_history');
    if (saved) {
        try {
            chatHistory = JSON.parse(saved);
            chatHistory.forEach(msg => {
                const msgDiv = document.createElement("div");
                msgDiv.className = `message ${msg.role}`;
                msgDiv.innerText = msg.content;
                messages.appendChild(msgDiv);
            });
            messages.scrollTop = messages.scrollHeight;
        } catch (e) {
            console.error("Failed to parse chat history");
        }
    }
}

window.clearChatHistory = function() {
    if (confirm("Are you sure you want to clear the chat history?")) {
        chatHistory = [];
        localStorage.removeItem('cw_chat_history');
        const messages = document.getElementById("messages");
        // Remove all children except the first welcome message if it exists
        messages.innerHTML = '';
        const welcome = document.createElement("div");
        welcome.className = "message bot";
        welcome.innerText = "Hello! I am your AI Career Advisor. How can I help you map out your future today?";
        messages.appendChild(welcome);
    }
}

function sendMessage(text = null) {
  const input = document.getElementById("input");
  const messages = document.getElementById("messages");
  const message = text || input.value.trim();
  if (!message) return;

  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.innerText = message;
  messages.appendChild(userMsg);
  
  chatHistory.push({ role: 'user', content: message });
  saveChatHistory();
  
  input.value = "";

  const botMsg = document.createElement("div");
  botMsg.className = "message bot";
  botMsg.innerText = "Thinking...";
  messages.appendChild(botMsg);

  messages.scrollTop = messages.scrollHeight;

  const apiUrl = document.getElementById("api_url") ? document.getElementById("api_url").value.trim() : "";
  const modelName = document.getElementById("model_name") ? document.getElementById("model_name").value.trim() : "";
  const apiKey = document.getElementById("api_key") ? document.getElementById("api_key").value.trim() : "";

  // Save to localStorage for cross-page persistence
  localStorage.setItem('cw_api_url', apiUrl);
  localStorage.setItem('cw_model_name', modelName);
  localStorage.setItem('cw_api_key', apiKey);

  fetch("http://127.0.0.1:5000/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
        message: message,
        api_url: apiUrl,
        model_name: modelName,
        api_key: apiKey
    })
  })
  .then(res => res.json())
  .then(data => {
    const replyText = data.reply || "No response received.";
    botMsg.innerText = replyText;
    chatHistory.push({ role: 'bot', content: replyText });
    saveChatHistory();
  })
  .catch(() => {
    botMsg.innerText = "Error connecting to server.";
  });
}

document.getElementById("input").addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Load settings from localStorage when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cw_api_url')) document.getElementById('api_url').value = localStorage.getItem('cw_api_url');
    if (localStorage.getItem('cw_model_name')) document.getElementById('model_name').value = localStorage.getItem('cw_model_name');
    if (localStorage.getItem('cw_api_key')) document.getElementById('api_key').value = localStorage.getItem('cw_api_key');
    
    // Check if we need to clear the hardcoded welcome message from HTML
    const messages = document.getElementById("messages");
    if (localStorage.getItem('cw_chat_history')) {
        messages.innerHTML = '';
        renderChatHistory();
    }
});