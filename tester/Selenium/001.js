const {Builder, Browser, Capabilities, error, logging} = require('selenium-webdriver');

(async () => {

    
    var prefs = new logging.Preferences();
    prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    Capabilities.chrome().setLoggingPrefs(prefs);

    // create a driver instance
    let driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .withCapabilities(Capabilities.chrome().setLoggingPrefs(prefs))
        // .setLoggingPrefs(new logging.Preferences().setLevel(logging.Type.BROWSER, logging.Level.ALL))
        .build()
    ;

    await driver.manage().window().setRect({
        // x:500,
        // y:500,
        width:1024,
        height:768
    });

    await driver.get('http://localhost:8000/'); // navigate to forcelayout memo

    await driver.executeScript('memo0.loadFile(\'tester/Selenium/001.json\');');

    let st_expectedString = 
        "Wrong type specified in \`renderByThisObj.text.text_content\`. " +
        "specified type:\`" + "number" + "\`, expected type:\`string\`."
    
    await driver
        .wait(async () => {
            
            let bl_gotLog = false;

            await driver
                .manage()
                .logs()
                .get(logging.Type.BROWSER)
                .then(entries => {
                    entries.forEach( entry => {
                        console.log('[%s] %s', entry.level.name, entry.message);
                        if(entry.message.indexOf(st_expectedString) != (-1)){
                            console.log("OK");
                            bl_gotLog = true;
                        }
                    });
                })
            ;

            return bl_gotLog;

        },3000)
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
