import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Project } from '../models/project';
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  projectRef: AngularFirestoreCollection<Project>;
  projectPath: string = '/projects'

  constructor(private db: AngularFirestore) { 
    this.projectRef = db.collection<Project>(this.projectPath)
  }

  observable(projectID: string, handleProjectChange: Function) {
    return this.projectRef.ref.where("projectID", "==", projectID).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          handleProjectChange(change.doc.data())
        }
      })
    })
  }

  get(projectID: string): Promise<any> {
    return this.projectRef.ref.where("projectID", "==", projectID).get().then((snapshot) => {
      if (!snapshot.empty) {
        return snapshot.docs[0].data()
      } 
      return null;
    })
  }

  getPublic() {
    return this.projectRef.ref.where("public", "==", true).get().then((snapshot) => snapshot)
  }

  getByJoinCode(code: string) {
    return this.projectRef.ref.where("joinCode", "==", code).get().then((snapshot) => snapshot)
  }

  getByUserID(id: string): Promise<any> {
    return this.projectRef.ref.where("members", "array-contains", id).get().then((snapshot) => snapshot)
  }

  getAll(): Promise<any> {
    return this.projectRef.ref.get().then((snapshot) => snapshot)
  }

  update(projectID: string, settings: any) {
    return this.projectRef.ref.doc(projectID).update(settings)
  }

  create(project: Project) {
    return this.projectRef.doc(project.projectID).set(project) 
  }

  delete(projectID: string) {
    return this.projectRef.ref.doc(projectID).delete()
  }


}
