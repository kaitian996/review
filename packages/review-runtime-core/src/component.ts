import { isFunction, isObject, ShapeFlags } from "@review/review-shared"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"
//创建一个实例
export function createComponentInstance(vnode) {
    const instance = { //组件实例
        vnode, //初始的VNode
        type: vnode.type, //type 一定是一个函数对象
        props: {},
        proxy: {},
        ctx: {},
        render: null,
        isMounted: false, //表示组件是否挂载了
    }
    instance.ctx = { _: instance }
    return instance
}

export let currentInstance: null | object = null  //当前的实例对象
export const setCurrentInstance = instance => currentInstance = instance //设置实例
export const getCurrentInstance = () => currentInstance //在setup中获取当前实例
//配置对应的实例属性，然后与执行函数
export function setupComponent(instance) {
    currentInstance = instance
    const { props, children } = instance.vnode
    //将props解析出props 和attrs,放到instance上 
    instance.props = props  //initProps()
    instance.children = children // initSlot()
    //这是一个函数组件，需要执行函数，并且将返回的render函数挂载到实例身上
    const Component = instance.type
    if (!isFunction(Component)) {
        throw new Error(`${Component} must return a function`)
    }
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
    instance.render = Component.call(instance.proxy, instance.proxy) //将props赋给组件
}
