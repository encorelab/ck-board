import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Board } from 'src/app/models/board';
import { BucketService } from 'src/app/services/bucket.service';

@Component({
  selector: 'app-bucket',
  templateUrl: './bucket.component.html',
  styleUrls: ['./bucket.component.scss']
})
export class BucketComponent implements OnChanges {

  @Input() board: Board

  @Input() visible: boolean
  @Output() visibleChange = new EventEmitter<boolean>();

  @ViewChildren('drawer') ref: QueryList<any>
  
  buckets: any
  activeBucket: any

  posts: any[]

  constructor(public bucketService: BucketService) { }

  ngOnChanges() {
    if (this.visible) {
      this.ref.first.open()
      this.fetchBuckets()
    } else if (this.ref && this.ref.length > 0) {
      this.ref.first.close()
    }
  }

  fetchBuckets() {
    this.bucketService.getAllByBoard(this.board.boardID).then(buckets => {
      this.buckets = buckets
      if (buckets.length > 0) {
        this.activeBucket = this.buckets[0] 
        this.loadBucketPosts(this.activeBucket)
      }
    })
  }

  loadBucketPosts(bucket) {
    this.bucketService.get(bucket.bucketID)
      .then(bucket => {
        if (bucket) {
          this.activeBucket = bucket
          this.posts = bucket.posts
        } else {
          this.posts = []
        }
      })
      .catch(_err => this.posts = [])
  }

  close() {
    this.visibleChange.emit(false)
    this.ref.first.close()
  }
}
