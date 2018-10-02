var dataset = [
    {
        key: 0, //todo 未指定時のハンドリング
        type: "text",
        text: {
            text_content: "untitled node",
            text_anchor: "start",
            text_font_family: "helvetica, arial, 'hiragino kaku gothic pro', meiryo, 'ms pgothic', sans-serif",
            text_font_size: 16,
            text_fill: "rgb(251, 255, 14)",
            frame_shape: "rect",
            frame_stroke: "rgb(0, 0, 0)",
            frame_stroke_width: 10,
            frame_stroke_dasharray: "10,3",
            frame_fill: "rgba(34, 172, 41, 0.74)",
        }
    },
    {
        key: 1,
        type: "text",
        text: {
            text_content: "default design",
        }
    },
    {
        key: 2,
        type: "text",
        text: {
            text_content: "no stroke",
            frame_stroke_width: 0,
            frame_fill: "rgb(22, 126, 19)",
        }
    },
    {
        key:3
    },
    {
        key:4,
        type:"text",
        text:{
            text_content:"circle frame",
            frame_shape:"circle"
        }
    },
    {
        key:5,
        type:"text",
        text:{
            text_content:"ellipse frame",
            frame_shape:"ellipse"
        }
    },
    {
        key:6,
        type:"text",
        text:{
            text_content:"text-anchor\n\`start\`"
        }
    },
    {
        key:7,
        type:"text",
        text:{
            text_content:"text-anchor\n\`middle\`",
            text_anchor: "middle"
        }
    },
    {
        key:8,
        type:"text",
        text:{
            text_content:"text-anchor\n\`end\`",
            text_anchor: "end"
        }
    },
    {
        key:9,
        type:"text",
        text:{
            text_content:"Bold",
            text_font_size: 15,
            text_font_weight: "bold"
        }
    },
    {
        key:10,
        type:"text",
        text:{
            text_content:"italic",
            text_font_style: "italic"
        }
    },
    {
        key:11,
        type:"text",
        text:{
            text_content:"line-through",
            text_text_decoration: "line-through"
        }
    }
];

var UITrappedEvents = {
    editSVGNode: "dblclick", //`d3.js` event
    submitEditingTextTypeSVGNode: "enter", //`Mousetrap` event
    insertLFWhenEditingTextTypeSVGNode: "alt+enter", //`Mousetrap` event
};

var $3editableNodesTAG = d3.select("#editableNode").style("position", "relative");

var padding = 5;
var valOfEm = 1.3;
var dummyChar = 'l'; //小さい幅の文字
var urlOf_EditableNodes_components_html = "assets/components/EditableNodes_components.html";

/* <エディタ共通設定>----------------------- */

var slctd = "selected";

/* ----------------------</エディタ共通設定> */

//text type node 編集時にfont-sizeを抽出できなかった場合に仮設定するfont-size
var defaultFontSizeForTextArea = "11px";

//text type node 編集時にtext-anchorを抽出できなかった場合に仮設定するtext-align
var defaultTextAlignForTextArea = "left";

var transactionHistory = [];

var $3nodeEditConsoleElem = $3editableNodesTAG.append("div")
    // .style("visibility", "hidden")
    .style("position", "absolute")
    .style("z-index", 10)
    .style("margin", 0)
    .style("border", 0)
    .style("padding", 0)
    .classed("nodeEditConsoleElem",true);

var $nodeEditConsoleElem = $($3nodeEditConsoleElem.node());
$nodeEditConsoleElem.load(urlOf_EditableNodes_components_html,function(responseText, textStatus, jqXHR) {

    //成功確認
    if(textStatus === "error"){
        console.error("Cannot load \`" + urlOf_EditableNodes_components_html + "\`. statusText:\`" + jqXHR.statusText + "\`");
        return;
    }

    //<register behavor>----------------------------------------------------------------------------------------------------------

    //<text_text_anchor>---------------------------------------------------------------
    $nodeEditConsoleElem.find(".propertyEditor.textAnchor").children(".textAnchorType").on("click",function(){
        var clickedElem = this;
        var specifiedType = clickedElem.getAttribute("data-textAnchorType");
        switch(specifiedType){
            case "start":
            break;

            case "middle":
            break;

            case "end":
            break;

            default:
            {
                console.warn("Unknown style \`text-anchor:" + specifiedType + ";\` specified.");
                return;
            }
            break;
        }

        console.log("\`text-anchor:" + specifiedType + ";\` specified.");
        fireNodeEditConsoleEvent({text:{text_anchor: specifiedType}});

        //表示状態変更
        var siblings = clickedElem.parentNode.children;
        for(var i = 0 ; i < siblings.length ; i++){ //選択状態の解除ループ
            siblings[i].classList.remove(slctd);
        }
        clickedElem.classList.add(slctd);
    });
    //--------------------------------------------------------------</text_text_anchor>

    //<text_fill>---------------------------------------------------------------
    var $pickerElem = $nodeEditConsoleElem.find(".propertyEditor.fill").children(".picker").eq(0);
    var $inputElem = $nodeEditConsoleElem.find(".propertyEditor.fill").children(".pickedColorText").eq(0);

    $pickerElem.spectrum({
        showAlpha: true,
        allowEmpty: true,
        showInitial: true,
        clickoutFiresChange: true, // <- カラーピッカーの範囲外をクリックする or ESC押下時に、
                                   //    最後に入力されていたtinyColorObjを、
                                   //    'change'イベント、'hide'イベントそれぞれに渡す(コール順序は'change'→'hide')
                                   //    最後に入力されていたtinyColorObjがEmptyな場合は、nullを渡す
        preferredFormat: "rgb",
        containerClassName: 'editableNode-spectrum_container',
    });

    //カラーピッカーのドラッグイベント
    $pickerElem.on('move.spectrum', function(e, tinycolorObj) {
        $inputElem.val(tinycolorObj); //<input>要素に値を設定する

        //SVGNodeへの反映
        var totalReport = fireNodeEditConsoleEvent({text:{text_fill: tinycolorObj.toRgbString()}});
        if(!totalReport.allOK){ //適用失敗ノードがある場合
            console.warn("Cannot apply style \`fill:" + tinycolorObj.toRgbString() + ";\` to following element(s).");
            printRenderingFailuredSVGElements(totalReport);
        }
        //ログはとらない
    });

    //カラーピッカーの'chooseボタン'イベント
    $pickerElem.on('change.spectrum', function(e, tinycolorObj) {
        
        var rgbStr = tinycolorObj.toRgbString();

        //SVGNodeへの反映
        var totalReport = fireNodeEditConsoleEvent({text:{text_fill:rgbStr}});
        if(!totalReport.allOK){ //適用失敗ノードがある場合
            console.warn("Cannot apply style \`fill:" + rgbStr + ";\` to following element(s).");
            printRenderingFailuredSVGElements(totalReport);
            rollbackTansaction(totalReport); // totalReport を使って変更前状態にロールバックする
            
            //caution ロールバックしたカラーはカラーピッカーに反映されない

        }else{ //適用成功の場合
            totalReport.message = "text fill:" + rgbStr;
            appendHistory(totalReport); //historyに追加
        }
        
    });

    //カラーピッカーの非表示イベント
    $pickerElem.on('hide.spectrum', function(e, tinycolorObj) {
        // nothing to do
    });

    //<input>要素のキー押下イベント
    $inputElem.get(0).oninput = function(){

        var iputStr = $inputElem.val();

        //TinyColorでパース可能な文字列かどうかチェック
        if(!(tinycolor(iputStr).isValid())){ //パース不可能な場合
            console.warn("Cannot parse \`" + iputStr + "\` by TinyColor.");
            return;
        }
        $pickerElem.spectrum("set", iputStr); //カラーピッカーに反映

        //SVGNodeへの反映
        var totalReport = fireNodeEditConsoleEvent({text:{text_fill:iputStr}});
        if(!totalReport.allOK){ //適用失敗ノードがある場合
            console.warn("Cannot apply style \`fill:" + iputStr + ";\` to following element(s).");
            printRenderingFailuredSVGElements(totalReport);
            rollbackTansaction(totalReport); // totalReport を使って変更前状態にロールバックする
            
            //caution ロールバックしたカラーはカラーピッカーに反映されない

        }else{ //適用成功の場合
            totalReport.message = "text fill:" + iputStr;
            appendHistory(totalReport); //historyに追加
        }
    }

    //cancelボタンクリックイベント
    $(".editableNode-spectrum_container .sp-cancel").on('click',function(){
        
        var tinycolorObj = $pickerElem.spectrum("get");

        //todo 動きが直感的でないので要再検討

        // if(tinycolorObj !== null){ //nullな場合はrenderしない
        //     var rbgStr = tinycolorObj.toRgbString();
        //     //SVGNodeへの反映
        //     var totalReport = fireNodeEditConsoleEvent({text:{text_fill:rbgStr}});
        //     if(!totalReport.allOK){ //適用失敗ノードがある場合
        //         console.warn("Cannot apply style \`fill:" + rbgStr + ";\` to following element(s).");
        //         printRenderingFailuredSVGElements(totalReport);
        //         rollbackTansaction(totalReport); // totalReport を使って変更前状態にロールバックする
                
        //         //caution ロールバックしたカラーはカラーピッカーに反映されない

        //     }else{ //適用成功の場合
        //         totalReport.message = "canceled text fill";
        //         appendHistory(totalReport); //historyに追加
        //     }
        // }

        

    });

    //--------------------------------------------------------------</text_fill>

    //---------------------------------------------------------------------------------------------------------</register behavor>
});

