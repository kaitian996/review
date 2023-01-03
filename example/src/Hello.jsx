export const Hello = (props) => {
    const handler = () => {
        console.log("点击事件")
        // props.give()
    }

    return (
        <div onClick={handler}>
            我是hello组件
            {props.children}
        </div>
    )
}
