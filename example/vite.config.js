import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [],
    esbuild: {
        jsxFactory: "h",
        jsxInject:
            'import { h } from "../../packages/review/dist/review.esm-bundler"',
    },
})
