export interface Node<T extends string> {
  type: T;
  loc: number;
}

export interface Document extends Node<"document"> {
  children: DocumentChild[];
}

export type DocumentChild = StudyDefinition | MilestoneDefinition;

export interface StudyDefinition extends Node<"study-definition"> {
  children: KeyValuePair[];
}

export interface MilestoneDefinition extends Node<"milestone-definition"> {
  name: Identifier;
  children: KeyValuePair[];
}

export interface KeyValuePair extends Node<"key-value-pair"> {
  lhs: Identifier;
  rhs: String;
}

export interface Identifier extends Node<"identifier"> {
  value: string;
}

export interface String extends Node<"string"> {
  value: string;
}
