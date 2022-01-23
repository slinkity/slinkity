import React from 'react'
import '/@root/styles/slinky.scss'
// woah, what's that /@root doing here?
// see our "import alias" docs to learn more!
// https://slinkity.dev/docs/import-aliases/

export default function SpinningLogo({ hydrate = 'none' }) {
  const [slinkDirection, setSlinkDirection] = React.useState('left')

  function toggleSlinkDirection() {
    if (slinkDirection === 'left') {
      setSlinkDirection('right')
    } else {
      setSlinkDirection('left')
    }
  }

  return (
    <section className="slinky__container">
      <svg
        className={`slinky ${slinkDirection}`}
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
            <stop stopColor="#FF01D7" />
            <stop offset="1" stopColor="#FBFF03" />
          </linearGradient>
        </defs>
      </svg>
      {hydrate !== 'none' ? (
        <button className="slinky__button" onClick={toggleSlinkDirection}>
          {slinkDirection === 'left' ? 'Move slinky right 👉' : 'Move slinky left 👈'}
        </button>
      ) : null}
    </section>
  )
}
