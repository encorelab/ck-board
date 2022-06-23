import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Like from '../models/like';

@Injectable({
  providedIn: 'root',
})
export class LikesService {
  constructor(private http: HttpClient) {}

  getLikesByPost(postID: string): Promise<Like[]> {
    return this.http.get<Like[]>('likes/posts/' + postID).toPromise();
  }

  isLikedBy(postID: string, likerID: string): Promise<Like | null> {
    return this.http
      .get<Like | null>('likes/posts/' + postID + '/users/' + likerID)
      .toPromise();
  }

  add(like: Like): Promise<any> {
    return this.http.post('likes/', { like }).toPromise();
  }

  remove(userID: string, postID: string): Promise<any> {
    return this.http
      .delete('likes/?user=' + userID + '&post=' + postID)
      .toPromise();
  }
}
