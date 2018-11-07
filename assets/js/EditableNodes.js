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
    selectSVGNode: "click", //`d3.js` event
    editSVGNode: "dblclick", //`d3.js` event
    editSVGNodes: "f2", //`Mousetrap` event
    submitEditingTextTypeSVGNode: "enter", //`Mousetrap` event
    insertLFWhenEditingTextTypeSVGNode: "alt+enter", //`Mousetrap` event
};

var $3editableNodesTAG = d3.select("#editableNode")
    .style("position", "relative");

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

var nowEditng = false;
var lastSelectedData = null;
var transactionHistory = [];

var bufTotalReport_For_text_content; //Rendering Report 用バッファ
clearbufTotalReport_For_text_content();

//Rendering Report 用バッファ クリア
function clearbufTotalReport_For_text_content(){
    bufTotalReport_For_text_content = {};
    bufTotalReport_For_text_content.allOK = false; 
    bufTotalReport_For_text_content.allNG = true; // <- falseとなった場合は、ログに残すべきTransactionが少なくとも1件以上存在する事を表す
    bufTotalReport_For_text_content.reportsArr = [];
}

var $3nodeEditConsoleElem = $3editableNodesTAG.append("div")
    // .style("visibility", "hidden")
    .style("position", "absolute")
    .style("z-index", 10)
    .style("margin", 0)
    .style("border", 0)
    .style("padding", 0)
    .style("display","none")
    .classed("nodeEditConsoleElem",true);

var $nodeEditConsoleElem = $($3nodeEditConsoleElem.node());
$nodeEditConsoleElem.load(urlOf_EditableNodes_components_html,function(responseText, textStatus, jqXHR) {

    //成功確認
    if(textStatus === "error"){
        console.error("Cannot load \`" + urlOf_EditableNodes_components_html + "\`. statusText:\`" + jqXHR.statusText + "\`");
        return;
    }

    //<register behavor>----------------------------------------------------------------------------------------------------------

    //<text.text_anchor>---------------------------------------------------------------
    var haveToRollBack_text_anchor = true;
    var bufTotalReport_For_text_anchor = null; //Rendering Report 用バッファ
    var beforeExpMessage_For_text_anchor = "";
    var before_text_anchor = "";
    
    var $propertyEditor_text_anchor_expMsg = $nodeEditConsoleElem.find(".propertyEditor.text_anchor").children(".message.explicitness").eq(0);
    $nodeEditConsoleElem.find(".propertyEditor.text_anchor").children(".textAnchorType").on("click",function(){
        var clickedElem = this;

        if(!($(clickedElem.parentNode).prop("disabled"))){ //プロパティエディタが有効の場合

            appendHistory(bufTotalReport_For_text_anchor);
            haveToRollBack_text_anchor = false;
        }
    });
    
    $nodeEditConsoleElem.find(".propertyEditor.text_anchor").children(".textAnchorType").hover(
        
        function(){ //mouseenter
            
            var clickedElem = this;

            if(!($(clickedElem.parentNode).prop("disabled"))){ //プロパティエディタが有効の場合
                
                var specifiedType = clickedElem.getAttribute("data-text_anchor_type");
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

                haveToRollBack_text_anchor = true;
                beforeExpMessage_For_text_anchor = $propertyEditor_text_anchor_expMsg.text();

                bufTotalReport_For_text_anchor = fireNodeEditConsoleEvent_renderSVG({text:{text_anchor: specifiedType}});
                fireNodeEditConsoleEvent("NodeEditConsoleEvent_adjust");

                bufTotalReport_For_text_anchor.message = "text-anchor:" + specifiedType;
   
                //選択状態の解除ループ
                var siblings = clickedElem.parentNode.children;
                before_text_anchor = "";
                for(var i = 0 ; i < siblings.length ; i++){
                    if($(siblings[i]).hasClass(slctd)){ //選択状態だったら
                        before_text_anchor = siblings[i].getAttribute("data-text_anchor_type");
                    }
                    siblings[i].classList.remove(slctd);
                }
                clickedElem.classList.add(slctd); //クリックされた要素を"selected"状態にする

                if(bufTotalReport_For_text_anchor.allOK){ //適用全部成功の場合
                    $propertyEditor_text_anchor_expMsg.text("explicit");
                
                }else{ //適用一部失敗の場合
                    $propertyEditor_text_anchor_expMsg.text("explicit (some part)");
                    //note ロールバックは不要
                }
                
            }

        },function(){ //mouseleave

            var clickedElem = this;
            
            if(!($(clickedElem.parentNode).prop("disabled"))){ //プロパティエディタが有効の場合
                if(haveToRollBack_text_anchor){
                    rollbackTransaction(bufTotalReport_For_text_anchor); //元に戻す
                    fireNodeEditConsoleEvent("NodeEditConsoleEvent_adjust");
                    $propertyEditor_text_anchor_expMsg.text(beforeExpMessage_For_text_anchor);
                    clickedElem.classList.remove(slctd);
                    if(before_text_anchor != ""){
                        var selectorStr = '.textAnchorType[data-text_anchor_type="' + before_text_anchor + '"]';
                        $(clickedElem.parentNode).children(selectorStr).eq(0).addClass(slctd);
                    }                    
                }
            }

            bufTotalReport_For_text_anchor = null;
            beforeExpMessage_For_text_anchor = "";
            haveToRollBack_text_anchor = true;
        }
    )
    //--------------------------------------------------------------</text.text_anchor>

    //<text.text_fill>---------------------------------------------------------------
    var $pickerElem = $nodeEditConsoleElem.find(".propertyEditor.text_fill").children(".picker").eq(0);
    var $inputElem = $nodeEditConsoleElem.find(".propertyEditor.text_fill").children(".pickedColorText").eq(0);
    var $expMsgElem = $nodeEditConsoleElem.find(".propertyEditor.text_fill").children(".message.explicitness").eq(0);

    var bufTotalReport_For_text_fill; //Rendering Report 用バッファ
    
    //Rendering Report 用バッファ クリア
    var func_clearBufTotalReport_For_text_fill = function clearBufTotalReport_For_text_fill(){
        bufTotalReport_For_text_fill = {};
        bufTotalReport_For_text_fill.allOK = false; 
        bufTotalReport_For_text_fill.allNG = true; // <- falseとなった場合は、ログに残すべきTransactionが少なくとも1件以上存在する事を表す
        bufTotalReport_For_text_fill.reportsArr = [];
    }

    //バッファに積んだ Rendering Report を 確定させる
    var func_confirmBufTotalReport_For_text_fill = function confirmBufTotalReport_For_text_fill(){
        if(!bufTotalReport_For_text_fill.allNG){ //ログに記録するべきレポートが存在する場合

            //最後に反映したカラーをログから取得
            var latestTextFill = bufTotalReport_For_text_fill.reportsArr[0].RenderedObj.text.text_fill;

            $inputElem.val(latestTextFill); //最後に反映したカラーで<input>要素を更新
            $pickerElem.spectrum("set", latestTextFill); //カラーピッカーに反映

            if(bufTotalReport_For_text_fill.allOK){ //全てのNodeで適用成功の場合
                $expMsgElem.text("explicit");

            }else{ //1部Nodeで適用失敗の場合
                $expMsgElem.text("explicit (some part)");
            }

            appendHistory(bufTotalReport_For_text_fill);
            func_clearBufTotalReport_For_text_fill(); //ログ用バッファ初期化

        }
    }

    //SVGNodeへの反映 & Rendering Reportをバッファに積む
    var func_renderAndMergeBufTotalReport_For_text_fill = function renderAndMergeBufTotalReport_For_text_fill(toFillStr){
        //SVGNodeへの反映
        var totalReport = fireNodeEditConsoleEvent_renderSVG({text:{text_fill:toFillStr}});
        fireNodeEditConsoleEvent("NodeEditConsoleEvent_adjust");

        if(!totalReport.allNG){ //1つ以上のNodeで適用成功の場合
            totalReport.message = "text fill:" + toFillStr;
            overWriteScceededTransaction(totalReport, bufTotalReport_For_text_fill);
        }
    }

    func_clearBufTotalReport_For_text_fill(); //ログ用バッファ初期化

    //<input>要素内のキータイピングイベント
    $inputElem.get(0).oninput = function(){

        var iputStr = $inputElem.val();

        //TinyColorでパース可能な文字列かどうかチェック
        if(!(tinycolor(iputStr).isValid())){ //パース不可能な場合
            console.warn("Cannot parse \`" + iputStr + "\` by TinyColor.");
            return;
        }
        $pickerElem.spectrum("set", iputStr); //カラーピッカーに反映

        //SVGNodeへの反映 & Rendering Reportをバッファに積む
        func_renderAndMergeBufTotalReport_For_text_fill(iputStr);
    }

    //<input>要素からフォーカスが離れた時のイベント
    $inputElem.get(0).onblur = function(){
        func_confirmBufTotalReport_For_text_fill(); //バッファに積んだ Rendering Report を 確定させる
    }

    //register spectrum
    $pickerElem.spectrum({
        showAlpha: true,
        allowEmpty: false,
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
        
        if(tinycolorObj !== null){ //nullチェック。カラーピッカー右上の「×」をクリックすると、nullが来る。

            var iputStr = tinycolorObj.toRgbString();
            $inputElem.val(iputStr); //<input>要素に値を設定する

            //SVGNodeへの反映 & Rendering Reportをバッファに積む
            func_renderAndMergeBufTotalReport_For_text_fill(iputStr);
        }
    });

    //カラーピッカーの `chooseボタンクリック` or `範囲外クリック` or `ESC押下` イベント
    $pickerElem.on('change.spectrum', function(e, tinycolorObj) {
        func_confirmBufTotalReport_For_text_fill(); //バッファに積んだ Rendering Report を 確定させる
    });

    //カラーピッカーの非表示イベント
    $pickerElem.on('hide.spectrum', function(e, tinycolorObj) {
        // nothing to do
    });

    //cancelボタンクリックイベント
    $(".editableNode-spectrum_container .sp-cancel").on('click',function(){
        
        if(bufTotalReport_For_text_fill.allOK){ //成功したRenderingReportが存在する場合
            rollbackTransaction(bufTotalReport_For_text_fill); //元に戻す
            fireNodeEditConsoleEvent("NodeEditConsoleEvent_adjust"); //編集中の<textarea>を元に戻したSVGNodeに合わせる
            func_clearBufTotalReport_For_text_fill(); //ログ用バッファ初期化
        }

        //<input>要素をカラーピッカーの色に合わせる
        var tinycolorObj = $pickerElem.spectrum("get");

        if( tinycolorObj === null){ //直前がnullの場合
            $inputElem.val(""); //空文字にする

        }else{
            var rgbstr = tinycolorObj.toRgbString();
            $inputElem.val(rgbstr);
        }
    });

    //--------------------------------------------------------------</text.text_fill>

    //---------------------------------------------------------------------------------------------------------</register behavor>
});

