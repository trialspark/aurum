@preprocessor typescript

@{%
import { lexer } from './lexer';
import {
  _,
  __,
  args,
  bothWindow,
  columnDefinition,
  day as dayFn,
  directive as directiveFn,
  identifier as identifierFn,
  interfaceDefinition,
  keyValuePair,
  main,
  milestoneDefinition,
  negativeWindow,
  positiveWindow,
  string as stringFn,
  studyDay,
  studyDefinition,
  timeExpression,
  timeOperator,
  timeconf as timeconfFn,
  value,
  window,
} from './postprocessors';
%}

@lexer lexer

main                -> (studyDefinition |
                        milestoneDefinition |
                        interfaceDefinition):* {% main %}

studyDefinition     -> _ "study" _ %openbr _ keyValuePair:* _ %closebr _ {% studyDefinition %}
milestoneDefinition -> _ "milestone" __ identifier _ %openbr _ keyValuePair:* _ %closebr _ {% milestoneDefinition %}
interfaceDefinition -> _ "interface" __ identifier _ %openbr _ columnDefinition:* _ %closebr _ {% interfaceDefinition %}

keyValuePair        -> identifier _ %colon _ value _ {% keyValuePair %}
columnDefinition    -> identifier __ identifier __ directive:* {% columnDefinition %}

directive           -> _ %directive (%openparen args:? %closeparen):? _ {% directiveFn %}
value               -> (string | timeconf) {% value %}
identifier          -> %identifier {% identifierFn %}

args                -> _ ((value _ %comma):* value _ %comma:?) _ {% args %}

timeconf            -> %timeconf _ (studyDay | timeExpression) _ %timeconfend {% timeconfFn %}
studyDay            -> day (__ window):? {% studyDay %}
window              -> (positiveWindow |
                        negativeWindow |
                        bothWindow |
                        (positiveWindow __ negativeWindow) |
                        (negativeWindow __ positiveWindow)) {% window %}
positiveWindow      -> %plus day {% positiveWindow %}
negativeWindow      -> %minus day {% negativeWindow %}
bothWindow          -> %plus %minus day {% bothWindow %}
day                 -> %day {% dayFn %}
timeExpression      -> timeOperator _ identifier {% timeExpression %}
timeOperator        -> (%gt | %lt | %gte | %lte) {% timeOperator %}

string              -> %string {% stringFn %}

__                  -> %ws {% __ %}
_                   -> __:? {% _ %}
