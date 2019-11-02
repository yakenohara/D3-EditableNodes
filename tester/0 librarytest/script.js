function dothis(){
    var elemA = document.getElementById('a');
    var elemB = document.getElementById('b');
    var elemC = document.getElementById('c');

    var $3selectoin = d3.selectAll([elemA, elemB]);

    $3selectoin.style("font-family", "Helvetica,Arial,'lucida grande',tahoma,verdana,arial,'hiragino kaku gothic pro',meiryo,'ms pgothic',sans-serif");

    console.log($3selectoin.node());

}
