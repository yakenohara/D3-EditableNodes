const {Button, By, logging, until} = require('selenium-webdriver');
const {DEPENDS_ON_USER_IMPLI, XPATH_DEF} = require('../ini');
const sub = require('../common/typicals');

module.exports.func_doTest = async function(obj_webDriver){

    // <settings>------------------------------------------------------------

    var str_pathOfToLoadFile = 'tester/Selenium/perspectives/003.json';
    var str_toExecScript_1 = `memo0.loadFile(\'${str_pathOfToLoadFile}\');`
    var str_toExecScript_2 = `return (memo0.getCloneOfHistory());`;

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

    // [EXECUTE] Load test json file to `force-layout-memo.js`
    await obj_webDriver.executeScript(str_toExecScript_1);

    // [CHECK]   svg 内に `test\ncontent` が追加されること
    var obj_ellipseAndText = await sub.func_waitForElementsLocated(
        obj_webDriver,
        function(obj_results){
            obj_results.forEach(function(obj_result){
                if(obj_result.length != 1){return false;}
            })
            return true;
        },
        XPATH_DEF.NODE_ELLIPSE,
        XPATH_DEF.NODE_TEXT
    );
    if(!obj_ellipseAndText){
        console.error('Expected <ellipse> or <text> not found.');
        bl_testResult = false;
        return bl_testResult;
    }

    // [CHECK]   `1 node(s) appended.` というタイトルの history が追加されること
    var obj_lastHistory = await sub.func_waitForElementsLocated(
        obj_webDriver,
        async function(obj_results){
            if(obj_results[0].length!=1){
                return false;
            }
            if(!(await sub.func_isExitInClassList(obj_results[0][0], 'selected'))){
                console.log('Last history is not selected.');
                return false;
            }
            var str_HistoryTitle = await obj_results[0][0].getText();
            console.log(`str_HistoryTitle:${str_HistoryTitle}`);
            if(str_HistoryTitle !== '1 node(s) appended.'){
                return false;
            }

            return true;
        },
        XPATH_DEF.HISTORY_LAST_AND_SELECTED
    );
    if(!obj_lastHistory){
        console.error('Expected history not found.');
        bl_testResult = false;
        return bl_testResult;
    }

    // [CHECK]   console log に warn or error が出力されて *** いない *** ないこと
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
    
    // [PERFORM] Double click node
    await sub.func_doubleClickElement(obj_webDriver, obj_ellipseAndText[1][0]);

    // [CHECK]   property edit console の slidedown
    var objarr_propEditor = await sub.func_waitForElementsLocated(
        obj_webDriver,
        async function(obj_results){
            if(obj_results[0].length != 1){
                return false;
            }
            return (await obj_results[0][0].isDisplayed());
        },
        XPATH_DEF.PROP_EDITOR
    );
    if(!objarr_propEditor){
        console.error('Property editor not displayed.');
        bl_testResult = false;
        return bl_testResult;
    }

    // [PERFORM] text_anchor の `default` ボタンを　hover
    // [CHECK]   <text> の 表示の右寄せが解除される
    // [PERFORM] text_anchor の `default` ボタンを　click
    // [CHECK]   history に `text/text_anchor:default` が追加される
    // [CHECK]   <text> の 表示の右寄せが解除されたまま
    // [EXECUTE] get history
    // [CHECK]   最後のhistory が text_anchor:end -> null になる

    // [EXECUTE] getCloneOfHistory
    var objarr_expectedAsHistries = await obj_webDriver.executeScript(str_toExecScript_2);
    console.log(`objarr_expectedAsHistries:${objarr_expectedAsHistries}`);

    // [CHECK]   最後の Transaction の Previous object で前回値を保存できてていること
    var str_expectedAsPrevText = objarr_expectedAsHistries[objarr_expectedAsHistries.length-1]['reportsArr']['datas'][0]['PrevObj']['text']['text_anchor'];
    console.log(`str_expectedAsPrevText:${str_expectedAsPrevText}`);
    if(str_expectedAsPrevText !== 'end'){
        console.error('Expected previous history not found.');
        bl_testResult = false;
    }
    
    return bl_testResult;
}
