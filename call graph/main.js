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

var arr_depth_stack = [];

var arr_function_declarations = [];
var arr_call_expressions = [];

(function () {

    /**
     * ASTを深さ優先探索で巡回する。
     * @param {AstNode} root ASTのルートノード。
     * @param {EstraverseVisitor} visitor 巡回オブジェクト（Visitorパターン）。
     */
    mod_estraverse.traverse(
        obj_AST_of_js_code,
        {
            /**
             * ノードに訪れたときに実行される。thisにestraverse.Controllerのインスタンスにアクセスできる。
             * @param {AstNode} obj_current_node 訪問したノード。
             * @param {AstNode} obj_parent_node 訪問したノードの親ノード。
             * @this {estraverse.Controller}
             */
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
                
                if(obj_current_node.type == "FunctionDeclaration"){

                    //引数表示用文字列の作成
                    var str_arg = ""
                    var num_i = 0;
                    if(num_i < obj_current_node.params.length){
                        str_arg = obj_current_node.params[num_i].name;
                    }
                    for(num_i = 1 ; num_i < obj_current_node.params.length ; num_i++){
                        str_arg += ", " + obj_current_node.params[num_i].name;
                    }
                    console.log(obj_current_node.id.name + "(" + str_arg + ")");

                    // var num_idx_of_depth_stack;
                    // for(num_idx_of_depth_stack = (arr_depth_stack.length - 2) ; num_idx_of_depth_stack >= 0 ; num_idx_of_depth_stack--){
                    //     var str_type = arr_depth_stack[num_idx_of_depth_stack].type;
                    //     if(str_type == "Program" || str_type == "FunctionDeclaration"){
                    //         break;
                    //     }
                    // }

                    // var arr_tmp_scope = [];
                    // var num_i = 0;
                    // for(num_i = 0 ; num_i <= num_idx_of_depth_stack ; num_i ++){
                    //     arr_tmp_scope.push(arr_depth_stack[num_i]);
                    // }

                    arr_function_declarations.push({
                        obj_AST_node:obj_current_node,
                        arr_scope_stack:fnc_make_scope_stack(obj_current_node)
                    });
                }

                if(obj_current_node.type == "CallExpression"){

                    switch(obj_current_node.callee.type){
                        case 'Identifier':
                        {
                            //<note>
                            //
                            // "type": "CallExpression",
                            // "callee": {
                            //     "type": "Identifier",
                            //     "name": <関数名>
                            // },
                            // "arguments": [
                            //     {
                            //         "type": "Literal",
                            //         "value": 2,
                            //         "raw": "2"
                            //     },
                            //     {
                            //         "type": "Literal",
                            //         "value": 3,
                            //         "raw": "3"
                            //     }
                            // ]
                            //

                            arr_call_expressions.push({
                                obj_AST_node:obj_current_node,
                                arr_scope_stack_of_caller:fnc_make_scope_stack(obj_current_node)
                            });

                            break;
                        }
                        case 'MemberExpression':
                        {
                            //<note>
                            //
                            // "type": "CallExpression",
                            // "callee": {
                            //     "type": "MemberExpression",
                            //     "computed": false,
                            //     "object": {
                            //         "type": "Identifier",
                            //         "name": "console"
                            //     },
                            //     "property": {
                            //         "type": "Identifier",
                            //         "name": "log"
                            //     }
                            // },
                            // "arguments": [
                            //     {
                            //         "type": "Identifier",
                            //         "name": <変数名>
                            //     }
                            // ]
                            console.error("unknown callee type found");
                            break;
                        }
                        default:
                        {
                            console.error("unknown callee type found");
                            break;
                        }    
                    }
                }
            }
        }
    );

    function fnc_make_scope_stack(obj_current_node){

        var arr_scope_stack = [];

        for(var num_idx_of_depth_stack = 0 ; num_idx_of_depth_stack < (arr_depth_stack.length-1) ; num_idx_of_depth_stack++){
            var str_type = arr_depth_stack[num_idx_of_depth_stack].type;
            if(str_type == "Program" || str_type == "FunctionDeclaration"){
                arr_scope_stack.push(arr_depth_stack[num_idx_of_depth_stack]);
            }
        }

        return arr_scope_stack;
    }

}());

console.log("\n# FunctionDeclarations\n");

arr_function_declarations.forEach(function(obj_function_declaration){

    //引数表示用文字列の作成
    var str_arg = ""
    var num_i = 0;
    if(num_i < obj_function_declaration.obj_AST_node.params.length){
        str_arg = obj_function_declaration.obj_AST_node.params[num_i].name;
    }
    for(num_i = 1 ; num_i < obj_function_declaration.obj_AST_node.params.length ; num_i++){
        str_arg += ", " + obj_function_declaration.obj_AST_node.params[num_i].name;
    }
    console.log(obj_function_declaration.obj_AST_node.id.name + "(" + str_arg + ")");
    
    
    var str = "";
    var i = 0;
    if(i < obj_function_declaration.arr_scope_stack.length){
        str += obj_function_declaration.arr_scope_stack[i].type;
    }
    for(i = 1 ; i < obj_function_declaration.arr_scope_stack.length ; i ++){
        str += "/" + obj_function_declaration.arr_scope_stack[i].type;
    }
    console.log("scope:" + str);
});

console.log("\n# Function Caller, Callees\n");

arr_call_expressions.forEach(function(obj_call_expression){

    var obj_function_declaration_of_caller = obj_call_expression.arr_scope_stack_of_caller[obj_call_expression.arr_scope_stack_of_caller.length-1];

    var str_arg = ""
    if(obj_function_declaration_of_caller.type == 'FunctionDeclaration'){

        var num_i = 0;
        if(num_i < obj_function_declaration_of_caller.params.length){
            str_arg = obj_function_declaration_of_caller.params[num_i].name;
        }
        for(num_i = 1 ; num_i < obj_function_declaration_of_caller.params.length ; num_i++){
            str_arg += ", " + obj_function_declaration_of_caller.params[num_i].name;
        }
        str_arg = obj_function_declaration_of_caller.id.name + "(" + str_arg + ")";

    }else{
        str_arg = "Program";
    }

    console.log("Caller:" + str_arg);

});