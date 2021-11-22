@preprocessor typescript

@{%
import { lexer } from './lexer';
import {
  _,
  __,
  args,
  bothWindow,
  codelistDefinition,
  codelistMember,
  columnDefinition,
  day as dayFn,
  directive as directiveFn,
  identifier as identifierFn,
  identifierList,
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
  timeList,
  timeValue,
  typeExpression,
  typeExpressionMember,
  value,
  window,
} from './postprocessors';
%}

@lexer lexer

main                 -> (studyDefinition |
                         milestoneDefinition |
                         interfaceDefinition |
                         codelistDefinition |
                         domainDefinition):* {% main %}

studyDefinition      -> _ "study" _ %openbr _ keyValuePair:* _ %closebr _ {% studyDefinition %}
milestoneDefinition  -> _ "milestone" __ identifier _ %openbr _ keyValuePair:* _ %closebr _ {% milestoneDefinition %}
interfaceDefinition  -> _ "interface" __ identifier _ %openbr _ columnDefinition:* _ %closebr _ {% interfaceDefinition %}
codelistDefinition   -> _ "codelist" __ identifier _ %openbr _ codelistMember:* _ %closebr _ {% codelistDefinition %}
domainDefinition     -> _ "domain" ((_ string) | (__ identifier)) _ directive:* _ %openbr _ domainChildren _ %closebr

domainChildren       -> (datasetDefinition):*
datasetDefinition    -> _ "dataset" __ identifier (__ "implements" __ identifierList):? __ directive:* _ %openbr _ columnDefinition:* _ %closebr _

keyValuePair         -> identifier _ %colon _ value _ {% keyValuePair %}
columnDefinition     -> identifier __ typeExpression __ directive:* {% columnDefinition %}
codelistMember       -> (string | identifier) __ directive:* {% codelistMember %}

directive            -> _ %directive (%openparen args:? %closeparen):? _ {% directiveFn %}
typeExpression       -> (typeExpressionMember _ %pipe _):* typeExpressionMember {% typeExpression %}
typeExpressionMember -> identifier %question:? {% typeExpressionMember %}
value                -> (string | timeconf) {% value %}
identifier           -> %identifier {% identifierFn %}

args                 -> _ ((value _ %comma _):* value _ %comma:?) _ {% args %}
identifierList       -> _ ((identifier _ %comma _):* identifier _ %comma:?) _ {% identifierList %}

timeconf             -> %timeconf _ timeconfRoot _ %timeconfend {% timeconfFn %}
timeconfRoot         -> (timeExpression |
                         timeRange |
                         timeList) {% id %}
studyDay             -> day (__ window):? {% studyDay %}
window               -> (positiveWindow |
                         negativeWindow |
                         bothWindow |
                         (positiveWindow __ negativeWindow) |
                         (negativeWindow __ positiveWindow)) {% window %}
positiveWindow       -> %plus day {% positiveWindow %}
negativeWindow       -> %minus day {% negativeWindow %}
bothWindow           -> %plus %minus day {% bothWindow %}
day                  -> %day {% dayFn %}
timeExpression       -> timeOperator _ timeValue {% timeExpression %}
timeOperator         -> (%gt | %lt | %gte | %lte) {% timeOperator %}
timeRange            -> timeValue _ %thru _ timeValue
timeList             -> (timeValue _ %comma _):* (timeValue _ %comma:?):? {% timeList %}
timeValue            -> (studyDay | identifier) {% timeValue %}

string               -> %string {% stringFn %}

__                   -> %ws {% __ %}
_                    -> __:? {% _ %}
