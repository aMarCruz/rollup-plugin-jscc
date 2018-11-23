//#if _DEBUG
//#set _DEBUGOUT 'console.log'
//#elif 0
const $_DEBUGOUT = console.log;
//#else
//#set _DEBUGOUT '//'
//#endif
$_DEBUGOUT('hello jscc!');
