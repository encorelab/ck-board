import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Post from '../models/post';

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

  getAllByBoard(boardID: string, opts?: Options): Promise<Post[]> {
    let params = new HttpParams();

    if (opts) {
      params = params.append('size', opts.size);
      params = params.append('page', opts.page);
    }

    return this.http
      .get<Post[]>('posts/boards/' + boardID, { params })
      .toPromise();
  }

  create(post: Post) {
    return this.http.post<Post>('posts/', post).toPromise();
  }

  update(postID: string, value: Partial<Post>): Promise<Post> {
    return this.http.post<Post>('posts/' + postID, value).toPromise();
  }

  remove(id: string): Promise<Post> {
    return this.http.delete<Post>('posts/' + id).toPromise();
  }
}
