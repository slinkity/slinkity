<script>
  export let tabs = [];
  let currentTabIdx = 0;
  let buttonContainer;
  let tabPanels;

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
    if (buttonContainer && tabPanels) {
      const currButton = buttonContainer.querySelector(
        `button:nth-child(${newTabIdx + 1}`
      );
      currButton.focus();

      const panels = tabPanels.querySelector("slinkity-fragment").children;
      const currPanel = panels[newTabIdx];
      for (const panel of panels) {
        panel.setAttribute("hidden", "");
      }
      currPanel.removeAttribute("hidden");
    }
  }
</script>

<h2>Hey!</h2>
<div bind:this={buttonContainer}>
  {#each tabs as tab, idx}
    <button
      aria-current={idx === currentTabIdx}
      on:keydown={moveFocus}
      on:click={() => (currentTabIdx = idx)}>{tab}</button
    >
  {/each}
</div>
<div bind:this={tabPanels}>
  <slot />
</div>
