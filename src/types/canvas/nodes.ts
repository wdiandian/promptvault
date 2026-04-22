import type { ModalityType } from './schema'

export interface ImageNodeData extends Record<string, unknown> {
  modelId: string
  activePlay: number
  prompt: string
  params: Record<string, string>
  imageUrls?: string[]
  isGenerating?: boolean
}

export interface VideoNodeData extends Record<string, unknown> {
  modelId: string
  activePlay: number
  prompt: string
  params: Record<string, string>
  videoUrl?: string
  isGenerating?: boolean
}

export interface HandleMeta {
  id: string
  dataType: ModalityType | 'text'
  label: string
}
