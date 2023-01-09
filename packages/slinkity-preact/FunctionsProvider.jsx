import { FunctionsContext } from './server.jsx'

export default function FunctionsProvider({ javascriptFunctions, children }) {
  return (
    <FunctionsContext.Provider value={javascriptFunctions}>{children}</FunctionsContext.Provider>
  )
}
