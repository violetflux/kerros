/**
 * Minimal segmented control used by the homepage install switcher.
 *
 * Semantics: ARIA radiogroup with roving tabindex. Left/Right arrow keys
 * (plus Home/End) move and select the neighbouring option, matching the
 * WAI-ARIA radio group pattern. The selection thumb is a shared
 * `layoutId` motion element that slides between options; under
 * `prefers-reduced-motion` the slide collapses to an instant swap.
 */
import { motion, useReducedMotion } from 'motion/react'
import { useRef, type KeyboardEvent } from 'react'
import { cn } from '../lib/utils'

export interface SegmentedOption {
  value: string
  label: string
}

export interface SegmentedProps {
  /** Accessible name for the radiogroup */
  ariaLabel: string
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export function Segmented({ ariaLabel, options, value, onChange, className }: SegmentedProps) {
  const reduceMotion = useReducedMotion()
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const currentIndex = options.findIndex(option => option.value === value)

  const selectIndex = (index: number) => {
    const next = options[index]
    if (!next)
      return
    onChange(next.value)
    itemRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // When the external value matches no option, fall back to the first
    // option so the radiogroup stays keyboard reachable.
    const base = currentIndex < 0 ? 0 : currentIndex

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      selectIndex((base + 1) % options.length)
    }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      selectIndex((base - 1 + options.length) % options.length)
    }
    else if (event.key === 'Home') {
      event.preventDefault()
      selectIndex(0)
    }
    else if (event.key === 'End') {
      event.preventDefault()
      selectIndex(options.length - 1)
    }
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn('inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border-strong bg-card p-1', className)}
      onKeyDown={handleKeyDown}
      role="radiogroup"
    >
      {options.map((option, index) => {
        const checked = option.value === value

        return (
          <button
            aria-checked={checked}
            className={cn(
              'relative shrink-0 rounded-full px-4 py-2 font-mono text-sm font-semibold transition-colors motion-reduce:transition-none',
              checked ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              FOCUS_RING,
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            ref={(element) => {
              itemRefs.current[index] = element
            }}
            role="radio"
            tabIndex={checked || (currentIndex < 0 && index === 0) ? 0 : -1}
            type="button"
          >
            {checked && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary"
                layoutId="kerros-install-switcher-thumb"
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
