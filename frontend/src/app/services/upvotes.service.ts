import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Upvote from '../models/upvote';

@Injectable({
  providedIn: 'root',
})
export class UpvotesService {
  constructor(private http: HttpClient) {}

  getUpvotesByPost(postID: string): Promise<Upvote[]> {
    return this.http.get<Upvote[]>('upvotes/posts/' + postID).toPromise();
  }

  isUpvotedBy(postID: string, voterID: string): Promise<Upvote | null> {
    return this.http
      .get<Upvote | null>('upvotes/posts/' + postID + '/users/' + voterID)
      .toPromise();
  }

  add(upvote: Upvote): Promise<any> {
    return this.http.post('upvotes/', { upvote }).toPromise();
  }

  remove(userID: string, postID: string): Promise<any> {
    return this.http
      .delete('upvotes/?user=' + userID + '&post=' + postID)
      .toPromise();
  }
}
