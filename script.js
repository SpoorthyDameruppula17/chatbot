let history = [{
    assistant: "Welcome to Ainexa! I'm AskAinexa, your AI assistant. How can I help you today?",
    timestamp: new Date().toLocaleTimeString()
  }];
  let companyData = [];
  let embedder;
  
  async function init() {
    try {
      const response = await fetch('company_data/company_data.json');
      companyData = await response.json();
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      embedder = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2');
    } catch (error) {
      history.push({ assistant: "Sorry, I couldn't load some data. But I'm still here to help!", timestamp: new Date().toLocaleTimeString() });
      updateChatHistory();
    }
    updateChatHistory();
  }
  
  function toggleChat() {
    const container = document.getElementById("chat-container");
    container.classList.toggle("visible");
    container.classList.toggle("hidden");
  }
  
  async function searchKnowledgeBase(query) {
    try {
      const queryEmbedding = (await embedder(query, { pooling: 'mean', normalize: true }))[0];
      const scores = companyData.map(item => ({
        text: item.text,
        score: item.embedding.reduce((sum, a, i) => sum + a * queryEmbedding[i], 0)
      }));
      return scores.sort((a, b) => b.score - a.score).slice(0, 5).map(item => item.text).join("\n");
    } catch (error) {
      return "";
    }
  }
  
  function buildPrompt(context, query, chatHistory) {
    const historyText = chatHistory.map(h => `User: ${h.user || ''}\nAssistant: ${h.assistant || ''}`).join("\n");
    return `
      You are AskAinexa's AI assistant, trained with company knowledge.
      Be clear, concise, professional, and friendly. If unsure, say: "I'm not certain, but I can connect you with our team."
      Previous chat history:
      ${historyText}
      Company Knowledge:
      ${context}
      Current Question:
      ${query}
      Only provide contact info if explicitly asked: General: contact@ainexa.in, HR: hr@ainexa.in, Website: www.ainexa.in
    `;
  }
  
  async function sendMessage() {
    const inputElem = document.getElementById("user-input");
    const input = inputElem.value.trim();
    if (!input) return;
  
    const typingIndex = history.findIndex(h => h.assistant === "Typing..." || h.assistant === "Speaking...");
    if (typingIndex > -1) history.splice(typingIndex, 1);
  
    history.push({ user: input, timestamp: new Date().toLocaleTimeString() });
    updateChatHistory();
  
    try {
      const context = await searchKnowledgeBase(input);
      const prompt = buildPrompt(context, input, history);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5
        })
      });
  
      const data = await response.json();
      const reply = data.choices[0].message.content.trim();
      const replyTime = new Date().toLocaleTimeString();
      history.push({ assistant: reply, timestamp: replyTime });
      updateChatHistory(true);
    } catch (err) {
      history.push({ assistant: "Sorry, something went wrong. Please try again.", timestamp: new Date().toLocaleTimeString() });
      updateChatHistory();
    }
    inputElem.value = "";
  }
  
  function updateChatHistory() {
    const chatHistory = document.getElementById("chat-history");
    chatHistory.innerHTML = history.map(h =>
      h.user
        ? `<div class="message user-message"><b>You:</b> ${h.user}<span class="timestamp">${h.timestamp}</span></div>`
        : h.assistant === "Typing..." || h.assistant === "Speaking..."
        ? `<div class="message user-message"><b>You:</b> ${h.assistant}<span class="timestamp">${h.timestamp}</span></div>`
        : `<div class="message agent-message"><b>AskAinexa:</b> <span class="agent-reply">${h.assistant}</span><span class="timestamp">${h.timestamp}</span></div>`
    ).join("");
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  
  // Speech Recognition Setup
  const micButton = document.getElementById("mic-button");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
  
    micButton.addEventListener("click", () => {
      history.push({ assistant: "Speaking...", timestamp: new Date().toLocaleTimeString() });
      updateChatHistory();
      recognition.start();
    });
  
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript.trim();
      document.getElementById("user-input").value = transcript;
      sendMessage();
    };
  
    recognition.onerror = event => {
      alert("Mic error: " + event.error);
    };
  } else {
    micButton.disabled = true;
    micButton.title = "Speech recognition not supported";
  }
  
  // Typing indicator
  const userInputElem = document.getElementById("user-input");
  userInputElem.addEventListener("input", () => {
    if (userInputElem.value.trim()) {
      const lastMessage = history[history.length - 1];
      if (lastMessage.assistant !== "Typing...") {
        history.push({ assistant: "Typing...", timestamp: new Date().toLocaleTimeString() });
        updateChatHistory();
      }
    } else {
      const typingIndex = history.findIndex(h => h.assistant === "Typing...");
      if (typingIndex > -1) history.splice(typingIndex, 1);
      updateChatHistory();
    }
  });
  
  userInputElem.addEventListener("blur", () => {
    const typingIndex = history.findIndex(h => h.assistant === "Typing...");
    if (typingIndex > -1) history.splice(typingIndex, 1);
    updateChatHistory();
  });
  
  document.getElementById("user-input").addEventListener("keypress", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
  
  window.toggleChat = toggleChat;
  window.sendMessage = sendMessage;
  init();
  