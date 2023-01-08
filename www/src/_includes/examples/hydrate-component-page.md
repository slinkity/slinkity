{% island 'Tabs.svelte', 'client:load' %}
{% prop 'id', 'prereqs' %}
{% prop 'tabs', ["React", "Vue", "Svelte"] %}
{% renderTemplate "md" %}
<section>

```jsx
// about.jsx
import { useState } from 'react'

export const island = {
  client: 'load',
}

export default function About() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p>You've had {count} glasses of water 💧</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </>
  )
}
```
</section>
<section hidden>

```html
<!--about.vue-->
<template>
  <p>You've had {{ count }} glasses of water 💧</p>
  <button @click="add()">Add one</button>
</template>

<script>
import { ref } from "vue";
export default {
  island: {
    client: 'load',
  },
  setup() {
    const count = ref(0);
    const add = () => (count.value = count.value + 1);
    return { count, add };
  },
};
</script>
```
</section>
<section hidden>

```html
<!--about.svelte-->
<script context="module">
  export const island = {
    client: 'load',
  }
</script>

<script>
  let count = 0;

  function add() {
    count += 1;
  }
</script>

<p>You've had {count} glasses of water 💧</p>
<button on:click={add}>Add one</button>
```
</section>

{% endrenderTemplate %}
{% endisland %}
