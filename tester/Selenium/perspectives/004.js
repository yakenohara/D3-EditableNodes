const {By, logging, until} = require('selenium-webdriver');
var ooo = require('../common/xpath-util');
var xxx = require('../common/executable-scripts');

module.exports.func_doTest = async function(obj_webDriver){

    // <settings>------------------------------------------------------------

    var str_pathOfToLoadFile = 'tester/Selenium/perspectives/002.json';
    var str_toExecScript_1 = `memo0.loadFile(\'${str_pathOfToLoadFile}\');`
    var str_toExecScript_2 = `return (memo0.getCloneOfHistory());`;

    var int_waitMS = 3000;

    // -----------------------------------------------------------</settings>

    var bl_testResult = true;

    // Read Log entries to reset the log buffer
    var objarr_entries = await obj_webDriver
        .manage()
        .logs()
        .get(logging.Type.BROWSER)
    ;
    console.log(`objarr_entries.length:${objarr_entries.length}`);
    for(let int_idxOfEntries = 0 ; int_idxOfEntries < objarr_entries.length ; int_idxOfEntries++){
        let obj_entry = objarr_entries[int_idxOfEntries];
        console.log(`[${obj_entry.level.name}(Lv:${obj_entry.level.value})] ${obj_entry.message}`);
    }

    // Load test json file to `force-layout-memo.js`
    await obj_webDriver.executeScript(str_toExecScript_1);

    // 以下 DOM tree になっている事を確認することで、svg 内に `test content` が追加された事を確認する
    //
    // <div id="force-memo0" ~~~~omitting~~~~ >
    //     <svg class="SVGForNodesMapping context-menu-container-0" style="width: 100%; height: 100%; overflow: hidden; vertical-align: bottom;">
    //         <g class="nodes">
    //             <g class="node"> //<- 最初の <g class="node">
    //                 <g class="frame">
    //                     <ellipse cx="329" cy="296" rx="48.42640687119285" ry="14.485281374238571"></ellipse>
    //                 </g>
    //                 <text class="textContent" style="white-space: pre;" x="300" y="300"> //<- `test content` となる事
    //                     <tspan x="300" dy="0em">test content</tspan>
    //                 </text>
    //

    var str_ellipseXPath =
        `//div[@id=\'force-memo0\']` +
            `/*[name()=\'svg\' and ${ooo.func_genPredcateExpr_isExistsInClassList('SVGForNodesMapping')}]` +
                `/*[name()="g" and ${ooo.func_genPredcateExpr_isExistsInClassList('nodes')}]` + 
                    `/*[name()="g" and ${ooo.func_genPredcateExpr_isExistsInClassList('node')}]` +
                        `/*[name()="g" and ${ooo.func_genPredcateExpr_isExistsInClassList('frame')}]` +
                            `/*[name()="ellipse"]`
    ;

    var str_textXPath =
        `//div[@id=\'force-memo0\']` +
            `/*[name()=\'svg\' and ${mekeXPathQuery_existsInClassList('SVGForNodesMapping')}]` +
                `/*[name()="g" and ${mekeXPathQuery_existsInClassList('nodes')}]` + 
                    `/*[name()="g" and ${mekeXPathQuery_existsInClassList('node')}]` +
                        `/*[name()="text" and ${mekeXPathQuery_existsInClassList('textContent')}]`
    ;


    var obj_ellipseAndText = await obj_webDriver
        .wait(async function(){

            var objarr_expectedAsEllipse = await obj_webDriver
                .findElements(
                    By.xpath(str_ellipseXPath)
                )
            ;

            var objarr_expectedAsText = await obj_webDriver
                .findElements(
                    By.xpath(str_textXPath)
                )
            ;

            console.log(`objarr_expectedAsEllipse.length:${objarr_expectedAsEllipse.length}`);
            console.log(`objarr_expectedAsText.length:${objarr_expectedAsText.length}`);

            if (
                (objarr_expectedAsEllipse.length != 1) ||
                (objarr_expectedAsText.length != 1)
            ){
                console.log('Expected SVG node not found. Retry...');
                return false;
            }

            var str_textContent = await objarr_expectedAsText[0].getText();

            console.log(`str_textContent:${str_textContent}`);

            if (str_textContent !== 'test content'){
                console.log('Expected SVG <text> node not found. Retry...');
                return false;
            }
            
            return {
                'ellipse':objarr_expectedAsEllipse[0],
                'text':objarr_expectedAsText[0]
            };

        },int_waitMS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                console.error('Expected SVG node not found.');
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;

    

    var str_scr = `return (${xxx.func_genScript_getComputedStyleByXPath(str_textXPath)});`;
    console.log(`str_scr:${str_scr}`);
    var obj_exeResult = await obj_webDriver.executeScript(str_scr);

    console.log(`obj_exeResult:`);
    console.log(JSON.stringify(obj_exeResult, null, '    '));
    
    return bl_testResult;
}

function mekeXPathQuery_existsInClassList(str_className){
    return `contains(concat(" ",@class," "), " ${str_className} ")`;
}
