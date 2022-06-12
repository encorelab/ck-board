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

export class ImageSettings {
  top: number;
  left: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export class CanvasDimensions {
  width: number;
  height: number;
}

export class ImageScale {
  scaleX: number;
  scaleY: number;
}

export class ImageOffset {
  offsetX: number;
  offsetY: number;
}

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
        const origRenderOnAddRemove = this._canvas.renderOnAddRemove;
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
    const currentObjects: any = this._canvas?.getObjects();

    for (let i = currentObjects.length - 1; i >= 0; i--) {
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
    const children: fabric.Object[] = obj.getObjects();
    const authorObj: any = children.filter((obj) => obj.name == 'author').pop();
    const descObj: any = children.filter((obj) => obj.name == 'desc').pop();
    const likeObj: any = children.filter((obj) => obj.name == 'like').pop();
    const likeCountObj: any = children
      .filter((obj) => obj.name == 'likeCount')
      .pop();
    const commentObj: any = children
      .filter((obj) => obj.name == 'comment')
      .pop();
    const commentCountObj: any = children
      .filter((obj) => obj.name == 'commentCount')
      .pop();
    const contentObj: any = children
      .filter((obj) => obj.name == 'content')
      .pop();

    const oldAuthorHeight = authorObj.height;

    authorObj.set({ text: author, dirty: true });

    const authorDelta = authorObj.height - oldAuthorHeight;

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
    const children: fabric.Object[] = obj.getObjects();
    const titleObj: any = children.filter((obj) => obj.name == 'title').pop();
    const authorObj: any = children.filter((obj) => obj.name == 'author').pop();
    const descObj: any = children.filter((obj) => obj.name == 'desc').pop();
    const likeObj: any = children.filter((obj) => obj.name == 'like').pop();
    const likeCountObj: any = children
      .filter((obj) => obj.name == 'likeCount')
      .pop();
    const commentObj: any = children
      .filter((obj) => obj.name == 'comment')
      .pop();
    const commentCountObj: any = children
      .filter((obj) => obj.name == 'commentCount')
      .pop();
    const contentObj: any = children
      .filter((obj) => obj.name == 'content')
      .pop();

    const oldTitleHeight = titleObj.height;
    const oldDescHeight = descObj.height;
    const oldAuthorHeight = authorObj.height;

    titleObj.set({ text: title, dirty: true });
    descObj.set({
      text: desc.length > 200 ? desc.substr(0, 200) + '...' : desc,
      dirty: true,
    });

    const titleDelta = titleObj.height - oldTitleHeight;
    const authorDelta = authorObj.height - oldAuthorHeight;
    const descDelta = descObj.height - oldDescHeight;

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
    const likeCount: any = fabricObject
      .getObjects()
      .find((obj) => obj.name == 'likeCount');

    likeCount.set({ text: amount.toString(), dirty: true });

    fabricObject.dirty = true;
    fabricObject.addWithUpdate();
    return fabricObject;
  }

  setCommentCount(fabricObject: fabric.Group, amount: number): fabric.Group {
    const comment: any = fabricObject
      .getObjects()
      .find((obj) => obj.name == 'comment');
    const commentCount: any = fabricObject
      .getObjects()
      .find((obj) => obj.name == 'commentCount');

    commentCount.set({ text: amount.toString(), dirty: true });

    if (amount >= 1) {
      commentCount.set({ opacity: 1, dirty: true });
      comment.set({ opacity: 1, dirty: true });
    }

    fabricObject.dirty = true;
    fabricObject.addWithUpdate();
    return fabricObject;
  }

  setTags(fabricObject: any, tags: Tag[]) {
    return this.setField(fabricObject, 'tags', tags);
  }

  createImageSettings(image: fabric.Image): ImageSettings {
    const dimensions = this._calcCanvasDimensions();
    const scale = this._scaleImage(image, dimensions);
    const offset = this._calcImageOffsets(image, scale, dimensions);

    return {
      top: offset.offsetY,
      left: offset.offsetX,
      width: image.width!,
      height: image.height!,
      scaleX: scale.scaleX,
      scaleY: scale.scaleY,
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
    const updatedObj = this.setField(object, 'lockMovementX', lock);
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

  /**
   * Calculates the height and width of canvas.
   *
   * @returns dimensions of canvas
   */
  private _calcCanvasDimensions(): CanvasDimensions {
    if (!this._canvas) {
      return { width: window.innerWidth, height: window.innerHeight - 64 };
    }

    const vptCoords = this._canvas.vptCoords!;
    let width = this._canvas.getWidth();
    let height = this._canvas.getHeight();

    if (vptCoords) {
      width = Math.abs(vptCoords.tr.x - vptCoords.tl.x);
      height = Math.abs(vptCoords.br.y - vptCoords.tr.y);
    }

    return { width, height };
  }

  /**
   * Scales an image to appropriately fit canvas dimensions.
   * Scales both width and height by smaller of two scales.
   *
   * Ex:
   * image.width = 16
   * image.height = 9
   * scaleX = 2/16 = 1/8, scaleY = 2/9
   * scaleX = 16/8 = 2, scaleY = 9/8 = 1.125
   *
   * @param image image to be scaled
   * @param dimensions dimensions of canvas
   * @returns x and y scaling amounts
   */
  private _scaleImage(
    image: fabric.Image,
    dimensions: CanvasDimensions
  ): ImageScale {
    let scaleX = dimensions.width / (image.width ?? 1);
    let scaleY = dimensions.height / (image.height ?? 1);

    if (scaleX <= scaleY) {
      scaleY = scaleX;
    } else {
      scaleX = scaleY;
    }

    return { scaleX, scaleY };
  }

  /**
   * Calculates vertical and horizontal offsets for image to be centered
   * across canvas.
   *
   * @param image image to be centered
   * @param scale vertical and horizontal scaling of image
   * @param dimensions dimensions of canvas
   * @returns horizontal and vertical offsets
   */
  private _calcImageOffsets(
    image: fabric.Image,
    scale: ImageScale,
    dimensions: CanvasDimensions
  ): ImageOffset {
    const offsetX = Math.floor(
      (dimensions.width - scale.scaleX * image.width!) / 2
    );
    const offsetY = Math.floor(
      (dimensions.height - scale.scaleY * image.height!) / 2
    );
    const vptCoords = this._canvas.vptCoords;

    if (vptCoords) {
      return {
        offsetX: offsetX + vptCoords.tl.x,
        offsetY: offsetY + vptCoords?.tl.y,
      };
    }

    return { offsetX, offsetY };
  }
}
