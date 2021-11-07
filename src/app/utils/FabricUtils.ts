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
}