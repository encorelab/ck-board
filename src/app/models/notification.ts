import {v4 as uuidv4} from 'uuid'
export default class Notification{
    notificationID:string;
    text:string;
    timestamp:number;
    viewed:boolean;
    userID:string;
    postID:string;
}
export function notificationFactory(userID:string,text:string ="", postID:string="", timestamp:number = Date.now(), viewed:boolean = false):Notification{
    return {
        notificationID :uuidv4(),
        text :text,
        timestamp :timestamp,
        viewed  :viewed,
        userID :userID,
        postID  :postID,
    }

}

