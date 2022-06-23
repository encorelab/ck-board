import { Component, Inject } from '@angular/core';
import { fabric } from 'fabric';
import Post from 'src/app/models/post';
import {
  POST_COLOR,
  POST_DEFAULT_BORDER,
  POST_DEFAULT_BORDER_THICKNESS,
} from 'src/app/utils/constants';

const AUTHOR_OFFSET = 65;
const DESC_OFFSET = 80;
const CONTENT_EXTRA_HEIGHT = 55;

export interface PostOptions {
  likes: number;
  comments: number;
}

@Component({
  selector: 'app-fabric-post',
  templateUrl: './fabric-post.component.html',
  styleUrls: ['./fabric-post.component.scss'],
})
export class FabricPostComponent extends fabric.Group {
  constructor(
    @Inject(Object) post: Post,
    @Inject(Object) options?: PostOptions
  ) {
    const title = new fabric.Textbox(post.title, {
      name: 'title',
      width: 280,
      left: 18,
      top: 60,
      fontSize: 18,
      fontWeight: 'bold',
      fontFamily: 'Helvetica',
      fill: '#000000',
      splitByGrapheme: true,
    });

    const author = new fabric.Textbox(post.author, {
      name: 'author',
      width: 300,
      left: 18,
      top: title.getScaledHeight() + AUTHOR_OFFSET,
      fontSize: 13,
      fontFamily: 'Helvetica',
      fill: '#555555',
      splitByGrapheme: true,
    });

    const desc = new fabric.Textbox(
      post.desc.length > 200 ? post.desc.substr(0, 200) + '...' : post.desc,
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

    const commentButton = new fabric.Textbox('💬', {
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
      opacity: options && options.comments > 0 ? 1 : 0,
    });

    const commentCount = new fabric.Textbox(
      options?.comments.toString() ?? '0',
      {
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
        opacity: options && options.comments > 0 ? 1 : 0,
      }
    );

    const likeButton = new fabric.Textbox('👍🏼', {
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

    const likeCount = new fabric.Textbox(options?.likes.toString() ?? '0', {
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

    const { borderWidth, borderColor, fillColor } = post.displayAttributes!;

    const content = new fabric.Rect({
      name: 'content',
      top: 40,
      width: 330,
      height:
        title.getScaledHeight() +
        author.getScaledHeight() +
        desc.getScaledHeight() +
        commentButton.getScaledHeight() +
        CONTENT_EXTRA_HEIGHT,
      fill: fillColor ?? POST_COLOR,
      rx: 20,
      ry: 20,
      strokeWidth: borderWidth ?? POST_DEFAULT_BORDER_THICKNESS,
      stroke: borderColor ?? POST_DEFAULT_BORDER,
    });

    const position = {
      left: post.displayAttributes?.position
        ? post.displayAttributes?.position.left
        : 0,
      top: post.displayAttributes?.position
        ? post.displayAttributes?.position.top
        : 0,
    };

    const groupOptions = {
      name: 'post',
      postID: post.postID,
      left: position.left,
      top: position.top,
      hasControls: false,
      transparentCorners: false,
      cornerSize: 7,
      lockMovementX: post.displayAttributes?.lock ?? false,
      lockMovementY: post.displayAttributes?.lock ?? false,
      subTargetCheck: true,
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
