# The function declaration (function statement)

```
function func0_no_arg(){
    return 1;
}
```

```
function func1_2_args(arg1, arg2){
    return arg1 + arg2;
}
```

# The function expression (function expression)

```
var var_with_name = function func_with_name(){
    return 'str';
};
```

```
var var_anonymous = function(){
    return 'str';
};
```

## Call back
```
function do_by_callback(func_callback){
    func_callback('do something');
}

var func_calllee = function do_log(do_by_this){
    console.log(do_by_this);
}

do_by_callback(func_calllee);

```

```
function do_by_callback(func_callback){
    func_callback('do something');
}

function do_log(do_by_this){
    console.log(do_by_this);
}

do_by_callback(do_log);

```

## Method

```
var instatiated = new clsfunc_a();
function clsfunc_a(){
    this.method1 = function(){console.log('str');}
}
instatiated.method1;
```

### prototype を使った方法 //todo 動かない
```
var instatiated = new clsfunc_a();
function clsfunc_a(){
    
}
instatiated.prototype.method1 = function(){console.log('str');}
instatiated.method1;
```

### prototype chain //todo

### 

## IIFE (Immediately Invoked Function Expression; 即時実行関数式) 
```
(function func_with_name(){
  console.log('func_with_name() in IIFE');
})();
```

```
(function(){
  console.log('anonymous in IIFE');
})();
```

# The generator function declaration (function* statement)

->Not compatible

# The generator function expression (function* expression)

->Not compatible

# The arrow function expression (=>)

->Not compatible

# The Function constructor

->Not compatible

# The GeneratorFunction constructor

->Not compatible

# Getter and setter functions

->Not compatible


//todo
# Function parameters

## Default parameters

## Rest parameters

# The arguments object

->Not compatible