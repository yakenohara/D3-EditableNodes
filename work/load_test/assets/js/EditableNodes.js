var urlOf_EditableNodes_components_html = "assets/components/EditableNodes_components.html";

var initColor = "rgba(142, 181, 121, 0.5)";

var $nodeEditConsoleElem = $("#testID");

/* <エディタ共通設定>----------------------- */

var slctd = "selected";

/* ----------------------</エディタ共通設定> */



$nodeEditConsoleElem.load(urlOf_EditableNodes_components_html,function(responseText, textStatus, jqXHR) {

    //成功確認
    if(textStatus === "error"){
        console.error("Cannot load \`" + urlOf_EditableNodes_components_html + "\`. statusText:\`" + jqXHR.statusText + "\`");
        return;
    }

    //<register behavor>----------------------------------------------------------------------------------------------------------

    //<text_text_anchor>---------------------------------------------------------------

    var $pickerElem = $nodeEditConsoleElem.find(".propertyEditor.textAnchor").children(".textAnchorType").on("click",function(){
        onTextAnchorTypeClicked(this);
    });

    //--------------------------------------------------------------</text_text_anchor>

    //<text_fill>---------------------------------------------------------------
    

    var $pickerElem = $nodeEditConsoleElem.find(".propertyEditor.fill").children(".picker").eq(0);
    var $inputElem = $nodeEditConsoleElem.find(".propertyEditor.fill").children(".pickedColorText").eq(0);

    $pickerElem.spectrum({
        showAlpha: true,
        showInitial: true,
        preferredFormat: "rgb",
        color: initColor
    });

    // Alternatively, they can be added as an event listener:
    $pickerElem.on('move.spectrum', function(e, tinycolor) {
        $inputElem.val(tinycolor);
        console.log("moved. value:" + tinycolor);
    });

    $inputElem.get(0).oninput = function(){
        console.log("manually inputted. value:" + clickedElem.value);
        $pickerElem.spectrum("set", clickedElem.value);
    }

    //--------------------------------------------------------------</text_fill>

    //---------------------------------------------------------------------------------------------------------</register behavor>

    initializeTextTypeNodeEditConsole();
});

function initializeTextTypeNodeEditConsole(){
    console.log("init");
}

function onTextAnchorTypeClicked(clickedElem){
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