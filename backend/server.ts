import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import bcrypt from "bcrypt";
import { createServer as createViteServer } from "vite";
import authRoutes from "./routes/auth.routes";
import containerRoutes from "./routes/container.routes";
import productRoutes from "./routes/product.routes";
import cmsRoutes from "./routes/cms.routes";
import { UserModel } from "./models/User";
import { db } from "./config/database";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
const PORT = 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Vite dev server compatibility
}));
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging
app.use(morgan("dev"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/containers", containerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cms", cmsRoutes);

// Error handler
app.use(errorHandler);

// Admin Seeder
async function seedAdmin() {
  try {
    const adminId = "admin_user_001";
    const doc = await UserModel.findById(adminId);
    if (!doc) {
      const hashed = await bcrypt.hash("admin", 12);
      await db.collection("users").doc(adminId).set({
        userId: "USR-0001",
        fullName: "System Admin",
        username: "admin",
        email: "admin@traces.io",
        password: hashed,
        role: "admin",
        isFirstLogin: true,
        isActive: true,
        permissions: {
          containers: "delete",
          purchases: "delete",
          shipments: "delete",
          warehouse: "delete",
          sales: "delete",
          investors: "delete",
          analytics: "delete",
          traceability: "delete",
          cms: "delete",
          users: "delete",
          settings: "delete"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Admin seeded: admin/admin (ID: admin_user_001)");
    }
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

async function startServer() {
  console.log("Starting server initialization...");
  
  // API Health Check (First)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("Vite dev server initialized");
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    
    // Perform background tasks after server is listening
    (async () => {
      try {
        console.log("Waiting 3 seconds for database readiness before seeding...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        await seedAdmin();
        console.log("Admin seeding completed (or skipped)");
      } catch (error) {
        console.error("Background seeding failed:", error);
      }
    })();
  });
}

startServer();
