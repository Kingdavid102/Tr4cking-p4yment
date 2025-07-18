const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 10000
const JWT_SECRET = "your-secret-key-change-in-production"

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("public"))
app.use("/uploads", express.static("uploads"))

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/uploads"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// Data files
const USERS_FILE = path.join(__dirname, "data", "users.json")
const ORDERS_FILE = path.join(__dirname, "data", "orders.json")
const CHATS_FILE = path.join(__dirname, "data", "chats.json")

// Ensure data directory exists
const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Initialize data files
function initializeDataFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]))
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]))
  }
  if (!fs.existsSync(CHATS_FILE)) {
    fs.writeFileSync(CHATS_FILE, JSON.stringify([]))
  }
}

initializeDataFiles()

// Helper functions
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error)
    return false
  }
}

function generateTrackingId() {
  return "CBL" + Date.now() + Math.floor(Math.random() * 1000)
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ success: false, error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, error: "Admin access required" })
  }
  next()
}

// Routes

// Auth Routes
app.post("/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, country } = req.body

    if (!firstName || !lastName || !email || !password || !country) {
      return res.status(400).json({ success: false, error: "All fields are required" })
    }

    const users = readJsonFile(USERS_FILE)

    // Check if user already exists
    if (users.find((user) => user.email === email)) {
      return res.status(400).json({ success: false, error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      country,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    writeJsonFile(USERS_FILE, users)

    // Generate token
    const token = jwt.sign({ id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin }, JWT_SECRET, {
      expiresIn: "24h",
    })

    res.json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        country: newUser.country,
        isAdmin: newUser.isAdmin,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ success: false, error: "Registration failed" })
  }
})

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" })
    }

    const users = readJsonFile(USERS_FILE)

    // Check for admin credentials first
    if (email === "cbltracking001@gmail.com" && password === "Cblsupport#$") {
      const token = jwt.sign({ id: "admin", email: email, isAdmin: true }, JWT_SECRET, { expiresIn: "24h" })

      return res.json({
        success: true,
        message: "Admin login successful",
        token,
        user: {
          id: "admin",
          firstName: "CBL",
          lastName: "Admin",
          email: email,
          country: "Global",
          isAdmin: true,
        },
      })
    }

    // Find user
    const user = users.find((user) => user.email === email)
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid credentials" })
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ success: false, error: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        country: user.country,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ success: false, error: "Login failed" })
  }
})

// User Routes
app.get("/user/profile", authenticateToken, (req, res) => {
  try {
    if (req.user.id === "admin") {
      return res.json({
        success: true,
        user: {
          id: "admin",
          firstName: "CBL",
          lastName: "Admin",
          email: req.user.email,
          country: "Global",
          isAdmin: true,
        },
      })
    }

    const users = readJsonFile(USERS_FILE)
    const user = users.find((u) => u.id === req.user.id)

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    const { password, ...userWithoutPassword } = user
    res.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    console.error("Profile error:", error)
    res.status(500).json({ success: false, error: "Failed to get profile" })
  }
})

app.put("/user/profile", authenticateToken, upload.single("avatar"), (req, res) => {
  try {
    if (req.user.id === "admin") {
      return res.status(400).json({ success: false, error: "Cannot update admin profile" })
    }

    const users = readJsonFile(USERS_FILE)
    const userIndex = users.findIndex((u) => u.id === req.user.id)

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    const { firstName, lastName, country } = req.body

    if (firstName) users[userIndex].firstName = firstName
    if (lastName) users[userIndex].lastName = lastName
    if (country) users[userIndex].country = country

    if (req.file) {
      users[userIndex].avatar = `/uploads/${req.file.filename}`
    }

    users[userIndex].updatedAt = new Date().toISOString()

    writeJsonFile(USERS_FILE, users)

    const { password, ...userWithoutPassword } = users[userIndex]
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ success: false, error: "Failed to update profile" })
  }
})

// Order Routes
app.get("/user/orders", authenticateToken, (req, res) => {
  try {
    const orders = readJsonFile(ORDERS_FILE)
    const userOrders = orders.filter((order) => order.userId === req.user.id)
    res.json({ success: true, orders: userOrders })
  } catch (error) {
    console.error("Orders error:", error)
    res.status(500).json({ success: false, error: "Failed to get orders" })
  }
})

app.get("/track/:trackingId", (req, res) => {
  try {
    const { trackingId } = req.params
    const orders = readJsonFile(ORDERS_FILE)
    const order = orders.find((o) => o.id === trackingId)

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    res.json({ success: true, order })
  } catch (error) {
    console.error("Tracking error:", error)
    res.status(500).json({ success: false, error: "Failed to track order" })
  }
})

