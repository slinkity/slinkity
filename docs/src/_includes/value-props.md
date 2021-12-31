Slinkity is the missing piece to handling styles and component frameworks in your 11ty site. Once installed, this:

- 🚀 **Unlocks component frameworks** (like React) for writing page templates and layout templates. So, you can turn an existing `.html` or `.liquid` file into a `.jsx` file, and immediately start building routes using React.
- 🔖 **Includes powerful shortcodes** to insert components into existing pages. Add a line like this to your markdown, HTML, Nunjucks, etc, and watch the magic happen: {% raw %}`{% react './path/to/component.jsx' %}`{% endraw %}
- 💧 **Hydrates these components** when and how you want. Use component frameworks as a static template to start, and opt-in to shipping JS as needed with our [partial hydration helpers](/docs/partial-hydration).
- 💅 **Bundles all your resources** with the power of Vite. Use your favorite CSS preprocessor, JS minifier, and more with the least config possible.