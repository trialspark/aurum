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
  expression,
} from './postprocessors';
%}

@lexer lexer

main -> (studyDefinition | milestoneDefinition):* {% main %}

studyDefinition -> _ "study" _ %openbr _ keyValuePair:* _ %closebr _ {% studyDefinition %}
milestoneDefinition -> _ "milestone" __ identifier _ %openbr _ keyValuePair:* _ %closebr _ {% milestoneDefinition %}

keyValuePair -> identifier _ %colon _ expression _ {% keyValuePair %}

expression -> (string | timeconf) {% expression %}
identifier -> %identifier {% identifierFn %}

timeconf -> %timeconf _ (studyDay | timeExpression) _ %timeconfend
studyDay -> %day (__ window):?
window -> positiveWindow | negativeWindow | bothWindow | (positiveWindow __ negativeWindow) | (negativeWindow __ positiveWindow)
positiveWindow -> %plus %day
negativeWindow -> %minus %day
bothWindow -> %plus %minus %day
timeExpression -> timeOperator _ identifier
timeOperator -> %gt | %lt | %gte | %lte

string -> %string {% stringFn %}

__ -> %ws {% __ %}
_ -> __:? {% _ %}
