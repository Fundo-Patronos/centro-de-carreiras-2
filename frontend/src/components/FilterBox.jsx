import { useState, useEffect } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export default function FilterBox({ title, options, selectedItems, onSelectionChange }) {
  const [query, setQuery] = useState('')
  const [isAllSelected, setIsAllSelected] = useState(true)

  useEffect(() => {
    // Check if all items are selected
    const allSelected = options.length > 0 && options.every(option => selectedItems.includes(option))
    setIsAllSelected(allSelected)
  }, [selectedItems, options])

  const handleTodosToggle = () => {
    if (isAllSelected) {
      // Uncheck all
      onSelectionChange([])
    } else {
      // Check all
      onSelectionChange([...options])
    }
  }

  const handleItemToggle = (item) => {
    if (selectedItems.includes(item)) {
      // Remove item
      onSelectionChange(selectedItems.filter(i => i !== item))
    } else {
      // Add item
      onSelectionChange([...selectedItems, item])
    }
  }

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.toLowerCase().includes(query.toLowerCase())
        })

  // Display value shows count of selected items
  const getDisplayValue = () => {
    if (selectedItems.length === 0) {
      return 'Nenhum selecionado'
    } else if (selectedItems.length === options.length) {
      return 'Todos selecionados'
    } else if (selectedItems.length === 1) {
      return selectedItems[0]
    } else {
      return `${selectedItems.length} selecionados`
    }
  }

  return (
    <Combobox
      as="div"
      value={selectedItems}
      onChange={() => {}}
      multiple
    >
      <Label className="block text-sm/6 font-medium text-gray-900">{title}</Label>
      <div className="relative mt-2">
        <ComboboxInput
          className="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-patronos-accent sm:text-sm/6"
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery('')}
          displayValue={getDisplayValue}
          placeholder="Selecione..."
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
          <ChevronDownIcon className="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        <ComboboxOptions
          transition
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
        >
          {/* Todos option */}
          <div
            onClick={handleTodosToggle}
            className="cursor-pointer px-3 py-2 hover:bg-patronos-accent hover:bg-opacity-10 border-b border-gray-200"
          >
            <div className="flex gap-3 items-center">
              <div className="flex h-6 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => {}}
                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-patronos-accent checked:bg-patronos-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-patronos-accent forced-colors:appearance-auto pointer-events-none"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-checked:opacity-100"
                    />
                  </svg>
                </div>
              </div>
              <span className="font-semibold text-gray-900">Todos</span>
            </div>
          </div>

          {/* Individual options */}
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleItemToggle(option)}
              className="cursor-pointer px-3 py-2 hover:bg-patronos-accent hover:bg-opacity-10"
            >
              <div className="flex gap-3 items-center">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(option)}
                      onChange={() => {}}
                      className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-patronos-accent checked:bg-patronos-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-patronos-accent forced-colors:appearance-auto pointer-events-none"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-checked:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <span className="font-medium text-gray-700">{option}</span>
              </div>
            </div>
          ))}

          {filteredOptions.length === 0 && query !== '' && (
            <div className="px-3 py-2 text-gray-500 text-center">
              Nenhuma opção encontrada
            </div>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}
