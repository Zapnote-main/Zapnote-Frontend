'use client'

import * as React from 'react'
import { AnimatePresence, motion, type Transition } from 'motion/react'
import { cn } from '@/src/lib/utils'


type MotionHighlightMode = 'children' | 'parent'

type Bounds = {
  top: number
  left: number
  width: number
  height: number
}

type MotionHighlightContextType<T extends string> = {
  mode: MotionHighlightMode
  activeValue: T | null
  setActiveValue: (value: T | null) => void
  setBounds: (bounds: DOMRect) => void
  clearBounds: () => void
  id: string
  hover: boolean
  className?: string
  activeClassName?: string
  setActiveClassName: (className: string) => void
  transition?: Transition
  disabled?: boolean
  enabled?: boolean
  exitDelay?: number
  forceUpdateBounds?: boolean
}

const MotionHighlightContext =
  React.createContext<MotionHighlightContextType<any> | undefined>(undefined)

function useMotionHighlight<T extends string>() {
  const ctx = React.useContext(MotionHighlightContext)
  if (!ctx) {
    throw new Error('useMotionHighlight must be used inside MotionHighlight')
  }
  return ctx as MotionHighlightContextType<T>
}


type BaseProps<T extends string> = {
  mode?: MotionHighlightMode
  value?: T | null
  defaultValue?: T | null
  onValueChange?: (value: T | null) => void
  className?: string
  transition?: Transition
  hover?: boolean
  disabled?: boolean
  enabled?: boolean
  exitDelay?: number
}

type ParentModeProps = {
  boundsOffset?: Partial<Bounds>
  containerClassName?: string
  forceUpdateBounds?: boolean
}

type MotionHighlightProps<T extends string> =
  React.HTMLAttributes<HTMLDivElement> &
    BaseProps<T> &
    Partial<ParentModeProps> & {
      controlledItems?: boolean
      itemsClassName?: string
    }

const MotionHighlight = React.forwardRef<
  HTMLDivElement,
  MotionHighlightProps<any>
>(function MotionHighlight<T extends string>(
  props: MotionHighlightProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    className,
    transition = { type: 'spring', stiffness: 350, damping: 35 },
    hover = false,
    enabled = true,
    controlledItems = false,
    disabled = false,
    exitDelay = 0.2,
    mode = 'children'
  } = props

  const localRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => localRef.current!)

  const [activeValue, setActiveValue] = React.useState<any>(
    value ?? defaultValue ?? null
  )
  const [bounds, setBoundsState] = React.useState<Bounds | null>(null)
  const [activeClassName, setActiveClassName] = React.useState('')

  const safeSetActiveValue = React.useCallback(
    (v: any | null) => {
      setActiveValue((prev: any) => {
        if (prev !== v) onValueChange?.(v)
        return v
      })
    },
    [onValueChange]
  )

  const setBounds = React.useCallback(
    (rect: DOMRect) => {
      if (!localRef.current) return

      const container = localRef.current.getBoundingClientRect()
      const offset = props.boundsOffset ?? {}

      setBoundsState({
        top: rect.top - container.top + (offset.top ?? 0),
        left: rect.left - container.left + (offset.left ?? 0),
        width: rect.width + (offset.width ?? 0),
        height: rect.height + (offset.height ?? 0)
      })
    },
    [props.boundsOffset]
  )

  const clearBounds = React.useCallback(() => {
    setBoundsState(null)
  }, [])

  React.useEffect(() => {
    if (value !== undefined) setActiveValue(value)
  }, [value])

  const id = React.useId()

  const content =
    !enabled || controlledItems
      ? children
      : React.Children.map(children as any, child => (
          <MotionHighlightItem>{child}</MotionHighlightItem>
        ))

  return (
    <MotionHighlightContext.Provider
      value={{
        mode,
        activeValue,
        setActiveValue: safeSetActiveValue,
        setBounds,
        clearBounds,
        id,
        hover,
        className,
        transition,
        disabled,
        enabled,
        exitDelay,
        activeClassName,
        setActiveClassName,
        forceUpdateBounds: props.forceUpdateBounds
      }}
    >
      {mode === 'parent' ? (
        <div
          ref={localRef}
          className={cn('relative', props.containerClassName)}
        >
          <AnimatePresence initial={false}>
            {bounds && (
              <motion.div
                className={cn(
                  'absolute z-0 bg-muted',
                  className,
                  activeClassName
                )}
                animate={bounds}
                initial={{ ...bounds, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={transition}
              />
            )}
          </AnimatePresence>
          {content}
        </div>
      ) : (
        content
      )}
    </MotionHighlightContext.Provider>
  )
})



type MotionHighlightItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  activeClassName?: string
  disabled?: boolean
  asChild?: boolean
}

const MotionHighlightItem = React.forwardRef<
  HTMLDivElement,
  MotionHighlightItemProps
>(function MotionHighlightItem(
  { children, value, className, disabled, activeClassName, ...props },
  ref
) {
  const localRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => localRef.current!)

  const {
    activeValue,
    setActiveValue,
    mode,
    setBounds,
    clearBounds,
    hover,
    transition,
    exitDelay,
    id: contextId,
    className: ctxClassName,
    setActiveClassName
  } = useMotionHighlight<string>()

  const itemValue = value ?? React.useId()
  const isActive = activeValue === itemValue

  React.useEffect(() => {
    if (mode !== 'parent') return
    if (!localRef.current) return

    if (isActive) {
      setBounds(localRef.current.getBoundingClientRect())
      setActiveClassName(activeClassName ?? '')
    } else {
      clearBounds()
    }
  }, [isActive, mode])

  const handlers = hover
    ? {
        onMouseEnter: () => setActiveValue(itemValue),
        onMouseLeave: () => setActiveValue(null)
      }
    : {
        onClick: () => setActiveValue(itemValue)
      }

  return (
    <div
      ref={localRef}
      className={cn('relative', className)}
      data-value={itemValue}
      {...handlers}
      {...props}
    >
      {mode === 'children' && (
        <AnimatePresence>
          {isActive && !disabled && (
            <motion.div
              layoutId={`highlight-${contextId}`}
              className={cn(
                'absolute inset-0 bg-muted z-0',
                ctxClassName,
                activeClassName
              )}
              transition={transition}
              exit={{
                opacity: 0,
                transition: { delay: exitDelay }
              }}
            />
          )}
        </AnimatePresence>
      )}

      <div className='relative z-10'>{children}</div>
    </div>
  )
})


export {
  MotionHighlight,
  MotionHighlightItem,
  useMotionHighlight,
  type MotionHighlightProps,
  type MotionHighlightItemProps
}
