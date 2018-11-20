(function () {

    /* <settings>------------------------------------------------------------------------------------------------ */

    //キー操作設定 `Mousetrap` event
    var keySettings = { 
        editSVGNodes: "f2", //Node編集モードの開始
        submitEditingTextTypeSVGNode: "enter", //Node編集状態の確定
        insertLF: "alt+enter", //textTypeのNode編集時に改行を挿入する
        deleteNodes: "del", //Nodeの削除
    };

    //外部コンポーネントパス
    var url_externalComponent = "assets/components/EditableNodes_components.html";

    // frameType 未指定時に設定する Default Shape
    var defaultTextFrameShape = "rect";
    
    //frameとtext間のpadding
    var valOfpadding_frame_text = 5;
    
    //<text>要素内での行間 note:単位は[em]
    var valOfLineHightInText = 1.3;

    //全ての親となるDOM要素のID名
    var idName_superElement = "editableNode";

    //Property Edit Console要素のclass名
    var className_propertyEditConsoleElement = "propertyEditConsole";

    //Transaction History要素のclass名
    var className_transactionHistoryElement = "transactionHistory";

    //描画用SVG要素のclass名
    var className_SVGElementForNodesMapping = "SVGForNodesMapping";

    //描画用SVG内で Node(s) が属する <g>要素 のclass名
    var className_SVGGroupForNodes = "nodes";

    //描画用SVG内で Selection Layer(s) が属する <g>要素 のclass名
    var className_SVGGroupForSelectionLayers = "selectionLayers";

    //Clickableな要素が選択状態である事を表すclass名
    var className_nodeIsSelected = "selected";

    /* -----------------------------------------------------------------------------------------------</settings> */
    
    /* <Hard cords>---------------------------------------------------------------------------------------------- */

    var forSpectrumRegisteringOptionObj = {
        showAlpha: true,
        allowEmpty: false,
        showInitial: true,
        clickoutFiresChange: true, // <- spectrum (color picker) の範囲外をクリックする or ESC押下時に、
                                   //    最後に入力されていたtinyColorObjを、
                                   //    'change'イベント、'hide'イベントそれぞれに渡す(コール順序は'change'→'hide')
                                   //    最後に入力されていたtinyColorObjがEmptyな場合は、nullを渡す
        preferredFormat: "rgb",
    }
    
    /* ---------------------------------------------------------------------------------------------</Hard cords> */
    
    //todo
    dataset = [];             //Bind用Dataset
    transactionHistory = [];  //history

    var maxKey = -1; //dataset[]の最大key
    var nowEditng = false;　      //Property Edit Console が起動中かどうか
    var lastSelectedData = null;　//最後に選択状態にしたNode    
    var pointingIndexOfHistory = -1;      //historyのどのindexが選択されているか
    
    
    var $3motherElement; //全てのもと
    var $3propertyEditConsoleElement; //Property Edit Console (D3.js selection)
    var $propertyEditConsoleElement;  //Property Edit Console (jQuery selection)
    var $3transactionHistoryElement;  //Transaction History (D3.js selection)
    var $transactionHistoryElement;   //Transaction History (jQuery selection)
    var $3SVGDrawingAreaElement;      //描画用SVG領域 (D3.js selection)
    var $SVGDrawingAreaElement;       //描画用SVG領域 (jQuery selection)
    var $3nodesGroup;
    var $3nodes;
    var $3selectionLayersGroup;

    //Node初期化用Objを作る
    function makeSetDafaultObj(includeIndividualpart){

        var toRetObj;

        toRetObj = {};
        toRetObj.text = {};
        toRetObj.text.text_anchor = null;;
        toRetObj.text.text_font_family = null;
        toRetObj.text.text_font_size = null;
        toRetObj.text.text_fill = null;
        toRetObj.text.text_font_weight = null;
        toRetObj.text.text_font_style = null;
        toRetObj.text.text_text_decoration = null;
        toRetObj.text.frame_shape = null;
        toRetObj.text.frame_stroke = null;
        toRetObj.text.frame_stroke_width = null;
        toRetObj.text.frame_stroke_dasharray = null;
        toRetObj.text.frame_fill = null;

        if(includeIndividualpart){
            toRetObj.text.text_content = "";
        }

        return toRetObj;
    }


    //<Element Selections and Settings of PropertyEditor>-----------------------------------------------------------
    //CSSと共用のキーワードが含まれる処理も、ここに記述する
    var propertyEditorsManager;
    function wrapperOfPropertyEditors(){

        var propertyEditingBehavor_text_text_content;
        var propertyEditingBehavor_text_text_anchor;
        var propertyEditingBehavor_text_font_family;
        var propertyEditingBehavor_text_font_size;
        var propertyEditingBehavor_text_text_fill;
        var propertyEditingBehavor_text_text_font_weight;
        var propertyEditingBehavor_text_text_font_style;
        var propertyEditingBehavor_text_text_decoration;
        var propertyEditingBehavor_text_frame_shape;
        var propertyEditingBehavor_frame_stroke;
        var propertyEditingBehavor_frame_stroke_width;
        var propertyEditingBehavor_frame_stroke_dasharray;
        var propertyEditingBehavor_frame_fill;

        //text.text_content
        propertyEditingBehavor_text_text_content = new propertyEditorBehavor_text(['text','text_content']);

        //text.text_anchor
        var $propertyEditor_text_text_anchor = $propertyEditConsoleElement.find(".propertyEditor.text_text_anchor");
        var elemAndValArr_text_text_anchor = [];
        elemAndValArr_text_text_anchor.push({$elem: $propertyEditor_text_text_anchor.children('.textAnchorType[data-text_anchor_type="start"]').eq(0),
                                             useThisVal: 'start'});
        elemAndValArr_text_text_anchor.push({$elem: $propertyEditor_text_text_anchor.children('.textAnchorType[data-text_anchor_type="middle"]').eq(0),
                                             useThisVal: 'middle'});
        elemAndValArr_text_text_anchor.push({$elem: $propertyEditor_text_text_anchor.children('.textAnchorType[data-text_anchor_type="end"]').eq(0),
                                             useThisVal: 'end'});
        var $propertyEditor_text_text_anchor_defaultBtnElem = $propertyEditor_text_text_anchor.children(".setAsDefault").eq(0);
        var $propertyEditor_text_text_anchor_expMsg = $propertyEditor_text_text_anchor.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_text_anchor = new propertyEditorBehavor_radioButtons(elemAndValArr_text_text_anchor,
                                                                                         $propertyEditor_text_text_anchor_defaultBtnElem,
                                                                                         $propertyEditor_text_text_anchor_expMsg,
                                                                                         ['text', 'text_anchor'],
                                                                                         confirmPropertyEditors, // <- Preview開始時に
                                                                                                                 //    編集中のPropertyEditerのBufferを確定させる
                                                                                         adjustPropertyEditors); // <- RenderingEvent発行後 or 
                                                                                                                 //    mouseleave による rollback 後に
                                                                                                                 //    Node個別編集用 PropertyEditor のみ adjust する

        //text.text_font_family
        var $propertyEditor_text_font_family = $propertyEditConsoleElement.find(".propertyEditor.text_font_family");
        var $propertyEditor_text_font_family_input = $propertyEditor_text_font_family.children(".text_property").eq(0);
        var $propertyEditor_text_font_family_defaultBtnElem = $propertyEditor_text_font_family.children(".setAsDefault").eq(0);
        var $propertyEditor_text_font_family_expMsg = $propertyEditor_text_font_family.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_font_family = new propertyEditorBehavor_textInput($propertyEditor_text_font_family_input,
                                                                                      $propertyEditor_text_font_family_defaultBtnElem,
                                                                                      $propertyEditor_text_font_family_expMsg,
                                                                                      ['text', 'text_font_family'],
                                                                                      confirmPropertyEditors,
                                                                                      adjustPropertyEditors);

        //text.text_font_size
        var $propertyEditor_text_font_size = $propertyEditConsoleElement.find(".propertyEditor.text_font_size");
        var $propertyEditor_text_font_size_input = $propertyEditor_text_font_size.children(".number_property").eq(0);
        var $propertyEditor_text_font_size_defaultBtnElem = $propertyEditor_text_font_size.children(".setAsDefault").eq(0);
        var $propertyEditor_text_font_size_expMsg = $propertyEditor_text_font_size.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_font_size = new propertyEditorBehavor_numberInput($propertyEditor_text_font_size_input,
                                                                                      $propertyEditor_text_font_size_defaultBtnElem,
                                                                                      $propertyEditor_text_font_size_expMsg,
                                                                                      ['text', 'text_font_size'],
                                                                                      confirmPropertyEditors,
                                                                                      adjustPropertyEditors);

        //text.text_fill
        var $propertyEditor_text_text_fill = $propertyEditConsoleElement.find(".propertyEditor.text_text_fill");
        var $propertyEditor_text_text_fill_picker = $propertyEditor_text_text_fill.children(".picker").eq(0);
        var $propertyEditor_text_text_fill_inputElem = $propertyEditor_text_text_fill.children(".pickedColorText").eq(0);
        var $propertyEditor_text_text_fill_defaultBtnElem = $propertyEditor_text_text_fill.children(".setAsDefault").eq(0);
        var $propertyEditor_text_text_fill_expMsg = $propertyEditor_text_text_fill.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_text_fill = new propertyEditorBehavor_fill($propertyEditor_text_text_fill_inputElem,
                                                                               $propertyEditor_text_text_fill_picker,
                                                                               $propertyEditor_text_text_fill_defaultBtnElem,
                                                                               $propertyEditor_text_text_fill_expMsg,
                                                                               ['text', 'text_fill'],
                                                                               confirmPropertyEditors,
                                                                               adjustPropertyEditors);
        
        //text.text_font_weight
        var $propertyEditor_text_font_weight = $propertyEditConsoleElement.find(".propertyEditor.text_font_weight");
        var elemAndValArr_text_font_weight = [];
        elemAndValArr_text_font_weight.push({$elem: $propertyEditor_text_font_weight.children('.fontWeightType[data-font_weight_type="normal"]').eq(0),
                                             useThisVal: 'normal'});
        elemAndValArr_text_font_weight.push({$elem: $propertyEditor_text_font_weight.children('.fontWeightType[data-font_weight_type="bold"]').eq(0),
                                             useThisVal: 'bold'});
        var $propertyEditor_text_font_weight_defaultBtnElem = $propertyEditor_text_font_weight.children(".setAsDefault").eq(0);
        var $propertyEditor_text_font_weight_expMsg = $propertyEditor_text_font_weight.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_text_font_weight = new propertyEditorBehavor_radioButtons(elemAndValArr_text_font_weight,
                                                                                              $propertyEditor_text_font_weight_defaultBtnElem,
                                                                                              $propertyEditor_text_font_weight_expMsg,
                                                                                              ['text', 'text_font_weight'],
                                                                                              confirmPropertyEditors,
                                                                                              adjustPropertyEditors);

        //text.font_style
        var $propertyEditor_text_font_style = $propertyEditConsoleElement.find(".propertyEditor.text_font_style");
        var elemAndValArr_text_font_style = [];
        elemAndValArr_text_font_style.push({$elem: $propertyEditor_text_font_style.children('.fontStyleType[data-font_style_type="normal"]').eq(0),
                                             useThisVal: 'normal'});
        elemAndValArr_text_font_style.push({$elem: $propertyEditor_text_font_style.children('.fontStyleType[data-font_style_type="italic"]').eq(0),
                                             useThisVal: 'italic'});
        var $propertyEditor_text_font_style_defaultBtnElem = $propertyEditor_text_font_style.children(".setAsDefault").eq(0);
        var $propertyEditor_text_font_style_expMsg = $propertyEditor_text_font_style.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_text_font_style = new propertyEditorBehavor_radioButtons(elemAndValArr_text_font_style,
                                                                                             $propertyEditor_text_font_style_defaultBtnElem,
                                                                                             $propertyEditor_text_font_style_expMsg,
                                                                                             ['text', 'text_font_style'],
                                                                                             confirmPropertyEditors,
                                                                                             adjustPropertyEditors);

        //text.text_decoration
        var $propertyEditor_text_text_decoration = $propertyEditConsoleElement.find(".propertyEditor.text_text_decoration");
        var $propertyEditor_text_text_decoration_input = $propertyEditor_text_text_decoration.children(".text_property").eq(0);
        var $propertyEditor_text_text_decoration_defaultBtnElem = $propertyEditor_text_text_decoration.children(".setAsDefault").eq(0);
        var $propertyEditor_text_text_decoration_expMsg = $propertyEditor_text_text_decoration.children(".message.explicitness").eq(0);
        propertyEditingBehavor_text_text_decoration = new propertyEditorBehavor_textInput($propertyEditor_text_text_decoration_input,
                                                                                      $propertyEditor_text_text_decoration_defaultBtnElem,
                                                                                      $propertyEditor_text_text_decoration_expMsg,
                                                                                      ['text', 'text_text_decoration'],
                                                                                      confirmPropertyEditors,
                                                                                      adjustPropertyEditors);

        //text.frame_shape
        var $propertyEditor_text_frame_shape = $propertyEditConsoleElement.find(".propertyEditor.text_frame_shape");
        var elemAndValArr_text_frame_shape = [];
        elemAndValArr_text_frame_shape.push({$elem: $propertyEditor_text_frame_shape.children('.frameShapeType[data-frame_shape_type="rect"]').eq(0),
                                             useThisVal: 'rect'});
        elemAndValArr_text_frame_shape.push({$elem: $propertyEditor_text_frame_shape.children('.frameShapeType[data-frame_shape_type="circle"]').eq(0),
                                             useThisVal: 'circle'});
        elemAndValArr_text_frame_shape.push({$elem: $propertyEditor_text_frame_shape.children('.frameShapeType[data-frame_shape_type="ellipse"]').eq(0),
                                             useThisVal: 'ellipse'});
        var $propertyEditor_text_frame_shape_expMsg = $propertyEditor_text_frame_shape.children(".message.explicitness").eq(0);
        var $propertyEditor_text_frame_shape_defaultBtnElem = $propertyEditor_text_frame_shape.children(".setAsDefault").eq(0);
        propertyEditingBehavor_text_frame_shape = new propertyEditorBehavor_radioButtons(elemAndValArr_text_frame_shape,
                                                                                         $propertyEditor_text_frame_shape_defaultBtnElem,
                                                                                         $propertyEditor_text_frame_shape_expMsg,
                                                                                         ['text', 'frame_shape'],
                                                                                         confirmPropertyEditors,
                                                                                         adjustPropertyEditors);
                                                                                         
        //text.frame_stroke
        var $propertyEditor_frame_stroke = $propertyEditConsoleElement.find(".propertyEditor.frame_stroke");
        var $propertyEditor_frame_stroke_picker = $propertyEditor_frame_stroke.children(".picker").eq(0);
        var $propertyEditor_frame_stroke_inputElem = $propertyEditor_frame_stroke.children(".pickedColorText").eq(0);
        var $propertyEditor_frame_stroke_defaultBtnElem = $propertyEditor_frame_stroke.children(".setAsDefault").eq(0);
        var $propertyEditor_frame_stroke_expMsg = $propertyEditor_frame_stroke.children(".message.explicitness").eq(0);
        propertyEditingBehavor_frame_stroke = new propertyEditorBehavor_fill($propertyEditor_frame_stroke_inputElem,
                                                                             $propertyEditor_frame_stroke_picker,
                                                                             $propertyEditor_frame_stroke_defaultBtnElem,
                                                                             $propertyEditor_frame_stroke_expMsg,
                                                                             ['text', 'frame_stroke'],
                                                                             confirmPropertyEditors,
                                                                             adjustPropertyEditors);

        //text.frame_stroke_width
        var $propertyEditor_frame_stroke_width = $propertyEditConsoleElement.find(".propertyEditor.frame_stroke_width");
        var $propertyEditor_frame_stroke_width_input = $propertyEditor_frame_stroke_width.children(".number_property").eq(0);
        var $propertyEditor_frame_stroke_width_defaultBtnElem = $propertyEditor_frame_stroke_width.children(".setAsDefault").eq(0);
        var $propertyEditor_frame_stroke_width_expMsg = $propertyEditor_frame_stroke_width.children(".message.explicitness").eq(0);
        propertyEditingBehavor_frame_stroke_width = new propertyEditorBehavor_numberInput($propertyEditor_frame_stroke_width_input,
                                                                                      $propertyEditor_frame_stroke_width_defaultBtnElem,
                                                                                      $propertyEditor_frame_stroke_width_expMsg,
                                                                                      ['text', 'frame_stroke_width'],
                                                                                      confirmPropertyEditors,
                                                                                      adjustPropertyEditors);
                                                                                      
        //text.frame_stroke_dasharray
        var $propertyEditor_frame_stroke_dasharray = $propertyEditConsoleElement.find(".propertyEditor.frame_stroke_dasharray");
        var $propertyEditor_frame_stroke_dasharray_input = $propertyEditor_frame_stroke_dasharray.children(".text_property").eq(0);
        var $propertyEditor_frame_stroke_dasharray_defaultBtnElem = $propertyEditor_frame_stroke_dasharray.children(".setAsDefault").eq(0);
        var $propertyEditor_frame_stroke_dasharray_expMsg = $propertyEditor_frame_stroke_dasharray.children(".message.explicitness").eq(0);
        propertyEditingBehavor_frame_stroke_dasharray = new propertyEditorBehavor_textInput($propertyEditor_frame_stroke_dasharray_input,
                                                                                            $propertyEditor_frame_stroke_dasharray_defaultBtnElem,
                                                                                            $propertyEditor_frame_stroke_dasharray_expMsg,
                                                                                            ['text', 'frame_stroke_dasharray'],
                                                                                            confirmPropertyEditors,
                                                                                            adjustPropertyEditors);

        //text.frame_fill
        var $propertyEditor_frame_fill = $propertyEditConsoleElement.find(".propertyEditor.frame_fill");
        var $propertyEditor_frame_fill_picker = $propertyEditor_frame_fill.children(".picker").eq(0);
        var $propertyEditor_frame_fill_inputElem = $propertyEditor_frame_fill.children(".pickedColorText").eq(0);
        var $propertyEditor_frame_fill_defaultBtnElem = $propertyEditor_frame_fill.children(".setAsDefault").eq(0);
        var $propertyEditor_frame_fill_expMsg = $propertyEditor_frame_fill.children(".message.explicitness").eq(0);
        propertyEditingBehavor_frame_fill = new propertyEditorBehavor_fill($propertyEditor_frame_fill_inputElem,
                                                                           $propertyEditor_frame_fill_picker,
                                                                           $propertyEditor_frame_fill_defaultBtnElem,
                                                                           $propertyEditor_frame_fill_expMsg,
                                                                           ['text', 'frame_fill'],
                                                                           confirmPropertyEditors,
                                                                           adjustPropertyEditors);
        
        // Default all
        var $propertyEditor_all = $propertyEditConsoleElement.find(".propertyEditor.all");
        var $propertyEditor_all_defaultBtnElem = $propertyEditor_all.children(".setAsDefault").eq(0);
        var dummuyFor_propertyEditor_all;
        new propertyEditorBehavor_setAsDefault($propertyEditor_all_defaultBtnElem,
                                               dummuyFor_propertyEditor_all, // <- 'undefined'を渡して、全て削除とする
                                               confirmPropertyEditors,
                                               adjustPropertyEditConsole); // <- 全てのProperty Editor を adjustする

        // Property Editor の編集状態を Style Object (Nodeの状態) に合わせる
        this.adjust = function(computedStyleObj, explicitnessObj){
            adjustPropertyEditors(computedStyleObj, explicitnessObj);
        }

        // Property Editor が編集中の場合、編集状態を確定させる
        this.confirm = function(){
            confirmPropertyEditors();
        }

        // Node個別編集用 PropertyEditor を指定dataに対して追加する
        this.append = function(bindedData){

            switch(bindedData.type){
                case 'text':
                {
                    //text_content
                    propertyEditingBehavor_text_text_content.append(bindedData);
                }
                break;

                default:
                {
                    console.warn("unknown data type \`" + bindedData.type + "\` specified. ");
                }
                break;
            }
        }

        // Node個別編集用 PropertyEditor の フォーカス合わせ
        // ex <textarea>を使う PropertyEditor なら、キャレットを表示させる
        this.focus = function(bindedData){

            switch(bindedData.type){
                case 'text':
                {
                    //text_content
                    propertyEditingBehavor_text_text_content.focus(bindedData);
                }
                break;

                default:
                {
                    console.warn("unknown data type \`" + bindedData.type + "\` specified. ");
                }
                break;
            }
        }

        // Node個別編集用 PropertyEditor を終了する
        this.exit = function(){

            //text_content
            propertyEditingBehavor_text_text_content.exit();
        }

        //
        // Property Editor の編集状態を Style Object (Nodeの状態) に合わせる
        // StyleObjectを指定しない場合は、Node個別編集用PropertyEditorのみadjustする
        //
        function adjustPropertyEditors(computedStyleObj, explicitnessObj){
            
            //text_content
            propertyEditingBehavor_text_text_content.adjust();


            if((typeof computedStyleObj == 'object') && (typeof computedStyleObj == 'object')){ 

                //text_font_weight は Radio Button Type の Behavor が
                //`normal` == `400`, `bold` == '700' を判定できないので、変換しておく
                if(typeof computedStyleObj.text != 'undefined'){
                    if(computedStyleObj.text.text_font_weight === '400'){
                        computedStyleObj.text.text_font_weight = 'normal';
                    }else if(computedStyleObj.text.text_font_weight === '700'){
                        computedStyleObj.text.text_font_weight = 'bold';
                    }
                }
                
                propertyEditingBehavor_text_text_anchor.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_font_family.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_font_size.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_text_fill.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_text_font_weight.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_text_font_style.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_text_decoration.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_text_frame_shape.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_frame_stroke.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_frame_stroke_width.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_frame_stroke_dasharray.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_frame_fill.adjustToStyleObj(computedStyleObj, explicitnessObj);
            }
        }

        function confirmPropertyEditors(){

            propertyEditingBehavor_text_text_content.confirm();
            propertyEditingBehavor_text_text_anchor.confirm();
            propertyEditingBehavor_text_font_family.confirm();
            propertyEditingBehavor_text_font_size.confirm();
            propertyEditingBehavor_text_text_fill.confirm();
            propertyEditingBehavor_text_text_font_weight.confirm();
            propertyEditingBehavor_text_text_font_style.confirm();
            propertyEditingBehavor_text_text_decoration.confirm();
            propertyEditingBehavor_text_frame_shape.confirm();
            propertyEditingBehavor_frame_stroke.confirm();
            propertyEditingBehavor_frame_stroke_width.confirm();
            propertyEditingBehavor_frame_stroke_dasharray.confirm();
            propertyEditingBehavor_frame_fill.confirm();
        }
    }
    //----------------------------------------------------------</Element Selections and Settings of PropertyEditor>

    //DOM構築
    $3motherElement = d3.select("#" + idName_superElement) //全てのもと
        .style("position", "relative");

    $3propertyEditConsoleElement = $3motherElement.append("div") //Property Edit Console
        .style("position", "absolute")
        .style("z-index", 10)
        .style("margin", 0)
        .style("border", 0)
        .style("padding", 0)
        .style("display","none")
        .classed(className_propertyEditConsoleElement, true);

    $propertyEditConsoleElement = $($3propertyEditConsoleElement.node()); //jQuery selectionも作る

    //外部コンポーネントを Property Edit Console 配下に構築する
    $propertyEditConsoleElement.load(url_externalComponent,function(responseText, textStatus, jqXHR) {

        //成功確認
        if(textStatus === "error"){
            console.error("Cannot load \`" + url_externalComponent + "\`. statusText:\`" + jqXHR.statusText + "\`");
            return;
        }

        propertyEditorsManager = new wrapperOfPropertyEditors();

    });

    $3transactionHistoryElement = $3motherElement.append("div") //transaction history
        .style("position", "absolute")
        .style("z-index", 10)
        .style("margin", 0)
        .style("border", 0)
        .style("padding", 0)
        .style("right",0)
        .style("white-space","nowrap")
        .style("overflow","auto")
        .classed(className_transactionHistoryElement, true)
        .attr("wrap","off");
    $transactionHistoryElement = $($3transactionHistoryElement.node()).eq(0);

    $3SVGDrawingAreaElement = $3motherElement.append("svg") //Node描画用SVGの作成
        .classed(className_SVGElementForNodesMapping, true)
        .style("vertical-align", "bottom");

    $SVGDrawingAreaElement = $($3SVGDrawingAreaElement.node());

    $3nodesGroup = $3SVGDrawingAreaElement.append("g") //ノードグループの作成
        .classed(className_SVGGroupForNodes, true);

    $3selectionLayersGroup = $3SVGDrawingAreaElement.append("g") //Selection Layer 用グループの作成
        .classed(className_SVGGroupForSelectionLayers, true);

    $3nodes = $3nodesGroup.selectAll("g.node") // ノード追加
        .data(dataset, function(d){return d.key});

    //ファイルのDragoverイベント
    $SVGDrawingAreaElement.get(0).addEventListener('dragover', function(e){
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    //ファイルをDropした場合
    $SVGDrawingAreaElement.get(0).addEventListener('drop', function(e){
        
        var files = e.dataTransfer.files;
        
        readFilesSequential(0); //ドロップされた各ファイルへのループ
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない

        //ドロップされたファイルを順次読み込みする
        function readFilesSequential(indexOfFiles){

            if(indexOfFiles >= files.length){ //読み込むファイルがない場合
                return;
            }

            var droppedFileObj = files[indexOfFiles];
            var typ = droppedFileObj.type;
            var nm = droppedFileObj.name;
            var dots = nm.split('.');
            var ext = (dots[dots.length - 1]).toLowerCase();

            //ファイル形式判定
            if((ext == 'json') &&               //
                ((typ == 'application/json') || //
                 (typ == '' && ext))){          // -> json形式の場合

                var file_reader = new FileReader();
                file_reader.onload = function(e){
                    
                    try{
                        var parsedObj = JSON.parse(file_reader.result); //SyntaxErrorをthrowする可能性がある
                        var appendingTotalReport = appendNodes(parsedObj);
                        appendHistory(appendingTotalReport);
                    
                    }catch(e){ //SyntaxErrorの場合
                        console.warn(e);
                    }
                    readFilesSequential(indexOfFiles+1); //次のファイルを読み込み
                };
                file_reader.readAsText(droppedFileObj);

            }else{ //不明なファイル形式の場合
                console.warn("unknown file type \`" + typ + "\` detected in \`" + nm + "\`.");
                readFilesSequential(indexOfFiles+1); //次のファイルを読み込み
            }
        }
    });

    //ファイルをD&DせずにLeaveした場合
    $SVGDrawingAreaElement.get(0).addEventListener('dragleave', function(e){
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });
    
    // Node以外に対する click event
    $SVGDrawingAreaElement.on('click', function(e){

        // SVG領域に対する選択でない場合(Node等)はハジく
        if(!(d3.select(e.target).classed(className_SVGElementForNodesMapping))){return;}

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
        
        if(nowEditng){ // 編集中の場合

            exitEditing(); //編集モードの終了
        
        }else{  // 編集中でない場合
            
            //Nodeすべてを選択解除する
            for(var i = 0 ; i < dataset.length ; i++){
                dataset[i].$3bindedSelectionLayerSVGElement.style("visibility", "hidden")
                    .attr("data-selected", "false"); //選択解除
            }
            lastSelectedData = null;
        }
    });

    // Nodeに対する複数編集イベント
    Mousetrap.bind(keySettings.editSVGNodes, function(e){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
        
        if(nowEditng){ // 編集中の場合
            //nothing to do
        
        }else{ // 編集中でない場合
            if(lastSelectedData !== null){ //選択対象Nodeが存在する場合
                editSVGNodes();
                propertyEditorsManager.focus(lastSelectedData);
                disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
            }
        }
    });

    // Nodeに対する削除イベント
    Mousetrap.bind(keySettings.deleteNodes, function(e){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}

        if(nowEditng){ // 編集中の場合
            //nothing to do
        
        }else{ // 編集中でない場合

            deleteSVGNodes(); //選択状態のNode(s)を削除
            lastSelectedData = null;
            disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
        }
    });

    //--------------------------------------------------------------------</UI TRAP>
    
    // <TBD 複数Nodeのブラシ選択>--------------------------------------------------------------------------------
    // Node 内/外 に対する Click event を無視する方法が不明

    //Node選択用Brushの作成
    // var isFirstEndOfBrush = true;
    // var $3NodeSelectingBrush = d3.brush()
    //     .on("end", function(){ //選択終了イベント
    //         if(isFirstEndOfBrush){ //Avoid infinite loop
    //             isFirstEndOfBrush = false;
    //             clearNodeSelectingBrush();
    //             isFirstEndOfBrush = true;
    //         }
    //     })
    //     .filter(function(){
    //         // Click event(Drag evet でない)場合に無視したい
    //         return !event.button;
    //     });
        
    // var $3NodeSelectingBrushGroup = $3selectionLayersGroup.append("g")
    //     .call($3NodeSelectingBrush);

    // function clearNodeSelectingBrush(){
    //     $3NodeSelectingBrushGroup.call($3NodeSelectingBrush.move, null); //Brush 選択範囲のクリア
    // }

    // -------------------------------------------------------------------------------</TBD 複数Nodeのブラシ選択>

    function appendNodes(appendThisObjArr){

        var appendingTotalReport = {};
        appendingTotalReport.type = 'append';
        appendingTotalReport.allOK = true;
        appendingTotalReport.allNG = true;
        appendingTotalReport.reportsArr = [];

        //引数チェック
        if(!Array.isArray(appendThisObjArr)){ //Arrayでない場合
            console.warn("specified argment is not array");
            return;
        }

        for(var i = 0 ; i < appendThisObjArr.length ; i++){

            //dataset[]へ追加
            var toAppendObj = {};
            mergeObj(appendThisObjArr[i], toAppendObj, false);
            var appendedIdx = dataset.push(toAppendObj) - 1;

            if(typeof dataset[appendedIdx].key == 'number'){ //keyに明示的な指定があった場合

                //key重複確認ループ
                for(var j = appendedIdx-1 ; j >= 0 ; j--){
                    
                    if(dataset[j].key == dataset[appendedIdx].key){ //重複があった場合
                        maxKey++;
                        console.warn("duplicate key \`" + dataset[appendedIdx].key.toString() + "\` specified. unique key \`" + maxKey.toString() + "\` will apply.");
                        dataset[appendedIdx].key = maxKey; //重複しないkeyで上書き
                        //note appendingTotalReport.AllOK は変更しない (NodeRenderingに失敗したわけではない為)
                        break;
                    }
                }

            }else{ //keyに明示的な指定がなかった場合
                dataset[appendedIdx].key = (++maxKey); //重複しないkeyを指定
            }
            
        }

        //bind using D3.js
        $3nodes = $3nodesGroup.selectAll("g.node")
            .data(dataset, function(d){return d.key});
            

        //描画 & リスナ登録
        $3nodes.enter()
            .append("g")
            .classed("node", true)
            .each(function(d ,i){

                var bindedSVGElement = this;
                d.$3bindedSVGElement = d3.select(this);

                d.$3bindedSelectionLayerSVGElement = $3selectionLayersGroup.append("g")
                    .classed("selectionLayer",true)
                    .style("pointer-events", "none")
                    .style("visibility", "hidden")
                    .attr("data-selected", "false");

                checkToBindData(d); //data書式のチェック
                
                //座標追加
                if(typeof d.coordinate == 'undefined'){
                    d.coordinate = {
                        x: ($3motherElement.node().offsetWidth / 2), //<-仮の処理
                        y: (60*(i+1)) //<-仮の処理
                    };
                }
                
                var renderReport = renderSVGNode(d,d); //SVGレンダリング
                backToDefaulIfWarn(renderReport, d);
                
                if(!renderReport.allOK){ //失敗が発生した場合
                    appendingTotalReport.allOK = false;
                }

                if(!renderReport.allNG){ //成功が1つ以上ある場合
                    appendingTotalReport.allNG = false;
                }

                appendingTotalReport.reportsArr.push(renderReport);

                //Property変更用EventListener
                bindedSVGElement.addEventListener("propertyEditConsole_rerender",function(eventObj){

                    if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //自分のNodeが選択中の場合
                
                        //引数チェック
                        if(typeof eventObj.argObj == 'undefined'){ //引数なし
                            console.warn("propertyEditConsole_rerender was not specified \`argObj\`.");
                            return;
                        }
                        if(typeof eventObj.argObj.renderByThisObj != 'object'){ //nodeレンダリング用objが存在しない
                            console.warn("propertyEditConsole_rerender was not specified \`argObj.renderByThisObj\`.");
                            return;
                        }
                
                        var renderReport = renderTextTypeSVGNode(d, eventObj.argObj.renderByThisObj);
                
                        if(typeof eventObj.argObj.clbkFunc == 'function'){ //コールバック関数が存在する
                            eventObj.argObj.clbkFunc(renderReport);
                        }
                    }
                    
                });

                //
                // SVGノードの単一選択イベント 
                //
                // note doubleclick時に2回呼ばれて不要がTogglingが発生するが、
                //      .on('dblclick', function()~ によって強制的に選択状態にされる
                //
                d.$3bindedSVGElement.on('click', function(d){

                    //External Componentが未loadの場合はハジく
                    if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                    
                    exitEditing(); //編集モードの終了
            
                    if(!(d3.event.ctrlKey)){ //ctrl key 押下でない場合
            
                        //別ノードすべてを選択解除する
                        for(var i = 0 ; i < dataset.length ; i++){
                            if(dataset[i].key != d.key){ //自分のノードでない場合
                                dataset[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                                    .attr("data-selected", "false"); //選択解除
                            }
                        }
                    }
            
                    var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');
            
                    //選択状態を切り替える
                    if(isSelected){ //選択状態の場合
                        d.$3bindedSelectionLayerSVGElement.style("visibility","hidden") //非表示にする
                            .attr("data-selected", "false"); //選択解除
                        lastSelectedData = null; //最終選択Nodeをnullにする(すべてのNodeが非選択になる為)
            
                    }else{ //非選択状態の場合
                        d.$3bindedSelectionLayerSVGElement.style("visibility",null) //表示状態にする
                            .attr("data-selected", "true"); //選択解除
                        
                        lastSelectedData = d; //最終選択Nodeの記憶
                    }
            
                });

                // Nodeに対する単一編集イベント
                d.$3bindedSVGElement.on('dblclick', function(d){

                    //External Componentが未loadの場合はハジく
                    if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                    
                    if(nowEditng){ // 編集中の場合
                                // -> 発生し得ないルート
                                //    (直前に呼ばれる単一選択イベントによって、編集中が解除される為)
            
                        exitEditing(); //編集モードの終了
                    
                    }
            
                    //別ノードすべてを選択解除して、自分のノードのみ選択状態にする
                    for(var i = 0 ; i < dataset.length ; i++){
                        if(dataset[i].key != d.key){ //自分のノードでない場合
                            dataset[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden") //選択解除
                                .attr("data-selected", "false"); //選択解除
                        
                        }else{ //自分のノードの場合
                            dataset[i].$3bindedSelectionLayerSVGElement.style("visibility",null) //選択
                                .attr("data-selected", "true"); //選択解除
                        }
                    }
                    
                    editSVGNodes();
                    lastSelectedData = d; //最終選択Nodeの記憶
                    propertyEditorsManager.focus(lastSelectedData);
            
                });
            });

        //増えた<g>要素に合わせて$node selectionを再調整
        $3nodes = $3nodesGroup.selectAll("g.node");

        appendingTotalReport.message = appendingTotalReport.reportsArr.length.toString() + " node(s) appended.";
        return appendingTotalReport;
    }

    //
    //選択状態のSVGノード(複数)を削除する
    //
    function deleteSVGNodes(){

        var toDeleteKeyArr = []; //削除対象keyをまとめたArray

        //削除対象Nodeをdataset[]から検索 & 削除
        for(var i = dataset.length-1 ; i >= 0 ; i--){
            if(dataset[i].$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                toDeleteKeyArr.push(dataset[i].key); //削除対象keyArrayに追加
            }
        }

        if(toDeleteKeyArr.length > 0){ //削除対象Nodeが存在する場合
            var deletingTotalReport = deleteNodes(toDeleteKeyArr);
            appendHistory(deletingTotalReport);
        }
    }

    //
    //SVGノード(複数)を削除する
    //
    function deleteNodes(toDeleteKeyArr){

        var deletingTotalReport = {};
        deletingTotalReport.type = 'delete';
        deletingTotalReport.allOK = true;
        deletingTotalReport.allNG = true;
        deletingTotalReport.reportsArr = [];

        var defaultObj = makeSetDafaultObj(true);
        defaultObj.coordinate = {};
        defaultObj.coordinate.x = 0;
        defaultObj.coordinate.y = 0;
        var numOfDeleted = 0;

        //削除対象Nodeをdataset[]から検索 & 削除
        for(var i = dataset.length-1 ; i >= 0 ; i--){
            var foundIdx = toDeleteKeyArr.indexOf(dataset[i].key);

            if(foundIdx >= 0){ //削除指定keyArray内に存在する場合
                dataset.splice(i,1); //dataset[]から削除
                toDeleteKeyArr.splice(foundIdx, 1); //削除指定KeyArrayからも削除
                numOfDeleted++;
            }
        }

        //rebind using D3.js
        $3nodes = $3nodesGroup.selectAll("g.node")
            .data(dataset, function(d){return d.key});

        $3nodes.exit()
            .each(function(d,i){

                //SVG削除前のPropertyを保存する為、defaltObjで再度レンダリングする
                var renderReport = renderSVGNode(d, defaultObj); //SVGレンダリング
                renderReport.PrevObj.type = d.type; //削除前のtypeをPrevObjに保存
                if(!renderReport.allOK){ //失敗が発生した場合
                    deletingTotalReport.allOK = false;
                }
                if(!renderReport.allNG){ //成功が1つ以上ある場合
                    deletingTotalReport.allNG = false;
                }
                deletingTotalReport.reportsArr.push(renderReport);
                
                // ↓ .remove();で削除されない為ここで削除する ↓
                //    (多分 selection.data() で紐づけたSVG要素でなない事が原因)
                d.$3bindedSelectionLayerSVGElement.remove();                                              
            })
            .remove();

        //減った<g>要素に合わせて$node selectionを再調整
        $3nodes = $3nodesGroup.selectAll("g.node");

        if(toDeleteKeyArr.length > 0){ //削除指定Keyが見つからなかった場合
            console.warn("key(s) [" + toDeleteKeyArr.toString() + "] not found");
        }

        deletingTotalReport.message = numOfDeleted.toString() + " node(s) deleted.";
        return deletingTotalReport;
    }

    function fireEvent_PropertyEditConsole_rerender(argObj){
        var totalReport = {};
        totalReport.allOK = true;
        totalReport.allNG = true;
        totalReport.reportsArr = [];

        var eventObj = document.createEvent("Event");
        eventObj.initEvent("propertyEditConsole_rerender", false, false);
        eventObj.argObj　= {};
        eventObj.argObj.renderByThisObj = argObj;
        eventObj.argObj.clbkFunc = function(renderReport){ //ノード変更レポートの追加用コールバック関数
            
            //失敗が発生し場合は、totalReportも失敗とする
            if(!renderReport.allOK){
                totalReport.allOK = false;
            }

            //成功が一つ以上ある場合
            if(!renderReport.allNG){
                totalReport.allNG = false;
            }

            totalReport.reportsArr.push(renderReport);
        }
        
        //すべてのnode要素にイベントを発行する
        var nodes = $3nodes.nodes();
        for(var i = 0 ; i < nodes.length ; i++){
            nodes[i].dispatchEvent(eventObj);
        }

        //コールバックがなかった(=登録リスナがなかった)場合は、totalReportも失敗とする
        if(totalReport.reportsArr.length == 0){
            totalReport.allOK = false;
            totalReport.allNG = true;
        }

        return totalReport;
    }

    function printRenderingFailuredSVGElements(totalReport){

        //引数チェック
        if(totalReport.reportsArr.length == 0){ //コールバックがなかった(=登録リスナがなかった)場合
            console.warn("No SVG Node to Apply");
            return;
        }

        //失敗レポート検索ループ
        for(var i = 0 ; i < totalReport.reportsArr.length ; i++){
            var reportObj = totalReport.reportsArr[i];
            if(!reportObj.allOK){ //失敗していた場合
                var bindedData = getBindedDataFromKey(reportObj.key);
                if(typeof bindedData == 'undefined'){ //データが見つからない場合
                    console.warn("Cannot find \`key:" + reportObj.key + "\`"); //keyIDのみ表示する
                }else{
                    console.warn((getDomPath(bindedData.$3bindedSVGElement.node())).join('/')); //対象SVGのDomPathを表示する
                }
            }
        }
    }

    function checkToBindData(checkThisData){

        if(typeof checkThisData.type == 'undefined'){ //type指定がない場合
            console.warn("Type not specified. This data will be handled as \`text\` type.");
            checkThisData.type = "text";
        }

        if(typeof checkThisData.type != 'string'){ //typeの型がstringでない場合
            console.warn("Wrong type specified in \`checkThisData.type\`. " +
                        "specified type:\`" + (typeof (checkThisData.type)) + "\`, expected type:\`string\`.\n" +
                        "This data will be handled as \`text\` type.");
            checkThisData.type = "text";
        }

        var forceAsText = false;

        //不足オブジェクトのチェック&追加
        switch(checkThisData.type){
            
            case "text":
            {
                forceAsText = true;
            }
            break;

            default:
            {
                console.warn("unknown data type \`" + checkThisData.type + "\` specified. This data will be handled as \`text\` type.");
                checkThisData.type = "text";
                forceAsText = true;
            }
            break;
        }

        if(forceAsText){
            //"text" type 固有の不足オブジェクトのチェック&追加
            if(typeof (checkThisData.text) == 'undefined'){
                checkThisData.text = {}; //空のオブジェクトを作る
            }
            if(typeof (checkThisData.text.text_content) == 'undefined'){
                checkThisData.text.text_content = ""; //空文字を定義
            }
        }
    }

    function renderSVGNode(bindedData, renderByThisObj){

        var $3SVGnodeElem = bindedData.$3bindedSVGElement;
        var reportObj;
        var rerender = false;
        var toAppendTypeRenderFail = "";
        
        //type指定チェック
        if(typeof (renderByThisObj.type) != 'undefined'){ //type指定がある場合
            if(typeof (renderByThisObj.type) != 'string'){ //型がstringでない
                
                toAppendTypeRenderFail = "Wrong type specified in \`renderByThisObj.type\`. " +
                            "specified type:\`" + (typeof (renderByThisObj.type)) + "\`, expected type:\`string\`.";
                console.warn(toAppendTypeRenderFail);            
                //failure レポート はリレンダリング後に行う

                rerender = true;
            
            }else{ //型がstring
                switch(renderByThisObj.type){
                    case "text":
                    {
                        //定義済みSVGElement構造の全削除
                        while($3SVGnodeElem.node().firstChild){
                            $3SVGnodeElem.node().removeChild($3SVGnodeElem.node().firstChild);
                        }

                        //SVGElement構造の定義
                        $3SVGnodeElem.append("g").classed("frame", true); //枠定義
                        
                        $3SVGnodeElem.append("text") //<text>定義
                            .classed("textContent", true)
                            .style("white-space", "pre");

                        //レンダリング
                        reportObj = renderTextTypeSVGNode(bindedData, renderByThisObj);

                        //変更レポートの追加
                        reportObj.PrevObj.type = bindedData.type;
                        reportObj.RenderedObj.type = "text";
                    }
                    break;
            
                    default:
                    {
                        toAppendTypeRenderFail = "Unknown type \`" + renderByThisObj.type + "\` specified in \`renderByThisObj.type\`. ";
                        console.warn(toAppendTypeRenderFail);
                        //failure レポート はリレンダリング後に行う

                        rerender = true;
                    }
                    break;
                }
            }
        
        }else{ //type指定が存在しない場合
            rerender = true;
        }

        if(rerender){
            //前回のtypeでリレンダリングする
            switch(bindedData.type){
                case "text":
                {
                    reportObj = renderTextTypeSVGNode(bindedData, renderByThisObj);
                }
                break;

                default:
                break; //nothing to do
            }

            //type指定エラーがあった場合
            if(toAppendTypeRenderFail != ""){
                reportObj.FailuredMessages.type = toAppendTypeRenderFail;
            }
        }

        return reportObj;
    }

    function renderTextTypeSVGNode(bindedData, renderByThisObj){

        //text property存在チェック
        if(typeof (renderByThisObj.text) == 'undefined'){
            renderByThisObj.text = {};
        }

        //変更レポート
        var reportObj = {
            key:bindedData.key,
            allOK:true,
            allNG:true,
            PrevObj:{
                text: {},
                coordinate: {}
            },
            RenderedObj:{
                text: {},
                coordinate: {}
            },
            FailuredMessages:{
                text: {},
                coordinate: {}
            }
        };

        var $3SVGnodeElem = bindedData.$3bindedSVGElement;

        var $3SVGnodeElem_DOTframe = $3SVGnodeElem.select(".frame");
        var $3SVGnodeElem_text = $3SVGnodeElem.select("text");
        
        var inlineStyleOf_SVGnodeElem_text = $3SVGnodeElem_text.node().style;
        var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

        var haveToUpdateFrame = false;
        var vacantStarted = false;
        var vacantEnded = false;

        var untreatedPropertyNames = Object.keys(renderByThisObj.text); //未処理プロパティリスト

        //テキスト更新
        if(typeof (renderByThisObj.text.text_content) != 'undefined'){ //textオブジェクトがある場合

            //変更前textを取得
            var beforeTspans = $3SVGnodeElem_text.node().childNodes;
            var prevTxt = "";
            if(beforeTspans.length > 0){ //<tspan>が存在する
                prevTxt = beforeTspans[0].textContent;
                for(var i = 1 ; i < beforeTspans.length ; i++){
                    prevTxt += ("\n" + beforeTspans[i].textContent);
                }
            }
            
            if(typeof (renderByThisObj.text.text_content) != 'string'){ //型がstringでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_content\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_content)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_content = wrn;

            }else{ //型がstring

                //定義済tspan要素の全削除
                while($3SVGnodeElem_text.node().firstChild){
                    $3SVGnodeElem_text.node().removeChild($3SVGnodeElem_text.node().firstChild);
                }

                if(renderByThisObj.text.text_content == ""){ //空文字の場合
                    $3SVGnodeElem_text.append("tspan").text("");

                }else{ //空文字ではない場合

                    var lfSeparatedStrings = renderByThisObj.text.text_content.split(/\n/); //改行コードで分割
                    
                    //1行おきにtspan要素として追加
                    var numOfVacantLines = 0;
                    for(var i = 0 ; i < lfSeparatedStrings.length ; i++){
                        var str = lfSeparatedStrings[i];
                        
                        //最初の行or最後の行が空文字の場合は
                        //背景Shape更新の為にダミー文字を追加する
                        if(i == 0 && str == ""){ //最初の行が空文字
                            str = 'l'; //ダミーとして幅の狭い一文字を設定
                            vacantStarted = true;
                        }
                        if(i == (lfSeparatedStrings.length - 1) && str == ""){ //最後の行が空文字
                            str = 'l'; //ダミーとして幅の狭い一文字を設定
                            vacantEnded = true;
                        }

                        //行に対する表示位置調整
                        var em = (valOfLineHightInText * numOfVacantLines + (i>0 ? valOfLineHightInText : 0)) + "em";
                        if(str == ""){ //空行の場合
                            numOfVacantLines++;
                        }else{
                            numOfVacantLines = 0;
                        }

                        //draw 1 line
                        $3SVGnodeElem_text.append("tspan")
                            .attr("x", bindedData.coordinate.x)
                            .attr("dy", em)
                            .text(str);
                    }
                }

                reportObj.PrevObj.text.text_content = prevTxt;
                reportObj.RenderedObj.text.text_content = renderByThisObj.text.text_content;
                bindedData.text.text_content = renderByThisObj.text.text_content;
                haveToUpdateFrame = true;
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_content"), 1); //未処理プロパティリストから削除
        }

        //テキスト座標更新
        if(typeof (renderByThisObj.coordinate) != 'undefined'){
            if(typeof (renderByThisObj.coordinate.x) != 'undefined'){ //x座標指定オブジェクトがあり

                //変更前状態を取得
                var prevX = $3SVGnodeElem_text.attr("x");
                
                if(typeof (renderByThisObj.coordinate.x) != 'number'){ //型がnumberでない場合
                    var wrn = "Wrong type specified in \`renderByThisObj.coordinate.x\`. " +
                            "specified type:\`" + (typeof (renderByThisObj.coordinate.x)) + "\`, expected type:\`number\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.coordinate.x = wrn;
                
                }else{ //型がnumber
                    $3SVGnodeElem_text.attr("x", renderByThisObj.coordinate.x);

                    //<tspan>要素に対するx座標指定
                    $3SVGnodeElem_text.selectAll("tspan")
                        .attr("x", renderByThisObj.coordinate.x);
                    
                    if(prevX !== null){
                        prevX = parseFloat(prevX);
                    }
                    reportObj.PrevObj.coordinate.x = prevX;
                    reportObj.RenderedObj.coordinate.x = renderByThisObj.coordinate.x;
                    bindedData.coordinate.x = renderByThisObj.coordinate.x; //todo <- d3.js に任せられるかどうか
                    haveToUpdateFrame = true;
                }
            }

            if(typeof (renderByThisObj.coordinate.y) != 'undefined'){ //y座標指定があり

                //変更前状態を取得
                var prevY = $3SVGnodeElem_text.attr("y");

                if(typeof (renderByThisObj.coordinate.y) != 'number'){ //型がnumberでない場合
                    var wrn = "Wrong type specified in \`renderByThisObj.coordinate.y\`. " +
                            "specified type:\`" + (typeof (renderByThisObj.coordinate.y)) + "\`, expected type:\`number\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.coordinate.y = wrn;

                }else{ //型がnumber
                    $3SVGnodeElem_text.attr("y", renderByThisObj.coordinate.y);

                    if(prevY !== null){
                        prevY = parseFloat(prevY);
                    }
                    reportObj.PrevObj.coordinate.y = prevY;
                    reportObj.RenderedObj.coordinate.y = renderByThisObj.coordinate.y;
                    bindedData.coordinate.y = renderByThisObj.coordinate.y; //todo <- d3.js に任せられるかどうか
                    haveToUpdateFrame = true;
                }
            }
        }

        //テキストの右寄せ・中央寄せ・左寄せ
        if(typeof renderByThisObj.text.text_anchor != 'undefined'){ //text-anchor指定有り

            //変更前状態を取得
            var prevTextAnchor = inlineStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor");
            if(prevTextAnchor == ""){ //空文字のの場合
                prevTextAnchor = null;
            }

            if(renderByThisObj.text.text_anchor === null){ //削除指定の場合
                $3SVGnodeElem_text.style("text-anchor", null);

                reportObj.PrevObj.text.text_anchor = prevTextAnchor;
                reportObj.RenderedObj.text.text_anchor = null;
                delete bindedData.text.text_anchor;
                haveToUpdateFrame = true;

            }else if(typeof renderByThisObj.text.text_anchor != 'string'){ //型がstringでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_anchor\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_anchor)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_anchor = wrn;
            
            }else{ //型がstring
                var applyThisTextAnchor = renderByThisObj.text.text_anchor.toLowerCase();
                $3SVGnodeElem_text.style("text-anchor", applyThisTextAnchor);
                
                //適用可否チェック
                if(applyThisTextAnchor != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor").toLowerCase()){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.text_anchor\` did not applied. " +
                            "specified style:\`" + renderByThisObj.text.text_anchor + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor") + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_anchor = wrn;

                    $3SVGnodeElem_text.style("text-anchor", prevTextAnchor); //変更前の状態に戻す

                }else{ //適用された場合
                    reportObj.PrevObj.text.text_anchor = prevTextAnchor;
                    reportObj.RenderedObj.text.text_anchor = applyThisTextAnchor;
                    bindedData.text.text_anchor = applyThisTextAnchor;
                    haveToUpdateFrame = true;
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_anchor"), 1); //未処理プロパティリストから削除
        }

        //font-family
        if(typeof renderByThisObj.text.text_font_family != 'undefined'){ //font-family指定有り

            //変更前状態を取得
            var prevFontFamily = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-family");
            if(prevFontFamily == ""){ //未設定の場合
                prevFontFamily = null;
            }

            if(renderByThisObj.text.text_font_family === null){ //削除指定の場合
                $3SVGnodeElem_text.style("font-family", null);
                
                reportObj.PrevObj.text.text_font_family = prevFontFamily;
                reportObj.RenderedObj.text.text_font_family = null;
                delete bindedData.text.text_font_family;
                haveToUpdateFrame = true;

            }else if(typeof renderByThisObj.text.text_font_family != 'string'){ //型がstringでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_family\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_font_family)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_family = wrn;

            }else{ //型がstring
                var applyThisFontFamily = (renderByThisObj.text.text_font_family).replace(/\"/g, "'"); //スペースを含むフォントの引用符をsingle quoteに統一
                $3SVGnodeElem_text.style("font-family", applyThisFontFamily);
                
                //適用可否チェック
                var appliedFontFamily = (computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family")).replace(/\"/g, "'");
                if(applyThisFontFamily != appliedFontFamily){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.text_font_family\` did not applied. " +
                            "specified style:\`" + applyThisFontFamily + "\`, browser applied style:\`" + appliedFontFamily + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_font_family = wrn;

                    $3SVGnodeElem_text.style("font-family", prevFontFamily); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.text_font_family = prevFontFamily;
                    reportObj.RenderedObj.text.text_font_family = applyThisFontFamily; //inline styleに適用するために整形した状態の文字列を格納する
                    bindedData.text.text_font_family = applyThisFontFamily;
                    haveToUpdateFrame = true;
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_family"), 1); //未処理プロパティリストから削除
        }

        //font-size
        if(typeof renderByThisObj.text.text_font_size != 'undefined'){ //font-size指定有り

            //変更前状態を取得
            var prevFontSize = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
            if(prevFontSize == ""){
                prevFontSize = null;
            }

            if(renderByThisObj.text.text_font_size === null){ //削除指定の場合
                $3SVGnodeElem_text.style("font-size", null);

                if(prevFontSize !== null){
                    prevFontSize = parseFloat(prevFontSize);
                }
                reportObj.PrevObj.text.text_font_size = prevFontSize;
                reportObj.RenderedObj.text.text_font_size = null;
                delete bindedData.text.text_font_size;
                haveToUpdateFrame = true;

            }else if(typeof renderByThisObj.text.text_font_size != 'number'){ //型がnumberでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_size\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_font_size)) + "\`, expected type:\`number\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_size = wrn;
            
            }else{ //型がnumber
                var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
                var applyThisFontSize = renderByThisObj.text.text_font_size + "px";

                if(!(pixcelNumberRegex.test(applyThisFontSize))){ //指定数値が `0.0px`形式にならない場合(ex: NaNを指定)
                    var wrn = "Invalid Number \`" + renderByThisObj.text.text_font_size.toString() + "\` specified.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_font_size = wrn;
                }else{
                    $3SVGnodeElem_text.style("font-size", applyThisFontSize);

                    //適用可否チェック
                    var appliedFontSize = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
    
                    if(!(pixcelNumberRegex.test(appliedFontSize))){ // `0.0px`形式に設定できていない場合
                                                                    // 指数表記になるような極端な数値も、このルートに入る
    
                        var wrn = "Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                                "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.";
                        console.warn(wrn);
                        reportObj.FailuredMessages.text.text_font_size = wrn;
    
                        $3SVGnodeElem_text.style("font-size", prevFontSize); //変更前の状態に戻す
    
                    }else{
                        if( Math.abs(parseFloat(appliedFontSize) - renderByThisObj.text.text_font_size) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                            var wrn = "Specified style in \`renderByThisObj.text.text_font_size\` did not applied. " +
                                    "specified style:\`" + applyThisFontSize + "\`, browser applied style:\`" + appliedFontSize + "\`.";
                            console.warn(wrn);
                            reportObj.FailuredMessages.text.text_font_size = wrn;
    
                            $3SVGnodeElem_text.style("font-size", prevFontSize); //変更前の状態に戻す
                        
                        }else{ //適用された場合
                            if(prevFontSize !== null){
                                prevFontSize = parseFloat(prevFontSize);
                            }
                            reportObj.PrevObj.text.text_font_size = prevFontSize;
                            reportObj.RenderedObj.text.text_font_size = renderByThisObj.text.text_font_size;
                            bindedData.text.text_font_size = renderByThisObj.text.text_font_size;
                            haveToUpdateFrame = true;
                        }
                    }
                }
            }
            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_size"), 1); //未処理プロパティリストから削除
        }

        //font-weight
        if(typeof renderByThisObj.text.text_font_weight != 'undefined'){ //font-weight指定有り

            //変更前状態を取得
            var prevFontWeight = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
            if(prevFontWeight == ""){ //未設定の場合
                prevFontWeight = null;
            }

            if(renderByThisObj.text.text_font_weight === null){ //削除指定の場合
                $3SVGnodeElem_text.style("font-weight", null);

                reportObj.PrevObj.text.text_font_weight = prevFontWeight;
                reportObj.RenderedObj.text.text_font_weight = null;
                delete bindedData.text.text_font_weight;
                haveToUpdateFrame = true;

            }else if(typeof renderByThisObj.text.text_font_weight != 'string'){ //型がstringでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_weight\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_font_weight)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_weight = wrn;
            
            }else{ //型はstring
                $3SVGnodeElem_text.style("font-weight", renderByThisObj.text.text_font_weight);

                //適用可否確認用文字列生成
                var applyThisFontWeight = renderByThisObj.text.text_font_weight;
                if(applyThisFontWeight == "bold"){
                    applyThisFontWeight = "700";

                }else if(applyThisFontWeight == "normal"){
                    applyThisFontWeight = "400";
                }
                var appliedFontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
                if(appliedFontWeight == "bold"){
                    appliedFontWeight = "700";

                }else if(appliedFontWeight == "normal"){
                    appliedFontWeight = "400";
                }

                //適用可否チェック
                if(applyThisFontWeight != appliedFontWeight){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.text_font_weight\` did not applied. " +
                            "specified style:\`" + applyThisFontWeight + "\`, browser applied style:\`" + appliedFontWeight + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_font_weight = wrn;

                    $3SVGnodeElem_text.style("font-weight", prevFontWeight); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.text_font_weight = prevFontWeight;
                    reportObj.RenderedObj.text.text_font_weight = renderByThisObj.text.text_font_weight;
                    bindedData.text.text_font_weight = renderByThisObj.text.text_font_weight;
                    haveToUpdateFrame = true;
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_weight"), 1); //未処理プロパティリストから削除
        }

        //font-style
        if(typeof renderByThisObj.text.text_font_style != 'undefined'){ //font-style指定有り

            //変更前状態を取得
            var prevFontStyle = inlineStyleOf_SVGnodeElem_text.getPropertyValue("font-style");
            if(prevFontStyle == ""){ //未設定の場合
                prevFontStyle = null;
            }

            if(renderByThisObj.text.text_font_style === null){ //削除指定の場合
                $3SVGnodeElem_text.style("font-style", null);

                reportObj.PrevObj.text.text_font_style = prevFontStyle;
                reportObj.RenderedObj.text.text_font_style = null;
                delete bindedData.text.text_font_style;
                haveToUpdateFrame = true;

            }else if(typeof renderByThisObj.text.text_font_style != 'string'){ //型がstringでない
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_font_style\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_font_style)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_font_style = wrn;
            
            }else{ //型はstring
                $3SVGnodeElem_text.style("font-style", renderByThisObj.text.text_font_style);

                //適用可否チェック
                if(renderByThisObj.text.text_font_style != computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style")){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.text_font_style\` did not applied. " +
                            "specified style:\`" + renderByThisObj.text.text_font_style + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style") + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_font_style = wrn;

                    $3SVGnodeElem_text.style("font-style", prevFontStyle); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.text_font_style = prevFontStyle;
                    reportObj.RenderedObj.text.text_font_style = renderByThisObj.text.text_font_style;
                    bindedData.text.text_font_style = renderByThisObj.text.text_font_style;
                    haveToUpdateFrame = true;
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_font_style"), 1); //未処理プロパティリストから削除
        }

        //text-decoration
        if(typeof renderByThisObj.text.text_text_decoration != 'undefined'){ //text-decoration指定有り

            //変更前状態を取得
            var prevTextDeco = inlineStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");
            if(prevTextDeco == ""){ //未設定の場合
                prevTextDeco = null;
            }

            if(renderByThisObj.text.text_text_decoration === null){ //削除指定の場合
                $3SVGnodeElem_text.style("text-decoration", null);

                reportObj.PrevObj.text.text_text_decoration = prevTextDeco;
                reportObj.RenderedObj.text.text_text_decoration = null;
                delete bindedData.text.text_text_decoration;
                haveToUpdateFrame = true;

            }else if(typeof renderByThisObj.text.text_text_decoration != 'string'){ //型がstringでない
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_text_decoration\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_text_decoration)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_text_decoration = wrn;
            
            }else{ //型はstring
                $3SVGnodeElem_text.style("text-decoration", renderByThisObj.text.text_text_decoration);

                //適用可否チェック
                if(renderByThisObj.text.text_text_decoration != computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration")){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.text_text_decoration\` did not applied. " +
                            "specified style:\`" + renderByThisObj.text.text_text_decoration + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration") + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_text_decoration = wrn;

                    $3SVGnodeElem_text.style("text-decoration", prevTextDeco); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.text_text_decoration = prevTextDeco;
                    reportObj.RenderedObj.text.text_text_decoration = renderByThisObj.text.text_text_decoration;
                    bindedData.text.text_text_decoration = renderByThisObj.text.text_text_decoration;
                    haveToUpdateFrame = true;
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_text_decoration"), 1); //未処理プロパティリストから削除
        }

        //テキストの色
        if(typeof renderByThisObj.text.text_fill != 'undefined'){ //text fill指定有り

            //変更前状態を取得
            var prevTextFill = inlineStyleOf_SVGnodeElem_text.getPropertyValue("fill");
            if(prevTextFill == ""){ //未設定の場合
                prevTextFill = null;
            }

            if(renderByThisObj.text.text_fill === null){ //削除指定の場合
                $3SVGnodeElem_text.style("fill", null);

                reportObj.PrevObj.text.text_fill = prevTextFill;
                reportObj.RenderedObj.text.text_fill = null;
                delete bindedData.text.text_fill;
                //haveToUpdateFrame = true; //<- not needed

            }else if(typeof renderByThisObj.text.text_fill != 'string'){ //型がstringでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.text_fill\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.text_fill)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.text_fill = wrn;
            
            }else{ //型はstring
                $3SVGnodeElem_text.style("fill", renderByThisObj.text.text_fill);

                //適用可否チェック
                if(renderByThisObj.text.text_fill != computedStyleOf_SVGnodeElem_text.getPropertyValue("fill")){ //computed styleに適用されなかった場合
                    var wrn  = "Specified style in \`renderByThisObj.text.text_fill\` did not applied. " +
                            "specified style:\`" + renderByThisObj.text.text_fill + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_text.getPropertyValue("fill") + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.text_fill = wrn;

                    $3SVGnodeElem_text.style("fill", prevTextFill); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.text_fill = prevTextFill;
                    reportObj.RenderedObj.text.text_fill = renderByThisObj.text.text_fill;
                    bindedData.text.text_fill= renderByThisObj.text.text_fill;
                    //haveToUpdateFrame = true; //<- not needed
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("text_fill"), 1); //未処理プロパティリストから削除
        }

        var prevShape;

        //frame存在チェック
        if(!($3SVGnodeElem_DOTframe.node().firstChild)){ //frameの描画要素が存在しない場合(= 1回目の描画の場合)
            $3SVGnodeElem_DOTframe.append(defaultTextFrameShape);
            bindedData.$3bindedSelectionLayerSVGElement.append(defaultTextFrameShape); //SelectionLayerも追加
            prevShape = null;

            haveToUpdateFrame = true;

        }else{ //frameの描画要素が存在しない場合(= 2回目以降の描画の場合)
            
            if(typeof bindedData.text.frame_shape == 'undefined'){ //前回は未指定の場合
                prevShape = null;
            }else{
                prevShape = bindedData.text.frame_shape;
            }
        }

        //frame設定変更によるframe自体の再描画要否チェック
        
        //枠
        if(typeof renderByThisObj.text.frame_shape != 'undefined'){ //frame shape指定有り
            haveToUpdateFrame = true;
        }

        //frame_stroke_width
        if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
            haveToUpdateFrame = true;
        }

        var $3SVGnodeElem_DOTframe_frame = d3.select($3SVGnodeElem_DOTframe.node().firstChild);
        var prevStrokeWidth;

        //枠
        if(haveToUpdateFrame){

            //stroke-width設定の抽出
            var pxNumOfStrokeWidth;
            if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り

                //変更前状態を取得
                var inlineStyleOf_SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe_frame.node().style;
                prevStrokeWidth = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
                if(prevStrokeWidth == ""){
                    prevStrokeWidth = null;
                }

                if(renderByThisObj.text.frame_stroke_width === null){ //削除指定の場合
                    $3SVGnodeElem_DOTframe_frame.style("stroke-width", null); //`window.getComputedStyle` 出来るようにする為、削除だけ先に行う

                }else if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合

                    //nothing to do
                    //※エラーレポート処理はstroke-width描画処理内で行う※

                }else{ //型はnumber
                    var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
                    var applyThisFontSize = renderByThisObj.text.frame_stroke_width + "px";

                    if(pixcelNumberRegex.test(applyThisFontSize)){ //`0.0px`形式の場合
                        pxNumOfStrokeWidth = parseFloat(renderByThisObj.text.frame_stroke_width);
                    }
                }
            }
            
            if(typeof (pxNumOfStrokeWidth) == 'undefined'){ //レンダー指定オブジェクト内に有効なstroke-widthがない

                //ブラウザ適用済みスタイルからstroke-widthを抽出する
                var appliedStrokeWidth = window.getComputedStyle($3SVGnodeElem_DOTframe.node().firstChild).getPropertyValue("stroke-width");
                
                // `0.0px`形式に設定できていない場合
                var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
                if(!(pixcelNumberRegex.test(appliedStrokeWidth))){ // `0.0px`形式に設定できていない場合
                                                                // 指数表記になるような極端な数値も、このルートに入る
                                                                    
                    console.warn("Unable to detect pxcel size from applied \'stroke-width\`. " +
                                "applied style:\`" + appliedStrokeWidth + "\`, browser applied style:\`" + appliedFontSize + "\`.");
                    
                    pxNumOfStrokeWidth = 0; //0pxとして扱う
                
                }else{ // `0.0px`形式の場合場合
                    pxNumOfStrokeWidth = parseFloat(appliedStrokeWidth);
                }
            }

            var SVGnodeElem_text = $3SVGnodeElem_text.node();
            var SVGnodeElem_text_tspans = SVGnodeElem_text.childNodes;

            var textRectArea = {};

            //<text>の占有矩形エリアの算出
            if(SVGnodeElem_text_tspans.length == 1 &&
            SVGnodeElem_text_tspans[0].textContent == ""){ //空文字の場合
            
                textRectArea.x = parseFloat($3SVGnodeElem_text.attr("x"));
                textRectArea.y = parseFloat($3SVGnodeElem_text.attr("y"));
                textRectArea.width = 0;
                textRectArea.height = 0;

            }else{ //<text>が空ではない場合

                textRectArea.x = SVGnodeElem_text.getBBox().x;
                textRectArea.y = SVGnodeElem_text.getBBox().y;
                textRectArea.width = SVGnodeElem_text.getBBox().width;
                textRectArea.height = SVGnodeElem_text.getBBox().height;
                
            }

            var rerender = false;
            
            if(typeof renderByThisObj.text.frame_shape != 'undefined'){ //frame shape指定有り

                //変更前状態はframe存在チェックの時に実施済み
                
                if(typeof renderByThisObj.text.frame_shape != 'string' && renderByThisObj.text.frame_shape !== null){ //型がstringでない
                    var wrn = "Wrong type specified in \`renderByThisObj.text.frame_shape\`. " +
                            "specified type:\`" + (typeof (renderByThisObj.text.frame_shape)) + "\`, expected type:\`string\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.frame_shape = wrn;

                    rerender = true;
                
                }else{ //型はstring

                    //frameオブジェクト削除前に、描画済みスタイルをバックアップ
                    var inlineStyleOf_SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe_frame.node().style;
                    var bkup_frame_stroke = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke");
                    var bkup_frame_stroke_width = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
                    var bkup_frame_stroke_dasharray = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray"); //未設定の場合は"none"が取得される
                    var bkup_frame_fill = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill");

                    //空文字(未指定)はnullに変更
                    if(bkup_frame_stroke == ""){bkup_frame_stroke = null;}
                    if(bkup_frame_stroke_width == ""){bkup_frame_stroke_width = null;}
                    if(bkup_frame_stroke_dasharray == ""){bkup_frame_stroke_dasharray = null;}
                    if(bkup_frame_fill == ""){bkup_frame_fill = null;}

                    var renderThisShape;

                    if(renderByThisObj.text.frame_shape === null){ //削除指定の場合 -> defaultShapeにする
                        renderThisShape = defaultTextFrameShape;

                    }else{ //renderingObjに指定がある場合
                        renderThisShape = renderByThisObj.text.frame_shape.toLowerCase();
                    }

                    //frame shape 変更分岐
                    switch(renderThisShape){
                            
                        case "rect":
                        {
                            //古いframeオブジェクト・SelectionLayerを削除
                            $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);
                            bindedData.$3bindedSelectionLayerSVGElement.node().removeChild(bindedData.$3bindedSelectionLayerSVGElement.node().firstChild);

                            $3SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.append("rect"); //rect追加

                            //古いframeオブジェクトでバックアップしたスタイルで回復
                            $3SVGnodeElem_DOTframe_frame.style("stroke", bkup_frame_stroke);
                            $3SVGnodeElem_DOTframe_frame.style("stroke-width", bkup_frame_stroke_width);
                            $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", bkup_frame_stroke_dasharray);
                            $3SVGnodeElem_DOTframe_frame.style("fill", bkup_frame_fill);

                            //サイズ調整
                            resizeTextTypeSVGNode_rectFrame($3SVGnodeElem_DOTframe_frame, //Frame
                                                            textRectArea,
                                                            valOfpadding_frame_text,
                                                            pxNumOfStrokeWidth);
                            
                            resizeTextTypeSVGNode_rectFrame(bindedData.$3bindedSelectionLayerSVGElement.append("rect"), // Selection Layer
                                                            textRectArea,
                                                            valOfpadding_frame_text,
                                                            pxNumOfStrokeWidth);
                            
                            reportObj.PrevObj.text.frame_shape = prevShape;
                            reportObj.RenderedObj.text.frame_shape = "rect";
                            bindedData.text.frame_shape = "rect";
                        }
                        break;
        
                        case "circle":
                        {
                            //古いframeオブジェクト・SelectionLayerを削除
                            $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);
                            bindedData.$3bindedSelectionLayerSVGElement.node().removeChild(bindedData.$3bindedSelectionLayerSVGElement.node().firstChild);

                            $3SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.append("circle"); //circle追加

                            //古いframeオブジェクトでバックアップしたスタイルで回復
                            $3SVGnodeElem_DOTframe_frame.style("stroke", bkup_frame_stroke);
                            $3SVGnodeElem_DOTframe_frame.style("stroke-width", bkup_frame_stroke_width);
                            $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", bkup_frame_stroke_dasharray);
                            $3SVGnodeElem_DOTframe_frame.style("fill", bkup_frame_fill);

                            //サイズ調整
                            resizeTextTypeSVGNode_circleFrame($3SVGnodeElem_DOTframe_frame, //Frame
                                                            textRectArea,
                                                            valOfpadding_frame_text,
                                                            pxNumOfStrokeWidth);

                            resizeTextTypeSVGNode_circleFrame(bindedData.$3bindedSelectionLayerSVGElement.append("circle"), // Selection Layer
                                                            textRectArea,
                                                            valOfpadding_frame_text,
                                                            pxNumOfStrokeWidth);

                            reportObj.PrevObj.text.frame_shape = prevShape;
                            reportObj.RenderedObj.text.frame_shape = "circle";
                            bindedData.text.frame_shape = "circle";
                        }
                        break;
        
                        case "ellipse":
                        {
                            //古いframeオブジェクト・SelectionLayerを削除
                            $3SVGnodeElem_DOTframe.node().removeChild($3SVGnodeElem_DOTframe.node().firstChild);
                            bindedData.$3bindedSelectionLayerSVGElement.node().removeChild(bindedData.$3bindedSelectionLayerSVGElement.node().firstChild);

                            $3SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.append("ellipse"); //ellipse追加

                            //古いframeオブジェクトでバックアップしたスタイルで回復
                            $3SVGnodeElem_DOTframe_frame.style("stroke", bkup_frame_stroke);
                            $3SVGnodeElem_DOTframe_frame.style("stroke-width", bkup_frame_stroke_width);
                            $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", bkup_frame_stroke_dasharray);
                            $3SVGnodeElem_DOTframe_frame.style("fill", bkup_frame_fill);

                            //サイズ調整
                            resizeTextTypeSVGNode_ellipseFrame($3SVGnodeElem_DOTframe_frame, // Frame
                                                            textRectArea,
                                                            valOfpadding_frame_text,
                                                            pxNumOfStrokeWidth);

                            resizeTextTypeSVGNode_ellipseFrame(bindedData.$3bindedSelectionLayerSVGElement.append("ellipse"), // Selection Layer
                                                            textRectArea,
                                                            valOfpadding_frame_text,
                                                            pxNumOfStrokeWidth);

                            reportObj.PrevObj.text.frame_shape = prevShape;
                            reportObj.RenderedObj.text.frame_shape = "ellipse";
                            bindedData.text.frame_shape = "ellipse";
                        }
                        break;
        
                        default:
                        {
                            var wrn = "Unknown shape \`" + renderByThisObj.text.frame_shape + "\` specified in \`renderByThisObj.text.frame_shape\`. ";
                            console.warn(wrn);
                            reportObj.FailuredMessages.text.frame_shape = wrn;

                            rerender = true;
                        }
                        break;
                    }

                    if(renderByThisObj.text.frame_shape === null){ //削除指定の場合
                        reportObj.RenderedObj.text.frame_shape = null;
                        delete bindedData.text.frame_shape;
                    }
                }

                untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_shape"), 1); //未処理プロパティリストから削除

            }else{ //frame shape指定無し
                rerender = true;
            }

            if(rerender){
                
                //古いframe要素を再調整
                var SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe.node().firstChild;
                var SVGnodeElem_SelectionLayer = bindedData.$3bindedSelectionLayerSVGElement.node().firstChild;
                switch(SVGnodeElem_DOTframe_frame.tagName.toLowerCase()){
                    case "rect":
                    {
                        //リサイズ Frame and Selection Layer
                        resizeTextTypeSVGNode_rectFrame(d3.select(SVGnodeElem_DOTframe_frame), // Frame
                                                        textRectArea,
                                                        valOfpadding_frame_text,
                                                        pxNumOfStrokeWidth);

                        resizeTextTypeSVGNode_rectFrame(d3.select(SVGnodeElem_SelectionLayer), // Selection Layer
                                                        textRectArea,
                                                        valOfpadding_frame_text,
                                                        pxNumOfStrokeWidth);
                    }
                    break;

                    case "circle":
                    {
                        //リサイズ Frame and Selection Layer
                        resizeTextTypeSVGNode_circleFrame(d3.select(SVGnodeElem_DOTframe_frame), // Frame
                                                        textRectArea,
                                                        valOfpadding_frame_text,
                                                        pxNumOfStrokeWidth);

                        resizeTextTypeSVGNode_circleFrame(d3.select(SVGnodeElem_SelectionLayer), // Selection Layer
                                                        textRectArea,
                                                        valOfpadding_frame_text,
                                                        pxNumOfStrokeWidth);
                    }
                    break;

                    case "ellipse":
                    {
                        //リサイズ Frame and Selection Layer
                        resizeTextTypeSVGNode_ellipseFrame(d3.select(SVGnodeElem_DOTframe_frame), // Frame
                                                        textRectArea,
                                                        valOfpadding_frame_text,
                                                        pxNumOfStrokeWidth);

                        resizeTextTypeSVGNode_ellipseFrame(d3.select(SVGnodeElem_SelectionLayer), // Selection Layer
                                                        textRectArea,
                                                        valOfpadding_frame_text,
                                                        pxNumOfStrokeWidth);
                    }
                    break;

                    default:
                    break; // nothing to do
                }
            }
        }

        //最初の行or最後の行が空文字の場合に挿入したダミー文字を削除する
        if(vacantStarted){ //最初の行にダミー文字を入れていた時
            $3SVGnodeElem_text.node().firstChild.textContent = "";
        }
        if(vacantEnded){ //最後の行にダミー文字を入れていた時
            $3SVGnodeElem_text.node().lastChild.textContent = "";
        }

        $3SVGnodeElem_DOTframe_frame = d3.select($3SVGnodeElem_DOTframe.node().firstChild); //frame の変更で削除されることがあるので、取得し直す。
        var inlineStyleOf_SVGnodeElem_DOTframe_frame = $3SVGnodeElem_DOTframe_frame.node().style;
        var computedStyleOf_SVGnodeElem_DOTframe_frame = window.getComputedStyle($3SVGnodeElem_DOTframe_frame.node());

        //枠線の太さ
        if(typeof renderByThisObj.text.frame_stroke_width != 'undefined'){ //frame stroke-width指定有り
            
            if(renderByThisObj.text.frame_stroke_width === null){ //削除指定の場合
                
                //$3SVGnodeElem_DOTframe_frame.style("stroke-width", null); // <- not nedded.
                                                                            // `window.getComputedStyle` 出来るようにする為、削除だけ先に行った為

                if(prevStrokeWidth !== null){
                    prevStrokeWidth = parseFloat(prevStrokeWidth);
                }
                reportObj.PrevObj.text.frame_stroke_width = prevStrokeWidth;
                reportObj.RenderedObj.text.frame_stroke_width = null;
                delete bindedData.text.frame_stroke_width;

            }else if(typeof renderByThisObj.text.frame_stroke_width != 'number'){ //型がnumberでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.frame_stroke_width\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_width)) + "\`, expected type:\`number\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_stroke_width = wrn;

            }else{ //型はnumber
                var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
                var applyThisStrokeWidth = renderByThisObj.text.frame_stroke_width + "px";

                if(!(pixcelNumberRegex.test(applyThisStrokeWidth))){ //指定数値が `0.0px`形式にならない場合(ex: NaNを指定)
                    var wrn = "Invalid Number \`" + renderByThisObj.text.frame_stroke_width.toString() + "\` specified.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.frame_stroke_width = wrn;

                }else{
                    $3SVGnodeElem_DOTframe_frame.style("stroke-width", applyThisStrokeWidth);

                    //適用可否チェック
                    var appliedStrokeWidth = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width");
                    

                    if(!(pixcelNumberRegex.test(appliedStrokeWidth))){ // `0.0px`形式に設定できていない場合
                                                                    // 指数表記になるような極端な数値も、このルートに入る
                        
                        var wrn = "Specified style in \`renderByThisObj.text.frame_stroke_width\` did not applied. " +
                                "specified style:\`" + applyThisStrokeWidth + "\`, browser applied style:\`" + appliedStrokeWidth + "\`.";
                        console.warn(wrn);
                        reportObj.FailuredMessages.text.frame_stroke_width = wrn;

                        $3SVGnodeElem_DOTframe_frame.style("stroke-width", prevStrokeWidth); //変更前の状態に戻す
                    
                    }else{
                        if( Math.abs(parseFloat(appliedStrokeWidth) - renderByThisObj.text.frame_stroke_width) >= 0.1){ //適用されたfont-sizeと指定したfont-sizeの差分が大きすぎる
                            var wrn = "Specified style in \`renderByThisObj.text.frame_stroke_width\` did not applied. " +
                                    "specified style:\`" + applyThisStrokeWidth + "\`, browser applied style:\`" + appliedStrokeWidth + "\`.";
                            console.warn(wrn);
                            reportObj.FailuredMessages.text.frame_stroke_width = wrn;

                            $3SVGnodeElem_DOTframe_frame.style("stroke-width", prevStrokeWidth); //変更前の状態に戻す
                        
                        }else{ //適用された場合
                            if(prevStrokeWidth !== null){
                                prevStrokeWidth = parseFloat(prevStrokeWidth);
                            }
                            reportObj.PrevObj.text.frame_stroke_width = prevStrokeWidth;
                            reportObj.RenderedObj.text.frame_stroke_width = renderByThisObj.text.frame_stroke_width;
                            bindedData.text.frame_stroke_width = renderByThisObj.text.frame_stroke_width;
                        }
                    }
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_stroke_width"), 1); //未処理プロパティリストから削除
        }

        //枠線の色
        if(typeof renderByThisObj.text.frame_stroke != 'undefined'){ //frame stroke指定有り

            //変更前状態を取得
            var prevStroke = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke");
            if(prevStroke == ""){
                prevStroke = null;
            }

            if(renderByThisObj.text.frame_stroke === null){ //削除指定の場合
                $3SVGnodeElem_DOTframe_frame.style("stroke", null);

                reportObj.PrevObj.text.frame_stroke = prevStroke;
                reportObj.RenderedObj.text.frame_stroke = null;
                delete bindedData.text.frame_stroke;

            }else if(typeof renderByThisObj.text.frame_stroke != 'string'){ //型がstringでない場合
                var wrn = "Wrong type specified in \`renderByThisObj.text.frame_stroke\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_stroke = wrn;
            
            }else{ //型はstring
                $3SVGnodeElem_DOTframe_frame.style("stroke", renderByThisObj.text.frame_stroke);

                //適用可否チェック
                if(renderByThisObj.text.frame_stroke != computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke")){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.frame_stroke\` did not applied. " +
                            "specified style:\`" + renderByThisObj.text.frame_stroke + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke") + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.frame_stroke = wrn;

                    $3SVGnodeElem_DOTframe_frame.style("stroke", prevStroke); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.frame_stroke = prevStroke;
                    reportObj.RenderedObj.text.frame_stroke = renderByThisObj.text.frame_stroke;
                    bindedData.text.frame_stroke = renderByThisObj.text.frame_stroke;
                }

            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_stroke"), 1); //未処理プロパティリストから削除
        }
        
        //枠線の破線パターン
        if(typeof renderByThisObj.text.frame_stroke_dasharray != 'undefined'){ //frame stroke-dasharray指定有り

            //変更前状態を取得
            var prevDashArr = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
            if(prevDashArr == ""){
                prevDashArr = null;
            }

            if(renderByThisObj.text.frame_stroke_dasharray === null){ //削除指定の場合
                $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", null);

                reportObj.PrevObj.text.frame_stroke_dasharray = prevDashArr;
                reportObj.RenderedObj.text.frame_stroke_dasharray = null;
                delete bindedData.text.frame_stroke_dasharray;

            }else if(typeof renderByThisObj.text.frame_stroke_dasharray != 'string'){ //型がstringでない場合
                var wrn =  "Wrong type specified in \`renderByThisObj.text.frame_stroke_dasharray\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.frame_stroke_dasharray)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_stroke_dasharray = wrn;
            
            }else{ //型はstring
                var applyThisStrokeDasharray = renderByThisObj.text.frame_stroke_dasharray;
                //"px"とスペースは無視する
                applyThisStrokeDasharray = applyThisStrokeDasharray.replace(/px/g, "");
                applyThisStrokeDasharray = applyThisStrokeDasharray.replace(/ /g, "");

                $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", applyThisStrokeDasharray);

                //適用可否チェック
                var appliedStrokeDasharray = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
                appliedStrokeDasharray = appliedStrokeDasharray.replace(/px/g, ""); //"px"とスペースは無視する
                appliedStrokeDasharray = appliedStrokeDasharray.replace(/ /g, "");

                if(applyThisStrokeDasharray != appliedStrokeDasharray){ //computed styleに適用されなかった場合
                    var wrn  = "Specified style in \`renderByThisObj.text.frame_stroke_dasharray\` did not applied. " +
                            "specified style:\`" + applyThisStrokeDasharray + "\`, browser applied style:\`" + appliedStrokeDasharray + "\`.";
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.frame_stroke_dasharray = wrn;

                    $3SVGnodeElem_DOTframe_frame.style("stroke-dasharray", prevDashArr); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.frame_stroke_dasharray = prevDashArr;
                    reportObj.RenderedObj.text.frame_stroke_dasharray = applyThisStrokeDasharray; //inline styleに適用するために整形した状態の文字列を格納する
                    bindedData.text.frame_stroke_dasharray = applyThisStrokeDasharray;
                }

            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_stroke_dasharray"), 1); //未処理プロパティリストから削除
        }
        
        //背景色
        if(typeof renderByThisObj.text.frame_fill != 'undefined'){ //frame fill指定有り

            var prevFramefill = inlineStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill");
            if(prevFramefill == ""){
                prevFramefill = null;
            }

            if(renderByThisObj.text.frame_fill === null){ //削除指定の場合
                $3SVGnodeElem_DOTframe_frame.style("fill", null);

                reportObj.PrevObj.text.frame_fill = prevFramefill;
                reportObj.RenderedObj.text.frame_fill = null;
                delete bindedData.text.frame_fill;

            }else if(typeof renderByThisObj.text.frame_fill != 'string'){ //型がstringでない場合
                var wrn  = "Wrong type specified in \`renderByThisObj.text.frame_fill\`. " +
                        "specified type:\`" + (typeof (renderByThisObj.text.frame_fill)) + "\`, expected type:\`string\`.";
                console.warn(wrn);
                reportObj.FailuredMessages.text.frame_fill = wrn;
            
            }else{ //型はstring
                $3SVGnodeElem_DOTframe_frame.style("fill", renderByThisObj.text.frame_fill);

                //適用可否チェック
                if(renderByThisObj.text.frame_fill != computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill")){ //computed styleに適用されなかった場合
                    var wrn = "Specified style in \`renderByThisObj.text.frame_fill\` did not applied. " +
                            "specified style:\`" + renderByThisObj.text.frame_fill + "\`, browser applied style:\`" + computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill") + "\`."; 
                    console.warn(wrn);
                    reportObj.FailuredMessages.text.frame_fill = wrn;

                    $3SVGnodeElem_DOTframe_frame.style("fill", prevFramefill); //変更前の状態に戻す
                
                }else{ //適用された場合
                    reportObj.PrevObj.text.frame_fill = prevFramefill;
                    reportObj.RenderedObj.text.frame_fill = renderByThisObj.text.frame_fill;
                    bindedData.text.frame_fill = renderByThisObj.text.frame_fill;
                }
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("frame_fill"), 1); //未処理プロパティリストから削除
        }

        //Unkdown Propertyに対する警告
        untreatedPropertyNames.forEach(function(propertyName,idx){
            var wrn = "Unkdown Property \`text." + propertyName + "\` specified.";
            console.warn(wrn);
            reportObj.FailuredMessages.text[propertyName] = wrn;
        });

        //変更レポート用警告チェック
        if(Object.keys(reportObj.FailuredMessages.text).length > 0 ||
        Object.keys(reportObj.FailuredMessages.coordinate).length > 0){ //警告が1つ以上ある場合
            reportObj.allOK = false;
        }
        if(Object.keys(reportObj.RenderedObj.text).length > 0 ||
        Object.keys(reportObj.RenderedObj.coordinate).length > 0){ //成功が1つ以上ある場合
            reportObj.allNG = false;
        }

        //変更レポートを返却
        return reportObj;
    }

    //
    //オブジェクトをマージする
    //
    function mergeObj(fromThisObj, toThisObj, ifOnlyNotExists){
        
        var propNames = Object.keys(fromThisObj);

        //プロパティループ
        propNames.forEach(function(propName, idx){

            var isObj = false;

            if(typeof fromThisObj[propName] == 'object'){ //`typeof` 判定が `object` の場合

                if((fromThisObj[propName] === null) || //nullの場合
                (Array.isArray(fromThisObj[propName]))){ //Arrayの場合
                    isObj = false;
                }else{
                    isObj = true;
                }

            }

            if(isObj){ //オブジェクトの場合
                if(typeof toThisObj[propName] == 'undefined'){ //マージ先に未定義の場合
                    toThisObj[propName] = {}; //空オブジェクトを作る
                }

                mergeObj(fromThisObj[propName], toThisObj[propName], ifOnlyNotExists); //再帰処理

            }else{ //オブジェクトでない場合

                if(ifOnlyNotExists){ //マージ先にpropertyが存在しないときだけ上書きする指定の場合
                    if(typeof toThisObj[propName] == 'undefined'){ //マージ先に存在しない場合
                        toThisObj[propName] = fromThisObj[propName];
                    }

                }else{
                    toThisObj[propName] = fromThisObj[propName];
                }
            }
        });
    }

    //指定構造のObjectを生成して返却する
    function makeNestedObj(primitiveVal, structureArr){
        
        var toRetObj = {};
        makeNestedObj_sub(primitiveVal, structureArr, toRetObj, 0);
        return toRetObj;

        function makeNestedObj_sub(primitiveVal, structureArr, makeHere, idx){
        
            if(idx == (structureArr.length-1)){ //Nest終端の場合
                makeHere[structureArr[idx]] = primitiveVal;
    
            }else{ //Nest終端でない場合
                makeHere[structureArr[idx]] = {}; //空オブジェクトを定義
    
                makeNestedObj_sub(primitiveVal, structureArr, makeHere[structureArr[idx]], idx+1);
            }
        }
    }
    
    //Objの指定部分の値を返却する
    function getValFromNestObj(structureArr, fromThisObj){
        
        return getValFromNestObj_sub(structureArr, fromThisObj, 0);

        function getValFromNestObj_sub(structureArr, fromThisObj, idx){
        
            var toRetVal;
            if(typeof fromThisObj == 'undefined'){
                return toRetVal; //'undefined'を返す
            }
    
            var testHere = fromThisObj[structureArr[idx]];
    
            if(idx == (structureArr.length-1)){
                return testHere;
            
            }else{
                return getValFromNestObj_sub(structureArr, testHere, idx+1);
            }
        }
    }
    
    function backToDefaulIfWarn(reportObj, bindedData){

        if(typeof reportObj.RenderedObj.type != 'undefined'){
            switch(reportObj.RenderedObj.type){
                case "text":
                {
                    backToDefaulIfWarn_TextType(reportObj, bindedData);
                }
                break;

                default:
                break;
            }
        }
    }

    function backToDefaulIfWarn_TextType(reportObj, bindedData){

        var propertyNames = Object.keys(reportObj.FailuredMessages.text); //Property Names Array to delete

        //text_content
        if(typeof reportObj.FailuredMessages.text.text_content != 'undefined'){
            bindedData.text.text_content = ""; //プロパティ削除ではなく、空文字にする
            propertyNames.splice("text_content",1); //プロパティ削除対象から外す
        }

        //Property削除ループ
        propertyNames.forEach(function(propertyName, idx){
            delete bindedData.text[propertyName];
        });
        
    }

    //<history関係>------------------------------------------------------------------------------------

    function appendHistory(transactionObj){

        var clicked = false;
        var previewedIndex;

        //historyの挿入チェック
        if((pointingIndexOfHistory + 1) < transactionHistory.length){ //historyの途中に挿入する場合
            deleteHistory(pointingIndexOfHistory + 1); //不要なhistoryを破棄
        }

        //現在の選択状態を解除
        $transactionHistoryElement.children('.transaction[data-history_index="' + pointingIndexOfHistory.toString() + '"]')
            .eq(0)
            .removeClass(className_nodeIsSelected);

        //
        var toSaveTransactionObj = {};
        mergeObj(transactionObj, toSaveTransactionObj, true);

        transactionHistory.push(toSaveTransactionObj); //Append History
        pointingIndexOfHistory++;

        var $3historyMessageElem = $3transactionHistoryElement.append("div")
            .classed("transaction", true)
            .classed(className_nodeIsSelected, true)
            .style("display", "none") // <- 表示用アニメーションの為に、一旦非表示にする
            .attr("data-history_index", pointingIndexOfHistory.toString());

        $3historyMessageElem.append("small")
            .text(toSaveTransactionObj.message);
        
        $($3historyMessageElem.node()).slideDown(100); // <- 表示用アニメーション
        var maxHeight = window.getComputedStyle($transactionHistoryElement.get(0)).maxHeight;
        if(maxHeight != 'none'){ //maxHeightが定義されている
            maxHeight = parseFloat(maxHeight);
            if(maxHeight < $transactionHistoryElement.get(0).scrollHeight){ //historyがmax-heightより大きい
                $transactionHistoryElement.animate({scrollTop:$transactionHistoryElement.get(0).scrollHeight}); //最下部にスクロール
            }
        }
        

        var $historyMessageElem  = $($3historyMessageElem.node());

        //transactionに対するMouseEnterイベント
        $historyMessageElem.mouseenter(function(){
            
            var thisElem = this;
            var specifiedIndex = parseInt($(thisElem).attr("data-history_index"));

            if(checkSucceededLoadOf_ExternalComponent() && nowEditng){ //property editor がload済み && 編集中の場合
                propertyEditorsManager.confirm(); //property editor内の値をロールバックしたNode状態に合わせる
            }

            $transactionHistoryElement.children('.transaction[data-history_index="' + pointingIndexOfHistory.toString() + '"]')
                .eq(0)
                .removeClass(className_nodeIsSelected); //history選択状態を解除
            thisElem.classList.add(className_nodeIsSelected); //mouseenterしたhistoryを選択
            
            replayHistory(pointingIndexOfHistory, specifiedIndex); //mouseenterしたhistoryをPreview
            
            if(checkSucceededLoadOf_ExternalComponent() && nowEditng){ //property editor がload済み && 編集中の場合
                adjustPropertyEditConsole();//property editor内の値をロールバックしたNode状態に合わせる
            }

            previewedIndex = specifiedIndex;
            
            clicked = false;
        });

        //transactionに対するクリックイベント
        $historyMessageElem.on("click",function(){
            if(!clicked){ //1回目のクリックの場合
                var thisElem = this;
                var historyIndex = parseInt($(thisElem).attr("data-history_index"));
                
                clicked = true;
                pointingIndexOfHistory = historyIndex; //history[]内の選択indexを変更
            }

        });

        //transactionに対するMouseLeaveイベント
        $historyMessageElem.mouseleave(function(){
            var thisElem = this;
            
            if(!clicked){ //クリックされていない場合
                thisElem.classList.remove(className_nodeIsSelected); //history選択状態を解除
                $transactionHistoryElement.children('.transaction[data-history_index="' + pointingIndexOfHistory.toString() + '"]')
                    .eq(0)
                    .addClass(className_nodeIsSelected); //history[]内の選択indexで選択

                replayHistory(previewedIndex, pointingIndexOfHistory); //history[]内の選択indexへもどす
                
                if(checkSucceededLoadOf_ExternalComponent() && nowEditng){ //property editor がload済み && 編集中の場合
                    adjustPropertyEditConsole();//property editor内の値をロールバックしたNode状態に合わせる
                }
            }
            
            clicked = false;
        });
    }

    function deleteHistory(fromThisIndex){
        //history[]から historyIndex+1 以降を削除
        transactionHistory.splice(fromThisIndex, transactionHistory.length - fromThisIndex);

        //history表示の削除ループ
        var siblings = $3transactionHistoryElement.node().children;
        for(var i = siblings.length - 1 ; i >= 0 ; i--){ //最終indexからデクリメントで網羅
            var historyIndex = parseInt($(siblings[i]).attr("data-history_index"));
            if(historyIndex >= fromThisIndex){ //選択したtransactionより後のhistoryだった場合
                $(siblings[i]).remove(); //history表示の削除
            }else{
                break;
            }
        }
    }

    function replayHistory(startIndex, endIndex){

        //increment / decrement 判定
        if(startIndex == endIndex){ //Replay不要の場合
            return //nothing to do

        }else if(startIndex < endIndex){ // 旧 → 新 へのReplay
            for(var i = (startIndex + 1); i <= endIndex ; i++){
                replayTransaction(transactionHistory[i]);
            }

        }else{ // 新 → 旧 へのReplay
            for(var i = startIndex; i > endIndex ; i--){
                rollbackTransaction(transactionHistory[i]);
            }

        }
    }

    function rollbackTransaction(transaction){
        rollbackOrReplayTransaction(transaction, "PrevObj");
    }

    function replayTransaction(transaction){
        rollbackOrReplayTransaction(transaction, "RenderedObj");
    }

    function rollbackOrReplayTransaction(transaction, toApplyObjName){

        var rollbackRenderringReport;
        
        //引数チェック
        if(transaction.reportsArr.length == 0){ //トランザクションレポートが存在しない
            console.warn("Specified trucsaction not contains SVG rendering report.");
            return;
        }

        switch(transaction.type){
            case 'append':
            {
                if(toApplyObjName == 'PrevObj'){ //Node追加前の状態に戻す場合 -> Nodeを削除する
                    call_deleteNodes();
                }else{ //Nodeを追加し直す場合
                    call_appendNodes();
                }
            }
            break;

            case 'delete':
            {
                if(toApplyObjName == 'PrevObj'){ //Node削除前の状態に戻す場合 -> 削除したNodeを復活させる
                    call_appendNodes();

                }else{ //Nodeを削除し直す場合
                    call_deleteNodes();
                }
            }
            break;

            case 'change':
            {
                //レンダリングレポート網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.length ; i++){
                    var reportObj = transaction.reportsArr[i];
                    var bindedData = getBindedDataFromKey(reportObj.key);

                    if(typeof bindedData == 'undefined'){ //対象のノードデータが存在しない場合
                        console.error("\`key:" + reportObj.key + "\` not found in D3.js binded data array.");

                    }else{ //対象のノードデータが存在する場合
                        rollbackRenderringReport = renderSVGNode(bindedData, reportObj[toApplyObjName]);
                    }
                }
            }
            break;

            default:
            {
                console.warn("Unknown transaction type specified.");
            }
            break;
        }

        if( (typeof rollbackRenderringReport == 'object') && (!rollbackRenderringReport.allOK)){ //ロールバックに失敗した場合
            console.error("Cannot roll back \`" + getDomPath(bindedData.$3bindedSVGElement.node()).join('/') + "\`");
        }

        function call_deleteNodes(){
            //削除対象key収集ループ
            var toDeleteKeyArr = [];
            for(var i = 0 ; i < transaction.reportsArr.length ; i++){
                var reportObj = transaction.reportsArr[i];
                toDeleteKeyArr.push(reportObj.key); //削除指定keyArrayに追加
            }
            rollbackRenderringReport = deleteNodes(toDeleteKeyArr); //Node(s)削除
        }

        function call_appendNodes(){
            //追加NodeArray生成ループ
            var toAppendObjArr = [];
            for(var i = 0 ; i < transaction.reportsArr.length ; i++){
                var reportObj = transaction.reportsArr[i];
                var toAppendObj = {};
                mergeObj(reportObj[toApplyObjName], toAppendObj, false); //オブジェクトコピー
                toAppendObj.key = reportObj.key; //キー番号をhistoryから復活させる
                toAppendObjArr.push(toAppendObj);
            }
            rollbackRenderringReport = appendNodes(toAppendObjArr); //Nodes(s)復活
        }
    }

    //-----------------------------------------------------------------------------------</history関係>

    //
    //<text>要素の占有領域サイズに合わせて<rect>を再調整する
    //
    function resizeTextTypeSVGNode_rectFrame($3rectFrame, textRectArea, pdng, strkWdth){
        
        var halfOf_strkWdth = strkWdth / 2;

        //位置・サイズ算出
        var x = textRectArea.x - pdng - halfOf_strkWdth;
        var y = textRectArea.y - pdng - halfOf_strkWdth;
        var width = textRectArea.width + 2*pdng + strkWdth;
        var height = textRectArea.height + 2*pdng + strkWdth;

        //resize
        $3rectFrame.attr("x", x)
            .attr("y", y)
            .attr("width", width)
            .attr("height", height);
    }

    //
    //<text>要素の占有領域サイズに合わせて<circle>を再調整する
    //
    function resizeTextTypeSVGNode_circleFrame($3circleFrame, textRectArea, pdng, strkWdth){

        //位置・サイズ算出
        var cx = textRectArea.x + (textRectArea.width / 2);
        var cy = textRectArea.y + (textRectArea.height / 2);
        var r = Math.sqrt(Math.pow(textRectArea.width,2) + Math.pow(textRectArea.height, 2)) / 2;
        r += pdng + (strkWdth / 2); //paddingとstroke-width分を加算

        //resize
        $3circleFrame.attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r);
    }

    //
    //<text>要素の占有領域サイズに合わせて<ellipse>を再調整する
    //
    function resizeTextTypeSVGNode_ellipseFrame($3ellipseFrame, textRectArea, pdng, strkWdth){

        //位置・サイズ算出
        var cx = textRectArea.x + (textRectArea.width / 2);
        var cy = textRectArea.y + (textRectArea.height / 2);

        if(textRectArea.width > 0 && textRectArea.height > 0){ //zero dividing 回避チェック
            var rx = Math.sqrt(Math.pow((textRectArea.width / 2), 2) + (Math.pow(textRectArea.width, 2) / Math.pow(textRectArea.height, 2)) * (Math.pow((textRectArea.height / 2), 2)));
            var ry = (textRectArea.height / textRectArea.width) * rx;

        }else{
            var rx = 0;
            var ry = 0;
        }

        //paddingとstroke-width分を加算
        rx += pdng + (strkWdth / 2);
        ry += pdng + (strkWdth / 2);

        //resize
        $3ellipseFrame.attr("cx", cx)
            .attr("cy", cy)
            .attr("rx", rx)
            .attr("ry", ry);
    }

    function exitEditing(){

        propertyEditorsManager.exit(); // Node個別編集用 PropertyEditor を終了
        
        //Node選択状態の表示化ループ
        for(var i = 0 ; i < dataset.length ; i++){

            var bindedData = dataset[i];

            if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == "true"){ // 選択対象Nodeの場合
                bindedData.$3bindedSelectionLayerSVGElement.style("visibility",null); //選択状態にする
            }
        }

        $propertyEditConsoleElement.slideUp(100); //edit consoleの終了

        nowEditng = false; //編集モードの終了
    }

    //
    //SVGノード(複数)を編集する
    //
    function editSVGNodes(){

        var selectionFound = false; //1つ以上の選択Nodeが存在するかどうか

        //選択状態のNodeに対するSelectionLayerを非表示にする
        $3nodes.each(function(d,i){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                d.$3bindedSelectionLayerSVGElement.style("visibility","hidden"); //非表示にする
                
                propertyEditorsManager.append(d);

                selectionFound = true;
            }
        });

        if(selectionFound){
            //選択 Node(s) を元に PropertyEditConsole に反映
            adjustPropertyEditConsole();
            $propertyEditConsoleElement.slideDown(100); //PropertyEditorを表示
            nowEditng = true; //`編集中`状態にする
        }
    }

    function checkSucceededLoadOf_ExternalComponent(){
        if(typeof propertyEditorsManager == 'undefined'){ //load未完了の場合
            console.error("External Component \`" + url_externalComponent + "\` is not loaded yet");
            return false;
        }else{ //load済みの場合
            return true;
        }
    }

    //
    // PropertyEditConsole 内の各 Property Editor の設定値を
    // selected な Node の表示状態に合わせる
    //
    function adjustPropertyEditConsole(){
        var computedStylesOfData = [];

        //Node選択状態の非表示化ループ
        for(var i = 0 ; i < dataset.length ; i++){

            var bindedData = dataset[i];

            if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ // 選択対象Nodeの場合
                
                var computedStyleObj = {};
                var explicitnessObj = {};
                var sccedded = getComputedStyleOfData(bindedData, computedStyleObj, explicitnessObj); // Nodeに適用されたスタイルの取得
                
                if(sccedded){
                    computedStylesOfData.push({computedStyle:computedStyleObj,
                                               explicitness:explicitnessObj});
                    
                }
            }
        }

        if(computedStylesOfData.length > 0){ //編集対象Nodeが存在する場合

            var mergedStyle = {};
            mergedStyle.text = {};
            var mergedExplicitness = {};
            mergedExplicitness.text = {};

            // computedStylesOfData[]からスタイルをマージ
            for(var i = 0 ; i < computedStylesOfData.length ; i++){
                var computedStlOfData =  computedStylesOfData[i];
                switch(computedStlOfData.computedStyle.type){
                    case "text":
                    {
                        //各Propertyのマージ
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_content");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_anchor");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_font_family");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_font_size");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_fill");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_font_weight");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_font_style");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "text_text_decoration");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "frame_shape");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "frame_stroke");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "frame_stroke_width");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "frame_stroke_dasharray");
                        mergeStyles(computedStlOfData.computedStyle.text, computedStlOfData.explicitness.text, mergedStyle.text, mergedExplicitness.text, "frame_fill");
                        
                    }
                    break;

                    default:
                    {
                        //nothing to do
                    }
                    break;
                }
            }

            propertyEditorsManager.adjust(mergedStyle, mergedExplicitness);

        }

        function mergeStyles(fromThisStlObj, fromThisExpObj, toThisStlObj, toThisExpObj, propertyName){
            mergeProperties(fromThisStlObj, toThisStlObj, propertyName);
            mergeProperties(fromThisExpObj, toThisExpObj, propertyName);
        }
    
        function mergeProperties(fromThisObj, toThisObj, propertyName){
            if(typeof toThisObj[propertyName] == 'undefined'){ //マージ先Objectに存在しない場合
                toThisObj[propertyName] = fromThisObj[propertyName];
            }else{
                if(toThisObj[propertyName] !== fromThisObj[propertyName]){ //マージ済みの値と異なる場合
                    toThisObj[propertyName] = null;
                }
            }
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

    //
    //note <textarea> 内 Val(文字列) はこの関数内では更新しない
    //     (javascriptで Val(文字列) を更新すると、キャレットの位置がズレてしまうため)
    //
    function adjustTextarea(bindedData, $3textareaElem){
        
        //apply styles from <SVGTextElement>------------------------------------------------------------------------------------
        var $3SVGnodeElem_text = bindedData.$3bindedSVGElement.select("text");
        var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

        var textareaStyle_textAlign = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor");
        switch(textareaStyle_textAlign){
            case "start": // `text-anchor:start;` -> `text-align:left;`
            {
                textareaStyle_textAlign = "left";
            }
            break;

            case "middle": // `text-anchor:middle;` -> `text-align:center;`
            {
                textareaStyle_textAlign = "center";
            }
            break;

            case "end": // `text-anchor:end;` -> `text-align:right;`
            {
                textareaStyle_textAlign = "right";
            }
            break;

            default:
            {
                console.warn("Unkown style \`text-anchor:" + textareaStyle_textAlign + ";\` applied in \`" + (getDomPath($3SVGnodeElem_text.node())).join('/') + "\`");
                textareaStyle_textAlign = "left"; //`left`で強行
            }
            break;
        }
        
        //フォントの取得
        var textareaStyle_fontFamily = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family");

        //フォントサイズの取得
        var textareaStyle_fontSize = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size");
        var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
        if(!(pixcelNumberRegex.test(textareaStyle_fontSize))){ // `0.0px`形式に設定できていない場合
                                                            // 指数表記になるような極端な数値も、このルートに入る

            console.warn("Cannot calculate pxcel size of Browser applied font-size." +
                        "browser applied font-size:\`" + textareaStyle_fontSize + "\`.");
            
            textareaStyle_fontSize = '11px'; //`11px`で強行
        }

        //<textarea>表示の為のtop位置を算出
        var halfLeading = (parseFloat(textareaStyle_fontSize) * (valOfLineHightInText - 1.0)) / 2;
        var textareaStyle_top = parseFloat($3SVGnodeElem_text.attr("y")) - getPxDistanceOf_textBeforeEdge_baseline(textareaStyle_fontSize, textareaStyle_fontFamily, $3motherElement.node()) - halfLeading;
        textareaStyle_top += "px";

        //font-weightの取得
        var textareaStyle_fontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");

        //font-styleの取得
        var textareaStyle_fontStyle = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style");

        //text-decorationの取得
        var textareaStyle_textDecoration = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");

        //文字色の取得
        var textareaStyle_color = computedStyleOf_SVGnodeElem_text.getPropertyValue("fill");

        $3textareaElem.style("text-align", textareaStyle_textAlign)
            .style("top", textareaStyle_top)
            .style("font-family", textareaStyle_fontFamily)
            .style("font-size", textareaStyle_fontSize)
            .style("font-weight",textareaStyle_fontWeight)
            .style("font-style",textareaStyle_fontStyle)
            .style("text-decoration",textareaStyle_textDecoration)
            .style("color", textareaStyle_color);
        //-----------------------------------------------------------------------------------/apply styles from <SVGTextElement>

        //adjust size------------------------------------------------------------------------------------
        var textareaElem = $3textareaElem.node();
        
        var marginWidthForCaret = parseFloat($3textareaElem.style("font-size")) / 2;
        var numOfLines = textareaElem.value.split(/\n/).length;
        $3textareaElem.style("width", ($3SVGnodeElem_text.node().getBBox().width + marginWidthForCaret) + "px");
        $3textareaElem.style("height", (numOfLines * (parseFloat($3textareaElem.style("font-size")) * valOfLineHightInText)) + "px");

        //overflowしている場合は、領域を広げる
        var pxNumOfScrollWidth = parseFloat(textareaElem.scrollWidth);
        if(pxNumOfScrollWidth > parseFloat($3textareaElem.style("width"))){ //widthがoverflowしている場合
            $3textareaElem.style("width", (pxNumOfScrollWidth + marginWidthForCaret) + "px");
        }
        var pxNumOfScrollHeight = parseFloat(textareaElem.scrollHeight);
        if(pxNumOfScrollHeight > parseFloat($3textareaElem.style("height"))){ //heightがoverflowしている場合
            $3textareaElem.style("height", pxNumOfScrollHeight + "px");
        }
        
        //left位置調整
        var pxNumOfLeft;
        switch($3textareaElem.style("text-align")){
            case "left":
            {
                pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x"));
            }
            break;

            case "center":
            {
                pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x")) - (parseFloat($3textareaElem.style("width")) / 2);
            }
            break;

            case "right":
            {
                pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x")) - parseFloat($3textareaElem.style("width"));
            }
            break;

            default:
            break; //nothing to do
        }
        $3textareaElem.style("left", pxNumOfLeft + "px");
        //-----------------------------------------------------------------------------------/adjust size

    }

    //
    // text タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_text(structureArr){

        var editingDataArr = [];
        var bufTotalReport;
        clearBufTotalReport();

        //指定 Data に対する<textarea>要素を作る
        this.append = function(bindedData){

            //重複チェック
            for(var i = 0 ; i < editingDataArr.length ; i++){
                var specifiedKey = editingDataArr[i].bindedData.key;
                if( specifiedKey == bindedData.key){ //すでに登録済みの場合
                    console.warn("specified data is already registered a <textarea> element. key:\`" + specifiedKey.toString() + "\`.");
                    return;
                }
            }

            //編集先Nodeの<text>SVG要素を非表示にする
            bindedData.$3bindedSVGElement.select("text").style("visibility", "hidden");

            var textareaValue = getValFromNestObj(structureArr, bindedData);

            //<textarea>要素の追加
            var $3textareaElem = $3motherElement.append("textarea")
                .style("position", "absolute")
                .style("margin", 0)
                .style("border", 0)
                .style("padding", 0)
                .style("line-height", valOfLineHightInText + "em")
                .style("resize", "none")
                .style("overflow", "hidden")
                .style("background-color", "rgba(105, 105, 105, 0)") // <- 透明度100%にする
                .classed(getUniqueClassName(structureArr.join('_')), true)
                .classed("mousetrap",true)
                .property("value", textareaValue)
                .attr("wrap","off");
            
            var textareaElem = $3textareaElem.node();
            
            adjustTextarea(bindedData, $3textareaElem); //追加した<textarea>の表示調整
            
            var appendThisObj = {bindedData: bindedData,
                                 $3textareaElem: $3textareaElem};
            
            editingDataArr.push(appendThisObj); //編集対象Nodeとして保存
            
            //<textarea>内のキータイプイベント
            $3textareaElem.node().oninput = function(){
                //SVGNodeへの反映&<textarea>調整
                renderAndMergeBufTotalReport($3textareaElem.node().value);
                adjustEditors($3textareaElem);
            }

            //<textarea>内の改行挿入イベント
            Mousetrap(textareaElem).bind(keySettings.insertLF, function(e){
                
                //<textarea>内にLFを挿入する
                var txt = textareaElem.value;
                var toSelect = textareaElem.selectionStart + 1;
                var beforeTxt = txt.substr(0, textareaElem.selectionStart);
                var afterTxt = txt.substr(textareaElem.selectionEnd);
                textareaElem.value = beforeTxt + '\n' + afterTxt;
                textareaElem.selectionStart = toSelect;
                textareaElem.selectionEnd = toSelect;
    
                //SVGNodeへの反映&<textarea>調整
                renderAndMergeBufTotalReport(textareaElem.value);
                adjustEditors($3textareaElem);
    
                disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
            });

            //<textarea>内からフォーカスが外れたイベント
            $3textareaElem.node().onblur = function(){
                comfirmBufTotalReport(); //Bufferの確定
            }

            //確定イベント
            Mousetrap(textareaElem).bind(keySettings.submitEditingTextTypeSVGNode, function(e){
                comfirmBufTotalReport(); //Bufferの確定
                exitEditors(); // <textarea> の終了
                disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
            });
        }

        //<textarea>のサイズ等を Data にあわせる
        this.adjust = function(){
            adjustEditors();
        }

        //
        // <textarea>を終了する
        // note 終了する<textarea>がない場合はなにもしない
        this.exit = function(){
            exitEditors();
        }

        //
        // 指定Dataに紐づけた<textarea>にキャレット(フォーカス)をあわせる
        //
        // note 見つからない場合はなにもしない
        this.focus = function(bindedData){
            var i;
            for(i = 0 ; i < editingDataArr.length ; i++){
                if(editingDataArr[i].bindedData === bindedData){ //指定Dataの場合
                    editingDataArr[i].$3textareaElem.node().focus(); //キャレット表示
                    break;
                }
            }
        }

        //編集をcancelする
        this.cancel = function(){
            if(!bufTotalReport.allNG){ //成功したRenderingReportが存在する場合
                rollbackTransaction(bufTotalReport); //元に戻す
                adjustEditors();
                clearBufTotalReport(); //バッファ初期化
            }
        }

        //編集を確定する
        this.confirm = function(){
            comfirmBufTotalReport(); //Bufferの確定
        }

        //すべての<textarea>の表示状態をSVGNodeの表示状態にあわせる
        function adjustEditors(dontUpdateValwithThis){
            for(var i = 0 ; i < editingDataArr.length ; i++){

                //<textarea>内 Val(文字列) に対する更新要否チェック
                if((typeof dontUpdateValwithThis == 'undefined') || (editingDataArr[i].$3textareaElem !== dontUpdateValwithThis)){ //指定<textarea>要素でない場合
                    editingDataArr[i].$3textareaElem.property("value", getValFromNestObj(structureArr, editingDataArr[i].bindedData)); //Val(文字列) 更新
                }

                adjustTextarea(editingDataArr[i].bindedData, editingDataArr[i].$3textareaElem);
            }
        }

        function exitEditors(){
            for(var i = 0 ; i < editingDataArr.length ; i++){
                editingDataArr[i].bindedData.$3bindedSVGElement.select("text").style("visibility", null); //表示状態に戻す
                editingDataArr[i].$3textareaElem.remove(); //<textarea>要素を削除する
            }
            editingDataArr = []; //配列初期化
        }

        //SVGNodeへの反映 & Rendering Reportをバッファに積む
        function renderAndMergeBufTotalReport(text_content){
            //SVGNodeへの反映
            var toRenderObj = makeNestedObj(text_content, structureArr);
            var totalReport = fireEvent_PropertyEditConsole_rerender(toRenderObj);
            
            if(!totalReport.allNG){ //1つ以上適用成功の場合
                totalReport.message = structureArr.join("/") + ":" + text_content;
                overWriteScceededTransaction(totalReport, bufTotalReport);
            }
        }

        //バッファに積んだ Rendering Report を 確定させる
        function comfirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                appendHistory(bufTotalReport);
                clearBufTotalReport();
            }
        }

        function clearBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         // historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = [];
        }
    }

    //
    // <input type="text"> タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_textInput($inputElem, $defaultButtonElem, $expMsgElem, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport; //編集中に保存する Buffer
        var initExpMessage = null;
        var lastAppliedStr = "";    // confirm 時に<input>要素に適用する文字列
        var propertyEditingBehavor_setAsdefault;

        //initialize
        initializeBufTotalReport();

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     structureArr,
                                                                                     callbackBeforePreview,
                                                                                     adjustPropertyEditConsole);

        //<input>要素内のキータイピングイベント
        $inputElem.get(0).oninput = function(){
            if(initExpMessage === null){ //初回の場合(Buffering 1回目の場合)
                initExpMessage = $expMsgElem.text(); //現在の表示状態を保存
            }

            //SVGNodeへの反映
            var toApplyText = $inputElem.val();
            var renderByThisObj = makeNestedObj(toApplyText, structureArr); //render用Objを作る
            var totalReport = fireEvent_PropertyEditConsole_rerender(renderByThisObj); //render

            callbackWhenEventDone();

            if(!totalReport.allNG){ //1つ以上のNodeで適用成功の場合
                totalReport.message = structureArr.join('/') + ":" + toApplyText;
                overWriteScceededTransaction(totalReport, bufTotalReport);

                if(totalReport.allOK){ //全てのNodeで適用成功の場合
                    $expMsgElem.text("explicit");

                }else{ //1部Nodeで適用失敗の場合
                    $expMsgElem.text("explicit (some part)");
                }
                lastAppliedStr = toApplyText;
            }
        }

        //<input>要素からフォーカスが離れた時のイベント
        $inputElem.get(0).onblur = function(){
            confirmBufTotalReport(); //Bufferを確定する
        }

        //PropertyEditorの表示状態をNodeの表示状態にあわせる
        this.adjustToStyleObj = function(computedStyleObj, explicitnessObj){
            var valOfNode = getValFromNestObj(structureArr, computedStyleObj);

            if(typeof valOfNode == 'undefined'){ //対象のNodeが存在しない
                
                $inputElem.val("");
                $inputElem.prop('disabled', true); //<input>要素を無効化
                $expMsgElem.text("no nodes");
                propertyEditingBehavor_setAsdefault.disable();
            
            }else{ //描画対象のスタイルが存在する
                
                $inputElem.prop('disabled', false); //<input>要素を有効化
                propertyEditingBehavor_setAsdefault.enable();
                
                if(valOfNode !== null){ // merged Styleが算出できた
                    if(valOfNode == 'none'){ //未設定の場合
                        valOfNode = "";
                    }
                    $inputElem.val(valOfNode);
                    lastAppliedStr = valOfNode;
                
                }else{ // merged Styleが算出できなかった
                    $inputElem.val("");
                    lastAppliedStr = "";
                }

                var valOfExp = getValFromNestObj(structureArr, explicitnessObj);

                if(valOfExp === null){ // explicitly defined している Node は一部だけだった
                    $expMsgElem.text("explicit (some part)");
                }else if(valOfExp){    // explicitly defined している Node は全部
                    $expMsgElem.text("explicit");
                }else{                 // explicitly defined していない
                    $expMsgElem.text("");
                }
            }
        }

        //編集をcancelする
        this.cancel = function(){
            if(!bufTotalReport.allNG){ //成功したRenderingReportが存在する場合
                rollbackTransaction(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                initializeBufTotalReport(); //バッファ初期化
                $expMsgElem.text(initExpMessage);
                initExpMessage = null;
            }
        }

        //編集を確定する
        this.confirm = function(){
            confirmBufTotalReport();
        }

        //Buffer初期化
        function initializeBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         //    historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = [];
        }

        //バッファに積んだ Rendering Report を 確定させる
        function confirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                appendHistory(bufTotalReport);
                initializeBufTotalReport(); //ログ用バッファ初期化

            }
            $inputElem.val(lastAppliedStr); //最後に反映したtextで<input>要素を更新
            initExpMessage = null;
        }
    }

    //
    // <input type="number"> タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_numberInput($inputElem, $defaultButtonElem, $expMsgElem, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport; //編集中に保存する Buffer
        var initExpMessage = null;
        var lastAppliedStr = "";    // confirm 時に<input>要素に適用する文字列
        var propertyEditingBehavor_setAsdefault;

        //initialize
        initializeBufTotalReport();

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     structureArr,
                                                                                     callbackBeforePreview,
                                                                                     adjustPropertyEditConsole);

        //<input>要素内のキータイピングイベント
        $inputElem.get(0).oninput = function(){

            if(!document.activeElement.isEqualNode($inputElem.get(0))){ //別のDom要素が選択されていた場合
                                                                        // -> スピンボタンによるoninput
                $inputElem.get(0).focus(); // 自分の<input>要素をfocus
                                           // -> 別 Property Editor の onblur を発火させる
            }

            if(initExpMessage === null){ //初回の場合(Buffering 1回目の場合)
                initExpMessage = $expMsgElem.text(); //現在の表示状態を保存
            }

            //有効数値チェック
            var toApplyVal = parseFloat($inputElem.val());
            if(typeof toApplyVal != 'number' ){ //数値型でない場合
                console.warn("Cannot parse \`" + $inputElem.val() + "\` as number.");
                return;
            }

            //SVGNodeへの反映
            var renderByThisObj = makeNestedObj(toApplyVal, structureArr); //render用Objを作る
            var totalReport = fireEvent_PropertyEditConsole_rerender(renderByThisObj); //render

            callbackWhenEventDone();

            if(!totalReport.allNG){ //1つ以上のNodeで適用成功の場合
                totalReport.message = structureArr.join('/') + ":" + toApplyVal.toString();
                overWriteScceededTransaction(totalReport, bufTotalReport);

                if(totalReport.allOK){ //全てのNodeで適用成功の場合
                    $expMsgElem.text("explicit");

                }else{ //1部Nodeで適用失敗の場合
                    $expMsgElem.text("explicit (some part)");
                }
                lastAppliedStr = toApplyVal.toString();
            }
        }

        //<input>要素からフォーカスが離れた時のイベント
        $inputElem.get(0).onblur = function(){
            confirmBufTotalReport(); //Bufferを確定する
        }

        //PropertyEditorの表示状態をNodeの表示状態にあわせる
        this.adjustToStyleObj = function(computedStyleObj, explicitnessObj){
            var valOfNode = getValFromNestObj(structureArr, computedStyleObj);

            if(typeof valOfNode == 'undefined'){ //対象のNodeが存在しない
                
                $inputElem.val("");
                $inputElem.prop('disabled', true); //<input>要素を無効化
                $expMsgElem.text("no nodes");
                propertyEditingBehavor_setAsdefault.disable();
            
            }else{ //描画対象のスタイルが存在する
                
                $inputElem.prop('disabled', false); //<input>要素を有効化
                propertyEditingBehavor_setAsdefault.enable();
                
                if(valOfNode !== null){ // merged Styleが算出できた
                    applyThisStr = valOfNode.toString();
                    $inputElem.val(applyThisStr);
                    lastAppliedStr = applyThisStr;
                
                }else{ // merged Styleが算出できなかった
                    $inputElem.val("");
                    lastAppliedStr = "";
                }

                var valOfExp = getValFromNestObj(structureArr, explicitnessObj);

                if(valOfExp === null){ // explicitly defined している Node は一部だけだった
                    $expMsgElem.text("explicit (some part)");
                }else if(valOfExp){    // explicitly defined している Node は全部
                    $expMsgElem.text("explicit");
                }else{                 // explicitly defined していない
                    $expMsgElem.text("");
                }
            }
        }

        //編集をcancelする
        this.cancel = function(){
            if(!bufTotalReport.allNG){ //成功したRenderingReportが存在する場合
                rollbackTransaction(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                initializeBufTotalReport(); //バッファ初期化
                $expMsgElem.text(initExpMessage);
                initExpMessage = null;
            }
        }

        //編集を確定する
        this.confirm = function(){
            confirmBufTotalReport();
        }

        //Buffer初期化
        function initializeBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         //    historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = [];
        }

        //バッファに積んだ Rendering Report を 確定させる
        function confirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                appendHistory(bufTotalReport);
                initializeBufTotalReport(); //ログ用バッファ初期化
            }
            $inputElem.val(lastAppliedStr); //最後に反映したtextで<input>要素を更新
            initExpMessage = null;
        }
    }
    
    //
    // Radio Buttons タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_radioButtons(elemAndValArr, $defaultButtonElem, $expMsgElem, structureArr, callbackBeforePreview, callbackWhenEventDone){

        var clicked = false;
        var beforeExpMessage = "";
        var beforeVal = "";
        var bufTotalReport = null; //Rendering Report 用バッファ
        var propertyEditingBehavor_setAsdefault;

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     structureArr,
                                                                                     callbackBeforePreview,
                                                                                     adjustPropertyEditConsole);

        //各Elementに対するBehavor登録
        for(var itr = 0 ; itr < elemAndValArr.length ; itr++){

            //Mouse Enter Event
            elemAndValArr[itr].$elem.mouseenter(elemAndValArr[itr],function(event){
                    
                var enteredElem = this;

                if(!($(enteredElem).prop("disabled"))){ //プロパティエディタが有効の場合

                    callbackBeforePreview();

                    var toRenderObj = makeNestedObj(event.data.useThisVal, structureArr);

                    clicked = false;
                    beforeExpMessage = $expMsgElem.text();

                    bufTotalReport = fireEvent_PropertyEditConsole_rerender(toRenderObj);
                    callbackWhenEventDone();

                    bufTotalReport.type = 'change';
                    bufTotalReport.message = structureArr.join("/") + ":" + event.data.useThisVal;
    
                    //選択状態の解除ループ
                    beforeVal = "";
                    for(var i = 0 ; i < elemAndValArr.length ; i++){
                        if(elemAndValArr[i].$elem.hasClass(className_nodeIsSelected)){ //選択状態の場合
                            beforeVal = elemAndValArr[i].useThisVal;
                        }
                        elemAndValArr[i].$elem.removeClass(className_nodeIsSelected); //選択解除
                    }
                    enteredElem.classList.add(className_nodeIsSelected); //クリックされた要素を選択状態にする

                    if(bufTotalReport.allOK){ //適用全部成功の場合
                        $expMsgElem.text("explicit");
                    
                    }else{ //適用一部失敗の場合
                        $expMsgElem.text("explicit (some part)");
                        //note ロールバックは不要
                    }
                    
                }

            });

            // Mouse Click Event
            elemAndValArr[itr].$elem.click(elemAndValArr[itr],function(event){
                
                var clickedElem = this;

                if(!($(clickedElem).prop("disabled")) && !clicked){ //プロパティエディタが有効 && クリックしていない場合
                    appendHistory(bufTotalReport);
                    clicked = true;
                }
            });
            
            // Mouse Leave Event
            elemAndValArr[itr].$elem.mouseleave(elemAndValArr[itr],function(event){
                
                var leavedElem = this;

                if(!($(leavedElem).prop("disabled"))){ //プロパティエディタが有効の場合
                    
                    if(!clicked){ //クリックしなかった場合
                        
                        rollbackTransaction(bufTotalReport); //元に戻す
                        callbackWhenEventDone();
                        $expMsgElem.text(beforeExpMessage);
                        leavedElem.classList.remove(className_nodeIsSelected);
                        if(beforeVal != ""){
                            var $toSelectElem = get$elemByVal(beforeVal); //property editor要素を取得
                            if(typeof $toSelectElem != 'undefined'){ //選択対象要素がある場合
                                $toSelectElem.addClass(className_nodeIsSelected); //選択状態にする
                            }
                        }                    
                    }

                    bufTotalReport = null;
                    beforeExpMessage = "";
                    clicked = false;

                }
            });
        }

        //PropertyEditorの表示状態をNodeの表示状態にあわせる
        this.adjustToStyleObj = function(computedStyleObj, explicitnessObj){

            //選択状態の解除ループ
            for(var i = 0 ; i < elemAndValArr.length ; i++){
                elemAndValArr[i].$elem.removeClass(className_nodeIsSelected); //選択解除
            }

            var valOfNode = getValFromNestObj(structureArr, computedStyleObj);

            if(typeof valOfNode == 'undefined'){ //対象のNodeが存在しない

                //要素無効化ループ
                for(var i = 0 ; i < elemAndValArr.length ; i++){
                    elemAndValArr[i].$elem.prop('disabled', true); //要素無効化
                }
                $expMsgElem.text("no nodes");
                propertyEditingBehavor_setAsdefault.disable();

            }else{ //描画対象のスタイルが存在する

                //要素有効化ループ
                for(var i = 0 ; i < elemAndValArr.length ; i++){
                    elemAndValArr[i].$elem.prop('disabled', false); //要素有効化
                }
                propertyEditingBehavor_setAsdefault.enable();

                if(valOfNode !== null){// merged Styleが算出できた

                    var $toSelectElem = get$elemByVal(valOfNode); //property editor要素を取得
                    if(typeof $toSelectElem != 'undefined'){ //選択対象要素がある場合
                        $toSelectElem.addClass(className_nodeIsSelected); //選択状態にする
                    }else{
                        console.warn("Unkown style \`" + valOfNode.toString() + "\` specfied by computed style")
                    }
                }

                var valOfExp = getValFromNestObj(structureArr, explicitnessObj);

                if(valOfExp === null){ // explicitly defined している Node は一部だけだった
                    $expMsgElem.text("explicit (some part)");
                }else if(valOfExp){    // explicitly defined している Node は全部
                    $expMsgElem.text("explicit");
                }else{                                              // explicitly defined していない
                    $expMsgElem.text("");
                }

            }
        }

        this.cancel = function(){
            //nothing to do
        }

        this.confirm = function(){
            //nothing to do
        }

        function get$elemByVal(val){
            var toRet$elem;
            for(var i = 0; i < elemAndValArr.length ; i++){
                if(elemAndValArr[i].useThisVal == val){
                    toRet$elem = elemAndValArr[i].$elem;
                    break;
                }
            }
            return toRet$elem; //見つけられなかった場合は'undefined'が返る
        }
    }

    //
    // Colopickerとinput要素を使って色指定するタイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_fill($inputElem, $pickerElem, $defaultButtonElem, $expMsgElem, structureArr, callbackBeforePreview, callbackWhenEventDone){

        var bufTotalReport; //<input>要素 or spectrum の編集中に保存する Buffer
        var initExpMessage = null; // cancel 時に戻すべきメッセージ用文字列
        var initSpectrumStr = "";  // cancel 時に戻すべきspectrum(color picker)用文字列
        var changed = false; // spectrum (color picker) によって'change' イベントが発行されたか
        var canceled = false;
        var lastAppliedStr = "";    // confirm 時に<input>要素に適用する文字列
        var $spectrumElem;
        var propertyEditingBehavor_setAsdefault;

        //initialize
        initializeBufTotalReport();

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     structureArr,
                                                                                     callbackBeforePreview,
                                                                                     adjustPropertyEditConsole);

        //spectrum(color picker)の登録
        var spectrumContainerClassName   =  getUniqueClassName(structureArr.join("_"));
        forSpectrumRegisteringOptionObj.containerClassName = spectrumContainerClassName; //pikcerに紐づくspectrum要素検索用のClass名
        $pickerElem.spectrum(forSpectrumRegisteringOptionObj); //登録
        $spectrumElem = $("." + spectrumContainerClassName);

        //<input>要素内のキータイピングイベント
        $inputElem.get(0).oninput = function(){
            var iputStr = $inputElem.val();

            //TinyColorでパース可能な文字列かどうかチェック
            if(!(tinycolor(iputStr).isValid())){ //パース不可能な場合
                console.warn("Cannot parse \`" + iputStr + "\` by TinyColor.");
                return;
            }

            $pickerElem.spectrum("set", iputStr); //spectrum (color picker) に反映
            renderAndMergeBufTotalReport(iputStr); //RenderしてBufferに積む
        }

        //<input>要素からフォーカスが離れた時のイベント
        $inputElem.get(0).onblur = function(){
            confirmBufTotalReport(); //Bufferを確定する
        }

        //`▽押下`による spectrum (color picker) 出現イベント
        $pickerElem.on('show.spectrum', function(e, tinycolorObj) {
            colObj = $pickerElem.spectrum("get");
            if(colObj === null){
                initSpectrumStr = "";
            }else{
                initSpectrumStr = colObj.toRgbString();
            }
            changed = false;
            canceled = false;
        });

        //spectrum (color picker) のドラッグイベント
        $pickerElem.on('move.spectrum', function(e, tinycolorObj) {
        
            //nullチェック。spectrum (color picker) 右上の「×」をクリックすると、nullが来る。
            if(tinycolorObj !== null){

                var iputStr = tinycolorObj.toRgbString();
                renderAndMergeBufTotalReport(iputStr); //RenderしてBufferに積む
                $inputElem.val(iputStr); //<input>要素に値を設定する
            }
        });

        //spectrum (color picker) の `chooseボタンクリック` or `範囲外クリック` イベント
        $pickerElem.on('change.spectrum', function(e, tinycolorObj) {
            confirmBufTotalReport(); //バッファに積んだ Rendering Report を 確定させる
            changed = true;
        });

        //spectrum (color picker) の`cancel` or `ESC押下` or `▽押下`イベント
        // note `chooseボタンクリック` or `範囲外クリック`でも発火する
        $pickerElem.on('hide.spectrum', function(e, tinycolorObj) {

            if(!changed || canceled){ // `ESC押下` or `▽押下` or `cancel`イベントの場合
                clearBuf();
                
                if(tinycolor(initSpectrumStr).isValid()){ //パース可能な場合
                    $pickerElem.spectrum("set", initSpectrumStr);
                }
                //<input>要素をspectrum (color picker) の色に合わせる
                $inputElem.val(initSpectrumStr);
            }
            changed = false;
            canceled = false;
        });

        //`cancel`ボタンの存在チェック <- spectrum の 公式document に、
        //`.sp-cancel`で`cancel`ボタンが定義されている事が明記されていない為確認する
        if($spectrumElem.find(".sp-cancel").length == 0){
            console.error("\`cancel\` Button not found in spectrum.");
        }
        
        //spectrum (color picker)のcancelボタンクリックイベント
        $spectrumElem.find(".sp-cancel").on("click",function(){
            canceled = true;
        });

        //PropertyEditorの表示状態をNodeの表示状態にあわせる
        this.adjustToStyleObj = function(computedStyleObj, explicitnessObj){
            var valOfNode = getValFromNestObj(structureArr, computedStyleObj);

            if(typeof valOfNode == 'undefined'){ //対象のNodeが存在しない
                
                $inputElem.val("");
                $inputElem.prop('disabled', true); //<input>要素を無効化
                $pickerElem.spectrum("disable"); //spectrum (color picker) を無効化
                propertyEditingBehavor_setAsdefault.disable();
                
                $expMsgElem.text("no nodes");
            
            }else{ //描画対象のスタイルが存在する
                
                $inputElem.prop('disabled', false); //<input>要素を有効化
                $pickerElem.spectrum("enable"); //spectrum (color picker) を有効化
                propertyEditingBehavor_setAsdefault.enable();
                
                if(valOfNode !== null){ // merged Styleが算出できた
                    $inputElem.val(valOfNode);
                    $pickerElem.spectrum("set", valOfNode);
                    lastAppliedStr = valOfNode;
                
                }else{ // merged Styleが算出できなかった
                    $inputElem.val("");
                    $pickerElem.spectrum("set", null); //<- clearする方法が不明なので、とりあえずnullにしている
                    lastAppliedStr = "";
                }

                var valOfExp = getValFromNestObj(structureArr, explicitnessObj);

                if(valOfExp === null){ // explicitly defined している Node は一部だけだった
                    $expMsgElem.text("explicit (some part)");
                }else if(valOfExp){    // explicitly defined している Node は全部
                    $expMsgElem.text("explicit");
                }else{                 // explicitly defined していない
                    $expMsgElem.text("");
                }
            }
        }

        //編集をcancelする
        this.cancel = function(){
            if(isColorpickerShowed()){ //colorpicker が表示中だった場合
                $pickerElem.spectrum("hide"); //colorpickerをcancelする
                
            }else{ //colorpicker が非表示だった場合
                clearBuf();
            }
        }

        //編集を確定する
        this.confirm = function(){
            confirmBufTotalReport(); //バッファに積んだ Rendering Report を 確定させる

            if(isColorpickerShowed()){ //colorpicker が表示中だった場合
                changed = true;
                $pickerElem.spectrum("hide"); //colorpickerをcancelする
                
            }
        }

        //spectrum (color picker) が表示状態かどうかを返す
        function isColorpickerShowed(){
            var isColorpickerHidden = $spectrumElem.hasClass("sp-hidden");
            return (!isColorpickerHidden);
        }

        //Buffer初期化
        function initializeBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         //    historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = [];
        }

        //Buffer初期化 & 表示を元に戻す
        function clearBuf(){
            if(!bufTotalReport.allNG){ //成功したRenderingReportが存在する場合
                rollbackTransaction(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                initializeBufTotalReport(); //バッファ初期化
                $expMsgElem.text(initExpMessage);
                initExpMessage = null;
            }
        }

        //SVGNodeへの反映 & Rendering Reportをバッファに積む
        function renderAndMergeBufTotalReport(toFillStr){

            if(initExpMessage === null){ //初回の場合(Buffering 1回目の場合)
                initExpMessage = $expMsgElem.text(); //現在の表示状態を保存
            }

            //SVGNodeへの反映
            var renderByThisObj = makeNestedObj(toFillStr, structureArr); //render用Objを作る
            var totalReport = fireEvent_PropertyEditConsole_rerender(renderByThisObj); //render
            
            callbackWhenEventDone();

            if(!totalReport.allNG){ //1つ以上のNodeで適用成功の場合
                totalReport.message = structureArr.join('/') + ":" + toFillStr;
                overWriteScceededTransaction(totalReport, bufTotalReport);

                if(totalReport.allOK){ //全てのNodeで適用成功の場合
                    $expMsgElem.text("explicit");

                }else{ //1部Nodeで適用失敗の場合
                    $expMsgElem.text("explicit (some part)");
                }
                lastAppliedStr = toFillStr;
            }
        }

        //バッファに積んだ Rendering Report を 確定させる
        function confirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                appendHistory(bufTotalReport);
                initializeBufTotalReport(); //ログ用バッファ初期化

            }
            $inputElem.val(lastAppliedStr); //最後に反映したカラーで<input>要素を更新
            $pickerElem.spectrum("set", lastAppliedStr); //spectrum (color picker) に反映
            initExpMessage = null;
        }
    }

    //
    // 各Property Editor で Default に戻すボタンの Behavor
    //
    function propertyEditorBehavor_setAsDefault($buttunElem, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport = null; //Rendering Report 用バッファ
        var clicked = false;
        var toRenderObj;
        var messageTitle = "";
        
        //toRenderObjの作成
        if(typeof structureArr == 'undefined'){ //'undefined'の場合は全て削除する
            toRenderObj = makeSetDafaultObj();
            messageTitle = "All Property:defalt"

        }else{
            toRenderObj = makeNestedObj(null, structureArr);
            messageTitle = structureArr.join("/") + ":default";
        }
        
        // Mouse Enter Event
        $buttunElem.mouseenter(function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                clicked = false;
                callbackBeforePreview();
                bufTotalReport = fireEvent_PropertyEditConsole_rerender(toRenderObj); 
                callbackWhenEventDone();
                bufTotalReport.type = 'change';
                bufTotalReport.message = messageTitle;
                $buttunElem.addClass(className_nodeIsSelected);
            }
        });

        // Mouse Click Event
        $buttunElem.click(function(){
            if(!($buttunElem.prop("disabled")) && !clicked){ //ボタンが有効でまだclickしていない場合
                appendHistory(bufTotalReport);
                clicked = true;
            }
        });

        // Mouse Leave Event
        $buttunElem.mouseleave(function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                if(!clicked){ //クリックしなかった場合
                        
                    rollbackTransaction(bufTotalReport); //元に戻す
                    callbackWhenEventDone();         
                }
                bufTotalReport = null;
                clicked = false;
                $buttunElem.removeClass(className_nodeIsSelected);
            }
        });

        //ボタンを無効にする
        this.disable = function(){
            $buttunElem.prop("disabled", true);
        }

        //ボタンを有効にする
        this.enable = function(){
            $buttunElem.prop("disabled", false);
        }
    }

    //
    // caution renderringReport.allNG = falseな時だけコールする
    //
    function overWriteScceededTransaction(fromThisTransaction, toThisTransaction){ //?

        if(toThisTransaction.allNG){ //allNGの場合は、この関数がコールされないので、
                                    //1回目のコールを表す
            toThisTransaction.allNG = false;
            toThisTransaction.allOK = fromThisTransaction.allOK;
        }

        if(!fromThisTransaction.allOK){ //1部NGがある場合
            toThisTransaction.allOK = false;
        }

        if(typeof fromThisTransaction.message != 'undefined'){ //message指定がある場合
            toThisTransaction.message = fromThisTransaction.message; //直近のmessageで更新
        }
        
        //レンダリングレポート網羅ループ
        for(var i_f = 0 ; i_f < fromThisTransaction.reportsArr.length ; i_f++){

            if(!fromThisTransaction.reportsArr[i_f].allNG){ //property全て失敗でなければ
                
                //マージ対象ノード検索ループ
                var i_t = 0;
                
                for( ; i_t < toThisTransaction.reportsArr.length ; i_t++){

                    //マージ対象のノードkeyが見つかった場合
                    if(toThisTransaction.reportsArr[i_t].key == fromThisTransaction.reportsArr[i_f].key){
                        break;
                    }
                }

                if(i_t == toThisTransaction.reportsArr.length){ //マージ対象のノードkeyが見つからなかった場合
                    toThisTransaction.reportsArr.push({}); //空のオブジェクトを追加する
                    toThisTransaction.reportsArr[i_t].key = fromThisTransaction.reportsArr[i_f].key;

                    //allOK
                    toThisTransaction.reportsArr[i_t].allOK = fromThisTransaction.reportsArr[i_f].allOK;
                    //allNG
                    toThisTransaction.reportsArr[i_t].allNG = false;
                    //PrevObj
                    toThisTransaction.reportsArr[i_t].PrevObj = {};
                    mergeObj(fromThisTransaction.reportsArr[i_f].PrevObj, toThisTransaction.reportsArr[i_t].PrevObj,false);
                    //RenderedObj
                    toThisTransaction.reportsArr[i_t].RenderedObj = {};
                    //FailuredMessages
                    toThisTransaction.reportsArr[i_t].FailuredMessages = {};

                }else{ //マージ対象のノードkeyが見つかった場合

                    //allOK
                    if(!fromThisTransaction.reportsArr[i_f].allOK){ //一部失敗がある場合
                        toThisTransaction.reportsArr[i_t].allOK = false;
                    }
                    
                    //allNGは不要
                    
                    //PrevObj
                    mergeObj(fromThisTransaction.reportsArr[i_f].PrevObj, toThisTransaction.reportsArr[i_t].PrevObj,true); //toThisTransactionに存在しない時だけmerge
                    
                }
                
                //RenderedObj
                mergeObj(fromThisTransaction.reportsArr[i_f].RenderedObj, toThisTransaction.reportsArr[i_t].RenderedObj,false);
                
                //FailuredMessages
                mergeObj(fromThisTransaction.reportsArr[i_f].FailuredMessages, toThisTransaction.reportsArr[i_t].FailuredMessages,false);
            }
        }
    }

    //
    //SVGに適用されたスタイルを抽出する
    //抽出成功の場合は、true,
    //失敗の場合はfalseを返却する
    //
    function getComputedStyleOfData(bindedData, computedStyleObj, explicitnessObj){

        
        //type指定チェック
        if(typeof (bindedData.type) == 'undefined'){
            console.warn("\"type\" property is not specified");
            return false; //存在しない場合場合は終了する
        }

        //初期化
        computedStyleObj.key = bindedData.key;
        explicitnessObj.key = true; //常に明示的とする

        
        switch(bindedData.type){
            case "text":
            {
                computedStyleObj.type = "text";
                computedStyleObj.text = {};
                explicitnessObj.type = true; //常に明示的な指定とする
                explicitnessObj.text = {};

                getComputedStyleOfTextTypeData(bindedData, computedStyleObj, explicitnessObj);
            }
            break;

            default:
            {
                console.warn("unknown data type"); //<-仮の処理
                return false;
            }
            break;
        }

        return true;

    }

    function getComputedStyleOfTextTypeData(bindedData, computedStyleObj, explicitnessObj){
        
        var $3SVGnodeElem_text = bindedData.$3bindedSVGElement.select("text");
        var computedStyleOf_SVGnodeElem_text = window.getComputedStyle($3SVGnodeElem_text.node());

        //text_content
        computedStyleObj.text.text_content = bindedData.text.text_content;
        explicitnessObj.text.text_content = true; //常に明示的な指定として扱う

        //text_anchor
        computedStyleObj.text.text_anchor = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-anchor");;
        explicitnessObj.text.text_anchor = (typeof bindedData.text.text_anchor != 'undefined');

        //text_font_family
        computedStyleObj.text.text_font_family = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-family").replace(/\"/g, "'"); //スペースを含むフォントの引用符をsingle quoteに統一
        explicitnessObj.text.text_font_family = (typeof bindedData.text.text_font_family != 'undefined');

        //text_font_size
        computedStyleObj.text.text_font_size = parseFloat(computedStyleOf_SVGnodeElem_text.getPropertyValue("font-size"));
        explicitnessObj.text.text_font_size = (typeof bindedData.text.text_font_size != 'undefined');

        //text_fill
        computedStyleObj.text.text_fill = computedStyleOf_SVGnodeElem_text.getPropertyValue("fill");
        explicitnessObj.text.text_fill = (typeof bindedData.text.text_fill != 'undefined');

        //text_font_weight
        explicitnessObj.text.text_font_weight = (typeof bindedData.text.text_font_weight != 'undefined');
        if(explicitnessObj.text.text_font_weight){ //明示的指定がある場合
            computedStyleObj.text.text_font_weight = bindedData.text.text_font_weight; //明示的指定した方に合わせる('normal', '400' 等の違いを吸収する為)
        }else{
            computedStyleObj.text.text_font_weight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");
        }

        //text_font_style
        computedStyleObj.text.text_font_style = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style");
        explicitnessObj.text.text_font_style = (typeof bindedData.text.text_font_style != 'undefined');

        //text_text_decoration
        computedStyleObj.text.text_text_decoration = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");
        explicitnessObj.text.text_text_decoration = (typeof bindedData.text.text_text_decoration != 'undefined');

        var SVGnodeElem_DOTframe_frame = bindedData.$3bindedSVGElement.select(".frame").node().firstChild;

        //frame_shape
        computedStyleObj.text.frame_shape = SVGnodeElem_DOTframe_frame.tagName.toLowerCase();
        explicitnessObj.text.frame_shape = (typeof bindedData.text.frame_shape != 'undefined');

        var computedStyleOf_SVGnodeElem_DOTframe_frame = window.getComputedStyle(SVGnodeElem_DOTframe_frame);

        //frame_stroke
        computedStyleObj.text.frame_stroke = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke");
        explicitnessObj.text.frame_stroke = (typeof bindedData.text.frame_stroke != 'undefined');

        //frame_stroke_width
        computedStyleObj.text.frame_stroke_width = parseFloat(computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-width"));
        explicitnessObj.text.frame_stroke_width = (typeof bindedData.text.frame_stroke_width != 'undefined');

        //frame_stroke_dasharray
        var frameStyle_strokeDashArray = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("stroke-dasharray");
        //"px"とスペースは無視する
        frameStyle_strokeDashArray = frameStyle_strokeDashArray.replace(/px/g, "");
        frameStyle_strokeDashArray = frameStyle_strokeDashArray.replace(/ /g, "");
        computedStyleObj.text.frame_stroke_dasharray = frameStyle_strokeDashArray;
        explicitnessObj.text.frame_stroke_dasharray = (typeof bindedData.text.frame_stroke_dasharray != 'undefined');

        //frame_fill
        computedStyleObj.text.frame_fill = computedStyleOf_SVGnodeElem_DOTframe_frame.getPropertyValue("fill");
        explicitnessObj.text.frame_fill = (typeof bindedData.text.frame_fill != 'undefined');

    }

    //
    // 一意キーとして利用可能なClass名を生成する
    //
    function getUniqueClassName(fwdStr){
        
        var attachThisStrToFwd = "";
        
        if(typeof fwdStr == 'string'){ //前方指定文字列が存在する場合
            attachThisStrToFwd += fwdStr;
        
        }else{ //前方指定文字列が存在しない場合
            attachThisStrToFwd += "autoGenClassName"; //'default'設定
        }

        var uniQueNameFound = false;
        var testNo = 0;

        while(!uniQueNameFound){
            
            var testThisClassName = attachThisStrToFwd + testNo.toString();
            $schd = $( "." + testThisClassName);

            if($schd.length == 0){ //存在しないClass名の場合
                return testThisClassName; //一意キーとして利用可能なClass名を返却

            }else{
                testNo++;
            }
        }
    }

    //
    //指定フォントのbaselineからtext-before-edgeまでの高さを求める
    //
    function getPxDistanceOf_textBeforeEdge_baseline(fntSiz, fntFam, onlyForCalcElem){
        
        fntSiz = parseFloat(fntSiz); //"px"消去

        var distanceOf_baseline_textAfterEdge = getPxDistanceOf_baseline_textAfterEdge(fntSiz, fntFam, onlyForCalcElem);

        return fntSiz - distanceOf_baseline_textAfterEdge;

    }

    //
    //指定フォントのdecenderの高さを取得する
    //
    //フォントのメタデータ解析をするのではなく、
    //ダミー要素(フォントサイズ大のbmp画像と"y")を`vertical-align: baseline;`でレンダリングした結果を元に求める
    //
    //↓フォントのメタデータ解析は以下を理解する必要あり↓
    //https://nixeneko.hatenablog.com/category/%E3%83%95%E3%82%A9%E3%83%B3%E3%83%88?page=1476195275
    //
    function getPxDistanceOf_baseline_textAfterEdge(fntSiz, fntFam, onlyForCalcElem){

        fntSiz = parseFloat(fntSiz); //"px"消去

        //計算用のdivを作る
        var tmpElem = onlyForCalcElem.appendChild(document.createElement("div"));
        tmpElem.setAttribute("class", "getPxDistanceOf_baseline_textAfterEdge");
        tmpElem.setAttribute("style", "position: absolute; " +
                                    "display: inline-block; " +
                                    "top: 0; " + 
                                    "left: 0; " + 
                                    "margin: 0; " +
                                    "border: 0; " +
                                    "padding: 0;");

        var tmpElem_p = tmpElem.appendChild(document.createElement("p"));
        tmpElem_p.setAttribute("style", "margin: 0; " +
                                        "border: 0; " +
                                        "padding: 0;" +
                                        "font-family: " + fntFam + "; " +
                                        "font-size: " + fntSiz + "px; " +
                                        "line-height: " + fntSiz + "px;");
        
        //フォントサイズの画像を追加
        var tmpElem_p_img = tmpElem_p.appendChild(document.createElement("img"));
        tmpElem_p_img.setAttribute("src", "data:image/bmp;base64,Qk1CAAAAAAAAAD4AAAAoAAAAAQAAAAEAAAABAAEAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAA"); //画像直接定義
        tmpElem_p_img.setAttribute("width", fntSiz + "px");
        tmpElem_p_img.setAttribute("height", fntSiz + "px");
        
        //文字列を追加
        var tmpElem_p_span = tmpElem_p.appendChild(document.createElement("span"));
        tmpElem_p_span.textContent = "y";
        
        //calc descender height
        var styleOf_tmpElem_p = window.getComputedStyle(tmpElem_p);
        var descenerHeight = parseFloat(styleOf_tmpElem_p.height) - fntSiz;

        //計算用divの削除
        onlyForCalcElem.removeChild(tmpElem);

        return descenerHeight;
    }

    //
    //スクロールバーの幅を求める
    //
    //caution 小数点以下の値が拾えない
    var widthOfScrollBar;
    function getWidthOfScrollbar(onlyForCalcElem){
        
        var occupyingArea = 100;

        //計算済みの場合はその数値を返すだけ
        if(typeof widthOfScrollBar != 'undefined'){
            return widthOfScrollBar;
        }
        
        //計算用のdivを作る
        var tmpElem = onlyForCalcElem.appendChild(document.createElement("div"));
        tmpElem.setAttribute("class", "getWidthOfScrollbar");
        tmpElem.setAttribute("style", "position: absolute; " +
                                    "display: inline-block; " +
                                    "top: 0; " + 
                                    "left: 0; " + 
                                    "margin: 0; " +
                                    "border: 0; " +
                                    "padding: 0;" +
                                    "width: " + occupyingArea + "px; " +
                                    "height: " + occupyingArea + "px; " +
                                    "overflow: scroll; ");
        
        //overflowするサイズの画像を挿入
        var tmpElem_img = tmpElem.appendChild(document.createElement("img"));
        tmpElem_img.setAttribute("src", "data:image/bmp;base64,Qk1CAAAAAAAAAD4AAAAoAAAAAQAAAAEAAAABAAEAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAA"); //画像直接定義
        tmpElem_img.setAttribute("style", "margin: 0; " +
                                        "border: 0; " +
                                        "padding: 0;" +
                                        "width: " + (occupyingArea * 2 ) + "px; " +
                                        "height: " + (occupyingArea * 2 ) + "px; ");
        
        var scrollbarwidth = tmpElem.offsetWidth - tmpElem.clientWidth;

        //計算用divの削除
        onlyForCalcElem.removeChild(tmpElem);

        return scrollbarwidth;
        
    }

    //
    //dataset[]から特定キー番号のオブジェクトを返す
    //存在しない場合は、'undefined'を返す
    //
    function getBindedDataFromKey(findByThisKey){

        //引数チェック
        if(typeof findByThisKey != 'number'){
            console.warn("specified argument \`findByThisKey\` type is not \`number\`");
            return;
        }

        var bindedData;

        //検索ループ
        for(var i = 0 ; i <  dataset.length ; i++){
            if(dataset[i].key == findByThisKey){
                bindedData = dataset[i];
                break;
            }
        }

        return bindedData;
    }

    //
    //DOM要素のパスを取得する(デバッグ用)
    //
    function getDomPath(el) {
        
        var stack = [];
        
        while ( el.parentNode !== null ) {
            
            var sibCount = 0;
            var sibIndex = 0;
            
            for ( var i = 0; i < el.parentNode.childNodes.length; i++ ) {
                var sib = el.parentNode.childNodes[i];
                if ( sib.nodeName == el.nodeName ) {
                    if ( sib === el ) {
                        sibIndex = sibCount;
                    }
                    sibCount++;
                }
            }

            if ( el.hasAttribute('id') && el.id != '' ) {
                stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
            } else if ( sibCount > 1 ) {
                stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
            } else {
                stack.unshift(el.nodeName.toLowerCase());
            }

            el = el.parentNode;
        }
        
        return stack.slice(1); // removes the html element
    }

})();
