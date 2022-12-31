import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { createRenderer, h } from '@review/review-runtime-core'
import { extend } from '@review/review-shared'

export const rendererOptions = extend({ patchProp }, nodeOps)

export function createApp(rootComponent: any, rootProps: any = null) {
    const app: any = createRenderer(rendererOptions).createApp(rootComponent, rootProps)
    const { mount } = app
    app.mount = (containerOrSelector: string) => {
        //清空
        const container: Element | null = nodeOps.querySelector(containerOrSelector)
        container!.innerHTML = ''
        //将组件 渲染成dom
        mount(container)
    }
    return app
}
export * from '@review/review-runtime-core'
export * from '@review/review-reactivity'