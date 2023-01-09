```liquid{% raw %}
<!--server-render with hydration-->
{% island 'Component.vue', 'client:load' %}{% endisland %}

<!--client-side rendering only-->
{% clientOnlyIsland 'Component.vue', 'client:load' %}{% endclientOnlyIsland %}
{% endraw %}
```
