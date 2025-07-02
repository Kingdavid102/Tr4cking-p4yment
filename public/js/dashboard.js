document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!token || !user.id) {
    window.location.href = "/login.html"
    return
  }

  // Initialize dashboard
  initializePage()
  await loadDashboardData()
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

    // Load location and weather
    loadLocationAndWeather()

    // Load unread message count
    loadUnreadCount()
  }

  async function loadDashboardData() {
    try {
      // Load user's orders
      const response = await fetch("/user/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.orders) {
          displayOrders(result.orders)
        } else {
          console.error("Failed to load orders:", result.error)
          displayOrders([])
        }
      } else {
        console.error("Failed to fetch orders")
        displayOrders([])
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
      displayOrders([])
    }
  }

  function displayOrders(orders) {
    const productsGrid = document.querySelector(".products-grid")
    if (!productsGrid) return

    if (orders.length === 0) {
      productsGrid.innerHTML = `
        <div class="no-orders">
          <div class="no-orders-icon">
            <i class="fas fa-box-open"></i>
          </div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet. Start shipping with us today!</p>
          <a href="/place-order.html" class="get-started-btn">
            <i class="fas fa-rocket"></i>
            Get Started
          </a>
        </div>
      `
      return
    }

    productsGrid.innerHTML = orders
      .map(
        (order) => `
        <div class="order-card" onclick="viewOrder('${order.id}')">
          <div class="order-image">
            <img src="${order.image || "/placeholder.svg?height=200&width=300"}" alt="${order.productName}" />
            <div class="order-status-badge status-${order.status.toLowerCase()}">
              <i class="fas ${getStatusIcon(order.status)}"></i>
              ${order.status}
            </div>
          </div>
          <div class="order-content">
            <h3 class="order-title">${order.productName}</h3>
            <div class="order-details">
              <div class="order-detail">
                <span class="detail-label">Tracking ID:</span>
                <span class="detail-value">${order.id}</span>
              </div>
              <div class="order-detail">
                <span class="detail-label">Destination:</span>
                <span class="detail-value">${order.destination}</span>
              </div>
              <div class="order-detail">
                <span class="detail-label">Price:</span>
                <span class="detail-value">$${order.price.toFixed(2)}</span>
              </div>
              <div class="order-detail">
                <span class="detail-label">Quantity:</span>
                <span class="detail-value">${order.quantity}</span>
              </div>
            </div>
            <div class="order-actions">
              <button class="track-btn" onclick="event.stopPropagation(); window.trackOrder('${order.id}')">
                <i class="fas fa-search"></i>
                Track
              </button>
              <button class="details-btn" onclick="event.stopPropagation(); viewOrder('${order.id}')">
                <i class="fas fa-eye"></i>
                Details
              </button>
            </div>
          </div>
        </div>
      `,
      )
      .join("")

    // Add CSS for order cards
    addOrderCardStyles()
  }

  function addOrderCardStyles() {
    const style = document.createElement("style")
    style.textContent = `
      .no-orders {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: var(--radius-2xl);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--gray-100);
      }

      .no-orders-icon {
        width: 80px;
        height: 80px;
        background: var(--primary-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        color: var(--primary);
        font-size: 2rem;
      }

      .no-orders h3 {
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--gray-900);
        margin-bottom: 0.5rem;
      }

      .no-orders p {
        color: var(--gray-600);
        margin-bottom: 2rem;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }

      .get-started-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--gradient-primary);
        color: white;
        text-decoration: none;
        padding: 1rem 2rem;
        border-radius: var(--radius-xl);
        font-weight: 600;
        transition: var(--transition);
        box-shadow: var(--shadow-lg);
      }

      .get-started-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-xl);
      }

      .order-card {
        background: white;
        border-radius: var(--radius-2xl);
        overflow: hidden;
        box-shadow: var(--shadow-md);
        border: 1px solid var(--gray-100);
        transition: var(--transition);
        cursor: pointer;
      }

      .order-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }

      .order-image {
        position: relative;
        height: 200px;
        overflow: hidden;
      }

      .order-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: var(--transition);
      }

      .order-card:hover .order-image img {
        transform: scale(1.05);
      }

      .order-status-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-xl);
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: white;
        backdrop-filter: blur(10px);
      }

      .status-pending {
        background: var(--warning);
      }

      .status-shipped {
        background: var(--info);
      }

      .status-delivered {
        background: var(--success);
      }

      .status-hold {
        background: var(--danger);
      }

      .order-content {
        padding: 1.5rem;
      }

      .order-title {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--gray-900);
        margin-bottom: 1rem;
        line-height: 1.3;
      }

      .order-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .order-detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .detail-label {
        font-size: var(--font-size-sm);
        color: var(--gray-600);
        font-weight: 500;
      }

      .detail-value {
        font-size: var(--font-size-sm);
        color: var(--gray-900);
        font-weight: 600;
      }

      .order-actions {
        display: flex;
        gap: 0.75rem;
      }

      .track-btn,
      .details-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border: none;
        border-radius: var(--radius-lg);
        font-weight: 500;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .track-btn {
        background: var(--primary);
        color: white;
      }

      .track-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
      }

      .details-btn {
        background: var(--gray-100);
        color: var(--gray-700);
      }

      .details-btn:hover {
        background: var(--gray-200);
        transform: translateY(-1px);
      }
    `
    document.head.appendChild(style)
  }

  function setupEventListeners() {
    // Tracking form
    const trackingForm = document.querySelector(".modern-tracking-form")
    if (trackingForm) {
      trackingForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const input = trackingForm.querySelector("input")
        const trackingId = input.value.trim()

        if (trackingId) {
          window.trackOrder(trackingId)
        }
      })
    }

    // Quick action buttons
    const quickActionBtns = document.querySelectorAll(".quick-action-btn")
    quickActionBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.querySelector("span").textContent.trim()

        switch (action) {
          case "New Order":
            // Redirect to place order page
            window.location.href = "/place-order.html"
            break
          case "Track Package":
            // Focus on tracking input
            const trackingInput = document.querySelector(".modern-tracking-form input")
            if (trackingInput) {
              trackingInput.focus()
            }
            break
          case "Profile":
            window.location.href = "/profile.html"
            break
        }
      })
    })

    // Place order button
    const placeOrderBtn = document.querySelector(".place-order-btn")
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", () => {
        window.location.href = "/place-order.html"
      })
    }
  }

  async function loadLocationAndWeather() {
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords

            // Update location display
            const locationDetails = document.querySelector(".location-details p")
            if (locationDetails) {
              locationDetails.innerHTML = `<i class="fas fa-map-marker-alt"></i> Location detected`
            }

            // Fetch weather data
            try {
              const weatherResponse = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
              if (weatherResponse.ok) {
                const weather = await weatherResponse.json()
                updateWeatherDisplay(weather)
              }
            } catch (error) {
              console.error("Weather fetch error:", error)
            }
          },
          (error) => {
            console.error("Geolocation error:", error)
            const locationDetails = document.querySelector(".location-details p")
            if (locationDetails) {
              locationDetails.innerHTML = `<i class="fas fa-map-marker-alt"></i> Location unavailable`
            }
          },
        )
      }
    } catch (error) {
      console.error("Location error:", error)
    }
  }

  function updateWeatherDisplay(weather) {
    const temperature = document.querySelector(".temperature")
    const weatherDesc = document.querySelector(".weather-desc")
    const weatherIcon = document.querySelector(".weather-icon i")

    if (temperature) {
      temperature.textContent = `${Math.round(weather.temperature)}°`
    }

    if (weatherDesc) {
      weatherDesc.textContent = weather.condition
    }

    if (weatherIcon) {
      weatherIcon.className = `fas ${getWeatherIcon(weather.condition)}`
    }
  }

  function getWeatherIcon(condition) {
    const icons = {
      clear: "fa-sun",
      clouds: "fa-cloud",
      rain: "fa-cloud-rain",
      snow: "fa-snowflake",
      thunderstorm: "fa-bolt",
      mist: "fa-smog",
    }
    return icons[condition] || "fa-sun"
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

          const notificationBadge = document.getElementById("notificationBadge")

          if (unreadCount > 0) {
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

  function showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification")
    existingNotifications.forEach((n) => n.remove())

    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `

    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      background: ${getNotificationColor(type)};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      z-index: 10000;
      transform: translateX(100%);
      transition: var(--transition);
      max-width: 400px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 100)

    // Close button
    const closeBtn = notification.querySelector(".notification-close")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        notification.style.transform = "translateX(100%)"
        setTimeout(() => notification.remove(), 300)
      })
    }

    // Auto remove
    setTimeout(() => {
      notification.style.transform = "translateX(100%)"
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }

  function getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "fa-check-circle"
      case "error":
        return "fa-exclamation-circle"
      case "warning":
        return "fa-exclamation-triangle"
      default:
        return "fa-info-circle"
    }
  }

  function getNotificationColor(type) {
    switch (type) {
      case "success":
        return "var(--success)"
      case "error":
        return "var(--danger)"
      case "warning":
        return "var(--warning)"
      default:
        return "var(--info)"
    }
  }

  // Global functions
  window.viewOrder = (orderId) => {
    window.location.href = `/track.html?id=${orderId}`
  }

  window.trackOrder = (trackingId) => {
    window.location.href = `/track.html?id=${trackingId}`
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }

  console.log("📊 CBL Dispatch Dashboard Loaded Successfully!")
})
