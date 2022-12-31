import { isArray, isObject, isString, ShapeFlags, isFunction } from "@review/review-shared"

export function createVNode(type: any, props: any, children: any = null) {
    //根据type区分
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isFunction(type) ? ShapeFlags.FUNCTIONAL_COMPONENT : 0
    //给虚拟节点加一个类型
    const vnode = {
        __v_isVNode: true,
        type, //类型  Component 或者string 如果是Component 则是一个函数，否则是一个string
        props,
        children, //数组或文本或null
        component: null as any, //存放组件实例，经过createComponentInstance后的实例
        el: null as any,  //会将虚拟节点和真实节点对应起来
        key: props && props.key, //用来diff
        shapeFlag //类型
    }
    normalizeChildren(vnode, children)
    return vnode
}
//与儿子属性做交集
function normalizeChildren(vnode, children) {
    let type = 0
    if (children === null) { //
        type = ShapeFlags.NULL_CHILDREN
    } else if (isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN
    } else {
        type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.shapeFlag |= type //判断出儿子类型和自己的类型
}
//创建文本节点
export const TEXT = Symbol('Text')
export function normalizeVNode(child) {
    if (isObject(child)) return child
    return createVNode(TEXT, null, String(child))
}
export function isVNode(vnode) {
    if (vnode === null) return false
    if (!!vnode.__v_isVNode) {
        return true
    } else {
        return false
    }
}
export function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key
}