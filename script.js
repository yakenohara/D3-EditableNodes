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
        fontFamily: "helvetica, arial, 'hiragino kaku gothic pro', meiryo, 'ms pgothic', sans-serif",
        fontSize: "16px"
    }
];

var $3nodes = d3.select("#xxx")
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .each(function(d){
        d.$3bindedElement = this;
    });

var $3txtContainer = $3nodes.append("rect")
    .attr("fill", "rgb(0,0,100)");

var $3txtCntnt = $3nodes.append("text")
    .attr("class", "caption")
    .attr("x", 100)
    .attr("y", 200)
    .attr("fill", "White")
    .text(function(d){return d.caption;})
    .each(function(d){
        if(d.fontFamily){ //フォントが指定されている場合だけ、指定する
            this.setAttribute("font-family", d.fontFamily);
        }
        if(d.fontSize){ //フォントサイズが指定されている場合だけ、指定する
            this.setAttribute("font-size", d.fontSize);
        }
    });

$3txtContainer.attr("x", $3txtCntnt.node().getBBox().x)
    .attr("y", $3txtCntnt.node().getBBox().y)
    .attr("width", $3txtCntnt.node().getBBox().width + 30)
    .attr("height", $3txtCntnt.node().getBBox().height + 30);

$3nodes.on("dblclick",function(d){dblClicked(d);})

function dblClicked(d){

    var childNode = d.$3bindedElement.childNodes;
    
    //caption検索ループ
    var $3captionElem;
    for(var i = 0 ; i < childNode.length ; i++){
        var $3captionElem = d3.select(childNode[i]);
        if($3captionElem.classed("caption")){
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
    
    //textareaの表示
    var $3txtArea = d3.select("body").append("textarea")
        .style("position", "absolute")
        .style("left", 200 + "px")
        .style("top", 300 + "px")
        .style("font-family", fntFam)
        .style("font-size", fntSiz)
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
