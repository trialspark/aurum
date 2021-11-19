import {
  Document,
  Expression,
  Identifier,
  KeyValuePair,
  MilestoneDefinition,
  String,
  StudyDefinition,
} from "./astTypes";
import {
  CloseBrToken,
  ColonToken,
  IdentifierToken,
  MilestoneToken,
  OpenBrToken,
  StringToken,
  StudyToken,
} from "./lexer";

type WhiteSpace = null;

export const main = (
  [topLevelDefs]: [MilestoneDefinition | StudyDefinition][],
  loc: number
): Document => ({
  type: "document",
  children: topLevelDefs.flat(),
  loc,
});

export const studyDefinition = ([, study, , , , KeyValuePairs]: [
  WhiteSpace,
  StudyToken,
  WhiteSpace,
  OpenBrToken,
  WhiteSpace,
  KeyValuePair[],
  WhiteSpace,
  CloseBrToken,
  WhiteSpace
]): StudyDefinition => ({
  type: "study-definition",
  loc: study.offset,
  children: KeyValuePairs,
});

export const milestoneDefinition = ([
  ,
  milestone,
  ,
  name,
  ,
  ,
  ,
  keyValuePairs,
]: [
  WhiteSpace,
  MilestoneToken,
  WhiteSpace,
  Identifier,
  WhiteSpace,
  OpenBrToken,
  WhiteSpace,
  KeyValuePair[],
  WhiteSpace,
  CloseBrToken,
  WhiteSpace
]): MilestoneDefinition => ({
  type: "milestone-definition",
  loc: milestone.offset,
  name,
  children: keyValuePairs,
});

export const keyValuePair = ([identifier, , , , string]: [
  Identifier,
  WhiteSpace,
  ColonToken,
  WhiteSpace,
  String,
  WhiteSpace
]): KeyValuePair => ({
  type: "key-value-pair",
  loc: identifier.loc,
  lhs: identifier,
  rhs: string,
});

export const expression = ([[expression]]: [Expression][]): Expression =>
  expression;

export const identifier = ([token]: [IdentifierToken]): Identifier => ({
  type: "identifier",
  loc: token.offset,
  value: token.toString(),
});

export const string = ([token]: [StringToken]): String => ({
  type: "string",
  loc: token.offset,
  value: token.value.substring(1, token.value.length - 1),
});

export const _ = () => null;

export const __ = () => null;
