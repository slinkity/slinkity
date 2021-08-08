import React, { useState } from 'react'
import styles from './Counter.module.css'

function Counter() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>You clicked {count} times</p>
      <button className={styles.clickBtn} onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  )
}

export default Counter
