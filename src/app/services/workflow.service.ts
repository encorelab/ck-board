import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Like from '../models/like';
import Workflow from '../models/workflow';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {

  private workflowPath : string = 'workflows';
  workflowCollection: AngularFirestoreCollection<Workflow>;

  constructor(private db: AngularFirestore) {
    this.workflowCollection = db.collection<Workflow>(this.workflowPath);
  }

  create(workflow: Workflow): Promise<void> {
    return this.workflowCollection.doc(workflow.workflowID).set(workflow)
  }

  remove(workflowID: string): Promise<void> {
    return this.workflowCollection.ref.doc(workflowID).delete()
  }
}