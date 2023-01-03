import { defineConfig } from "vite"
import  review  from "./src/vite-plugin"
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [review()],
})
