<script>
  /** Labels for each tab button */
  export let tabs = [];
  /** generates tab and tab panel IDs. A unique ID is recommended! */
  export let id = "tabs";

  let currentTabIdx = 0;
  let tabEl;
  let tabPanelEl;

  $: tabPanels = tabPanelEl?.querySelector("slinkity-fragment").children;
  $: setTabPanelAttrs(tabPanels);

  function setTabPanelAttrs(currentTabPanels) {
    if (!currentTabPanels?.length) return;

    const currPanel = currentTabPanels[currentTabIdx];
    for (const [idx, panel] of [...currentTabPanels].entries()) {
      panel.setAttribute("hidden", "");
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", toTabId(idx));
      panel.setAttribute("id", toTabPanelId(idx));
    }
    currPanel.removeAttribute("hidden");
  }

  function toTabId(idx) {
    return `tabs--${id}--tab--${idx}`;
  }
  function toTabPanelId(idx) {
    return `tabs--${id}--panel--${idx}`;
  }

  function moveFocus(event) {
    if (event.key === "ArrowLeft") {
      if (currentTabIdx > 0) {
        currentTabIdx -= 1;
      }
    } else if (event.key === "ArrowRight") {
      if (currentTabIdx < tabs.length - 1) {
        currentTabIdx += 1;
      }
    }
  }

  $: onCurrentTabChange(currentTabIdx);
  function onCurrentTabChange(newTabIdx) {
    if (tabEl && tabPanels) {
      const currButton = tabEl.querySelector(
        `button:nth-child(${newTabIdx + 1}`
      );
      currButton.focus();

      setTabPanelAttrs(tabPanels);
    }
  }
</script>

<div role="tablist" class="tabs" bind:this={tabEl} on:keydown={moveFocus}>
  {#each tabs as tab, idx}
    <button
      class="tab"
      aria-controls={toTabPanelId(idx)}
      id={toTabId(idx)}
      aria-selected={idx === currentTabIdx}
      tabindex={idx === currentTabIdx ? "0" : "-1"}
      role="tab"
      type="button"
      on:click={() => (currentTabIdx = idx)}>{tab}</button
    >
  {/each}
</div>
<div bind:this={tabPanelEl}>
  <slot />
</div>

<style>
  .tabs {
    margin-block: 1rem;
  }
  .tab {
    border: none;
    background: var(--color-primary-7);
    padding-inline: 1rem;
    padding-block: 0.5rem;
    color: white;
    font-family: inherit;
    position: relative;
  }
  .tab[aria-selected="true"] {
    background: var(--color-primary-6);
  }
  .tab::after {
    content: "";
    position: absolute;
    background: linear-gradient(
      80deg,
      var(--bg, var(--color-primary-7)) 33%,
      var(--gradient-slinkity)
    );
    background-size: 300% 100%;
    background-position-x: 0;
    transition: background-position-x 0.2s;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
  }
  .tab[aria-selected="true"]::after {
    background-position-x: 100%;
  }
</style>
