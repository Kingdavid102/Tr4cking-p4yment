document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if (!token || !user.id) {
    window.location.href = "/login.html"
    return
  }

  // Initialize page
  initializePage()

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

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login.html"
  }

  console.log("📦 Order Product Page Loaded Successfully!")
})
