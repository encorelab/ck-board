import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { CanvasPostEvent } from './constants';

@Injectable({providedIn: 'root'})
export class FabricUtils {

    _canvas: fabric.Canvas;

    serializableProperties = [
        'name', 'postID', 'title', 'desc', 
        'author', 'authorID', 'hasControls', 
        'subTargetCheck', 'removed', 'moverID',
        'tags', 'canvasEvent'
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

    wrapCanvasText(t, maxW, maxH) {
        this._canvas = new fabric.Canvas('c');
        if (typeof maxH === 'undefined') {
            maxH = 0;
        }
        var words = t.split(' ');
        var formatted = '';
        var context = this._canvas?.getContext();
        context.font = t.fontSize + 'px ' + t.fontFamily;
        var currentLine = '';

        for (var n = 0; n < words.length; n++) {
            var isNewLine = currentLine == '';
            var testOverlap = currentLine + ' ' + words[n];

            // are we over width?
            var w = context.measureText(testOverlap).width;

            if (w < maxW) {
            // if not, keep adding words
            currentLine += words[n] + ' ';
            formatted += words[n] += ' ';
            } else {
            // if this hits, we got a word that need to be hypenated
            if (isNewLine) {
                var wordOverlap = '';

                // test word length until its over maxW
                for (var i = 0; i < words[n].length; ++i) {
                wordOverlap += words[n].charAt(i);
                var withHypeh = wordOverlap + '-';

                if (context.measureText(withHypeh).width >= maxW) {
                    // add hyphen when splitting a word
                    withHypeh = wordOverlap.substr(0, wordOverlap.length - 2) + '-';
                    // update current word with remainder
                    words[n] = words[n].substr(
                    wordOverlap.length - 1,
                    words[n].length
                    );
                    formatted += withHypeh; // add hypenated word
                    break;
                }
                }
            }
            n--; // restart cycle
            formatted += '\n';
            currentLine = '';
            }
        }

        formatted = formatted.substr(0, formatted.length - 1);
        console.log(formatted);
        return formatted;
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

    setBorderThickness(existing: fabric.Group, thickness: number) {
        const content = this.getChildFromGroup(existing, 'content');

        if (content) {
            content.set({ strokeWidth: thickness, dirty: true });
        }

        existing.dirty = true;
        existing.addWithUpdate();
        return existing;
    }

    setFillColor(existing: fabric.Group, color: string) {
        const content = this.getChildFromGroup(existing, 'content');

        if (content) {
            content.set({ fill: color, dirty: true });
        }

        existing.dirty = true;
        existing.addWithUpdate();
        return existing;
    }

    setOpacity(existing: fabric.Group, level: number) {
        existing.set({ opacity: level, dirty: true });
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

    copyLikeCount(existing, obj) {
        var likeCountObj: any = obj.objects.find((obj) => obj.name == 'likeCount')
        return this.setLikeCount(existing, likeCountObj.text);
    }

    setLikeCount(obj, count: number) {
        var likeCountExisting: any = obj.getObjects().find((obj) => obj.name == 'likeCount')
        likeCountExisting.set({ text: count.toString(), dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }
    
    copyCommentCount(existing, obj) {
        var commentCountObj: any = obj.objects.find((obj) => obj.name == 'commentCount')
        return this.setCommentCount(existing, commentCountObj.text);
    }

    setCommentCount(obj, count: number) {
        var commentCountObj: any = obj.getObjects().find((obj) => obj.name == 'commentCount')
        var commentObj: any = obj.getObjects().find((obj) => obj.name == 'comment')
        commentCountObj.set({ text: count.toString(), dirty: true })

        // by default comment and comment count are hidden
        // if there is at least 1 comment, comment and comment count should be displayed
        if(count >=1){
            commentCountObj.set({opacity:1, dirty: true})
            commentObj.set({opacity:1, dirty: true})
        }

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

    attachEvent(object: any, event: CanvasPostEvent) {
        return this.setField(object, 'canvasEvent', event);
    }

    setPostMovement(object: any, lock: boolean) {
        let updatedObj = this.setField(object, 'lockMovementX', lock);
        return this.setField(updatedObj, 'lockMovementY', lock);
    }
}