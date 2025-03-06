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
    return this.http
      .get<Post>('posts/' + postID)
      .toPromise()
      .then((post) => post ?? ({} as Post)); // Default to an empty object
  }

  getAll(postIDs: string[]): Promise<Post[]> {
    return this.http
      .post<Post[]>('posts/many', { postIDs })
      .toPromise()
      .then((posts) => posts ?? []); // Default to an empty array
  }

  getAllByBoard(
    boardID: string | undefined,
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
      .toPromise()
      .then((posts) => posts ?? []); // Default to an empty array
  }

  getAllByBoardNO(boardID: string, type?: PostType): Promise<Post[]> {
    let params = new HttpParams();
    if (type) {
      params = params.append('type', type);
    }

    return this.http
      .get<Post[]>('posts/boards/' + boardID, { params })
      .toPromise()
      .then((posts) => posts ?? []); // Default to an empty array
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

  create(post: Post): Promise<Post> {
    return this.http
      .post<Post>('posts/', post, {
        headers: new HttpHeaders({ timeout: `${5000}` }),
      })
      .toPromise()
      .then((newPost) => newPost ?? ({} as Post)); // Default to an empty object
  }

  update(postID: string, value: Partial<Post>): Promise<Post> {
    return this.http
      .put<Post>('posts/' + postID, value)
      .toPromise()
      .then((updatedPost) => updatedPost ?? ({} as Post)); // Default to an empty object
  }

  remove(id: string): Promise<Post> {
    return this.http
      .delete<Post>('posts/' + id)
      .toPromise()
      .then((deletedPost) => deletedPost ?? ({} as Post)); // Default to an empty object
  }
}
