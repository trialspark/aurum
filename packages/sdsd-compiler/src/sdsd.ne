@preprocessor typescript

@{%
  interface Node {
    loc: number;
  }

  interface Document extends Node {
    type: "document"
    children: DocumentChild[]
  }

  type DocumentChild = StudyDefinition;

  interface StudyDefinition extends Node {
    type: "study-definition",
    children: KeyValuePair[]
  }

  interface KeyValuePair extends Node {
    type: "key-value-pair";
    lhs: Key;
    rhs: String;
  }

  interface Key extends Node {
    type: 'key';
    value: string;
  }

  interface String extends Node {
    type: 'string';
    value: string;
  }
%}

@{%
  import moo from 'moo';

  const lexer = (() => {
    return moo.compile({
      openbr: '{',
      closebr: '}',
      colon: ':',
      keyword: ['study', 'milestone'],
      string: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
      identifier: /[a-zA-Z$_][a-zA-Z0-9$_.]*/,
      ws: {match: /[ \t\n]+/, lineBreaks: true },
    })
  })();
%}

@lexer lexer

main -> (studyDefinition | milestoneDefinition):* {%
  ([[topLevelDefinitions]], loc): Document => {
    return {
      type: 'document',
      children: topLevelDefinitions,
      loc,
    }
  }
%}

studyDefinition -> %ws:? "study" %ws:? %openbr %ws:? keyValuePair:* %ws:? %closebr %ws:? {%
  ([,studyDef,,,,keyValuePairs], loc): StudyDefinition => {
    return {
      type: 'study-definition',
      children: keyValuePairs,
      loc: studyDef.offset
    }
  }
%}
milestoneDefinition -> %ws:? "milestone" %ws:? identifier %ws:? %openbr %ws:? keyValuePair:* %ws:? %closebr %ws:?

keyValuePair -> key %ws:? %colon %ws:? string %ws:? {%
  ([key,,,,value], loc): KeyValuePair => {
    return {
      type: 'key-value-pair',
      lhs: key,
      rhs: value,
      loc: key.loc,
    }
  }
%}
key -> %identifier {%
  ([chars]): Key => {
    return {
      type: 'key',
      value: chars.toString(),
      loc: chars.offset,
    }
  }
%}
string -> %string {%
  ([chars], loc) => {
    return {
      type: 'string',
      value: chars.value.substring(1, chars.value.length - 1),
      loc: chars.offset,
    }
  }
%}
identifier -> %identifier
