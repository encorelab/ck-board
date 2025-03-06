// src/app/models/bucket.ts
import Post from './post'; 

export default class Bucket {
  public bucketID: string;
  public boardID: string;
  public name: string;
  public posts: string[];
  public addedToView: boolean = false;

  // Add a constructor for easier object creation
  constructor(data: Partial<Bucket>) {
    Object.assign(this, data);
  }
}