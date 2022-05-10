import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { HTMLPost } from '../components/html-post/html-post.component';
import Post from '../models/post';
import { FabricUtils } from '../utils/FabricUtils';
import { BoardService } from './board.service';
import { CommentService } from './comment.service';
import { LikesService } from './likes.service';
import { UserService } from './user.service';

interface Options {
  size: number;
  page: number;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private postsPath: string = '/posts';
  postsCollection: AngularFirestoreCollection<Post>;

  constructor(
    private db: AngularFirestore,
    protected fabricUtils: FabricUtils,
    private userService: UserService,
    private boardService: BoardService,
    private likeService: LikesService,
    private commentService: CommentService,
    public http: HttpClient
  ) {
    this.postsCollection = db.collection<Post>(this.postsPath);
  }

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

  cloneMany(boardID: string, posts: any[]): Promise<void> {
    const batch = this.db.firestore.batch();
    posts.forEach((post) => {
      const newID = Date.now() + '-' + boardID;

      post.fabricObject = this.fabricUtils.clonePost(post, newID);
      post.boardID = boardID;
      post.postID = newID;
      post.tags = [];

      batch.set(this.db.firestore.doc(`${this.postsPath}/${newID}`), post);
    });

    return batch.commit();
  }

  create(post: Post) {
    return this.http.post<Post>('posts/', post).toPromise();
  }

  update(postID: string, value: Partial<Post>): Promise<Post> {
    return this.http.post<Post>('posts/' + postID, value).toPromise();
  }

  async toHTMLPost(post: Post): Promise<HTMLPost> {
    const board = await this.boardService.get(post.boardID);
    const author = await this.userService.getOneById(post.userID);
    const likes = await this.likeService.getLikesByPost(post.postID);
    const comments = await this.commentService.getCommentsByPost(post.postID);

    return {
      board: board,
      post: post,
      author: author!.username,
      likes: likes.map((like) => like.likerID),
      comments: comments.length,
    };
  }

  async toHTMLPosts(posts: Post[]): Promise<HTMLPost[]> {
    return Promise.all(posts.map((post) => this.toHTMLPost(post)));
  }
}
