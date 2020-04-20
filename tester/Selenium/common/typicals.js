const {DEPENDS_ON_USER_IMPLI, POLICIES, XPATH_DEF} = require('../ini');
const {Button, By} = require('selenium-webdriver');
const executableScripts = require('../common/executable-scripts');


module.exports.func_waitForElementsLocated = async function(obj_webDriver, func_filter, str_xpath){

    var strarr_xpaths = [];
    var int_startIdxOfXPathInArgs = 2;

    //Argment check
    if(arguments.length < int_startIdxOfXPathInArgs){
        return false;
    }
    
    for(let int_i = int_startIdxOfXPathInArgs ; int_i < arguments.length ; int_i++){
        strarr_xpaths.push(arguments[int_i]);
    }

    var objarr_elements = await obj_webDriver
        .wait(async function(){

            var objarr_tmpElem = [];
            
            for(let int_i = 0 ; int_i < strarr_xpaths.length ; int_i++){
                let str_a_xpath = strarr_xpaths[int_i];
                console.log(`Searching element(s) by XPath:${str_a_xpath}`);
                let obj_elems = await obj_webDriver.findElements(By.xpath(str_a_xpath));
                console.log(`Found:${obj_elems.length}`);
                objarr_tmpElem.push(obj_elems);
            }

            // filter 関数が指定されていた場合は、判定を任せる
            if(typeof func_filter == 'function'){

                if(!(await func_filter(objarr_tmpElem))){
                    console.log('Expected element(s) not found. Retry...');
                    return false;
                }

                return objarr_tmpElem;
            }

            // どれか 1 つでも見つからなかった場合は Retry
            for(let int_j = 0 ; objarr_tmpElem.length ; int_j++){
                if(objarr_tmpElem[int_j].length == 0){
                    return false;
                }
            }

            return objarr_tmpElem;

        },POLICIES.WAIT_MS_FIND_ELEMENTS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                console.error('Expected SVG node not found.');
                return undefined;
            
            }else{
                throw e;
            }
        })
    ;

    return objarr_elements;
}

module.exports.func_waitForStyleApplied = async function(obj_webDriver, func_evaluator, str_xpath){

    var strarr_xpaths = [];
    var int_startIdxOfXPathInArgs = 2;

    //Argment check
    if(arguments.length < int_startIdxOfXPathInArgs){
        return false;
    }
    
    for(let int_i = int_startIdxOfXPathInArgs ; int_i < arguments.length ; int_i++){
        strarr_xpaths.push(arguments[int_i]);
    }

    var objarr_styles = await obj_webDriver
        .wait(async function(){

            var objarr_CSSStyleDeclarationsPerXPath = [];
            
            for(let int_i = 0 ; int_i < strarr_xpaths.length ; int_i++){
                let str_a_xpath = strarr_xpaths[int_i];
                console.log(`Getting computed styles(s) by XPath:${str_a_xpath}`);
                let objarr_CSSStyleDeclarations = await obj_webDriver.executeScript(`return (${executableScripts.func_genScript_getComputedStyleByXPath(str_a_xpath)})`);
                console.log(`Found:${objarr_CSSStyleDeclarations.length}`);
                objarr_CSSStyleDeclarationsPerXPath.push(objarr_CSSStyleDeclarations);
            }

            // evaluator に判定させる
            if(!(await func_evaluator(objarr_CSSStyleDeclarationsPerXPath))){
                return false;
            }

            return objarr_CSSStyleDeclarationsPerXPath;

        }, POLICIES.WAIT_MS_FIND_ELEMENTS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                console.error('Expected SVG node not found.');
                return undefined;
            
            }else{
                throw e;
            }
        })
    ;

    return objarr_styles;
}

module.exports.func_isExitInClassList = async function(obj_element, str_className){
    var str_classContent = await obj_element.getAttribute('class');
    var strarr_classNames = str_classContent.split(' ');
    for(let int_i = 0 ; int_i < strarr_classNames.length ; int_i++){
        if(strarr_classNames[int_i] == str_className){
            return true;
        }
    }
    return false;
}

// click
module.exports.func_clickElement = async function(obj_webDriver, obj_element){

    // Double click Element
    await obj_webDriver
        .actions()
        .move({
            origin:obj_element
        })
        .press(Button.LEFT)
        .release(Button.LEFT)
        .perform()
    ;

}

// Double click
module.exports.func_doubleClickElement = async function(obj_webDriver, obj_element){

    // Double click Element
    await obj_webDriver
        .actions()
        .move({
            origin:obj_element
        })
        .press(Button.LEFT)
        .release(Button.LEFT)
        .press(Button.LEFT)
        .release(Button.LEFT)
        .perform()
    ;

}

// hover
module.exports.func_hoverElement = async function(obj_webDriver, obj_element){

    await obj_webDriver
        .actions()
        .move({
            origin:obj_element
        })
        .perform()
    ;

}