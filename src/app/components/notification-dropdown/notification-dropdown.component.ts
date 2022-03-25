import { Component, Input, OnInit } from '@angular/core';
import Notification from 'src/app/models/notification';
import User from 'src/app/models/user';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent implements OnInit {
  @Input()
  user:User
  notifications: Notification[] =[]
  unsubListeners: Function[] = []

  constructor(
    public notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.notificationService.getNotificationsByUser(this.user.id).then(notifications=>{
     
      notifications.forEach((data)=>{
        this.notifications.push(data.data());
        this.unsubListeners = this.initGroupEventsListener();
      })
    })
   
  }

  initGroupEventsListener() {
    const unsubPosts = this.notificationService.observable(this.user.id, this.handleNotificationUpdate);
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
  createNotification(){
    this.notificationService.add({
      notificationID:Date.now()+'-'+this.user.id,
      text:"Hello",
      timestamp:Date.now(),
      viewed:false,
      userID:this.user.id
    })

  }
  ngOnDestroy(): void {
    this.notifications= []
    this.unsubListeners.forEach(unsub => unsub())
  }

}
