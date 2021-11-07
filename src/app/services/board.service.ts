import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Board } from '../models/board';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  boardRef: AngularFirestoreCollection<Board>;
  boardPath: string = '/boards'

  constructor(private db: AngularFirestore) {
    this.boardRef = db.collection<Board>(this.boardPath)
  }

  observable(boardID: string, handleBoardChange: Function) {
    return this.boardRef.ref.where("boardID", "==", boardID).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          handleBoardChange(change.doc.data())
        }
      })
    })
  }

  get(boardID: string): Promise<any> {
    return this.boardRef.ref.where("boardID", "==", boardID).get().then((snapshot) => {
      if (!snapshot.empty) {
        return snapshot.docs[0].data()
      } 
      return null;
    })
  }

  getAll(): Promise<any> {
    return this.boardRef.ref.get().then((snapshot) => snapshot)
  }

  update(boardID: string, settings: any) {
    return this.boardRef.ref.doc(boardID).update(settings)
  }

  create(board: Board) {
    return this.boardRef.doc(board.boardID).set(board) 
  }

  delete(boardID: string) {
    return this.boardRef.ref.doc(boardID).delete()
  }
}