// Chat Routes
app.get("/user/chats", authenticateToken, (req, res) => {
  try {
    const chats = readJsonFile(CHATS_FILE)
    const userChats = chats.filter((chat) => chat.userId === req.user.id)
    res.json({ success: true, chats: userChats })
  } catch (error) {
    console.error("Chats error:", error)
    res.status(500).json({ success: false, error: "Failed to get chats" })
  }
})

app.post("/user/chat", authenticateToken, (req, res) => {
  try {
    const { message } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required" })
    }

    const chats = readJsonFile(CHATS_FILE)
    let userChat = chats.find((chat) => chat.userId === req.user.id)

    if (!userChat) {
      // Create new chat
      userChat = {
        id: Date.now().toString(),
        userId: req.user.id,
        userName: `${req.user.firstName || "User"} ${req.user.lastName || ""}`.trim(),
        userEmail: req.user.email,
        messages: [],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      chats.push(userChat)
    }

    // Add user message
    userChat.messages.push({
      id: Date.now().toString(),
      sender: "user",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })

    // Auto-reply logic
    const autoReply = generateAutoReply(message.trim())
    if (autoReply) {
      setTimeout(() => {
        userChat.messages.push({
          id: (Date.now() + 1).toString(),
          sender: "admin",
          message: autoReply,
          timestamp: new Date().toISOString(),
        })
        userChat.updatedAt = new Date().toISOString()
        writeJsonFile(CHATS_FILE, chats)
      }, 1000)
    }

    userChat.updatedAt = new Date().toISOString()
    writeJsonFile(CHATS_FILE, chats)

    res.json({
      success: true,
      message: "Message sent successfully",
      chat: userChat,
    })
  } catch (error) {
    console.error("Chat error:", error)
    res.status(500).json({ success: false, error: "Failed to send message" })
  }
})

function generateAutoReply(message) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! Welcome to CBL Tracking. How can I help you today?"
  }

  if (lowerMessage.includes("order") || lowerMessage.includes("ship")) {
    return "I'd be happy to help you with your order! Please provide me with the details of what you'd like to ship, including the destination country."
  }

  if (lowerMessage.includes("track") || lowerMessage.includes("status")) {
    return "To track your package, please provide your tracking ID. You can also use our tracking page for real-time updates."
  }

  if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    return "Our shipping rates vary by destination and package size. Please provide more details about your shipment for an accurate quote."
  }

  if (lowerMessage.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with today?"
  }

  return "Thank you for your message. Our team will get back to you shortly. For immediate assistance, please check our FAQ or tracking page."
}

// Admin Routes
app.get("/admin/orders", authenticateToken, requireAdmin, (req, res) => {
  try {
    console.log("Admin orders request from user:", req.user)
    const orders = readJsonFile(ORDERS_FILE)
    console.log("Found orders:", orders.length)
    res.json({ success: true, orders })
  } catch (error) {
    console.error("Admin orders error:", error)
    res.status(500).json({ success: false, error: "Failed to get orders" })
  }
})

app.get("/admin/users", authenticateToken, requireAdmin, (req, res) => {
  try {
    console.log("Admin users request from user:", req.user)
    const users = readJsonFile(USERS_FILE)
    console.log("Found users:", users.length)
    const usersWithoutPasswords = users.map(({ password, ...user }) => user)
    res.json({ success: true, users: usersWithoutPasswords })
  } catch (error) {
    console.error("Admin users error:", error)
    res.status(500).json({ success: false, error: "Failed to get users" })
  }
})

app.get("/admin/chats", authenticateToken, requireAdmin, (req, res) => {
  try {
    const chats = readJsonFile(CHATS_FILE)
    res.json({ success: true, chats })
  } catch (error) {
    console.error("Admin chats error:", error)
    res.status(500).json({ success: false, error: "Failed to get chats" })
  }
})

