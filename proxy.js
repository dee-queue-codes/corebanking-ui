import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = 5173;

app.use(
  "/",
  createProxyMiddleware({
    target: "http://54.78.47.168:8083",
    changeOrigin: true,
    secure: false,
  })
);

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
