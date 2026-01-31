import { describe, it, expect } from 'vitest'
import { cn } from '~/lib/utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles array inputs', () => {
    expect(cn(['px-2', 'py-2'])).toBe('px-2 py-2')
  })

  it('handles object inputs with boolean values', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
  })

  it('merges complex Tailwind classes correctly', () => {
    expect(cn('text-sm font-bold', 'text-lg')).toBe('font-bold text-lg')
  })
})
