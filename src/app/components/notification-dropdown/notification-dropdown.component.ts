import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import Notification from 'src/app/models/notification';
import User from 'src/app/models/user';
import { NotificationService } from 'src/app/services/notification.service';
import { PostService } from 'src/app/services/post.service';
import { PostModalComponent } from '../post-modal/post-modal.component';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  @Input() user:User
  @Input() board:Board

  notifications: Notification[] =[]
  unsubListeners: Function[] = []

  constructor(
    private notificationService: NotificationService,
    private postService: PostService,
    public dialog: MatDialog

  ) { }

  ngOnInit(): void {
    this.notificationService.getNotificationsByUser(this.user.id).then(notifications=>{
     
      notifications.forEach((data)=>{
        this.notifications.push(data.data());
      })
      this.unsubListeners = this.initGroupEventsListener();
    })
   
  }

  initGroupEventsListener() {
    const unsubPosts = this.notificationService.observable(
      this.user.id, this.handleNotificationUpdate
    );
    return [unsubPosts];
  }

  handleNotificationUpdate = (notification:Notification) =>{
    // replace existing notification with new one, if found
    let replaced = false
    for(let i=0; i<this.notifications.length; i++){
      if(this.notifications[i].notificationID === notification.notificationID){
        this.notifications[i] = notification
        replaced = true
        break
      }
    }
    // if not existing notification, push to notifications
    if(!replaced){
      this.notifications.push(notification);
    }

  }

  handleNotifcationDelete = (notification:Notification) =>{
    if (this.notifications){
      this.notifications = this.notifications.filter(currentNotification => currentNotification.notificationID != notification.notificationID)
    }
    this.notificationService.remove(notification.notificationID);
  }
  async openPost(notification:Notification){
    // if postID is defined then open the corresponding post when user clicks on notification
    if(notification.postID){
      let data = await this.postService.get(notification.postID);
      let post = data.docs[0].data();
      this.dialog.open(PostModalComponent, {
        minWidth: '700px',
        width: 'auto',
        data: {
          user: this.user,
          post:post,
          board: this.board
        }
      });
      await this.notificationService.markAsRead(notification.notificationID);
      // for now we'll delete when users click the notification
      this.handleNotifcationDelete(notification);
    }
  }
  async markAllAsRead(){
    this.notifications.forEach(notification =>{
      this.notificationService.markAsRead(notification.notificationID);
      this.handleNotifcationDelete(notification);
    })
  }
  ngOnDestroy(): void {
    this.notifications= []
    this.unsubListeners.forEach(unsub => unsub())
  }

}
