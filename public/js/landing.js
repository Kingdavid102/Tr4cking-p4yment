document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu functionality
  const mobileMenuBtn = document.getElementById("mobileMenuBtn")
  const mobileMenu = document.getElementById("mobileMenu")
  const nav = document.querySelector(".landing-nav")

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenuBtn.classList.toggle("active")
      mobileMenu.classList.toggle("active")
    })

    // Close mobile menu when clicking on links
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-link")
    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenuBtn.classList.remove("active")
        mobileMenu.classList.remove("active")
      })
    })

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove("active")
        mobileMenu.classList.remove("active")
      }
    })
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Navbar scroll effect
  if (nav) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        nav.classList.add("scrolled")
      } else {
        nav.classList.remove("scrolled")
      }
    })
  }

  // Typewriter effect for hero title - FIXED
  const heroTitle = document.querySelector(".hero-title")
  if (heroTitle) {
    const originalText = "Ship Anything, Anywhere"
    const words = originalText.split(" ")

    heroTitle.innerHTML = ""

    let wordIndex = 0
    let charIndex = 0
    const isDeleting = false

    function typeWriter() {
      const currentWord = words[wordIndex]

      if (wordIndex === 0) {
        // First word: "Ship"
        if (charIndex < currentWord.length) {
          heroTitle.innerHTML += currentWord.charAt(charIndex)
          charIndex++
          setTimeout(typeWriter, 100)
        } else {
          heroTitle.innerHTML += " "
          wordIndex++
          charIndex = 0
          setTimeout(typeWriter, 200)
        }
      } else if (wordIndex === 1) {
        // Second word with gradient: "Anything"
        if (charIndex === 0) {
          heroTitle.innerHTML += '<span class="gradient-text">'
        }

        if (charIndex < currentWord.length) {
          const gradientSpan = heroTitle.querySelector(".gradient-text")
          if (gradientSpan) {
            gradientSpan.innerHTML += currentWord.charAt(charIndex)
          }
          charIndex++
          setTimeout(typeWriter, 100)
        } else {
          heroTitle.innerHTML += "</span>,<br/>"
          wordIndex++
          charIndex = 0
          setTimeout(typeWriter, 200)
        }
      } else if (wordIndex === 2) {
        // Third word with gradient: "Anywhere"
        if (charIndex === 0) {
          heroTitle.innerHTML += '<span class="gradient-text animate-float">'
        }

        if (charIndex < currentWord.length) {
          const gradientSpan = heroTitle.querySelectorAll(".gradient-text")[1]
          if (gradientSpan) {
            gradientSpan.innerHTML += currentWord.charAt(charIndex)
          }
          charIndex++
          setTimeout(typeWriter, 100)
        } else {
          heroTitle.innerHTML += "</span>"
          // Typing complete
        }
      }
    }

    // Start typing effect after a short delay
    setTimeout(typeWriter, 1000)
  }

  // Animate floating cards
  const floatingCards = document.querySelectorAll(".floating-card")
  floatingCards.forEach((card, index) => {
    // Add random floating animation delays
    const delay = Math.random() * 2
    card.style.animationDelay = `${delay}s`

    // Add hover effects
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-10px) scale(1.05)"
      card.style.boxShadow = "0 20px 40px rgba(0,0,0,0.15)"
    })

    card.addEventListener("mouseleave", () => {
      card.style.transform = ""
      card.style.boxShadow = ""
    })
  })

  // Animate stats on scroll
  const statNumbers = document.querySelectorAll(".stat-number")
  let hasAnimated = false

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true
        animateStats()
      }
    })
  })

  if (statNumbers.length > 0) {
    statsObserver.observe(statNumbers[0].closest(".hero-stats"))
  }

  function animateStats() {
    const stats = [
      { element: statNumbers[0], target: 50, suffix: "K+" },
      { element: statNumbers[1], target: 200, suffix: "+" },
      { element: statNumbers[2], target: 99.9, suffix: "%" },
      { element: statNumbers[3], target: 24, suffix: "/7" },
    ]

    stats.forEach(({ element, target, suffix }) => {
      if (!element) return

      let current = 0
      const increment = target / 50
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }

        if (suffix === "%") {
          element.textContent = current.toFixed(1) + suffix
        } else if (suffix === "/7") {
          element.textContent = Math.floor(current) + suffix
        } else {
          element.textContent = Math.floor(current) + suffix
        }
      }, 40)
    })
  }

  // Video autoplay setup
  const heroVideo = document.querySelector(".hero-video video")
  if (heroVideo) {
    heroVideo.muted = true
    heroVideo.autoplay = true
    heroVideo.loop = true
    heroVideo.playsInline = true

    // Ensure video plays
    heroVideo.play().catch((e) => {
      console.log("Video autoplay failed:", e)
    })
  }

  // Add loading states to buttons
  const buttons = document.querySelectorAll(".hero-btn, .nav-btn, .cta-btn, .cta-button")
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Don't prevent default for actual navigation
      if (btn.href && !btn.href.includes("#")) {
        btn.style.opacity = "0.7"
        btn.style.pointerEvents = "none"

        // Re-enable after a short delay in case navigation fails
        setTimeout(() => {
          btn.style.opacity = "1"
          btn.style.pointerEvents = "auto"
        }, 3000)
      }
    })
  })

  // Add hover effects to service cards
  const serviceCards = document.querySelectorAll(".service-card")
  serviceCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-15px) scale(1.02)"
    })

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0) scale(1)"
    })
  })

  // Add ripple effect to buttons
  const rippleButtons = document.querySelectorAll(".hero-btn, .cta-btn, .cta-button")
  rippleButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const ripple = document.createElement("span")
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `

      btn.style.position = "relative"
      btn.style.overflow = "hidden"
      btn.appendChild(ripple)

      setTimeout(() => {
        ripple.remove()
      }, 600)
    })
  })

  // Add CSS for ripple effect
  const rippleStyle = document.createElement("style")
  rippleStyle.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(rippleStyle)

  // Add loading animation
  window.addEventListener("load", () => {
    document.body.classList.add("loaded")

    // Add CSS for loading animation
    const style = document.createElement("style")
    style.textContent = `
      body:not(.loaded) .hero-content {
        opacity: 0;
        transform: translateY(50px);
      }

      body.loaded .hero-content {
        opacity: 1;
        transform: translateY(0);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }

      body:not(.loaded) .floating-card {
        opacity: 0;
        transform: translateY(100px);
      }

      body.loaded .floating-card {
        opacity: 1;
        transform: translateY(0);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }

      body.loaded .floating-card.card-1 {
        transition-delay: 0.2s;
      }

      body.loaded .floating-card.card-2 {
        transition-delay: 0.4s;
      }

      body.loaded .floating-card.card-3 {
        transition-delay: 0.6s;
      }
    `
    document.head.appendChild(style)
  })

  // Add interactive elements
  const heroButtons = document.querySelectorAll(".hero-btn")
  heroButtons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "translateY(-3px) scale(1.02)"
    })

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = ""
    })
  })

  console.log("🚀 CBL Dispatch Landing Page Loaded Successfully!")
})
