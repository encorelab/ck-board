import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Post, { PostType } from '../models/post';

export interface Options {
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

  getAllByBucket(bucketID: string, opts?: Options): Promise<any> {
    let params = new HttpParams();
    if (opts) {
      params = params.append('size', opts.size);
      params = params.append('page', opts.page);
    }

    return this.http
      .get<any>('posts/buckets/' + bucketID, { params })
      .toPromise();
  }

  create(post: Post) {
    return this.http
      .post<Post>('posts/', post, {
        headers: new HttpHeaders({ timeout: `${5000}` }),
      })
      .toPromise();
  }

  update(postID: string, value: Partial<Post>): Promise<Post> {
    return this.http.put<Post>('posts/' + postID, value).toPromise();
  }

  remove(id: string): Promise<Post> {
    return this.http.delete<Post>('posts/' + id).toPromise();
  }
}
