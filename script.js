var dataset = ["untitled"];

var node = d3.select("#xxx")
    .selectAll("g")
    .data(dataset)
    .enter()
    .append("g");

var box = node.append("rect")
    .attr("x", 100)
    .attr("y", 200)
    .attr("fill", "rgb(0,0,100)");

var txtCntnt = node.append("text")
    .attr("x", 100)
    .attr("y", 200)
    .attr("dominant-baseline", "text-before-edge")
    .attr("fill", "White")
    .text(function(d, i){return d;});

box.attr("width", txtCntnt.node().getBBox().width)
    .attr("height", txtCntnt.node().getBBox().height);

node.on("dblclick", cli);

var cnt = 0;

function cli(){
    d3.select("body").append("textarea")
        .style("position", "absolute")
        .style("left", 200 + "px")
        .style("top", 300 + "px")
        .attr("wrap","off")
        .node().oninput = function(){
            console.log(`cnt:${cnt}`);
            cnt++;
        };
}