function fireNodeEditConsoleEvent(argObj){
    var totalReport = {};
    totalReport.allOK = true;
    totalReport.reportsArr = [];

    var eventObj = document.createEvent("Event");
    eventObj.initEvent("NodeEditConsoleEvent", false, false);
    eventObj.argObj　= {};
    eventObj.argObj.renderByThisObj = argObj;
    eventObj.argObj.clbkFunc = function(renderReport){ //ノード変更レポートの追加用コールバック関数
        
        //失敗が発生し場合は、totalReportも失敗とする
        if(!renderReport.allOK){
            totalReport.allOK = false;
        }

        totalReport.reportsArr.push(renderReport);
    }
    
    //すべてのnode要素にイベントを発行する
    var nodes = $3nodes.nodes();
    for(var i = 0 ; i < nodes.length ; i++){
        nodes[i].dispatchEvent(eventObj);
    }

    //コールバックがなかった(=登録リスナがなかった)場合は、totalReportも失敗とする
    if(totalReport.reportsArr.length == 0){
        totalReport.allOK = false;
    }

    return totalReport;
}

function printRenderingFailuredSVGElements(totalReport){

    //引数チェック
    if(totalReport.reportsArr.length == 0){ //コールバックがなかった(=登録リスナがなかった)場合
        console.warn("No SVG Node to Apply");
        return;
    }

    //失敗レポート検索ループ
    for(var i = 0 ; i < totalReport.reportsArr.length ; i++){
        var reportObj = totalReport.reportsArr[i];
        if(!reportObj.allOK){ //失敗していた場合
            var bindedData = getBindedDataFromKey(reportObj.key);
            if(typeof bindedData == 'undefined'){ //データが見つからない場合
                console.warn("Cannot find \`key:" + reportObj.key + "\`"); //keyIDのみ表示する
            }else{
                console.warn((getDomPath(bindedData.$3bindedSVGElement.node())).join('/')); //対象SVGのDomPathを表示する
            }
        }
    }
}

var $3historyElem = $3editableNodesTAG.append("div")
    .style("position", "absolute")
    .style("z-index", 10)
    .style("margin", 0)
    .style("border", 0)
    .style("padding", 0)
    .style("right",0)
    .style("max-width", "300px") //<- 仮の数値
    .style("max-height", "300px") //<- 仮の数値
    .style("white-space","nowrap")
    .style("overflow","auto")
    .classed("historyElem",true)
    .attr("wrap","off");

function appendHistory(transactionObj){
    $3historyElem.append("div")
        .append("p")
        .text(transactionObj.message); //仮の処理

    //Append History
    transactionHistory.push(transactionObj);
}



//ノードの追加
var firstTotalReport = {};
firstTotalReport.allOK = true;
firstTotalReport.reportsArr = [];
var $3nodes = $3editableNodesTAG.append("svg")
    .classed("SVGForNodesMapping",true)
    .attr("width", "100%") //<-テスト用の仮数値
    .attr("height", 800) //<-テスト用の仮数値
    .style("vertical-align", "bottom")
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .classed("node", true)
    .each(function(d ,i){

        d.$3bindedSVGElement = d3.select(this);

        checkToBindData(d); //data書式のチェック
        
        //座標追加
        d.coordinate = {
            x: ($3editableNodesTAG.node().offsetWidth / 2), //<-仮の処理
            y: (60*(i+1)) //<-仮の処理
        };

        var renderReport = renderSVGNode(d,d); //SVGレンダリング
        
        //失敗が発生した場合は、firstTotalReportも失敗とする
        if(!renderReport.allOK){
            firstTotalReport.allOK = false;
        }

        firstTotalReport.reportsArr.push(renderReport);
    });

//Append History
transactionHistory.push(firstTotalReport);

//UI TRAP
$3nodes.on(UITrappedEvents.editSVGNode, function(d){editSVGNode(d);});

function checkToBindData(checkThisData){

    if(typeof checkThisData.type == 'undefined'){ //type指定がない場合
        console.warn("Type not specified. This data will be handled as \`text\` type.");
        checkThisData.type = "text";
    }

    if(typeof checkThisData.type != 'string'){ //typeの型がstringでない場合
        console.warn("Wrong type specified in \`checkThisData.type\`. " +
                     "specified type:\`" + (typeof (checkThisData.type)) + "\`, expected type:\`string\`.\n" +
                     "This data will be handled as \`text\` type.");
        checkThisData.type = "text";
    }

    var forceAsText = false;

    //不足オブジェクトのチェック&追加
    switch(checkThisData.type){
        
        case "text":
        {
            forceAsText = true;
        }
        break;

        default:
        {
            console.warn("unknown data type \`" + checkThisData.type + "\` specified. This data will be handled as \`text\` type.");
            checkThisData.type = "text";
            forceAsText = true;
        }
        break;
    }

    if(forceAsText){
        //"text" type 固有の不足オブジェクトのチェック&追加
        if(typeof (checkThisData.text) == 'undefined'){
            checkThisData.text = {}; //空のオブジェクトを作る
        }
        if(typeof (checkThisData.text.text_content) == 'undefined'){
            checkThisData.text.text_content = ""; //空文字を定義
        }
        if(typeof (checkThisData.text.frame_shape) == 'undefined'){
            checkThisData.text.frame_shape = "rect" //矩形
        }
    }
}

