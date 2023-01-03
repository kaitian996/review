# review

## how review it  begin ?

After using Vue3's reactive system and React's JSX, I think Vue3's templates are not as flexible as JSX, and React's execution logic results in it not being as fast as Vue3

So I thought it would be a good idea to be able to combine Vue3's reactive system with JSX

So I modified Vue3's runtime-core package with this goal in mind, and now it does what I want

# demo

## setup
Currently, Review supports development on Vite

Therefore, it needs to be set in the vite.config .js

```js
//vite.config.js
import { defineConfig } from "vite"
import  review  from "@sakurasz/review-plugins" // review plugin,
//notice:review plugin depend on @babel/core and @babel/plugin-syntax-jsx so you must to isntall these packages

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [review()],
})
```

# use

You can see example for more detail

You can organize your project like react

```js
//this is a child component
export const Hello = (props) => {

    const handler=()=>{
        props.give()
    }
    return (
        <div onClick={handler}>
            I am hello component
            {props.children}
        </div>
    )

}

```
```js
//App.jsx App component
import { ref } from "@sakurasz/review" 
import "./App.css"
import { Hello } from "./Hello"
export const App = () => {
    /**
     * you can use any vue syntax in there
     */
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

    return (
        <div className="app">
            <div>{count.value}</div>
            <input type="text" name="" id="" onInput={handleInput} />
            <div>{input.value}</div>
            <button className="add" onClick={add}>
                add
            </button>
            <button className="deadd" onClick={deadd}>
                deadd
            </button>
            <Hello give={give}>Subcomponent passing</Hello>
        </div>
    )
    
}
```
```js
//main.js
import { createApp} from "@sakurasz/review"
import { App } from "./App"

createApp(App).mount("#root")
```

now you can run vite to see 

# feature

review feature :

1. All components are executed only once like vue3
2. The component is not re-executed when updating 
3. Combining vue3 and jsx, you can use any vue3 syntax in your components, and you can use any jsx syntax as you would in React