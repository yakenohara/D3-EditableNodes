const {logging} = require('selenium-webdriver');

module.exports.func_doTest = async function(obj_webDriver){

    // <settings>------------------------------------------------------------

    var str_pathOfToLoadFile = 'tester/Selenium/perspectives/002.json';
    var str_toExecScript_1 = `memo0.loadFile(\'${str_pathOfToLoadFile}\');`

    
    var str_toExecScript_2 = `return memo0.getCloneOfHistory();`;
    
    
    var int_waitMS = 3000;

    // -----------------------------------------------------------</settings>

    var bl_testResult;

    // Load test json file to `force-layout-memo.js`
    var ret = await obj_webDriver.executeScript(str_toExecScript_1);

    // todo 1
    //
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

    // todo 2
    //
    // 以下 DOM tree になっている事を確認することで、history が追加された事を検知する
    //
    // <div id="force-memo0" ~~~~omitting~~~~ >
    // <div class="transactionHistory" wrap="off">
    //     <div class="transaction selected" data-history_index="1" style=""> // <- 最後の <div> 要素
    //         <small style="font-size: small;">1 node(s) appended.</small>   // <- <small></small>内が `1 node(s) appended.` となること

    // todo 3
    //
    // コンソールに error or warn が表示されない事

    // Load test json file to `force-layout-memo.js`
    var ret = await obj_webDriver.executeScript(str_toExecScript_2);

    console.log('<history>--------');
    console.log(ret);
    console.log('-------</history>');

    return new Promise(resolve => {
        resolve(bl_testResult);
    });
}
