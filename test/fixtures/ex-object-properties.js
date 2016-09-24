//#set _OBJ { prop: 1 }
console.log($_OBJ.prop);          // outputs 1
console.log($_OBJ);               // outputs {"prop":1}
console.log($_OBJ.foo);           // outputs undefined ({"prop":1}.foo)
