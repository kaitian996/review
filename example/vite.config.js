import { defineConfig } from "vite"
import  review  from "@sakurasz/review-plugins"
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [review()],
})
