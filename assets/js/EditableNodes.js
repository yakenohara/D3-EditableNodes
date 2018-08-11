var dataset = [
    {
        key: 0, //todo 未指定時のハンドリング
        caption: "untitled node",
        fontFamily: "helvetica, arial, 'hiragino kaku gothic pro', meiryo, 'ms pgothic', sans-serif", //caution 書式チェックなし
        fontSize: "16px", //caution 書式チェックなし
        fontColor: "rgb(251, 255, 14)", //caution 書式チェックなし
        borderColor: "black", //caution 書式チェックなし
        borderWidth: "10px",  //caution 書式チェックなし
        backGroundColor: "rgba(34, 172, 41, 0.74)" //caution 書式チェックなし
    },
    {
        key: 1,
        caption: "default design",
    },
    {
        key: 2,
        caption: "no border",
        borderWidth: "0px",
        backGroundColor: "rgb(22, 126, 19)"
    },
    {
        key:3
    }
];

var $3editableNodesTAG = d3.select("#editableNode").style("position", "relative");
var rounding = 4;
var padding = 5;
var valOfEm = 1.3;
var dummyChar = 'l'; //小さい幅の文字
var txtAreaMrgn = 15;


var $3nodes = $3editableNodesTAG.append("svg")
    .attr("width", "100%")
    .attr("height", 600)
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .attr("class", "node")
    .each(function(d){
        d.bindedSVGElement = this;
    });

//枠定義
$3nodes.append("rect")
    .attr("class", "txtContainer")
    .attr("rx",rounding)
    .attr("ry",rounding);

//caption定義
$3nodes.append("text")
    .attr("class", "caption")
    .attr("x", 25)
    .attr("y", function(d, i){return 100*(i+1);})
    .style("white-space", "pre");

//selectionLayer定義
$3nodes.append("rect")
    .attr("rx", rounding)
    .attr("ry", rounding)
    .classed("selectionLayer", true)
    .style("visibility", "hidden"); //noneでもいい

//表示調整
$3nodes.each(function(d){
        if((typeof (d.caption)) == 'undefined'){ //定義していない場合
            d.caption = "";
        }
        renderNode(d, d);
    });

