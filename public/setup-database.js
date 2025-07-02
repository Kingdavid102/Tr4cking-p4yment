const fs = require("fs")
const path = require("path")

// Create necessary directories
const directories = ["uploads", "data"]

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
})

// Initialize orders.json with sample data
const sampleOrders = [
  {
    id: "BX9K-F03Z-MQ18",
    productName: "Premium Electronics Package",
    price: 299.99,
    quantity: 1,
    destinationCountry: "United States",
    shippingStatus: "shipped",
    timeShipped: "14:30",
    dateShipped: "2024-01-15",
    expectedArrival: "2024-01-20",
    reason: null,
    image: null,
    createdAt: "2024-01-15T14:30:00.000Z",
  },
  {
    id: "CY8L-G14A-NR29",
    productName: "Fashion Accessories Set",
    price: 149.5,
    quantity: 2,
    destinationCountry: "Canada",
    shippingStatus: "delivered",
    timeShipped: "09:15",
    dateShipped: "2024-01-10",
    expectedArrival: "2024-01-14",
    reason: null,
    image: null,
    createdAt: "2024-01-10T09:15:00.000Z",
  },
  {
    id: "DZ7M-H25B-OS30",
    productName: "Home Appliance Bundle",
    price: 599.99,
    quantity: 1,
    destinationCountry: "United Kingdom",
    shippingStatus: "pending",
    timeShipped: null,
    dateShipped: null,
    expectedArrival: null,
    reason: "Awaiting customs clearance documentation",
    image: null,
    createdAt: "2024-01-16T10:00:00.000Z",
  },
]

const ordersFile = path.join("data", "orders.json")
if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, JSON.stringify(sampleOrders, null, 2))
  console.log("Created orders.json with sample data")
}

console.log("Database setup complete!")
