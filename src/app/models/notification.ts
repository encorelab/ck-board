export default class Notification{
    notificationID:string;
    text:string;
    timestamp:number;
    viewed:boolean;
    userID:string;
    postID:string;
}
export function notificationFactory(text:string ="",userID:string = "", postID:string="", timestamp:number = Date.now(), viewed:boolean = false):Notification{
    return {
        notificationID :timestamp+'-'+userID,
        text :text,
        timestamp :timestamp,
        viewed  :viewed,
        userID :userID,
        postID  :postID,
    }

}

