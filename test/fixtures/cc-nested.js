//#set __FOO 2
//#set __BAR 2
//#set __BAZ 2

//#if __FOO == 1
//#elif __FOO == 2
true
  //#if __BAR == 2
true
    //#if __BAZ == 1
    //#else
true
    //#endif
  //#endif
//#endif
