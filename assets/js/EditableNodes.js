var dataset = [
    {
        key: 0, //todo 未指定時のハンドリング
        caption: "untitled node",
        fontFamily: "arial, sans-serif", //google style //caution 書式チェックなし
        fontSize: "16px", //caution 書式チェックなし
        fontColor: "rgb(255, 5, 130)", //caution 書式チェックなし
        backGroundColor: "rgb(120,120,210)" //caution 書式チェックなし
    },
    {
        key: 1,
        caption: "untitled node-2",
        fontFamily: "helvetica, arial, 'hiragino kaku gothic pro', meiryo, 'ms pgothic', sans-serif", //Facebook style //caution 書式チェックなし
        fontSize: "16px", //caution 書式チェックなし
        fontColor: "rgb(251, 255, 14)", //caution 書式チェックなし
        backGroundColor: "rgba(34, 172, 41, 0.74)" //caution 書式チェックなし
    },
    {
        key: 2,
        caption: "untitled node-3",
    }
];

var rounding = 4;
var padding = 5;
var valOfEm = 1.3;
var dummyChar = 'D';

var $3nodes = d3.select("#editableNode")
    .append("svg")
    .attr("width", "100%")
    .attr("height", 600)
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .attr("class", "node")
    .each(function(d){
        d.bindedElement = this;
    });

var $3txtContainer = $3nodes.append("rect")
    .attr("class", "txtContainer")
    .attr("rx",rounding)
    .attr("ry",rounding);

var $3txtCntnt = $3nodes.append("text")
    .attr("class", "caption")
    .attr("x", 25)
    .attr("y", function(d, i){return 100*(i+1);})
    .each(function(d){
        if((typeof (d.caption)) == 'undefined'){ //定義していない場合
            d.caption = "";
        }
        updateNode(d, d);
    });

function updateNode(bindedData, toUpdateObj){

    var childNode = bindedData.bindedElement.childNodes;

    var haveToUpdateTxtCntnr = false;
    var vacantStarted = false;
    var vacantEnded = false;

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

    //todo data(dataset)されたオブジェクトに対する更新

    //テキスト更新
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
        $3captionElem.attr("font-family", toUpdateObj.fontFamily);
        haveToUpdateTxtCntnr = true;
    }
    if((typeof toUpdateObj.fontSize != 'undefined') && (toUpdateObj.fontSize != "")){
        $3captionElem.attr("font-size", toUpdateObj.fontSize);
        haveToUpdateTxtCntnr = true;
    }
    if((typeof toUpdateObj.fontColor != 'undefined') && (toUpdateObj.fontColor != "")){
        $3captionElem.attr("fill", toUpdateObj.fontColor);
        haveToUpdateTxtCntnr = true;
    }

    //背景色
    if((typeof toUpdateObj.backGroundColor != 'undefined') && (toUpdateObj.backGroundColor != "")){
        $3txtContainerElem.attr("fill", toUpdateObj.backGroundColor);
        //haveToUpdateTxtCntnr = true; //<- not needed
    }

    //背景のshape更新
    if(haveToUpdateTxtCntnr){
        var chldNds = $3captionElem.node().childNodes;
        var txtContainerElem = $3captionElem.node();
        if(chldNds.length == 1 && chldNds[0].textContent == ""){ //空文字の場合
            
            //最小サイズのRectを描画
            $3txtContainerElem.attr("x", $3captionElem.attr("x")*1 - padding)
                .attr("y", $3captionElem.attr("y")*1 - padding)
                .attr("width", padding*2)
                .attr("height", padding*2);

        }else{ //caption指定有りの場合
            
            //caption占有サイズに合わせたRectを描画
            $3txtContainerElem.attr("x", txtContainerElem.getBBox().x - padding)
                .attr("y", txtContainerElem.getBBox().y - padding)
                .attr("width", txtContainerElem.getBBox().width + padding * 2)
                .attr("height", txtContainerElem.getBBox().height + padding * 2);

            //最初の行or最後の行が空文字の場合に挿入したダミー文字を削除する
            if(vacantStarted){ //最初の行にダミー文字を入れていた時
                $3captionElem.node().firstChild.textContent = "";
            }
            if(vacantEnded){ //最後の行にダミー文字を入れていた時
                $3captionElem.node().lastChild.textContent = "";
            }
        }
    }
}

