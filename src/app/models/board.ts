export class Board {
    boardID: string
    name: string;
    bgImage?: {
        url: string;
        imgSettings: {};
    };
    permissions: {
        allowStudentMoveAny: boolean;
    }; 
    members: [string];
}