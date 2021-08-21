import { fabric } from 'fabric';

export class FabricUtils {

    serializableProperties = ['name', 'postID', 'title', 'desc', 'author', 'hasControls', 'removed']

    renderPostFromJSON(post:any, callback: (objects) => any): void {
        fabric.util.enlivenObjects([post], (objects:[fabric.Object]) => callback(objects), "fabric");
    }

    updatePostTitleDesc(obj: any, title: string, desc: string) {
        var children: fabric.Object[] = obj.getObjects()
        var titleObj: any = children.filter((obj) => obj.name == 'title').pop()
        var authorObj: any = children.filter((obj) => obj.name == 'author').pop()
        var descObj: any = children.filter((obj) => obj.name == 'desc').pop()
        var contentObj: any = children.filter((obj) => obj.name == 'content').pop()

        
        var oldTitleHeight = titleObj.height
        var oldDescHeight = descObj.height
        var oldAuthorHeight = authorObj.height
        titleObj.set({ text: title, dirty: true })
        descObj.set({ text: desc.length > 200 ? desc.substr(0, 200) + '...' : desc, dirty: true })
        
        authorObj.set({ top: authorObj.top + (titleObj.height - oldTitleHeight), dirty: true })
        descObj.set({ top: descObj.top + (titleObj.height - oldTitleHeight) + (authorObj.height - oldAuthorHeight), dirty: true })
        contentObj.set({ height: contentObj.height + (titleObj.height - oldTitleHeight) + (descObj.height - oldDescHeight), dirty: true })

        obj.dirty = true
        obj.addWithUpdate();
        return obj
    }
}