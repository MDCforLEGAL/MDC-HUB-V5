import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages project sites live under /<repo>/, so the deploy workflow
  // passes VITE_BASE_PATH. Local dev and custom-domain builds stay at root.
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "mdc-dev-entry",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const pathname = request.url?.split("?")[0];
          if (pathname === "/" || pathname === "/index.html") {
            response.statusCode = 302;
            response.setHeader("Location", "/dev.html");
            response.end();
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  build: {
    // index.html is generated for GitHub Pages; dev.html is the Vite entry.
    rollupOptions: {
      input: "dev.html",
    },
  },
});
