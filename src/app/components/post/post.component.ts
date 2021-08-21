import { Component, Inject } from '@angular/core';
import { fabric } from 'fabric';

const AUTHOR_OFFSET = 65
const DESC_OFFSET = 80
const CONTENT_EXTRA_HEIGHT = 50

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
    
    var content = new fabric.Rect({
      name: 'content',
      top: 40,
      width: 330,
      height: title.getScaledHeight() + author.getScaledHeight() + desc.getScaledHeight() + CONTENT_EXTRA_HEIGHT,
      fill: '#F4D74B',
      rx: 20, 
      ry: 20,
    });

    const groupOptions = {
      type: 'group',
      left: 150,
      top: 150,
      hasControls: false,
      transparentCorners: false,
      cornerSize: 7,
      lockMovementX: options.lock,
      lockMovementY: options.lock,
      title: options.title,
      desc: options.desc,
      author: options.author
    }

    super([content, title, author, desc], groupOptions);
  };
}