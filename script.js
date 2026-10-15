// ============================================================================
// CyberShield AI - Frontend Operations & n8n Integration Hub
// ============================================================================

// Configuration for n8n Webhook / Chat Trigger
// Keep this empty until you are ready to connect your production n8n workflow.
// Example: "https://your-n8n-instance.com/webhook/cybershield-chat"
const CONFIG = {
  n8nWebhookUrl: "https://goyalrushita.app.n8n.cloud/webhook/4c069cf8-0b56-4f6c-86dc-c7e50f65fb7e/chat",
  sessionId: (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : "session-" + Math.random().toString(36).substring(2, 11)
};

// DOM Element References
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const statusMessage = document.getElementById("status");
const sendButton = document.getElementById("send-button");
const clearButton = document.getElementById("clear-chat");
const welcome = document.getElementById("welcome");
const pageTitle = document.getElementById("page-title");
const connectionBadge = document.getElementById("connection-badge");
const connectionDot = document.getElementById("connection-dot");
const connectionText = document.getElementById("connection-text");

// Application State
let currentMode = "chat";
let isWaitingForResponse = false;

/**
 * Updates topbar indicator based on whether n8n endpoint is configured
 */
function updateConnectionStatus() {
  const isConfigured = Boolean(CONFIG.n8nWebhookUrl && CONFIG.n8nWebhookUrl.trim());
  if (connectionBadge && connectionText) {
    if (isConfigured) {
      connectionBadge.className = "online-badge connected-badge";
      connectionText.textContent = "Live Backend Ready";
    } else {
      connectionBadge.className = "online-badge demo-badge";
      connectionText.textContent = "Demo Mode (Offline)";
    }
  }
}

/**
 * Safely appends a message bubble into the conversation stream
 * Uses textContent exclusively to prevent XSS.
 */
function addMessage(text, sender = "assistant") {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = sender === "user" ? "👤" : "🛡️";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const lines = String(text).split("\n");
  lines.forEach((line, index) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    bubble.appendChild(paragraph);
  });

  message.append(avatar, bubble);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Creates and displays an animated typing indicator without innerHTML
 */
function showTypingIndicator() {
  const message = document.createElement("div");
  message.className = "message assistant typing";
  message.id = "typing-indicator";
  message.setAttribute("aria-label", "AI Assistant is analyzing");

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "🛡️";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    indicator.appendChild(dot);
  }

  bubble.appendChild(indicator);
  message.append(avatar, bubble);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Removes active typing indicator
 */
function removeTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Renders an error notice cleanly in the chat stream using safe DOM nodes
 */
function showError(errorText) {
  const errorContainer = document.createElement("div");
  errorContainer.className = "message assistant error";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "⚠️";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const errorTitle = document.createElement("strong");
  errorTitle.className = "error-title";
  errorTitle.textContent = "Security Notice";
  bubble.appendChild(errorTitle);

  const errorParagraph = document.createElement("p");
  errorParagraph.textContent = errorText;
  bubble.appendChild(errorParagraph);

  errorContainer.append(avatar, bubble);
  messages.appendChild(errorContainer);
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Handles switching between dashboard modes (chat, phishing, quiz)
 */
function setMode(mode) {
  currentMode = mode;

  const titles = {
    chat: "Cybersecurity Assistant",
    phishing: "Phishing Analysis Console",
    quiz: "Security Awareness Quiz"
  };

  pageTitle.textContent = titles[mode] || titles.chat;

  document.querySelectorAll(".nav-item").forEach(button => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  const placeholders = {
    chat: "Ask about cybersecurity concepts, threat trends, or defensive habits...",
    phishing: "Paste email headers or message text (redact sensitive info before sending)...",
    quiz: "Type 'Start a 5-question quiz' or select an option to test your knowledge..."
  };

  input.placeholder = placeholders[mode] || placeholders.chat;
  input.focus();
}

/**
 * Generates transparent educational guidance for demo mode.
 * Never claims to have executed a real security scan or malware check.
 */
function getDemoResponse(userQuery, mode) {
  if (mode === "phishing") {
    return [
      "🛡️ Phishing Safety Guide (Demo Mode · Offline Analysis):",
      "Because no live threat engine or n8n workflow is connected, this message was not submitted to any scanner or security database.",
      "",
      "Key manual verification checklist:",
      "1. Urgency / Coercion: Scams often pressure you with deadlines ('Account suspended in 24 hours').",
      "2. Link Anatomy: Verify actual destination domains; beware deceptive subdomains (e.g., support.company.com.attacker-domain.net).",
      "3. Sensitive Credential Demands: Authentic institutions will never demand passwords or OTP codes over chat or unverified links.",
      "4. Sender Domain Alignment: Inspect the full email header for spoofed display names.",
      "",
      "Tip: To enable live heuristic checks, configure your n8n workflow endpoint in script.js."
    ].join("\n");
  }

  if (mode === "quiz") {
    return [
      "🎯 Security Awareness Quiz (Demo Mode):",
      "Question: You receive an urgent email from 'support@paypa1-security.com' claiming your account has an unauthorized payment.",
      "",
      "What is the recommended first response?",
      "A) Click the 'Cancel Payment' button immediately to avoid charges.",
      "B) Forward the email to your friends to warn them.",
      "C) Do not click any links; log into your account directly via the official mobile app or a bookmarked browser link.",
      "",
      "Type your answer (A, B, or C) to practice, or connect your n8n AI workflow for dynamic quizzing!"
    ].join("\n");
  }

  return [
    "🛡️ CyberShield AI Demo Mode:",
    "Your message was received by the frontend interface. The live n8n backend is currently unconfigured.",
    "",
    "Next Steps to Go Live:",
    "1. Open script.js and configure CONFIG.n8nWebhookUrl with your n8n Production Webhook URL.",
    "2. Connect your n8n workflow to an AI Agent or Chat Trigger node.",
    "3. No data was sent externally during this test.",
    "",
    "Feel free to test prompt suggestions, modes, or responsive UI behavior."
  ].join("\n");
}

/**
 * Adaptable response extractor for various n8n workflow formats
 */
function parseN8nResponse(data) {
  if (data === null || data === undefined) {
    return "Received an empty payload from the workflow.";
  }

  if (typeof data === "string") {
    return data.trim();
  }

  // Handle n8n standard array output: [{ "output": "..." }] or [{ "json": { ... } }]
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (typeof firstItem === "string") return firstItem;
    if (firstItem && typeof firstItem === "object") {
      if (firstItem.output) return String(firstItem.output);
      if (firstItem.text) return String(firstItem.text);
      if (firstItem.message) return String(firstItem.message);
      if (firstItem.response) return String(firstItem.response);
      if (firstItem.json) return parseN8nResponse(firstItem.json);
    }
  }

  // Handle object output: { output: "..." }, { text: "..." }, { response: "..." }
  if (typeof data === "object") {
    if (data.output) return String(data.output);
    if (data.response) return String(data.response);
    if (data.text) return String(data.text);
    if (data.message) return String(data.message);
    if (data.reply) return String(data.reply);
    
    // Fallback: safely format JSON without throwing
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "Response received in an unexpected data structure.";
    }
  }

  return String(data);
}

/**
 * Transmits payload to configured n8n endpoint or falls back to demo mode
 */
async function sendToBackend(messageText) {
  const endpoint = CONFIG.n8nWebhookUrl
    ? CONFIG.n8nWebhookUrl.trim()
    : "";

  if (!endpoint) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return getDemoResponse(messageText, currentMode);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*"
      },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: CONFIG.sessionId,
        chatInput: messageText
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(
        `n8n returned HTTP ${response.status}. Check the workflow and Chat URL.`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    const reply = parseN8nResponse(data);

    if (!reply) {
      throw new Error("n8n returned an empty response.");
    }

    return reply;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your n8n workflow.");
    }

    console.error("Backend dispatch error:", error);
    throw new Error(error.message || "Could not connect to n8n.");
  } finally {
    clearTimeout(timeoutId);
  }
}


