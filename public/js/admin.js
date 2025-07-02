import { Chart } from "@/components/ui/chart"
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!token || !user.id || !user.isAdmin) {
    window.location.href = "/login.html"
    return
  }

  // Initialize admin panel
  initializeAdminPanel()
  await loadDashboardData()
  setupEventListeners()

  function initializeAdminPanel() {
    // Setup sidebar navigation
    const navLinks = document.querySelectorAll(".nav-link")
    const sections = document.querySelectorAll(".content-section")

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const sectionId = link.dataset.section
        showSection(sectionId)

        // Update active nav
        navLinks.forEach((l) => l.classList.remove("active"))
        link.classList.add("active")

        // Update page title
        const pageTitle = document.getElementById("pageTitle")
        if (pageTitle) {
          pageTitle.textContent = link.querySelector(".nav-text").textContent
        }
      })
    })

    // Setup mobile menu
    const mobileMenuBtn = document.getElementById("mobileMenuBtn")
    const sidebarToggle = document.getElementById("sidebarToggle")
    const sidebar = document.querySelector(".admin-sidebar")

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active")
      })
    }

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active")
      })
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove("active")
        }
      }
    })

    // Setup logout
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout)
    }

    // Setup global search
    const globalSearch = document.getElementById("globalSearch")
    if (globalSearch) {
      globalSearch.addEventListener("input", debounce(handleGlobalSearch, 300))
    }
  }

  function showSection(sectionId) {
    const sections = document.querySelectorAll(".content-section")
    sections.forEach((section) => {
      section.classList.remove("active")
    })

    const targetSection = document.getElementById(`${sectionId}-section`)
    if (targetSection) {
      targetSection.classList.add("active")

      // Load section-specific data
      switch (sectionId) {
        case "create-order":
          // Initialize create order form if needed
          break
      }
    }
  }

  async function loadDashboardData() {
    try {
      showLoading(true)

      // Load all dashboard data with proper error handling
      const [ordersResponse, usersResponse] = await Promise.all([
        fetch("/admin/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ])

      // Check if responses are ok
      if (!ordersResponse.ok) {
        throw new Error(`Orders API error: ${ordersResponse.status}`)
      }
      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status}`)
      }

      const ordersResult = await ordersResponse.json()
      const usersResult = await usersResponse.json()

      console.log("Orders result:", ordersResult)
      console.log("Users result:", usersResult)

      const orders = ordersResult.success ? ordersResult.orders : []
      const users = usersResult.success ? usersResult.users : []

      console.log("Processed orders:", orders.length)
      console.log("Processed users:", users.length)

      updateDashboardStats(orders, users)
      updateRecentOrders(orders.slice(0, 5))
      updateTopDestinations(orders)
      createCharts(orders)
    } catch (error) {
      console.error("Dashboard error:", error)
      showNotification("Failed to load dashboard data: " + error.message, "error")

      // Set default values if API fails
      updateDashboardStats([], [])
    } finally {
      showLoading(false)
    }
  }

  function updateDashboardStats(orders, users) {
    console.log("Updating stats with:", { ordersCount: orders.length, usersCount: users.length })

    // Calculate stats with proper error handling
    const totalRevenue = orders.reduce((sum, order) => {
      const price = Number.parseFloat(order.price) || 0
      const quantity = Number.parseInt(order.quantity) || 0
      return sum + price * quantity
    }, 0)

    const pendingOrders = orders.filter((order) => order.status && order.status.toLowerCase() === "pending").length

    console.log("Calculated stats:", {
      totalRevenue,
      totalOrders: orders.length,
      totalUsers: users.length,
      pendingOrders,
    })

    // Update stat cards with animation
    animateCounter("totalRevenue", totalRevenue, "$")
    animateCounter("totalOrders", orders.length)
    animateCounter("totalUsers", users.length)
    animateCounter("pendingOrders", pendingOrders)
  }

  function updateRecentOrders(orders) {
    const container = document.getElementById("recentOrders")
    if (!container) return

    container.innerHTML = orders
      .map(
        (order) => `
            <div class="activity-item" onclick="viewOrderDetails('${order.id}')">
                <div class="activity-icon">
                    <i class="fas fa-box"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${order.productName}</div>
                    <div class="activity-description">Order #${order.id} • ${order.destination}</div>
                </div>
                <div class="activity-time">${formatTimeAgo(order.createdAt)}</div>
            </div>
        `,
      )
      .join("")
  }

  function updateTopDestinations(orders) {
    const destinations = {}
    orders.forEach((order) => {
      destinations[order.destination] = (destinations[order.destination] || 0) + 1
    })

    const sorted = Object.entries(destinations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const container = document.getElementById("topDestinations")
    if (!container) return

    container.innerHTML = sorted
      .map(
        ([destination, count], index) => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${destination}</div>
                    <div class="activity-description">${count} orders</div>
                </div>
                <div class="activity-time">#${index + 1}</div>
            </div>
        `,
      )
      .join("")
  }

  function createCharts(orders) {
    createRevenueChart(orders)
    createStatusChart(orders)
  }

  function createRevenueChart(orders) {
    const ctx = document.getElementById("revenueChart")
    if (!ctx || !window.Chart) return

    // Group orders by date
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().split("T")[0])
    }

    const revenueData = last7Days.map((date) => {
      return orders
        .filter((order) => order.createdAt.startsWith(date))
        .reduce((sum, order) => sum + order.price * order.quantity, 0)
    })

    new Chart(ctx, {
      type: "line",
      data: {
        labels: last7Days.map((date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
        datasets: [
          {
            label: "Revenue",
            data: revenueData,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => "$" + value.toLocaleString(),
            },
          },
        },
      },
    })
  }

  function createStatusChart(orders) {
    const ctx = document.getElementById("statusChart")
    if (!ctx || !window.Chart) return

    const statusCounts = {}
    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    })
  }

  function setupEventListeners() {
    // Create order form
    setupCreateOrderForm()
  }

  function setupCreateOrderForm() {
    const form = document.getElementById("createOrderForm")
    const steps = document.querySelectorAll(".form-step")
    const stepIndicators = document.querySelectorAll(".step")
    const nextBtn = document.getElementById("nextStep")
    const prevBtn = document.getElementById("prevStep")
    const submitBtn = document.getElementById("submitOrder")

    let currentStep = 0

    // Status change handler
    const statusSelect = document.getElementById("status")
    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        const status = e.target.value
        const reasonGroup = document.getElementById("reasonGroup")
        const shippingDetails = document.getElementById("shippingDetails")

        if (status === "Hold" || status === "Pending") {
          reasonGroup.style.display = "block"
        } else {
          reasonGroup.style.display = "none"
        }

        if (status === "Shipped" || status === "Delivered") {
          shippingDetails.style.display = "block"
        } else {
          shippingDetails.style.display = "none"
        }
      })
    }

    // File upload handler
    const fileInput = document.getElementById("productImage")
    const fileUploadArea = document.getElementById("fileUploadArea")
    const imagePreview = document.getElementById("imagePreview")

    if (fileInput && fileUploadArea) {
      fileUploadArea.addEventListener("click", () => fileInput.click())

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`
            imagePreview.classList.add("show")
          }
          reader.readAsDataURL(file)
        }
      })
    }

    // Step navigation
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (validateStep(currentStep)) {
          currentStep++
          updateStep()
        }
      })
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        currentStep--
        updateStep()
      })
    }

    function updateStep() {
      // Update step indicators
      stepIndicators.forEach((step, index) => {
        step.classList.toggle("active", index <= currentStep)
      })

      // Update form steps
      steps.forEach((step, index) => {
        step.classList.toggle("active", index === currentStep)
      })

      // Update buttons
      prevBtn.style.display = currentStep > 0 ? "block" : "none"
      nextBtn.style.display = currentStep < steps.length - 1 ? "block" : "none"
      submitBtn.style.display = currentStep === steps.length - 1 ? "block" : "none"

      // Update summary on last step
      if (currentStep === steps.length - 1) {
        updateOrderSummary()
      }
    }

    function validateStep(step) {
      const currentStepElement = steps[step]
      const requiredFields = currentStepElement.querySelectorAll("[required]")

      for (const field of requiredFields) {
        if (!field.value.trim()) {
          field.focus()
          showNotification(`Please fill in ${field.previousElementSibling.textContent}`, "error")
          return false
        }
      }
      return true
    }

    function updateOrderSummary() {
      const productName = document.getElementById("productName").value
      const quantity = document.getElementById("quantity").value
      const price = document.getElementById("price").value
      const destination = document.getElementById("destination").value

      document.getElementById("summaryProduct").textContent = productName || "-"
      document.getElementById("summaryQuantity").textContent = quantity || "-"
      document.getElementById("summaryPrice").textContent = price ? `$${price}` : "-"
      document.getElementById("summaryDestination").textContent = destination || "-"
      document.getElementById("summaryTotal").textContent =
        price && quantity ? `$${(Number.parseFloat(price) * Number.parseInt(quantity)).toFixed(2)}` : "$0.00"
    }

    // Form submission
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault()

        try {
          showLoading(true)

          const formData = new FormData(form)

          const response = await fetch("/admin/create-order", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          })

          const result = await response.json()

          if (result.success) {
            showNotification(`Order created successfully! Tracking ID: ${result.trackingId}`, "success")
            form.reset()
            currentStep = 0
            updateStep()

            // Refresh dashboard data
            await loadDashboardData()
          } else {
            showNotification(result.error || "Failed to create order", "error")
          }
        } catch (error) {
          console.error("Create order error:", error)
          showNotification("Failed to create order", "error")
        } finally {
          showLoading(false)
        }
      })
    }
  }

  // Global functions
  window.showSection = showSection

  window.viewOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`/track/${orderId}`)
      const result = await response.json()

      if (result.success && result.order) {
        const order = result.order
        showNotification(`Order #${order.id} - ${order.productName} - Status: ${order.status}`, "info")
      } else {
        showNotification("Failed to load order details", "error")
      }
    } catch (error) {
      console.error("View order error:", error)
      showNotification("Failed to load order details", "error")
    }
  }

  // Utility functions
  function showLoading(show) {
    const overlay = document.getElementById("loadingOverlay")
    if (overlay) {
      overlay.classList.toggle("active", show)
    }
  }

  function showNotification(message, type = "info") {
    // Remove existing notifications
    document.querySelectorAll(".notification").forEach((n) => n.remove())

    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `

    notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 400px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)"
    }, 100)

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
        return "#10b981"
      case "error":
        return "#ef4444"
      case "warning":
        return "#f59e0b"
      default:
        return "#6366f1"
    }
  }

  function formatTimeAgo(dateString) {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  function animateCounter(elementId, targetValue, prefix = "") {
    const element = document.getElementById(elementId)
    if (!element) return

    let currentValue = 0
    const increment = targetValue / 50
    const timer = setInterval(() => {
      currentValue += increment
      if (currentValue >= targetValue) {
        currentValue = targetValue
        clearInterval(timer)
      }
      element.textContent = prefix + Math.floor(currentValue).toLocaleString()
    }, 20)
  }

  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  function handleGlobalSearch(e) {
    const searchTerm = e.target.value.toLowerCase()
    console.log("Global search:", searchTerm)
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }

  console.log("🔧 CBL Dispatch Admin Panel Loaded Successfully!")
})

// Global logout function
window.logout = () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }
}