app.post("/admin/create-order", authenticateToken, requireAdmin, upload.single("image"), (req, res) => {
  try {
    const {
      productName,
      price,
      quantity,
      destination,
      status,
      reason,
      dateShipped,
      timeShipped,
      expectedArrival,
      customerName,
      customerEmail,
    } = req.body

    if (!productName || !price || !quantity || !destination || !status) {
      return res.status(400).json({ success: false, error: "Required fields missing" })
    }

    const orders = readJsonFile(ORDERS_FILE)
    const trackingId = generateTrackingId()

    const newOrder = {
      id: trackingId,
      productName,
      price: Number.parseFloat(price),
      quantity: Number.parseInt(quantity),
      destination,
      status,
      reason: reason || null,
      dateShipped: dateShipped || null,
      timeShipped: timeShipped || null,
      expectedArrival: expectedArrival || null,
      customerName: customerName || null,
      customerEmail: customerEmail || null,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      userId: null, // Admin created order
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    orders.push(newOrder)
    writeJsonFile(ORDERS_FILE, orders)

    res.json({
      success: true,
      message: "Order created successfully",
      trackingId: trackingId,
      order: newOrder,
    })
  } catch (error) {
    console.error("Create order error:", error)
    res.status(500).json({ success: false, error: "Failed to create order" })
  }
})

app.put("/admin/orders/:orderId/status", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { orderId } = req.params
    const { status, reason } = req.body

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" })
    }

    const orders = readJsonFile(ORDERS_FILE)
    const orderIndex = orders.findIndex((order) => order.id === orderId)

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    orders[orderIndex].status = status
    orders[orderIndex].reason = reason || null
    orders[orderIndex].updatedAt = new Date().toISOString()

    writeJsonFile(ORDERS_FILE, orders)

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: orders[orderIndex],
    })
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({ success: false, error: "Failed to update order status" })
  }
})

app.delete("/admin/orders/:orderId", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { orderId } = req.params
    const orders = readJsonFile(ORDERS_FILE)
    const orderIndex = orders.findIndex((order) => order.id === orderId)

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    orders.splice(orderIndex, 1)
    writeJsonFile(ORDERS_FILE, orders)

    res.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Delete order error:", error)
    res.status(500).json({ success: false, error: "Failed to delete order" })
  }
})

app.delete("/admin/users/:userId", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params
    const users = readJsonFile(USERS_FILE)
    const userIndex = users.findIndex((user) => user.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    users.splice(userIndex, 1)
    writeJsonFile(USERS_FILE, users)

    res.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ success: false, error: "Failed to delete user" })
  }
})

app.post("/admin/chat/:chatId/reply", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { chatId } = req.params
    const { message } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Message is required" })
    }

    const chats = readJsonFile(CHATS_FILE)
    const chatIndex = chats.findIndex((chat) => chat.id === chatId)

    if (chatIndex === -1) {
      return res.status(404).json({ success: false, error: "Chat not found" })
    }

    chats[chatIndex].messages.push({
      id: Date.now().toString(),
      sender: "admin",
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })

    chats[chatIndex].updatedAt = new Date().toISOString()
    writeJsonFile(CHATS_FILE, chats)

    res.json({
      success: true,
      message: "Reply sent successfully",
      chat: chats[chatIndex],
    })
  } catch (error) {
    console.error("Admin chat reply error:", error)
    res.status(500).json({ success: false, error: "Failed to send reply" })
  }
})

// Debug route to check data files (admin only)
app.get("/admin/debug", authenticateToken, requireAdmin, (req, res) => {
  try {
    const orders = readJsonFile(ORDERS_FILE)
    const users = readJsonFile(USERS_FILE)
    const chats = readJsonFile(CHATS_FILE)

    res.json({
      success: true,
      debug: {
        ordersCount: orders.length,
        usersCount: users.length,
        chatsCount: chats.length,
        ordersFile: ORDERS_FILE,
        usersFile: USERS_FILE,
        chatsFile: CHATS_FILE,
        sampleOrder: orders[0] || null,
        sampleUser: users[0] ? { ...users[0], password: "[HIDDEN]" } : null,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    res.status(500).json({ success: false, error: "Debug failed" })
  }
})

// Weather API (mock)
app.get("/api/weather", (req, res) => {
  const { lat, lon } = req.query

  // Mock weather data
  const mockWeather = {
    temperature: Math.floor(Math.random() * 30) + 10,
    condition: ["Sunny", "Cloudy", "Rainy", "Partly Cloudy"][Math.floor(Math.random() * 4)],
    location: "Your Location",
    humidity: Math.floor(Math.random() * 50) + 30,
    windSpeed: Math.floor(Math.random() * 20) + 5,
  }

  res.json(mockWeather)
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "File too large. Maximum size is 5MB." })
    }
  }

  console.error("Server error:", error)
  res.status(500).json({ success: false, error: "Internal server error" })
})

// Serve static files and handle SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Admin credentials: cbltracking001@gmail.com / Cblsupport#$`)
})
