const {Button, By, logging, until} = require('selenium-webdriver');
const {DEPENDS_ON_USER_IMPLI, XPATH_DEF} = require('../ini');

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
    var obj_ellipseAndText = await obj_webDriver
        .wait(async function(){
            
            var objarr_expectedAsEllipse = await obj_webDriver
                .findElements(
                    By.xpath(XPATH_DEF.NODE_ELLIPSE)
                )
            ;

            var objarr_expectedAsText = await obj_webDriver
                .findElements(
                    By.xpath(XPATH_DEF.NODE_TEXT)
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

    // 以下 DOM tree になっている事を確認することで、history が追加された事を検知する
    //
    // <div id="force-memo0" ~~~~omitting~~~~ >
    //     <div class="transactionHistory" wrap="off">
    //         <div class="transaction selected" data-history_index="1" style=""> // <- 最後の <div> 要素
    //             <small style="font-size: small;">1 node(s) appended.</small>   // <- <small></small>内が `1 node(s) appended.` となること
    //
    await obj_webDriver
        .wait(async function(){
            
            var obj_nodes = await obj_webDriver
                .findElements(
                    By.xpath(XPATH_DEF.HISTORY_LAST_AND_SELECTED)
                )
            ;

            if(obj_nodes.length != 1){
                console.log('Expected history not found. Retry...');
                return false;
            }

            let str_HistoryTitle = await obj_nodes[0].getText();

            console.log(`str_HistoryTitle:${str_HistoryTitle}`);

            if(str_HistoryTitle !== '1 node(s) appended.'){
                console.log('Expected history message not found. Retry...');
                return false;
            }

            return true;

        },int_waitMS)
        .catch(function(e){

            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                console.error('Expected history message not found.');
                bl_testResult = false;
            
            }else{
                throw e;
            }
        })
    ;

    // console log に warn or error が出力されて *** いない *** 事を確認することで、node がエラーなく追加されたことを確認する
    var objarr_entries = await obj_webDriver
        .manage()
        .logs()
        .get(logging.Type.BROWSER)
    ;
    for(let int_idxOfEntries = 0 ; int_idxOfEntries < objarr_entries.length ; int_idxOfEntries++){
        let obj_entry = objarr_entries[int_idxOfEntries];
        console.log(`[${obj_entry.level.name}(Lv:${obj_entry.level.value})] ${obj_entry.message}`);
        
        if( logging.Level.WARNING.value <= obj_entry.level.value ){ // Waring 以上のレベルのログなら
            console.error('Unexpected log message found.');
            bl_testResult = false;
        }
    }

    // Double click node
    await obj_webDriver
        .actions()
        .move({
            origin:obj_ellipseAndText.text
        })
        .press(Button.LEFT)
        .release(Button.LEFT)
        .press(Button.LEFT)
        .release(Button.LEFT)
        .perform()
    ;

    // [CHECK]   property edit console の slidedown 
    // [PERFORM] text_anchor の `default` ボタンを　hover
    // [CHECK]   <text> の 表示の右寄せが解除される
    // [PERFORM] text_anchor の `default` ボタンを　click
    // [CHECK]   history に `text/text_anchor:default` が追加される
    // [CHECK]   <text> の 表示の右寄せが解除されたまま
    // [EXECUTE] get history
    // [CHECK]   最後のhistory が text_anchor:end -> null になる

    // [CHECK]   property edit console の slidedown 
    // await obj_webDriver
    //     .wait(function(){
    //         until.elementLocated(By.xpath('//div[@id="force-memo0"'))
    //     })

    // await obj_webDriver
    //     .wait(function(){

    //     }, int_waitMS)
    //     .catch(function(e){

    //     })
    // ;

    // History 内の 当該 Transaction の Previous object で前回値を保存できてているかどうか
    //
    var objarr_expectedAsHistries = await obj_webDriver.executeScript(str_toExecScript_2);
    console.log(`objarr_expectedAsHistries:${objarr_expectedAsHistries}`);

    var str_expectedAsPrevText = objarr_expectedAsHistries[objarr_expectedAsHistries.length-1]['reportsArr']['datas'][0]['PrevObj']['text']['text_content'];
    console.log(`str_expectedAsPrevText:${str_expectedAsPrevText}`);
    if(str_expectedAsPrevText !== ''){
        console.error('Expected previous history not found.');
        bl_testResult = false;
    }
    
    return bl_testResult;
}
