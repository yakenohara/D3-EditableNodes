const {Builder, Browser, Capabilities, logging} = require('selenium-webdriver');

(async function(){

    var str_navigateTo = 'http://localhost:8000/';
    var strary_testModules = [
        // './002sub',
        './002sub2',
    ];
    var str_browserName = Browser.CHROME;

    var obj_logPrefs = new logging.Preferences();
    obj_logPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    // Iterator for each test
    var obj_webDriver;
    for(let int_idxOfTestMods = 0 ; int_idxOfTestMods < strary_testModules.length ; int_idxOfTestMods++){

        let str_testMod = strary_testModules[int_idxOfTestMods];

        // note
        //
        // `.build()` で帰ってくる WebDriver object は、
        // 毎回新しいプロファイルでブラウザを起動した事と同じになる。
        // これは、ブラウジング履歴も、cache も、cookie もまっさらな状態で起動するという事。
        // https://groups.google.com/forum/#!topic/selenium-users/UX1Znrrb98Q
        //
        // 現状(ChromeDriver 81.0.4044.69) では、
        // ページのリロード時に cache, cookie を無視するオプションが存在しないので、
        // 代わりに WebDriver object を破棄して再び `.build()` するしかない。


        // すでにブラウザを開いていたら、閉じる
        if((typeof obj_webDriver) === 'object' && obj_webDriver.constructor.name === 'Driver'){
            await obj_webDriver.quit();
            obj_webDriver = undefined;
        }

        // Create WebDriver object
        obj_webDriver = await new Builder()
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
        await obj_webDriver.get(str_navigateTo);

        
        let obj_testMod = require(str_testMod);
        await obj_testMod
            .func_doTest(obj_webDriver) // Do test

            // Evaluate result
            .then(function(bl_result){

                if(bl_result){ // OK
                    console.log(`${str_testMod}:OK`);
                }else{ // NG
                    console.error(`${str_testMod}:NG`);
                }
                
            })
            .catch(function(e){
                console.warn('Unkown Error!');
                throw e;

            })
        ;
    }
    
})();
