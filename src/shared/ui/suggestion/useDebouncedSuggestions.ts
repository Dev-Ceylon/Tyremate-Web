import { useCallback, useEffect, useRef, useState } from "react"

type UseDebouncedSuggestionsOptions = {
  delay?: number
  minLength?: number
}

export function useDebouncedSuggestions(
  fetchFn: (query: string) => Promise<string[]>,
  options?: UseDebouncedSuggestionsOptions,
) {
  const delay = options?.delay ?? 300
  const minLength = options?.minLength ?? 2

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(0)
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const fetchSuggestions = useCallback(
    async (value: string) => {
      if (value.length < minLength) {
        setSuggestions([])
        setLoading(false)
        return
      }

      const requestId = ++abortRef.current
      setLoading(true)

      try {
        const results = await fetchFnRef.current(value)
        if (requestId === abortRef.current) {
          setSuggestions(results)
        }
      } catch {
        if (requestId === abortRef.current) {
          setSuggestions([])
        }
      } finally {
        if (requestId === abortRef.current) {
          setLoading(false)
        }
      }
    },
    [minLength],
  )

  useEffect(() => {
    if (query.length < minLength) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const timer = setTimeout(() => {
      void fetchSuggestions(query)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [query, delay, minLength, fetchSuggestions])

  return { query, setQuery, suggestions, loading }
}
