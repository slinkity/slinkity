/*
- ✅ = Ready to use
- ⏺ = Partial support
- ⏳ = In progress
- ❌ = Not started, but on roadmap
*/
const EMOJI_KEY = {
  '✅': 'Ready to use',
  '⏺': 'Partial support',
  '⏳': 'In progress',
  '❌': 'Not started, but on roadmap',
}

/**
 * Adds visually-hidden text describing a feature's progress in text,
 * so screen reader users don't need to navigate to the emoji key.
 * @param {string} emoji an emoji corresponding to a feature progress status in the key
 * @returns {string} HTML string containing a screen reader-friendly label
 */
module.exports = function convertEmojiToAccessibleProgress(emoji) {
  // Emoji is not defined in the key
  if (!EMOJI_KEY[emoji]) {
    const validEmojis = Object.keys(EMOJI_KEY).join(', ')
    console.warn(
      `"${emoji}" is not in the feature progress emoji key yet. Valid emojis are ${validEmojis}. Consider adding ${emoji} to the key.`,
    )
    return emoji
  }

  const screenReaderNode = `<span class="sr-only"> ${EMOJI_KEY[emoji]}</span>`
  return `${emoji}${screenReaderNode}`
}
