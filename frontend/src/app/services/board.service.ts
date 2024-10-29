import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Board } from '../models/board';
import { FileUploadService } from './fileUpload.service';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  constructor(
    private http: HttpClient,
    private fileUploadService: FileUploadService
  ) {}

  // Return a Promise that resolves to either a Board or undefined
  get(boardID: string): Promise<Board | undefined> {
    return this.http
      .get<Board>('boards/' + boardID)
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  // Return a Promise that resolves to either an array of Board or undefined
  getByProject(projectID: string): Promise<Board[] | undefined> {
    return this.http
      .get<Board[]>('boards/projects/' + projectID)
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  // Return a Promise that resolves to either a Board or undefined
  getPersonal(projectID: string): Promise<Board | undefined> {
    return this.http
      .get<Board>('boards/personal/' + projectID)
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  getAllPersonal(projectID: string): Promise<Board[] | undefined> {
    return this.http
      .get<Board[]>('boards/personal/all/' + projectID)
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  getMultipleBy(
    ids: string[],
    filter?: Partial<Board>
  ): Promise<Board[] | undefined> {
    return this.http
      .post<Board[]>('boards/multiple/', { ids, filter })
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  update(boardID: string, board: Partial<Board>): Promise<Board | undefined> {
    return this.http
      .post<Board>('boards/' + boardID, board)
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  create(board: Board): Promise<Board | undefined> {
    return this.http
      .post<Board>('boards/', board)
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }

  remove(id: string): Promise<Board | undefined> {
    return this.http
      .get<Board>('boards/' + id) // First, get the board details to check for background image
      .toPromise()
      .then((board) => {
        if (board?.bgImage?.url) {
          // Check if the board has a background image
          const url = board.bgImage.url;
          const imageId: string = url.split('/').pop() || '';

          return this.fileUploadService
            .deleteImage(imageId)
            .toPromise() // Delete the background image
            .then(() => {
              return this.http.delete<Board>('boards/' + id).toPromise(); // Delete the board
            });
        } else {
          return this.http.delete<Board>('boards/' + id).toPromise(); // No background image, just delete the board
        }
      })
      .catch(() => undefined); // Handle undefined case
  }

  copyConfiguration(boardID: string, boards: string[]): Promise<any> {
    return this.http
      .post<any>(`boards/${boardID}/copy-configuration/`, { boards })
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }
}
