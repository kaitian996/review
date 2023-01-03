import { ref } from "@sakurasz/review"
import "./App.css"
import { Hello } from "./Hello"
export const App = () => {
    const count = ref(0)
    const add = () => {
        count.value++
    }
    const deadd = () => {
        count.value--
    }
    const input = ref("")
    const handleInput = (e) => {
        input.value = e.target.value
    }
    const give = () => {
        count.value++
    }
    console.log(typeof Hello)
    const flag = ref(true)

    return (
        <div className="app">
            {flag.value ? (
                <div>
                    <div>{count.value}</div>
                    <input type="text" name="" id="" onInput={handleInput} />
                    <div>{input.value}</div>
                    <button className="add" onClick={add}>
                        增加
                    </button>
                    <button className="deadd" onClick={deadd}>
                        减少
                    </button>
                    <Hello give={give}>子组件传递</Hello>
                    <div>占位符</div>
                </div>
            ) : (
                <div>
                    <div>{count.value}</div>
                    <input type="text" name="" id="" onInput={handleInput} />
                    <div>{input.value}</div>
                    <button className="add" onClick={add}>
                        增加
                    </button>
                    <button className="deadd" onClick={deadd}>
                        减少
                    </button>
                    <div>要增加的</div>
                    <Hello give={give}>子组件传递</Hello>
                    <div>占位符</div>
                </div>
            )}
        </div>
    )
}
