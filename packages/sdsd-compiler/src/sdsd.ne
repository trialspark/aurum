@preprocessor typescript

@{%
import { lexer } from './lexer';
import {
  args,
  bothWindow,
  codelistDefinition,
  codelistExtension,
  codelistMember,
  columnDefinition,
  columnMapping,
  columnMappingSource,
  datasetDefinition,
  datasetExtension,
  datasetMapping,
  day as dayFn,
  directive as directiveFn,
  domainChildren,
  domainDefinition,
  domainExtension,
  domainExtensionChildren,
  hour as hourFn,
  hoursListMembers,
  identifier as identifierFn,
  identifierList,
  interfaceDefinition,
  keyValuePair,
  main,
  milestoneDefinition,
  negativeWindow,
  path,
  pathList,
  positiveWindow,
  sourceCode,
  string as stringFn,
  studyDay,
  studyDefinition,
  timeExpression,
  timeOperator,
  timeconf as timeconfFn,
  timeList,
  timeListMembers,
  timeRange,
  timeValue,
  typeExpression,
  typeExpressionMember,
  value,
  variableMapping,
  window,
} from './postprocessors';
%}

@lexer lexer

main                    -> (studyDefinition |
                            milestoneDefinition |
                            codelistDefinition |
                            codelistExtension |
                            interfaceDefinition |
                            domainDefinition |
                            domainExtension |
                            datasetMapping):* {% main %}

studyDefinition         -> "study" %openbr keyValuePair:* %closebr {% studyDefinition %}
milestoneDefinition     -> "milestone" identifier %openbr keyValuePair:* %closebr {% milestoneDefinition %}
interfaceDefinition     -> "interface" identifier %openbr columnDefinition:* %closebr {% interfaceDefinition %}
codelistDefinition      -> "codelist" identifier %openbr codelistMember:* %closebr {% codelistDefinition %}
codelistExtension       -> "extend" "codelist" path %openbr codelistMember:* %closebr {% codelistExtension %}
domainDefinition        -> "domain" (string | identifier) directive:* %openbr domainChildren %closebr {% domainDefinition %}
domainExtension         -> "extend" "domain" (string | identifier) directive:* %openbr domainExtensionChildren %closebr {% domainExtension %}
datasetMapping          -> "map" "dataset" path ("with" variableMapping:+):? %openbr columnMapping:* %closebr {% datasetMapping %}

domainChildren          -> (datasetDefinition):* {% domainChildren %}
domainExtensionChildren -> (datasetDefinition | datasetExtension):* {% domainExtensionChildren %}
datasetDefinition       -> "dataset" identifier ("implements" pathList):? directive:* %openbr columnDefinition:* %closebr {% datasetDefinition %}
datasetExtension        -> "extend" datasetDefinition {% datasetExtension %}

keyValuePair            -> identifier %colon value {% keyValuePair %}
columnDefinition        -> identifier typeExpression directive:* {% columnDefinition %}
codelistMember          -> (string | identifier) directive:* {% codelistMember %}
variableMapping         -> identifier "as" %openparen args %closeparen {% variableMapping %}
columnMapping           -> identifier columnMappingSource:+ (%arrow sourceCode):? {% columnMapping %}
columnMappingSource     -> "from" identifier ("as" identifier):? sourceCode {% columnMappingSource %}

directive               -> %directive (%openparen args:? %closeparen):? {% directiveFn %}
typeExpression          -> (typeExpressionMember %pipe):* typeExpressionMember {% typeExpression %}
typeExpressionMember    -> identifier %question:? {% typeExpressionMember %}
value                   -> (string | timeconf) {% value %}
identifier              -> %identifier {% identifierFn %}
path                    -> identifier (%dot identifier):* {% path %}
sourceCode              -> %codeblock %sourcecode:? %endcodeblock {% sourceCode %}

args                    -> (value %comma):* value %comma:? {% args %}
identifierList          -> (identifier %comma):* identifier %comma:? {% identifierList %}
pathList                -> (path %comma):* path %comma:? {% pathList %}

timeconf                -> %timeconf timeconfRoot %timeconfend {% timeconfFn %}
timeconfRoot            -> (timeExpression |
                            timeList) {% id %}
studyDay                -> day window:? {% studyDay %}
window                  -> (positiveWindow |
                            negativeWindow |
                            bothWindow |
                            (positiveWindow negativeWindow) |
                            (negativeWindow positiveWindow)) {% window %}
positiveWindow          -> %plus day {% positiveWindow %}
negativeWindow          -> %minus day {% negativeWindow %}
bothWindow              -> %plus %minus day {% bothWindow %}
day                     -> %day {% dayFn %}
hour                    -> %hour {% hourFn %}
timeExpression          -> timeOperator timeValue {% timeExpression %}
timeOperator            -> (%gt | %lt | %gte | %lte) {% timeOperator %}
timeRange               -> timeValue %thru timeValue {% timeRange %}
timeList                -> timeListMembers ("at" hoursListMembers):? {% timeList %}
timeListMembers         -> (timeValue %comma):* timeValue %comma:? {% timeListMembers %}
hoursListMembers        -> (hour %comma):* hour %comma:? {% hoursListMembers %}
timeValue               -> (studyDay | identifier | timeRange) {% timeValue %}

string                  -> %string {% stringFn %}
