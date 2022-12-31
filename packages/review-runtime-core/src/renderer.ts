import { effect } from '@review/review-reactivity'
import { isFunction, ShapeFlags } from '@review/review-shared'
import { createAppAPI } from './apiCreateApp'
import { invokerArrayFns } from './apiLifecycle'
import { createComponentInstance, setupComponent } from './component'
import { shouldUpdateComponent } from './componentRenderUtils'
import { queueJob } from './scheduler'
import { isSameVNodeType, normalizeVNode, TEXT } from './vnode'

export function createRenderer(rendererOptions: any) {
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        setText: hostSetText,
        nextSibling: hostNextSibling,
        setElementText: hostSetElementText,
    } = rendererOptions

    const setupRenderEffect = (instance, container) => {
        // 创建一个effect，在effect中调用render，当render中访问了setupState,就重新执行
        instance.update = effect(function componentEffect() { //每个组件都有一个effect，vue3是组件级更新，数据变化会重新执行对应的effect
            if (!instance.isMounted) { //没有挂载
                //初次渲染
                const { bm, m } = instance
                if (bm) { //beforeMounte
                    invokerArrayFns(bm)
                }
                //需要渲染的子树
                const subTree = instance.subTree = instance.render.call()

                patch(null, subTree, container)
                instance.isMounted = true
                if (m) { //要求子组件完成后调用自己 
                    invokerArrayFns(m)
                }
            } else { //已经挂载了
                const { bu, u } = instance //执行生命周期
                if (bu) {
                    invokerArrayFns(bu)
                }
                //更新逻辑
                const { next, vnode } = instance;
                // 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
                // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
                if (next) {
                    console.log('有next', next, instance);
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next)
                }
                //更新元素，之前保存的树
                const prevTree = instance.subTree
                const nextTree = instance.render.call()

                patch(prevTree, nextTree, container)
                //打完补丁之后,应该会将新的nextTree赋给instance.subTree
                instance.subTree = nextTree
                //update
                if (u) {
                    invokerArrayFns(u)
                }
            }
        }, {
            scheduler: queueJob
        })
    }
    //----------处理组件-----------------------------------
    const updateComponentPreRender = (instance, next) => {
        //更新实例的props
        instance.children = next.children;
        instance.props = next.props
        next.component = instance
        instance.vnode = next
        instance.next = null
    }
    //初始化
    const mountComponent = (initialVNode, container) => {
        //一定是STATEFUL_COMPONENT
        console.log('组件初始化挂载')
        //1、先有实例
        const instance = initialVNode.component = createComponentInstance(initialVNode)
        //2、执行函数组件，将render挂载到实例身上
        setupComponent(instance)
        //3、创建effect，让render执行
        setupRenderEffect(instance, container)
    }
    const patchComponent = (n1, n2, container) => {
        // 更新组件实例引用
        const instance = n1.component
        // 先看看这个组件是否应该更新
        if (shouldUpdateComponent(n1, n2)) {
            // 那么 next 就是新的 vnode 了（也就是 n2）
            instance.next = n2;
            // 调用 update 再次更新调用 patch 逻辑
            // 在update 中调用的 next 就变成了 n2了
            instance.update()
        } else {
            n2.component = n1.component
            n2.el = n1.e1
            instance.vnode = n2
        }
    }
    const processComponent = (n1, n2, container) => {
        if (n1 === null) { //初始化
            mountComponent(n2, container)
        } else { //更新组件
            patchComponent(n1, n2, container)
            console.log('更新组件')
        }
    }

    //--------------处理元素--------------------------------
    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            patch(null, child, container)
        }
    }
    const mountElement = (vnode, container, anchor = null) => {

        //递归渲染
        const { props, shapeFlag, type, children } = vnode
        const el = vnode.el = hostCreateElement(type)
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children) //直接创建文本
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { //是数组
            mountChildren(children, el)
        }
        hostInsert(el, container, anchor)
    }
    //更新属性
    const patchProps = (oldProps, newProps, el) => {
        if (oldProps !== newProps) {
            //新增或者修改
            for (const key in newProps) {
                const prev = oldProps[key]
                const next = newProps[key]
                if (prev !== next) {
                    hostPatchProp(el, key, prev, next)
                }
            }
            //删除
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null)
                }
            }
        }
    }
    //卸载元素
    const unmount = (oldVNode) => {
        if (isFunction(oldVNode.type)) {
            if (typeof oldVNode.component.subTree.children === 'string') {
                hostSetElementText(oldVNode.component.subTree.el, '')
            }
            unmountChildren(oldVNode.component.subTree.children)
            console.log('卸载组件之前', oldVNode);
            const { bum, um } = oldVNode.component
            if (bum) {
                invokerArrayFns(bum)
            }
            unmount(oldVNode.component.subTree)
            if (um) {
                invokerArrayFns(um)
                console.log('卸载组件完成', oldVNode);
            }
        } else {
            if (typeof oldVNode.children === 'string') {
                hostSetElementText(oldVNode.el, '')
            }
            unmountChildren(oldVNode.children)
            hostRemove(oldVNode.el)
        }
    }
    const unmountChildren = (children) => {
        if (typeof children === 'string') {
            return
        }
        if (children) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                unmount(child)
            }
        }
    }
    //diff算法
    const patchKeyedChildren = (c1, c2, container) => {

        //Vue3对特殊情况优化
        let i: number = 0 //默认从头开始对比
        const l2 = c2.length;
        let e1 = c1.length - 1
        let e2 = c2.length - 1
        //sync from start 从头开始一个一个比较，遇到不同的就停止了
        while (i <= e1 && i <= e2) { //循环最短的一个数组
            const n1 = c1[i]
            const n2 = c2[i]
            if (isSameVNodeType(n1, n2)) {
                //两个文本更新的时候会有一个bug
                patch(normalizeVNode(n1), normalizeVNode(n2), container)
            } else {
                break
            }
            i++
        }
        //sync from end
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]
            if (isSameVNodeType(n1, n2)) {
                //两个文本更新的时候会有一个bug
                patch(normalizeVNode(n1), normalizeVNode(n2), container)
            } else {
                break
            }
            e1--
            e2--
        }
        console.log(`双端比较后=>i=${i},e1=${e1},e2=${e2}`)
        //比较之后，有一方完全比完，
        //common squeqe
        /**
         * i指向第一个不相同的位置，如果i比e1大，说明从i到e2都需要挂载，如果i比e2大，说明i到e1都需要卸载，不然就是乱序情况
         * 
         * 
         */
        if (i > e1 && i <= e2) { //新的多，老的少
            console.log('新的多，老的少，需要挂载新的');
            //如果i>e1,说明老的少，新的多
            /**
             * (a,b)
             * (a,b),c
             * 此时i=2,e1=1,e2=2所以需要新增
             *   (b,c)
             * a,(b,c)
             * 此时i=0,e1=-1,e2=0
             */
            //表示有新增的部分
            //从i到e2添加，
            const nextPos = e2 + 1
            //BUG:如果这里是组件，会出现bug
            const anchor = nextPos < c2.length ? c2[nextPos].el : null//如果比它小，就是向前添加

            while (i <= e2) {
                patch(null, c2[i], container, anchor) //只是向后添加
                i++
            }
        }
        else if (i > e2 && i <= e1) { //老的多新的少
            console.log('新的少，老的多，需要卸载旧的')
            /**
             * (a,b),c
             * (a,b)
             * 此时i=2,e1=2,e2=1,此时i指向的是c1的多出来的部分，i到e1多出来的部分都得删除
             * c,(a,b)
             * (a,b)
             * 此时i=0,e1=0,e2=-1,从i到e1都得删除
             */
            while (i <= e1) {
                unmount(c1[i])
                i++
            }
        }
        else {
            // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
            // 例如下面的情况
            // a,b,[c,d,e],f,g
            // a,b,[e,c,d],f,g

            let s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map();
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 先把 key 和 newIndex 绑定好，方便后续基于 key 找到 newIndex
            // 时间复杂度是 O(1)
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }

            // 需要处理新节点的数量
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            // 初始化 从新的index映射为老的index
            // 创建数组的时候给定数组的长度，这个是性能最快的写法
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
            for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

            // 遍历老节点
            // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
            // 2. 新老节点都有的，—> 需要 patch
            for (i = s1; i <= e1; i++) {
                const prevChild = c1[i];

                // 优化点
                // 如果老的节点大于新节点的数量的话，那么这里在处理老节点的时候就直接删除即可
                if (patched >= toBePatched) {
                    unmount(prevChild);
                    continue;
                }

                let newIndex;
                if (prevChild.key != null) {
                    // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
                    // 时间复杂度O(1)
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                } else {
                    // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
                    // 时间复杂度O(n)
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }

                // 因为有可能 nextIndex 的值为0（0也是正常值）
                // 所以需要通过值是不是 undefined 或者 null 来判断
                if (newIndex === undefined) {
                    // 当前节点的key 不存在于 newChildren 中，需要把当前节点给删除掉
                    unmount(prevChild);
                } else {
                    // 新老节点都存在
                    console.log("新老节点都存在");
                    // 把新节点的索引和老的节点的索引建立映射关系
                    // i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在老的节点中不存在)
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 来确定中间的节点是不是需要移动
                    // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
                    // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
                    // 不是升序的话，我们就可以确定节点移动过了
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    } else {
                        moved = true;
                    }

                    patch(prevChild, c2[newIndex], container);
                    patched++;
                }
            }

            // 利用最长递增子序列来优化移动逻辑
            // 因为元素是升序的话，那么这些元素就是不需要移动的
            // 而我们就可以通过最长递增子序列来获取到升序的列表
            // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
            // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
            // getSequence 返回的是 newIndexToOldIndexMap 的索引值
            // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;

            // 遍历新节点
            // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
            // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]

            // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
            // 因为 insert 逻辑是使用的 insertBefore()
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 确定当前要处理的节点索引
                const nextIndex = s2 + i;
                const nextChild = c2[nextIndex];
                // 锚点等于当前节点索引+1
                // 也就是当前节点的后面一个节点(又因为是倒遍历，所以锚点是位置确定的节点)
                const anchor = nextIndex + 1 < l2 ? isFunction(c2[nextIndex + 1].type) ? c2[nextIndex + 1].component.subTree.el : c2[nextIndex + 1].el : null;
                console.log('乱序插入', anchor);

                if (newIndexToOldIndexMap[i] === 0) {
                    // 说明新节点在老的里面不存在
                    // 需要创建
                    patch(null, nextChild, container, anchor);

                } else if (moved) {
                    // 需要移动
                    // 1. j 已经没有了 说明剩下的都需要移动了
                    // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
                    if (j < 0 || increasingNewIndexSequence[j] !== i) {
                        // 移动的话使用 insert 即可
                        hostInsert(nextChild.el, container, anchor);
                    } else {
                        // 这里就是命中了  index 和 最长递增子序列的值
                        // 所以可以移动指针了
                        j--;
                    }
                }
            }
        }

    }
    //更新儿子
    const patchChildren = (n1, n2, container) => {
        const c1 = n1.children //老儿子
        const c2 = n2.children //新儿子
        //老的有儿子 新的没儿子 新的有儿子，老的没儿子 新老都是文本
        const prevShapeFlag = n1.shapeFlag //表示儿子状态
        const shapeFlag = n2.shapeFlag
        //新的有三种情况 文本 、数组 、空
        //老的有三种情况 文本、数组、空
        if (shapeFlag & ShapeFlags.NULL_CHILDREN) { //新的为空
            if (prevShapeFlag & ShapeFlags.NULL_CHILDREN) { //老的为空
                //啥也不做
                console.log('新的为空，老的为空,啥也不做', c1, c2)
            } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { //老的为数组
                unmountChildren(c1) //卸载老的数组
                console.log('新的为空，老的为数组,卸载老的数组', c1, c2)
            } else { //老的为文本
                hostSetElementText(container, '')
                console.log('新的为空，老的为文本,清空文本', c1, c2)
            }
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { //新的为数组
            if (prevShapeFlag & ShapeFlags.NULL_CHILDREN) { //老的为空
                mountChildren(c2, container)
                console.log('新的为数组，老的为空,挂载新的', c1, c2)
            } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { //老的为数组
                // TODO:diff算法
                patchKeyedChildren(c1, c2, container)
                console.log('新的为数组，老的为数组,diff算法', c1, c2)
            } else { //老的为文本
                hostSetElementText(container, '')
                mountChildren(c2, container)
                console.log('新的为数组，老的为文本,清空文本，再挂载新的数组', c1, c2)
            }
        } else { //新的为文本
            if (prevShapeFlag & ShapeFlags.NULL_CHILDREN) { //老的为空
                hostSetElementText(container, c2)
                console.log('新的为文本，老的为空,设置文本', c1, c2)
            } else if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { //老的为数组
                unmountChildren(c1) //卸载老的
                hostSetElementText(container, c2)
                console.log('新的为文本，老的为数组，卸载数组', c1, c2)
            } else { //老的为文本
                if (c1 !== c2) { //如果两次文本不同
                    hostSetElementText(container, c2)
                    console.log('新的为文本，老的为文本,设置文本', c1, c2)
                }
            }
        }
    }
    //diff元素
    const patchElement = (n1, n2, container) => {
        //元素是相同节点
        const el = n2.el = n1.el //dom值给n2
        //更新属性
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        patchProps(oldProps, newProps, el)
        //更新儿子
        patchChildren(n1, n2, el)
    }
    //元素过程
    const processElement = (n1, n2, container, anchor) => {
        if (n1 === null) { //元素挂载
            mountElement(n2, container, anchor)
        } else { //元素更新
            patchElement(n1, n2, container)
        }
    }
    //--------------处理文本--------------------------------
    const processText = (n1, n2, container) => {
        if (n1 === null) { //创建文本，挂载
            hostInsert(n2.el = hostCreateText(n2.children), container)
        } else {
            const el = n2.el = n1.el
            if (n2.children !== n1.children) {
                hostSetElementText(el, n2.children as string)
            }
        }
    }
    /**
     * 
     * @param n1 old VNode
     * @param n2 new VNode
     * @param container 挂载容器
     * @param anchor 挂载元素时的参考位置
     */
    //---------------patch方法，根据不同情况，path组件或者元素------
    const patch = (n1, n2, container, anchor = null) => {

        //针对不同元素做不同初始化操作
        const { shapeFlag, type } = n2
        if (n1 && !isSameVNodeType(n1, n2)) {
            //把n1删除
            anchor = hostNextSibling(n1.el)
            unmount(n1)
            n1 = null
        }
        switch (type) {
            case TEXT:
                processText(n1, n2, container)
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor)
                } else if (shapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT) {
                    processComponent(n1, n2, container)
                }
                break;
        }
    }
    const render = (vnode, container) => {
        //core核心，根据不同的虚拟节点，创建真实元素，
        patch(null, vnode, container)
    }
    return {
        createApp: createAppAPI(render)
    }
}
//最长递增子序列算法
function getSequence(arr: number[]): number[] {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

