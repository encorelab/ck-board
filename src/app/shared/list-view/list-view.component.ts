import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { Board } from 'src/app/models/board';
import Post from 'src/app/models/post';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';

@Component({
  selector: 'app-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnChanges {

  @Input() board: Board

  @Input() visible: boolean
  @Output() visibleChange = new EventEmitter<boolean>();

  @ViewChildren('drawer') ref: QueryList<any>
  
  loading: boolean = true

  posts: any[]

  lastItem: any = null

  constructor(public postService: PostService) { }

  ngOnChanges() {
    if (this.visible) {
      this.ref.first.open()
      this.fetchInitialPosts()
    } else if (this.ref && this.ref.length > 0) {
      this.ref.first.close()
    }
  }

  fetchInitialPosts() {
    this.posts = []
    this.lastItem = null
    this.loading = true
    this.fetchMorePosts()
  }

  fetchMorePosts() {
    this.postService.getPaginated(this.board.boardID, { lastItem: this.lastItem, pageSize: 15 })
      .then(({newLastItem, data}) => {
        data.forEach(data => this.posts.push(data.data()))
        this.lastItem = newLastItem
        this.loading = false
      })
      .catch(err => console.log(err))
  }

  close() {
    this.visibleChange.emit(false)
    this.ref.first.close()
  }
}
