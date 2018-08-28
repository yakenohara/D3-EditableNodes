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
    var $pickerElem = $nodeEditConsoleElem.find(".propertyEditor.textAnchor").children(".textAnchorType").on("click",function(){
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
        showInitial: true,
        preferredFormat: "rgb",
    });

    // Alternatively, they can be added as an event listener:
    $pickerElem.on('move.spectrum', function(e, tinycolor) {
        $inputElem.val(tinycolor);
        console.log("moved. value:" + tinycolor);
        fireNodeEditConsoleEvent({text:{fill: tinycolor.toRgbString()}});
    });

    $inputElem.get(0).oninput = function(){
        console.log("manually inputted. value:" + clickedElem.value);
        $pickerElem.spectrum("set", clickedElem.value);
    }
    //--------------------------------------------------------------</text_fill>

    //---------------------------------------------------------------------------------------------------------</register behavor>
});

function fireNodeEditConsoleEvent(argObj){
    
    console.warn("todo ie以外のテスト");

    var eventObj = document.createEvent("Event");
    eventObj.initEvent("NodeEditConsoleEvent", false, false);
    eventObj.argumentObject  = argObj;

    //すべてのnode要素にイベントを発行する
    var nodes = $3nodes.nodes();
    for(var i = 0 ; i < nodes.length ; i++){
        nodes[i].dispatchEvent(eventObj);
    }

    appendHistory();
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

function appendHistory(){
    $3historyElem.append("div")
        .append("p")
        // .style("white-space","nowrap")
        .text("changed changed changed  changed changed changed");
}

//ノードの追加
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

        //typeオブジェクト存在チェック
        if(typeof (d.type) == 'undefined'){ //typeオブジェクトが存在しない場合
            d.type = "text"; //text typeにする
        }

        //座標追加
        d.coordinate = {
            x: ($3editableNodesTAG.node().offsetWidth / 2), //<-仮の処理
            y: (60*(i+1)) //<-仮の処理
        };

        makeSVGNodeStructure(d, d);
    });

//UI TRAP
$3nodes.on(UITrappedEvents.editSVGNode, function(d){editSVGNode(d);});

function makeSVGNodeStructure(bindedData, makeByThisObj){

    var $3SVGnodeElem = bindedData.$3bindedSVGElement;
    
    //不足オブジェクトのチェック&追加
    switch(makeByThisObj.type){
        
        case "text":
        {
            //SVGElement構造の定義
            $3SVGnodeElem.append("g").classed("frame", true); //枠定義
            
            $3SVGnodeElem.append("text"). //<text>定義
                classed("textContent", true)
                .style("white-space", "pre");

            $3SVGnodeElem.append("g").classed("selectionLayer", true); //selectionLayer定義
            
            //"text" type 固有の不足オブジェクトのチェック&追加
            if(typeof (makeByThisObj.text) == 'undefined'){
                makeByThisObj.text = {}; //空のオブジェクトを作る
            }
            if(typeof (makeByThisObj.text.text_content) == 'undefined'){
                makeByThisObj.text.text_content = ""; //空文字を定義
            }
            if(typeof (makeByThisObj.text.frame_shape) == 'undefined'){
                makeByThisObj.text.frame_shape = "rect" //矩形
            }

        }
        break;

        default:
        {
            console.warn("unknown data type"); //<-仮の処理
            return;
        }
        break;
    }

    //レンダリング
    renderSVGNode(bindedData, makeByThisObj);
}

