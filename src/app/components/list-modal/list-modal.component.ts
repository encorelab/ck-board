import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import Post, { Tag } from 'src/app/models/post';
import User from 'src/app/models/user';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import { NEEDS_ATTENTION_TAG, POST_COLOR, POST_TAGGED_BORDER_THICKNESS } from 'src/app/utils/constants';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { AddPostComponent, AddPostDialog } from '../add-post-modal/add-post.component';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';

@Component({
  selector: 'app-list-modal',
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.scss']
})
export class ListModalComponent implements OnInit, OnDestroy {

  board: Board
  user:User

  loading: boolean = true
  loadingMore: boolean = false

  posts: any[]
  lastItem: any = null
  activeFilters: Tag[] =[]
  filterOptions: Tag[] =[]
  filteredPosts:any[]
  unsubListeners: Function[] = []

  Yoffset:number
  Xoffset:number

  constructor(
    public dialogRef: MatDialogRef<ListModalComponent>,
    public bucketService: BucketService,
    public postService: PostService,
    protected fabricUtils: FabricUtils,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.board = data.board
    this.user = data.user
    this.Xoffset = data.centerX
    this.Yoffset = data.centerY
  }

  ngOnInit(): void {
    this.fetchInitialPosts().then(() =>{
      // wait until posts are fetched before filtering and adding listners
      this.filterPosts();
      this.unsubListeners = this.initGroupEventsListener();
    })
    
  }

  initGroupEventsListener() {
    const unsubPosts = this.postService.observable(this.board.boardID, this.handlePostUpdate, this.handlePostUpdate, this.handlePostDelete);
    return [unsubPosts];
  }

  fetchInitialPosts() {
    this.posts = []
    this.lastItem = null
    this.loading = true
    return this.fetchMorePosts()
  }

  fetchMorePosts() {
    return this.postService.getPaginated(this.board.boardID, { lastItem: this.lastItem, pageSize: 20 })
            .then(({newLastItem, data}) => {
              data.forEach(data => this.posts.push(data.data()))
              this.lastItem = newLastItem ?? this.lastItem
              this.loading = false
              this.loadingMore = false
            })
            .catch(_err => {
              this.loading = false; 
              this.loadingMore = false
            })
  }

  onScroll(event: any) {
    if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight) {
      this.loadingMore = true
      this.fetchMorePosts()
    }
  }
  
  handlePostUpdate = (post) =>{
    // replace existing post with new one, if found
    let replaced = false
    for(let i=0; i<this.posts.length; i++){
      if(this.posts[i].postID === post.postID){
        this.posts[i] = post
        replaced = true
        break
      }
    }
    // if not existing post, push to posts
    if(!replaced){
      this.posts.push(post);
    }
    this.filterPosts();
  }

  handlePostDelete = (post) =>{
    this.posts = this.posts.filter(currentPost => currentPost.postID !== post.postID)
    this.filterPosts();
  }

  addFilter(filter:Tag){
    if(!this.activeFilters.includes(filter)){
      this.activeFilters.push(filter);
      this.filterPosts();
    }
  }
  removeFilter(filter:Tag){
    if(this.activeFilters.length >0){
      this.activeFilters = this.activeFilters.filter(tag=> tag!=filter);
      this.filterPosts();
    }
  }

  filterPosts(){
    // update filter options
    this.filterOptions = this.board.tags.filter(tag => !this.activeFilters.includes(tag))
    if (this.activeFilters.length >0){
      // for each post on the board
      // check if the post has every tag in active filters
      this.filteredPosts = this.posts.filter(post => this.activeFilters.every(filter=>post.tags.map(postTag=>postTag.name).includes(filter.name)))
    }
    else{
      this.filteredPosts = this.posts 
    }
  }

  openAddPostDialog(){
    const dialogData: AddPostDialog = {
      handleAddPost: this.addPost,
      spawnPosition: {
        top: 150,
        left: 150,
      },
      board: this.board,
      user: this.user
    }
    this.dialog.open(AddPostComponent, {
      width: '500px',
      data: dialogData
    });
  }

  addPost = (title: string, desc = '', tags: Tag[]) => {
    const post: Post = {
      postID: Date.now() + '-' + this.user.id,
      title: title,
      desc: desc,
      tags: tags,
      userID: this.user.id,
      boardID: this.board.boardID,
      fabricObject: null,
      timestamp: new Date().getTime(),
    }
    this.postService.create(post);
    this.posts.push(post);
    this.filterPosts();
  }

  movePostToBoard(postID:string){
    this.postService.get(postID).then(data =>{
      data.forEach(item =>{
        let post = item.data()

        const containsAttentionTag = post.tags.find(tag => tag.name == NEEDS_ATTENTION_TAG.name);

        let fabricPost = new FabricPostComponent({
          title: post.title,
          author: this.user.username,
          authorID: this.user.id,
          desc: post.desc,
          tags: post.tags ?? [],
          lock: !this.board.permissions.allowStudentMoveAny,
          left: this.Xoffset,
          top: this.Yoffset,
          color: POST_COLOR,
          stroke: containsAttentionTag ? NEEDS_ATTENTION_TAG.color : null,
          strokeWidth: containsAttentionTag ? POST_TAGGED_BORDER_THICKNESS : null
        });

        fabricPost = this.fabricUtils.setField(fabricPost, 'postID', postID);
        const updatedPost = this.fabricUtils.toJSON(fabricPost);
        this.postService.update(postID, {fabricObject: updatedPost});

        this.Yoffset += 50;
      })
    })
    
  }

  ngOnDestroy(): void {
    this.posts = []
    this.unsubListeners.forEach(unsub => unsub())
  }
}
