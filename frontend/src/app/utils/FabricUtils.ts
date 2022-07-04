import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { DisplayAttributes } from '../models/post';
import { Tag } from '../models/tag';
import {
  DEFAULT_TAGS,
  POST_COLOR,
  POST_DEFAULT_BORDER,
  POST_DEFAULT_BORDER_THICKNESS,
  POST_DEFAULT_OPACITY,
} from './constants';
import { numDigits } from './Utils';

export interface ImageSettings {
  top: number;
  left: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface ImageScale {
  scaleX: number;
  scaleY: number;
}

export interface ImageOffset {
  offsetX: number;
  offsetY: number;
}

@Injectable({ providedIn: 'root' })
export class FabricUtils {
  _canvas: fabric.Canvas;

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

  getObjectFromId(postID: string) {
    const currentObjects: any = this._canvas?.getObjects();

    for (let i = currentObjects.length - 1; i >= 0; i--) {
      if (currentObjects[i].postID == postID) return currentObjects[i];
    }
    return null;
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

  /** 
  Updates the position and formatting of a fabric post
  after the author name is changed.

	@param obj the fabric post being updated
  @param author new author name 
	@returns updated fabric post
	*/
  updateAuthor(obj: any, author: string) {
    const children: fabric.Object[] = obj.getObjects();
    const authorObj: any = children.filter((obj) => obj.name == 'author').pop();
    const descObj: any = children.filter((obj) => obj.name == 'desc').pop();
    const upvoteObj: any = children.filter((obj) => obj.name == 'upvote').pop();
    const downvoteObj: any = children
      .filter((obj) => obj.name == 'downvote')
      .pop();
    const upvoteCountObj: any = children
      .filter((obj) => obj.name == 'upvoteCount')
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
    upvoteObj.set({ top: upvoteObj.top + authorDelta, dirty: true });
    downvoteObj.set({ top: downvoteObj.top + authorDelta, dirty: true });
    upvoteCountObj.set({ top: upvoteCountObj.top + authorDelta, dirty: true });
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

  /** 
  Updates the position and formatting of a fabric post
  after the title or description is changed.

	@param obj the fabric post being updated
  @param title new title 
  @param desc new desc
	@returns updated fabric post
	*/
  updatePostTitleDesc(obj: any, title: string, desc: string) {
    const children: fabric.Object[] = obj.getObjects();
    const titleObj: any = children.filter((obj) => obj.name == 'title').pop();
    const authorObj: any = children.filter((obj) => obj.name == 'author').pop();
    const descObj: any = children.filter((obj) => obj.name == 'desc').pop();
    const upvoteObj: any = children.filter((obj) => obj.name == 'upvote').pop();
    const downvoteObj: any = children
      .filter((obj) => obj.name == 'downvote')
      .pop();
    const upvoteCountObj: any = children
      .filter((obj) => obj.name == 'upvoteCount')
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
    upvoteObj.set({
      top: upvoteObj.top + titleDelta + authorDelta + descDelta,
      dirty: true,
    });
    downvoteObj.set({
      top: downvoteObj.top + titleDelta + authorDelta + descDelta,
      dirty: true,
    });
    upvoteCountObj.set({
      top: upvoteCountObj.top + titleDelta + authorDelta + descDelta,
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
	@returns display attributes for post
	*/
  applyTagFeatures(fabricPost: any, tag: Tag): DisplayAttributes {
    if (tag.specialAttributes == null) {
      return {};
    }

    const { borderColor, borderWidth, fillColor, opacity } =
      tag.specialAttributes;

    fabricPost = this.setBorderColor(fabricPost, borderColor);
    fabricPost = this.setBorderThickness(fabricPost, borderWidth);
    fabricPost = this.setFillColor(fabricPost, fillColor);
    fabricPost = this.setOpacity(fabricPost, opacity);

    this._canvas.requestRenderAll();

    return Object.assign(
      {},
      borderColor === null ? null : { borderColor },
      borderWidth === null ? null : { borderWidth },
      fillColor === null ? null : { fillColor },
      opacity === null ? null : { opacity }
    );
  }

  /** 
  Resets display attributes of a post to its default values.

	Attributes that are reset can range from changed border width, 
  border color,  post color, etc. 

	@param fabricPost the post being tagged
	@returns display attributes for post
	*/
  resetTagFeatures(fabricPost: any): DisplayAttributes {
    fabricPost = this.setBorderColor(fabricPost, POST_DEFAULT_BORDER);
    fabricPost = this.setBorderThickness(
      fabricPost,
      POST_DEFAULT_BORDER_THICKNESS
    );
    fabricPost = this.setFillColor(fabricPost, POST_COLOR);
    fabricPost = this.setOpacity(fabricPost, POST_DEFAULT_OPACITY);

    this._canvas.requestRenderAll();

    return {
      borderColor: POST_DEFAULT_BORDER,
      borderWidth: POST_DEFAULT_BORDER_THICKNESS,
      fillColor: POST_COLOR,
      opacity: POST_DEFAULT_OPACITY,
    };
  }

  /** 
  Sets the number of upvotes on a fabric post.

	When going from n-digit -> (n+1)-digit upvotes, the 
  button position will be adjusted to accomodate for extra space. 

	@param fabricObject the post
  @param amount new amount of upvotes
	@returns updated fabric post
	*/
  setUpvoteCount(fabricObject: fabric.Group, amount: number): fabric.Group {
    const upvoteCount: any = this.getChildFromGroup(
      fabricObject,
      'upvoteCount'
    );
    const downvote: any = this.getChildFromGroup(fabricObject, 'downvote');

    const prevAmountDigits = upvoteCount.text.length;
    const amountDigits = numDigits(amount);
    const left = downvote.left + (amountDigits - prevAmountDigits) * 9;

    upvoteCount.set({ text: amount.toString(), dirty: true });
    downvote.set({ left, dirty: true });

    fabricObject.dirty = true;
    fabricObject.addWithUpdate();
    return fabricObject;
  }

  /** 
  Sets the number of comments on a fabric post.

	@param fabricObj the post
  @param amount new amount of comments
	@returns updated fabric post
	*/
  setCommentCount(fabricObj: fabric.Group, amount: number): fabric.Group {
    const comment: any = this.getChildFromGroup(fabricObj, 'comment');
    const commentCount: any = this.getChildFromGroup(fabricObj, 'commentCount');

    commentCount.set({ text: amount.toString(), dirty: true });

    if (amount >= 1) {
      commentCount.set({ opacity: 1, dirty: true });
      comment.set({ opacity: 1, dirty: true });
    } else {
      commentCount.set({ opacity: 0, dirty: true });
      comment.set({ opacity: 0, dirty: true });
    }

    fabricObj.dirty = true;
    fabricObj.addWithUpdate();
    return fabricObj;
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
    object = object.set('lockMovementX', lock);
    object = object.set('lockMovementY', lock);
    return object;
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
