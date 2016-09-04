//#set __EXPR = 0
//#if __EXPR
false
//#endif
//#set __EXPR = !__EXPR
//#if __EXPR
true
//#endif
//#set __EXPR = 'foobar'.slice(0,3)
//#if __EXPR === 'foo'
foo
//#endif