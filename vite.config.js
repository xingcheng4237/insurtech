import path from "path";
import { defineConfig } from "vite";

// Use dynamic imports to avoid bundling dev dependencies in production
export default defineConfig(async () => {
  // Only import plugins when actually building (not when this config is imported by server code)
  const plugins = [];
  
  try {
    const react = (await import("@vitejs/plugin-react")).default;
    plugins.push(react());
  } catch (e) {
    console.warn("@vitejs/plugin-react not available");
  }
  
  try {
    const tailwindcss = (await import("@tailwindcss/vite")).default;
    plugins.push(tailwindcss());
  } catch (e) {
    console.warn("@tailwindcss/vite not available");
  }
  
  try {
    const { jsxLocPlugin } = await import("@builder.io/vite-plugin-jsx-loc");
    plugins.push(jsxLocPlugin());
  } catch (e) {
    console.warn("@builder.io/vite-plugin-jsx-loc not available");
  }
  
  try {
    const { vitePluginManusRuntime } = await import("vite-plugin-manus-runtime");
    plugins.push(vitePluginManusRuntime());
  } catch (e) {
    console.warn("vite-plugin-manus-runtime not available");
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "client", "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
        "@assets": path.resolve(process.cwd(), "attached_assets"),
      },
    },
    envDir: process.cwd(),
    root: path.resolve(process.cwd(), "client"),
    publicDir: path.resolve(process.cwd(), "client", "public"),
    build: {
      outDir: path.resolve(process.cwd(), "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      allowedHosts: [
        ".manuspre.computer",
        ".manus.computer",
        ".manus-asia.computer",
        ".manuscomputer.ai",
        ".manusvm.computer",
        "localhost",
        "127.0.0.1",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
