import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import Bucket from '../models/bucket';
import Post from '../models/post';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root'
})
export class BucketService {

  private bucketsPath : string = 'buckets';
  bucketsCollection: AngularFirestoreCollection<Bucket>;

  constructor(db: AngularFirestore, private postService: PostService) {
    this.bucketsCollection = db.collection<Bucket>(this.bucketsPath)
  }

  get(bucketID: string) {
    return this.bucketsCollection.ref.where("bucketID", "==", bucketID).get().then((data) => {
        let rawBucket: Bucket

        if (!data.empty) {
            rawBucket = data.docs[0].data()
            return this.parsePosts(rawBucket.posts).then(posts => {
                const bucket = {
                    bucketID: rawBucket.bucketID,
                    boardID: rawBucket.boardID,
                    name: rawBucket.name,
                    posts: posts
                }
                return bucket
            })
        } 

        return null
    })
  }

  getAllByBoard(boardID: string): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
        let buckets: any[] = []

        this.bucketsCollection.ref.where("boardID", "==", boardID).get().then(async (data) => {
            if (!data.empty) {
                for (const rawBucket of data.docs) {
                    let bucket: any = rawBucket.data()
                    const parsedPosts = await this.parsePosts(bucket.posts)
                    const parsedBucket = {
                        bucketID: bucket.bucketID,
                        boardID: bucket.boardID,
                        name: bucket.name,
                        posts: parsedPosts
                    }
                    buckets.push(parsedBucket)
                }
                resolve(buckets)
            } else {
                resolve([])
            }
        })
    })
  }

  create(bucket: Bucket): any {
    return this.bucketsCollection.doc(bucket.bucketID).set(bucket)
  }

  update(bucketID: string, value: any) {
    return this.bucketsCollection.ref.doc(bucketID).update(value)
  }

  delete(bucketID: string) {
    return this.bucketsCollection.ref.doc(bucketID).delete()
  }

  private async parsePosts(postIDs: string[]) {
    return new Promise<Post[]>((resolve, reject) => {
        let posts: Post[] = []

        if (postIDs.length > 0) {
            postIDs.forEach((postID, index, arr) => {
                this.postService.get(postID).then((value) => {
                    if (!value.empty) {
                        var post = value.docs[0].data()
                        posts.push(post)
                    }
                    if (index == arr.length - 1) {
                        posts.sort((a, b) => a.timestamp - b.timestamp)
                        resolve(posts)
                    }
                }).catch(_err => reject())
            })
        } else {
            resolve(posts)
        }
      });    
  }
}