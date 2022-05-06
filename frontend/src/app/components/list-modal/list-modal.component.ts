import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import { Tag } from 'src/app/models/post';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';

@Component({
  selector: 'app-list-modal',
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.scss']
})
export class ListModalComponent implements OnInit, OnDestroy {

  board: Board

  loading: boolean = true
  loadingMore: boolean = false

  posts: any[]
  page: number = 0

  activeFilters: Tag[] =[]
  filterOptions: Tag[] =[]
  filteredPosts:any[]
  unsubListeners: Function[] = []

  constructor(
    public dialogRef: MatDialogRef<ListModalComponent>,
    public bucketService: BucketService,
    public postService: PostService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.board = data.board
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
    this.page = 0
    this.loading = true
    return this.fetchMorePosts()
  }

  fetchMorePosts() {
    const opts = {size: 20, page: this.page};

    return this.postService.getAllByBoard(this.board.boardID, opts).then((data) => {
      this.posts = this.posts.concat(data);
      this.page += 1;
      this.loading = false
      this.loadingMore = false
    }).catch(_err => {
      this.loading = false; 
      this.loadingMore = false
    });
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

  ngOnDestroy(): void {
    this.posts = []
    this.unsubListeners.forEach(unsub => unsub())
  }
}
