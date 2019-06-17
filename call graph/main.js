//<settings>----------------------------------------------------------------------

//パース対象ファイルは 1st argment(= process.argv[2] に指定される事とする)
var argnum_of_target_file_path = 2;

//パース対象ファイルの encoding
var encoding_of_target_file = "utf-8";

//パース時に生成された AST object をファイル出力するかどうか
var bl_enable_output_AST_obj_as_JSON_file = true;

//パース時に生成された AST object をファイル出力する場合の、ファイル名 suffix
var str_suffix_of_stringified_AST_obj_file_name = "_ast";

//---------------------------------------------------------------------</settings>

// load module
var mod_fs = require('fs');
var mod_path = require('path');
var mod_esprima = require('esprima');
var mod_estraverse = require('estraverse');

//Argment check
if(process.argv.length <= argnum_of_target_file_path){ //パース対象ファイル指定が無い場合
    console.error("To parsing file is not specified.");
    return; //終了
}

//File open and read as text
var str_js_code = mod_fs.readFileSync(
    process.argv[argnum_of_target_file_path], // to open file path
    {
        encoding: encoding_of_target_file
    }
);

//Parse JavaScript code using esprima
var obj_AST_of_js_code = mod_esprima.parseScript(str_js_code); // get AST(Abstract Syntax Tree) object

if(bl_enable_output_AST_obj_as_JSON_file){ //パース時に生成された AST object をファイル出力する設定の場合
    
    //ファイル出力先 path 生成
    var str_dir_of_target_file = mod_path.dirname(process.argv[argnum_of_target_file_path]); //パース指定対象ファイルの格納ディレクトリ取得
    var str_no_ext_file_name_of_target_file = mod_path.basename(process.argv[argnum_of_target_file_path], mod_path.extname(process.argv[argnum_of_target_file_path])); //パース指定対象ファイル拡張子抜きファイル名の取得
    var str_fullpath_of_stringified_AST_obj_file =
        str_dir_of_target_file + '\\' +
        str_no_ext_file_name_of_target_file +
        str_suffix_of_stringified_AST_obj_file_name +
        ".json"
    ;

    //ファイル出力
    mod_fs.writeFile(
        str_fullpath_of_stringified_AST_obj_file, // 出力ファイルパス
        JSON.stringify(obj_AST_of_js_code, null, '    '), // 出力内容('    '(スペース4つ)で indent 整形した AST object を指定)
        function(err){ //ファイル出力中にエラーが発生した場合の callback function
            if(err){
                throw err;
            }
        }
    );
}

console.log("# Adding scope info");

(function () {
    var arr_depth_stack = [];

    mod_estraverse.traverse(
        obj_AST_of_js_code,
        {
            enter: function(obj_current_node, obj_parent_node) {

                //<現在の node の位置を arr_depth_stack[] に保存する>----------------------------------

                if(typeof obj_parent_node == 'object'){
                    var num_idx_of_depth_stack;
                    for(num_idx_of_depth_stack = (arr_depth_stack.length - 1) ; num_idx_of_depth_stack >= 0 ; num_idx_of_depth_stack--){
                        if(arr_depth_stack[num_idx_of_depth_stack] == obj_parent_node){
                            break;
                        }
                    }

                    if(num_idx_of_depth_stack < (arr_depth_stack.length - 1)){
                        arr_depth_stack.splice(num_idx_of_depth_stack+1, arr_depth_stack.length-(num_idx_of_depth_stack+1));
                    }
                }
                arr_depth_stack.push(obj_current_node);

                //デバッグ用表示 (for arr_depth_stack[])
                (function () {
                    var str = "";
                    var i = 0;
                    if(i < arr_depth_stack.length){
                        str += arr_depth_stack[i].type;
                    }
                    for(i = 1 ; i < arr_depth_stack.length ; i ++){
                        str += "/" + arr_depth_stack[i].type;
                    }
                    console.log(str);
                }());
                
                //---------------------------------</現在の node の位置を arr_depth_stack[] に保存する>

                var bool_is_scope_node = false;
                
                switch(obj_current_node.type){
                    case 'Program':
                    case 'FunctionExpression':
                    case 'FunctionDeclaration':
                    {
                        bool_is_scope_node = true;
                    }
                    case 'VariableDeclarator':
                    case 'AssignmentExpression':
                    case 'CallExpression':
                    case 'ReturnStatement':
                    {
                        if(bool_is_scope_node){
                            if((typeof obj_current_node.TraversedObj_BelongingObjects) == 'undefined'){
                                obj_current_node.TraversedObj_BelongingObjects = [];
                                obj_current_node.TraversedObj_NestedFunctions = [];
                                obj_current_node.TraversedObj_Closurings = [];
                            }
                        }
                        
                        var obj_parent_function = null;
                        for(var i =arr_depth_stack.length-2 ; i >= 0 ; i--){
                            switch(arr_depth_stack[i].type){
                                case 'Program':
                                case 'FunctionExpression':
                                case 'FunctionDeclaration':
                                {
                                    obj_parent_function = arr_depth_stack[i];
                                    switch(obj_current_node.type){
                                        case 'VariableDeclarator':
                                        {
                                            arr_depth_stack[i].TraversedObj_BelongingObjects.push(obj_current_node);
                                            arr_depth_stack[i].TraversedObj_Closurings.push(obj_current_node);
                                            break;
                                        }
                                        case 'FunctionExpression':
                                        {
                                            arr_depth_stack[i].TraversedObj_NestedFunctions.push(obj_current_node);
                                            break;
                                        }
                                        case 'FunctionDeclaration':
                                        {
                                            arr_depth_stack[i].TraversedObj_BelongingObjects.push(obj_current_node);
                                            arr_depth_stack[i].TraversedObj_NestedFunctions.push(obj_current_node);
                                            break;
                                        }
                                        case 'AssignmentExpression':
                                        case 'CallExpression':
                                        case 'ReturnStatement':
                                        {
                                            arr_depth_stack[i].TraversedObj_Closurings.push(obj_current_node);
                                            break;
                                        }
                                        default:
                                        {
                                            //nothing to do
                                            break;
                                        }
                                    }

                                    i = 0; //break `for` statement
                                    break;
                                }
                                default:
                                {
                                    //nothing to do
                                    break;
                                }
                            }
                        }
                        
                        if(bool_is_scope_node){
                            obj_current_node.TraversedObj_ParentFunction = obj_parent_function;
                        }

                        break;
                    }
                    default:
                    {
                        //nothing to do
                        break;
                    }
                }
            }
        }
    );
}());

