import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for large Garmin files
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure debug directory exists
  const debugDir = path.join(process.cwd(), 'debug_data');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/debug/upload", (req, res) => {
    try {
      const { filename, content, type } = req.body;
      if (!filename || !content) {
        return res.status(400).json({ error: "Missing filename or content" });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeFilename = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(debugDir, safeFilename);

      let dataToWrite = content;
      
      // If it's base64 (like a zip file), decode it
      if (type === 'base64') {
        dataToWrite = Buffer.from(content, 'base64');
      }

      fs.writeFileSync(filePath, dataToWrite);
      console.log(`Saved debug file: ${filePath}`);
      
      res.json({ success: true, path: filePath });
    } catch (error) {
      console.error("Error saving debug file:", error);
      res.status(500).json({ error: "Failed to save file" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
