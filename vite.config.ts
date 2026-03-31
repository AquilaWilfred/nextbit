import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'react';
            if (id.includes('@tanstack') || id.includes('@trpc')) return 'query';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('sonner') || id.includes('vaul') || id.includes('cmdk')) return 'ui-utils';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('wouter') || id.includes('zod') || id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor';
            return 'libs';
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});


