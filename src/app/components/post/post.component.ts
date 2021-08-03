import { Component, Inject, OnInit } from '@angular/core';
import { fabric } from 'fabric';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent extends fabric.Group {

  constructor(@Inject(Object) options:any) { 
    var title = new fabric.Textbox(options.title, {
      width: 300,
      left: 18,
      top: 18,
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });
  
    var author = new fabric.Textbox(options.userID, {
      width: 300,
      left: 18,
      top: title.getScaledHeight() + 20,
      fontSize: 13,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true
    });

    var desc = new fabric.Textbox(options.message, {
      width: 300,
      left: 18,
      top: 70,
      fontSize: 15,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });

    var rectangle = new fabric.Rect({
      width: 330,
      height: title.getScaledHeight() + desc.getScaledHeight() + 60,
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
      lockMovementY: options.lock
    }

    super([rectangle, title, author, desc], groupOptions);
  };
}
