import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import Post, { Tag } from '../models/post';
import {
  DEFAULT_TAGS,
  POST_COLOR,
  POST_DEFAULT_BORDER,
  POST_DEFAULT_BORDER_THICKNESS,
  POST_DEFAULT_OPACITY,
} from './constants';

@Injectable({ providedIn: 'root' })
export class FabricUtils {
  _canvas: fabric.Canvas;

  serializableProperties = [
    'name',
    'postID',
    'title',
    'desc',
    'author',
    'authorID',
    'hasControls',
    'subTargetCheck',
    'removed',
    'tags',
    'boardID',
  ];

  canvasConfig = {
    width: window.innerWidth,
    height: window.innerHeight - 64,
    fireRightClick: true,
    stopContextMenu: true,
  };

  public set canvas(surface: fabric.Canvas) {
    this._canvas = surface;
  }

  setField(obj, key, value) {
    obj.set(key, value);
    fabric.util.object.extend(obj, { [key]: value });
    return obj;
  }

  toJSON(fabricObj) {
    return JSON.stringify(fabricObj.toJSON(this.serializableProperties));
  }

  fromJSON(post: any): void {
    fabric.util.enlivenObjects(
      [post],
      (objects: [fabric.Object]) => {
        var origRenderOnAddRemove = this._canvas.renderOnAddRemove;
        this._canvas.renderOnAddRemove = false;

        objects.forEach((o: fabric.Object) => this._canvas.add(o));

        this._canvas.renderOnAddRemove = origRenderOnAddRemove;
        this._canvas.renderAll();
      },
      'fabric'
    );
  }

  fromFabricPost(post: any): Post {
    return {
      postID: post.postID,
      userID: post.authorID,
      boardID: post.boardID,
      title: post.title,
      desc: post.desc,
      tags: post.tags,
      fabricObject: this.toJSON(post),
    };
  }

  getObjectFromId(postID: string) {
    var currentObjects: any = this._canvas?.getObjects();

    for (var i = currentObjects.length - 1; i >= 0; i--) {
      if (currentObjects[i].postID == postID) return currentObjects[i];
    }
    return null;
  }

  clonePost(post, newID) {
    let fabricObj = this.getObjectFromId(post.postID);
    fabricObj = this.setField(fabricObj, 'postID', newID);
    return this.toJSON(fabricObj);
  }

  getDefaultTagsForBoard(boardID: string): Tag[] {
    return DEFAULT_TAGS.map((tag) => {
      const fullTag: Tag = {
        boardID,
        name: tag.name!,
        color: tag.color!,
        specialAttributes: tag.specialAttributes,
      };

      return fullTag;
    });
  }

  getChildFromGroup(group: fabric.Group | any, child: string) {
    if (group instanceof fabric.Group) {
      const childObj = group.getObjects().find((obj) => obj.name == child);
      return childObj;
    } else {
      const childObj = group.objects.find((obj) => obj.name == child);
      return childObj;
    }
  }

  setBorderColor(existing: fabric.Group, color: string | undefined) {
    if (color == null) return existing;

    const content = this.getChildFromGroup(existing, 'content');

    if (content) {
      content.set({ stroke: color, dirty: true });
    }

    existing.dirty = true;
    existing.addWithUpdate();
    return existing;
  }

  setBorderThickness(existing: fabric.Group, thickness: number | undefined) {
    if (thickness == null) return existing;

    const content = this.getChildFromGroup(existing, 'content');

    if (content) {
      content.set({ strokeWidth: thickness, dirty: true });
    }

    existing.dirty = true;
    existing.addWithUpdate();
    return existing;
  }

  setFillColor(existing: fabric.Group, color: string | undefined) {
    if (color == null) return existing;

    const content = this.getChildFromGroup(existing, 'content');

    if (content) {
      content.set({ fill: color, dirty: true });
    }

    existing.dirty = true;
    existing.addWithUpdate();
    return existing;
  }

  setOpacity(existing: fabric.Group, level: number | undefined) {
    if (level == null) return existing;

    existing.set({ opacity: level, dirty: true });
    existing.dirty = true;
    existing.addWithUpdate();
    return existing;
  }

