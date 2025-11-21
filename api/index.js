const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware - CORS với cấu hình cho production
app.use(cors({
  origin: "*", // Cho phép tất cả origins (có thể thay bằng frontend URL cụ thể)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Kết nối MongoDB với options cho serverless
let isConnected = false;

const connectDB = async () => {
  // Nếu đã kết nối, return ngay
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  // Nếu đang kết nối, đợi
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 30000);
      
      mongoose.connection.once("connected", () => {
        clearTimeout(timeout);
        isConnected = true;
        resolve();
      });
      
      mongoose.connection.once("error", (err) => {
        clearTimeout(timeout);
        isConnected = false;
        reject(err);
      });
    });
  }
  
  try {
    // Kiểm tra MONGODB_URI
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // Kết nối với cấu hình tối ưu cho serverless
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Tăng timeout cho serverless cold start
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 1, // Giảm pool size cho serverless
      minPoolSize: 1,
      bufferCommands: false, // QUAN TRỌNG: Tắt buffering để tránh timeout
    });
    
    isConnected = true;
    console.log("✅ Đã kết nối MongoDB");
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB:", err);
    isConnected = false;
    throw err; // Throw để middleware có thể catch
  }
};

// Route test (không cần DB) - đặt trước middleware connection
app.get("/", (req, res) => {
  res.json({ message: "Medical Diagnosis API đang chạy!" });
});

// Middleware để đảm bảo MongoDB kết nối trước khi xử lý request
// PHẢI ĐẶT TRƯỚC routes để đảm bảo DB kết nối trước
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Lỗi kết nối DB trong middleware:", error);
    
    // Log chi tiết lỗi để debug
    const errorDetails = {
      message: error.message,
      name: error.name,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    };
    console.error("Chi tiết lỗi:", JSON.stringify(errorDetails, null, 2));
    
    res.status(503).json({ 
      message: "Không thể kết nối đến database. Vui lòng thử lại sau.",
      error: error.message, // Hiển thị lỗi để debug
      hint: !process.env.MONGODB_URI 
        ? "MONGODB_URI environment variable is not set in Vercel"
        : "Check MongoDB Atlas IP whitelist and connection string"
    });
  }
});

// Routes - đặt SAU middleware connection
const diagnosisRoutes = require("../routes/diagnosis");
app.use("/api/diagnosis", diagnosisRoutes);

// Export app cho Vercel
module.exports = app;

