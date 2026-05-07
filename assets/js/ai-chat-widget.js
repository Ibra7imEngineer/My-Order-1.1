/**
 * =========================================================
 * My Order AI Chat Widget
 * =========================================================
 * A professional, production-ready AI chat assistant
 * Powered by Google Gemini 1.5 Flash
 *
 * 📧 Email: ibra7im.engineer@gmail.com
 * 🌐 Website: https://www.instagram.com/ibra7im_mo7amad
 * Version: 1.1
 * =========================================================
 */

class AIChatWidget {
  constructor(config = {}) {
    // API calls now proxied through PHP backend for security
    // No longer storing API key in browser - keep sensitive data server-side
    this.API_ENDPOINT = this.resolveApiEndpoint();
    this.MODEL = "gemini-2.5-flash";

    // System instruction for the AI - Professional Arabic support for My Order restaurant
    this.SYSTEM_PROMPT = `أنت المساعد الذكي الرسمي لمطعم My Order. يجب أن تكون جميع إجاباتك باللغة العربية الفصحى وبأسلوب احترافي واضح، كاملة، ومفيدة. ركز على تقديم معلومات عن المنيو، الحجوزات، وأسئلة الخدمة. أجب دائماً بجمل كاملة ومهذبة، ولا تقطع الإجابات. إذا كان السؤال غامضاً، اطلب توضيحاً بلباقة.`;

    this.chatHistory = [];
    this.isOpen = false;
    this.isLoading = false;

    console.log("🔧 AIChatWidget Constructor Initialized");
    console.log("   - Mode: Secure Backend Proxy");
    console.log("   - Endpoint: " + this.API_ENDPOINT);
    console.log("   - Model: " + this.MODEL);

    this.initializeWidget();
    this.attachEventListeners();
  }

