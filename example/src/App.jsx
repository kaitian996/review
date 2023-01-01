import { ref } from "../../packages/review/dist/review.esm-bundler"
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
    return () => {
        return (
            <div className="app">
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
            </div>
        )
    }
}
