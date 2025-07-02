document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (token && user.id) {
    // Redirect based on user type
    if (user.isAdmin) {
      window.location.href = "/admin.html"
    } else {
      window.location.href = "/dashboard.html"
    }
    return
  }

  // Initialize auth forms
  initializeLoginForm()
  initializeRegisterForm()

  function initializeLoginForm() {
    const loginForm = document.getElementById("loginForm")
    if (!loginForm) return

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value

      if (!email || !password) {
        showNotification("Please fill in all fields", "error")
        return
      }

      try {
        showLoading(true)

        const response = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        const result = await response.json()

        if (result.success && result.token) {
          // Store auth data
          localStorage.setItem("token", result.token)
          localStorage.setItem("user", JSON.stringify(result.user))

          showNotification(result.message || "Login successful", "success")

          // Redirect based on user type
          setTimeout(() => {
            if (result.user.isAdmin) {
              window.location.href = "/admin.html"
            } else {
              window.location.href = "/dashboard.html"
            }
          }, 1000)
        } else {
          showNotification(result.error || "Login failed", "error")
        }
      } catch (error) {
        console.error("Login error:", error)
        showNotification("Network error. Please try again.", "error")
      } finally {
        showLoading(false)
      }
    })
  }

  function initializeRegisterForm() {
    const registerForm = document.getElementById("registerForm")
    if (!registerForm) return

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const firstName = document.getElementById("firstName").value.trim()
      const lastName = document.getElementById("lastName").value.trim()
      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value
      const confirmPassword = document.getElementById("confirmPassword").value
      const country = document.getElementById("country").value

      // Validation
      if (!firstName || !lastName || !email || !password || !confirmPassword || !country) {
        showNotification("Please fill in all fields", "error")
        return
      }

      if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error")
        return
      }

      if (password.length < 6) {
        showNotification("Password must be at least 6 characters", "error")
        return
      }

      try {
        showLoading(true)

        const response = await fetch("/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            country,
          }),
        })

        const result = await response.json()

        if (result.success && result.token) {
          // Store auth data
          localStorage.setItem("token", result.token)
          localStorage.setItem("user", JSON.stringify(result.user))

          showNotification(result.message || "Registration successful", "success")

          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = "/dashboard.html"
          }, 1000)
        } else {
          showNotification(result.error || "Registration failed", "error")
        }
      } catch (error) {
        console.error("Registration error:", error)
        showNotification("Network error. Please try again.", "error")
      } finally {
        showLoading(false)
      }
    })
  }

  function showLoading(show) {
    const submitBtns = document.querySelectorAll('button[type="submit"]')
    submitBtns.forEach((btn) => {
      if (show) {
        btn.disabled = true
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...'
      } else {
        btn.disabled = false
        const isLogin = btn.closest("#loginForm")
        btn.innerHTML = isLogin
          ? '<i class="fas fa-sign-in-alt"></i> Sign In'
          : '<i class="fas fa-user-plus"></i> Create Account'
      }
    })
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
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      z-index: 10000;
      transform: translateX(100%);
      transition: all 0.3s ease;
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
        return "#10b981"
      case "error":
        return "#ef4444"
      case "warning":
        return "#f59e0b"
      default:
        return "#6366f1"
    }
  }

  console.log("🔐 CBL Dispatch Auth System Loaded Successfully!")
})
