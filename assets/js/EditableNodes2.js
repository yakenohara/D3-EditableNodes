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
            frame_stroke: "black",
            frame_stroke_width: 10,
            frame_fill: "rgba(34, 172, 41, 0.74)"
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
            text_content: "no border",
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
            text_content:"text\nanchor\n\`start\`"
        }
    },
    {
        key:7,
        type:"text",
        text:{
            text_content:"text\nanchor\n\`middle\`",
            text_anchor: "middle"
        }
    },
    {
        key:8,
        type:"text",
        text:{
            text_content:"text\nanchor\n\`end\`",
            text_anchor: "end"
        }
    }
];

var $3editableNodesTAG = d3.select("#editableNode").style("position", "relative");

var padding = 5;
var valOfEm = 1.3;
var dummyChar = 'l'; //小さい幅の文字

//ノードの追加
var $3nodes = $3editableNodesTAG.append("svg")
    .attr("width", "100%") //<-テスト用の仮数値
    .attr("height", 800) //<-テスト用の仮数値
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
            y: (70*(i+1)) //<-仮の処理
        };

        makeSVGNodeStructure(d, d);
    });

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
            var applyThisFontSize = renderByThisObj.text.text_font_size + "px"
            $3SVGnodeElem_text.style("font-size", applyThisFontSize);

            //適用可否チェック
            var appliedFontSize = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);

            if(!(pixcelNumberRegex.test(appliedFontSize))){ // `0.0px`形式に設定できていない場合
                                                            // 指数表記になるような極端な数値も、このルートに入る

                console.warn("Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                             "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.");

            }else{
                if( Math.abs(parseFloat(appliedFontSize) - applyThisFontSize) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                    console.warn("Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                                 "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.");
                
                }else{ //適用された場合
                    haveToUpdateFrame = true;
                }
            }
        }
    }

    //テキストの色
    // if((typeof renderByThisObj.text.fontColor != 'undefined') && (renderByThisObj.text.fontColor != "")){
    //     $3SVGnodeElem_text.style("fill", renderByThisObj.text.fontColor);
    //     //haveToUpdateFrame = true; //<- not needed
    // }
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
            var appliedStrokeWidth = d3.select($3SVGnodeElem_DOTframe.node().firstChild).style("stroke-width");
            
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
        var halfOf_pxNumOfStrokeWidth = pxNumOfStrokeWidth / 2;

        var SVGnodeElem_text = $3SVGnodeElem_text.node();
        var SVGnodeElem_text_tspans = SVGnodeElem_text.childNodes;

        var xOf_textRectArea;
        var yOf_textRectArea;
        var widthOf_textRectArea;
        var heightOf_textRectArea;

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
            if(typeof renderByThisObj.text.frame_shape != 'string'){ //型が
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
            SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.node().firstChild;
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
                    resizeTextTypeSVGNode_ellipseFrame(d3.select(SVGnodeElem_DOTframe_frame),
                                                       textRectArea,
                                                       padding,
                                                       pxNumOfStrokeWidth);
                }
                break;

                default:
                {
                    console.warn("Unknown shape \`" + SVGnodeElem_DOTframe_frame.tagName.toLowerCase() + "\` found in \`" + (getDomPath($3SVGnodeElem_DOTframe.node())).join('/') + "\`. ");
                    rerender = true;
                }
                break;
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

    //stroke-widthのstyleはここで設定

    //枠線の色
    // if((typeof renderByThisObj.text.borderColor != 'undefined') && (renderByThisObj.text.borderColor != "")){
    //     $3txtContainerElem.style("stroke", renderByThisObj.text.borderColor);
    //     //haveToUpdateFrame = true; //<- not needed
    // }
    

    // //枠線の太さ
    // if((typeof renderByThisObj.text.borderWidth != 'undefined') && (renderByThisObj.text.borderWidth != "")){
    //     $3txtContainerElem.style("stroke-width", renderByThisObj.text.borderWidth);
    //     haveToUpdateFrame = true;
    // }

    // //背景色
    // if((typeof renderByThisObj.text.backGroundColor != 'undefined') && (renderByThisObj.text.backGroundColor != "")){
    //     $3txtContainerElem.style("fill", renderByThisObj.text.backGroundColor);
    //     //haveToUpdateFrame = true; //<- not needed
    // }
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
    var rx = Math.sqrt(Math.pow((textRectArea.width / 2), 2) + (Math.pow(textRectArea.width, 2) / Math.pow(textRectArea.height, 2)) * (Math.pow((textRectArea.height / 2), 2)));
    var ry = (textRectArea.height / textRectArea.width) * rx;

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
//DOM要素のパスを取得する(デバッグ用)
//
function getDomPath(el) {
    var stack = [];
    while ( el.parentNode != null ) {
    //   console.log(el.nodeName);
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