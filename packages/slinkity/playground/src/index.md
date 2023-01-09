---
layout: 'layout.njk'
---

<h1>Title</h1>
<p>Hey there!!!</p>
{% island 'WithSlots.svelte', 'client:load' %}
<h1>With slots?</h1>
{%endisland%}

<div>
{% island 'test.jsx' %}
  {% prop 'test', 5 %}
{% endisland %}
<hr style="margin-top: 100vh" />
{% island 'Counter.jsx', 'client:visible' %}
  {% prop 'initialCount', 3 %}
{% endisland %}
</div>