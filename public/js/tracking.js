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

  // Get tracking ID from URL
  const urlParams = new URLSearchParams(window.location.search)
  const trackingId = urlParams.get("id")

  if (trackingId) {
    document.getElementById("trackingSearchInput").value = trackingId
    await loadOrderDetails(trackingId)
  }

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

    // Setup tracking form
    const trackingForm = document.getElementById("trackingSearchForm")
    if (trackingForm) {
      trackingForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const trackingInput = document.getElementById("trackingSearchInput")
        const trackingId = trackingInput.value.trim()

        if (trackingId) {
          await loadOrderDetails(trackingId)
        }
      })
    }

    // Load unread message count
    loadUnreadCount()
  }

  async function loadOrderDetails(id) {
    try {
      // Update status indicator
      updateStatusIndicator("Searching...", "searching")

      const response = await fetch(`/track/${encodeURIComponent(id)}`)
      const result = await response.json()

      if (result.success && result.order) {
        displayOrderDetails(result.order)
      } else {
        if (response.status === 404) {
          showError("Order not found. Please check your tracking ID and try again.")
        } else {
          showError(result.error || "Failed to load order details. Please try again later.")
        }
      }
    } catch (error) {
      console.error("Tracking error:", error)
      showError("Network error. Please check your connection and try again.")
    }
  }

  function displayOrderDetails(order) {
    // Update page title
    document.title = `Track Order ${order.id} - CBL Dispatch`

    // Update status indicator
    updateStatusIndicator(order.status, order.status.toLowerCase())

    // Update order header
    const orderTitle = document.querySelector(".order-title")
    const orderDate = document.querySelector(".order-date")
    const statusBadge = document.querySelector(".status-badge")

    if (orderTitle) {
      orderTitle.textContent = `Order #${order.id}`
    }

    if (orderDate) {
      orderDate.textContent = `Placed on ${formatDate(order.createdAt)}`
    }

    if (statusBadge) {
      statusBadge.className = `status-badge status-${order.status.toLowerCase()}`
      statusBadge.innerHTML = `
        <i class="fas ${getStatusIcon(order.status)}"></i>
        <span>${order.status}</span>
      `
    }

    // Show reason for hold/pending orders
    if ((order.status === "Hold" || order.status === "Pending") && order.reason) {
      const reasonContainer = document.getElementById("reasonContainer")
      const statusReason = document.getElementById("statusReason")

      if (reasonContainer && statusReason) {
        reasonContainer.style.display = "block"
        statusReason.textContent = order.reason
      }
    }

    // Update order details
    updateElement("productName", order.productName)
    updateElement("trackingId", order.id)
    updateElement("price", `$${order.price.toFixed(2)}`)
    updateElement("quantity", order.quantity.toString())
    updateElement("destination", order.destination)

    // Update product image
    const productImage = document.getElementById("productImage")
    if (productImage && order.image) {
      productImage.src = order.image
      productImage.alt = order.productName
      productImage.onerror = () => {
        productImage.src = "/placeholder.svg?height=350&width=400"
      }
    }

    // Show shipping details if available
    if (order.timeShipped) {
      showElement("timeShippedContainer")
      updateElement("timeShipped", order.timeShipped)
    }

    if (order.dateShipped) {
      showElement("dateShippedContainer")
      updateElement("dateShipped", formatDate(order.dateShipped))
    }

    if (order.expectedArrival) {
      showElement("expectedArrivalContainer")
      updateElement("expectedArrival", formatDate(order.expectedArrival))
    }

    // Update progress bar
    updateProgressBar(order.status)

    // Update destination label
    updateElement("destinationLabel", order.destination)
  }

  function updateStatusIndicator(status, className) {
    const indicator = document.getElementById("trackingStatusIndicator")
    if (indicator) {
      indicator.className = `tracking-status-indicator ${className}`
      indicator.innerHTML = `
        <div class="status-dot"></div>
        <span>${status}</span>
      `
    }
  }

  function updateElement(id, value) {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = value
    }
  }

  function showElement(id) {
    const element = document.getElementById(id)
    if (element) {
      element.style.display = "block"
    }
  }

  function updateProgressBar(status) {
    const progressFill = document.getElementById("progressFill")
    const mapPin = document.getElementById("mapPin")

    let progress = 0
    let pinPosition = 0

    switch (status.toLowerCase()) {
      case "pending":
        progress = 25
        pinPosition = 10
        break
      case "processing":
        progress = 50
        pinPosition = 30
        break
      case "shipped":
        progress = 75
        pinPosition = 60
        break
      case "delivered":
        progress = 100
        pinPosition = 90
        break
      case "hold":
        progress = 25
        pinPosition = 15
        break
      default:
        progress = 25
        pinPosition = 10
    }

    if (progressFill) {
      progressFill.style.width = `${progress}%`
    }

    if (mapPin) {
      mapPin.style.left = `${pinPosition}%`
    }
  }

  function getStatusIcon(status) {
    const icons = {
      Pending: "fa-clock",
      Processing: "fa-cog fa-spin",
      Shipped: "fa-shipping-fast",
      Delivered: "fa-check-circle",
      Hold: "fa-pause-circle",
    }
    return icons[status] || "fa-question-circle"
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  function showError(message) {
    updateStatusIndicator("Error", "error")

    const orderTitle = document.querySelector(".order-title")
    const orderDate = document.querySelector(".order-date")
    const statusBadge = document.querySelector(".status-badge")

    if (orderTitle) {
      orderTitle.textContent = "Order Not Found"
    }

    if (orderDate) {
      orderDate.textContent = message
    }

    if (statusBadge) {
      statusBadge.className = "status-badge status-error"
      statusBadge.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>Error</span>
      `
    }

    // Hide other sections
    const orderDetails = document.querySelector(".order-details")
    const trackingProgress = document.querySelector(".tracking-progress")

    if (orderDetails) orderDetails.style.display = "none"
    if (trackingProgress) trackingProgress.style.display = "none"
  }

  async function loadUnreadCount() {
    try {
      const response = await fetch("/user/chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.chats) {
          const unreadCount = result.chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0)

          const chatBadge = document.getElementById("chatBadge")
          const notificationBadge = document.getElementById("notificationBadge")

          if (unreadCount > 0) {
            if (chatBadge) {
              chatBadge.textContent = unreadCount
              chatBadge.style.display = "inline"
            }
            if (notificationBadge) {
              notificationBadge.textContent = unreadCount
              notificationBadge.style.display = "inline"
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load unread count:", error)
    }
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }

  console.log("🔍 CBL Dispatch Tracking Page Loaded Successfully!")
})