$3nodes.on("dblclick",function(d){dblClicked(d);})

function dblClicked(d){

    var childNode = d.bindedElement.childNodes;
    
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
    //$3txtArea.property("value", txtVal);

    //フォントの取得
    var fntFam = $3captionElem.attr("font-family");
    if(!fntFam){ //フォントが指定されていない場合
        fntFam = window.getComputedStyle($3captionElem.node()).fontFamily; //ブラウザが計算したフォントを取得
    }
    //フォントサイズの取得
    var fntSiz = $3captionElem.attr("font-size");
    if(!fntSiz){ //フォントサイズが指定されていない場合
        fntSiz = window.getComputedStyle($3captionElem.node()).fontSize; //ブラウザが計算したサイズを取得
    }
    //文字色の取得
    var col = $3captionElem.attr("fill");
    if(!col){
        col = window.getComputedStyle($3captionElem.node()).color; //ブラウザが計算した文字色を取得
    }
    //background-colorの取得
    var bkgrndcol = $3txtContainerElem.attr("fill");
    if(!bkgrndcol){
        bkgrndcol = window.getComputedStyle($3txtContainerElem.node()).backgroundColor; //ブラウザが計算したbackground-colorを取得
    }

    //編集先Nodeを非表示
    d3.select(d.bindedElement).style("visibility", "hidden");

    //textareaの表示
    var $3txtArea = d3.select("#editableNode").append("textarea")
        .style("position", "absolute")
        .style("left", $3txtContainerElem.attr("x") + "px")
        .style("top", $3txtContainerElem.attr("y") + "px")
        .style("font-family", fntFam)
        .style("font-size", fntSiz)
        .style("line-height", valOfEm + "em")
        .style("color", col)
        .style("background-clip", "padding-box")
        .style("background-color", bkgrndcol)
        .style("border", padding + "px solid " + bkgrndcol)
        .style("border-radius", rounding + "px")
        .classed("mousetrap",true)
        .property("value", txtVal)
        .attr("wrap","off");
        
    $3txtArea.node().focus();

    //textareaのサイズ自動調整
    var txtArea = $3txtArea.node();
    $3txtArea.attr("data-scrollWidthBefore", txtArea.scrollWidth)
        .attr("data-scrollHeightBefore", txtArea.scrollHeight)
        .node().oninput = function(){resizeTxtArea($3txtArea);};

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
            backGroundColor:bkgrndcol
        };

        txtArea.parentNode.removeChild(txtArea); //textareaの削除
        d3.select(d.bindedElement).style("visibility", null); //編集先Nodeを復活

        updateNode(d, toUpdateObj);
        
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

        resizeTxtArea($3txtArea);
        disablingKeyEvent(e);
    });
}

function resizeTxtArea($3txtArea){
    var txtArea = $3txtArea.node();

    //サイズ調整
    if( txtArea.scrollWidth > $3txtArea.attr('data-scrollWidthBefore')){ //width不足の場合
        $3txtArea.style("width", (txtArea.scrollWidth + 15) + "px");
        $3txtArea.attr('data-scrollWidthBefore', txtArea.scrollWidth);
    }

    if( txtArea.scrollHeight > $3txtArea.attr('data-scrollHeightBefore')){ //height不足の場合
        $3txtArea.style("height", (txtArea.scrollHeight + 15) + "px");
        $3txtArea.attr('data-scrollHeightBefore', txtArea.scrollHeight);
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