  updateAuthor(obj: any, author: string) {
    var children: fabric.Object[] = obj.getObjects();
    var authorObj: any = children.filter((obj) => obj.name == 'author').pop();
    var descObj: any = children.filter((obj) => obj.name == 'desc').pop();
    var likeObj: any = children.filter((obj) => obj.name == 'like').pop();
    var likeCountObj: any = children
      .filter((obj) => obj.name == 'likeCount')
      .pop();
    var commentObj: any = children.filter((obj) => obj.name == 'comment').pop();
    var commentCountObj: any = children
      .filter((obj) => obj.name == 'commentCount')
      .pop();
    var contentObj: any = children.filter((obj) => obj.name == 'content').pop();

    var oldAuthorHeight = authorObj.height;

    authorObj.set({ text: author, dirty: true });

    var authorDelta = authorObj.height - oldAuthorHeight;

    descObj.set({ top: descObj.top + authorDelta, dirty: true });
    likeObj.set({ top: likeObj.top + authorDelta, dirty: true });
    likeCountObj.set({ top: likeCountObj.top + authorDelta, dirty: true });
    commentObj.set({ top: commentObj.top + authorDelta, dirty: true });
    commentCountObj.set({
      top: commentCountObj.top + authorDelta,
      dirty: true,
    });
    contentObj.set({ height: contentObj.height, dirty: true });

    obj.dirty = true;
    obj.addWithUpdate();
    return obj;
  }

  updatePostTitleDesc(obj: any, title: string, desc: string) {
    var children: fabric.Object[] = obj.getObjects();
    var titleObj: any = children.filter((obj) => obj.name == 'title').pop();
    var authorObj: any = children.filter((obj) => obj.name == 'author').pop();
    var descObj: any = children.filter((obj) => obj.name == 'desc').pop();
    var likeObj: any = children.filter((obj) => obj.name == 'like').pop();
    var likeCountObj: any = children
      .filter((obj) => obj.name == 'likeCount')
      .pop();
    var commentObj: any = children.filter((obj) => obj.name == 'comment').pop();
    var commentCountObj: any = children
      .filter((obj) => obj.name == 'commentCount')
      .pop();
    var contentObj: any = children.filter((obj) => obj.name == 'content').pop();

    var oldTitleHeight = titleObj.height;
    var oldDescHeight = descObj.height;
    var oldAuthorHeight = authorObj.height;

    titleObj.set({ text: title, dirty: true });
    descObj.set({
      text: desc.length > 200 ? desc.substr(0, 200) + '...' : desc,
      dirty: true,
    });

    var titleDelta = titleObj.height - oldTitleHeight;
    var authorDelta = authorObj.height - oldAuthorHeight;
    var descDelta = descObj.height - oldDescHeight;

    authorObj.set({ top: authorObj.top + titleDelta, dirty: true });
    descObj.set({ top: descObj.top + titleDelta + authorDelta, dirty: true });
    likeObj.set({
      top: likeObj.top + titleDelta + authorDelta + descDelta,
      dirty: true,
    });
    likeCountObj.set({
      top: likeCountObj.top + titleDelta + authorDelta + descDelta,
      dirty: true,
    });
    commentObj.set({
      top: commentObj.top + titleDelta + authorDelta + descDelta,
      dirty: true,
    });
    commentCountObj.set({
      top: commentCountObj.top + titleDelta + authorDelta + descDelta,
      dirty: true,
    });
    contentObj.set({
      height: contentObj.height + titleDelta + descDelta,
      dirty: true,
    });

    obj.desc = title;
    obj.title = desc;
    obj.dirty = true;
    obj.addWithUpdate();
    return obj;
  }