// Event Listeners for Nav Modes
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.mode) {
      setMode(button.dataset.mode);
    }
  });
});

// Event Listeners for Quick Action Buttons
document.querySelectorAll(".quick-card").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.mode) {
      setMode(button.dataset.mode);
      if (button.dataset.mode === "quiz") {
        input.value = "Start a cybersecurity awareness quiz.";
      } else if (button.dataset.mode === "phishing") {
        input.value = "";
      }
    } else if (button.dataset.prompt) {
      input.value = button.dataset.prompt;
    }
    input.focus();
  });
});

// Message Form Submission
form.addEventListener("submit", async event => {
  event.preventDefault();

  if (isWaitingForResponse) return;

  const text = input.value.trim();
  if (!text) return;

  // Set processing state
  isWaitingForResponse = true;
  sendButton.disabled = true;
  input.disabled = true;

  addMessage(text, "user");
  input.value = "";
  input.style.height = "28px";

  if (welcome.style.display !== "none") {
    welcome.style.display = "none";
  }

  statusMessage.textContent = CONFIG.n8nWebhookUrl
    ? "Connecting to security workflow..."
    : "Analyzing in educational demo mode...";

  showTypingIndicator();

  try {
    const aiResponse = await sendToBackend(text);
    removeTypingIndicator();
    addMessage(aiResponse, "assistant");
    statusMessage.textContent = CONFIG.n8nWebhookUrl
      ? "Live backend connection active"
      : "Demo mode · n8n backend not connected";
  } catch (error) {
    removeTypingIndicator();
    showError(error.message);
    statusMessage.textContent = "Connection issue encountered";
  } finally {
    isWaitingForResponse = false;
    sendButton.disabled = false;
    input.disabled = false;
    input.focus();
  }
});

// Reset / Clear Conversation
clearButton.addEventListener("click", () => {
  messages.replaceChildren();
  welcome.style.display = "";
  statusMessage.textContent = "";

  addMessage(
    "Hello! I'm CyberShield AI. How can I assist your digital defense today?",
    "assistant"
  );

  // Optional new session ID on manual reset
  CONFIG.sessionId = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : "session-" + Math.random().toString(36).substring(2, 11);
});

// Enter-to-send, Shift+Enter for new line
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (!isWaitingForResponse) {
      form.requestSubmit();
    }
  }
});

// Auto-expand textarea dynamically
input.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 160) + "px";
  if (!this.value.trim()) {
    this.style.height = "28px";
  }
});

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  updateConnectionStatus();
});
updateConnectionStatus();
