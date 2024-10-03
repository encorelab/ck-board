import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Upvote from '../models/upvote';
import { SocketService } from './socket.service';
import { SocketEvent } from '../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class UpvotesService {
  constructor(private http: HttpClient, private socketService: SocketService) {}

  getUpvotesByPost(
    postID: string,
    representation = 'default'
  ): Promise<Upvote[]> {
    return this.http
      .get<Upvote[]>(
        'upvotes/posts/' + postID + '?representation=' + representation
      )
      .toPromise()
      .then((upvotes) => upvotes ?? []); // Default to an empty array
  }

  getByBoard(boardID: string): Promise<Upvote[]> {
    return this.http
      .get<Upvote[]>('upvotes/board/' + boardID)
      .toPromise()
      .then((upvotes) => upvotes ?? []); // Default to an empty array
  }

  getByBoardAndUser(boardID: string, userID: string): Promise<Upvote[]> {
    return this.http
      .get<Upvote[]>('upvotes/boards/' + boardID + '/users/' + userID)
      .toPromise()
      .then((upvotes) => upvotes ?? []); // Default to an empty array
  }

  isUpvotedBy(postID: string, voterID: string): Promise<Upvote | null> {
    return this.http
      .get<Upvote | null>('upvotes/posts/' + postID + '/users/' + voterID)
      .toPromise()
      .then((upvote) => upvote ?? null); // Default to null
  }

  add(upvote: Upvote): Promise<any> {
    return this.http.post('upvotes/', { upvote }).toPromise();
  }

  remove(userID: string, postID: string): Promise<any> {
    return this.http
      .delete('upvotes/?user=' + userID + '&post=' + postID)
      .toPromise();
  }

  async removeByBoard(boardID: string) {
    const deletedVotes = await this.getByBoard(boardID);
    await this.http.delete('upvotes/board/' + boardID).toPromise();
    this.socketService.emit(SocketEvent.VOTES_CLEAR, deletedVotes);
  }
}
