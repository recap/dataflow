/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b	return 'NUMBER'
[a-zA-Z][a-zA-Z0-9-_]*	return 'STATE'
"*"						return '*'
"/"						return '/'
"-"						return '-'
"+"						return '+'
"^"						return '^'
"|"						return '|'
"&"						return '&'
"!"						return '!'
"("						return '('
")"						return ')'
"PI"					return 'PI'
"E"						return 'E'
<<EOF>>					return 'EOF'
.						return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%left UMINUS
%left '!'
%left '|'
%left '&'

%start expressions

%% /* language grammar */

expressions
    : e EOF
        {return $1;}
    ;

s 
  : STATE
	{$$ = 'lookUp(\'' + $1 + '\')';}
;
e
    : e '+' e
        {$$ = $1+$3;}
    | e '-' e
        {$$ = $1-$3;}
    | e '*' e
        {$$ = $1*$3;}
    | e '/' e
        {$$ = $1/$3;}
    | '-' e %prec UMINUS
        {$$ = -$2;}
    | '!' e %prec '!'
		{$$ = '!' + $2;}
    | '(' e ')'
        {$$ = '(' + $2 + ')';}
    | NUMBER
        {$$ = Number(yytext);}
    | s
		{$$ = $1;}
	| e '|' e
		{$$ = $1 + '|' + $3;}
	| e '&' e
		{$$ = $1+ '&' +$3;}
    | e '^' e
        {$$ = '(!' + $1 + '&' + $3 + ') | (' + $1 + '&!' + $3 + ')' ;}
    ;

