const fs = require('fs');
const {Builder, Browser, Capabilities, logging} = require('selenium-webdriver');

(async function(){

    var str_navigateTo = 'http://localhost:8000/';
    var str_testModDirName = 'perspectives';
    var strary_prefixIdsOfTestMods = [
        // '001',
        // '002',
        '003',
        // 'xxx',
    ];
    var str_browserName = Browser.CHROME;

    var obj_logPrefs = new logging.Preferences();
    obj_logPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

    // Iterator for each test
    var obj_webDriver;
    for(let int_idxOfTestMods = 0 ; int_idxOfTestMods < strary_prefixIdsOfTestMods.length ; int_idxOfTestMods++){
        
        let str_toFindTestModName = strary_prefixIdsOfTestMods[int_idxOfTestMods];
        let str_foundModName = getModNameFromPrefixID(str_toFindTestModName, str_testModDirName);

        if(typeof str_foundModName == 'undefined'){ // テストモジュールが見つからない場合
            console.error(`Script file not found what is name like \`${str_toFindTestModName}\` in \`${str_testModDirName}\` directory.`);
            throw new Error('ScriptNotFoundError')
        }

        let str_testMod = `./${str_testModDirName}/${str_foundModName}`;

        console.log(`<Testing\`${str_testMod}\`>`)

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

        console.log('<Waiting for page initializing>');
        let obj_ckecker = require('./common/check-isconstructed');
        let bl_isLaunched = await obj_ckecker.func_doTest(obj_webDriver);
        if(!bl_isLaunched){
            console.error('constructor of force-layout-memo.js ends in fail.');
            throw new Error('pageInitializingError');
        }
        console.log('</Waiting for page initializing>');
        
        let obj_testMod = require(str_testMod);
        await obj_testMod
            .func_doTest(obj_webDriver) // Do test

            // Evaluate result
            .then(function(bl_result){

                if(bl_result){ // OK
                    console.log('RESULT:OK');
                }else{ // NG
                    console.error('RESULT:NG');
                }
                
            })
            .catch(function(e){
                console.warn('Unkown Error!');
                throw e;

            })
        ;

        console.log(`</Testing\`${str_testMod}\`>`)
    }
    
})();

//
// 指定文字列から始まる script を指定ディレクトリから検索して拡張子なしのファイル名を返す
// 見つからない場合は undefined を返す
//
function getModNameFromPrefixID(str_prefixID, str_dirName){

    var str_toRetModName;
    var str_ext = '.js';
    
    const objarr_dirEntries = fs.readdirSync(str_dirName, {withFileTypes: true});
    
    for(let int_idxOfFileDirEntries = 0 ; int_idxOfFileDirEntries < objarr_dirEntries.length ; int_idxOfFileDirEntries++){

        let obj_dirEntry = objarr_dirEntries[int_idxOfFileDirEntries];

        if(obj_dirEntry.isFile()){

            let str_entryName = obj_dirEntry.name;
            let bl_hit = new RegExp(`^${str_prefixID}.*${str_ext}$`).test(str_entryName);

            if(bl_hit){
                str_toRetModName = str_entryName.substr(0, str_entryName.length - str_ext.length);
                break;
            }
        }
    }

    return str_toRetModName;
}
