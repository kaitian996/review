import { ref } from "../../packages/review/dist/review.esm-bundler"
import "./App.css"
import { Hello } from "./Hello"
import { Admin } from "./Admin"
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
        <div className="app" onClick={() => (flag.value = !flag.value)}>
            {flag.value ? (
                <div>
                    <div>1</div>
                    <Hello give={give} key={1}></Hello>
                    <p key={2}>3</p>
                    <p key={3}>4</p>
                    <p key={4}>5</p>
                    <Hello give={give} key={5}></Hello>
                    <Admin give={give} key={6}></Admin>
                    <Hello give={give} key={7}></Hello>
                    <Admin give={give} key={8} ></Admin>
                    <p>2</p>
                </div>
            ) : (
                <div>
                    <p>1</p>
                    <Hello give={give} key={1}></Hello>
                    <Admin give={give} key={6}></Admin>
                    <Admin give={give} key={7}></Admin>
                    <p>2</p>
                </div>
            )}
        </div>
    )
}
