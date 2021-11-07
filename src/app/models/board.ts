export class Board {
    boardID: string;
    teacherID: string;
    name: string;
    task: {
        title: string;
        message?: string;
    }
    bgImage?: {
        url: string;
        imgSettings: {};
    };
    permissions: {
        allowStudentMoveAny: boolean;
    }; 
    members: [];
    tags: [];
}