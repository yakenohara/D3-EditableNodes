/* <エディタ共通設定>----------------------- */

var slctd = "selected";

/* ----------------------</エディタ共通設定> */


function onTextAnchorTypeClicked(clickedElem){

    //選択タイプ抽出 & 例外チェック
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

    //表示状態変更
    var siblings = clickedElem.parentNode.children;
    for(var i = 0 ; i < siblings.length ; i++){ //選択状態の解除ループ
        siblings[i].classList.remove(slctd);
    }
    clickedElem.classList.add(slctd);
    
}
