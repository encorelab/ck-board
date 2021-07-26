export interface DialogInterface {
    header: string;
    label: string;
    callBack: (input:string) => void;
  }