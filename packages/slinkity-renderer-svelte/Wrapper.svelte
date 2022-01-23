<script>
  /**
   * Source: https://github.com/withastro/astro/blob/main/packages/renderers/renderer-svelte/Wrapper.svelte
   *
   * Why do we need a wrapper component?
   *
   * Slinkity passes `children` as a string of HTML, so we need
   * a way to render that content.
   *
   * Rather than passing a magical prop which needs special
   * handling, using this wrapper allows Svelte users to just
   * use `<slot />` like they would for any other component.
   */
  const {
    __slinkity_component: Component,
    __slinkity_children,
    ...props
  } = $$props;
</script>

<svelte:component this={Component} {...props}>
  {#if __slinkity_children != null}
    <slinkity-fragment>
      {@html __slinkity_children}
    </slinkity-fragment>
  {/if}
</svelte:component>
