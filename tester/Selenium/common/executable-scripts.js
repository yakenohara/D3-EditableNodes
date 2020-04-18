//
// Returns objectified CSSStyleDeclaration(s) of element(s) by XPath
//
module.exports.func_genScript_getComputedStyleByXPath = function(str_xpath){
    return (        
`((function(){
    
    var objarr_CSSStyleDeclarations = [];

    var iterator = document.evaluate(
        \`${str_xpath}\`,
        document,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
    );

    var obj_element = iterator.iterateNext();
    while (obj_element) {
        var obj_computedStyle = window.getComputedStyle(obj_element);
        var obj_styleDef = {};
        for(var int_idxOfStyle = 0 ; int_idxOfStyle < obj_computedStyle.length ; int_idxOfStyle++){
            var str_propertyName = obj_computedStyle.item(int_idxOfStyle);
            obj_styleDef[str_propertyName] = {
                'priority': obj_computedStyle.getPropertyPriority(str_propertyName),
                'value': obj_computedStyle.getPropertyValue(str_propertyName)
            }
        }
        objarr_CSSStyleDeclarations.push(obj_styleDef);
        obj_element = iterator.iterateNext();
    }
    
    return objarr_CSSStyleDeclarations;

})())`
    );
}
