'use client'

import { useEffect, useState } from 'react'

export interface Category {
  id: string
  type: string
  value: string
  label: string
  color: string
  icon: string | null
  active: boolean
  isSystem: boolean
  sortOrder: number
}

/**
 * Fetch categories for a given type from the API.
 * Returns { categories, loading }.
 * Re-fetches when `type` changes.
 */
export function useCategories(type: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/categories?type=${encodeURIComponent(type)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setCategories(d.categories || []) })
      .catch(() => { if (!cancelled) setCategories([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [type])

  return { categories, loading }
}
