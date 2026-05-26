import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 3002;

app.use(
  "/",
  createProxyMiddleware({
    // target: "http://54.78.47.168:8083",
    target: "http://46.225.60.249",
    changeOrigin: true,
    secure: false,
  })
);

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
