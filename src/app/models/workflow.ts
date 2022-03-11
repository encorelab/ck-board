import { Board } from "./board"
import Bucket from "./bucket"

export enum WorkflowType {
  DISTRIBUTION,
  CUSTOM
}

export default class CustomWorkflow {
  workflowID: string
  boardID: string
  active: boolean

  name: string

  source: Board | Bucket
  destination: Board | Bucket
  criteria: WorkflowCriteria

  timestamp: number
}

export class DistributionWorkflow {
  workflowID: string
  boardID: string
  active: boolean

  name: string

  source: Board | Bucket
  destinations: (Board | Bucket)[]
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
