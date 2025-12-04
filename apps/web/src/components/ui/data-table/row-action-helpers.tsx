import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { RowAction } from './data-table-row-actions'

// Helper functions to create common actions
export function createViewAction(onClick: () => void): RowAction {
  return {
    label: 'View',
    icon: <Eye size={16} />,
    onClick,
  }
}

export function createEditAction(onClick: () => void): RowAction {
  return {
    label: 'Edit',
    icon: <Pencil size={16} />,
    onClick,
  }
}

export function createDeleteAction(onClick: () => void): RowAction {
  return {
    label: 'Delete',
    icon: <Trash2 size={16} />,
    onClick,
    variant: 'destructive',
  }
}