function renderNode(bindedData, toUpdateObj){

    var childNode = bindedData.bindedSVGElement.childNodes;

    var haveToUpdateTxtCntnr = false;
    var vacantStarted = false;
    var vacantEnded = false;

    //elsement検索ループ
    var $3captionElem;
    var $3txtContainerElem;
    var $3slctnLyerElem;
    for(var i = 0 ; i < childNode.length ; i++){
        var $3tmp = d3.select(childNode[i]);
        if($3tmp.classed("caption")){ //captionの場合
            $3captionElem = $3tmp;
        }else if($3tmp.classed("txtContainer")){ //枠用rect要素の場合
            $3txtContainerElem = $3tmp;
        }else if($3tmp.classed("selectionLayer")){ //selectionLayerの場合
            $3slctnLyerElem = $3tmp;
        }

        if((typeof $3captionElem != 'undefined') &&
            (typeof $3txtContainerElem != 'undefined') &&
            (typeof $3slctnLyerElem != 'undefined')){
            break;
        }
    }

    //todo data(dataset)されたオブジェクトに対する更新

    //テキスト更新 //todo 複数のスペースが無視される
    if((typeof (toUpdateObj.caption)) != 'undefined'){ //更新文字列が定義されている場合のみ更新する

        //定義済tspan要素の全削除
        while($3captionElem.node().firstChild){
            $3captionElem.node().removeChild($3captionElem.node().firstChild);
        }

        if(toUpdateObj.caption == ""){ //空文字の場合
            $3captionElem.append("tspan").text("");

        }else{ //空文字ではない場合

            var lfSeparatedStrings = toUpdateObj.caption.split(/\n/); //改行コードで分割
            
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
                $3captionElem.append("tspan")
                    .attr("x", $3captionElem.attr("x"))
                    .attr("dy", em)
                    .text(str);
            }
        }

        haveToUpdateTxtCntnr = true;
    }

    //フォント更新
    if((typeof toUpdateObj.fontFamily != 'undefined') && (toUpdateObj.fontFamily != "")){
        $3captionElem.style("font-family", toUpdateObj.fontFamily);
        haveToUpdateTxtCntnr = true;
    }
    if((typeof toUpdateObj.fontSize != 'undefined') && (toUpdateObj.fontSize != "")){
        $3captionElem.style("font-size", toUpdateObj.fontSize);
        haveToUpdateTxtCntnr = true;
    }
    if((typeof toUpdateObj.fontColor != 'undefined') && (toUpdateObj.fontColor != "")){
        $3captionElem.style("fill", toUpdateObj.fontColor);
        //haveToUpdateTxtCntnr = true; //<- not needed
    }

    //枠線の色
    if((typeof toUpdateObj.borderColor != 'undefined') && (toUpdateObj.borderColor != "")){
        $3txtContainerElem.style("stroke", toUpdateObj.borderColor);
        //haveToUpdateTxtCntnr = true; //<- not needed
    }

    //枠線の太さ
    if((typeof toUpdateObj.borderWidth != 'undefined') && (toUpdateObj.borderWidth != "")){
        $3txtContainerElem.style("stroke-width", toUpdateObj.borderWidth);
        haveToUpdateTxtCntnr = true;
    }

    //背景色
    if((typeof toUpdateObj.backGroundColor != 'undefined') && (toUpdateObj.backGroundColor != "")){
        $3txtContainerElem.style("fill", toUpdateObj.backGroundColor);
        //haveToUpdateTxtCntnr = true; //<- not needed
    }

    //Shape更新
    if(haveToUpdateTxtCntnr){

        //背景
        var chldNds = $3captionElem.node().childNodes;
        var captionElem = $3captionElem.node();
        var brdrWdth = parseInt($3txtContainerElem.style("stroke-width") || "0px");
        if(chldNds.length == 1 && chldNds[0].textContent == ""){ //空文字の場合
            
            //最小サイズのRectを描画
            $3txtContainerElem.attr("x", $3captionElem.attr("x")*1 - padding - (brdrWdth/2))
                .attr("y", $3captionElem.attr("y")*1 - padding - (brdrWdth/2))
                .attr("width", padding*2 + brdrWdth)
                .attr("height", padding*2 + brdrWdth);

        }else{ //caption指定有りの場合
            
            //caption占有サイズに合わせたRectを描画
            $3txtContainerElem.attr("x", captionElem.getBBox().x - padding - (brdrWdth/2))
                .attr("y", captionElem.getBBox().y - padding - (brdrWdth/2))
                .attr("width", captionElem.getBBox().width + padding * 2 + brdrWdth)
                .attr("height", captionElem.getBBox().height + padding * 2 + brdrWdth);
            
            //最初の行or最後の行が空文字の場合に挿入したダミー文字を削除する
            if(vacantStarted){ //最初の行にダミー文字を入れていた時
                $3captionElem.node().firstChild.textContent = "";
            }
            if(vacantEnded){ //最後の行にダミー文字を入れていた時
                $3captionElem.node().lastChild.textContent = "";
            }
        }

        //selectionLayer
        $3slctnLyerElem.attr("x", $3txtContainerElem.attr("x"))
            .attr("y", $3txtContainerElem.attr("y"))
            .attr("width", $3txtContainerElem.attr("width"))
            .attr("height", $3txtContainerElem.attr("height"));

        var strkWdth = $3txtContainerElem.style("stroke-width");
        if(strkWdth){ //stroke-widthが定義されている場合    
            $3slctnLyerElem.style("stroke-width", strkWdth)
                .style("stroke", window.getComputedStyle($3slctnLyerElem.node()).getPropertyValue("fill"));
        }
    }
}

$3nodes.on("dblclick",function(d){editNode(d);});
$3nodes.on("click",function(d){toggleSelection(d);});

