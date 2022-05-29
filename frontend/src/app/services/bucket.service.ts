import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Bucket from '../models/bucket';

@Injectable({
  providedIn: 'root',
})
export class BucketService {
  constructor(private http: HttpClient) {}

  get(bucketID: string): Promise<any> {
    return this.http.get<any>('buckets/' + bucketID).toPromise();
  }

  getAllByBoard(boardID: string): Promise<any[]> {
    return this.http.get<any[]>('buckets/board/' + boardID).toPromise();
  }

  create(bucket: Bucket): Promise<Bucket> {
    return this.http.post<Bucket>('buckets/', bucket).toPromise();
  }

  add(bucketID: string, ...posts: string[]): Promise<Bucket> {
    return this.http
      .post<Bucket>('buckets/' + bucketID + '/add', { posts })
      .toPromise();
  }

  remove(bucketID: string, ...posts: string[]): Promise<Bucket> {
    return this.http
      .post<Bucket>('buckets/' + bucketID + '/remove', { posts })
      .toPromise();
  }

  update(bucketID: string, bucket: Partial<Bucket>) {
    return this.http.post<Bucket>('buckets/' + bucketID, bucket).toPromise();
  }

  delete(bucketID: string): Promise<Bucket> {
    return this.http.delete<Bucket>('buckets/' + bucketID).toPromise();
  }
}
