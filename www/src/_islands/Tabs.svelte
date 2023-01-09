<script>
  import { currentTabIdx } from "./currentTabStore.js";

  /** Labels for each tab button */
  export let tabs = [];
  /** generates tab and tab panel IDs. A unique ID is recommended! */
  export let id = "tabs";
  /** a custom store ID to use for sharing tab indexes across tab views */
  export let store = "default";

  let tabEl;
  let tabPanelEl;

  $: tabPanels = tabPanelEl?.children;
  $: tabIdx = $currentTabIdx[store] ?? 0;
  $: setTabPanelAttrs(tabPanels, tabIdx);

  function updateTabIdx(newTabIdx) {
    currentTabIdx.update((tabIdxStore) => ({
      ...tabIdxStore,
      [store]: newTabIdx,
    }));
  }

  function setTabPanelAttrs(currentTabPanels, currentTabIdx) {
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
    let newTabIdx = tabIdx;
    if (event.key === "ArrowLeft" && tabIdx > 0) {
      newTabIdx -= 1;
    } else if (event.key === "ArrowRight" && tabIdx < tabs.length - 1) {
      newTabIdx += 1;
    }
    const currButton = tabEl.querySelector(`button:nth-child(${newTabIdx + 1}`);
    currButton.focus();
    updateTabIdx(newTabIdx);
  }
</script>

<div role="tablist" class="tabs" bind:this={tabEl} on:keydown={moveFocus}>
  {#each tabs as tab, idx}
    <button
      class="tab"
      aria-controls={toTabPanelId(idx)}
      id={toTabId(idx)}
      aria-selected={idx === tabIdx}
      tabindex={idx === tabIdx ? "0" : "-1"}
      role="tab"
      type="button"
      on:click={() => updateTabIdx(idx)}>{tab}</button
    >
  {/each}
</div>
<div bind:this={tabPanelEl}>
  <slot />
</div>

<style lang="scss">
  @mixin focus-ring {
    outline: 1px solid var(--color-accent-5);
    outline-offset: -1px;
  }

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
    cursor: pointer;

    &:focus-visible {
      @include focus-ring;
    }

    &[aria-selected="true"] {
      background: var(--color-primary-6);
      @media (forced-colors: active) {
        @include focus-ring;
      }
    }
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