function editNode(d){

    var childNode = d.bindedSVGElement.childNodes;
    
    //caption検索ループ
    var $3captionElem;
    var $3txtContainerElem;
    for(var i = 0 ; i < childNode.length ; i++){
        var $3tmp = d3.select(childNode[i]);
        if($3tmp.classed("caption")){
            $3captionElem = $3tmp;
        }else if($3tmp.classed("txtContainer")){
            $3txtContainerElem = $3tmp;
        }

        if((typeof $3captionElem != 'undefined') && (typeof $3captionElem != 'undefined')){
            break;
        }
    }

    //captionを取得
    var tspans = $3captionElem.node().childNodes;
    var txtVal = tspans[0].textContent;
    for(var i = 1 ; i < tspans.length ; i++){
        txtVal += ("\n" + tspans[i].textContent);
    }

    if(txtVal == ""){
        renderNode(d,{caption: dummyChar}); //ダミーNodeを作る
        //todo 編集可能キャンセル時に、ダミー文字になってしまう
    }
    
    var cmptdCaptionStyle = window.getComputedStyle($3captionElem.node());

    //フォントの取得
    var fntFam = $3captionElem.style("font-family");
    if(!fntFam){ //フォントが指定されていない場合
        fntFam = cmptdCaptionStyle.getPropertyValue("font-family"); //ブラウザが計算したフォントを取得
    }
    //フォントサイズの取得
    var fntSiz = $3captionElem.style("font-size");
    if(!fntSiz){ //フォントサイズが指定されていない場合
        fntSiz = cmptdCaptionStyle.getPropertyValue("font-size");
    }
    //文字色の取得
    var col = $3captionElem.style("fill");
    if(!col){
        col = cmptdCaptionStyle.getPropertyValue("fill"); //ブラウザが計算した文字色を取得
    }
    
    //strokeWidthの取得
    //todo 
    var strkWdth = parseInt($3txtContainerElem.style("stroke-width") || "0px"); //存在しない場合は0
    
    //background-colorの取得
    var bkgrndcol = $3txtContainerElem.style("fill");
    if(!bkgrndcol){
        bkgrndcol = window.getComputedStyle($3txtContainerElem.node()).getPropertyValue("fill"); //ブラウザが計算したbackground-colorを取得
    }

    //strokeの取得
    var strkCol = ($3txtContainerElem.style("stroke") || bkgrndcol); //存在しない場合は0

    //編集先Nodeのキャプションのみ非表示
    $3captionElem.style("visibility", "hidden");

    //textAreaのtop表示位置
    var halfLeading = (parseFloat(fntSiz) * (valOfEm - 1.0)) / 2;
    var top = parseFloat($3captionElem.attr("y")) - getDistanceOf_textBeforeEdge_baseline(fntSiz, fntFam, $3editableNodesTAG.node()) - halfLeading;

    //textareaの表示
    var $3txtArea = d3.select("#editableNode").append("textarea")
        .style("position", "absolute")
        .style("top", top + "px")
        .style("margin", 0)
        .style("border", 0)
        .style("padding", 0)
        .style("font-family", fntFam)
        .style("font-size", fntSiz)
        .style("line-height", valOfEm + "em")
        .style("color", col)
        .style("resize", "none")
        .style("overflow", "hidden")
        .style("background-color", "rgba(105, 105, 105, 0.5)") //<-only for testing
        .classed("mousetrap",true)
        .property("value", txtVal)
        .attr("wrap","off");
    
    //width, height, x位置の調整
    resizeTxtArea(d, $3txtArea);
        
    $3txtArea.node().focus();

    //textareaのサイズ自動調整
    var txtArea = $3txtArea.node();
    $3txtArea.attr("data-scrollWidthBefore", txtArea.scrollWidth)
        .attr("data-scrollHeightBefore", txtArea.scrollHeight)
        .node().oninput = function(){resizeTxtArea(d, $3txtArea);};

    Mousetrap(txtArea).bind('enter', function(e){

        //todo
        //enter / alt+enter イベントリスナーのunbind

        //todo
        //フォント・フォントサイズ・フォントカラー・background-colorを変えていなければ、
        //オブジェクトに入れない

        var toUpdateObj = {
            caption: txtArea.value,
            fontFamily:fntFam,
            fontSize:fntSiz,
            fontColor:col,
            borderColor:strkCol,
            borderWidth:strkWdth,
            backGroundColor:bkgrndcol
        };

        txtArea.parentNode.removeChild(txtArea); //textareaの削除
        $3captionElem.style("visibility", null); //編集先Nodeのキャプションを復活

        renderNode(d, toUpdateObj);
        
        disablingKeyEvent(e);
    });

    Mousetrap(txtArea).bind('alt+enter', function(e){
        //insert \n
        var txt = txtArea.value;
        var toSelect = txtArea.selectionStart + 1;
        var beforeTxt = txt.substr(0, txtArea.selectionStart);
        var afterTxt = txt.substr(txtArea.selectionEnd);
        txtArea.value = beforeTxt + '\n' + afterTxt;
        txtArea.selectionStart = toSelect;
        txtArea.selectionEnd = toSelect;

        resizeTxtArea(d, $3txtArea);
        disablingKeyEvent(e);
    });
}

