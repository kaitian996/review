//@ts-ingnore
import { parse, traverse, types, transformFromAstAsync } from "@babel/core"
export const review = (config) => {
    const pkg =
        config?.package || "../../packages/review/dist/review.esm-bundler"
    return {
        name: "review",
        enforce: "pre",
        config() {
            return {
                esbuild: {
                    jsxFactory: "h",
                    jsxInject: `import { h } from "${pkg}"`,
                },
            }
        },
        async transform(src, id) {
            if (/\.[j|t]sx/.test(id)) {
                const code = await reviewJsx(src)
                return {
                    code: code,
                    map: null,
                }
            }
        },
    }
}

async function reviewJsx(code) {
    const result = parse(code, {
        sourceType: "module",
        plugins: ["@babel/plugin-syntax-jsx"],
    })
    traverse(result, {
        ReturnStatement(path, state) {
            const node = path.node
            if (types.isJSXElement(node.argument) && !node.falg) {
                const newNode = types.returnStatement(
                    types.arrowFunctionExpression(
                        [types.identifier("()")],
                        types.blockStatement([node])
                    )
                )
                node.falg = true
                path.replaceWith(newNode)
                path.skip()
            }
        },
    })

    const { code: transformCode } = await transformFromAstAsync(result)
    return transformCode
}
