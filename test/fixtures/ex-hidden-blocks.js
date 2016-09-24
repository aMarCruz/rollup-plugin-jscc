/*#if !process.env.LANG || process.env.LANG!=='---' //will be true, but it tests that process.env is accesible
import mylib from 'browser-lib';
//#else //*/
import mylib from 'node-lib';
//#endif

mylib.doSomething();
