//#set _FOO 2
//#set _BAR 2
//#set _BAZ 2

//#if _FOO == 1
//#elif _FOO == 2
true
  //#if _BAR == 2
true
    //#if _BAZ == 1
    //#else
true
    //#endif
  //#endif
//#endif
