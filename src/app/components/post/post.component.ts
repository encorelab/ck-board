import { Component, Inject, OnInit } from '@angular/core';
import { fabric } from 'fabric';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss']
})
export class PostComponent extends fabric.Group {

  constructor(@Inject(Object) options:any) { 
    var text = new fabric.Textbox(options.userID + '\n\n' + options.message, {
      width: 300,
      left: 18,
      top: 18,
      fontSize: 18,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true
    });
  
    var rectangle = new fabric.Rect({
      width: 330,
      height: text.getScaledHeight() + 30,
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
    }

    super([rectangle, text], groupOptions);
  };
}
