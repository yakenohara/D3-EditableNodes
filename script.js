var dataset = ["untitled yg あいう"];

var node = d3.select("#xxx")
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g");

var box = node.append("rect")
    .attr("fill", "rgb(0,0,100)");

var txtCntnt = node.append("text")
    .attr("x", 100)
    .attr("y", 200)
    // .attr("font-family", "Impact,sans-serif")
    .attr("fill", "White")
    .text(function(d, i){return d;});

box.attr("x", txtCntnt.node().getBBox().x)
    .attr("y", txtCntnt.node().getBBox().y)
    .attr("width", txtCntnt.node().getBBox().width)
    .attr("height", txtCntnt.node().getBBox().height);

node.on("dblclick", cli);

function cli(){
    var tmp = d3.select("body").append("textarea")
        .style("position", "absolute")
        .style("left", 200 + "px")
        .style("top", 300 + "px")
        .attr("wrap","off");

    tmp.attr("data-scrollWidthBefore", tmp.node().scrollWidth)
        .attr("data-scrollHeightBefore", tmp.node().scrollHeight)
        .node().oninput = function(){
            
            //サイズ調整
            if( this.scrollWidth > this.getAttribute('data-scrollWidthBefore')){ //width不足の場合
                this.style.width = (this.scrollWidth + 15) + "px";
                this.setAttribute('data-scrollWidthBefore', this.scrollWidth);
            }

            if( this.scrollHeight > this.getAttribute('data-scrollHeightBefore')){ //height不足の場合
                this.style.height = (this.scrollHeight + 15) + "px";
                this.setAttribute('data-scrollHeightBefore', this.scrollHeight);
            }

        };
}