function renderSVGNode(bindedData, renderByThisObj){

    var $3SVGnodeElem = bindedData.$3bindedSVGElement;
    var reportObj;
    var rerender = false;
    var toAppendTypeRenderFail = "";
    
    //type指定チェック
    if(typeof (renderByThisObj.type) != 'undefined'){ //type指定がある場合
        if(typeof (renderByThisObj.type) != 'string'){ //型がstringでない
            
            toAppendTypeRenderFail = "Wrong type specified in \`renderByThisObj.type\`. " +
                          "specified type:\`" + (typeof (renderByThisObj.type)) + "\`, expected type:\`string\`.";
            console.warn(toAppendTypeRenderFail);            
            //failure レポート はリレンダリング後に行う

            rerender = true;
        
        }else{ //型がstring
            switch(renderByThisObj.type){
                case "text":
                {
                    //定義済みSVGElement構造の全削除
                    while($3SVGnodeElem.node().firstChild){
                        $3SVGnodeElem.node().removeChild($3SVGnodeElem.node().firstChild);
                    }

                    //SVGElement構造の定義
                    $3SVGnodeElem.append("g").classed("frame", true); //枠定義
                    
                    $3SVGnodeElem.append("text") //<text>定義
                        .classed("textContent", true)
                        .style("white-space", "pre");

                    $3SVGnodeElem.append("g").classed("selectionLayer", true); //selectionLayer定義

                    //レンダリング
                    reportObj = renderTextTypeSVGNode(bindedData, renderByThisObj);

                    //変更レポートの追加
                    reportObj.PrevObj.type = bindedData.type;
                    reportObj.RenderedObj.type = "text";
                }
                break;
        
                default:
                {
                    toAppendTypeRenderFail = "Unknown type \`" + renderByThisObj.type + "\` specified in \`renderByThisObj.type\`. ";
                    console.warn(toAppendTypeRenderFail);
                    //failure レポート はリレンダリング後に行う

                    rerender = true;
                }
                break;
            }
        }
    
    }else{ //type指定が存在しない場合
        rerender = true;
    }

    if(rerender){
        //前回のtypeでリレンダリングする
        switch(bindedData.type){
            case "text":
            {
                reportObj = renderTextTypeSVGNode(bindedData, renderByThisObj);
            }
            break;

            default:
            break; //nothing to do
        }

        //type指定エラーがあった場合
        if(toAppendTypeRenderFail != ""){
            reportObj.FailuredMessages.type = toAppendTypeRenderFail;
        }
    }

    return reportObj;
}

