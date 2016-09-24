//#set _DEBUG = 1           // this is a comment

/*#if _DEBUG                // closing multiline comment */
    //#if process.env.devmode === 'production'
    //#set _DEBUG 0         // the `=` is optional
    //#else                 <- anything after `else` or `endif` will be ignored
/* eslint-disable no-console */
console.log('Debug mode on.')
    //#endif//comment
//#endif _DEBUG             // here, _DEBUG is ignored as well
