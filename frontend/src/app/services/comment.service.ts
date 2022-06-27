import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Comment from '../models/comment';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private http: HttpClient) {}

  getCommentsByPost(postID: string): Promise<Comment[]> {
    return this.http.get<Comment[]>('comments/posts/' + postID).toPromise();
  }

  add(comment: Comment): any {
    return this.http.post('comments/', { comment }).toPromise();
  }
}
