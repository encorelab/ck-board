export class TagSpecialAttributes {
  borderWidth?: number;
  borderColor?: string;
  fillColor?: string;
  opacity?: number;
}

export class Tag {
  boardID: string;
  name: string;
  color: string;
  specialAttributes?: TagSpecialAttributes;
}
