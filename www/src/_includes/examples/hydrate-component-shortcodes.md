{% slottedComponent 'Tabs.svelte', hydrate=true, id='shortcode-hydration', store='templates', tabs=['nunjucks', 'liquid'] %}
{% renderTemplate 'md' %}
<section>

```html
<!--server-render and hydrate client-side-->
{% component 'Component.vue', hydrate=true %}
<!--don't server-render and *only* render client-side-->
{% component 'Component.vue', renderWithoutSSR=true %}
```

> If you prefer the syntax available in nunjucks templates, we do too! We recommend configuring nunjucks as the default templating language for HTML and markdown files to access this syntax everywhere. [Head to our configuration docs](/docs/config/#11ty's-.eleventy.js) for more details.

</section>
<section hidden>

```html
<!--server-render and hydrate client-side-->
{% component 'Component.vue' 'hydrate' true %}
<!--don't server-render and *only* render client-side-->
{% component 'Component.vue' 'renderWithoutSSR' true %}
```

> Liquid doesn't handle inline objects very well. So, we recommend passing each key-value pair as separate arguments as shown above. Each pair (ex. `'hydrate' true`) will be joined on our end (ex. `hydrate=true`).

</section>
{% endrenderTemplate %}
{% endslottedComponent %}