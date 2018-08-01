//load css
var link = document.createElement('link');
link.href = 'style.css';
link.rel = 'stylesheet';
link.type = 'text/css';
document.getElementsByTagName('head')[0].appendChild(link);

var dataset = [
    {
        key: 0, //todo 未指定時のハンドリング
        caption: "untitled yg あいうa", //todo 必須指定によるエラーハンドリング
        fontFamily: "helvetica, arial, 'hiragino kaku gothic pro', meiryo, 'ms pgothic', sans-serif", //caution 書式チェックなし
        fontSize: "16px", //caution 書式チェックなし
        fontColor: "rgb(255, 5, 130)", //caution 書式チェックなし
        backGroundColor: "rgb(120,120,210)" //caution 書式チェックなし
    },
    {
        key: 1,
        caption: "untitled node 2",
        fontFamily: "helvetica, arial, 'hiragino kaku gothic pro', meiryo, 'ms pgothic', sans-serif", //caution 書式チェックなし
        fontSize: "16px", //caution 書式チェックなし
        fontColor: "rgb(251, 255, 14)", //caution 書式チェックなし
        backGroundColor: "rgba(34, 172, 41, 0.74)" //caution 書式チェックなし
    }
];

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

var rounding = 4;
var padding = 5;

var $3txtContainer = $3nodes.append("rect")
    .attr("class", "txtContainer")
    .attr("rx",rounding)
    .attr("ry",rounding);

var $3txtCntnt = $3nodes.append("text")
    .attr("class", "caption")
    .attr("x", 25)
    .attr("y", function(d, i){return 100*(i+1);})
    .text(function(d){return d.caption;})
    .each(function(d){
        //指定されている場合だけ指定する
        if(d.fontFamily){
            this.setAttribute("font-family", d.fontFamily);
        }
        if(d.fontSize){
            this.setAttribute("font-size", d.fontSize);
        }
        if(d.fontColor){
            this.setAttribute("fill", d.fontColor);
        }

        //txtContainerを探して サイズ & 位置調整
        var prevElem = this.previousSibling;
        while(prevElem != null){
            var $3txtFinder = d3.select(prevElem);
            if($3txtFinder.classed("txtContainer")){ //検索ヒット
                $3txtFinder.attr("x", this.getBBox().x - padding)
                    .attr("y", this.getBBox().y - padding)
                    .attr("width", this.getBBox().width + padding * 2)
                    .attr("height", this.getBBox().height + padding * 2)
                    .each(function(d){
                        //指定されている場合だけ指定する
                        if(d.backGroundColor){
                            this.setAttribute("fill", d.backGroundColor);
                        }
                    });
                break;
            }
            prevElem = this.previousSibling;
        }
    });

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
    //background-coloの取得
    var bkgrndcol = $3txtContainerElem.attr("fill");
    if(!bkgrndcol){
        bkgrndcol = window.getComputedStyle($3txtContainerElem.node()).backgroundColor; //ブラウザが計算したbackground-colorを取得
    }

    d3.select(d.bindedElement).style("visibility", "hidden");

    //textareaの表示
    var $3txtArea = d3.select("#editableNode").append("textarea")
        .style("position", "absolute")
        .style("left", $3txtContainerElem.attr("x") + "px")
        .style("top", $3txtContainerElem.attr("y") + "px")
        .style("font-family", fntFam)
        .style("font-size", fntSiz)
        .style("color", col)
        .style("background-color", bkgrndcol)
        .style("border", padding + "px solid " + bkgrndcol)
        .style("border-radius", rounding + "px")
        .property("value", $3captionElem.text())
        .attr("wrap","off");
        
    $3txtArea.node().focus();

    //textareaのサイズ自動調整
    var tmpNode = $3txtArea.node();
    $3txtArea.attr("data-scrollWidthBefore", tmpNode.scrollWidth)
        .attr("data-scrollHeightBefore", tmpNode.scrollHeight)
        .node().oninput = function(){
            
            //サイズ調整
            if( tmpNode.scrollWidth > $3txtArea.attr('data-scrollWidthBefore')){ //width不足の場合
                $3txtArea.style("width", (tmpNode.scrollWidth + 15) + "px");
                $3txtArea.attr('data-scrollWidthBefore', tmpNode.scrollWidth);
            }

            if( tmpNode.scrollHeight > $3txtArea.attr('data-scrollHeightBefore')){ //height不足の場合
                $3txtArea.style("height", (tmpNode.scrollHeight + 15) + "px");
                $3txtArea.attr('data-scrollHeightBefore', tmpNode.scrollHeight);
            }

        };
}
