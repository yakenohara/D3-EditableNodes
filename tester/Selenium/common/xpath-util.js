//
// Returns PredicateExpression that replesents  
// Whether the specified class name exists in the class list  
//
module.exports.func_genPredcateExpr_isExistsInClassList = function(str_className){
    return `(contains(concat(" ",@class," "), " ${str_className} "))`;
}
