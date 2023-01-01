import { isArray, isObject } from "@review/review-shared"
import { createVNode, isVNode, normalizeVNode } from "./vnode"

export function h(type, propsOrChildren, children) {
    const l = arguments.length
    if (l === 2) {
        if (isArray(propsOrChildren)) {
            //是数组，那就是数组孩子
            return createVNode(
                type,
                null,
                propsOrChildren.map((child) => normalizeVNode(child))
            )
        } else if (isObject(propsOrChildren)) {
            //是对象
            if (isVNode(propsOrChildren)) {
                //是VNode
                return createVNode(type, null, children)
            } else {
                //是props
                return createVNode(type, propsOrChildren, null)
            }
        } else {
            //字符串或者空
            return createVNode(type, null, propsOrChildren)
        }
    } else {
        if (l > 3) {
            //长度大于3
            children = Array.prototype.slice
                .call(arguments, 2)
                .map((child) => normalizeVNode(child))
        } else if (l === 3) {
            if (isArray(children)) {
                //是数组，那就是数组孩子
                children = children.map((child) => normalizeVNode(child))
            } else if (isVNode(children)) {
                //是VNode
                children = [children]
            }
        } //最终结果为[] 、 Vnode、字符串
        return createVNode(type, propsOrChildren, children)
    }
}
