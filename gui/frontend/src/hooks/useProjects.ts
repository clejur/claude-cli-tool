import { useState, useEffect, useCallback } from 'react'
import { ListProjects, GetStatus, AddProject, RemoveProject, StartProject, EditProject } from '../../wailsjs/go/main/App'
import type { ProjectStatus } from '../types'
import { model } from '../../wailsjs/go/models'

export function useProjects(groupFilter: string) {
  const [projects, setProjects] = useState<model.Project[]>([])
  const [statuses, setStatuses] = useState<Map<string, ProjectStatus>>(new Map())

  const refresh = useCallback(async () => {
    const list = await ListProjects(groupFilter)
    setProjects(list || [])
  }, [groupFilter])

  const refreshStatus = useCallback(async () => {
    const statusList = await GetStatus()
    const map = new Map<string, ProjectStatus>()
    if (statusList) {
      for (const s of statusList) {
        map.set(s.id, s as unknown as ProjectStatus)
      }
    }
    setStatuses(map)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 5000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const add = async (name: string, label: string, path: string, command: string, group: string) => {
    await AddProject(name, label, path, command, group)
    await refresh()
    await refreshStatus()
  }

  const remove = async (nameOrID: string) => {
    await RemoveProject(nameOrID)
    await refresh()
  }

  const start = async (nameOrID: string) => {
    await StartProject(nameOrID)
  }

  const edit = async (nameOrID: string, label?: string, path?: string, command?: string, group?: string) => {
    await EditProject(nameOrID, label ?? null, path ?? null, command ?? null, group ?? null)
    await refresh()
  }

  return { projects, statuses, refresh, add, remove, start, edit }
}
