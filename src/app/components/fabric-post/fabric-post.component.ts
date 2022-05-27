import { Component, Inject } from '@angular/core';
import { fabric } from 'fabric';
import {
  POST_DEFAULT_BORDER,
  POST_DEFAULT_BORDER_THICKNESS,
} from 'src/app/utils/constants';
import { FabricUtils } from 'src/app/utils/FabricUtils';

const AUTHOR_OFFSET = 65;
const DESC_OFFSET = 80;
const CONTENT_EXTRA_HEIGHT = 55;

@Component({
  selector: 'app-fabric-post',
  templateUrl: './fabric-post.component.html',
  styleUrls: ['./fabric-post.component.scss'],
})
export class FabricPostComponent extends fabric.Group {
  constructor(
    @Inject(Object) options: any,
    ) {
    var fabricUtils: FabricUtils = new FabricUtils();
    var title = new fabric.Textbox(
      fabricUtils.wrapCanvasText(options.title, 140, 0),
      {
        name: 'title',
        width: 280,
        left: 18,
        top: 60,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        fill: '#000000',
        splitByGrapheme: true,
      }
    );

    var author = new fabric.Textbox(
      fabricUtils.wrapCanvasText(options.author, 200, 0),
      {
        name: 'author',
        width: 300,
        left: 18,
        top: title.getScaledHeight() + AUTHOR_OFFSET,
        fontSize: 13,
        fontFamily: 'Helvetica',
        fill: '#555555',
        splitByGrapheme: true,
      }
    );

    var desc = new fabric.Textbox(
      fabricUtils.wrapCanvasText(
        options.desc.length > 200
          ? options.desc.substr(0, 200) + '...'
          : options.desc,
        200,
        0
      ),
      {
        name: 'desc',
        width: 300,
        left: 18,
        top: author.getScaledHeight() + title.getScaledHeight() + DESC_OFFSET,
        fontSize: 15,
        fontFamily: 'Helvetica',
        fill: '#000000',
        splitByGrapheme: true,
      }
    );

    var commentButton = new fabric.Textbox('💬', {
      name: 'comment',
      width: 55,
      top:
        title.getScaledHeight() +
        author.getScaledHeight() +
        desc.getScaledHeight() +
        90,
      left: 170,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true,
      opacity: 0,
    });

    var commentCount = new fabric.Textbox('0', {
      name: 'commentCount',
      width: 55,
      top:
        title.getScaledHeight() +
        author.getScaledHeight() +
        desc.getScaledHeight() +
        90,
      left: (commentButton.left ?? 0) + 28,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true,
      opacity: 0,
    });

    var likeButton = new fabric.Textbox('👍🏼', {
      name: 'like',
      width: 55,
      top:
        title.getScaledHeight() +
        author.getScaledHeight() +
        desc.getScaledHeight() +
        90,
      left: (commentCount.left ?? 0) + 45,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true,
    });

    var likeCount = new fabric.Textbox('0', {
      name: 'likeCount',
      width: 55,
      top:
        title.getScaledHeight() +
        author.getScaledHeight() +
        desc.getScaledHeight() +
        90,
      left: (likeButton.left ?? 0) + 28,
      fontSize: 20,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true,
    });

    var content = new fabric.Rect({
      name: 'content',
      top: 40,
      width: 330,
      height:
        title.getScaledHeight() +
        author.getScaledHeight() +
        desc.getScaledHeight() +
        commentButton.getScaledHeight() +
        CONTENT_EXTRA_HEIGHT,
      fill: options.color,
      rx: 20,
      ry: 20,
      strokeWidth: options.strokeWidth ?? POST_DEFAULT_BORDER_THICKNESS,
      stroke: options.stroke ?? POST_DEFAULT_BORDER,
    });

    const groupOptions = {
      name: 'post',
      left: options.left - 330 / 2,
      top: options.top - (content.height ?? 0) / 2,
      hasControls: false,
      transparentCorners: false,
      cornerSize: 7,
      lockMovementX: options.lock,
      lockMovementY: options.lock,
      title: options.title,
      desc: options.desc,
      author: options.author,
      tags: options.tags,
      subTargetCheck: true,
      authorID: options.authorID,
    };

    super(
      [
        content,
        title,
        author,
        desc,
        likeButton,
        likeCount,
        commentButton,
        commentCount,
      ],
      groupOptions
    );
  }
}
