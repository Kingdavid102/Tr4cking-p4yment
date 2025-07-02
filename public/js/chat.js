document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!token || !user.id) {
    window.location.href = "/login.html"
    return
  }

  // Initialize page
  initializePage()
  loadChatMessages()
  setupEventListeners()

  function initializePage() {
    // Update user info in header
    const userName = document.getElementById("userName")
    const userAvatar = document.getElementById("userAvatar")

    if (userName) {
      userName.textContent = `${user.firstName} ${user.lastName}`
    }

    if (userAvatar && user.avatar) {
      userAvatar.src = user.avatar
      userAvatar.onerror = () => {
        userAvatar.src = "/placeholder.svg?height=40&width=40"
      }
    }

    // Setup hamburger menu
    const hamburgerMenu = document.getElementById("hamburgerMenu")
    const sidebar = document.getElementById("sidebar")

    if (hamburgerMenu && sidebar) {
      hamburgerMenu.addEventListener("click", () => {
        hamburgerMenu.classList.toggle("active")
        sidebar.classList.toggle("active")
      })

      // Close sidebar when clicking outside
      document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !hamburgerMenu.contains(e.target)) {
          hamburgerMenu.classList.remove("active")
          sidebar.classList.remove("active")
        }
      })
    }

    // Setup logout
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault()
        logout()
      })
    }
  }

  function setupEventListeners() {
    const chatInput = document.getElementById("chatInput")
    const sendBtn = document.getElementById("sendBtn")
    const suggestionBtns = document.querySelectorAll(".suggestion-btn")

    // Chat input events
    if (chatInput) {
      chatInput.addEventListener("input", () => {
        const hasText = chatInput.value.trim().length > 0
        sendBtn.disabled = !hasText
        sendBtn.classList.toggle("active", hasText)
      })

      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          sendMessage()
        }
      })
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage)
    }

    // Suggestion buttons
    suggestionBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const message = btn.dataset.message
        if (message && chatInput) {
          chatInput.value = message
          chatInput.focus()
          sendBtn.disabled = false
          sendBtn.classList.add("active")
        }
      })
    })
  }

  async function loadChatMessages() {
    try {
      const response = await fetch("/chat/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        displayMessages(data.messages)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  function displayMessages(messages) {
    const chatMessages = document.getElementById("chatMessages")
    if (!chatMessages) return

    // Clear welcome message if there are messages
    if (messages.length > 0) {
      const welcomeMessage = chatMessages.querySelector(".welcome-message")
      if (welcomeMessage) {
        welcomeMessage.style.display = "none"
      }
    }

    // Add messages
    messages.forEach((message) => {
      addMessageToChat(message, false)
    })

    // Scroll to bottom
    scrollToBottom()
  }

  async function sendMessage() {
    const chatInput = document.getElementById("chatInput")
    const sendBtn = document.getElementById("sendBtn")

    if (!chatInput || !chatInput.value.trim()) return

    const message = chatInput.value.trim()
    chatInput.value = ""
    sendBtn.disabled = true
    sendBtn.classList.remove("active")

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      message,
      sender: "user",
      timestamp: new Date().toISOString(),
    }

    addMessageToChat(userMessage, true)

    try {
      const response = await fetch("/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      })

      if (response.ok) {
        // Show typing indicator
        showTypingIndicator()

        // Simulate admin response after a delay
        setTimeout(
          () => {
            hideTypingIndicator()
            addAutoResponse(message)
          },
          2000 + Math.random() * 2000,
        )
      } else {
        showError("Failed to send message. Please try again.")
      }
    } catch (error) {
      console.error("Chat error:", error)
      showError("Network error. Please check your connection.")
    }
  }

  function addMessageToChat(message, animate = true) {
    const chatMessages = document.getElementById("chatMessages")
    if (!chatMessages) return

    // Hide welcome message
    const welcomeMessage = chatMessages.querySelector(".welcome-message")
    if (welcomeMessage) {
      welcomeMessage.style.display = "none"
    }

    const messageElement = document.createElement("div")
    messageElement.className = `chat-message ${message.sender === "user" ? "user-message" : "admin-message"}`

    const time = formatTime(message.timestamp)

    messageElement.innerHTML = `
      <div class="message-avatar">
        ${
          message.sender === "user"
            ? `<img src="${user.avatar || "/placeholder.svg?height=32&width=32"}" alt="You">`
            : `<div class="admin-avatar"><i class="fas fa-headset"></i></div>`
        }
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${message.sender === "user" ? "You" : "CBL Support"}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${escapeHtml(message.message)}</div>
      </div>
    `

    if (animate) {
      messageElement.style.opacity = "0"
      messageElement.style.transform = "translateY(20px)"
    }

    chatMessages.appendChild(messageElement)

    if (animate) {
      requestAnimationFrame(() => {
        messageElement.style.transition = "all 0.3s ease"
        messageElement.style.opacity = "1"
        messageElement.style.transform = "translateY(0)"
      })
    }

    scrollToBottom()
  }

  function addAutoResponse(userMessage) {
    const responses = getAutoResponse(userMessage)

    responses.forEach((response, index) => {
      setTimeout(() => {
        const adminMessage = {
          id: Date.now() + index,
          message: response,
          sender: "admin",
          timestamp: new Date().toISOString(),
        }
        addMessageToChat(adminMessage, true)
      }, index * 1000)
    })
  }

  function getAutoResponse(userMessage) {
    const message = userMessage.toLowerCase()

    if (message.includes("place") && message.includes("order")) {
      return [
        "I'd be happy to help you place a new order! 📦",
        "To get started, I'll need some information:",
        "• What would you like to ship?\n• Where are you shipping from?\n• What's the destination?\n• Approximate weight and dimensions?",
        "You can also visit our order form for a detailed quote. Would you like me to guide you through the process?",
      ]
    }

    if (message.includes("track") && message.includes("order")) {
      return [
        "I can help you track your order! 🔍",
        "Please provide your tracking ID (format: XXXX-XXXX-XXXX) and I'll get you the latest updates on your shipment.",
        "You can also use our tracking page for real-time updates with map visualization.",
      ]
    }

    if (message.includes("shipping") && message.includes("rate")) {
      return [
        "Our shipping rates depend on several factors: 💰",
        "• Package weight and dimensions\n• Origin and destination\n• Shipping speed (Standard/Express)\n• Package value for insurance",
        "Standard international shipping starts at $15 for packages under 1kg. Would you like a personalized quote?",
      ]
    }

    if (message.includes("delivery") || message.includes("when")) {
      return [
        "Delivery times vary by destination: ⏰",
        "• Standard shipping: 15-30 days\n• Express shipping: 7-15 days\n• Priority shipping: 3-7 days",
        "All shipments include real-time tracking and insurance. Is there a specific destination you're asking about?",
      ]
    }

    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      return [
        `Hello ${user.firstName}! 👋 Welcome to CBL Dispatch support.`,
        "I'm here to help you with all your shipping needs. How can I assist you today?",
      ]
    }

    // Default response
    return [
      "Thank you for your message! 😊",
      "Our support team will get back to you shortly. In the meantime, you can:",
      "• Check our FAQ section\n• Track your orders\n• Browse our services",
      "Is there anything specific I can help you with right now?",
    ]
  }

  function showTypingIndicator() {
    const typingIndicator = document.getElementById("typingIndicator")
    if (typingIndicator) {
      typingIndicator.style.display = "flex"
    }
  }

  function hideTypingIndicator() {
    const typingIndicator = document.getElementById("typingIndicator")
    if (typingIndicator) {
      typingIndicator.style.display = "none"
    }
  }

  function scrollToBottom() {
    const chatMessages = document.getElementById("chatMessages")
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }

  function formatTime(timestamp) {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      return "Now"
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML.replace(/\n/g, "<br>")
  }

  function showError(message) {
    const errorMessage = {
      id: Date.now(),
      message: `❌ ${message}`,
      sender: "system",
      timestamp: new Date().toISOString(),
    }
    addMessageToChat(errorMessage, true)
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }

  // Auto-refresh messages every 30 seconds
  setInterval(loadChatMessages, 30000)

  console.log("💬 CBL Dispatch Chat Page Loaded Successfully!")
})