function fireNodeEditConsoleEvent_renderSVG(argObj){
    var totalReport = {};
    totalReport.allOK = true;
    totalReport.allNG = true;
    totalReport.reportsArr = [];

    var eventObj = document.createEvent("Event");
    eventObj.initEvent("NodeEditConsoleEvent_renderSVG", false, false);
    eventObj.argObj　= {};
    eventObj.argObj.renderByThisObj = argObj;
    eventObj.argObj.clbkFunc = function(renderReport){ //ノード変更レポートの追加用コールバック関数
        
        //失敗が発生し場合は、totalReportも失敗とする
        if(!renderReport.allOK){
            totalReport.allOK = false;
        }

        //成功が一つ以上ある場合
        if(!renderReport.allNG){
            totalReport.allNG = false;
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
        totalReport.allNG = true;
    }

    return totalReport;
}

function fireNodeEditConsoleEvent(eventName, attachThisArgObj){
    var eventObj = document.createEvent("Event");
    eventObj.initEvent(eventName, false, false);

    if(typeof attachThisArgObj != 'undefined'){
        eventObj.argObj = attachThisArgObj;
    }

    //すべてのnode要素にイベントを発行する
    var nodes = $3nodes.nodes();
    for(var i = 0 ; i < nodes.length ; i++){
        nodes[i].dispatchEvent(eventObj);
    }
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
    .style("white-space","nowrap")
    .style("overflow","auto")
    .classed("historyElem",true)
    .attr("wrap","off");

function appendHistory(transactionObj){

    var appendedIndex = transactionHistory.length;
    transactionHistory.push(transactionObj); //Append History

    var $3historyMessageElem = $3historyElem.append("div")
        .classed("transaction",true)
        .attr("data-history_index", appendedIndex.toString());

    $3historyMessageElem.append("small")
        .text(transactionObj.message);
        
    
    var $historyMessageElem  = $($3historyMessageElem.node());
    $historyMessageElem.hover(

        function(){ //mouseenter
            var clickedElem = this;
            clickedElem.classList.add(slctd);
            var historyIndex = parseInt($(clickedElem).attr("data-history_index"));
            console.log("history mouseenter" + historyIndex.toString());

        },function(){ //mouseleave
            var clickedElem = this;
            clickedElem.classList.remove(slctd);
            var historyIndex = parseInt($(clickedElem).attr("data-history_index"));
            console.log("history mouseleave" + historyIndex.toString());

        }
    );

    $historyMessageElem.on("click",function(){
        var clickedElem = this;
        var historyIndex = parseInt($(clickedElem).attr("data-history_index"));
        console.log("history click" + historyIndex.toString());
        rollbackHistory(historyIndex);
    });
}

var firstTotalReport = {};
firstTotalReport.allOK = true;
firstTotalReport.reportsArr = [];

//<svg>の作成
var $3svgGroup = $3editableNodesTAG.append("svg")
    .classed("SVGForNodesMapping",true)
    .attr("width", "100%") //<-テスト用の仮数値
    .attr("height", 800) //<-テスト用の仮数値
    .style("vertical-align", "bottom");

var $3nodesGroup = $3svgGroup.append("g") //ノードグループの作成
    .classed("nodes",true);

var $3selectionLayersGroup = $3svgGroup.append("g") //Selection Layer 用グループの作成
    .classed("selectionLayers",true);

// <TBD>--------------------------------------------------------------------------------
// Node 内/外 に対する Click event を無視する方法が不明

//Node選択用Brushの作成
// var isFirstEndOfBrush = true;
// var $3NodeSelectingBrush = d3.brush()
//     .on("end", function(){ //選択終了イベント
//         if(isFirstEndOfBrush){ //Avoid infinite loop
//             isFirstEndOfBrush = false;
//             clearNodeSelectingBrush();
//             isFirstEndOfBrush = true;
//         }
//     })
//     .filter(function(){
//         // Click event(Drag evet でない)場合に無視したい
//         return !event.button;
//     });
    
// var $3NodeSelectingBrushGroup = $3selectionLayersGroup.append("g")
//     .call($3NodeSelectingBrush);

// function clearNodeSelectingBrush(){
//     $3NodeSelectingBrushGroup.call($3NodeSelectingBrush.move, null); //Brush 選択範囲のクリア
// }

// -------------------------------------------------------------------------------</TBD>

// ノード追加
var $3nodes = $3nodesGroup.selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .classed("node", true)
    .each(function(d ,i){

        var bindedSVGElement = this;
        d.$3bindedSVGElement = d3.select(this);

        d.$3bindedSelectionLayerSVGElement = $3selectionLayersGroup.append("g")
            .classed("selectionLayer",true)
            .style("pointer-events", "none")
            .style("visibility", "hidden")
            .attr("data-selected", "false");

        checkToBindData(d); //data書式のチェック
        
        //座標追加
        d.coordinate = {
            x: ($3editableNodesTAG.node().offsetWidth / 2), //<-仮の処理
            y: (60*(i+1)) //<-仮の処理
        };

        var renderReport = renderSVGNode(d,d); //SVGレンダリング
        backToDefaulIfWarn(renderReport, d);
        
        //失敗が発生した場合は、firstTotalReportも失敗とする
        if(!renderReport.allOK){
            firstTotalReport.allOK = false;
        }

        firstTotalReport.reportsArr.push(renderReport);

        //EventListener登録
        bindedSVGElement.addEventListener("NodeEditConsoleEvent_renderSVG",function(eventObj){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //自分のNodeが選択中の場合
        
                //引数チェック
                if(typeof eventObj.argObj == 'undefined'){ //引数なし
                    console.warn("NodeEditConsoleEvent_renderSVG was not specified \`argObj\`.");
                    return;
                }
                if(typeof eventObj.argObj.renderByThisObj != 'object'){ //nodeレンダリング用objが存在しない
                    console.warn("NodeEditConsoleEvent_renderSVG was not specified \`argObj.renderByThisObj\`.");
                    return;
                }
        
                var renderReport = renderTextTypeSVGNode(d, eventObj.argObj.renderByThisObj);
        
                if(typeof eventObj.argObj.clbkFunc == 'function'){ //コールバック関数が存在する
                    eventObj.argObj.clbkFunc(renderReport);
                }
            }
            
        });
    });

//Append History
transactionHistory.push(firstTotalReport);

//<UI TRAP>---------------------------------------------------------------------

// Node以外に対する選択
$($3svgGroup.node()).on(UITrappedEvents.selectSVGNode, function(e){
    if(d3.select(e.target).classed("SVGForNodesMapping")){ // SVG領域に対する選択
                                                           // -> Node以外に対する選択の場合
        
        if(nowEditng){ // 編集中の場合

            fireNodeEditConsoleEvent("NodeEditConsoleEvent_exit", {confirm:true}); //バッファを確定させて<textarea>を終了
            exitEditing(); //編集モードの終了
        
        }else{  // 編集中でない場合
            
            //Nodeすべてを選択解除する
            for(var i = 0 ; i < dataset.length ; i++){
                dataset[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                    .attr("data-selected", "false"); //選択解除
            }
            lastSelectedData = null;
        }
    }
});

//SVGノードの単一選択イベント
$3nodes.on(UITrappedEvents.selectSVGNode, function(d){

    var selectOnlyMe = false;

    if(nowEditng){ // 編集中の場合
        
        if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択中Nodeの場合
            fireNodeEditConsoleEvent("NodeEditConsoleEvent_exit", {confirm:false}); //バッファを残したまま<textarea>を終了
            lastSelectedData = d; //最終選択Nodeの記憶
            editSVGNode(lastSelectedData); //SVGノード(単一)編集機能をキック

        }else{ //選択中Nodeでない場合

            fireNodeEditConsoleEvent("NodeEditConsoleEvent_exit", {confirm:true}); //バッファを確定させて<textarea>を終了
            exitEditing(); //編集モードの終了
            
            selectOnlyMe = true;
        }

    }else{ // 編集中でない場合
        selectOnlyMe = true;
    }

    if(selectOnlyMe){
        if(!(d3.event.ctrlKey)){ //ctrl key 押下でない場合

            //別ノードすべてを選択解除する
            for(var i = 0 ; i < dataset.length ; i++){
                if(dataset[i].key != d.key){ //自分のノードでない場合
                    dataset[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                        .attr("data-selected", "false"); //選択解除
                }
            }
        }

        var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');

        //選択状態を切り替える
        if(isSelected){ //選択状態の場合
            d.$3bindedSelectionLayerSVGElement.style("visibility","hidden") //非表示にする
                .attr("data-selected", "false"); //選択解除
            lastSelectedData = null; //最終選択Nodeをnullにする(すべてのNodeが非選択になる為)

        }else{ //非選択状態の場合
            d.$3bindedSelectionLayerSVGElement.style("visibility",null) //表示状態にする
                .attr("data-selected", "true"); //選択解除
            
            lastSelectedData = d; //最終選択Nodeの記憶
        }
    }

});

// Nodeに対する単一編集イベント
$3nodes.on(UITrappedEvents.editSVGNode, function(d){

    if(nowEditng){ // 編集中の場合
                   // -> 発生し得ないルート
                   //    (直前に呼ばれる単一選択イベントによって、対象Nodeの上に<textarea>が生成される為)

        fireNodeEditConsoleEvent("NodeEditConsoleEvent_exit", {confirm:true}); //バッファを確定させて<textarea>を終了
        exitEditing(); //編集モードの終了
    
    }

    //別ノードすべてを選択解除して、自分のノードのみ選択状態にする
    for(var i = 0 ; i < dataset.length ; i++){
        if(dataset[i].key != d.key){ //自分のノードでない場合
            dataset[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden") //選択解除
                .attr("data-selected", "false"); //選択解除
        
        }else{ //自分のノードの場合
            dataset[i].$3bindedSelectionLayerSVGElement.style("visibility",null) //選択
                .attr("data-selected", "true"); //選択解除
        }
    }
    editSVGNodes();
    lastSelectedData = d; //最終選択Nodeの記憶
    editSVGNode(lastSelectedData); //SVGノード(単一)編集機能をキック
    
});

// Nodeに対する複数編集イベント
Mousetrap.bind(UITrappedEvents.editSVGNodes, function(e){

    if(nowEditng){ // 編集中の場合
        //nothing to do
    
    }else{ // 編集中でない場合
        if(lastSelectedData !== null){ //選択対象Nodeが存在する場合
            editSVGNodes();
            editSVGNode(lastSelectedData); //SVGノード(単一)編集機能をキック
            disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
        }
    }
});

//--------------------------------------------------------------------</UI TRAP>

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
        allNG:true,
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
    
    var inlineStyleOf_SVGnodeElem_text = $3SVGnodeElem_text.node().style;
    var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

    var haveToUpdateFrame = false;
    var vacantStarted = false;
    var vacantEnded = false;

    var untreatedPropertyNames = Object.keys(renderByThisObj.text); //未処理プロパティリスト

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
            bindedData.text.text_content = renderByThisObj.text.text_content;
            haveToUpdateFrame = true;
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_content"), 1); //未処理プロパティリストから削除
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
                bindedData.coordinate.x = renderByThisObj.coordinate.x; //todo <- d3.js に任せられるかどうか
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
                bindedData.coordinate.y = renderByThisObj.coordinate.y; //todo <- d3.js に任せられるかどうか
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

        if(renderByThisObj.text.text_anchor === null){ //削除指定の場合
            $3SVGnodeElem_text.style("text-anchor", null);

            reportObj.PrevObj.text.text_anchor = prevTextAnchor;
            reportObj.RenderedObj.text.text_anchor = null;
            delete bindedData.text.text_anchor;
            haveToUpdateFrame = true;

        }else if(typeof renderByThisObj.text.text_anchor != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`renderByThisObj.text.text_anchor\`. " +
                      "specified type:\`" + (typeof (renderByThisObj.text.text_anchor)) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            reportObj.FailuredMessages.text.text_anchor = wrn;
        
        }else{ //型がstring
            var applyThisTextAnchor = renderByThisObj.text.text_anchor.toLowerCase();
            $3SVGnodeElem_text.style("text-anchor", applyThisTextAnchor);
            
            //適用可否チェック
            if(applyThisTextAnchor != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor").toLowerCase()){ //computed styleに適用されなかった場合
                var wrn = "Specified style in \`renderByThisObj.text.text_anchor\` did not applied. " +
                          "specified style:\`" + renderByThisObj.text.text_anchor + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor") + "\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_anchor = wrn;

                $3SVGnodeElem_text.style("text-anchor", prevTextAnchor); //変更前の状態に戻す

            }else{ //適用された場合
                reportObj.PrevObj.text.text_anchor = prevTextAnchor;
                reportObj.RenderedObj.text.text_anchor = applyThisTextAnchor;
                bindedData.text.text_anchor = applyThisTextAnchor;
                haveToUpdateFrame = true;
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_anchor"), 1); //未処理プロパティリストから削除
    }

    //font-family
    if(typeof renderByThisObj.text.text_font_family != 'undefined'){ //font-family指定有り

        //変更前状態を取得
        var prevFontFamily = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-family");
        if(prevFontFamily == ""){ //未設定の場合
            prevFontFamily = null;
        }

        if(renderByThisObj.text.text_font_family === null){ //削除指定の場合
            $3SVGnodeElem_text.style("font-family", null);
            
            reportObj.PrevObj.text.text_font_family = prevFontFamily;
            reportObj.RenderedObj.text.text_font_family = null;
            delete bindedData.text.text_font_family;
            haveToUpdateFrame = true;

        }else if(typeof renderByThisObj.text.text_font_family != 'string'){ //型がstringでない場合
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
                bindedData.text.text_font_family = applyThisFontFamily;
                haveToUpdateFrame = true;
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_family"), 1); //未処理プロパティリストから削除
    }

    //font-size
    if(typeof renderByThisObj.text.text_font_size != 'undefined'){ //font-size指定有り

        //変更前状態を取得
        var prevFontSize = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
        if(prevFontSize == ""){
            prevFontSize = null;
        }

        if(renderByThisObj.text.text_font_size === null){ //削除指定の場合
            $3SVGnodeElem_text.style("font-size", null);

            if(prevFontSize !== null){
                prevFontSize = parseFloat(prevFontSize);
            }
            reportObj.PrevObj.text.text_font_size = prevFontSize;
            reportObj.RenderedObj.text.text_font_size = null;
            delete bindedData.text.text_font_size;
            haveToUpdateFrame = true;

        }else if(typeof renderByThisObj.text.text_font_size != 'number'){ //型がnumberでない場合
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
                    bindedData.text.text_font_size = renderByThisObj.text.text_font_size;
                    haveToUpdateFrame = true;
                }
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_size"), 1); //未処理プロパティリストから削除
    }

    //font-weight
    if(typeof renderByThisObj.text.text_font_weight != 'undefined'){ //font-weight指定有り

        //変更前状態を取得
        var prevFontWeight = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
        if(prevFontWeight == ""){ //未設定の場合
            prevFontWeight = null;
        }

        if(renderByThisObj.text.text_font_weight === null){ //削除指定の場合
            $3SVGnodeElem_text.style("font-weight", null);

            reportObj.PrevObj.text.text_font_weight = prevFontWeight;
            reportObj.RenderedObj.text.text_font_weight = null;
            delete bindedData.text.text_font_weight;
            haveToUpdateFrame = true;

        }else if(typeof renderByThisObj.text.text_font_weight != 'string'){ //型がstringでない場合
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
                bindedData.text.text_font_weight = renderByThisObj.text.text_font_weight;
                haveToUpdateFrame = true;
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_weight"), 1); //未処理プロパティリストから削除
    }

    //font-style
    if(typeof renderByThisObj.text.text_font_style != 'undefined'){ //font-style指定有り

        //変更前状態を取得
        var prevFontStyle = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-style");
        if(prevFontStyle == ""){ //未設定の場合
            prevFontStyle = null;
        }

        if(renderByThisObj.text.text_font_style === null){ //削除指定の場合
            $3SVGnodeElem_text.style("font-style", null);

            reportObj.PrevObj.text.text_font_style = prevFontStyle;
            reportObj.RenderedObj.text.text_font_style = null;
            delete bindedData.text.text_font_style;
            haveToUpdateFrame = true;

        }else if(typeof renderByThisObj.text.text_font_style != 'string'){ //型がstringでない
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
                bindedData.text.text_font_style = renderByThisObj.text.text_font_style;
                haveToUpdateFrame = true;
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_style"), 1); //未処理プロパティリストから削除
    }

    //text-decoration
    if(typeof renderByThisObj.text.text_text_decoration != 'undefined'){ //text-decoration指定有り

        //変更前状態を取得
        var prevTextDeco = inlineStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");
        if(prevTextDeco == ""){ //未設定の場合
            prevTextDeco = null;
        }

        if(renderByThisObj.text.text_text_decoration === null){ //削除指定の場合
            $3SVGnodeElem_text.style("text-decoration", null);

            reportObj.PrevObj.text.text_text_decoration = prevTextDeco;
            reportObj.RenderedObj.text.text_text_decoration = null;
            delete bindedData.text.text_text_decoration;
            haveToUpdateFrame = true;

        }else if(typeof renderByThisObj.text.text_text_decoration != 'string'){ //型がstringでない
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
                bindedData.text.text_text_decoration = renderByThisObj.text.text_text_decoration;
                haveToUpdateFrame = true;
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_text_decoration"), 1); //未処理プロパティリストから削除
    }

    //テキストの色
    if(typeof renderByThisObj.text.text_fill != 'undefined'){ //text fill指定有り

        //変更前状態を取得
        var prevTextFill = inlineStyleOf_SVGnodeElem_text.getPropertyValue("fill");
        if(prevTextFill == ""){ //未設定の場合
            prevTextFill = null;
        }

        if(renderByThisObj.text.text_fill === null){ //削除指定の場合
            $3SVGnodeElem_text.style("fill", null);

            reportObj.PrevObj.text.text_fill = prevTextFill;
            reportObj.RenderedObj.text.text_fill = null;
            delete bindedData.text.text_fill;
            //haveToUpdateFrame = true; //<- not needed

        }else if(typeof renderByThisObj.text.text_fill != 'string'){ //型がstringでない場合
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
                bindedData.text.text_fill= renderByThisObj.text.text_fill;
                //haveToUpdateFrame = true; //<- not needed
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_fill"), 1); //未処理プロパティリストから削除
    }

    //frame存在チェック
    if(!($3SVGnodeElem_DOTframe.node().firstChild)){ //frameの描画要素が存在しない場合
        $3SVGnodeElem_DOTframe.append("rect");
        bindedData.$3bindedSelectionLayerSVGElement.append("rect"); //SelectionLayerも追加
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

    var $3SVGnodeElem_DOTframe_frame = d3.select($3SVGnodeElem_DOTframe.node().firstChild);

    //枠
    if(haveToUpdateFrame){

        //stroke-width設定の抽出
        var pxNumOfStrokeWidth;
        if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り

            if(renderByThisObj.text.frame_stroke_width === null){ //削除指定の場合
                $3SVGnodeElem_DOTframe_frame.style("stroke-width", null); //`window.getComputedStyle` 出来るようにする為、削除だけ先に行う

            }else if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合

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
            var prevShape = $3SVGnodeElem_DOTframe.node().firstChild.tagName.toLowerCase();  //1回目の描画時は `frame存在チェック`で設定した "rect"になる。
                                                                                             // -> 仕様とする
            
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
                        //古いframeオブジェクト・SelectionLayerを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);
                        bindedData.$3bindedSelectionLayerSVGElement.node().removeChild(bindedData.$3bindedSelectionLayerSVGElement.node().firstChild);

                        //rect描画
                        resizeTextTypeSVGNode_rectFrame($3SVGnodeElem_DOTframe.append("rect"), //Frame
                                                        textRectArea,
                                                        padding,
                                                        pxNumOfStrokeWidth);
                        
                        resizeTextTypeSVGNode_rectFrame(bindedData.$3bindedSelectionLayerSVGElement.append("rect"), // Selection Layer
                                                        textRectArea,
                                                        padding,
                                                        pxNumOfStrokeWidth);
                        
                        reportObj.PrevObj.text.frame_shape = prevShape;
                        reportObj.RenderedObj.text.frame_shape = "rect";
                        bindedData.text.frame_shape = "rect";
                    }
                    break;
    
                    case "circle":
                    {
                        //古いframeオブジェクト・SelectionLayerを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);
                        bindedData.$3bindedSelectionLayerSVGElement.node().removeChild(bindedData.$3bindedSelectionLayerSVGElement.node().firstChild);

                        //circle描画
                        resizeTextTypeSVGNode_circleFrame($3SVGnodeElem_DOTframe.append("circle"), //Frame
                                                          textRectArea,
                                                          padding,
                                                          pxNumOfStrokeWidth);

                        resizeTextTypeSVGNode_circleFrame(bindedData.$3bindedSelectionLayerSVGElement.append("circle"), // Selection Layer
                                                          textRectArea,
                                                          padding,
                                                          pxNumOfStrokeWidth);

                        reportObj.PrevObj.text.frame_shape = prevShape;
                        reportObj.RenderedObj.text.frame_shape = "circle";
                        bindedData.text.frame_shape = "circle";
                    }
                    break;
    
                    case "ellipse":
                    {
                        //古いframeオブジェクト・SelectionLayerを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);
                        bindedData.$3bindedSelectionLayerSVGElement.node().removeChild(bindedData.$3bindedSelectionLayerSVGElement.node().firstChild);

                        //ellipse描画
                        resizeTextTypeSVGNode_ellipseFrame($3SVGnodeElem_DOTframe.append("ellipse"), // Frame
                                                           textRectArea,
                                                           padding,
                                                           pxNumOfStrokeWidth);

                        resizeTextTypeSVGNode_ellipseFrame(bindedData.$3bindedSelectionLayerSVGElement.append("ellipse"), // Selection Layer
                                                           textRectArea,
                                                           padding,
                                                           pxNumOfStrokeWidth);

                        reportObj.PrevObj.text.frame_shape = prevShape;
                        reportObj.RenderedObj.text.frame_shape = "ellipse";
                        bindedData.text.frame_shape = "ellipse";
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

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_shape"), 1); //未処理プロパティリストから削除

        }else{ //frame shape指定無し
            rerender = true;
        }

        if(rerender){
            
            //古いframe要素を再調整
            var SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.node().firstChild;
            var SVGnodeElem_SelectionLayer = bindedData.$3bindedSelectionLayerSVGElement.node().firstChild;
            switch(SVGnodeElem_DOTframe_frame.tagName.toLowerCase()){
                case "rect":
                {
                    //リサイズ Frame and Selection Layer
                    resizeTextTypeSVGNode_rectFrame(d3.select(SVGnodeElem_DOTframe_frame), // Frame
                                                    textRectArea,
                                                    padding,
                                                    pxNumOfStrokeWidth);

                    resizeTextTypeSVGNode_rectFrame(d3.select(SVGnodeElem_SelectionLayer), // Selection Layer
                                                    textRectArea,
                                                    padding,
                                                    pxNumOfStrokeWidth);
                }
                break;

                case "circle":
                {
                    //リサイズ Frame and Selection Layer
                    resizeTextTypeSVGNode_circleFrame(d3.select(SVGnodeElem_DOTframe_frame), // Frame
                                                      textRectArea,
                                                      padding,
                                                      pxNumOfStrokeWidth);

                    resizeTextTypeSVGNode_circleFrame(d3.select(SVGnodeElem_SelectionLayer), // Selection Layer
                                                      textRectArea,
                                                      padding,
                                                      pxNumOfStrokeWidth);
                }
                break;

                case "ellipse":
                {
                    //リサイズ Frame and Selection Layer
                    resizeTextTypeSVGNode_ellipseFrame(d3.select(SVGnodeElem_DOTframe_frame), // Frame
                                                       textRectArea,
                                                       padding,
                                                       pxNumOfStrokeWidth);

                    resizeTextTypeSVGNode_ellipseFrame(d3.select(SVGnodeElem_SelectionLayer), // Selection Layer
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

    $3SVGnodeElem_DOTframe_frame = d3.select($3SVGnodeElem_DOTframe.node().firstChild); //frame の変更で削除されることがあるので、取得し直す。
    var inlineStyleOf_SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe_frame.node().style;
    var computedStyleOf_SVGnodeElem_DOTframe_frame = window.getComputedStyle($3SVGnodeElem_DOTframe_frame.node());

    //枠線の太さ
    if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
        
        //変更前状態を取得
        var prevStrokeWidth = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
        if(prevStrokeWidth == ""){
            prevStrokeWidth = null;
        }

        if(renderByThisObj.text.frame_stroke_width === null){ //削除指定の場合
            
            //$3SVGnodeElem_DOTframe_frame.style("stroke-width", null); // <- not nedded.
                                                                        // `window.getComputedStyle` 出来るようにする為、削除だけ先に行った為

            if(prevStrokeWidth !== null){
                prevStrokeWidth = parseFloat(prevStrokeWidth);
            }
            reportObj.PrevObj.text.frame_stroke_width = prevStrokeWidth;
            reportObj.RenderedObj.text.frame_stroke_width = null;
            delete bindedData.text.frame_stroke_width;

        }else if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合
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
                    bindedData.text.frame_stroke_width = renderByThisObj.text.frame_stroke_width;
                }
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_stroke_width"), 1); //未処理プロパティリストから削除
    }

    //枠線の色
    if(typeof renderByThisObj.text.frame_stroke != 'undefined'){ //frame stroke指定有り

        //変更前状態を取得
        var prevStroke = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke");
        if(prevStroke == ""){
            prevStroke = null;
        }

        if(renderByThisObj.text.frame_stroke === null){ //削除指定の場合
            $3SVGnodeElem_DOTframe_frame.style("stroke", null);

            reportObj.PrevObj.text.frame_stroke = prevStroke;
            reportObj.RenderedObj.text.frame_stroke = null;
            delete bindedData.text.frame_stroke;

        }else if(typeof renderByThisObj.text.frame_stroke != 'string'){ //型がstringでない場合
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
                bindedData.text.frame_stroke = renderByThisObj.text.frame_stroke;
            }

        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_stroke"), 1); //未処理プロパティリストから削除
    }
    
    //枠線の破線パターン
    if(typeof renderByThisObj.text.frame_stroke_dasharray != 'undefined'){ //frame stroke-dasharray指定有り

        //変更前状態を取得
        var prevDashArr = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
        if(prevDashArr == ""){
            prevDashArr = null;
        }

        if(renderByThisObj.text.frame_stroke_dasharray === null){ //削除指定の場合
            $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", null);

            reportObj.PrevObj.text.frame_stroke_dasharray = prevDashArr;
            reportObj.RenderedObj.text.frame_stroke_dasharray = null;
            delete bindedData.text.frame_stroke_dasharray;

        }else if(typeof renderByThisObj.text.frame_stroke_dasharray != 'string'){ //型がstringでない場合
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
                bindedData.text.frame_stroke_dasharray = applyThisStrokeDasharray;
            }

        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_stroke_dasharray"), 1); //未処理プロパティリストから削除
    }
    
    //背景色
    if(typeof renderByThisObj.text.frame_fill != 'undefined'){ //frame fill指定有り

        var prevFramefill = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill");
        if(prevFramefill == ""){
            prevFramefill = null;
        }

        if(renderByThisObj.text.frame_fill === null){ //削除指定の場合
            $3SVGnodeElem_DOTframe_frame.style("fill", null);

            reportObj.PrevObj.text.frame_fill = prevFramefill;
            reportObj.RenderedObj.text.frame_fill = null;
            delete bindedData.text.frame_fill;

        }else if(typeof renderByThisObj.text.frame_fill != 'string'){ //型がstringでない場合
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
                bindedData.text.frame_fill = renderByThisObj.text.frame_fill;
            }
        }

        untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_fill"), 1); //未処理プロパティリストから削除
    }

    //Unkdown Propertyに対する警告
    untreatedPropertyNames.forEach(function(propertyName,idx){
        var wrn = "Unkdown Property \`text." + propertyName + "\` specified.";
        console.warn(wrn);
        reportObj.FailuredMessages.text[propertyName] = wrn;
    });

    //変更レポート用警告チェック
    if(Object.keys(reportObj.FailuredMessages.text).length > 0 ||
       Object.keys(reportObj.FailuredMessages.coordinate).length > 0){ //警告が1つ以上ある場合
        reportObj.allOK = false;
    }
    if(Object.keys(reportObj.RenderedObj.text).length > 0 ||
       Object.keys(reportObj.RenderedObj.coordinate).length > 0){ //成功が1つ以上ある場合
        reportObj.allNG = false;
    }

    //変更レポートを返却
    return reportObj;
}

//
// caution renderringReport.allNG = falseな時だけコールする
//
function overWriteScceededTransaction(fromThisTransaction, toThisTransaction){

    if(toThisTransaction.allNG){ //allNGの場合は、この関数がコールされないので、
                                 //1回目のコールを表す
        toThisTransaction.allNG = false;
        toThisTransaction.allOK = fromThisTransaction.allOK;
    }

    if(!fromThisTransaction.allOK){ //1部NGがある場合
        toThisTransaction.allOK = false;
    }

    if(typeof fromThisTransaction.message != 'undefined'){ //message指定がある場合
        toThisTransaction.message = fromThisTransaction.message; //直近のmessageで更新
    }
    
    //レンダリングレポート網羅ループ
    for(var i_f = 0 ; i_f < fromThisTransaction.reportsArr.length ; i_f++){

        if(!fromThisTransaction.reportsArr[i_f].allNG){ //property全て失敗でなければ
            
            //マージ対象ノード検索ループ
            var i_t = 0;
            
            for( ; i_t < toThisTransaction.reportsArr.length ; i_t++){

                //マージ対象のノードkeyが見つかった場合
                if(toThisTransaction.reportsArr[i_t].key == fromThisTransaction.reportsArr[i_f].key){
                    break;
                }
            }

            if(i_t == toThisTransaction.reportsArr.length){ //マージ対象のノードkeyが見つからなかった場合
                toThisTransaction.reportsArr.push({}); //空のオブジェクトを追加する
                toThisTransaction.reportsArr[i_t].key = fromThisTransaction.reportsArr[i_f].key;

                //allOK
                toThisTransaction.reportsArr[i_t].allOK = fromThisTransaction.reportsArr[i_f].allOK;
                //allNG
                toThisTransaction.reportsArr[i_t].allNG = false;
                //PrevObj
                toThisTransaction.reportsArr[i_t].PrevObj = {};
                mergeObj(fromThisTransaction.reportsArr[i_f].PrevObj, toThisTransaction.reportsArr[i_t].PrevObj,false);
                //RenderedObj
                toThisTransaction.reportsArr[i_t].RenderedObj = {};
                //FailuredMessages
                toThisTransaction.reportsArr[i_t].FailuredMessages = {};

            }else{ //マージ対象のノードkeyが見つかった場合

                //allOK
                if(!fromThisTransaction.reportsArr[i_f].allOK){ //一部失敗がある場合
                    toThisTransaction.reportsArr[i_t].allOK = false;
                }
                
                //allNGは不要
                
                //PrevObj
                mergeObj(fromThisTransaction.reportsArr[i_f].PrevObj, toThisTransaction.reportsArr[i_t].PrevObj,true); //toThisTransactionに存在しない時だけmerge
                
            }
            
            //RenderedObj
            mergeObj(fromThisTransaction.reportsArr[i_f].RenderedObj, toThisTransaction.reportsArr[i_t].RenderedObj,false);
            
            //FailuredMessages
            mergeObj(fromThisTransaction.reportsArr[i_f].FailuredMessages, toThisTransaction.reportsArr[i_t].FailuredMessages,false);
        }
    }
}

//
//オブジェクトをマージする
//
function mergeObj(fromThisObj, toThisObj, ifOnlyNotExists){
    
    var propNames = Object.keys(fromThisObj);

    //プロパティループ
    propNames.forEach(function(propName, idx){

        var isObj = false;

        if(typeof fromThisObj[propName] == 'object'){ //`typeof` 判定が `object` の場合

            if((fromThisObj[propName] === null) || //nullの場合
               (Array.isArray(fromThisObj[propName]))){ //Arrayの場合
                isObj = false;
            }else{
                isObj = true;
            }

        }

        if(isObj){ //オブジェクトの場合
            if(typeof toThisObj[propName] == 'undefined'){ //マージ先に未定義の場合
                toThisObj[propName] = {}; //空オブジェクトを作る
            }

            mergeObj(fromThisObj[propName], toThisObj[propName], ifOnlyNotExists); //再帰処理

        }else{ //オブジェクトでない場合

            if(ifOnlyNotExists){ //マージ先にpropertyが存在しないときだけ上書きする指定の場合
                if(typeof toThisObj[propName] == 'undefined'){ //マージ先に存在しない場合
                    toThisObj[propName] = fromThisObj[propName];
                }

            }else{
                toThisObj[propName] = fromThisObj[propName];
            }
        }
    });
}

function backToDefaulIfWarn(reportObj, bindedData){

    if(typeof reportObj.RenderedObj.type != 'undefined'){
        switch(reportObj.RenderedObj.type){
            case "text":
            {
                backToDefaulIfWarn_TextType(reportObj, bindedData);
            }
            break;

            default:
            break;
        }
    }
}

function backToDefaulIfWarn_TextType(reportObj, bindedData){

    var propertyNames = Object.keys(reportObj.FailuredMessages.text); //Property Names Array to delete

    //text_content
    if(typeof reportObj.FailuredMessages.text.text_content != 'undefined'){
        bindedData.text.text_content = ""; //プロパティ削除ではなく、空文字にする
        propertyNames.splice("text_content",1); //プロパティ削除対象から外す
    }

    //frame_shape
    if(typeof reportObj.FailuredMessages.text.frame_shape != 'undefined'){
        bindedData.text.frame_shape = "rect"; //プロパティ削除ではなく、"rect"にする
        propertyNames.splice("frame_shape",1); //プロパティ削除対象から外す
    }
    
    //Property削除ループ
    propertyNames.forEach(function(propertyName, idx){
        delete bindedData.text[propertyName];
    });
    
}

function rollbackHistory(historyIndex){

    if(transactionHistory.length < 1){ //Historyが存在しない場合
        return;
    }
    
    for(var i = transactionHistory.length - 1 ; i > historyIndex ; i--){
        console.log(i);
    }
}

function rollbackTransaction(transaction){
    
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

function exitEditing(){
    
    //Node選択状態の表示化ループ
    for(var i = 0 ; i < dataset.length ; i++){

        var bindedData = dataset[i];

        if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == "true"){ // 選択対象Nodeの場合
            bindedData.$3bindedSelectionLayerSVGElement.style("visibility",null); //選択状態にする
        }
    }

    $nodeEditConsoleElem.slideUp(100); //edit consoleの終了

    nowEditng = false; //編集モードの終了
}

//
//SVGノード(複数)を編集する
//
function editSVGNodes(){

    var computedStylesOfData = [];

    //Node選択状態の非表示化ループ
    for(var i = 0 ; i < dataset.length ; i++){

        var bindedData = dataset[i];

        if(bindedData.$3bindedSelectionLayerSVGElement.style("visibility").toLowerCase() != "hidden"){ // 選択対象Nodeの場合
            bindedData.$3bindedSelectionLayerSVGElement.style("visibility","hidden"); //非表示にする
            var computedStlOfData = getComputedStyleOfData(bindedData); // Nodeに適用されたスタイルの取得
            if( computedStlOfData !== null){
                computedStylesOfData.push(computedStlOfData);
                
            }
        }
    }

    if(computedStylesOfData.length > 0){ //編集対象Nodeが存在する場合

        var mergedStyles = {};
        mergedStyles.text = {};
        var mergedExplicitnesses = {};
        mergedExplicitnesses.text = {};

        // computedStylesOfData[]からスタイルをマージ
        for(var i = 0 ; i < computedStylesOfData.length ; i++){
            var computedStlOfData =  computedStylesOfData[i];
            switch(computedStlOfData.type){
                case "text":
                {
                    //各Propertyのマージ
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_content");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_anchor");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_font_family");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_font_size");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_fill");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_font_weight");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_font_style");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "text_text_decoration");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "frame_shape");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "frame_stroke");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "frame_stroke_width");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "frame_stroke_dasharray");
                    mergeStyles(computedStlOfData.text, computedStlOfData.explicitness, mergedStyles.text, mergedExplicitnesses.text, "frame_fill");
                    
                }
                break;

                default:
                {
                    //nothing to do
                }
                break;
            }
        }

        //マージしたスタイルをNodeEditConsoleに反映

        //text_content

        //<text.text_anchor>-------------------------------------------------------------------------------------
        var $propertyEditor_text_anchor = $nodeEditConsoleElem.find(".propertyEditor.text_anchor");
        var $propertyEditor_text_anchor_expMsg = $propertyEditor_text_anchor.children(".message.explicitness").eq(0);

        //選択状態の初期化
        var buttons = $propertyEditor_text_anchor.children();
        for(var i = 0 ; i < buttons.length; i++){
            buttons.eq(i).removeClass(slctd); //ボタン選択状態の初期化
        }
        $propertyEditor_text_anchor_expMsg.text("");

        if(typeof mergedStyles.text.text_anchor == 'undefined'){ //描画対象のNodeが存在しない

            //対象プロパティエディタのグレーアウト
            $propertyEditor_text_anchor.prop("disabled", true);
            $propertyEditor_text_anchor_expMsg.text("no nodes");

        }else{  //描画対象のスタイルが存在する

            //対象プロパティエディタの有効化
            $propertyEditor_text_anchor.prop("disabled", false);

            if(mergedStyles.text.text_anchor !== null){// merged Styleが算出できた
                var isKnownType = true;
                switch(mergedStyles.text.text_anchor){
                    case "start":
                    break;
    
                    case "middle":
                    break;
    
                    case "end":
                    break;

                    default:
                    {
                        console.warn("Unknown style \`text-anchor:" + specifiedType + ";\` specified.");
                        isKnownType = false;
                    }
                    break
                }

                if(isKnownType){
                    var selectorStr = '.textAnchorType[data-text_anchor_type="' + mergedStyles.text.text_anchor + '"]';
                    $propertyEditor_text_anchor.children(selectorStr).eq(0).addClass(slctd); //指定text-anchorタイプを選択
                }
            }

            if(mergedExplicitnesses.text.text_anchor === null){ // explicitly defined している Node は一部だけだった
                $propertyEditor_text_anchor_expMsg.text("explicit (some part)");
            }else if(mergedExplicitnesses.text.text_anchor){    // explicitly defined している Node は全部
                $propertyEditor_text_anchor_expMsg.text("explicit");
            }else{                                         // explicitly defined していない
                $propertyEditor_text_anchor_expMsg.text("");
            }

        }

        //------------------------------------------------------------------------------------</text.text_anchor>

        //text_font_family
        //text_font_size

        //<text.text_fill>---------------------------------------------------------------------------------------
        var $propertyEditor_text_fill = $nodeEditConsoleElem.find(".propertyEditor.text_fill");
        var $propertyEditor_text_fill_picker = $propertyEditor_text_fill.children(".picker").eq(0);
        var $propertyEditor_text_fill_inputElem = $propertyEditor_text_fill.children(".pickedColorText").eq(0);
        var $propertyEditor_text_fill_expMsg = $propertyEditor_text_fill.children(".message.explicitness").eq(0);

        //初期化
        $propertyEditor_text_fill_expMsg.text("");

        if(typeof mergedStyles.text.text_fill == 'undefined'){ //描画対象のNodeが存在しない
            
            //対象プロパティエディタのグレーアウト
            $propertyEditor_text_fill_picker.spectrum("disable"); //カラーピッカーを無効化
            $propertyEditor_text_fill_inputElem.prop('disabled', true); //<input>要素を無効化

            $propertyEditor_text_fill_expMsg.text("no nodes");

        }else{  //描画対象のスタイルが存在する

            //対象プロパティエディタの有効化
            $propertyEditor_text_fill_picker.spectrum("enable"); //カラーピッカーを有効化
            $propertyEditor_text_fill_inputElem.prop('disabled', false); //<input>要素を有効化

            if(mergedStyles.text.text_fill !== null){ // merged Styleが算出できた
                $propertyEditor_text_fill_inputElem.val(mergedStyles.text.text_fill);
                $propertyEditor_text_fill_picker.spectrum("set",mergedStyles.text.text_fill);
            }

            if(mergedExplicitnesses.text.text_fill === null){ // explicitly defined している Node は一部だけだった
                $propertyEditor_text_fill_expMsg.text("explicit (some part)");
            }else if(mergedExplicitnesses.text.text_fill){    // explicitly defined している Node は全部
                $propertyEditor_text_fill_expMsg.text("explicit");
            }else{                                       // explicitly defined していない
                $propertyEditor_text_fill_expMsg.text("");
            }
        }

        //--------------------------------------------------------------------------------------</text.text_fill>

        //text_font_weight
        //text_font_style
        //text_text_decoration
        //frame_shape
        //frame_stroke
        //frame_stroke_width
        //frame_stroke_dasharray
        //frame_fill

    
        //NodeEditConsoleを表示
        $nodeEditConsoleElem.slideDown(100);

        nowEditng = true;
    }
}

function mergeStyles(fromThisStlObj, fromThisExpObj, toThisStlObj, toThisExpObj, propertyName){
    mergeProperties(fromThisStlObj, toThisStlObj, propertyName);
    mergeProperties(fromThisExpObj, toThisExpObj, propertyName);
}

function mergeProperties(fromThisObj, toThisObj, propertyName){
    if(typeof toThisObj[propertyName] == 'undefined'){ //マージ先Objectに存在しない場合
        toThisObj[propertyName] = fromThisObj[propertyName];
    }else{
        if(toThisObj[propertyName] !== fromThisObj[propertyName]){ //マージ済みの値と異なる場合
            toThisObj[propertyName] = null;
        }
    }
}

//
//SVGノード(単一)を編集する
//
function editSVGNode(bindedData){

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
        func_renderAndMergeBufTotalReport_For_text_content($3textareaElem.node().value, bindedData); //SVGNodeへの反映&<textarea>調整
    }

    $3SVGnodeElem.node().addEventListener("NodeEditConsoleEvent_adjust",call_adjustTextarea);
    $3SVGnodeElem.node().addEventListener("NodeEditConsoleEvent_exit",remove_exitListener);
    
    function call_adjustTextarea(evetnObj){
        adjustTextarea(bindedData, $3textareaElem);
    }

    function remove_adjustListener(){
        $3SVGnodeElem.node().removeEventListener("NodeEditConsoleEvent_adjust",call_adjustTextarea);
    }

    function remove_exitListener(eventObj){

        if((typeof eventObj.argObj != 'undefined') && (eventObj.argObj.confirm)){
            exitTextEdit(true);
        }else{
            exitTextEdit(false);
        }

        remove_adjustListener();
        $3SVGnodeElem.node().removeEventListener("NodeEditConsoleEvent_exit",remove_exitListener);
    }

    function exitTextEdit(confirm){
        $3SVGnodeElem_text.style("visibility", null); //編集先Nodeの<text>を非表示から元に戻す
        $3textareaElem.remove(); //<textarea>を削除

        if(confirm){
            func_confirmBufTotalReport_For_text_content(); //バッファに積んだtext_content更新Reportを確定させる
        }
    }

    //<textarea>にキャレットをフォーカス
    $3textareaElem.node().focus();

    textareaElem = $3textareaElem.node();

    //UI TRAP
    Mousetrap(textareaElem).bind(UITrappedEvents.insertLFWhenEditingTextTypeSVGNode, function(e){ //<textarea>の改行挿入イベント
        //LFを挿入する
        var txt = textareaElem.value;
        var toSelect = textareaElem.selectionStart + 1;
        var beforeTxt = txt.substr(0, textareaElem.selectionStart);
        var afterTxt = txt.substr(textareaElem.selectionEnd);
        textareaElem.value = beforeTxt + '\n' + afterTxt;
        textareaElem.selectionStart = toSelect;
        textareaElem.selectionEnd = toSelect;

        //SVGNodeへの反映&<textarea>調整
        func_renderAndMergeBufTotalReport_For_text_content(textareaElem.value, bindedData);

        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    Mousetrap(textareaElem).bind(UITrappedEvents.submitEditingTextTypeSVGNode, function(e){ //<textarea>の確定イベント

        remove_exitListener({argObj:{confirm:true}});
        exitEditing(); //編集モードの終了
        
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    //SVGNodeへの反映 & Rendering Reportをバッファに積む
    var func_renderAndMergeBufTotalReport_For_text_content = function renderAndMergeBufTotalReport_For_text_content(text_content, bindedData){
        //SVGNodeへの反映
        var totalReport = fireNodeEditConsoleEvent_renderSVG({text:{text_content:text_content}});
        adjustTextarea(bindedData, $3textareaElem);

        if(!totalReport.allNG){ //1つ以上のNodeで適用成功の場合
            totalReport.message = "text content:" + text_content;
            overWriteScceededTransaction(totalReport, bufTotalReport_For_text_content);
        }
    }

    //バッファに積んだ Rendering Report を 確定させる
    var func_confirmBufTotalReport_For_text_content = function confirmBufTotalReport_For_text_content(){
        if(!bufTotalReport_For_text_content.allNG){ //ログに記録するべきレポートが存在する場合

            appendHistory(bufTotalReport_For_text_content);
            clearbufTotalReport_For_text_content();
        }
    }

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

function getComputedStyleOfData(bindedData){

    //type指定チェック
    if(typeof (bindedData.type) == 'undefined'){
        console.warn("\"type\" property is not specified");
        return; //存在しない場合場合は終了する
    }

    var computedStyleOfData = {};
    computedStyleOfData.explicitness = {}; //dataset[]による明示的な指定かどうか
    computedStyleOfData.key = bindedData.key;

    switch(bindedData.type){
        case "text":
        {
            computedStyleOfData.type = "text";
            computedStyleOfData.text = {};

            getComputedStyleOfTextTypeData(bindedData, computedStyleOfData);
        }
        break;

        default:
        {
            console.warn("unknown data type"); //<-仮の処理
            return;
        }
        break;
    }

    return computedStyleOfData;
}

function getComputedStyleOfTextTypeData(bindedData, computedStyleOfTextTypeData){
    
    var $3SVGnodeElem_text = bindedData.$3bindedSVGElement.select("text");
    var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

    //text_content
    computedStyleOfTextTypeData.text.text_content = bindedData.text.text_content;
    computedStyleOfTextTypeData.explicitness.text_content = true; //常に明示的な指定として扱う

    //text_anchor
    computedStyleOfTextTypeData.text.text_anchor = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor");;
    computedStyleOfTextTypeData.explicitness.text_anchor = (typeof bindedData.text.text_anchor != 'undefined');

    //text_font_family
    computedStyleOfTextTypeData.text.text_font_family = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family").replace(/\"/g, "'"); //スペースを含むフォントの引用符をsingle quoteに統一
    computedStyleOfTextTypeData.explicitness.text_font_family = (typeof bindedData.text.text_font_family != 'undefined');

    //text_font_size
    computedStyleOfTextTypeData.text.text_font_size = parseFloat(computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size"));
    computedStyleOfTextTypeData.explicitness.text_font_size = (typeof bindedData.text.text_font_size != 'undefined');

    //text_fill
    computedStyleOfTextTypeData.text.text_fill = computedStyleOf_SVGnodeElem_text.getPropertyValue("fill");
    computedStyleOfTextTypeData.explicitness.text_fill = (typeof bindedData.text.text_fill != 'undefined');

    //text_font_weight
    computedStyleOfTextTypeData.explicitness.text_font_weight = (typeof bindedData.text.text_font_weight != 'undefined');
    if(computedStyleOfTextTypeData.explicitness.text_font_weight){ //明示的指定がある場合
        computedStyleOfTextTypeData.text.text_font_weight = bindedData.text.text_font_weight; //明示的指定した方に合わせる('normal', '400' 等の違いを吸収する為)
    }else{
        computedStyleOfTextTypeData.text.text_font_weight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
    }

    //text_font_style
    computedStyleOfTextTypeData.text.text_font_style = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style");
    computedStyleOfTextTypeData.explicitness.text_font_style = (typeof bindedData.text.text_font_style != 'undefined');

    //text_text_decoration
    computedStyleOfTextTypeData.text.text_text_decoration = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");
    computedStyleOfTextTypeData.explicitness.text_text_decoration = (typeof bindedData.text.text_text_decoration != 'undefined');

    var SVGnodeElem_DOTframe_frame = bindedData.$3bindedSVGElement.select(".frame").node().firstChild;

    //frame_shape
    computedStyleOfTextTypeData.text.frame_shape = SVGnodeElem_DOTframe_frame.tagName.toLowerCase();
    computedStyleOfTextTypeData.explicitness.frame_shape = true; //常に明示的な指定として扱う

    var computedStyleOf_SVGnodeElem_DOTframe_frame = window.getComputedStyle(SVGnodeElem_DOTframe_frame);

    //frame_stroke
    computedStyleOfTextTypeData.text.frame_stroke = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke");
    computedStyleOfTextTypeData.explicitness.frame_stroke = (typeof bindedData.text.frame_stroke != 'undefined');

    //frame_stroke_width
    computedStyleOfTextTypeData.text.frame_stroke_width = parseFloat(computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width"));
    computedStyleOfTextTypeData.explicitness.frame_stroke_width = (typeof bindedData.text.frame_stroke_width != 'undefined');

    //frame_stroke_dasharray
    var frameStyle_strokeDashArray = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
    //"px"とスペースは無視する
    frameStyle_strokeDashArray = frameStyle_strokeDashArray.replace(/px/g, "");
    frameStyle_strokeDashArray = frameStyle_strokeDashArray.replace(/ /g, "");
    computedStyleOfTextTypeData.text.frame_stroke_dasharray = frameStyle_strokeDashArray;
    computedStyleOfTextTypeData.explicitness.frame_stroke_dasharray = (typeof bindedData.text.frame_stroke_dasharray != 'undefined');

    //frame_fill
    computedStyleOfTextTypeData.text.frame_fill = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill");
    computedStyleOfTextTypeData.explicitness.frame_fill = (typeof bindedData.text.frame_fill != 'undefined');

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
    
    while ( el.parentNode !== null ) {
        
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
