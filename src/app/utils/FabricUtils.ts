import { fabric } from 'fabric';

export class FabricUtils {

    serializableProperties = ['name', 'postID', 'title', 'desc', 'author', 'authorID', 'hasControls', 'subTargetCheck', 'removed']

    canvasConfig = {
        width: window.innerWidth * 0.99, 
        height: window.innerHeight * 0.9, 
        fireRightClick: true, 
        stopContextMenu: true
    }

    renderPostFromJSON(post:any, callback: (objects) => any): void {
        fabric.util.enlivenObjects([post], (objects:[fabric.Object]) => callback(objects), "fabric");
    }

    getObjectFromId(ctx: any, postID: string){
        var currentObjects = ctx.getObjects();
        
        for (var i = currentObjects.length - 1; i >= 0; i-- ) {
          if (currentObjects[i].postID == postID)
            return currentObjects[i]
        }
        return null;
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

        obj.dirty = true
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
            we scale by the longer of width and height
            if the image is square we scale by same ammount on width and height
            ex viewport is 2 by 2. Image is w:16 h:9
            w>=h so scaleX = 2/16 -> 1/8
            scaleY = scaleX so that we have even scaling
            final scaled image will be W: 16/8 = 2 H: 9/8 = 1.125
            this fits in our 2 by 2 viewport

        */
        if(img.width>=img.height){
            scaleX= width / (img.width ?? 1)
            scaleY = scaleX
        }
        else{
            scaleY= height / (img.height ?? 1)
            scaleX = scaleY
        }

        return {
          top: vptCoords?.tl.y,
          left: vptCoords?.tl.x,
          width: width,
          height: height,
          scaleX: scaleX,
          scaleY: scaleY
        }
    }
}