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
  lastItem: any = null
  activeFilters: Tag[] =[]
  filterOptions: Tag[] =[]
  filteredPosts:any[]

  constructor(
    public dialogRef: MatDialogRef<ListModalComponent>,
    public bucketService: BucketService,
    public postService: PostService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.board = data.board
  }

  ngOnInit(): void {
    this.fetchInitialPosts()
    this.updateFilterOptions()
    this.filterPosts()
  }

  fetchInitialPosts() {
    this.posts = []
    this.lastItem = null
    this.loading = true
    this.fetchMorePosts()
  }

  fetchMorePosts() {
    this.postService.getPaginated(this.board.boardID, { lastItem: this.lastItem, pageSize: 20 })
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
  updateFilterOptions(){
    this.filterOptions = this.board.tags.filter(tag => !this.activeFilters.includes(tag))
    this.filterPosts()

  }

  addFilter(filter:Tag){
    if(!this.activeFilters.includes(filter)){
      this.activeFilters.push(filter);
      this.updateFilterOptions();
    }
  }
  removeFilter(filter:Tag){
    if(this.activeFilters.length >0){
      this.activeFilters = this.activeFilters.filter(tag=> tag!=filter);
      this.updateFilterOptions();
    }
  }

  filterPosts(){
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
  }
}
