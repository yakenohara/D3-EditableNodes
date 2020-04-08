const {Button, By} = require('selenium-webdriver');

module.exports.func_doTest = async function(obj_webDriver){

    // <settings>------------------------------------------------------------

    var int_waitMS = 3000;
    var str_divElem = 'force-memo0'; // `new forceLayoutMemo()` に指定した <div> element の ID 名

    var str_clsNameInCntxtMenu = 'context-menu-0' // コンテキストメニューに付加される class 名
    // caution
    // force-layout-memo.js により DOMツリー内でユニークな `context-menu-(number)` が生成される。
    // なので生成後の文字列は予想するしかない。(※ (number) は 0 から始まり 1 ずつ増える自然数の内どれか)

    // -----------------------------------------------------------</settings>

    var bl_testResult;
    
    var obj_actions = obj_webDriver.actions();

    // Context menu が非表示である事を確認する
    await obj_webDriver
        .findElement(By.className(str_clsNameInCntxtMenu))
        .isDisplayed()
        .then(function(bl_isDisplayed){
            console.log(`bl_isDisplayed:${bl_isDisplayed.toString()}`)

            // 表示状態の場合は中断
            if(bl_isDisplayed){
                throw new Error('AlreadyDisplayedContextMenu');
            }
        })
    ;

    // Right click
    await obj_actions
        .move({
            //specify center of drawing area of force-layout-memo.js
            origin: (await obj_webDriver.findElement(By.id(str_divElem)))
        })
        .press(Button.RIGHT)
        .release(Button.RIGHT)
    ;
    await obj_actions.perform();

    // Wait for context menu
    var objerr_lastErr;
    await obj_webDriver
        .wait(async function(){

            var bl_isContextMenuDisplayed = false;

            // ↓ の style の `display: none;` が解除される事を確認して、ture を返す
            // <ul class="context-menu-0 ~~~omitting~~~" style="z-index: 1; ~~~omitting~~~ display: none;">
            await obj_webDriver
                .findElement(By.className(str_clsNameInCntxtMenu))
                .isDisplayed()
                .then(function(bl_isDisplayed){
                    console.log(`bl_isDisplayed:${bl_isDisplayed.toString()}`)
                    if(bl_isDisplayed){
                        bl_isContextMenuDisplayed = true;
                        bl_testResult = true;
                    }
                })
            ;

            return new Promise(function(resolve){
                resolve(bl_isContextMenuDisplayed);
            })

        },int_waitMS)
        .catch(function(e){

            objerr_lastErr = e;

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

    return new Promise(resolve => {
        resolve(bl_testResult);
    });
}
