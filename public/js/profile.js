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
  loadUserData()
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

    // Load unread message count
    loadUnreadCount()
  }

  function loadUserData() {
    // Populate form with user data
    const firstName = document.getElementById("firstName")
    const lastName = document.getElementById("lastName")
    const email = document.getElementById("email")
    const country = document.getElementById("country")
    const profileAvatar = document.getElementById("profileAvatar")
    const profileName = document.getElementById("profileName")
    const profileEmail = document.getElementById("profileEmail")
    const memberSince = document.getElementById("memberSince")

    if (firstName) firstName.value = user.firstName || ""
    if (lastName) lastName.value = user.lastName || ""
    if (email) email.value = user.email || ""
    if (country) country.value = user.country || ""

    if (profileName) profileName.textContent = `${user.firstName} ${user.lastName}`
    if (profileEmail) profileEmail.textContent = user.email

    if (profileAvatar) {
      if (user.avatar) {
        profileAvatar.src = user.avatar
      }
      profileAvatar.onerror = () => {
        profileAvatar.src = "/placeholder.svg?height=100&width=100"
      }
    }

    if (memberSince && user.createdAt) {
      const year = new Date(user.createdAt).getFullYear()
      memberSince.textContent = year
    }
  }

  function setupEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab

        // Remove active class from all tabs and contents
        tabBtns.forEach((b) => b.classList.remove("active"))
        tabContents.forEach((c) => c.classList.remove("active"))

        // Add active class to clicked tab and corresponding content
        btn.classList.add("active")
        document.getElementById(`${tabId}-tab`).classList.add("active")
      })
    })

    // Avatar upload
    const uploadAvatarBtn = document.getElementById("uploadAvatarBtn")
    const avatarInput = document.getElementById("avatarInput")
    const removeAvatarBtn = document.getElementById("removeAvatarBtn")

    if (uploadAvatarBtn && avatarInput) {
      uploadAvatarBtn.addEventListener("click", () => {
        avatarInput.click()
      })

      avatarInput.addEventListener("change", handleAvatarUpload)
    }

    if (removeAvatarBtn) {
      removeAvatarBtn.addEventListener("click", removeAvatar)
    }

    // Profile form
    const profileForm = document.getElementById("profileForm")
    const cancelBtn = document.getElementById("cancelBtn")

    if (profileForm) {
      profileForm.addEventListener("submit", handleProfileUpdate)
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        loadUserData() // Reset form
      })
    }

    // Toggle switches
    const toggleSwitches = document.querySelectorAll(".toggle-switch input")
    toggleSwitches.forEach((toggle) => {
      toggle.addEventListener("change", handleToggleChange)
    })
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification("Please select a valid image file", "error")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size must be less than 5MB", "error")
      return
    }

    const formData = new FormData()
    formData.append("avatar", file)

    showLoading(true)

    try {
      const response = await fetch("/profile/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Update avatar in UI
        const profileAvatar = document.getElementById("profileAvatar")
        const userAvatar = document.getElementById("userAvatar")
        const removeBtn = document.getElementById("removeAvatarBtn")

        if (profileAvatar) {
          profileAvatar.src = data.avatar
        }

        if (userAvatar) {
          userAvatar.src = data.avatar
        }

        if (removeBtn) {
          removeBtn.style.display = "inline-block"
        }

        // Update user data in localStorage
        user.avatar = data.avatar
        localStorage.setItem("user", JSON.stringify(user))

        showNotification("Profile picture updated successfully!", "success")
      } else {
        showNotification(data.message || "Failed to upload avatar", "error")
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      showNotification("Network error. Please try again.", "error")
    } finally {
      showLoading(false)
    }
  }

  async function removeAvatar() {
    // For now, just reset to default avatar
    const profileAvatar = document.getElementById("profileAvatar")
    const userAvatar = document.getElementById("userAvatar")
    const removeBtn = document.getElementById("removeAvatarBtn")

    if (profileAvatar) {
      profileAvatar.src = "/placeholder.svg?height=120&width=120"
    }

    if (userAvatar) {
      userAvatar.src = "/placeholder.svg?height=40&width=40"
    }

    if (removeBtn) {
      removeBtn.style.display = "none"
    }

    // Update user data
    user.avatar = null
    localStorage.setItem("user", JSON.stringify(user))

    showNotification("Profile picture removed", "success")
  }

  async function handleProfileUpdate(event) {
    event.preventDefault()

    const formData = new FormData(event.target)
    const profileData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      country: formData.get("country"),
    }

    // Validate required fields
    if (!profileData.firstName || !profileData.lastName || !profileData.email || !profileData.country) {
      showNotification("Please fill in all required fields", "error")
      return
    }

    showLoading(true)

    try {
      const response = await fetch("/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (data.success) {
        // Update user data in localStorage
        const updatedUser = { ...user, ...data.user }
        localStorage.setItem("user", JSON.stringify(updatedUser))

        // Update header and profile display
        const userName = document.getElementById("userName")
        const profileName = document.getElementById("profileName")
        const profileEmail = document.getElementById("profileEmail")

        if (userName) {
          userName.textContent = `${updatedUser.firstName} ${updatedUser.lastName}`
        }
        if (profileName) {
          profileName.textContent = `${updatedUser.firstName} ${updatedUser.lastName}`
        }
        if (profileEmail) {
          profileEmail.textContent = updatedUser.email
        }

        showNotification("Profile updated successfully!", "success")
      } else {
        showNotification(data.message || "Failed to update profile", "error")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      showNotification("Network error. Please try again.", "error")
    } finally {
      showLoading(false)
    }
  }

  function handleToggleChange(event) {
    const toggle = event.target
    const setting = toggle.closest(".security-option, .preference-option, .notification-option")
    const settingName = setting.querySelector("h4").textContent

    console.log(`${settingName} ${toggle.checked ? "enabled" : "disabled"}`)

    // Here you would typically save the setting to the server
    showNotification(`${settingName} ${toggle.checked ? "enabled" : "disabled"}`, "info")
  }

  async function loadUnreadCount() {
    try {
      const response = await fetch("/chat/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const chatBadge = document.getElementById("chatBadge")
        const notificationBadge = document.getElementById("notificationBadge")

        if (data.unreadCount > 0) {
          if (chatBadge) {
            chatBadge.textContent = data.unreadCount
            chatBadge.style.display = "inline"
          }
          if (notificationBadge) {
            notificationBadge.textContent = data.unreadCount
            notificationBadge.style.display = "inline"
          }
        }
      }
    } catch (error) {
      console.error("Failed to load unread count:", error)
    }
  }

  function showLoading(show) {
    const loadingOverlay = document.getElementById("loadingOverlay")
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? "flex" : "none"
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

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }

  console.log("👤 CBL Dispatch Profile Page Loaded Successfully!")
})
