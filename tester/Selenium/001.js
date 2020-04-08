const {Builder, Browser, Capabilities, logging} = require('selenium-webdriver');

(async function(){

    var str_navigateTo = 'http://localhost:8000/';
    var str_pathOfToLoadFile = 'tester/Selenium/001.json';
    var str_toExecScript = `memo0.loadFile(\'${str_pathOfToLoadFile}\');`

    var str_expectedMessage = 
        "Wrong type specified in \`renderByThisObj.text.text_content\`. " +
        "specified type:\`" + "number" + "\`, expected type:\`string\`."
    ;

    var int_waitMS = 3000;

    var str_browserName = Browser.CHROME;

    var obj_logPrefs = new logging.Preferences();
    obj_logPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    var obj_webDriver = await new Builder()
        .withCapabilities(
            new Capabilities()
                .setBrowserName(str_browserName)
                .setLoggingPrefs(obj_logPrefs)
        )
        .build()
    ;

    // Set screen resolution as XGA size
    await obj_webDriver.manage().window().setRect({
        width:1024,
        height:768
    });

    // Navigate
    await obj_webDriver.get(str_navigateTo); // todo キャッシュを読まずにジャンプする
    // todo alert が表示された場合は無視する

    // Execute script
    await obj_webDriver.executeScript(str_toExecScript);

    // Check console log string
    await obj_webDriver
        .wait(async function(){
            
            var bl_gotLog = false;

            await obj_webDriver
                .manage()
                .logs()
                .get(logging.Type.BROWSER)
                .then(function(entries){
                    entries.forEach( entry => {
                        console.log('[%s] %s', entry.level.name, entry.message);

                        // note
                        // .message には、以下のように console に渡した文字列以外も付加されている。
                        // `console-api 2:32 "hello console"`
                        if(entry.message.indexOf(str_expectedMessage) != (-1)){
                            console.log("OK");
                            bl_gotLog = true;
                        }
                    });
                })
            ;

            return bl_gotLog;

        },int_waitMS)
        .catch(function(e){

            // note 
            // https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_ThenableWebDriver.html
            // ↑ Interface ThenableWebDriver の説明↑ では time out 時に TypeError が throw されるとあるが、
            // 実際は`Class TimeoutError`(<- `Class WebDriverError` の sub class)。
            // なのでこのエラーを判定を判定する方法は ↓↓ になる
            if( (typeof e) === 'object' && e.constructor.name === "TimeoutError"){
                console.log("NG");
            
            }else{
                throw e;
            }
        })
    ;

})();
