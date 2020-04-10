const {By, logging} = require('selenium-webdriver');

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

                let objarr_expectedAsEllipse = await obj_nodes[0]
                    .findElements(
                        By.xpath(
                            `./*[name()="g" and ${mekeXPathQuery_existsInClassList('frame')}]` +
                                `/*[name()="ellipse"]`
                        )
                    )
                ;

                let objarr_expectedAsText = await obj_nodes[0]
                    .findElements(
                        By.xpath(
                            `./*[name()="text" and ${mekeXPathQuery_existsInClassList('textContent')}]`
                                //todo `test content` になること
                        )
                    )
                ;

                console.log(`objarr_expectedAsEllipse.length:${objarr_expectedAsEllipse.length}`);
                console.log(`objarr_expectedAsText.length:${objarr_expectedAsText.length}`);
                
                if (
                    (objarr_expectedAsEllipse.length == 1) &&
                    (objarr_expectedAsText.length == 1)
                ){
                    let str_textContent = await objarr_expectedAsText[0].getText();

                    console.log(`text content:${str_textContent}`);

                    if (str_textContent === 'test content'){
                        bl_passed = true;
                    }
                }
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

    // 以下 DOM tree になっている事を確認することで、history が追加された事を検知する
    //
    // <div id="force-memo0" ~~~~omitting~~~~ >
    // <div class="transactionHistory" wrap="off">
    //     <div class="transaction selected" data-history_index="1" style=""> // <- 最後の <div> 要素
    //         <small style="font-size: small;">1 node(s) appended.</small>   // <- <small></small>内が `1 node(s) appended.` となること
    await obj_webDriver
        .wait(async function(){
            
            var bl_passed = false;

            var obj_nodes = await obj_webDriver
                .findElements(
                    By.xpath(
                        `//div[@id=\'force-memo0\']` +
                            `/div[${mekeXPathQuery_existsInClassList('transactionHistory')}]` +
                                `/div[${mekeXPathQuery_existsInClassList('transaction')}]`
                    )
                )
            ;

            if(obj_nodes.length > 0){
                
                let int_lastIdxOfTransactions = obj_nodes.length-1;
                let str_className = await obj_nodes[int_lastIdxOfTransactions].getAttribute('class');
                let str_transactionTitle = await obj_nodes[int_lastIdxOfTransactions].getText();

                console.log(`str_className:${str_className}`);
                console.log(`str_transactionTitle:${str_transactionTitle}`);

                if(
                    (` ${str_className} `.indexOf('selected') != (-1) ) &&
                    (str_transactionTitle == '1 node(s) appended.')
                ){
                    bl_passed = true;
                }
            }

            return bl_passed;

        },int_waitMS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;

    
    // Check console log string
    await obj_webDriver
        .wait(async function(){
            
            var bl_passed = false;

            var objarr_entries = await obj_webDriver
                .manage()
                .logs()
                .get(logging.Type.BROWSER)
            ;

            for(let int_idxOfEntries = 0 ; int_idxOfEntries < objarr_entries.length ; int_idxOfEntries++){
                let obj_entty = objarr_entries[int_idxOfEntries];
                console.log(`[${obj_entty.level.name}(Lv:${obj_entty.level.value})] ${obj_entty.message}`);
                
                if( logging.Level.WARNING.value <= obj_entty.level.value ){ // Waring 以上のレベルのログなら
                    bl_testResult = false;
                    bl_passed = true;
                }
            }

            return bl_passed;

        },int_waitMS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                bl_testResult = true;
            
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
