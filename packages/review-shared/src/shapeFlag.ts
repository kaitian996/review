export const enum ShapeFlags {
    ELEMENT = 1, //元素
    FUNCTIONAL_COMPONENT = 1 << 1, //function_compmonent
    TEXT_CHILDREN = 1 << 2, //text_children
    ARRAY_CHILDREN = 1 << 3, //array_children
    NULL_CHILDREN = 1 << 4, //null_children
    TELEPORT = 1 << 5, //teleport
    SUSPENSE = 1 << 6, //suspense
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 7,
    COMPONENT_KEPT_ALIVE = 1 << 8,
}
//通过移位运算标识需要的操作
