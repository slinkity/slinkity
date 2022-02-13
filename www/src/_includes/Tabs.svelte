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

<div bind:this={tabEl} on:keydown={moveFocus}>
  {#each tabs as tab, idx}
    <button
      aria-controls={toTabPanelId(idx)}
      id={toTabId(idx)}
      aria-current={idx === currentTabIdx}
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
