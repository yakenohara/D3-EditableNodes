const {Button, By, logging} = require('selenium-webdriver');

module.exports.func_doTest = async function(obj_webDriver){

    // <settings>------------------------------------------------------------

    var str_pathOfToLoadFile = 'tester/Selenium/perspectives/002.json';
    var str_toExecScript_1 = `memo0.loadFile(\'${str_pathOfToLoadFile}\');`

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
    await obj_webDriver
        .wait(async function(){
            
            var bl_passed = false;

            var obj_nodes = await obj_webDriver
                .findElements(

                    // note
                    // The <svg> elements are not from the XHTML namespace but belongs to SVG namespace.
                    // .findElement(By.xpath('//div[@id=\'force-memo0\']/*[name()=\'svg\' and contains(concat(" ",@class," "), " SVGForNodesMapping ")]/*[name()="g" and '))
                    By.xpath(
                        `//div[@id=\'force-memo0\']` +
                            `/*[name()=\'svg\' and ${mekeXPathQuery_existsInClassList('SVGForNodesMapping')}]` +
                                `/*[name()="g" and ${mekeXPathQuery_existsInClassList('nodes')}]` + 
                                    `/*[name()="g" and ${mekeXPathQuery_existsInClassList('node')}]`
                    )
                )
            ;

            console.log("Elements found.");
            console.log(`obj_nodes.length:${obj_nodes.length}`);

            // note
            // `.findElements()` とは違い、Element が見つからない時は NoSuchElementError を返すのではなく、要素数 0 の Array を返す。
            if(obj_nodes.length != 0){

                await obj_webDriver
                    .actions()
                    .move({
                        origin:obj_nodes[0]
                    })
                    .press(Button.LEFT)
                    .release(Button.LEFT)
                    .press(Button.LEFT)
                    .release(Button.LEFT)
                    .perform()
                ;

                bl_passed = true;
            }

            return bl_passed;

        },int_waitMS)
        .catch(function(e){

            // note 
            // https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_ThenableWebDriver.html
            // ↑ Interface ThenableWebDriver の説明↑ では time out 時に TypeError が throw されるとあるが、
            // 実際は`Class TimeoutError`(<- `Class WebDriverError` の sub class)。
            // なのでこのエラーを判定を判定する方法は ↓↓ になる
            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;

    await obj_webDriver
        .wait(async function(){
            
            var bl_passed = false;

            var obj_element = await obj_webDriver
                .switchTo()
                .activeElement()
            ;
            
            var str_tagName = await obj_element
                .getTagName()
            ;

            console.log(`str_tagName:${str_tagName}`);

            if( str_tagName.toLowerCase() == 'textarea'){

                await obj_element.clear();
                await obj_element.sendKeys("Updated text");
                console.log(await obj_element.getText());
                bl_passed = true;
            }

            return bl_passed;

        },int_waitMS)
        .catch(function(e){

            // note 
            // https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_ThenableWebDriver.html
            // ↑ Interface ThenableWebDriver の説明↑ では time out 時に TypeError が throw されるとあるが、
            // 実際は`Class TimeoutError`(<- `Class WebDriverError` の sub class)。
            // なのでこのエラーを判定を判定する方法は ↓↓ になる
            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;

    return bl_testResult;
}


function mekeXPathQuery_existsInClassList(str_className){
    return `contains(concat(" ",@class," "), " ${str_className} ")`;
}
