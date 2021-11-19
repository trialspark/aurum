@preprocessor typescript

@{%
import { lexer } from './lexer';
import {
  main,
  studyDefinition,
  milestoneDefinition,
  keyValuePair,
  identifier as identifierFn,
  string as stringFn,
  __,
  _,
} from './postprocessors';
%}

@lexer lexer

main -> (studyDefinition | milestoneDefinition):* {% main %}

studyDefinition -> _ "study" _ %openbr _ keyValuePair:* _ %closebr _ {% studyDefinition %}
milestoneDefinition -> _ "milestone" __ identifier _ %openbr _ keyValuePair:* _ %closebr _ {% milestoneDefinition %}

keyValuePair -> identifier _ %colon _ string _ {% keyValuePair %}
identifier -> %identifier {% identifierFn %}
string -> %string {% stringFn %}

__ -> %ws {% __ %}
_ -> __:? {% _ %}
