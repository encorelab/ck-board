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
    permissions: {
        allowStudentMoveAny: boolean;
    }; 
    members: [];
    tags: [];
    joinCode: string;
}