  /**
   * Initialize widget DOM elements
   */
  initializeWidget() {
    // Create floating trigger button
    const triggerBtn = document.createElement("button");
    triggerBtn.id = "ai-chat-trigger";
    triggerBtn.className = "ai-chat-trigger";
    triggerBtn.setAttribute("aria-label", "Open AI Chat Widget");
    triggerBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="pulse-ring"></span>
        `;

    // Create chat window container
    const chatWindow = document.createElement("div");
    chatWindow.id = "ai-chat-window";
    chatWindow.className = "ai-chat-window";
    chatWindow.innerHTML = `
            <!-- Header -->
            <div class="ai-chat-header">
                <div class="ai-chat-header-content">
                    <div class="ai-chat-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div class="ai-chat-header-text">
                        <h3>مساعد My Order</h3>
                        <span class="ai-chat-status">متصل</span>
                    </div>
                </div>
                <button class="ai-chat-close" aria-label="Close chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Messages Container -->
            <div class="ai-chat-messages">
                <div class="ai-chat-welcome">
                    <div class="ai-chat-welcome-icon">👋</div>
                    <h4>مرحباً بك في مطعم My Order</h4>
                    <p>أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟</p>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div class="ai-chat-typing" style="display: none;">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <!-- Input Area -->
            <div class="ai-chat-input-area">
                <input 
                    type="text" 
                    class="ai-chat-input" 
                    placeholder="اكتب رسالتك..."
                    aria-label="Chat message input"
                    dir="rtl"
                >
                <button class="ai-chat-send" aria-label="Send message">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        `;

    // Append to body
    document.body.appendChild(triggerBtn);
    document.body.appendChild(chatWindow);

    // Cache DOM elements
    this.triggerBtn = triggerBtn;
    this.chatWindow = chatWindow;
    this.messagesContainer = chatWindow.querySelector(".ai-chat-messages");
    this.input = chatWindow.querySelector(".ai-chat-input");
    this.sendBtn = chatWindow.querySelector(".ai-chat-send");
    this.closeBtn = chatWindow.querySelector(".ai-chat-close");
    this.typingIndicator = chatWindow.querySelector(".ai-chat-typing");
  }

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    // Trigger button
    this.triggerBtn.addEventListener("click", () => this.toggleChat());

    // Close button
    this.closeBtn.addEventListener("click", () => this.toggleChat());

    // Send button
    this.sendBtn.addEventListener("click", () => this.sendMessage());

    // Input field - Enter to send
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Click outside to close (optional)
    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".ai-chat-window") &&
        !e.target.closest(".ai-chat-trigger") &&
        this.isOpen
      ) {
        // Don't auto-close - keep it open for better UX
      }
    });
  }

  /**
   * Resolve the backend API endpoint relative to the current script path.
   * This avoids broken absolute paths when the app is served from a subfolder.
   */
  resolveApiEndpoint() {
    try {
      const currentScript =
        document.currentScript ||
        document.querySelector('script[src*="ai-chat-widget.js"]');
      if (currentScript && currentScript.src) {
        const scriptUrl = new URL(currentScript.src, window.location.origin);
        const rootPath = scriptUrl.pathname.replace(/assets\/js\/[^\/]+$/, "");
        return `${rootPath}api/chat_handler.php`;
      }
    } catch (error) {
      console.warn(
        "Unable to derive API endpoint from script path, falling back to relative path.",
        error,
      );
    }

    return "api/chat_handler.php";
  }

  /**
   * Toggle chat window visibility
   */
  toggleChat() {
    this.isOpen = !this.isOpen;
    this.chatWindow.classList.toggle("open", this.isOpen);
    this.triggerBtn.classList.toggle("active", this.isOpen);

    if (this.isOpen) {
      // Focus input when opened
      setTimeout(() => this.input.focus(), 300);
    }
  }

  /**
   * Send message to AI
   */
  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isLoading) return;

    // Add user message to UI
    this.addMessageToUI("user", text);
    this.input.value = "";

    // Show typing indicator
    this.showTyping();

    // Add to chat history
    this.chatHistory.push({
      role: "user",
      parts: [{ text }],
    });

    // Get AI response
    const response = await this.fetchAIResponse();

    // Hide typing indicator
    this.hideTyping();

    // Always display the actual AI response (including error messages in Arabic)
    this.addMessageToUI("assistant", response);
    this.chatHistory.push({
      role: "model",
      parts: [{ text: response }],
    });
  }

  /**
   * Fetch response from Gemini API (via PHP backend proxy)
   */
  async fetchAIResponse() {
    try {
      this.isLoading = true;

      // Log request info for debugging
      console.log("🤖 AI Request Sent to Backend:");
      console.log("   Endpoint:", this.API_ENDPOINT);
      console.log("   Model: " + this.MODEL);
      console.log("   Chat History Length:", this.chatHistory.length);

      // Build request payload for backend proxy
      const payload = {
        systemInstruction: this.SYSTEM_PROMPT,
        contents: this.chatHistory,
        model: this.MODEL,
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.95,
        topK: 40,
      };

      console.log("📤 Request Payload:", JSON.stringify(payload, null, 2));

      // Send request to PHP backend (not directly to Google API)
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(
        "📥 Backend Response Status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const bodyText = await response.text();
        let errorData = null;

        try {
          errorData = JSON.parse(bodyText);
        } catch (parseError) {
          console.warn("⚠️ Backend response was not JSON:", bodyText);
        }

        console.error("❌ Backend Error Response:", errorData || bodyText);

        if (response.status === 401) {
          throw new Error("خطأ في المصادقة - يرجى التحقق من إعدادات الخادم");
        } else if (response.status === 429) {
          throw new Error(
            "تم تجاوز حد الاستخدام المجاني. يرجى الانتظار قليلاً أو التواصل معنا لترقية الخدمة.",
          );
        } else if (response.status === 503) {
          throw new Error("الخدمة مشغولة حالياً - يرجى المحاولة لاحقاً");
        } else if (response.status === 500) {
          throw new Error("خطأ في الخادم - يرجى المحاولة مرة أخرى لاحقاً");
        } else {
          throw new Error(
            `خطأ: ${response.status} - ${errorData?.error?.message || errorData?.message || bodyText || "Unknown error"}`,
          );
        }
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "❌ Failed to parse backend JSON response:",
          responseText,
        );
        throw new Error("استجابة غير صالحة من الخادم، يرجى المحاولة مرة أخرى");
      }

      console.log("✅ API Response Data:", data);

      const text = data?.reply || "";

      if (!text) {
        console.warn("⚠️ No reply in response, returning default message");
        return "لم أتمكن من فهم طلبك، هل يمكنك إعادة الصياغة؟";
      }

      console.log("💬 Response Text:", text);
      return text;
    } catch (error) {
      console.error("❌ Chat Error:", error.message);
      console.error("Full Error:", error);

      // Return more helpful error message
      if (error.message.includes("تجاوز حد الاستخدام المجاني")) {
        return `عذراً، تم تجاوز حد الاستخدام المجاني للذكاء الاصطناعي. يرجى الانتظار قليلاً أو التواصل معنا على +20 102 127 9663 لترقية الخدمة.`;
      } else {
        return `عذراً، حدث خطأ: ${error.message}. يرجى المحاولة مرة أخرى أو التواصل معنا على +20 102 127 9663.`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add message to UI with fade-in animation
   */
  addMessageToUI(role, text) {
    // Remove welcome message on first message
    const welcomeMsg = this.messagesContainer.querySelector(".ai-chat-welcome");
    if (welcomeMsg && this.chatHistory.length === 0) {
      welcomeMsg.remove();
    }

    // Create message element
    const messageEl = document.createElement("div");
    messageEl.className = `ai-chat-message ${role}`;
    messageEl.innerHTML = `
            <div class="ai-chat-message-bubble">
                ${this.escapeHTML(text)}
            </div>
        `;

    this.messagesContainer.appendChild(messageEl);

    // Scroll to bottom
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    this.typingIndicator.style.display = "flex";
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    this.typingIndicator.style.display = "none";
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear chat history (useful for testing)
   */
  clearHistory() {
    this.chatHistory = [];
    this.messagesContainer.innerHTML = `
            <div class="ai-chat-welcome">
                <div class="ai-chat-welcome-icon">👋</div>
                <h4>مرحباً بك في مطعم My Order</h4>
                <p>أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟</p>
            </div>
        `;
  }

  /**
   * Test API connection (for debugging)
   */
  async testAPIConnection() {
    console.log("🧪 Testing AI backend connection...");
    console.log("Endpoint:", this.API_ENDPOINT);

    try {
      const payload = {
        systemInstruction: {
          parts: [{ text: "You are a helpful assistant." }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: "Hello, are you working?" }],
          },
        ],
      };

      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response Status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Test Failed:", errorText);
        return false;
      }

      const data = await response.json();
      console.log("✅ API Test Successful!");
      console.log("Response:", data);
      return true;
    } catch (error) {
      console.error("❌ API Test Error:", error);
      return false;
    }
  }
}

// Initialize widget when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("════════════════════════════════════════════════════════════");
  console.log("🤖 My Order AI Chat Widget Initialization");
  console.log("════════════════════════════════════════════════════════════");
  console.log("✅ Widget: Loading...");
  const widget = new AIChatWidget();
  console.log("📌 Backend Endpoint: ", widget.API_ENDPOINT);

  window.AIChatWidget = widget;

  console.log("✅ Widget: Initialized Successfully");
  console.log("");
  console.log("📱 Widget Location: Bottom-right corner (25px from edges)");
  console.log("🧪 Test API: window.AIChatWidget.testAPIConnection()");
  console.log("🗑️  Clear Chat: window.AIChatWidget.clearHistory()");
  console.log("");
  console.log("💡 Chat is ready! Click the orange button to start.");
  console.log("════════════════════════════════════════════════════════════");
});
