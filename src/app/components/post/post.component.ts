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
      left: 0,
      top: 0,
      fontSize: 18,
      fill: '#000000',
      splitByGrapheme: true
    });
  
    var rectangle = new fabric.Rect({
      width: 300,
      height: text.getScaledHeight(),
      fill: '#ffcc12',
      opacity: 1
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
