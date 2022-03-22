import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';
import { CanvasEvent } from './constants';

@Injectable({providedIn: 'root'})
export class FabricUtils {

    _canvas: fabric.Canvas;

    serializableProperties = [
        'name', 'postID', 'title', 'desc', 
        'author', 'authorID', 'hasControls', 
        'subTargetCheck', 'removed', 'moverID',
        'lockMovement', 'canvasEvent'
    ]

    canvasConfig = {
        width: window.innerWidth, 
        height: window.innerHeight - 64, 
        fireRightClick: true, 
        stopContextMenu: true
    }

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
        fabric.util.enlivenObjects([post], (objects:[fabric.Object]) => {
            var origRenderOnAddRemove = this._canvas.renderOnAddRemove;
            this._canvas.renderOnAddRemove = false;

            objects.forEach((o: fabric.Object) => this._canvas.add(o));
                
            this._canvas.renderOnAddRemove = origRenderOnAddRemove;
            this._canvas.renderAll();
        }, "fabric");
    }

    getObjectFromId(postID: string){
        var currentObjects: any = this._canvas?.getObjects();

        for (var i = currentObjects.length - 1; i >= 0; i--) {
          if (currentObjects[i].postID == postID)
            return currentObjects[i]
        }
        return null;
    }

    clonePost(post, newID) {
        let fabricObj = this.getObjectFromId(post.postID);
        fabricObj = this.setField(fabricObj, 'postID', newID);
        return this.toJSON(fabricObj);
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

    setBorderColor(existing: fabric.Group, color: string) {
        const content = this.getChildFromGroup(existing, 'content');
        
        if (content) {
            content.set({ stroke: color, dirty: true });
        }

        existing.dirty = true;
        existing.addWithUpdate();
        return existing;
    }

    updateAuthor(obj: any, author: string) {
        var children: fabric.Object[] = obj.getObjects()
        var authorObj: any = children.filter((obj) => obj.name == 'author').pop()
        var descObj: any = children.filter((obj) => obj.name == 'desc').pop()
        var likeObj: any = children.filter((obj) => obj.name == 'like').pop()
        var likeCountObj: any = children.filter((obj) => obj.name == 'likeCount').pop()
        var commentObj: any = children.filter((obj) => obj.name == 'comment').pop()
        var commentCountObj: any = children.filter((obj) => obj.name == 'commentCount').pop()
        var contentObj: any = children.filter((obj) => obj.name == 'content').pop()

        var oldAuthorHeight = authorObj.height

        authorObj.set({ text: author, dirty: true })
        
        var authorDelta = authorObj.height - oldAuthorHeight

        descObj.set({ top: descObj.top + authorDelta, dirty: true })
        likeObj.set({ top: likeObj.top + authorDelta, dirty: true })
        likeCountObj.set({ top: likeCountObj.top + authorDelta, dirty: true })
        commentObj.set({ top: commentObj.top + authorDelta, dirty: true })
        commentCountObj.set({ top: commentCountObj.top + authorDelta, dirty: true })
        contentObj.set({ height: contentObj.height, dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }

    updatePostTitleDesc(obj: any, title: string, desc: string) {
        var children: fabric.Object[] = obj.getObjects()
        var titleObj: any = children.filter((obj) => obj.name == 'title').pop()
        var authorObj: any = children.filter((obj) => obj.name == 'author').pop()
        var descObj: any = children.filter((obj) => obj.name == 'desc').pop()
        var likeObj: any = children.filter((obj) => obj.name == 'like').pop()
        var likeCountObj: any = children.filter((obj) => obj.name == 'likeCount').pop()
        var commentObj: any = children.filter((obj) => obj.name == 'comment').pop()
        var commentCountObj: any = children.filter((obj) => obj.name == 'commentCount').pop()
        var contentObj: any = children.filter((obj) => obj.name == 'content').pop()

        var oldTitleHeight = titleObj.height
        var oldDescHeight = descObj.height
        var oldAuthorHeight = authorObj.height

        titleObj.set({ text: title, dirty: true })
        descObj.set({ text: desc.length > 200 ? desc.substr(0, 200) + '...' : desc, dirty: true })
        
        var titleDelta = titleObj.height - oldTitleHeight
        var authorDelta = authorObj.height - oldAuthorHeight
        var descDelta = descObj.height - oldDescHeight

        authorObj.set({ top: authorObj.top + titleDelta, dirty: true })
        descObj.set({ top: descObj.top + titleDelta + authorDelta, dirty: true })
        likeObj.set({ top: likeObj.top + titleDelta + authorDelta + descDelta, dirty: true })
        likeCountObj.set({ top: likeCountObj.top + titleDelta + authorDelta + descDelta, dirty: true })
        commentObj.set({ top: commentObj.top + titleDelta + authorDelta + descDelta, dirty: true })
        commentCountObj.set({ top: commentCountObj.top + titleDelta + authorDelta + descDelta, dirty: true })
        contentObj.set({ height: contentObj.height + titleDelta + descDelta, dirty: true })

        obj.desc = title;
        obj.title = desc;
        obj.dirty = true;
        obj.addWithUpdate();
        return obj
    }

    updateLikeCount(existing, obj) {
        var likeCountExisting: any = existing.getObjects().find((obj) => obj.name == 'likeCount')
        var likeCountObj: any = obj.objects.find((obj) => obj.name == 'likeCount')

        likeCountExisting.set({ text: likeCountObj.text, dirty: true })

        existing.dirty = true
        existing.addWithUpdate();
        return existing
    }

    incrementLikes(obj: any) {
        var children: fabric.Object[] = obj.getObjects()
        var likeCountObj: any = children.find((obj) => obj.name == 'likeCount')

        var numlikes = parseInt(likeCountObj.text)
        likeCountObj.set({ text: (numlikes + 1).toString(), dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }

    decrementLikes(obj: any) {
        var children: fabric.Object[] = obj.getObjects()
        var likeCountObj: any = children.find((obj) => obj.name == 'likeCount')

        var numlikes = parseInt(likeCountObj.text)
        likeCountObj.set({ text: (numlikes - 1).toString(), dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }
    
    updateCommentCount(existing, obj) {
        var commentCountExisting: any = existing.getObjects().find((obj) => obj.name == 'commentCount')
        var commentCountObj: any = obj.objects.find((obj) => obj.name == 'commentCount')

        commentCountExisting.set({ text: commentCountObj.text, dirty: true })

        existing.dirty = true
        existing.addWithUpdate();
        return existing
    }

    incrementComments(obj: any) {
        var children: fabric.Object[] = obj.getObjects()
        var commentCountObj: any = children.find((obj) => obj.name == 'commentCount')

        var numComments = parseInt(commentCountObj.text)
        commentCountObj.set({ text: (numComments + 1).toString(), dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }

    decrementComments(obj: any) {
        var children: fabric.Object[] = obj.getObjects()
        var commentCountObj: any = children.find((obj) => obj.name == 'commentCount')

        var numComments = parseInt(commentCountObj.text)
        commentCountObj.set({ text: (numComments - 1).toString(), dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }

    createImageSettings(canvas, img) {
        let vptCoords = canvas.vptCoords
        let width = canvas.getWidth()
        let height = canvas.getHeight()

        if (vptCoords) {
          width = Math.abs(vptCoords.tr.x - vptCoords.tl.x)
          height = Math.abs(vptCoords.br.y - vptCoords.tr.y)
        }
        let scaleX = 0
        let scaleY = 0

        /* 
            we scale both width and height by the smaller of the two scales
            ex viewport is 2 by 2. Image is w:16 h:9
            scaleX = 2/16, scaleY = 2/9
            2/16 is smaller so we scale by that
            scaleY = scaleX so that we have even scaling
            final scaled image will be W: 16/8 = 2 H: 9/8 = 1.125
            this fits in our 2 by 2 viewport

        */
        scaleX= width / (img.width ?? 1)
        scaleY= height / (img.height ?? 1)
        if(scaleX<=scaleY){
            scaleY = scaleX
        }
        else{
            scaleX = scaleY
        }
        // center image horizontally
        let leftOffset = Math.floor((width - scaleX *img.width) /2)

        // center image vertically
        let topOffset = Math.floor((height - scaleY *img.height) /2)

        return {
          top: vptCoords?.tl.y + topOffset,
          left: vptCoords?.tl.x +leftOffset,
          width: img.width,
          height: img.height,
          scaleX: scaleX,
          scaleY: scaleY
        }
    }

    animateToPosition(object: fabric.Object, left: number, top: number, callback: Function) {
        object.animate({left, top}, {
            onChange: this._canvas.renderAll.bind(this._canvas),
            duration: 1000,
            onComplete: callback
        })
    }

    attachEvent(object: any, event: CanvasEvent) {
        return this.setField(object, 'canvasEvent', event);
    }

    setPostMovement(object: any, lock: boolean) {
        let updatedObj = this.setField(object, 'lockMovementX', lock);
        return this.setField(updatedObj, 'lockMovementY', lock);
    }
}