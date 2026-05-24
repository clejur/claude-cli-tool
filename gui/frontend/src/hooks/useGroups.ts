import { useState, useEffect, useCallback } from 'react'
import { ListGroups, AddGroup, RemoveGroup } from '../../wailsjs/go/main/App'

export function useGroups() {
  const [groups, setGroups] = useState<string[]>([])

  const refresh = useCallback(async () => {
    const list = await ListGroups()
    setGroups(list || [])
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = async (name: string) => {
    await AddGroup(name)
    await refresh()
  }

  const remove = async (name: string) => {
    await RemoveGroup(name)
    await refresh()
  }

  return { groups, refresh, add, remove }
}
