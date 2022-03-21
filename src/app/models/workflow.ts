import { Board } from "./board"
import Bucket from "./bucket"

export enum WorkflowType {
  DISTRIBUTION,
  CUSTOM
}

export enum ContainerType {
  BOARD,
  BUCKET
}

export default class CustomWorkflow {
  workflowID: string
  boardID: string
  active: boolean

  name: string

  source: Container
  destination: Container

  criteria: WorkflowCriteria

  timestamp: number
}

export class DistributionWorkflow {
  workflowID: string
  boardID: string
  active: boolean

  name: string

  source: Container
  destinations: Container[]

  postsPerBucket: number

  timestamp: number
}

export class WorkflowCriteria {
  criteriaID: string
  workflowID: string

  minimumLikes: number | null
  minimumComments: number | null
  includesTags: string[] | null 
}

export class Container {
  type: ContainerType
  id: string
  name: string
}