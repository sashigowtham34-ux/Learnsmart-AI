import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { apiApp } from "./server/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(apiApp);

// Serve static dist in production
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`LearnSmart AI server listening on http://0.0.0.0:${PORT}`);
});