function resizeTxtArea(bindedData, $3txtArea){
    var txtArea = $3txtArea.node();

    var renderStr;
    var dummyForBefore = "";
    var dummyForAfter = "";
    var isVacant = false;
    var lfSeparatedStrings = txtArea.value.split(/\n/); //改行コードで分割
    if(txtArea.value == ""){ //空文字の場合
        renderStr = "";
        isVacant = true;

    }else{ //空文字ではない場合

        if(lfSeparatedStrings[0] == ""){ //1行目が空文字の場合
            dummyForBefore = dummyChar;
        }

        if((lfSeparatedStrings.length>1) && (lfSeparatedStrings[lfSeparatedStrings.length - 1] == "")){ //最終行が空文字の場合
            dummyForAfter = dummyChar;
        }

        renderStr = dummyForBefore + txtArea.value + dummyForAfter;
    }

    //ノードをリレンダリング
    renderNode(bindedData, {caption:renderStr});

    var childNode = bindedData.bindedSVGElement.childNodes;
    //elsement検索ループ //todo renderNode()との共通処理化検討
    var $3captionElem;
    var $3txtContainerElem;
    var $3slctnLyerElem;
    for(var i = 0 ; i < childNode.length ; i++){
        var $3tmp = d3.select(childNode[i]);
        if($3tmp.classed("caption")){ //captionの場合
            $3captionElem = $3tmp;
        }else if($3tmp.classed("txtContainer")){ //枠用rect要素の場合
            $3txtContainerElem = $3tmp;
        }else if($3tmp.classed("selectionLayer")){ //selectionLayerの場合
            $3slctnLyerElem = $3tmp;
        }

        if((typeof $3captionElem != 'undefined') &&
            (typeof $3txtContainerElem != 'undefined') &&
            (typeof $3slctnLyerElem != 'undefined')){
            break;
        }
    }

    //サイズ調整
    if(isVacant){ //空文字の場合
        $3txtArea.style("width", (parseFloat($3txtArea.style("font-size")) / 2) + "px");
        $3txtArea.style("height", (parseFloat($3txtArea.style("font-size")) * valOfEm) + "px");

        //x位置調整
        $3txtArea.style("left", (parseFloat($3txtArea.attr("x"))) + "px");

    }else{ //1文字以上存在する場合
        $3txtArea.style("width", $3captionElem.node().getBBox().width + "px");
        $3txtArea.style("height", (lfSeparatedStrings.length * (parseFloat($3txtArea.style("font-size")) * valOfEm)) + "px");
        
        //x位置調整
        $3txtArea.style("left", $3captionElem.node().getBBox().x + "px");
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

function toggleSelection(d){
    
    var childNode = d.bindedSVGElement.childNodes;

    //elsement検索ループ //todo renderNode()との共通処理化検討
    var $3captionElem;
    var $3txtContainerElem;
    var $3slctnLyerElem;
    for(var i = 0 ; i < childNode.length ; i++){
        var $3tmp = d3.select(childNode[i]);
        if($3tmp.classed("caption")){ //captionの場合
            $3captionElem = $3tmp;
        }else if($3tmp.classed("txtContainer")){ //枠用rect要素の場合
            $3txtContainerElem = $3tmp;
        }else if($3tmp.classed("selectionLayer")){ //selectionLayerの場合
            $3slctnLyerElem = $3tmp;
        }

        if((typeof $3captionElem != 'undefined') &&
            (typeof $3txtContainerElem != 'undefined') &&
            (typeof $3slctnLyerElem != 'undefined')){
            break;
        }
    }

    //selectionLayerの表示状態を変更
    var ttt = $3slctnLyerElem.style("visibility");
    if($3slctnLyerElem.style("visibility") == "hidden"){
        $3slctnLyerElem.style("visibility", null); //表示状態にする
    }else{
        $3slctnLyerElem.style("visibility", "hidden"); //"非"表示状態にする
    }
    
}

//
//指定フォントのbaselineからtext-before-edgeまでの高さを求める
//
function getDistanceOf_textBeforeEdge_baseline(fntSiz, fntFam, onlyForCalcElem){
    
    fntSiz = parseFloat(fntSiz); //"px"消去

    var distanceOf_baseline_textAfterEdge = getDistanceOf_baseline_textAfterEdge(fntSiz, fntFam, onlyForCalcElem);

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
function getDistanceOf_baseline_textAfterEdge(fntSiz, fntFam, onlyForCalcElem){

    fntSiz = parseFloat(fntSiz); //"px"消去

    //計算用のdivを作る
    var tmpElem = onlyForCalcElem.appendChild(document.createElement("div"));
    tmpElem.setAttribute("class", "getDistanceOf_baseline_textAfterEdge");
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
