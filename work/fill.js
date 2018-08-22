/* <エディタ共通設定>----------------------- */

var slctd = "selected";

/* ----------------------</エディタ共通設定> */

var idNameOf_fillPropertyEditor = "propertyEditor_fill";

var classNameOf_Replacer = "replacer";
var initColor = "rgba(142, 181, 121, 0.5)";

var $pickerElem = $("#" + idNameOf_fillPropertyEditor).children(".picker").eq(0);
var $inputElem = $("#" + idNameOf_fillPropertyEditor).children(".pickedColorText").eq(0);

$inputElem.val(initColor);

$pickerElem.spectrum({
    showAlpha: true,
    showInitial: true,
    preferredFormat: "rgb",
    color: initColor,
    replacerClassName: classNameOf_Replacer,

});

// Alternatively, they can be added as an event listener:
$pickerElem.on('move.spectrum', function(e, tinycolor) {
    $inputElem.val(tinycolor);
});

$inputElem.get(0).oninput = function(){
    console.log("manually inputted. value:" + this.value);

    $pickerElem.spectrum("set", this.value);
}