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

var nodes = d3.select("#xxx")
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g")
    .each(function(d){
        d.bindedElement = this;
    });

var box = nodes.append("rect")
    .attr("fill", "rgb(0,0,100)");

var txtCntnt = nodes.append("text")
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

box.attr("x", txtCntnt.node().getBBox().x)
    .attr("y", txtCntnt.node().getBBox().y)
    .attr("width", txtCntnt.node().getBBox().width + 30)
    .attr("height", txtCntnt.node().getBBox().height + 30);

nodes.on("dblclick",function(d){dblClicked(d);})

function dblClicked(d){

    var childNode = d.bindedElement.childNodes;
    
    //caption検索ループ
    var D3captionElem;
    for(var i = 0 ; i < childNode.length ; i++){
        var D3captionElem = d3.select(childNode[i]);
        if(D3captionElem.classed("caption")){
            break;
        }
    }

    //caption取得
    var cptn = D3captionElem.text();

    //フォントの取得
    var fntFam = D3captionElem.attr("font-family");
    if(!fntFam){ //フォントが指定されていない場合
        fntFam = window.getComputedStyle(D3captionElem.node()).fontFamily; //ブラウザが計算したフォントを取得
    }
    //フォントサイズの取得
    var fntSiz = D3captionElem.attr("font-size");
    if(!fntSiz){ //フォントサイズが指定されていない場合
        fntSiz = window.getComputedStyle(D3captionElem.node()).fontSize; //ブラウザが計算したサイズを取得
    }
    
    var D3txtArea = d3.select("body").append("textarea")
        .style("position", "absolute")
        .style("left", 200 + "px")
        .style("top", 300 + "px")
        .style("font-family", fntFam)
        .style("font-size", fntSiz)
        .property("value", cptn)
        .attr("wrap","off");

    //textareaのサイズ自動調整
    var tmpNode = D3txtArea.node();

    D3txtArea.attr("data-scrollWidthBefore", tmpNode.scrollWidth)
        .attr("data-scrollHeightBefore", tmpNode.scrollHeight)
        .node().oninput = function(){
            
            //サイズ調整
            if( tmpNode.scrollWidth > D3txtArea.attr('data-scrollWidthBefore')){ //width不足の場合
                D3txtArea.style("width", (tmpNode.scrollWidth + 15) + "px");
                D3txtArea.attr('data-scrollWidthBefore', tmpNode.scrollWidth);
            }

            if( tmpNode.scrollHeight > D3txtArea.attr('data-scrollHeightBefore')){ //height不足の場合
                D3txtArea.style("height", (tmpNode.scrollHeight + 15) + "px");
                D3txtArea.attr('data-scrollHeightBefore', tmpNode.scrollHeight);
            }

        };
}
