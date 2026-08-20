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

  const apiUrl = localStorage.getItem('cw_api_url') || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const modelName = localStorage.getItem('cw_model_name') || "gemini-3.6-flash";
  const apiKey = localStorage.getItem('cw_api_key') || "";

  if (!apiKey) {
      botMsg.innerText = "Error: API Key missing.";
      alert("Please configure your API Key in the Settings page before chatting.");
      return;
  }

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
    // Settings are now handled exclusively on the Settings page
    
    // Check if we need to clear the hardcoded welcome message from HTML
    const messages = document.getElementById("messages");
    if (localStorage.getItem('cw_chat_history')) {
        messages.innerHTML = '';
        renderChatHistory();
    }
});