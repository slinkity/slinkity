import { useEffect, useState } from 'preact/hooks'

export default function useStore(store) {
  const [storeValue, setStoreValue] = useState(store.get())

  useEffect(() => {
    const unsubscribe = store.subscribe(setStoreValue)
    return unsubscribe
  }, [store])

  return storeValue
}