import { Board } from "./board"
import Bucket from "./bucket"

export default class Workflow {
  workflowID: string
  boardID: string
  active: boolean

  name: string

  source: Board | Bucket
  destination: Board | Bucket
  
  criteria: WorkflowCriteria

  timestamp: number
}

export class WorkflowCriteria {
  criteriaID: string
  workflowID: string

  minimumLikes: number | null
  minimumComments: number | null
  includesTags: string[] | null 
}