function renderSVGNode(bindedData, renderByThisObj){

    var $3SVGnodeElem = bindedData.$3bindedSVGElement;

    //type指定チェック
    if(typeof (renderByThisObj.type) == 'undefined'){
        console.warn("\"type\" property is not specified");
        return; //存在しない場合場合は終了する
    }

    switch(renderByThisObj.type){
        case "text":
        {
            renderTextTypeSVGNode(bindedData, renderByThisObj);
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

function renderTextTypeSVGNode(bindedData, renderByThisObj){

    //text property存在チェック
    if(typeof (renderByThisObj.text) == 'undefined'){
        console.warn("\"text\" property is not specified");
        return; //存在しない場合は終了する
    }

    var $3SVGnodeElem = bindedData.$3bindedSVGElement;

    var $3SVGnodeElem_DOTframe = $3SVGnodeElem.select(".frame");
    var $3SVGnodeElem_text = $3SVGnodeElem.select("text");
    var $3SVGnodeElem_DOTselectionLayer = $3SVGnodeElem.select(".selectionLayer");

    var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

    var haveToUpdateFrame = false;
    var vacantStarted = false;
    var vacantEnded = false;

    //テキスト更新
    if(typeof (renderByThisObj.text.text_content) != 'undefined'){ //textオブジェクトがある場合

        if(typeof (renderByThisObj.text.text_content) != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.text_content\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_content)) + "\`, expected type:\`string\`.");

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

            haveToUpdateFrame = true;
        }
    }

    //テキスト座標更新
    if(typeof (renderByThisObj.coordinate) != 'undefined'){
        if(typeof (renderByThisObj.coordinate.x) != 'undefined'){ //x座標指定オブジェクトがあり

            if(typeof (renderByThisObj.coordinate.x) != 'number'){ //型がnumberでない場合
                console.warn("Wrong type specified in \`renderByThisObj.coordinate.x\`. " +
                             "specified type:\`" + (typeof (renderByThisObj.coordinate.x)) + "\`, expected type:\`number\`.");
            
            }else{ //型がnumber
                $3SVGnodeElem_text.attr("x", renderByThisObj.coordinate.x);

                //<tspan>要素に対するx座標指定
                $3SVGnodeElem_text.selectAll("tspan")
                    .attr("x", renderByThisObj.coordinate.x);
                
                haveToUpdateFrame = true;
            }
        }

        if(typeof (renderByThisObj.coordinate.y) != 'undefined'){ //y座標指定があり

            if(typeof (renderByThisObj.coordinate.y) != 'number'){ //型がnumberでない場合
                console.warn("Wrong type specified in \`renderByThisObj.coordinate.y\`. " +
                             "specified type:\`" + (typeof (renderByThisObj.coordinate.y)) + "\`, expected type:\`number\`.");

            }else{ //型がnumber
                $3SVGnodeElem_text.attr("y", renderByThisObj.coordinate.y);
                haveToUpdateFrame = true;
            }
        }
    }

    //テキストの右寄せ・中央寄せ・左寄せ
    if(typeof renderByThisObj.text.text_anchor != 'undefined'){ //text-anchor指定有り
        if(typeof renderByThisObj.text.text_anchor != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.text_anchor\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_anchor)) + "\`, expected type:\`string\`.");
        
        }else{ //型がstring
            $3SVGnodeElem_text.style("text-anchor", renderByThisObj.text.text_anchor);
            
            //適用可否チェック
            if(renderByThisObj.text.text_anchor != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor")){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.text_anchor\` did not applied. " +
                             "specified style:\`" + renderByThisObj.text.text_anchor + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor") + "\`.");
            
            }else{ //適用された場合
                haveToUpdateFrame = true;
            }
        }
    }

    //font-family
    if(typeof renderByThisObj.text.text_font_family != 'undefined'){ //font-family指定有り
        if(typeof renderByThisObj.text.text_font_family != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.text_font_family\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_font_family)) + "\`, expected type:\`string\`.");

        }else{ //型がstring
            var applyThisFontFamily = (renderByThisObj.text.text_font_family).replace(/\"/g, "'"); //スペースを含むフォントの引用符をsingle quoteに統一
            $3SVGnodeElem_text.style("font-family", applyThisFontFamily);
            
            //適用可否チェック
            var appliedFontFamily = (computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family")).replace(/\"/g, "'");
            if(applyThisFontFamily != appliedFontFamily){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.text_font_family\` did not applied. " +
                             "specified style:\`" + applyThisFontFamily + "\`, browser applied style:\`" + appliedFontFamily + "\`.");
            
            }else{ //適用された場合
                haveToUpdateFrame = true;
            }
        }
    }

    //font-size
    if(typeof renderByThisObj.text.text_font_size != 'undefined'){ //font-size指定有り
        if(typeof renderByThisObj.text.text_font_size != 'number'){ //型がnumberでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.text_font_size\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_font_size)) + "\`, expected type:\`number\`.");
        
        }else{ //型がnumber
            var applyThisFontSize = renderByThisObj.text.text_font_size + "px";
            $3SVGnodeElem_text.style("font-size", applyThisFontSize);

            //適用可否チェック
            var appliedFontSize = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);

            if(!(pixcelNumberRegex.test(appliedFontSize))){ // `0.0px`形式に設定できていない場合
                                                            // 指数表記になるような極端な数値も、このルートに入る

                console.warn("Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                             "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.");

            }else{
                if( Math.abs(parseFloat(appliedFontSize) - renderByThisObj.text.text_font_size) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                    console.warn("Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                                 "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.");
                
                }else{ //適用された場合
                    haveToUpdateFrame = true;
                }
            }
        }
    }

    //font-weight
    if(typeof renderByThisObj.text.text_font_weight != 'undefined'){ //font-weight指定有り
        if(typeof renderByThisObj.text.text_font_weight != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.text_font_weight\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_font_weight)) + "\`, expected type:\`string\`.");
        
        }else{ //型はstring
            var applyThisFontWeight = renderByThisObj.text.text_font_weight;
            if(applyThisFontWeight == "bold"){
                applyThisFontWeight = "700";

            }else if(applyThisFontWeight == "normal"){
                applyThisFontWeight = "400";
            }

            //font-weightの適用
            $3SVGnodeElem_text.style("font-weight", renderByThisObj.text.text_font_weight);

            var appliedFontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
            if(appliedFontWeight == "bold"){
                appliedFontWeight = "700";

            }else if(appliedFontWeight == "normal"){
                appliedFontWeight = "400";
            }

            //適用可否チェック
            if(applyThisFontWeight != appliedFontWeight){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.text_font_weight\` did not applied. " +
                             "specified style:\`" + applyThisFontWeight + "\`, browser applied style:\`" + appliedFontWeight + "\`.");
            
            }else{ //適用された場合
                haveToUpdateFrame = true;
            }
        }
    }

    //font-style
    if(typeof renderByThisObj.text.text_font_style != 'undefined'){ //font-style指定有り
        if(typeof renderByThisObj.text.text_font_style != 'string'){ //型がstringでない
            console.warn("Wrong type specified in \`renderByThisObj.text.text_font_style\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_font_style)) + "\`, expected type:\`string\`.");
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("font-style", renderByThisObj.text.text_font_style);

            //適用可否チェック
            if(renderByThisObj.text.text_font_style != computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style")){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.text_font_style\` did not applied. " +
                             "specified style:\`" + renderByThisObj.text.text_font_style + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style") + "\`.");
            
            }else{ //適用された場合
                haveToUpdateFrame = true;
            }
        }
    }

    //text-decoration
    if(typeof renderByThisObj.text.text_text_decoration != 'undefined'){ //text-decoration指定有り
        if(typeof renderByThisObj.text.text_text_decoration != 'string'){ //型がstringでない
            console.warn("Wrong type specified in \`renderByThisObj.text.text_text_decoration\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_text_decoration)) + "\`, expected type:\`string\`.");
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("text-decoration", renderByThisObj.text.text_text_decoration);

            //適用可否チェック
            if(renderByThisObj.text.text_text_decoration != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration")){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.text_text_decoration\` did not applied. " +
                             "specified style:\`" + renderByThisObj.text.text_text_decoration + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration") + "\`.");
            
            }else{ //適用された場合
                haveToUpdateFrame = true;
            }
        }
    }

    //テキストの色
    if(typeof renderByThisObj.text.text_fill != 'undefined'){ //text fill指定有り
        if(typeof renderByThisObj.text.text_fill != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.text_fill\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.text_fill)) + "\`, expected type:\`string\`.");
        
        }else{ //型はstring
            $3SVGnodeElem_text.style("fill", renderByThisObj.text.text_fill);

            //適用可否チェック
            if(renderByThisObj.text.text_fill != computedStyleOf_SVGnodeElem_text.getPropertyValue("fill")){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.text_fill\` did not applied. " +
                             "specified style:\`" + renderByThisObj.text.text_fill + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("fill") + "\`.");
            
            }else{ //適用された場合
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
                console.warn("Wrong type specified in \`renderByThisObj.text.frame_stroke_width\`. " +
                             "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_width)) + "\`, expected type:\`number\`.");

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
            if(typeof renderByThisObj.text.frame_shape != 'string'){ //型がstringでない
                console.warn("Wrong type specified in \`renderByThisObj.text.frame_shape\`. " +
                             "specified type:\`" + (typeof (renderByThisObj.text.frame_shape)) + "\`, expected type:\`string\`.");
                rerender = true;
            
            }else{ //型はstring
                switch(renderByThisObj.text.frame_shape){
                    
                    case "rect":
                    {
                        //古いframeオブジェクトを削除
                        $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);

                        //rect描画
                        resizeTextTypeSVGNode_rectFrame($3SVGnodeElem_DOTframe.append("rect"),
                                                        textRectArea,
                                                        padding,
                                                        pxNumOfStrokeWidth);

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
                    }
                    break;
    
                    default:
                    {
                        console.warn("Unknown shape \`" + renderByThisObj.text.frame_shape + "\` specified in \`renderByThisObj.text.frame_shape\`. ");
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
    var computedStyleOf_SVGnodeElem_DOTframe_frame = window.getComputedStyle($3SVGnodeElem_DOTframe_frame.node());

    //枠線の太さ
    if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
        if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合
            
            //↓型がnumberかどうかのチェックはframe描画処理内でチェック済み↓
            // console.warn("Wrong type specified in \`renderByThisObj.text.frame_stroke_width\`. " +
            //              "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_width)) + "\`, expected type:\`number\`.");

        }else{ //型はnumber
            var applyThisStrokeWidth = renderByThisObj.text.frame_stroke_width + "px";
            $3SVGnodeElem_DOTframe_frame.style("stroke-width", applyThisStrokeWidth);

            //適用可否チェック
            var appliedStrokeWidth = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);

            if(!(pixcelNumberRegex.test(appliedStrokeWidth))){ // `0.0px`形式に設定できていない場合
                                                               // 指数表記になるような極端な数値も、このルートに入る
                
                console.warn("Specified style in \`renderByThisObj.text.frame_stroke_width\` did not applied. " +
                             "specified style:\`" + applyThisStrokeWidth + "\`, browser applied style:\`" + appliedStrokeWidth + "\`.");
            
            }else{
                if( Math.abs(parseFloat(appliedStrokeWidth) - renderByThisObj.text.frame_stroke_width) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                    console.warn("Specified style in \`renderByThisObj.text.frame_stroke_width\` did not applied. " +
                                 "specified style:\`" + applyThisStrokeWidth + "\`, browser applied style:\`" + appliedStrokeWidth + "\`.");
                }
            }
        }
    }

    //枠線の色
    if(typeof renderByThisObj.text.frame_stroke != 'undefined'){ //frame stroke-width指定有り
        if(typeof renderByThisObj.text.frame_stroke != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.frame_stroke\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke)) + "\`, expected type:\`string\`.");
        
        }else{ //型はstring
            $3SVGnodeElem_DOTframe_frame.style("stroke", renderByThisObj.text.frame_stroke);

            //適用可否チェック
            if(renderByThisObj.text.frame_stroke != computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke")){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.frame_stroke\` did not applied. " +
                             "specified style:\`" + renderByThisObj.text.frame_stroke + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke") + "\`.");
            }

        }
    }
    
    //枠線の波線形状
    if(typeof renderByThisObj.text.frame_stroke_dasharray != 'undefined'){ //frame stroke-dasharray指定有り
        if(typeof renderByThisObj.text.frame_stroke_dasharray != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.frame_stroke_dasharray\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_dasharray)) + "\`, expected type:\`string\`.");
        
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
                console.warn("Specified style in \`renderByThisObj.text.frame_stroke_dasharray\` did not applied. " +
                             "specified style:\`" + applyThisStrokeDasharray + "\`, browser applied style:\`" + appliedStrokeDasharray + "\`.");
            }

        }
    }
    
    //背景色
    if(typeof renderByThisObj.text.frame_fill != 'undefined'){ //frame fill指定有り
        if(typeof renderByThisObj.text.frame_fill != 'string'){ //型がstringでない場合
            console.warn("Wrong type specified in \`renderByThisObj.text.frame_fill\`. " +
                         "specified type:\`" + (typeof (renderByThisObj.text.frame_fill)) + "\`, expected type:\`string\`.");
        
        }else{ //型はstring
            $3SVGnodeElem_DOTframe_frame.style("fill", renderByThisObj.text.frame_fill);

            //適用可否チェック
            if(renderByThisObj.text.frame_fill != computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill")){ //computed styleに適用されなかった場合
                console.warn("Specified style in \`renderByThisObj.text.frame_fill\` did not applied. " +
                             "specified style:\`" + renderByThisObj.text.frame_fill + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill") + "\`.");
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
    var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

    //textを取得
    var SVGnodeElem_text_tspans = $3SVGnodeElem_text.node().childNodes;
    var textareaValue = SVGnodeElem_text_tspans[0].textContent;
    for(var i = 1 ; i < SVGnodeElem_text_tspans.length ; i++){
        textareaValue += ("\n" + SVGnodeElem_text_tspans[i].textContent);
    }

    //text-alignを取得
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
            console.warn("Unkown style \`text-anchor:" + textareaStyle_textAlign + ";\` applied in \`" + getDomPath($3SVGnodeElem_text.node()) + "\`");
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

    //font-weightの取得
    var textareaStyle_fontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");

    //font-styleの取得
    var textareaStyle_fontStyle = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style");

    //text-decorationの取得
    var textareaStyle_textDecoration = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");

    //文字色の取得
    var textareaStyle_color = computedStyleOf_SVGnodeElem_text.getPropertyValue("fill");

    //<textarea>表示の為のtop位置を算出
    var halfLeading = (parseFloat(textareaStyle_fontSize) * (valOfEm - 1.0)) / 2;
    var textareaStyle_top = parseFloat($3SVGnodeElem_text.attr("y")) - getPxDistanceOf_textBeforeEdge_baseline(textareaStyle_fontSize, textareaStyle_fontFamily, $3editableNodesTAG.node()) - halfLeading;
    textareaStyle_top += "px";

    //編集先Nodeの<text>を非表示にする
    $3SVGnodeElem_text.style("visibility", "hidden");

    //<textarea>の表示
    var $3textareaElem = $3editableNodesTAG.append("textarea")
        .style("position", "absolute")
        .style("top", textareaStyle_top)
        .style("margin", 0)
        .style("border", 0)
        .style("padding", 0)
        .style("text-align", textareaStyle_textAlign)
        .style("font-family", textareaStyle_fontFamily)
        .style("font-size", textareaStyle_fontSize)
        .style("font-weight",textareaStyle_fontWeight)
        .style("font-style",textareaStyle_fontStyle)
        .style("text-decoration",textareaStyle_textDecoration)
        .style("line-height", valOfEm + "em")
        .style("color", textareaStyle_color)
        .style("resize", "none")
        .style("overflow", "hidden")
        .style("background-color", "rgba(105, 105, 105, 0)")
        .classed("mousetrap",true)
        .property("value", textareaValue)
        .attr("wrap","off");

    //width, height, left位置の調整
    resizeTextarea(bindedData, $3textareaElem);

    //<textarea>のサイズ自動調整リスナ登録
    $3textareaElem.node().oninput = function(){resizeTextarea(bindedData, $3textareaElem);}

    //NodeEditConsoleからイベント受け取るリスナ登録
    $3SVGnodeElem.node().addEventListener("NodeEditConsoleEvent",function(eventObj){
        
        if(typeof eventObj.argumentObject == 'undefined'){
            console.warn("NodeEditConsoleEvent was not specified \`argumentObject\`.")
            return;
        }
        console.log(eventObj.argumentObject);
        
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

        //<textarea>のリサイズ
        resizeTextarea(bindedData, $3textareaElem);

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

function resizeTextarea(bindedData, $3textareaElem){
    var textareaElem = $3textareaElem.node();
    
    var renderStr;
    var dummyForBefore = "";
    var dummyForAfter = "";
    var isVacant = false;
    
    var lfSeparatedStrings = textareaElem.value.split(/\n/); //改行コードで分割
    if(textareaElem.value == ""){ //空文字の場合
        renderStr = "";
        isVacant = true;

    }else{ //空文字ではない場合

        if(lfSeparatedStrings[0] == ""){ //1行目が空文字の場合
            dummyForBefore = dummyChar;
        }

        if((lfSeparatedStrings.length>1) && (lfSeparatedStrings[lfSeparatedStrings.length - 1] == "")){ //最終行が空文字の場合
            dummyForAfter = dummyChar;
        }

        renderStr = dummyForBefore + textareaElem.value + dummyForAfter;
    }

    //ノードをリレンダリング
    renderTextTypeSVGNode(bindedData, {text:{text_content:renderStr}});

    var $3SVGnodeElem_text = bindedData.$3bindedSVGElement.select("text");
    var marginWidthForCaret = parseFloat($3textareaElem.style("font-size")) / 2;
    
    //Width・Height調整
    if(isVacant){ //空文字の場合
        $3textareaElem.style("width", marginWidthForCaret + "px");
        $3textareaElem.style("height", (parseFloat($3textareaElem.style("font-size")) * valOfEm) + "px");

    
    }else{ //1文字以上存在する場合
        $3textareaElem.style("width", ($3SVGnodeElem_text.node().getBBox().width + marginWidthForCaret) + "px");
        $3textareaElem.style("height", (lfSeparatedStrings.length * (parseFloat($3textareaElem.style("font-size")) * valOfEm)) + "px");
        
    }

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
