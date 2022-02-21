Slinkity is the simplest way to handle styles and component frameworks on your 11ty site. Once installed, this:

- 🚀 **Unlocks component frameworks** like React, Vue, and Svelte for writing page templates. Turn an existing `.html` or `.liquid` file into a `.jsx|tsx|vue|svelte` file, and you're off to the componentized races.
- 🔖 **Includes powerful shortcodes** to insert components into existing pages. Add a line like this to your markdown, HTML, Nunjucks, etc, and watch the magic happen: {% raw %}`{% component 'path/to/Component.*' %}`{% endraw %}
- 💧 **Hydrates these components** when and how you want. Use component frameworks as a static template to start, and opt-in to shipping JS as needed with our [partial hydration helpers](/docs/partial-hydration).
- 💅 **Bundles all your resources** with the power of Vite. Use your favorite CSS preprocessor, JS minifier, and more with minimal config.