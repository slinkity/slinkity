import '/@islands/Counter.css'
import { useState } from 'preact/hooks'

export default function Counter({ initialCount }) {
  const [count, setCount] = useState(initialCount ?? 0)
  return (
    <>
      <p>Oh, and the state is preserved while I work {count}</p>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </>
  )
}
