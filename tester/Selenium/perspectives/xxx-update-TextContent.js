const {Button, By, Key, logging} = require('selenium-webdriver');

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
        let obj_entty = objarr_entries[int_idxOfEntries];
        console.log(`[${obj_entty.level.name}(Lv:${obj_entty.level.value})] ${obj_entty.message}`);
    }

    // Load test json file to `force-layout-memo.js`
    var ret = await obj_webDriver.executeScript(str_toExecScript_1);

    // 以下 DOM tree になっている事を確認することで、svg 内に `test content` が追加された事を確認する
    //
    // <div id="force-memo0" ~~~~omitting~~~~ >
    // <svg class="SVGForNodesMapping context-menu-container-0" style="width: 100%; height: 100%; overflow: hidden; vertical-align: bottom;">
    //     <g class="nodes">
    //         <g class="node"> //<- 最初の <g class="node">
    //             <g class="frame">
    //                 <ellipse cx="329" cy="296" rx="48.42640687119285" ry="14.485281374238571"></ellipse>
    //             </g>
    //             <text class="textContent" style="white-space: pre;" x="300" y="300">
    //                 <tspan x="300" dy="0em">test content</tspan> //<- 最初の <tspan></tspan> 内が `test content` となる事
    //             </text>
    //         </g>
    //     </g>
    var obj_expectedAsSVGNode = await obj_webDriver
        .wait(async function(){
            
            var objarr_expectedAsSVGNode = await obj_webDriver
                .findElements(
                    By.xpath(
                        `//div[@id=\'force-memo0\']` +
                            `/*[name()=\'svg\' and ${mekeXPathQuery_existsInClassList('SVGForNodesMapping')}]` +
                                `/*[name()="g" and ${mekeXPathQuery_existsInClassList('nodes')}]` + 
                                    `/*[name()="g" and ${mekeXPathQuery_existsInClassList('node')}]`
                    )
                )
            ;

            console.log(`objarr_expectedAsSVGNode.length:${objarr_expectedAsSVGNode.length}`);

            if(objarr_expectedAsSVGNode.length != 1){
                console.log('Expected SVG node not found. Retry...');
                return false;
            }

            return objarr_expectedAsSVGNode[0];

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

    if(!bl_testResult){
        console.error(`Unable to continue next manipulate.`);
        return bl_testResult;
    }

    // Double click node
    await obj_webDriver
        .actions()
        .move({
            origin:obj_expectedAsSVGNode
        })
        .press(Button.LEFT)
        .release(Button.LEFT)
        .press(Button.LEFT)
        .release(Button.LEFT)
        .perform()
    ;
    
    // Double click で表示される <textarea> を取得。DOM 構造は以下を想定
    //
    // <div id="force-memo0" ~~~~omitting~~~~ >
    //     <textarea class="mousetrap" ~~~~omitting~~~~></textarea>
    //
    var obj_textareaElem = await obj_webDriver
        .wait(async function(){

            var objarr_expectedAsTextarea = await obj_webDriver
                .findElements(
                    By.xpath(
                        `//div[@id=\'force-memo0\']` +
                            `/textarea`
                    )
                )
            ;

            console.log(`objarr_expectedAsTextarea.length:${objarr_expectedAsTextarea.length}`);

            if(objarr_expectedAsTextarea.length != 1){
                console.log('Expected <textarea> not found. Retry...');
                return false;
            }

            return objarr_expectedAsTextarea[0];

        },int_waitMS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;
    
    if(!bl_testResult){
        console.error(`Unable to continue next manipulate.`);
        return bl_testResult;
    }

    // Clear <textarea>
    await obj_webDriver
        .wait(async function(){
            await obj_textareaElem.clear();
            var str_expedtedAsVacantText = await obj_textareaElem.getAttribute('value');
            console.log(`str_expedtedAsVacantText:"${str_expedtedAsVacantText}"`);
            if(str_expedtedAsVacantText !== ''){
                console.log('\`.clear()\` does not effective. Retry...');
                return false;
            }
            return true;
        },int_waitMS)
        .catch(function(e){
            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;

    if(!bl_testResult){
        console.error(`Unable to continue next manipulate.`);
        return bl_testResult;
    }

    await obj_textareaElem.sendKeys('Updated text');
    await obj_textareaElem.sendKeys(Key.ESCAPE);

    var objarr_expectedAsHistries = await obj_webDriver.executeScript(str_toExecScript_2);
    
    console.log(`objarr_expectedAsHistries:${objarr_expectedAsHistries}`);

    return bl_testResult;
}


function mekeXPathQuery_existsInClassList(str_className){
    return `contains(concat(" ",@class," "), " ${str_className} ")`;
}
