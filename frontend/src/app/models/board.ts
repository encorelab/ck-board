import { Permissions } from "./permissions";
import { Tag } from "./post";

export class Board {
    boardID: string;
    teacherID: string;
    public: boolean;
    name: string;
    task: {
        title: string;
        message?: string;
    }
    bgImage?: {
        url: string;
        imgSettings: {};
    };
    permissions: Permissions; 
    members: [];
    tags: Tag[];
}