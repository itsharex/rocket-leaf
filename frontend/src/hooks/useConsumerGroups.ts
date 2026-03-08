import { useState, useEffect, useCallback } from 'react'
import type { ConsumerGroupItem } from '../../bindings/rocket-leaf/internal/model/models.js'
import * as consumerApi from '@/api/consumer'

export function useConsumerGroups() {
  const [list, setList] = useState<(ConsumerGroupItem | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await consumerApi.getConsumerGroups()
      setList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { list: list.filter(Boolean) as ConsumerGroupItem[], loading, error, refresh }
}