function renderTextTypeSVGNode(bindedData, renderByThisObj){

    //text property存在チェック
    if(typeof (renderByThisObj.text) == 'undefined'){
        renderByThisObj.text = {};
    }

    //変更レポート
    var reportObj = {
        key:bindedData.key,
        allOK:true,
        PrevObj:{
            text: {},
            coordinate: {}
        },
        RenderedObj:{
            text: {},
            coordinate: {}
        },
        FailuredMessages:{
            text: {},
            coordinate: {}
        }
    };

    var $3SVGnodeElem = bindedData.$3bindedSVGElement;

    var $3SVGnodeElem_DOTframe = $3SVGnodeElem.select(".frame");
    var $3SVGnodeElem_text = $3SVGnodeElem.select("text");
    var $3SVGnodeElem_DOTselectionLayer = $3SVGnodeElem.select(".selectionLayer");

    var inlineStyleOf_SVGnodeElem_text = $3SVGnodeElem_text.node().style;
    var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

    var haveToUpdateFrame = false;
    var vacantStarted = false;
    var vacantEnded = false;

    //テキスト更新
    if(typeof (renderByThisObj.text.text_content) != 'undefined'){ //textオブジェクトがある場合

        //変更前textを取得
        var beforeTspans = $3SVGnodeElem_text.node().childNodes;
        var prevTxt = "";
        if(beforeTspans.length > 0){ //<tspan>が存在する
            prevTxt = beforeTspans[0].textContent;
            for(var i = 1 ; i < beforeTspans.length ; i++){
                prevTxt += ("\n" + beforeTspans[i].textContent);
            }
        }
        
        if(typeof (renderByThisObj.text.text_content) != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_content\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_content)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_content = wrn;

        }else{ //型がstring

            //定義済tspan要素の全削除
            while($3SVGnodeElem_text.node().firstChild){
                $3SVGnodeElem_text.node().removeChild($3SVGnodeElem_text.node().firstChild);
            }

            if(renderByThisObj.text.text_content == ""){ //空文字の場合
                $3SVGnodeElem_text.append("tspan").text("");

            }else{ //空文字ではない場合

                var lfSeparatedStrings = renderByThisObj.text.text_content.split(/\n/); //改行コードで分割
                
                //1行おきにtspan要素として追加
                var numOfVacantLines = 0;
                for(var i = 0 ; i < lfSeparatedStrings.length ; i++){
                    var str = lfSeparatedStrings[i];
                    
                    //最初の行or最後の行が空文字の場合は
                    //背景Shape更新の為にダミー文字を追加する
                    if(i == 0 && str == ""){ //最初の行が空文字
                        str = dummyChar;
                        vacantStarted = true;
                    }
                    if(i == (lfSeparatedStrings.length - 1) && str == ""){ //最後の行が空文字
                        str = dummyChar;
                        vacantEnded = true;
                    }

                    //行に対する表示位置調整
                    var em = (valOfEm * numOfVacantLines + (i>0 ? valOfEm : 0)) + "em";
                    if(str == ""){ //空行の場合
                        numOfVacantLines++;
                    }else{
                        numOfVacantLines = 0;
                    }

                    //draw 1 line
                    $3SVGnodeElem_text.append("tspan")
                        .attr("x", bindedData.coordinate.x)
                        .attr("dy", em)
                        .text(str);
                }
            }

            reportObj.PrevObj.text.text_content = prevTxt;
            reportObj.RenderedObj.text.text_content = renderByThisObj.text.text_content;
            haveToUpdateFrame = true;
        }
    }

    //テキスト座標更新
    if(typeof (renderByThisObj.coordinate) != 'undefined'){
        if(typeof (renderByThisObj.coordinate.x) != 'undefined'){ //x座標指定オブジェクトがあり

            //変更前状態を取得
            var prevX = $3SVGnodeElem_text.attr("x");
            
            if(typeof (renderByThisObj.coordinate.x) != 'number'){ //型がnumberでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.coordinate.x\`. " +
                          "specified type:\`" + (typeof (renderByThisObj.coordinate.x)) + "\`, expected type:\`number\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.coordinate.x = wrn;
            
            }else{ //型がnumber
                $3SVGnodeElem_text.attr("x", renderByThisObj.coordinate.x);

                //<tspan>要素に対するx座標指定
                $3SVGnodeElem_text.selectAll("tspan")
                    .attr("x", renderByThisObj.coordinate.x);
                
                if(prevX !== null){
                    prevX = parseFloat(prevX);
                }
                reportObj.PrevObj.coordinate.x = prevX;
                reportObj.RenderedObj.coordinate.x = renderByThisObj.coordinate.x;
                haveToUpdateFrame = true;
            }
        }

        if(typeof (renderByThisObj.coordinate.y) != 'undefined'){ //y座標指定があり

            //変更前状態を取得
            var prevY = $3SVGnodeElem_text.attr("y");

            if(typeof (renderByThisObj.coordinate.y) != 'number'){ //型がnumberでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.coordinate.y\`. " +
                          "specified type:\`" + (typeof (renderByThisObj.coordinate.y)) + "\`, expected type:\`number\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.coordinate.y = wrn;

            }else{ //型がnumber
                $3SVGnodeElem_text.attr("y", renderByThisObj.coordinate.y);

                if(prevY !== null){
                    prevY = parseFloat(prevY);
                }
                reportObj.PrevObj.coordinate.y = prevY;
                reportObj.RenderedObj.coordinate.y = renderByThisObj.coordinate.y;
                haveToUpdateFrame = true;
            }
        }
    }

    //テキストの右寄せ・中央寄せ・左寄せ
    if(typeof renderByThisObj.text.text_anchor != 'undefined'){ //text-anchor指定有り

        //変更前状態を取得
        var prevTextAnchor = inlineStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor");
        if(prevTextAnchor == ""){ //空文字のの場合
            prevTextAnchor = null;
        }

        if(typeof renderByThisObj.text.text_anchor != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_anchor\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_anchor)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_anchor = wrn;
        
        }else{ //型がstring
            $3SVGnodeElem_text.style("text-anchor", renderByThisObj.text.text_anchor);
            
            //適用可否チェック
            if(renderByThisObj.text.text_anchor != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor")){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.text_anchor\` did not applied. " +
                          "specified style:\`" + renderByThisObj.text.text_anchor + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor") + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_anchor = wrn;

                $3SVGnodeElem_text.style("text-anchor", prevTextAnchor); //変更前の状態に戻す

            }else{ //適用された場合
                reportObj.PrevObj.text.text_anchor = prevTextAnchor;
                reportObj.RenderedObj.text.text_anchor = renderByThisObj.text.text_anchor;
                haveToUpdateFrame = true;
            }
        }
    }

    //font-family
    if(typeof renderByThisObj.text.text_font_family != 'undefined'){ //font-family指定有り

        //変更前状態を取得
        var prevFontFamily = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-family");
        if(prevFontFamily == ""){ //未設定の場合
            prevFontFamily = null;
        }

        if(typeof renderByThisObj.text.text_font_family != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_family\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_font_family)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_font_family = wrn;

        }else{ //型がstring
            var applyThisFontFamily = (renderByThisObj.text.text_font_family).replace(/\"/g, "'"); //スペースを含むフォントの引用符をsingle quoteに統一
            $3SVGnodeElem_text.style("font-family", applyThisFontFamily);
            
            //適用可否チェック
            var appliedFontFamily = (computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family")).replace(/\"/g, "'");
            if(applyThisFontFamily != appliedFontFamily){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.text_font_family\` did not applied. " +
                          "specified style:\`" + applyThisFontFamily + "\`, browser applied style:\`" + appliedFontFamily + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_family = wrn;

                $3SVGnodeElem_text.style("font-family", prevFontFamily); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.text_font_family = prevFontFamily;
                reportObj.RenderedObj.text.text_font_family = applyThisFontFamily; //inline styleに適用するために整形した状態の文字列を格納する
                haveToUpdateFrame = true;
            }
        }
    }

    //font-size
    if(typeof renderByThisObj.text.text_font_size != 'undefined'){ //font-size指定有り

        //変更前状態を取得
        var prevFontSize = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
        if(prevFontSize == ""){
            prevFontSize = null;
        }

        if(typeof renderByThisObj.text.text_font_size != 'number'){ //型がnumberでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_size\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_font_size)) + "\`, expected type:\`number\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_font_size = wrn;
        
        }else{ //型がnumber
            var applyThisFontSize = renderByThisObj.text.text_font_size + "px";
            $3SVGnodeElem_text.style("font-size", applyThisFontSize);

            //適用可否チェック
            var appliedFontSize = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);

            if(!(pixcelNumberRegex.test(appliedFontSize))){ // `0.0px`形式に設定できていない場合
                                                            // 指数表記になるような極端な数値も、このルートに入る

                var wrn = "Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                          "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_size = wrn;

                $3SVGnodeElem_text.style("font-size", prevFontSize); //変更前の状態に戻す

            }else{
                if( Math.abs(parseFloat(appliedFontSize) - renderByThisObj.text.text_font_size) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                    var wrn = "Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                              "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_font_size = wrn;

                    $3SVGnodeElem_text.style("font-size", prevFontSize); //変更前の状態に戻す
                
                }else{ //適用された場合
                    if(prevFontSize !== null){
                        prevFontSize = parseFloat(prevFontSize);
                    }
                    reportObj.PrevObj.text.text_font_size = prevFontSize;
                    reportObj.RenderedObj.text.text_font_size = renderByThisObj.text.text_font_size;
                    haveToUpdateFrame = true;
                }
            }
        }
    }

    //font-weight
    if(typeof renderByThisObj.text.text_font_weight != 'undefined'){ //font-weight指定有り

        //変更前状態を取得
        var prevFontWeight = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
        if(prevFontWeight == ""){ //未設定の場合
            prevFontWeight = null;
        }

        if(typeof renderByThisObj.text.text_font_weight != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_weight\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_font_weight)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_font_weight = wrn;
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("font-weight", renderByThisObj.text.text_font_weight);

            //適用可否確認用文字列生成
            var applyThisFontWeight = renderByThisObj.text.text_font_weight;
            if(applyThisFontWeight == "bold"){
                applyThisFontWeight = "700";

            }else if(applyThisFontWeight == "normal"){
                applyThisFontWeight = "400";
            }
            var appliedFontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
            if(appliedFontWeight == "bold"){
                appliedFontWeight = "700";

            }else if(appliedFontWeight == "normal"){
                appliedFontWeight = "400";
            }

            //適用可否チェック
            if(applyThisFontWeight != appliedFontWeight){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.text_font_weight\` did not applied. " +
                          "specified style:\`" + applyThisFontWeight + "\`, browser applied style:\`" + appliedFontWeight + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_weight = wrn;

                $3SVGnodeElem_text.style("font-weight", prevFontWeight); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.text_font_weight = prevFontWeight;
                reportObj.RenderedObj.text.text_font_weight = renderByThisObj.text.text_font_weight;
                haveToUpdateFrame = true;
            }
        }
    }

    //font-style
    if(typeof renderByThisObj.text.text_font_style != 'undefined'){ //font-style指定有り

        //変更前状態を取得
        var prevFontStyle = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-style");
        if(prevFontStyle == ""){ //未設定の場合
            prevFontStyle = null;
        }

        if(typeof renderByThisObj.text.text_font_style != 'string'){ //型がstringでない
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_style\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_font_style)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_font_style = wrn;
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("font-style", renderByThisObj.text.text_font_style);

            //適用可否チェック
            if(renderByThisObj.text.text_font_style != computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style")){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.text_font_style\` did not applied. " +
                          "specified style:\`" + renderByThisObj.text.text_font_style + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style") + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_style = wrn;

                $3SVGnodeElem_text.style("font-style", prevFontStyle); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.text_font_style = prevFontStyle;
                reportObj.RenderedObj.text.text_font_style = renderByThisObj.text.text_font_style;
                haveToUpdateFrame = true;
            }
        }
    }

    //text-decoration
    if(typeof renderByThisObj.text.text_text_decoration != 'undefined'){ //text-decoration指定有り

        //変更前状態を取得
        var prevTextDeco = inlineStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");
        if(prevTextDeco == ""){ //未設定の場合
            prevTextDeco = null;
        }

        if(typeof renderByThisObj.text.text_text_decoration != 'string'){ //型がstringでない
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_text_decoration\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_text_decoration)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_text_decoration = wrn;
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("text-decoration", renderByThisObj.text.text_text_decoration);

            //適用可否チェック
            if(renderByThisObj.text.text_text_decoration != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration")){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.text_text_decoration\` did not applied. " +
                          "specified style:\`" + renderByThisObj.text.text_text_decoration + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration") + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_text_decoration = wrn;

                $3SVGnodeElem_text.style("text-decoration", prevTextDeco); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.text_text_decoration = prevTextDeco;
                reportObj.RenderedObj.text.text_text_decoration = renderByThisObj.text.text_text_decoration;
                haveToUpdateFrame = true;
            }
        }
    }

    //テキストの色
    if(typeof renderByThisObj.text.text_fill != 'undefined'){ //text fill指定有り

        //変更前状態を取得
        var prevTextFill = inlineStyleOf_SVGnodeElem_text.getPropertyValue("fill");
        if(prevTextFill == ""){ //未設定の場合
            prevTextFill = null;
        }

        if(typeof renderByThisObj.text.text_fill != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_fill\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_fill)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_fill = wrn;
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("fill", renderByThisObj.text.text_fill);

            //適用可否チェック
            if(renderByThisObj.text.text_fill != computedStyleOf_SVGnodeElem_text.getPropertyValue("fill")){ //computed styleに適用されなかった場合
                var wrn  = "Specified style in \`renderByThisObj.text.text_fill\` did not applied. " +
                           "specified style:\`" + renderByThisObj.text.text_fill + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("fill") + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_fill = wrn;

                $3SVGnodeElem_text.style("fill", prevTextFill); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.text_fill = prevTextFill;
                reportObj.RenderedObj.text.text_fill = renderByThisObj.text.text_fill;
                //haveToUpdateFrame = true; //<- not needed
            }
        }
    }

    //frame存在チェック
    if(!($3SVGnodeElem_DOTframe.node().firstChild)){ //frameの描画要素が存在しない場合
        $3SVGnodeElem_DOTframe.append("rect");
        haveToUpdateFrame = true;
    }


    //frame設定変更によるframe自体の再描画要否チェック
    
    //枠
    if(typeof renderByThisObj.text.frame_shape != 'undefined'){ //frame shape指定有り
        haveToUpdateFrame = true;
    }

    //frame_stroke_width
    if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
        haveToUpdateFrame = true;
    }

    //枠
    if(haveToUpdateFrame){

        //stroke-width設定の抽出
        var pxNumOfStrokeWidth;
        if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
            if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合

                //nothing to do
                //※エラーレポート処理はstroke-width描画処理内で行う※

            }else{ //型はnumber
                pxNumOfStrokeWidth = parseFloat(renderByThisObj.text.frame_stroke_width);
            }
        }
        
        if(typeof (pxNumOfStrokeWidth) == 'undefined'){ //レンダー指定オブジェクト内に有効なstroke-widthがない

            //ブラウザ適用済みスタイルからstroke-widthを抽出する
            var appliedStrokeWidth = window.getComputedStyle($3SVGnodeElem_DOTframe.node().firstChild).getPropertyValue("stroke-width");
            
            // `0.0px`形式に設定できていない場合
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
            if(!(pixcelNumberRegex.test(appliedStrokeWidth))){ // `0.0px`形式に設定できていない場合
                                                               // 指数表記になるような極端な数値も、このルートに入る
                                                                
                console.warn("Unable to detect pxcel size from applied \'stroke-width\`. " +
                             "applied style:\`" + appliedStrokeWidth + "\`, browser applied style:\`" + appliedFontSize + "\`.");
                
                pxNumOfStrokeWidth = 0; //0pxとして扱う
            
            }else{ // `0.0px`形式の場合場合
                pxNumOfStrokeWidth = parseFloat(appliedStrokeWidth);
            }
        }

        var SVGnodeElem_text = $3SVGnodeElem_text.node();
        var SVGnodeElem_text_tspans = SVGnodeElem_text.childNodes;

        var textRectArea = {};

        //<text>の占有矩形エリアの算出
        if(SVGnodeElem_text_tspans.length == 1 &&
           SVGnodeElem_text_tspans[0].textContent == ""){ //空文字の場合
        
            textRectArea.x = parseFloat($3SVGnodeElem_text.attr("x"));
            textRectArea.y = parseFloat($3SVGnodeElem_text.attr("y"));
            textRectArea.width = 0;
            textRectArea.height = 0;

        }else{ //<text>が空ではない場合

            textRectArea.x = SVGnodeElem_text.getBBox().x;
            textRectArea.y = SVGnodeElem_text.getBBox().y;
            textRectArea.width = SVGnodeElem_text.getBBox().width;
            textRectArea.height = SVGnodeElem_text.getBBox().height;
            
        }

        var rerender = false;
        
        if(typeof renderByThisObj.text.frame_shape != 'undefined'){ //frame shape指定有り

            //変更前状態を取得
            var prevShape = $3SVGnodeElem_DOTframe.node().firstChild.tagName.toLowerCase();  //1回目の描画時は"rect"になる。-> 仕様とする
            
            if(typeof renderByThisObj.text.frame_shape != 'string'){ //型がstringでない
                var wrn = "Wrong type specified in \`renderByThisObj.text.frame_shape\`. " +
                          "specified type:\`" + (typeof (renderByThisObj.text.frame_shape)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_shape = wrn;

                rerender = true;
            
            }else{ //型はstring

                //frame shape 変更分岐
                switch(renderByThisObj.text.frame_shape.toLowerCase()){
                    
                    case "rect":
                    {
                        //古いframeオブジェクトを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);

                        //rect描画
                        resizeTextTypeSVGNode_rectFrame($3SVGnodeElem_DOTframe.append("rect"),
                                                        textRectArea,
                                                        padding,
                                                        pxNumOfStrokeWidth);
                        
                        reportObj.PrevObj.text.frame_shape = prevShape;
                        reportObj.RenderedObj.text.frame_shape = "rect";
                    }
                    break;
    
                    case "circle":
                    {
                        //古いframeオブジェクトを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);

                        //circle描画
                        resizeTextTypeSVGNode_circleFrame($3SVGnodeElem_DOTframe.append("circle"),
                                                          textRectArea,
                                                          padding,
                                                          pxNumOfStrokeWidth);

                        reportObj.PrevObj.text.frame_shape = prevShape;
                        reportObj.RenderedObj.text.frame_shape = "circle";
                    }
                    break;
    
                    case "ellipse":
                    {
                        //古いframeオブジェクトを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);

                        //ellipse描画
                        resizeTextTypeSVGNode_ellipseFrame($3SVGnodeElem_DOTframe.append("ellipse"),
                                                           textRectArea,
                                                           padding,
                                                           pxNumOfStrokeWidth);

                        reportObj.PrevObj.text.frame_shape = prevShape;
                        reportObj.RenderedObj.text.frame_shape = "ellipse";
                    }
                    break;
    
                    default:
                    {
                        var wrn = "Unknown shape \`" + renderByThisObj.text.frame_shape + "\` specified in \`renderByThisObj.text.frame_shape\`. ";
                        console.warn(wrn);
                        reportObj.FailuredMessages.text.frame_shape = wrn;

                        rerender = true;
                    }
                    break;
                }
            }

        }else{ //frame shape指定無し
            rerender = true;
        }

        if(rerender){
            
            //古いframe要素を再調整
            var SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.node().firstChild;
            switch(SVGnodeElem_DOTframe_frame.tagName.toLowerCase()){
                case "rect":
                {
                    //リサイズ
                    resizeTextTypeSVGNode_rectFrame(d3.select(SVGnodeElem_DOTframe_frame),
                                                    textRectArea,
                                                    padding,
                                                    pxNumOfStrokeWidth);
                }
                break;

                case "circle":
                {
                    //リサイズ
                    resizeTextTypeSVGNode_circleFrame(d3.select(SVGnodeElem_DOTframe_frame),
                                                      textRectArea,
                                                      padding,
                                                      pxNumOfStrokeWidth);
                }
                break;

                case "ellipse":
                {
                    //リサイズ
                    resizeTextTypeSVGNode_ellipseFrame(d3.select(SVGnodeElem_DOTframe_frame),
                                                       textRectArea,
                                                       padding,
                                                       pxNumOfStrokeWidth);
                }
                break;

                default:
                break; // nothing to do
            }
        }
    }

    //最初の行or最後の行が空文字の場合に挿入したダミー文字を削除する
    if(vacantStarted){ //最初の行にダミー文字を入れていた時
        $3SVGnodeElem_text.node().firstChild.textContent = "";
    }
    if(vacantEnded){ //最後の行にダミー文字を入れていた時
        $3SVGnodeElem_text.node().lastChild.textContent = "";
    }

    var $3SVGnodeElem_DOTframe_frame = d3.select($3SVGnodeElem_DOTframe.node().firstChild);
    var inlineStyleOf_SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe_frame.node().style;
    var computedStyleOf_SVGnodeElem_DOTframe_frame = window.getComputedStyle($3SVGnodeElem_DOTframe_frame.node());

    //枠線の太さ
    if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
        
        //変更前状態を取得
        var prevStrokeWidth = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
        if(prevStrokeWidth == ""){
            prevStrokeWidth = null;
        }

        if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.frame_stroke_width\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_width)) + "\`, expected type:\`number\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.frame_stroke_width = wrn;

        }else{ //型はnumber
            var applyThisStrokeWidth = renderByThisObj.text.frame_stroke_width + "px";
            $3SVGnodeElem_DOTframe_frame.style("stroke-width", applyThisStrokeWidth);

            //適用可否チェック
            var appliedStrokeWidth = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);

            if(!(pixcelNumberRegex.test(appliedStrokeWidth))){ // `0.0px`形式に設定できていない場合
                                                               // 指数表記になるような極端な数値も、このルートに入る
                
                var wrn = "Specified style in \`renderByThisObj.text.frame_stroke_width\` did not applied. " +
                          "specified style:\`" + applyThisStrokeWidth + "\`, browser applied style:\`" + appliedStrokeWidth + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_stroke_width = wrn;

                $3SVGnodeElem_DOTframe_frame.style("stroke-width", prevStrokeWidth); //変更前の状態に戻す
            
            }else{
                if( Math.abs(parseFloat(appliedStrokeWidth) - renderByThisObj.text.frame_stroke_width) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                    var wrn = "Specified style in \`renderByThisObj.text.frame_stroke_width\` did not applied. " +
                              "specified style:\`" + applyThisStrokeWidth + "\`, browser applied style:\`" + appliedStrokeWidth + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.frame_stroke_width = wrn;

                    $3SVGnodeElem_DOTframe_frame.style("stroke-width", prevStrokeWidth); //変更前の状態に戻す
                
                }else{ //適用された場合
                    if(prevStrokeWidth !== null){
                        prevStrokeWidth = parseFloat(prevStrokeWidth);
                    }
                    reportObj.PrevObj.text.frame_stroke_width = prevStrokeWidth;
                    reportObj.RenderedObj.text.frame_stroke_width = renderByThisObj.text.frame_stroke_width;
                }
            }
        }
    }

    //枠線の色
    if(typeof renderByThisObj.text.frame_stroke != 'undefined'){ //frame stroke指定有り

        //変更前状態を取得
        var prevStroke = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke");
        if(prevStroke == ""){
            prevStroke = null;
        }

        if(typeof renderByThisObj.text.frame_stroke != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.frame_stroke\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.frame_stroke = wrn;
        
        }else{ //型はstring
            $3SVGnodeElem_DOTframe_frame.style("stroke", renderByThisObj.text.frame_stroke);

            //適用可否チェック
            if(renderByThisObj.text.frame_stroke != computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke")){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.frame_stroke\` did not applied. " +
                          "specified style:\`" + renderByThisObj.text.frame_stroke + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke") + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_stroke = wrn;

                $3SVGnodeElem_DOTframe_frame.style("stroke", prevStroke); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.frame_stroke = prevStroke;
                reportObj.RenderedObj.text.frame_stroke = renderByThisObj.text.frame_stroke;
            }

        }
    }
    
    //枠線の破線パターン
    if(typeof renderByThisObj.text.frame_stroke_dasharray != 'undefined'){ //frame stroke-dasharray指定有り

        //変更前状態を取得
        var prevDashArr = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
        if(prevDashArr == ""){
            prevDashArr = null;
        }

        if(typeof renderByThisObj.text.frame_stroke_dasharray != 'string'){ //型がstringでない場合
            var wrn =  "Wrong type specified in \`renderByThisObj.text.frame_stroke_dasharray\`. " +
                       "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_dasharray)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.frame_stroke_dasharray = wrn;
        
        }else{ //型はstring
            var applyThisStrokeDasharray = renderByThisObj.text.frame_stroke_dasharray;
            //"px"とスペースは無視する
            applyThisStrokeDasharray = applyThisStrokeDasharray.replace(/px/g, "");
            applyThisStrokeDasharray = applyThisStrokeDasharray.replace(/ /g, "");

            $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", applyThisStrokeDasharray);

            //適用可否チェック
            var appliedStrokeDasharray = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
            appliedStrokeDasharray = appliedStrokeDasharray.replace(/px/g, ""); //"px"とスペースは無視する
            appliedStrokeDasharray = appliedStrokeDasharray.replace(/ /g, "");

            if(applyThisStrokeDasharray != appliedStrokeDasharray){ //computed styleに適用されなかった場合
                var wrn  = "Specified style in \`renderByThisObj.text.frame_stroke_dasharray\` did not applied. " +
                           "specified style:\`" + applyThisStrokeDasharray + "\`, browser applied style:\`" + appliedStrokeDasharray + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_stroke_dasharray = wrn;

                $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", prevDashArr); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.frame_stroke_dasharray = prevDashArr;
                reportObj.RenderedObj.text.frame_stroke_dasharray = applyThisStrokeDasharray; //inline styleに適用するために整形した状態の文字列を格納する
            }

        }
    }
    
    //背景色
    if(typeof renderByThisObj.text.frame_fill != 'undefined'){ //frame fill指定有り

        var prevFramefill = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill");
        if(prevFramefill == ""){
            prevFramefill = null;
        }

        if(typeof renderByThisObj.text.frame_fill != 'string'){ //型がstringでない場合
            var wrn  = "Wrong type specified in \`renderByThisObj.text.frame_fill\`. " +
                       "specified type:\`" + (typeof (renderByThisObj.text.frame_fill)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.frame_fill = wrn;
        
        }else{ //型はstring
            $3SVGnodeElem_DOTframe_frame.style("fill", renderByThisObj.text.frame_fill);

            //適用可否チェック
            if(renderByThisObj.text.frame_fill != computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill")){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.frame_fill\` did not applied. " +
                           "specified style:\`" + renderByThisObj.text.frame_fill + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill") + "\`."; 
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_fill = wrn;

                $3SVGnodeElem_DOTframe_frame.style("fill", prevFramefill); //変更前の状態に戻す
            
            }else{ //適用された場合
                reportObj.PrevObj.text.frame_fill = prevFramefill;
                reportObj.RenderedObj.text.frame_fill = renderByThisObj.text.frame_fill;
            }
        }
    }

    //変更レポート用警告チェック
    if(Object.keys(reportObj.FailuredMessages.text).length > 0 ||
       Object.keys(reportObj.FailuredMessages.coordinate).length > 0){ //警告が1つ以上ある場合
        reportObj.allOK = false;
    }

    //変更レポートを返却
    return reportObj;
}

function rollbackTansaction(transaction){
    
    //引数チェック
    if(transaction.reportsArr.length == 0){ //トランザクションレポートが存在しない
        console.warn("Specified trucsaction not contains SVG rendering report.");
        return;
    }

    //レンダリングレポート網羅ループ
    for(var i = 0 ; i < transaction.reportsArr.length ; i++){
        var reportObj = transaction.reportsArr[i];
        var bindedData = getBindedDataFromKey(reportObj.key);

        if(typeof bindedData == 'undefined'){ //対象のノードデータが存在しない場合
            console.error("\`key:" + reportObj.key + "\` not found in D3.js binded data array.");

        }else{ //対象のノードデータが存在する場合
            //todo roll back
            var rollbackRenderringReport = renderSVGNode(bindedData, reportObj.PrevObj);

            if(!rollbackRenderringReport.allOK){ //ロールバックに失敗した場合
                console.error("Cannot roll back \`" + getDomPath(bindedData.$3bindedSVGElement.node()).join('/') + "\`");
            }
        }
    }

}

//
//<text>要素の占有領域サイズに合わせて<rect>を再調整する
//
function resizeTextTypeSVGNode_rectFrame($3rectFrame, textRectArea, pdng, strkWdth){
    
    var halfOf_strkWdth = strkWdth / 2;

    //位置・サイズ算出
    var x = textRectArea.x - pdng - halfOf_strkWdth;
    var y = textRectArea.y - pdng - halfOf_strkWdth;
    var width = textRectArea.width + 2*pdng + strkWdth;
    var height = textRectArea.height + 2*pdng + strkWdth;

    //resize
    $3rectFrame.attr("x", x)
        .attr("y", y)
        .attr("width", width)
        .attr("height", height);
}

//
//<text>要素の占有領域サイズに合わせて<circle>を再調整する
//
function resizeTextTypeSVGNode_circleFrame($3circleFrame, textRectArea, pdng, strkWdth){

    //位置・サイズ算出
    var cx = textRectArea.x + (textRectArea.width / 2);
    var cy = textRectArea.y + (textRectArea.height / 2);
    var r = Math.sqrt(Math.pow(textRectArea.width,2) + Math.pow(textRectArea.height, 2)) / 2;
    r += pdng + (strkWdth / 2); //paddingとstroke-width分を加算

    //resize
    $3circleFrame.attr("cx", cx)
        .attr("cy", cy)
        .attr("r", r);
}

//
//<text>要素の占有領域サイズに合わせて<ellipse>を再調整する
//
function resizeTextTypeSVGNode_ellipseFrame($3ellipseFrame, textRectArea, pdng, strkWdth){

    //位置・サイズ算出
    var cx = textRectArea.x + (textRectArea.width / 2);
    var cy = textRectArea.y + (textRectArea.height / 2);

    if(textRectArea.width > 0 && textRectArea.height > 0){ //zero dividing 回避チェック
        var rx = Math.sqrt(Math.pow((textRectArea.width / 2), 2) + (Math.pow(textRectArea.width, 2) / Math.pow(textRectArea.height, 2)) * (Math.pow((textRectArea.height / 2), 2)));
        var ry = (textRectArea.height / textRectArea.width) * rx;

    }else{
        var rx = 0;
        var ry = 0;
    }

    //paddingとstroke-width分を加算
    rx += pdng + (strkWdth / 2);
    ry += pdng + (strkWdth / 2);

    //resize
    $3ellipseFrame.attr("cx", cx)
        .attr("cy", cy)
        .attr("rx", rx)
        .attr("ry", ry);
}

//
//SVGノードを編集する
//
function editSVGNode(bindedData){

    var $3SVGnodeElem = bindedData.$3bindedSVGElement;

    //type指定チェック
    if(typeof (bindedData.type) == 'undefined'){
        console.warn("\"type\" property is not specified");
        return; //存在しない場合場合は終了する
    }

    switch(bindedData.type){
        case "text":
        {
            editTextTypeSVGNode(bindedData);
        }
        break;

        default:
        {
            console.warn("unknown data type"); //<-仮の処理
            return;
        }
        break;
    }
}

function editTextTypeSVGNode(bindedData){
    
    var $3SVGnodeElem = bindedData.$3bindedSVGElement;
    var $3SVGnodeElem_text = $3SVGnodeElem.select("text");
    
    //<textarea>表示の為のtop位置を算出テキスト内容を<tspan>からを取得
    var SVGnodeElem_text_tspans = $3SVGnodeElem_text.node().childNodes;
    var textareaValue = SVGnodeElem_text_tspans[0].textContent;
    for(var i = 1 ; i < SVGnodeElem_text_tspans.length ; i++){
        textareaValue += ("\n" + SVGnodeElem_text_tspans[i].textContent);
    }

    //編集先Nodeの<text>を非表示にする
    $3SVGnodeElem_text.style("visibility", "hidden");

    //<textarea>の表示
    var $3textareaElem = $3editableNodesTAG.append("textarea")
        .style("position", "absolute")
        .style("margin", 0)
        .style("border", 0)
        .style("padding", 0)
        .style("line-height", valOfEm + "em")
        .style("resize", "none")
        .style("overflow", "hidden")
        .style("background-color", "rgba(105, 105, 105, 0)")
        .classed("mousetrap",true)
        .property("value", textareaValue)
        .attr("wrap","off");

    //<textarea>の表示調整
    adjustTextarea(bindedData, $3textareaElem);

    //<textarea>のサイズ自動調整リスナ登録
    $3textareaElem.node().oninput = function(){
        renderTextTypeSVGNode(bindedData, {text:{text_content:$3textareaElem.node().value}});
        adjustTextarea(bindedData, $3textareaElem);
    }

    //NodeEditConsoleからイベントを受け取るリスナ登録
    $3SVGnodeElem.node().addEventListener("NodeEditConsoleEvent",function(eventObj){
        
        //引数チェック
        if(typeof eventObj.argObj == 'undefined'){ //引数なし
            console.warn("NodeEditConsoleEvent was not specified \`argObj\`.");
            return;
        }
        if(typeof eventObj.argObj.renderByThisObj != 'object'){ //nodeレンダリング用objが存在しない
            console.warn("NodeEditConsoleEvent was not specified \`argObj.renderByThisObj\`.");
            return;
        }

        var renderReport = renderTextTypeSVGNode(bindedData, eventObj.argObj.renderByThisObj);
        adjustTextarea(bindedData, $3textareaElem);

        if(typeof eventObj.argObj.clbkFunc == 'function'){ //コールバック関数が存在する
            eventObj.argObj.clbkFunc(renderReport);
        }
        
    });

    //<textarea>にキャレットをフォーカス
    $3textareaElem.node().focus();

    textareaElem = $3textareaElem.node();

    //UI TRAP
    Mousetrap(textareaElem).bind(UITrappedEvents.insertLFWhenEditingTextTypeSVGNode, function(e){
        //LFを挿入する
        var txt = textareaElem.value;
        var toSelect = textareaElem.selectionStart + 1;
        var beforeTxt = txt.substr(0, textareaElem.selectionStart);
        var afterTxt = txt.substr(textareaElem.selectionEnd);
        textareaElem.value = beforeTxt + '\n' + afterTxt;
        textareaElem.selectionStart = toSelect;
        textareaElem.selectionEnd = toSelect;

        //<textarea>の表示調整
        renderTextTypeSVGNode(bindedData, {text:{text_content:textareaElem.value}});
        adjustTextarea(bindedData, $3textareaElem);

        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    Mousetrap(textareaElem).bind(UITrappedEvents.submitEditingTextTypeSVGNode, function(e){
        console.log("<textarea> submitted");
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

}

function disablingKeyEvent(e){
    if (e.preventDefault) {
        e.preventDefault();
    } else {
        // internet explorer
        e.returnValue = false;
    }
}

function adjustTextarea(bindedData, $3textareaElem){

    //apply styles from <SVGTextElement>------------------------------------------------------------------------------------
    var $3SVGnodeElem_text = bindedData.$3bindedSVGElement.select("text");
    var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

    var textareaStyle_textAlign = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor");
    switch(textareaStyle_textAlign){
        case "start": // `text-anchor:start;` -> `text-align:left;`
        {
            textareaStyle_textAlign = "left";
        }
        break;

        case "middle": // `text-anchor:middle;` -> `text-align:center;`
        {
            textareaStyle_textAlign = "center";
        }
        break;

        case "end": // `text-anchor:end;` -> `text-align:right;`
        {
            textareaStyle_textAlign = "right";
        }
        break;

        default:
        {
            console.warn("Unkown style \`text-anchor:" + textareaStyle_textAlign + ";\` applied in \`" + (getDomPath($3SVGnodeElem_text.node())).join('/') + "\`");
            textareaStyle_textAlign = defaultTextAlignForTextArea;
        }
        break;
    }
    
    //フォントの取得
    var textareaStyle_fontFamily = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family");

    //フォントサイズの取得
    var textareaStyle_fontSize = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
    var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
    if(!(pixcelNumberRegex.test(textareaStyle_fontSize))){ // `0.0px`形式に設定できていない場合
                                                           // 指数表記になるような極端な数値も、このルートに入る

        console.warn("Cannot calculate pxcel size of Browser applied font-size." +
                     "browser applied font-size:\`" + textareaStyle_fontSize + "\`.");
        
        textareaStyle_fontSize = defaultFontSizeForTextArea;
    }

    //<textarea>表示の為のtop位置を算出
    var halfLeading = (parseFloat(textareaStyle_fontSize) * (valOfEm - 1.0)) / 2;
    var textareaStyle_top = parseFloat($3SVGnodeElem_text.attr("y")) - getPxDistanceOf_textBeforeEdge_baseline(textareaStyle_fontSize, textareaStyle_fontFamily, $3editableNodesTAG.node()) - halfLeading;
    textareaStyle_top += "px";

    //font-weightの取得
    var textareaStyle_fontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");

    //font-styleの取得
    var textareaStyle_fontStyle = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style");

    //text-decorationの取得
    var textareaStyle_textDecoration = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");

    //文字色の取得
    var textareaStyle_color = computedStyleOf_SVGnodeElem_text.getPropertyValue("fill");

    $3textareaElem.style("text-align", textareaStyle_textAlign)
        .style("top", textareaStyle_top)
        .style("font-family", textareaStyle_fontFamily)
        .style("font-size", textareaStyle_fontSize)
        .style("font-weight",textareaStyle_fontWeight)
        .style("font-style",textareaStyle_fontStyle)
        .style("text-decoration",textareaStyle_textDecoration)
        .style("color", textareaStyle_color);
    //-----------------------------------------------------------------------------------/apply styles from <SVGTextElement>

    //adjust size------------------------------------------------------------------------------------
    var textareaElem = $3textareaElem.node();
    
    var marginWidthForCaret = parseFloat($3textareaElem.style("font-size")) / 2;
    var numOfLines = textareaElem.value.split(/\n/).length;
    $3textareaElem.style("width", ($3SVGnodeElem_text.node().getBBox().width + marginWidthForCaret) + "px");
    $3textareaElem.style("height", (numOfLines * (parseFloat($3textareaElem.style("font-size")) * valOfEm)) + "px");

    //overflowしている場合は、領域を広げる
    var pxNumOfScrollWidth = parseFloat(textareaElem.scrollWidth);
    if(pxNumOfScrollWidth > parseFloat($3textareaElem.style("width"))){ //widthがoverflowしている場合
        $3textareaElem.style("width", (pxNumOfScrollWidth + marginWidthForCaret) + "px");
    }
    var pxNumOfScrollHeight = parseFloat(textareaElem.scrollHeight);
    if(pxNumOfScrollHeight > parseFloat($3textareaElem.style("height"))){ //heightがoverflowしている場合
        $3textareaElem.style("height", pxNumOfScrollHeight + "px");
    }
    
    //left位置調整
    var pxNumOfLeft;
    switch($3textareaElem.style("text-align")){
        case "left":
        {
            pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x"));
        }
        break;

        case "center":
        {
            pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x")) - (parseFloat($3textareaElem.style("width")) / 2);
        }
        break;

        case "right":
        {
            pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x")) - parseFloat($3textareaElem.style("width"));
        }
        break;

        default:
        break; //nothing to do
    }
    $3textareaElem.style("left", pxNumOfLeft + "px");
    //-----------------------------------------------------------------------------------/adjust size

}

//
//指定フォントのbaselineからtext-before-edgeまでの高さを求める
//
function getPxDistanceOf_textBeforeEdge_baseline(fntSiz, fntFam, onlyForCalcElem){
    
    fntSiz = parseFloat(fntSiz); //"px"消去

    var distanceOf_baseline_textAfterEdge = getPxDistanceOf_baseline_textAfterEdge(fntSiz, fntFam, onlyForCalcElem);

    return fntSiz - distanceOf_baseline_textAfterEdge;

}

//
//指定フォントのdecenderの高さを取得する
//
//フォントのメタデータ解析をするのではなく、
//ダミー要素(フォントサイズ大のbmp画像と"y")を`vertical-align: baseline;`でレンダリングした結果を元に求める
//
//↓フォントのメタデータ解析は以下を理解する必要あり↓
//https://nixeneko.hatenablog.com/category/%E3%83%95%E3%82%A9%E3%83%B3%E3%83%88?page=1476195275
//
function getPxDistanceOf_baseline_textAfterEdge(fntSiz, fntFam, onlyForCalcElem){

    fntSiz = parseFloat(fntSiz); //"px"消去

    //計算用のdivを作る
    var tmpElem = onlyForCalcElem.appendChild(document.createElement("div"));
    tmpElem.setAttribute("class", "getPxDistanceOf_baseline_textAfterEdge");
    tmpElem.setAttribute("style", "position: absolute; " +
                                  "display: inline-block; " +
                                  "top: 0; " + 
                                  "left: 0; " + 
                                  "margin: 0; " +
                                  "border: 0; " +
                                  "padding: 0;");

    var tmpElem_p = tmpElem.appendChild(document.createElement("p"));
    tmpElem_p.setAttribute("style", "margin: 0; " +
                                    "border: 0; " +
                                    "padding: 0;" +
                                    "font-family: " + fntFam + "; " +
                                    "font-size: " + fntSiz + "px; " +
                                    "line-height: " + fntSiz + "px;");
    
    //フォントサイズの画像を追加
    var tmpElem_p_img = tmpElem_p.appendChild(document.createElement("img"));
    tmpElem_p_img.setAttribute("src", "data:image/bmp;base64,Qk1CAAAAAAAAAD4AAAAoAAAAAQAAAAEAAAABAAEAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAA"); //画像直接定義
    tmpElem_p_img.setAttribute("width", fntSiz + "px");
    tmpElem_p_img.setAttribute("height", fntSiz + "px");
    
    //文字列を追加
    var tmpElem_p_span = tmpElem_p.appendChild(document.createElement("span"));
    tmpElem_p_span.textContent = "y";
    
    //calc descender height
    var styleOf_tmpElem_p = window.getComputedStyle(tmpElem_p);
    var descenerHeight = parseFloat(styleOf_tmpElem_p.height) - fntSiz;

    //計算用divの削除
    onlyForCalcElem.removeChild(tmpElem);

    return descenerHeight;
}

//
//スクロールバーの幅を求める
//
//caution 小数点以下の値が拾えない
var widthOfScrollBar;
function getWidthOfScrollbar(onlyForCalcElem){
    
    var occupyingArea = 100;

    //計算済みの場合はその数値を返すだけ
    if(typeof widthOfScrollBar != 'undefined'){
        return widthOfScrollBar;
    }
    
    //計算用のdivを作る
    var tmpElem = onlyForCalcElem.appendChild(document.createElement("div"));
    tmpElem.setAttribute("class", "getWidthOfScrollbar");
    tmpElem.setAttribute("style", "position: absolute; " +
                                "display: inline-block; " +
                                "top: 0; " + 
                                "left: 0; " + 
                                "margin: 0; " +
                                "border: 0; " +
                                "padding: 0;" +
                                "width: " + occupyingArea + "px; " +
                                "height: " + occupyingArea + "px; " +
                                "overflow: scroll; ");
    
    //overflowするサイズの画像を挿入
    var tmpElem_img = tmpElem.appendChild(document.createElement("img"));
    tmpElem_img.setAttribute("src", "data:image/bmp;base64,Qk1CAAAAAAAAAD4AAAAoAAAAAQAAAAEAAAABAAEAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAA"); //画像直接定義
    tmpElem_img.setAttribute("style", "margin: 0; " +
                                      "border: 0; " +
                                      "padding: 0;" +
                                      "width: " + (occupyingArea * 2 ) + "px; " +
                                      "height: " + (occupyingArea * 2 ) + "px; ");
    
    var scrollbarwidth = tmpElem.offsetWidth - tmpElem.clientWidth;

    //計算用divの削除
    onlyForCalcElem.removeChild(tmpElem);

    return scrollbarwidth;
    
}

//
//dataset[]から特定キー番号のオブジェクトを返す
//存在しない場合は、'undefined'を返す
//
function getBindedDataFromKey(findByThisKey){

    //引数チェック
    if(typeof findByThisKey != 'number'){
        console.warn("specified argument \`findByThisKey\` type is not \`number\`");
        return;
    }

    var bindedData;

    //検索ループ
    for(var i = 0 ; i <  dataset.length ; i++){
        if(dataset[i].key == findByThisKey){
            bindedData = dataset[i];
            break;
        }
    }

    return bindedData;
}

//
//DOM要素のパスを取得する(デバッグ用)
//
function getDomPath(el) {
    
    var stack = [];
    
    while ( el.parentNode != null ) {
        
        //console.log(el.nodeName);
        var sibCount = 0;
        var sibIndex = 0;
        
        for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
            var sib = el.parentNode.childNodes[i];
            if ( sib.nodeName == el.nodeName ) {
                if ( sib === el ) {
                    sibIndex = sibCount;
                }
                sibCount++;
            }
        }

        if ( el.hasAttribute('id') && el.id != '' ) {
            stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
        } else if ( sibCount > 1 ) {
            stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
        } else {
            stack.unshift(el.nodeName.toLowerCase());
        }

        el = el.parentNode;
    }
    
    return stack.slice(1); // removes the html element
}
