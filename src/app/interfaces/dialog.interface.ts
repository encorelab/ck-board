export interface DialogInterface {
    addPost: (title:string, message:string, left: number, top: number) => void;
    top: number;
    left: number;
}