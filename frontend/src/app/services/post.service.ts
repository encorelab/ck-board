import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Post, { PostType } from '../models/post';

interface Options {
  size: number;
  page: number;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(public http: HttpClient) {}

  get(postID: string): Promise<Post> {
    return this.http.get<Post>('posts/' + postID).toPromise();
  }

  getAll(postIDs: string[]): Promise<Post[]> {
    return this.http.post<Post[]>('posts/many', { postIDs }).toPromise();
  }

  getAllByBoard(
    boardID: string,
    opts?: Options,
    type?: PostType
  ): Promise<Post[]> {
    let params = new HttpParams();
    if (opts) {
      params = params.append('size', opts.size);
      params = params.append('page', opts.page);
    }
    if (type) {
      params = params.append('type', type);
    }

    return this.http
      .get<Post[]>('posts/boards/' + boardID, { params })
      .toPromise();
  }

  create(post: Post) {
    return this.http.post<Post>('posts/', post).toPromise();
  }

  update(postID: string, value: Partial<Post>): Promise<Post> {
    return this.http.put<Post>('posts/' + postID, value).toPromise();
  }

  remove(id: string): Promise<Post> {
    return this.http.delete<Post>('posts/' + id).toPromise();
  }
}
