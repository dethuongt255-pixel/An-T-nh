import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Auth URL endpoint
app.get("/api/auth/google/url", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["host"];
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/auth/google/callback`;
  
  console.log("Generating Auth URL with redirectUri:", redirectUri);

  // Set the redirect URI dynamically for this request
  (oauth2Client as any).redirectUri = redirectUri;

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
    prompt: "consent",
  });
  res.json({ url });
});

// Auth callback
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["host"];
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/auth/google/callback`;

  console.log("Handling Auth Callback with redirectUri:", redirectUri);
  (oauth2Client as any).redirectUri = redirectUri;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in a secure cookie
    res.cookie("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Đăng nhập Google thành công! Cửa sổ này sẽ tự đóng.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// List Drive files
app.get("/api/drive/files", async (req, res) => {
  const tokensCookie = req.cookies.google_tokens;
  if (!tokensCookie) {
    return res.status(401).json({ error: "Not authenticated with Google" });
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const response = await drive.files.list({
      q: "mimeType = 'audio/mpeg' and trashed = false",
      fields: "files(id, name, thumbnailLink)",
      pageSize: 50,
    });

    res.json({ files: response.data.files });
  } catch (error) {
    console.error("Drive API Error:", error);
    res.status(500).json({ error: "Failed to fetch files from Drive" });
  }
});

// Proxy Drive download
app.get("/api/drive/download/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const tokensCookie = req.cookies.google_tokens;
  if (!tokensCookie) {
    return res.status(401).send("Not authenticated");
  }

  try {
    const tokens = JSON.parse(tokensCookie);
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Get metadata first to get correct mimeType
    const metadata = await drive.files.get({
      fileId,
      fields: "mimeType",
    });

    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", metadata.data.mimeType || "audio/mpeg");
    response.data.pipe(res);
  } catch (error: any) {
    console.error("Drive Download Error:", error);
    if (error.code === 404) {
      res.status(404).send("File not found on Google Drive");
    } else if (error.code === 403) {
      res.status(403).send("Access denied to this file");
    } else {
      res.status(500).send("Failed to download file from Drive");
    }
  }
});

async function startServer() {
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
