```html
<!--server-render and hydrate client-side-->
{% island 'Component.vue', 'client:load' %}{% endisland %}
<!--don't server-render and *only* render client-side-->
{% clientOnlyIsland 'Component.vue' %}{% endclientOnlyIsland %}
```
