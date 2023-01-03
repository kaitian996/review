import { parse, types, transformFromAstAsync, traverse } from "@babel/core"
export default function review(config) {
    return {
        name: "review",
        enforce: "pre",
        config() {
            return {
                esbuild: {
                    jsxFactory: "h",
                    jsxInject: `import { h } from "../../packages/review/dist/review.esm-bundler"`,
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
            //@ts-ignore
            if (types.isJSXElement(node.argument) && !node.falg) {
                const newNode = types.returnStatement(
                    types.arrowFunctionExpression(
                        [types.identifier("()")],
                        types.blockStatement([node])
                    )
                )
                //@ts-ignore
                node.falg = true
                path.replaceWith(newNode)
                path.skip()
            }
        },
    })
    //@ts-ignore
    const { code: transformCode } = await transformFromAstAsync(result)
    return transformCode
}
