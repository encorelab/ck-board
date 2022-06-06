import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "groupTasks", timestamps: true } })
export class GroupTaskModel {
    @prop({ required: true })
    public id!: string;
    
    @prop({ required: true })
    public workflowID!: string;

    @prop({ required: true })
    public members!: string[]; // Group members assigned to this group task

    @prop({ required: true })
    public posts!: {
        postID: string; 
        memberID: string; // Group members assigned to post
        complete: boolean 
      }[]
}

export default getModelForClass(GroupTaskModel);
