import { useCallback, useEffect, useRef, useState } from "react"
import { useDebouncedSuggestions } from "./useDebouncedSuggestions"

type SuggestionInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  fetchSuggestions: (query: string) => Promise<string[]>
  placeholder?: string
  className?: string
  disabled?: boolean
  hideLabel?: boolean
  required?: boolean
}

export function SuggestionInput({
  label,
  value,
  onChange,
  fetchSuggestions,
  placeholder,
  className = "text-input",
  disabled = false,
  hideLabel = false,
  required = false,
}: SuggestionInputProps) {
  const { query, setQuery, suggestions } = useDebouncedSuggestions(fetchSuggestions)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDropdown) return

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDropdown])

  useEffect(() => {
    if (suggestions.length === 0) {
      setActiveIndex(-1)
    } else if (activeIndex >= suggestions.length) {
      setActiveIndex(suggestions.length - 1)
    }
  }, [suggestions.length, activeIndex])

  const handleSelect = useCallback(
    (item: string) => {
      onChange(item)
      setQuery("")
      setShowDropdown(false)
      setActiveIndex(-1)
    },
    [onChange, setQuery],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || suggestions.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault()
        handleSelect(suggestions[activeIndex])
      } else if (e.key === "Escape") {
        setShowDropdown(false)
        setActiveIndex(-1)
      }
    },
    [showDropdown, suggestions, activeIndex, handleSelect],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      setQuery(newValue)
      setShowDropdown(true)
      setActiveIndex(-1)
    },
    [onChange, setQuery],
  )

  const showDropdownItems = showDropdown && query.length >= 2 && suggestions.length > 0

  const inputElement = (
    <input
      className={className}
      value={value ?? ""}
      onChange={handleChange}
      onFocus={() => {
        if (query.length >= 2 && suggestions.length > 0) setShowDropdown(true)
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete="off"
    />
  )

  return (
    <div className="suggestion-input-wrapper" ref={wrapperRef}>
      {hideLabel ? (
        inputElement
      ) : (
        <label className="field-label">
          {label}
          {inputElement}
        </label>
      )}
      {showDropdownItems && (
        <div className="suggestion-dropdown">
          {suggestions.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={`suggestion-item ${index === activeIndex ? "suggestion-item-active" : ""}`}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
