export const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        if (key[0] === "$") return //不能访问$开头的变量
        //读取props时，走代理的上下文
        const { props, children } = instance
        if (key === "children") {
            return children
        }
        return props[key]
    },
    set({ _: instance }, key, value) {
        //
        console.warn(`can not set ${key} ,itis read only`)
        return true
    },
}