console.log("\n# Closurings");

(function () {

    var arr_depth_stack = [];

    mod_estraverse.traverse(
        obj_AST_of_js_code,
        {
            enter: function(obj_current_node, obj_parent_node) {

                //<現在の node の位置を arr_depth_stack[] に保存する>----------------------------------

                if(typeof obj_parent_node == 'object'){
                    var num_idx_of_depth_stack;
                    for(num_idx_of_depth_stack = (arr_depth_stack.length - 1) ; num_idx_of_depth_stack >= 0 ; num_idx_of_depth_stack--){
                        if(arr_depth_stack[num_idx_of_depth_stack] == obj_parent_node){
                            break;
                        }
                    }

                    if(num_idx_of_depth_stack < (arr_depth_stack.length - 1)){
                        arr_depth_stack.splice(num_idx_of_depth_stack+1, arr_depth_stack.length-(num_idx_of_depth_stack+1));
                    }
                }
                arr_depth_stack.push(obj_current_node);

                //デバッグ用表示 (for arr_depth_stack[])
                (function () {
                    var str = "";
                    var i = 0;
                    if(i < arr_depth_stack.length){
                        str += arr_depth_stack[i].type;
                    }
                    for(i = 1 ; i < arr_depth_stack.length ; i ++){
                        str += "/" + arr_depth_stack[i].type;
                    }
                    console.log(str);
                }());
                
                //---------------------------------</現在の node の位置を arr_depth_stack[] に保存する>

                switch(obj_current_node.type){
                    case 'Program':
                    case 'FunctionExpression':
                    case 'FunctionDeclaration':
                    {
                        for(var i = 0 ; i < obj_current_node.TraversedObj_Closurings.length ; i++){
                            var obj_closuring = obj_current_node.TraversedObj_Closurings[i];
                            console.log("  TraversedObj_Closurings[" + String(i) + "].type: " + obj_closuring.type);
                            
                            switch(obj_closuring.type){
                                case 'VariableDeclarator':
                                {
                                    if(typeof obj_closuring.id.TraversedObj_Closures == 'undefined'){
                                        obj_closuring.id.TraversedObj_Closures = [];
                                    }
                                    obj_closuring.id.TraversedObj_Closures.push(obj_closuring.init);
                                    break;
                                }
                                case 'AssignmentExpression':
                                {
                                    switch(obj_closuring.left.type){
                                        case 'Identifier':
                                        {
                                            for(var j = 0 ; j < obj_current_node.TraversedObj_BelongingObjects.length ; j++){
                                            }
                                            break;
                                        }
                                        default:
                                        {
                                            //todo 別のパターンがないかどうか
                                        }
                                    }
                                    break;
                                }
                                case 'CallExpression':
                                case 'ReturnStatement':
                            }
                        }
                        break;
                    }
                    default:
                    {
                        //nothing todo
                        break;
                    }
                }
            }
        }
    );
}());
