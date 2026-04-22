export type ParameterType = 'select' | 'radio' | 'switch' | 'text' | 'number'
export type ModalityType = 'image' | 'video' | 'text' | 'audio'
export type InputType = 'text' | 'image' | 'video' | 'audio'

export interface ParameterOption {
  label: string
  value: string | number | boolean
}

export interface ModelParameter {
  key: string
  label: string
  type: ParameterType
  options?: ParameterOption[]
  default: string | number | boolean
  showIf?: { field: string; equals: string | number | boolean }
}

export interface ModelApiIds {
  modelNo: string
  modelVerNo: string
  playRuleId: string
}

export interface PlayRule {
  label: string
  inputs: InputType[]
  apiIds: ModelApiIds
  parameters: ModelParameter[]
  payloadTemplate: Record<string, unknown>
}

export interface ModelSchema {
  modelName: string
  type: ModalityType
  plays: PlayRule[]
}

export type ModelSchemaMap = Record<string, ModelSchema>
