import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/send-invite", async (req, res) => {
    const { email, name, role, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Create user in Firebase Auth using Admin SDK
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        return res.status(400).json({ error: "User already exists in Auth" });
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
          });
        } else {
          throw e;
        }
      }

      // 2. Create/Update user document in Firestore
      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName: name,
        role,
        status: "Active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Send Email
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const appUrl = process.env.APP_URL || `https://${process.env.VITE_CLOUD_RUN_SERVICE_URL}` || 'http://localhost:3000';

      const mailOptions = {
        from: '"TRACES.IO ERP" <noreply@traces.io>',
        to: email,
        subject: "Welcome to TRACES.IO ERP - Your Account is Ready",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1F4E79;">Welcome to TRACES.IO ERP</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your account has been created by the system administrator. You can now log in to the system using the following credentials:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px;">${password}</code></p>
            </div>
            <p>For security reasons, we recommend that you change your password after your first login.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${appUrl}/login" style="display: inline-block; background: #1F4E79; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to ERP</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
            <p style="font-size: 12px; color: #64748b;">Test Email Preview: <a href="{{preview_url}}">View in Ethereal</a> (This link is for demo purposes)</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      
      // Inject preview URL into HTML for convenience
      mailOptions.html = mailOptions.html.replace('{{preview_url}}', previewUrl || '#');
      await transporter.sendMail(mailOptions); // Resend with correct link if needed or just use the first one

      res.json({ 
        success: true, 
        message: "User created and invite sent", 
        previewUrl 
      });
    } catch (error: any) {
      console.error("Invite Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
