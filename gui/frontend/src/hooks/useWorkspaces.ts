import { useState, useEffect, useCallback } from 'react'
import { ListWorkspaces, SaveWorkspace, RestoreWorkspace, RemoveWorkspace } from '../../wailsjs/go/main/App'
import { model } from '../../wailsjs/go/models'

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<model.Workspace[]>([])

  const refresh = useCallback(async () => {
    const list = await ListWorkspaces()
    setWorkspaces(list || [])
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = async (name: string, projectNames: string[]) => {
    await SaveWorkspace(name, projectNames)
    await refresh()
  }

  const restore = async (name: string) => {
    await RestoreWorkspace(name)
  }

  const remove = async (name: string) => {
    await RemoveWorkspace(name)
    await refresh()
  }

  return { workspaces, refresh, save, restore, remove }
}
