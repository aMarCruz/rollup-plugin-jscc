//#set _EXPR = 0
//#if _EXPR
false
//#endif
//#set _EXPR = !_EXPR
//#if _EXPR
true
//#endif
//#set _EXPR = 'foobar'.slice(0,3)
//#if _EXPR === 'foo'
foo
//#endif
