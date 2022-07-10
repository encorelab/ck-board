export class TagSpecialAttributes {
  borderWidth?: number;
  borderColor?: string;
  fillColor?: string;
  opacity?: number;
}

export class Tag {
  boardID: string;
  tagID: string;
  name: string;
  color: string;
  specialAttributes?: TagSpecialAttributes;
}
