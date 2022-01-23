<script>
  export let hydrate = "none";

  let slinkDirection = "left";
  function toggleSlinkDirection() {
    if (slinkDirection === "left") {
      slinkDirection = "right";
    } else {
      slinkDirection = "left";
    }
  }
</script>

<section class="slinky__container">
  <svg
    class="slinky {slinkDirection}"
    width="250"
    height="150"
    viewBox="0 0 250 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.563L10.1157 119.517C10.0368 109.319 11.3027 99.2597 13.8018 89.5876L91.6134 110.636Z"
      fill="white"
    />
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.563L10.1157 119.517C10.0368 109.319 11.3027 99.2597 13.8018 89.5876L91.6134 110.636Z"
      fill="white"
    />
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.563L10.1157 119.517C10.0368 109.319 11.3027 99.2597 13.8018 89.5876L91.6134 110.636Z"
      fill="white"
    />
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.563L10.1157 119.517C10.0368 109.319 11.3027 99.2597 13.8018 89.5876L91.6134 110.636Z"
      fill="white"
    />
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.563L10.1157 119.517C10.0368 109.32 11.3027 99.2598 13.8018 89.5877L91.6134 110.636Z"
      fill="white"
    />
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.563L10.1157 119.517C10.0368 109.319 11.3027 99.2597 13.8018 89.5876L91.6134 110.636Z"
      fill="white"
    />
    <path
      d="M91.6134 110.636C90.8616 113.546 90.4874 116.547 90.5107 119.562L10.1157 119.517C10.0368 109.319 11.3027 99.2596 13.8018 89.5875L91.6134 110.636Z"
      fill="url(#slinky-gradient-segment)"
    />
    <defs>
      <linearGradient
        id="slinky-gradient-segment"
        x1="11.3604"
        y1="104.74"
        x2="90.1892"
        y2="114.114"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#FF01D7" />
        <stop offset="1" stop-color="#FBFF03" />
      </linearGradient>
    </defs>
  </svg>
  <!--only show our interactive button when the component is hydrated-->
  {#if hydrate !== "none"}
    <button class="slinky__button" on:click={toggleSlinkDirection}>
      {#if slinkDirection === "left"}
        <span>Move slinky right 👉</span>
      {:else}
        <span>Move slinky left 👈</span>
      {/if}
    </button>
  {/if}
</section>

<style lang="scss">
  .slinky__container {
    display: grid;
    position: relative;
    justify-content: center;
    margin-bottom: 3rem;
    background: var(--purple-2);
    padding: 1rem;
    border-radius: 0.5rem;
  }

  .slinky {
    background: var(--purple-2);
    width: 400px;
    max-width: 90vw;
    height: auto;

    path {
      animation-duration: 0.6s;
      animation-fill-mode: forwards;
      transform-origin: 50% 80%;
    }

    @for $i from 1 through 7 {
      &.right > path:nth-child(#{$i}) {
        animation-name: slinky-right-#{$i};
        @keyframes slinky-right-#{$i} {
          0% {
            transform: rotate(0);
          }
          50% {
            transform: rotate(($i - 1) * 27.5deg);
          }
          100% {
            transform: rotate(165deg);
          }
        }
      }
      &.left > path:nth-child(#{$i}) {
        animation-name: slinky-left-#{$i};
        @keyframes slinky-left-#{$i} {
          0% {
            transform: rotate(165deg);
          }
          50% {
            transform: rotate((7 - $i) * 27.5deg);
          }
          100% {
            transform: rotate(0);
          }
        }
      }
    }
  }

  .slinky__button {
    --starting-color: var(--purple-3);
    padding: 0.5rem 1rem;
    border-radius: 0.3rem;
  }
</style>
