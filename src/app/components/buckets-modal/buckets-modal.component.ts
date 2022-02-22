import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import { BucketService } from 'src/app/services/bucket.service';

@Component({
  selector: 'app-buckets-modal',
  templateUrl: './buckets-modal.component.html',
  styleUrls: ['./buckets-modal.component.scss']
})
export class BucketsModalComponent implements OnInit, OnDestroy {

  board: Board

  buckets: any
  activeBucket: any

  posts: any[]

  loading: boolean = true

  constructor(
    public dialogRef: MatDialogRef<BucketsModalComponent>,
    public bucketService: BucketService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.board = data.board
  }

  ngOnInit(): void {
    this.fetchBuckets()
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
    this.loading = true
    this.bucketService.get(bucket.bucketID)
      .then(bucket => {
        if (bucket) {
          this.activeBucket = bucket
          this.posts = bucket.posts
        } else {
          this.posts = []
        }
        this.loading = false
      })
      .catch(_err => {
        this.posts = []
        this.loading = false
      })
  }

  ngOnDestroy(): void {
    this.activeBucket = null
    this.buckets = []
    this.posts = []
  }
}
