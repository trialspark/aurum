@preprocessor typescript

@{%
import { lexer } from './lexer';
import {
  _,
  __,
  expression,
  identifier as identifierFn,
  keyValuePair,
  main,
  milestoneDefinition,
  string as stringFn,
  studyDefinition,
  timeOperator,
  timeconf as timeconfFn,
  timeExpression,
  day as dayFn,
  window,
  bothWindow,
  negativeWindow,
  positiveWindow,
  studyDay,
} from './postprocessors';
%}

@lexer lexer

main                -> (studyDefinition |
                        milestoneDefinition):* {% main %}

studyDefinition     -> _ "study" _ %openbr _ keyValuePair:* _ %closebr _ {% studyDefinition %}
milestoneDefinition -> _ "milestone" __ identifier _ %openbr _ keyValuePair:* _ %closebr _ {% milestoneDefinition %}

keyValuePair        -> identifier _ %colon _ expression _ {% keyValuePair %}

expression          -> (string | timeconf) {% expression %}
identifier          -> %identifier {% identifierFn %}

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
