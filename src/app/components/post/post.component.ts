import { M } from '@angular/cdk/keycodes';
import { Component, Inject } from '@angular/core';
import { fabric } from 'fabric';

const AUTHOR_OFFSET = 65
const DESC_OFFSET = 80
const CONTENT_EXTRA_HEIGHT = 65
const TAG_CONTAINER_WIDTH = 300
const TAG_CHARACTER_LIMIT = 15
const TAG_WIDTH = 140

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent extends fabric.Group {

  constructor(@Inject(Object) options:any) { 
    var title = new fabric.Textbox(options.title, {
      name: 'title',
      width: 280,
      left: 18,
      top: 60,
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });
  
    var author = new fabric.Textbox(options.author, {
      name: 'author',
      width: 300,
      left: 18,
      top: title.getScaledHeight() + AUTHOR_OFFSET,
      fontSize: 13,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true,
    });

    var desc = new fabric.Textbox(options.desc.length > 200 ? options.desc.substr(0, 200) + '...' : options.desc, {
      name: 'desc',
      width: 300,
      left: 18,
      top: author.getScaledHeight() + title.getScaledHeight() + DESC_OFFSET,
      fontSize: 15,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });
    var tagGroups = new Array<fabric.Group>()

    options.tags.forEach((tag, index) => {
      // truncate tag if longer than tag character limit
      let tagTruncated = tag
      if(tag.length > TAG_CHARACTER_LIMIT){
        tagTruncated = tag.substring(0,TAG_CHARACTER_LIMIT) + "..."
      }

      var tagBg = new fabric.Rect({
        name: 'tagbg' + index,
        width: TAG_WIDTH,
        height:25,
        originX: 'center',
        originY: 'center',
        rx:5,
        ry:5,
        fill:'#CCC',
        stroke : 'black',
        strokeWidth : 1
      });
  
      var tagText = new fabric.Textbox(tagTruncated, {
        name: 'tag' + index,
        width:140,
        originX: 'center',
        originY: 'center',
        fontSize: 14,
        fontFamily: 'Helvetica',
        fill: '#000000',
        splitByGrapheme: true,
        padding:10
      });
      let offset = 0
      if(index % 2 == 1){
        offset = 150
      }

      let verticalOffset = index %2 == 0 ? 20* index : 20* (index-1)
      var tagGroup = new fabric.Group([ tagBg, tagText ], {
        left: offset,
        top:verticalOffset,
        width: TAG_WIDTH,
        height:25,
        originX: 'left',
      });
      tagGroups.push(tagGroup)
      
    });

    

    var tagContainer = new fabric.Group(tagGroups,{
      name:'tagContainer',
      left:18,
      width:TAG_CONTAINER_WIDTH,
      top: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() + 90,

    });


    

    
    
    var likeButton = new fabric.Textbox('👍🏼', {
      name: 'like',
      width: 100,
      top: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() +tagContainer.getScaledHeight() + 100,
      left: 170,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });

    var likeCount = new fabric.Textbox('0', {
      name: 'likeCount',
      width: 100,
      top: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() + tagContainer.getScaledHeight() + 100,
      left: (likeButton.left ?? 0) + 28,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true
    });

    var commentButton = new fabric.Textbox('💬', {
      name: 'comment',
      width: 100,
      top: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() + tagContainer.getScaledHeight() + 100,
      left: (likeCount.left ?? 0) + 45,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });

    

    var commentCount = new fabric.Textbox('0', {
      name: 'commentCount',
      width: 100,
      top: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() + tagContainer.getScaledHeight() + 100,
      left: (commentButton.left ?? 0) + 28,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true
    });

    var content = new fabric.Rect({
      name: 'content',
      top: 40,
      width: 330,
      height: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() + commentButton.getScaledHeight() + tagContainer.getScaledHeight() + CONTENT_EXTRA_HEIGHT,
      fill: '#F4D74B',
      rx: 20, 
      ry: 20,
    });

    const groupOptions = {
      name: 'post',
      left: options.left - (330 / 2),
      top: options.top - ((content.height ?? 0) / 2),
      hasControls: false,
      transparentCorners: false,
      cornerSize: 7,
      lockMovementX: options.lock,
      lockMovementY: options.lock,
      title: options.title,
      desc: options.desc,
      author: options.author,
      subTargetCheck: true,
      authorID: options.authorID
    }

    super([content, title, author, desc, likeButton, likeCount, commentButton, commentCount,tagContainer], groupOptions);
  };
}