  /** 
  Applies a set of attributes to a post depending on which 
	tag is being attached to the post.

	Attributes can range from changed border width, border color,
	post color, etc. 

	@param fabricPost the post being tagged
	@param tag the tag being attached
	@returns updated post with new attributes
	*/
  applyTagFeatures(fabricPost: any, tag: Tag) {
    const attributes = tag.specialAttributes;

    if (attributes == null) {
      return fabricPost;
    }

    fabricPost = this.setBorderColor(fabricPost, attributes.borderColor);
    fabricPost = this.setBorderThickness(fabricPost, attributes.borderWidth);
    fabricPost = this.setFillColor(fabricPost, attributes.fillColor);
    fabricPost = this.setOpacity(fabricPost, attributes.opacity);

    this._canvas.requestRenderAll();
    return fabricPost;
  }

  resetTagFeatures(fabricPost: any) {
    fabricPost = this.setBorderColor(fabricPost, POST_DEFAULT_BORDER);
    fabricPost = this.setBorderThickness(
      fabricPost,
      POST_DEFAULT_BORDER_THICKNESS
    );
    fabricPost = this.setFillColor(fabricPost, POST_COLOR);
    fabricPost = this.setOpacity(fabricPost, POST_DEFAULT_OPACITY);

    this._canvas.requestRenderAll();
    return fabricPost;
  }

  setLikeCount(fabricObject: fabric.Group, amount: number): fabric.Group {
    var likeCount: any = fabricObject
      .getObjects()
      .find((obj) => obj.name == 'likeCount');

    likeCount.set({ text: amount.toString(), dirty: true });

    fabricObject.dirty = true;
    fabricObject.addWithUpdate();
    return fabricObject;
  }

  setCommentCount(fabricObject: fabric.Group, amount: number): fabric.Group {
    var commentCount: any = fabricObject
      .getObjects()
      .find((obj) => obj.name == 'commentCount');

    commentCount.set({ text: amount.toString(), dirty: true });

    fabricObject.dirty = true;
    fabricObject.addWithUpdate();
    return fabricObject;
  }

  setTags(fabricObject: any, tags: Tag[]) {
    return this.setField(fabricObject, 'tags', tags);
  }

  createImageSettings(img) {
    let vptCoords = this._canvas.vptCoords!;
    let width = this._canvas.getWidth();
    let height = this._canvas.getHeight();

    if (vptCoords) {
      width = Math.abs(vptCoords.tr.x - vptCoords.tl.x);
      height = Math.abs(vptCoords.br.y - vptCoords.tr.y);
    }
    let scaleX = 0;
    let scaleY = 0;

    /* 
            we scale both width and height by the smaller of the two scales
            ex viewport is 2 by 2. Image is w:16 h:9
            scaleX = 2/16, scaleY = 2/9
            2/16 is smaller so we scale by that
            scaleY = scaleX so that we have even scaling
            final scaled image will be W: 16/8 = 2 H: 9/8 = 1.125
            this fits in our 2 by 2 viewport

        */
    scaleX = width / (img.width ?? 1);
    scaleY = height / (img.height ?? 1);
    if (scaleX <= scaleY) {
      scaleY = scaleX;
    } else {
      scaleX = scaleY;
    }
    // center image horizontally
    let leftOffset = Math.floor((width - scaleX * img.width) / 2);

    // center image vertically
    let topOffset = Math.floor((height - scaleY * img.height) / 2);

    return {
      top: vptCoords?.tl.y + topOffset,
      left: vptCoords?.tl.x + leftOffset,
      width: img.width,
      height: img.height,
      scaleX: scaleX,
      scaleY: scaleY,
    };
  }

  animateToPosition(
    object: fabric.Object,
    left: number,
    top: number,
    callback: Function
  ) {
    object.animate(
      { left, top },
      {
        onChange: this._canvas.renderAll.bind(this._canvas),
        duration: 1000,
        onComplete: callback,
      }
    );
  }

  setPostMovement(object: any, lock: boolean) {
    let updatedObj = this.setField(object, 'lockMovementX', lock);
    return this.setField(updatedObj, 'lockMovementY', lock);
  }

  setBackgroundImage(image: fabric.Image | string | undefined, settings?: any) {
    if (image == null) {
      image = new fabric.Image('');
    }
    this._canvas.setBackgroundImage(
      image,
      this._canvas.renderAll.bind(this._canvas),
      settings
    );
  }
}
