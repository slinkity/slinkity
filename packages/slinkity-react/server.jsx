import { useContext, Fragment, createContext } from 'react'
import { renderToString } from 'react-dom/server'

export const FunctionsContext = createContext(null)

export function useFunctions() {
  const ctx = useContext(FunctionsContext)
  if (ctx === null) {
    // TODO: figure out bubbling to Vite error overlay
    throw new Error(
      "Oop, looks like you're accessing shortcodes or filters on the client! Functions are only supported in server-only islands.",
    )
  }
  return ctx
}

export function Shortcode({ name, args, children }) {
  const functions = useFunctions()
  const fn = functions[name]
  if (!fn) {
    throw new Error(`${JSON.stringify(name)} is not a shortcode or paired shortcode.`)
  }
  if (children) {
    const stringifiedChildren = renderToString(React.createElement(Fragment, {}, children))
    args = [stringifiedChildren, ...args]
  }
  return <slinkity-shortcode dangerouslySetInnerHTML={{ __html: fn(...args) }}></slinkity-shortcode>
}

export function Island({ name, on = 'load', props = {} }) {
  const propFn = useFunctions().prop
  let stringifiedPropComments = ''
  for (const propName in props) {
    stringifiedPropComments += propFn(propName, props[propName])
  }
  const loadConditions = Array.isArray(on)
    ? on.map((loadCondition) => `on:${loadCondition}`)
    : [`on:${on}`]
  return <Shortcode name="island" args={[stringifiedPropComments, name, ...loadConditions]} />
}
