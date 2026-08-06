import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages のリポジトリ名に合わせて変更
// 例: https://yourname.github.io/quickplay/ → "/quickplay/"
const BASE = process.env.VITE_BASE_PATH || "/quickplay/";

export default defineConfig({
  plugins: [react()],
  base: BASE,
});