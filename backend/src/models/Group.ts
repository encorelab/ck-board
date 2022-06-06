import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { GroupTaskModel } from "./GroupTask";

@modelOptions({ schemaOptions: { collection: "groups", timestamps: true } })
export class GroupModel {
    @prop({ required: true })
    public groupID!: string;
    
    @prop({ required: true })
    public projectID!: string;

    @prop({ required: true })
    public name!: string;

    @prop({ required: true })
    public members!: string[];

    @prop( { required: true })
    public groupTasks!: GroupTaskModel[]
}

export default getModelForClass(GroupModel);