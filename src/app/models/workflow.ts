export default class Workflow {
  workflowID: string
  boardID: string

  name: string

  source: string
  destination: string
  
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
