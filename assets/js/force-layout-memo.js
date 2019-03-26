function forceLayoutMemo(initializerObj){

    /* <settings>------------------------------------------------------------------------------------------------ */

    //キー操作設定 `Mousetrap` event
    var keySettings = { 
        
        // Selecting

        deleteNodes: "del", //Nodeの削除
        selectNodeRight: "right",
        selectNodeLeft: "left",
        selectNodeAbove: "up",
        selectNodeBelow: "down",
        highlightNodesSource: "s", //Highlight source node(s)
        highlightNodesTarget: "t", //Highlight target node(s)
        highlightNodesSourceAndTarget: "l",  //Highlight source and target node(s)
        brushSelecting: "b", // selecting node(s) by brush
        connectDatas: "c", //conect nodes
        undo: "ctrl+z", //undo
        redo: "ctrl+y", //redo

        // Editing

        editSVGNodes: "f2", //Node編集モードの開始
        escapeEditor: "esc", // Property Editor の終了

        // Especially for text content

        submitEditingTextTypeSVGNode: "enter", //Node編集状態の確定
        insertLF: "alt+enter", //textTypeのNode編集時に改行を挿入する
        textAnchor_start:     "alt+l", //text align left
        textAnchor_middle:    "alt+c", //text align center
        textAnchor_end:       "alt+r", //text align right
        textFontWeight_bold:  "alt+b", //bold
        textFontStyle_italic: "alt+i", //italic
        
    };

    //外部コンポーネントパス(default)
    var url_externalComponent = "assets/components/force-layout-memo_compo.html";

    //ファイル出力(Export)時に設定するファイル名
    var fileName_Export = "Nodes.json";

    // frameType 未指定時に設定する Default Shape
    var defaultTextFrameShape = "ellipse";

    // linkType 未指定時に設定する Default Shape
    var defaultLinkhape = "line";
    
    //frameとtext間のpadding
    var valOfpadding_frame_text = 5;
    
    //<text>要素内での行間 note:単位は[em]
    var valOfLineHightInText = 1.3;

    //Property Edit Console要素のclass名
    var className_propertyEditConsoleElement = "propertyEditConsole";

    //Transaction History要素のclass名
    var className_transactionHistoryElement = "transactionHistory";

    //描画用SVG要素のclass名
    var className_SVGElementForNodesMapping = "SVGForNodesMapping";

    //描画用SVG内で Node(s) が属する <g>要素 のclass名
    var className_SVGGroupForNodes = "nodes";

    //描画用SVG内で Node(s) が属する <g>要素 のclass名
    var className_SVGGroupForLinkes = "links";

    //描画用SVG内で Selection Layer(s) が属する <g>要素 のclass名
    var className_SVGGroupForSelectionLayers = "selectionLayers";

    //Clickableな要素が選択状態である事を表すclass名
    var className_nodeIsSelected = "selected";

    /* -----------------------------------------------------------------------------------------------</settings> */
    
    /* <Hard cords>---------------------------------------------------------------------------------------------- */

    var classNameInMotherElem = "force-layout-memo";
    
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

    var linkDistance = 100; //linkの長さ

    /* ---------------------------------------------------------------------------------------------</Hard cords> */

    //全ての親となるDOM要素のID名
    var idName_superElement = "";
    
    var dataset = { //Bind用Dataset
        datas:[],
        links:[]
    };
    var transactionHistory = [];  //history

    var nowEditng = false;　      //Property Edit Console が起動中かどうか
    var nowTyping = false;        //<textarea>に focus が当たっている間 true にする()
    var editingNodeKeys = []; //Property Edit Console の 編集対象ノードのkey
    var editingLinkKeys = []; //Property Edit Console の 編集対象Linkのkey
    
    var $3motherElement; //全てのもと
    var $3propertyEditConsoleElement;        //Property Edit Console (D3.js selection)
    var $propertyEditConsoleElement;         //Property Edit Console (jQuery selection)
    var UIisEnable = false;                  //最後にmouse イベントを発生させた部分が、UIエリア内かどうか
    var isAnimatingPropertyEditConsoleElement = false;
    var $propertyEditConsoleElement_node;    //(For Node) Property Edit Console (jQuery selection)
    var $propertyEditConsoleElement_link;    //(For Link) Property Edit Console (jQuery selection)
    var $3transactionHistoryElement;         //Transaction History (D3.js selection)
    var $transactionHistoryElement = null;          //Transaction History (jQuery selection)
    var $3SVGDrawingAreaElement;             //描画用SVG領域 (D3.js selection)
    var $SVGDrawingAreaElement;              //描画用SVG領域 (jQuery selection)
    var $3svgNodesGroup;
    var $3svgNodes;
    var $3svgLinksGroup;
    var $3svgLinks;
    var $3selectionLayersGroup;
    var lastTransFormObj_d3style = null; //最後に zoom・pan を行った時の d3.event.transform object
    var lastCoordinate = {
        rightClick:{x:0, y:0},
        mouse:{x:0, y:0}
    }

    //各Bit と 対応するキー(Bitが立っている間は、そのキー押下がキープされている事を表す)
    // Bit  0 (0000 0001) : keySettings.highlightNodesSource
    // Bit  1 (0000 0010) : keySettings.highlightNodesTarget
    // Bit  2 (0000 0100) : keySettings.highlightNodesSourceAndTarget
    var binCode_KeyPressing = 0;
    var sourceHilighted = false;
    var targetHilighted = false;
    var highlightingStartPointKey = null;

    // <check initializerObj>------------------------------------------------

    var tmpType = typeof initializerObj;
    if(tmpType == 'undefined'){
        console.error("Required argument `initializerObj` is undefined");
        return;
    }
    if(tmpType != 'object'){
        console.error("Required argument `initializerObj` is defined as `" + tmpType + "` type. Required type is `object`.");
        return;
    }
    
    var tmpType = typeof initializerObj.elemIdNameToBind;
    if(tmpType == 'undefined'){
        console.error("Required argument `initializerObj.elemIdNameToBind` is undefined");
        return;
    }
    if(tmpType != 'string'){
        console.error("Required argument `initializerObj.elemIdNameToBind` is defined as `" + tmpType + "` type. Required type is `string`.");
        return;
    }
    var tmpElem = document.getElementById(initializerObj.elemIdNameToBind);
    if(tmpElem === null){
        console.error("Specified argment initializerObj.elemIdNameToBind:`" + initializerObj.elemIdNameToBind + "` is not exist.");
        return;
    }
    if(tmpElem.classList.contains(classNameInMotherElem)){ //すでに bind 済みだった場合
        console.error("Specified element (specified by argment initializerObj.elemIdNameToBind:`" + initializerObj.elemIdNameToBind + "`) has already class name `" + classNameInMotherElem + "`.");
        return;
    }
    idName_superElement = initializerObj.elemIdNameToBind;

    var tmpType = typeof initializerObj.componentPath;
    if(tmpType != 'undefined'){
        if(tmpType != 'string'){
            console.error("Specified argument `initializerObj.componentPath` is defined as `" + tmpType + "` type. Required type is `string`.");
            return;
        }
        url_externalComponent = initializerObj.componentPath;
    }
    
    // -----------------------------------------------</check initializerObj>

    var mousetrapInstance = new Mousetrap();
    var dataSelectionManager = new clsfnc_dataSelectionManager();
    var historyManager = new clsfnc_historyManager();

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

    //Node初期化用Objを作る
    function makeSetDafaultObj_forLink(){

        var toRetObj;

        toRetObj = {};
        toRetObj.line = {};
        toRetObj.line.stroke = null;
        toRetObj.line.stroke_width = null;
        toRetObj.line.stroke_dasharray = null;
        toRetObj.line.marker_end = null;

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

        var propertyEditingBehavor_line_stroke;
        var propertyEditingBehavor_line_stroke_width;
        var propertyEditingBehavor_line_marker_end;
        var propertyEditingBehavor_line_stroke_dasharray;

        $propertyEditConsoleElement_node = $propertyEditConsoleElement.find(".type.node");
        $propertyEditConsoleElement_link = $propertyEditConsoleElement.find(".type.link");

        //text.text_content
        propertyEditingBehavor_text_text_content = new propertyEditorBehavor_text('datas', ['text','text_content']);

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
                                                                                         'datas',
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
                                                                                      'datas',
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
                                                                                      'datas',
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
                                                                               'datas',
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
                                                                                              'datas',
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
                                                                                             'datas',
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
                                                                                      'datas',
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
                                                                                         'datas',
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
                                                                             'datas',
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
                                                                                      'datas',
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
                                                                                            'datas',
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
                                                                           'datas',
                                                                           ['text', 'frame_fill'],
                                                                           confirmPropertyEditors,
                                                                           adjustPropertyEditors);
        
        // Default all
        var $propertyEditor_all = $propertyEditConsoleElement.find(".propertyEditor.all.node");
        var $propertyEditor_all_defaultBtnElem = $propertyEditor_all.children(".setAsDefault").eq(0);
        var dummuyFor_propertyEditor_all;
        new propertyEditorBehavor_setAsDefault($propertyEditor_all_defaultBtnElem,
                                               'datas',
                                               dummuyFor_propertyEditor_all, // <- 'undefined'を渡して、全て削除とする
                                               confirmPropertyEditors,
                                               adjustPropertyEditConsole); // <- 全てのProperty Editor を adjustする

        //<for Link>--------------------------------------------------------------------------------------------------

        //line.stroke
        var $propertyEditor_line_stroke = $propertyEditConsoleElement.find(".propertyEditor.stroke");
        var $propertyEditor_line_stroke_picker = $propertyEditor_line_stroke.children(".picker").eq(0);
        var $propertyEditor_line_stroke_inputElem = $propertyEditor_line_stroke.children(".pickedColorText").eq(0);
        var $propertyEditor_line_stroke_defaultBtnElem = $propertyEditor_line_stroke.children(".setAsDefault").eq(0);
        var $propertyEditor_line_stroke_expMsg = $propertyEditor_line_stroke.children(".message.explicitness").eq(0);
        propertyEditingBehavor_line_stroke = new propertyEditorBehavor_fill($propertyEditor_line_stroke_inputElem,
                                                                             $propertyEditor_line_stroke_picker,
                                                                             $propertyEditor_line_stroke_defaultBtnElem,
                                                                             $propertyEditor_line_stroke_expMsg,
                                                                             'links',
                                                                             ['line', 'stroke'],
                                                                             confirmPropertyEditorsLink,
                                                                             adjustPropertyEditorsLink);

        //line.stroke_width
        var $propertyEditor_line_stroke_width = $propertyEditConsoleElement.find(".propertyEditor.stroke_width");
        var $propertyEditor_line_stroke_width_input = $propertyEditor_line_stroke_width.children(".number_property").eq(0);
        var $propertyEditor_line_stroke_width_defaultBtnElem = $propertyEditor_line_stroke_width.children(".setAsDefault").eq(0);
        var $propertyEditor_line_stroke_width_expMsg = $propertyEditor_line_stroke_width.children(".message.explicitness").eq(0);
        propertyEditingBehavor_line_stroke_width = new propertyEditorBehavor_numberInput($propertyEditor_line_stroke_width_input,
                                                                                      $propertyEditor_line_stroke_width_defaultBtnElem,
                                                                                      $propertyEditor_line_stroke_width_expMsg,
                                                                                      'links',
                                                                                      ['line', 'stroke_width'],
                                                                                      confirmPropertyEditorsLink,
                                                                                      adjustPropertyEditorsLink);
                                                                                      
        //line.marker_end
        var $propertyEditor_line_marker_end = $propertyEditConsoleElement.find(".propertyEditor.marker_end");
        var elemAndValArr_line_marker_end = [];
        elemAndValArr_line_marker_end.push({$elem: $propertyEditor_line_marker_end.children('.arrowType[data-arrow_type="none"]').eq(0),
                                             useThisVal: null});
        elemAndValArr_line_marker_end.push({$elem: $propertyEditor_line_marker_end.children('.arrowType[data-arrow_type="arrow1"]').eq(0),
                                             useThisVal: 'arrow1'});
        var $propertyEditor_line_marker_end_expMsg = $propertyEditor_line_marker_end.children(".message.explicitness").eq(0);
        var $propertyEditor_line_marker_end_defaultBtnElem = $propertyEditor_line_marker_end.children(".setAsDefault").eq(0);
        propertyEditingBehavor_line_marker_end = new propertyEditorBehavor_radioButtons(elemAndValArr_line_marker_end,
                                                                                         $propertyEditor_line_marker_end_defaultBtnElem,
                                                                                         $propertyEditor_line_marker_end_expMsg,
                                                                                         'links',
                                                                                         ['line', 'marker_end'],
                                                                                         confirmPropertyEditorsLink,
                                                                                         adjustPropertyEditorsLink);
                                                                                      
        //line.stroke_dasharray
        var $propertyEditor_line_stroke_dasharray = $propertyEditConsoleElement.find(".propertyEditor.stroke_dasharray");
        var $propertyEditor_line_stroke_dasharray_input = $propertyEditor_line_stroke_dasharray.children(".text_property").eq(0);
        var $propertyEditor_line_stroke_dasharray_defaultBtnElem = $propertyEditor_line_stroke_dasharray.children(".setAsDefault").eq(0);
        var $propertyEditor_line_stroke_dasharray_expMsg = $propertyEditor_line_stroke_dasharray.children(".message.explicitness").eq(0);
        propertyEditingBehavor_line_stroke_dasharray = new propertyEditorBehavor_textInput($propertyEditor_line_stroke_dasharray_input,
                                                                                            $propertyEditor_line_stroke_dasharray_defaultBtnElem,
                                                                                            $propertyEditor_line_stroke_dasharray_expMsg,
                                                                                            'links',
                                                                                            ['line', 'stroke_dasharray'],
                                                                                            confirmPropertyEditorsLink,
                                                                                            adjustPropertyEditorsLink);

        // Default all
        var $propertyEditor_all_link = $propertyEditConsoleElement.find(".propertyEditor.all.link");
        var $propertyEditor_all_link_defaultBtnElem = $propertyEditor_all_link.children(".setAsDefault").eq(0);
        var dummuyFor_propertyEditor_all_link;
        new propertyEditorBehavor_setAsDefault($propertyEditor_all_link_defaultBtnElem,
                                               'links',
                                               dummuyFor_propertyEditor_all_link, // <- 'undefined'を渡して、全て削除とする
                                               confirmPropertyEditorsLink,
                                               adjustPropertyEditConsole); // <- 全てのProperty Editor を adjustする

        //-------------------------------------------------------------------------------------------------</for Link>

        // Property Editor の編集状態を Style Object (Nodeの状態) に合わせる
        this.adjust = function(computedStyleObj, explicitnessObj){
            adjustPropertyEditors(computedStyleObj, explicitnessObj);
        }

        this.adjustLink = function(computedStyleObj, explicitnessObj){
            adjustPropertyEditorsLink(computedStyleObj, explicitnessObj);
        }

        // Property Editor が編集中の場合、編集状態を確定させる
        this.cancel = function(){
            cancelPropertyEditors();
            cancelPropertyEditorsLink();
        }

        // Property Editor が編集中の場合、編集状態を確定させる
        this.confirm = function(){
            confirmPropertyEditors();
            confirmPropertyEditorsLink();
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

        //
        // Property Editor(Link用) の編集状態を Style Object (Linkの状態) に合わせる
        //
        function adjustPropertyEditorsLink(computedStyleObj, explicitnessObj){
            
            if((typeof computedStyleObj == 'object') && (typeof computedStyleObj == 'object')){ 

                propertyEditingBehavor_line_stroke.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_line_stroke_width.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_line_marker_end.adjustToStyleObj(computedStyleObj, explicitnessObj);
                propertyEditingBehavor_line_stroke_dasharray.adjustToStyleObj(computedStyleObj, explicitnessObj);
            }
        }

        function cancelPropertyEditors(){
            // propertyEditingBehavor_text_text_content.cancel(); //<- APIを用意していない
            propertyEditingBehavor_text_text_anchor.cancel();
            propertyEditingBehavor_text_font_family.cancel();
            propertyEditingBehavor_text_font_size.cancel();
            propertyEditingBehavor_text_text_fill.cancel();
            propertyEditingBehavor_text_text_font_weight.cancel();
            propertyEditingBehavor_text_text_font_style.cancel();
            propertyEditingBehavor_text_text_decoration.cancel();
            propertyEditingBehavor_text_frame_shape.cancel();
            propertyEditingBehavor_frame_stroke.cancel();
            propertyEditingBehavor_frame_stroke_width.cancel();
            propertyEditingBehavor_frame_stroke_dasharray.cancel();
            propertyEditingBehavor_frame_fill.cancel();
        }

        function cancelPropertyEditorsLink(){
            propertyEditingBehavor_line_stroke.cancel();
            propertyEditingBehavor_line_stroke_width.cancel();
            propertyEditingBehavor_line_marker_end.cancel();
            propertyEditingBehavor_line_stroke_dasharray.cancel();
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

        function confirmPropertyEditorsLink(){
            propertyEditingBehavor_line_stroke.confirm();
            propertyEditingBehavor_line_stroke_width.confirm();
            propertyEditingBehavor_line_marker_end.confirm();
            propertyEditingBehavor_line_stroke_dasharray.confirm();
        }
    }
    //----------------------------------------------------------</Element Selections and Settings of PropertyEditor>

    //DOM構築
    $3motherElement = d3.select("#" + idName_superElement) //全てのもと
        .classed(classNameInMotherElem, true)
        .style("font-size", "0")
        .style("overflow", "hidden")
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

        propertyEditorsManager = new wrapperOfPropertyEditors(); //PropertyEditConsole
        toggleBeforeLoadEvent(); //ページ移動前確認イベントをaddEvent

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
        .style("width", "100%")
        .style("height", "100%")
        .style("overflow", "hidden") // <- ieではこれを指定しないと範囲外の小要素がクリップされない
        .style("vertical-align", "bottom");

    $SVGDrawingAreaElement = $($3SVGDrawingAreaElement.node());

    $3SVGDrawingAreaElement.append("defs")
        .append("marker")
        .attr("id", "arrow1")
        .attr("refX", 40)
        .attr("refY", 1)
        .attr("viewBox", "0 -10 20 20")
        .attr("markerWidth", "20")
        .attr("markerHeight", "20")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-10 L20,0 0,10 Z")
        .attr("fill", "#eab942");
        
    $3svgLinksGroup = $3SVGDrawingAreaElement.append("g") //linkグループの作成
        .classed(className_SVGGroupForLinkes, true);

    $3svgNodesGroup = $3SVGDrawingAreaElement.append("g") //ノードグループの作成
        .classed(className_SVGGroupForNodes, true);

    $3selectionLayersGroup = $3SVGDrawingAreaElement.append("g") //Selection Layer 用グループの作成
        .classed(className_SVGGroupForSelectionLayers, true);

    $3svgNodes = $3svgNodesGroup.selectAll("g.node") // ノード追加
        .data(dataset.datas, function(d){return d.key});

    $3svgLinks = $3svgLinksGroup.selectAll("g.link") // link追加
        .data(dataset.links, function(d){return d.key});

    //ファイルのDragoverイベント
    $SVGDrawingAreaElement.get(0).addEventListener('dragover', function(e){
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    //ファイルをDropした場合
    $SVGDrawingAreaElement.get(0).addEventListener('drop', function(e){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
        
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
                        var appendingSafeObjArr = checkObjArr(parsedObj);

                        if(appendingSafeObjArr.datas.length == 0 &&
                            appendingSafeObjArr.links.length == 0){ //有効な要素が存在しなかった場合
                            
                            console.error("\`" + nm + "\` has no available object.");
                        
                        }else{
                            var appendingTotalReport = appendNodes(appendingSafeObjArr);
                            historyManager.appendHistory(appendingTotalReport);
                        }
                        

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

    // <mouse イベントを発生させた部分が、範囲内部分かどうかを判定する>-----------
    $(document).on('click', function(e) {
        checkUIisEnable(e);

    });
    $(document).on("mousedown", function(e){
        checkUIisEnable(e);

    });
    function checkUIisEnable(e){
        var closestDoms = $(e.target).closest('#' + idName_superElement);

        if(closestDoms.length) {
            UIisEnable = true;
        
        }else{ // ターゲット要素をクリックした時
            UIisEnable = false;
        }
    }
    // ----------</mouse イベントを発生させた部分が、範囲内部分かどうかを判定する>
    
    // Node以外に対する click event
    $SVGDrawingAreaElement.on('click', function(e){

        // SVG領域に対する選択でない場合(Node等)はハジく
        if(!(d3.select(e.target).classed(className_SVGElementForNodesMapping))){return;}

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
        
        if(nowEditng){ // 編集中の場合

            exitEditing(); //編集モードの終了
        
        }else{  // 編集中でない場合
            
            dataSelectionManager.clearSelections(); //node選択状態をクリア
        }
    });

    // Node以外に対する right click event
    var clsNameForCntxtMenu = getUniqueClassName('context-menu-');
    $3SVGDrawingAreaElement.classed(clsNameForCntxtMenu, true);
    $.contextMenu({
        selector: '.' + clsNameForCntxtMenu,
        items: {
            add:{
                name: "Add (A)",
                accesskey: 'a',
                callback: function(itemKey, opt){
                    var uniqueDataKeyName;
                    if(dataset.datas.length == 0){
                        uniqueDataKeyName = '0';
                    }else{
                        uniqueDataKeyName = makeUniqueKey(dataset.datas[(dataset.datas.length-1)].key, isReservedDataKey);
                    }
                    var appendingTotalReport = appendNodes({
                        datas:[
                            {
                                key:uniqueDataKeyName,
                                coordinate: { //右クリック位置に挿入する
                                    x:lastCoordinate.rightClick.x,
                                    y:lastCoordinate.rightClick.y
                                },
                                type:"text",
                                text: {
                                    text_content: ""
                                }
                            }
                        ]
                    });
                    historyManager.appendHistory(appendingTotalReport);

                    var bindedData =  getBindedDataFromKey(appendingTotalReport.reportsArr.datas[0].key);
                    call_editSVGNode(bindedData);
                }
            },
            edit:{
                //編集開始
                name: "Edit (" + keySettings.editSVGNodes.toUpperCase() + ")",
                //accesskey の handling は keySettings.editSVGNodes に任せる
                callback: function(itemKey, opt){
                    call_editSVGNodes(false);
                }
            },
            export: {
                //エクスポート
                name: "Export (E)",
                accesskey: 'e',
                items:{
                    export_all:{
                        name: "Export All (A)",
                        accesskey: 'a',//todo <- "Add (A)"が優先されてしまう
                        callback: function(itemKey, opt){
                            //DL確認画面終了後にhide出来ないことがあるので、先にhideする
                            opt.$menu.trigger("contextmenu:hide");

                            exportNodes(false); //全Node(s)ファイル吐き出し
                        }
                    },
                    export_selected:{
                        name: "Export Selected (S)",
                        accesskey: 's',
                        callback: function(itemKey, opt){
                            //DL確認画面終了後にhide出来ないことがあるので、先にhideする
                            opt.$menu.trigger("contextmenu:hide");

                            exportNodes(true); //選択Node(s)ファイル吐き出し
                        }
                    },
                }
                
            },
        },
        position: function (opt, x, y) {

            var boundingClientRect = $SVGDrawingAreaElement.get(0).getBoundingClientRect();
            
            var transformObj = {
                translates: {x:0, y:0},
                scale: 1
            };

            if(lastTransFormObj_d3style !== null){
                transformObj.translates.x = lastTransFormObj_d3style.x;
                transformObj.translates.y = lastTransFormObj_d3style.y;
                transformObj.scale = lastTransFormObj_d3style.k;
            }

            //右クリック位置の保存
            lastCoordinate.rightClick.x = ((x - boundingClientRect.left) - transformObj.translates.x) / transformObj.scale;
            lastCoordinate.rightClick.y = ((y - boundingClientRect.top) - transformObj.translates.y) / transformObj.scale;

            var $win = $(window);

            //<Same as jquery.contextMenu-2.7.1.js>-----------------

            var offset;
            // determine contextMenu position
            if (!x && !y) {
                opt.determinePosition.call(this, opt.$menu);
                return;
            } else if (x === 'maintain' && y === 'maintain') {
                // x and y must not be changed (after re-show on command click)
                offset = opt.$menu.position();
            } else {
                // x and y are given (by mouse event)
                var offsetParentOffset = opt.$menu.offsetParent().offset();
                offset = {top: y - offsetParentOffset.top, left: x -offsetParentOffset.left};
            }

            // correct offset if viewport demands it
            var bottom = $win.scrollTop() + $win.height(),
                right = $win.scrollLeft() + $win.width(),
                height = opt.$menu.outerHeight(),
                width = opt.$menu.outerWidth();

            if (offset.top + height > bottom) {
                offset.top -= height;
            }

            if (offset.top < 0) {
                offset.top = 0;
            }

            if (offset.left + width > right) {
                offset.left -= width;
            }

            if (offset.left < 0) {
                offset.left = 0;
            }

            opt.$menu.css(offset);

            //----------------</Same as jquery.contextMenu-2.7.1.js>
        },
        callback: function(itemKey, opt){ //keyup event
            //DL確認画面終了後にhide出来ないことがあるので、先にhideする
            opt.$menu.trigger("contextmenu:hide");
            
            console.warn("Unkown Item selected. Itemkey:\`" + itemKey + "\`, DOM: ", opt.$trigger.get(0));
        }
    });

    // SVG領域の Zoom・Pan イベント
    var zoom = d3.zoom()
        .on("zoom", function(){
            lastTransFormObj_d3style = d3.event.transform; //最終状態を保存(Node Append/復活時に利用する)

            $3svgNodes.each(function(d, i){
                d.$3bindedSVGElement.attr("transform", lastTransFormObj_d3style);
                d.$3bindedSelectionLayerSVGElement.attr("transform", lastTransFormObj_d3style);
            });

            $3svgLinks.each(function(d, i){
                d.$3bindedSVGLinkElement.attr("transform", lastTransFormObj_d3style);
                d.$3bindedSelectionLayerSVGElement.attr("transform", lastTransFormObj_d3style);
            });

            if(connectStarted){ // link 追加モードの場合は、preview 表示中のlinkも更新する
                targetDrawerObj.$3bindedSVGLinkElement.attr("transform", lastTransFormObj_d3style);
                targetDrawerObj.$3bindedSelectionLayerSVGElement.attr("transform", lastTransFormObj_d3style);
            }

            if(nowEditng){
                adjustPropertyEditConsole(true); //Node個別編集機能のみadjustする(heavyすぎる為)
            }
        });

    // SVG領域の Zoom・Pan 機能を適用
    startZoom();
    function startZoom(){
        
        $3SVGDrawingAreaElement.on(".zoom", null); //登録済みのzoomがあったら、削除する
        $3SVGDrawingAreaElement.call(zoom)
            .on("dblclick.zoom", null); // <- dblclickによるNode編集イベントとの競合を回避する
    }

    //Zoom・Pan 機能を取り除く
    function removeZoom(){
        $3SVGDrawingAreaElement.on(".zoom", null);
    }
    
    // 指定座標に向けて panning する
    function pan(x, y){
    	
    	var scale = (lastTransFormObj_d3style !== null ? lastTransFormObj_d3style.k : 1);

        $3SVGDrawingAreaElement.transition()
            .duration(200)
            .call(zoom.transform, d3.zoomIdentity
                
                .translate( //指定座標が画面中央に来るようにする
                    (($3motherElement.node().offsetWidth / 2) / scale - x) * scale,
                    (($3motherElement.node().offsetHeight / 2) / scale - y) * scale
                )
                .scale( //表示中の scale のままにする
                    scale
                )
            );
    }

    // right click context menu の mouse enter event
    $(document.body).on("contextmenu:focus", ".context-menu-item", 
        function(e){
            //console.log("focus:", this);
        }
    );

    // right click context menu の mouse leave event
    //
    //caution
    //context-mexuのいずれかのitemをclickしてhideした後も、
    //すべてのitemに対してcallされる
    $(document.body).on("contextmenu:blur", ".context-menu-item",
        function(e){ 
            //console.log("blur:", this);
        }
    );

    $(document).on("keydown", function(e){
        
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく

        switch(e.keyCode){

            case 93: //application key
            {
                applicationKeyDwon(e);
            }
            break;

            default:
            break;
        }
    });

    var returnThisOnContextMenu = true;
    $(document).on("contextmenu", function(){
        var tmp = returnThisOnContextMenu;
        returnThisOnContextMenu = true;
        return tmp;
    });

    function applicationKeyDwon(e){

        //編集中の場合はハジく
        if(nowEditng){return;}

        var showContextMenuHere = {
            x:0,
            y:0
        }

        var boundingClientRect = $SVGDrawingAreaElement.get(0).getBoundingClientRect();
        var latestSelectedData = dataSelectionManager.getLatestSelectedData();
        if(typeof latestSelectedData !== 'undefined'){ //選択対象Nodeが存在する場合

            var transformObj = {
                translates: {x:0, y:0},
                scale: 1
            };

            if(lastTransFormObj_d3style !== null){
                transformObj.translates.x = lastTransFormObj_d3style.x;
                transformObj.translates.y = lastTransFormObj_d3style.y;
                transformObj.scale = lastTransFormObj_d3style.k;
            }

            showContextMenuHere.x = 
                latestSelectedData.coordinate.x * transformObj.scale +
                transformObj.translates.x +
                boundingClientRect.left
            ;

            showContextMenuHere.y =
                latestSelectedData.coordinate.y * transformObj.scale +
                transformObj.translates.y +
                boundingClientRect.top
            ;
            
        
        }else{
            // 画面中央にメニューを表示する
            showContextMenuHere.x =
                boundingClientRect.left + ($3motherElement.node().offsetWidth / 2)
            ;

            showContextMenuHere.y =
                boundingClientRect.top + ($3motherElement.node().offsetHeight / 2)
            ;
        }

        $("." + clsNameForCntxtMenu).contextMenu(showContextMenuHere); //contextMenu の表示
        

        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない

        //document.oncontextmenuイベントで、
        //ブラウザデフォルトメニューを表示させない
        returnThisOnContextMenu = false;
    }

    //note
    // Mousetrap() に引数を渡さない(= Mousetrap(domElement).bind(~)の形式にしない)理由は、
    // 引数に指定する Dom Element が、キーボード入力を受け付けるタイプのではない場合
    // (e.g. <textarea>, <input> 要素)、
    // Mousetrap がイベントを取得できないから。(特にie以外のブラウザ)
    
    // Nodeに対する複数編集イベント
    mousetrapInstance.bind(keySettings.editSVGNodes, function(e){

        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく

        call_editSVGNodes(true);
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    // Node編集機能の終了
    mousetrapInstance.bind(keySettings.escapeEditor, function(e, combo){

        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく

        if(nowEditng){ // 編集中の場合
            exitEditing(); //編集モードの終了
        }
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    // Nodeに対する削除イベント
    mousetrapInstance.bind(keySettings.deleteNodes, function(e){

        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく

        //External Component が未 load でない場合
        if(checkSucceededLoadOf_ExternalComponent()){
            if(nowEditng){ // 編集中の場合
                //nothing to do
            
            }else{ // 編集中でない場合
    
                deleteSVGNodes(); //選択状態のNode(s)を削除
                dataSelectionManager.clearSelections(); //node選択履歴をクリア
                disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
            }
        }
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    //arrow key による node 選択イベント
    mousetrapInstance.bind(keySettings.selectNodeRight, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        // console.log(">");
        call_getColsestData("right_an90");
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.selectNodeLeft, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        // console.log("<");
        call_getColsestData("left_an90");
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.selectNodeAbove, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        // console.log("^");
        call_getColsestData("above_an90");
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.selectNodeBelow, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        // console.log("v");
        call_getColsestData("below_an90");
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    //todo
    //highlight, brush, connect を同時押しされた時のハンドリング

    // Node, Link に対する Source, Target highlighting イベント
    mousetrapInstance.bind(keySettings.highlightNodesSource, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        binCode_KeyPressing |= 1;
        call_appendHighlight();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keydown');
    
    mousetrapInstance.bind(keySettings.highlightNodesSource, function(e, combo){
        binCode_KeyPressing &= (~1);
        call_removeHighlight();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keyup');

    mousetrapInstance.bind(keySettings.highlightNodesTarget, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        binCode_KeyPressing |= 2;
        call_appendHighlight();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keydown');

    mousetrapInstance.bind(keySettings.highlightNodesTarget, function(e, combo){
        binCode_KeyPressing &= (~2);
        call_removeHighlight();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keyup');

    mousetrapInstance.bind(keySettings.highlightNodesSourceAndTarget, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        binCode_KeyPressing |= 4;
        call_appendHighlight();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keydown');

    mousetrapInstance.bind(keySettings.highlightNodesSourceAndTarget, function(e, combo){
        binCode_KeyPressing &= (~4);
        call_removeHighlight();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keyup');

    mousetrapInstance.bind(keySettings.brushSelecting, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        startBrush();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keydown');

    mousetrapInstance.bind(keySettings.brushSelecting, function(e, combo){
        removeBrush();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keyup');

    mousetrapInstance.bind(keySettings.connectDatas, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        checkStartConnect();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keydown');

    mousetrapInstance.bind(keySettings.connectDatas, function(e, combo){
        removeConnect();
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    }, 'keyup');

    mousetrapInstance.bind(keySettings.undo, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        if(nowTyping){return;} //<textarea>の編集中はハジく

        historyManager.traceHistory(-1);
        
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.redo, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        if(nowTyping){return;} //<textarea>の編集中はハジく

        historyManager.traceHistory(1);
        
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.textAnchor_start, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        changeStyle('start', ['text', 'text_anchor'], 'datas');
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.textAnchor_middle, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        changeStyle('middle', ['text', 'text_anchor'], 'datas');
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.textAnchor_end, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        changeStyle('end', ['text', 'text_anchor'], 'datas');
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.textFontWeight_bold, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        changeStyle('bold', ['text', 'text_font_weight'], 'datas');
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    mousetrapInstance.bind(keySettings.textFontStyle_italic, function(e, combo){
        if(!UIisEnable){return;} //UIエリア範囲外で mouse event を発生させていた場合はハジく
        changeStyle('italic', ['text', 'text_font_style'], 'datas');
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
    });

    function call_appendHighlight(){
        
        if((binCode_KeyPressing & (1 | 4)) > 0){ //source highlight 指定
            if(!sourceHilighted){ // source に対する highlight 有効化を1回もしていない場合
                appendHighlight("source");
                sourceHilighted = true;
            }
        }

        if((binCode_KeyPressing & (2 | 4)) > 0){ //target highlight 指定

            if(!targetHilighted){ // target に対する highlight 有効化を1回もしていない場合
                appendHighlight("target");
                targetHilighted = true;
            }
        }
    }

    function appendHighlight(sourceOrTarget){

        //編集中の場合はハジく
        if(nowEditng){return;}

        var latestSelectedData = dataSelectionManager.getLatestSelectedData();
        //最終選択 node がある状態で、1回目のコールの場合
        if(typeof latestSelectedData !== 'undefined' && highlightingStartPointKey === null){
            highlightingStartPointKey = latestSelectedData.key;
        }

        //最終選択 node がある状態で開始されなかった場合
        if(highlightingStartPointKey === null){return;}

        var toFindSourceOrTarget = (sourceOrTarget == 'source' ? 'target' : 'source' );

        for(var i = 0 ; i < dataset.links.length ; i++){
            if(dataset.links[i][toFindSourceOrTarget].key == highlightingStartPointKey){
                dataset.links[i][sourceOrTarget].$3bindedSelectionLayerSVGElement.classed("highlight", true);
                dataset.links[i].$3bindedSelectionLayerSVGElement.classed("highlight", true);
            }
        }
    }

    function call_removeHighlight(){

        if((binCode_KeyPressing & (1 | 4)) == 0){ //source highlight 解除指定

            if(sourceHilighted){
                removeHighlight("source");
                sourceHilighted = false;
            }
        }

        if((binCode_KeyPressing & (2 | 4)) == 0){ //target highlight 解除指定

            if(targetHilighted){
                removeHighlight("target");
                targetHilighted = false;
            }
        }

        if((binCode_KeyPressing & (1 | 2 | 4)) == 0){ //highlight すべて解除後
            highlightingStartPointKey = null;
        }
    }

    function removeHighlight(sourceOrTarget){

        //note
        //以下2つの処理は appendHighlight() がハジいているので不要
        //
        //・編集中の場合はハジく
        // if(nowEditng){return;}
        // 
        //・最終選択 node がある状態で開始されなかった場合
        // if(highlightingStartPointKey === null){return;}

        var toFindSourceOrTarget = (sourceOrTarget == 'source' ? 'target' : 'source' );

        for(var i = 0 ; i < dataset.links.length ; i++){
            if(dataset.links[i][toFindSourceOrTarget].key == highlightingStartPointKey){
                dataset.links[i][sourceOrTarget].$3bindedSelectionLayerSVGElement.classed("highlight", false);
                dataset.links[i].$3bindedSelectionLayerSVGElement.classed("highlight", false);
            }
        }
    }

    function call_getColsestData(direction){

        //編集中の場合はハジく
        if(nowEditng){return;}

        var latestSelectedData = dataSelectionManager.getLatestSelectedData();

        //最終選択 node が存在しない場合画面中央を検索起点に指定
        if(typeof latestSelectedData == 'undefined'){
            
            var transformObj = {
                translates: {x:0, y:0},
                scale: 1
            };

            if(lastTransFormObj_d3style !== null){
                transformObj.translates.x = lastTransFormObj_d3style.x;
                transformObj.translates.y = lastTransFormObj_d3style.y;
                transformObj.scale = lastTransFormObj_d3style.k;
            }

            latestSelectedData = {
                coordinate:{
                    x: (($3motherElement.node().offsetWidth / 2) - transformObj.translates.x) / transformObj.scale,
                    y: (($3motherElement.node().offsetHeight / 2) - transformObj.translates.y) / transformObj.scale
                }
            };
            direction = 'whole';
        }
        
        //source or target highlighting 中かどうか判定
        var highlintingOnly = false;
        if( highlightingStartPointKey !== null ) {highlintingOnly = true;}

        var closestData;

        switch(direction){

            case 'whole': //全方向指定の場合
            {
                closestData = getColsestData(latestSelectedData, highlintingOnly);
            }
            break;
            
            case 'right_an90':
            {
                var checkerObjArr = [
                    {
                        type:"quadratic",
                        coef:{
                            a:(-1),
                            b:(latestSelectedData.coordinate.y - ((-1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_higher"
                    },
                    {
                        type:"quadratic",
                        coef:{
                            a:(1),
                            b:(latestSelectedData.coordinate.y - ((1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_lower"
                    }
                ];

                closestData = getColsestData(latestSelectedData, highlintingOnly, checkerObjArr);
            }
            break;

            case 'left_an90':
            {
                var checkerObjArr = [
                    {
                        type:"quadratic",
                        coef:{
                            a:(-1),
                            b:(latestSelectedData.coordinate.y - ((-1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_lower"
                    },
                    {
                        type:"quadratic",
                        coef:{
                            a:(1),
                            b:(latestSelectedData.coordinate.y - ((1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_higher"
                    }
                ];

                closestData = getColsestData(latestSelectedData, highlintingOnly, checkerObjArr);
            }
            break;
            
            case 'above_an90':
            {
                var checkerObjArr = [
                    {
                        type:"quadratic",
                        coef:{
                            a:(-1),
                            b:(latestSelectedData.coordinate.y - ((-1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_lower"
                    },
                    {
                        type:"quadratic",
                        coef:{
                            a:(1),
                            b:(latestSelectedData.coordinate.y - ((1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_lower"
                    }
                ];

                closestData = getColsestData(latestSelectedData, highlintingOnly, checkerObjArr);
            }
            break;

            case 'below_an90':
            {
                var checkerObjArr = [
                    {
                        type:"quadratic",
                        coef:{
                            a:(-1),
                            b:(latestSelectedData.coordinate.y - ((-1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_higher"
                    },
                    {
                        type:"quadratic",
                        coef:{
                            a:(1),
                            b:(latestSelectedData.coordinate.y - ((1)*latestSelectedData.coordinate.x))
                        },
                        direction:"y_higher"
                    }
                ];

                closestData = getColsestData(latestSelectedData, highlintingOnly, checkerObjArr);
            }
            break;

            default: //コーディングミスの場合
            {
                console.error("Unknown direction:\`" + direction + "\` specified.");
            }
            break;
        }

        if(typeof closestData != 'undefined'){ //data が見つかった場合
            
            dataSelectionManager.clearSelections(); //node選択履歴をクリア
            dataSelectionManager.pushDataSelection(closestData); //見つかった node を追加

            viewPortCheck(closestData); //画面範囲内チェック
        
        }else{　//data が見つからなかった場合
            viewPortCheck(latestSelectedData); //検索起点の data の画面範囲内チェックのみ行う
        }
    }

    // BindedData に一番近い位置にある data を返す
    // BindedData ではなく座標指定のみする場合は、
    // {coordinate:{x:?, y:?}}形式の Obj を指定する
    function getColsestData(fromThisBindedData, highlintingOnly, checkerObjArr){

        var closestData;
        var closestDistance = 0;

        for(var i = 0 ; i < dataset.datas.length ; i++){

            var tmpData = dataset.datas[i];
            var haveTocheck;

            if(typeof fromThisBindedData.key == 'string' && // key定義がある(=bindedData)の場合
                tmpData.key == fromThisBindedData.key){     // 検索起点 data の場合
                    
                haveTocheck = false;

            }else if(highlintingOnly && (!tmpData.$3bindedSelectionLayerSVGElement.classed("highlight"))){
                //highlightOnly 指定なのに、"highlight" されていない node の場合
                haveTocheck = false;

            }else{
                haveTocheck = true;
            }

            if(haveTocheck){

                var checkResult;

                if(typeof checkerObjArr != 'undefined'){ //範囲チェック指定アリの場合
                    checkResult = arrangementCheck(checkerObjArr, tmpData.coordinate);
                
                }else{ //範囲チェック指定ナシの場合
                    checkResult = true; //指定範囲OKとする
                }

                if(checkResult){ //指定範囲に収まっている場合

                    //node 間距離を求める
                    var tmpDistance = Math.sqrt(
                        Math.pow(Math.abs(tmpData.coordinate.y - fromThisBindedData.coordinate.y), 2) + 
                        Math.pow(Math.abs(tmpData.coordinate.x - fromThisBindedData.coordinate.x), 2)
                    );

                    if(typeof closestData == 'undefined'){ //1つめにみつかった data の場合
                        closestData = tmpData;
                        closestDistance = tmpDistance;
                    
                    }else{ //2つめ以降にみつかった data の場合
                        
                        if(tmpDistance < closestDistance){ // 以前みつかった data より、より近い data の場合
                            closestData = tmpData;
                            closestDistance = tmpDistance;
                        }
                    }
                }
            }
        }

        return closestData;
    }

    //data が画面範囲内に入っているかチェックする
    // 入っていない場合は、入るように panning する
    function viewPortCheck(checkThisData){

        var viewPortObj = getCoordinatesOfViewPort(); //画面表示領域座標を取得

        //画面表示領域座標を 30% 縮めた座標を取得
        var percentageOfAllowed = 0.7;
        var halfPercentageOfNotAllowed = (1-percentageOfAllowed)/2;
        var widthOfViewPort = viewPortObj.belowRight.x - viewPortObj.aboveLeft.x;
        var heightOfViewPort = viewPortObj.belowRight.y - viewPortObj.aboveLeft.y;
        var allowedAreaObj = {
            aboveLeft:{
                x: viewPortObj.aboveLeft.x + widthOfViewPort * halfPercentageOfNotAllowed,
                y: viewPortObj.aboveLeft.y + heightOfViewPort * halfPercentageOfNotAllowed
            },
            aboveRight:{
                x: viewPortObj.aboveLeft.x + widthOfViewPort * (1-halfPercentageOfNotAllowed),
                y: viewPortObj.aboveLeft.y + heightOfViewPort * halfPercentageOfNotAllowed
            },
            belowLeft:{
                x: viewPortObj.aboveLeft.x + widthOfViewPort * halfPercentageOfNotAllowed,
                y: viewPortObj.aboveLeft.y + heightOfViewPort * (1-halfPercentageOfNotAllowed)
            },
            belowRight:{
                x: viewPortObj.aboveLeft.x + widthOfViewPort * (1-halfPercentageOfNotAllowed),
                y: viewPortObj.aboveLeft.y + heightOfViewPort * (1-halfPercentageOfNotAllowed)
            }
        }

        //checkThisDataが 画面表示領域座標を 30% 縮めた範囲内に入っているかどうか確認
        var checkerObjArr = [
            {
                type:"point",
                coordinate:allowedAreaObj.aboveLeft,
                direction:"y_higher"
            },
            {
                type:"point",
                coordinate:allowedAreaObj.aboveLeft,
                direction:"x_higher"
            },
            {
                type:"point",
                coordinate:allowedAreaObj.belowRight,
                direction:"y_lower"
            },
            {
                type:"point",
                coordinate:allowedAreaObj.belowRight,
                direction:"x_lower"
            }
        ];
        var pointIsInRange = arrangementCheck(checkerObjArr, checkThisData.coordinate);

        if(!pointIsInRange){ //画面範囲外の場合

            var panMoveY = 0;
            var panMoveX = 0;

            for(var i = 0 ; i < checkerObjArr.length ; i++){

                if(!checkerObjArr[i].result){ //判定NGの場合

                    switch(checkerObjArr[i].direction){

                        case 'y_higher':
                        {
                            panMoveY += checkThisData.coordinate.y - allowedAreaObj.aboveLeft.y;
                        }
                        break;

                        case 'y_lower':
                        {
                            panMoveY += checkThisData.coordinate.y - allowedAreaObj.belowRight.y;
                        }
                        break;

                        case 'x_higher':
                        {
                            panMoveX += checkThisData.coordinate.x - allowedAreaObj.aboveLeft.x;
                        }
                        break;

                        case 'x_lower':
                        {
                            panMoveX += checkThisData.coordinate.x - allowedAreaObj.belowRight.x;
                        }
                        break;

                        default: //コーディングミスの場合
                        {
                            console.error("Unknown checkerObj.direction:\`" + checkerObj.direction + "\` specified.");
                        }
                        break;
                    }

                }
            }
            
            //view port の中心座標
            var cxOfViewPort = (viewPortObj.aboveLeft.x + viewPortObj.belowRight.x) / 2;
            var cyOfViewPort = (viewPortObj.aboveLeft.y + viewPortObj.belowRight.y) / 2;

            //checkThisData が収まるように panning
            pan(
                cxOfViewPort + panMoveX,
                cyOfViewPort + panMoveY
            );
        }
    }

    function arrangementCheck(checkerObjArr, checkThisCoordinate){

        var allTrue = true;

        //引数チェック
        if(checkerObjArr.length == 0 ){ // コーディングミスの場合
            console.error("Unknown checkerObjArr[] is vacant.");
            return false;
        }

        for(var i = 0 ; i < checkerObjArr.length ; i++){

            var checkerObj = checkerObjArr[i];

            switch(checkerObj.type){

                case 'point':
                {
                    switch(checkerObj.direction){
                        case 'y_higher':
                        {
                            checkerObj.result = (checkThisCoordinate.y > checkerObj.coordinate.y); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        case 'y_lower':
                        {
                            checkerObj.result = (checkThisCoordinate.y < checkerObj.coordinate.y); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        case 'x_higher':
                        {
                            checkerObj.result = (checkThisCoordinate.x > checkerObj.coordinate.x); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        case 'x_lower':
                        {
                            checkerObj.result = (checkThisCoordinate.x < checkerObj.coordinate.x); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        default: //コーディングミスの場合
                        {
                            console.error("Unknown checkerObj.direction:\`" + checkerObj.direction + "\` specified.");
                        }
                        break;
                    }
                }
                break;

                case 'quadratic': //2次関数指定の場合
                {
                    switch(checkerObj.direction){
                        case 'y_higher':
                        {
                            var y_onQuadratic = checkerObj.coef.a * checkThisCoordinate.x + checkerObj.coef.b; //2次関数上のy
                            checkerObj.result = (checkThisCoordinate.y > y_onQuadratic); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        case 'y_lower':
                        {
                            var y_onQuadratic = checkerObj.coef.a * checkThisCoordinate.x + checkerObj.coef.b; //2次関数上のy
                            checkerObj.result = (checkThisCoordinate.y < y_onQuadratic); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        case 'x_higher':
                        {
                            var x_onQuadratic = (checkThisCoordinate.y - checkerObj.coef.b) / checkerObj.coef.a; //2次関数上のx
                            checkerObj.result = (checkThisCoordinate.x > x_onQuadratic); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        case 'x_lower':
                        {
                            var x_onQuadratic = (checkThisCoordinate.y - checkerObj.coef.b) / checkerObj.coef.a; //2次関数上のx
                            checkerObj.result = (checkThisCoordinate.x < x_onQuadratic); //個別判定結果を保存
                            if(!checkerObj.result){allTrue = false;} //判定falseの場合だけ、`false` で上書き
                        }
                        break;

                        default: //コーディングミスの場合
                        {
                            console.error("Unknown checkerObj.direction:\`" + checkerObj.direction + "\` specified.");
                        }
                        break;
                    }
                }
                break;

                default: //コーディングミスの場合
                {
                    console.error("Unknown checkerObj.type:\`" + checkerObj.type + "\` specified.");
                }
                break;
            }
        }

        return allTrue;
    }

    function changeStyle(useThisVal, structureArr, datasOrLinks){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}

        var latestSelectedData = dataSelectionManager.getLatestSelectedData();

        if(typeof latestSelectedData !== 'undefined'){ //選択対象Nodeが1つ以上存在する場合

            var toRenderObj = makeNestedObj(useThisVal, structureArr);

            if(nowEditng){ //編集中の場合
                propertyEditorsManager.cancel(); //previewしている editor 状態を cancel
            }

            var totalReport = fireEvent_PropertyEditConsole_rerender(toRenderObj);
            totalReport.type = 'change';

            if(!totalReport.allNG){ //1つ以上適用成功の場合

                //変更があったかどうか確認するループ
                var changed = false;
                for(var i = 0 ; i < totalReport.reportsArr[datasOrLinks].length ; i++){
                    var oneDataRenderingReport = totalReport.reportsArr[datasOrLinks][i];

                    var prevStyle = getValFromNestObj(structureArr, oneDataRenderingReport.PrevObj);
                    var renderedStyle = getValFromNestObj(structureArr, oneDataRenderingReport.RenderedObj);

                    if(prevStyle != renderedStyle){ //変更があった場合
                        changed = true;
                        break;
                    }
                }

                if(changed){ //変更があった場合
                    totalReport.message = structureArr.join("/") + ":" + useThisVal;
                    historyManager.appendHistory(totalReport);
                }

                if(nowEditng){ //編集中の場合
                    adjustPropertyEditConsole();
                }
            }
        }
    }

    var $3NodeSelectingBrushGroup = null;
    var unbindingBrushMove = false; //.call(brush.move, null);の処理中
    var brush = d3.brush()
        .on("start", function(){

            //.call(brush.move, null); 起因のコールの場合はハジく
            if(unbindingBrushMove){return;}
            
            //brush 開始時の selection 状態を保存
            $3svgNodes.each(saveSelection);
            $3svgLinks.each(saveSelection);

            function saveSelection(d ,i){

                var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');

                // brush 開始時の選択状態を保存
                if(isSelected){
                    d.$3bindedSelectionLayerSVGElement
                        .attr("data-selected_when_brush_started", "true");
                }else{
                    d.$3bindedSelectionLayerSVGElement
                        .attr("data-selected_when_brush_started", "false");
                }
            }
        })
        .on("brush", function(){

            //.call(brush.move, null); 起因のコールの場合は、
            //d3.event.selection は null になってしまうため、ハジく
            if(unbindingBrushMove){return;}

            // console.log(
            //     "aboveLeft  x [0][0]:" + d3.event.selection[0][0] + ", " + 
            //     "aboveLeft  y [0][1]:" + d3.event.selection[0][1] + ", " + 
            //     "belowRight x [1][0]:" + d3.event.selection[1][0] + ", " + 
            //     "belowRight y [1][1]:" + d3.event.selection[1][1]
            // );

            //brush で囲った矩形エリアの SVG 空間内座標取得
            var transformObj = {
                translates: {x:0, y:0},
                scale: 1
            };
    
            if(lastTransFormObj_d3style !== null){
                transformObj.translates.x = lastTransFormObj_d3style.x;
                transformObj.translates.y = lastTransFormObj_d3style.y;
                transformObj.scale = lastTransFormObj_d3style.k;
            }

            var aboveLeftX = (d3.event.selection[0][0] - transformObj.translates.x) / transformObj.scale;
            var aboveLeftY =  (d3.event.selection[0][1] - transformObj.translates.y) / transformObj.scale;

            var belowRightX =  (d3.event.selection[1][0] - transformObj.translates.x) / transformObj.scale;
            var belowRightY =  (d3.event.selection[1][1] - transformObj.translates.y) / transformObj.scale;
            
            $3svgNodes.each(function(d ,i){

                var isSelected = (d.$3bindedSelectionLayerSVGElement //brush 開始時の選択状態を取得
                    .attr("data-selected_when_brush_started").toLowerCase() == 'true');

                var isSelectedBefore = (d.$3bindedSelectionLayerSVGElement //前回の .on("brush" 時の選択状態を取得
                        .attr("data-selected").toLowerCase() == 'true');

                if(aboveLeftX <= d.coordinate.x &&
                    aboveLeftY <= d.coordinate.y &&
                    d.coordinate.x <= belowRightX &&
                    d.coordinate.y <= belowRightY){ //座標が brush area の範囲内の場合

                    if(isSelected){ //brush 開始時に選択済みだった場合
                        if(isSelectedBefore){ // 前回の .on("brush" で非選択状態にしていない場合
                            dataSelectionManager.spliceDataSelection(d); //node選択履歴から削除
                        }

                    }else{ //brush 開始時は未選択だった場合
                        if(!isSelectedBefore){ // 前回の .on("brush" で選択状態にしていない場合
                            dataSelectionManager.pushDataSelection(d); //node選択履歴に追加
                        }
                    }
                
                }else{ //座標が brush area の範囲外の場合

                    if(isSelected){ //brush 開始時に選択済みだった場合
                        if(!isSelectedBefore){ // 前回の .on("brush" で選択状態にしていない場合
                            dataSelectionManager.pushDataSelection(d); //node選択履歴に追加
                        }

                    }else{ //brush 開始時は未選択だった場合
                        if(isSelectedBefore){ // 前回の .on("brush" で非選択状態にしていない場合
                            dataSelectionManager.spliceDataSelection(d); //node選択履歴から削除
                        }
                    }
                }
            });

            $3svgLinks.each(function(d ,i){

                var isSelected = (d.$3bindedSelectionLayerSVGElement //brush 開始時の選択状態を取得
                    .attr("data-selected_when_brush_started").toLowerCase() == 'true');

                var isSelectedBefore = (d.$3bindedSelectionLayerSVGElement //前回の .on("brush" 時の選択状態を取得
                    .attr("data-selected").toLowerCase() == 'true');

                if((aboveLeftX <= d.coordinate.x1 &&
                    aboveLeftY <= d.coordinate.y1 &&
                    d.coordinate.x1 <= belowRightX &&
                    d.coordinate.y1 <= belowRightY) && //1つめの座標が brush area の範囲内の場合
                    
                    (aboveLeftX <= d.coordinate.x2 &&
                        aboveLeftY <= d.coordinate.y2 &&
                        d.coordinate.x2 <= belowRightX &&
                        d.coordinate.y2 <= belowRightY)){ //2つめの座標が brush area の範囲内の場合

                    if(isSelected){ //brush 開始時に選択済みだった場合
                        if(isSelectedBefore){ // 前回の .on("brush" で非選択状態にしていない場合
                            dataSelectionManager.spliceLinkSelection(d); //node選択履歴から削除
                        }

                    }else{ //brush 開始時は未選択だった場合
                        if(!isSelectedBefore){ // 前回の .on("brush" で選択状態にしていない場合
                            dataSelectionManager.pushLinkSelection(d); //node選択履歴に追加
                        }
                    }
                
                }else{ //座標が brush area の範囲外の場合

                    if(isSelected){ //brush 開始時に選択済みだった場合
                        if(!isSelectedBefore){ // 前回の .on("brush" で選択状態にしていない場合
                            dataSelectionManager.pushLinkSelection(d); //node選択履歴に追加
                        }

                    }else{ //brush 開始時は未選択だった場合
                        if(isSelectedBefore){ // 前回の .on("brush" で非選択状態にしていない場合
                            dataSelectionManager.spliceLinkSelection(d); //node選択履歴から削除
                        }
                    }
                }
            });            
        })
        .on("end", function(){ //選択終了イベント
            
            if(!unbindingBrushMove){ //Avoid infinite loop
                
                if($3NodeSelectingBrushGroup !== null){ // removeBrush(); していない場合

                    unbindingBrushMove = true;
                    // ↓ この処理内で、.on("??" に登録した関数(この関数自身)がコールされてしまう ↓
                    $3NodeSelectingBrushGroup.call(brush.move, null); //Brush 選択範囲表示のクリア
                    unbindingBrushMove = false;
                }

                // .on("start", で設定した data-selected_when_brush_started 属性のクリア
                $3svgNodes.each(removeSavedSelection);
                $3svgLinks.each(removeSavedSelection);

                function removeSavedSelection(d,i){
                    d.$3bindedSelectionLayerSVGElement.attr("data-selected_when_brush_started", null);
                }
            }
        })
    ;

    function startBrush(){

        //編集中の場合はハジく
        if(nowEditng){return;}
        
        if($3NodeSelectingBrushGroup === null){ // 2回連続で startBrush(); されないようにする
            
            removeZoom(); //mouse drag による panning イベントと競合するので、rush選択中は停止する

            $3NodeSelectingBrushGroup = $3selectionLayersGroup.append("g");
            $3NodeSelectingBrushGroup.call(brush);
        }
    }

    //mouse座標をSVG空間座標に変換して保存する
    $SVGDrawingAreaElement.get(0).addEventListener("mousemove",function(e){
        
        var boundingClientRect = $SVGDrawingAreaElement.get(0).getBoundingClientRect();

        var transformObj = {
            translates: {x:0, y:0},
            scale: 1
        };

        if(lastTransFormObj_d3style !== null){
            transformObj.translates.x = lastTransFormObj_d3style.x;
            transformObj.translates.y = lastTransFormObj_d3style.y;
            transformObj.scale = lastTransFormObj_d3style.k;
        }

        lastCoordinate.mouse.x = ((e.clientX - boundingClientRect.left) - transformObj.translates.x) / transformObj.scale;
        lastCoordinate.mouse.y = ((e.clientY - boundingClientRect.top) - transformObj.translates.y) / transformObj.scale;

    });

    function removeBrush(){

        if($3NodeSelectingBrushGroup !== null){
            
            startZoom(); //startBrush() 時に停止させた zoom・pan 機能の復活

            $3NodeSelectingBrushGroup.on(".brush", null);
            $3selectionLayersGroup.node().removeChild($3NodeSelectingBrushGroup.node());
            $3NodeSelectingBrushGroup = null;
        }
    }

    var connectStarted = false;
    var targetDrawerObj = {};

    function checkStartConnect(){

        //編集中の場合はハジく
        if(nowEditng){return;}
        
        if(!connectStarted){ // 2回連続で処理しないようにする

            $3svgNodes.each(function(d, i){
                d.$3bindedSVGElement.on('click', null); // click イベントのunbind
                d.$3bindedSVGElement.on('click', nodeConnected); // node の link 結合イベントを登録
            });

            $3svgLinks.each(function(d, i){
                // d.$3bindedSVGElement.on('click', null); // click イベントのunbind
            });

            startConnect();
        }
    }

    function updateCoordinatesOfTargetDrawerObj(e){
         //SVG レンダリング
        renderSVGLink(targetDrawerObj, {
            coordinate:{
                x2:lastCoordinate.mouse.x,
                y2:lastCoordinate.mouse.y
            }
        });
    }

    //
    // SVGノードの単一選択イベント
    //
    // note doubleclick時に2回呼ばれて不要なTogglingが発生するが、
    //      .on('dblclick', function()~ によって強制的に選択状態にされる
    //
    function nodeClicked(d){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}

        exitEditing(); //編集モードの終了

        var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');

        if(!(d3.event.ctrlKey)){ //ctrl key 押下でない場合
            dataSelectionManager.clearSelections(); //node選択履歴をクリア
        }
        
        //選択状態を切り替える
        if(isSelected){ //選択状態の場合
            
            //node選択履歴から削除(.clearSelections()をコールしていたとしてもOK)
            dataSelectionManager.spliceDataSelection(d);

        }else{ //非選択状態の場合
            dataSelectionManager.pushDataSelection(d); //node選択履歴に1つ追加
        }
    }

    function linkClicked(d){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
        
        exitEditing(); //編集モードの終了

        var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');

        if(!(d3.event.ctrlKey)){ //ctrl key 押下でない場合
            dataSelectionManager.clearSelections(); //node選択履歴をクリア
        }

        //選択状態を切り替える
        if(isSelected){ //選択状態の場合
            
            //link選択履歴から削除(.clearSelections()をコールしていたとしてもOK)
            dataSelectionManager.spliceLinkSelection(d); 

        }else{ //非選択状態の場合
            dataSelectionManager.pushLinkSelection(d); //link選択履歴に1つ追加
        }
    }

    // node同士 の link 結合イベント
    function nodeConnected(d){

        if(d.key != targetDrawerObj.source){ //source, target は別 node の場合

            // x座標 が近すぎる node が 3 つ以上並んだ状態で両端の node を結合すると、
            // 間にはさまれた node が横方向に散らばらないので、回避する
            var sourceNode = getBindedDataFromKey(targetDrawerObj.source);
            if(Math.abs(sourceNode.coordinate.x - d.coordinate.x) < 1){//結合する node 同士の x座標が近すぎる場合
                renderSVGNode(d, {
                    coordinate:{
                        dx: 1 // 1px 右にズラす
                    }
                }); // rendering repot は保存しない
            }

            var uniqueKey;
            if(dataset.links.length == 0){
                uniqueKey = "0";
            }else{
                uniqueKey = dataset.links[dataset.links.length-1].key;
                uniqueKey = makeUniqueKey(uniqueKey, isReservedLinkKey);
            }

            var appendingArr = {
                links:[
                    {
                        key:uniqueKey,
                        type:targetDrawerObj.type,
                        source:targetDrawerObj.source,
                        target:d.key
                    }
                ]
            };
            
            $SVGDrawingAreaElement.get(0).removeEventListener("mousemove",updateCoordinatesOfTargetDrawerObj);
            targetDrawerObj.$3bindedSVGLinkElement.remove();
            targetDrawerObj.$3bindedSelectionLayerSVGElement.remove();

            var appendingTotalReport = appendNodes(appendingArr);
            historyManager.appendHistory(appendingTotalReport);

            dataSelectionManager.clearSelections(); //選択履歴をクリア
            dataSelectionManager.pushDataSelection(d); //node選択履歴に1つ追加

            startConnect();
        }
    }

    function startConnect(){

        var latestSelectedData = dataSelectionManager.getLatestSelectedData();

        if(typeof latestSelectedData !== 'undefined'){ //選択対象Nodeが存在する場合

            targetDrawerObj = {
                type:defaultLinkhape,
                coordinate:{
                    x1:latestSelectedData.coordinate.x,
                    y1:latestSelectedData.coordinate.y,
                    x2:lastCoordinate.mouse.x,
                    y2:lastCoordinate.mouse.y
                },
                source:latestSelectedData.key
            };
            
            targetDrawerObj.$3bindedSVGLinkElement = $3svgLinksGroup.append("g")
                .classed("link", true)
                .style("pointer-events", "none")
                .attr("transform", lastTransFormObj_d3style)
            ;

            targetDrawerObj.$3bindedSelectionLayerSVGElement = $3selectionLayersGroup.append("g")
                .classed("selectionLayer",true)
                .style("pointer-events", "none")
                .attr("transform", lastTransFormObj_d3style)
                .attr("data-selected", "false")
            ;

            renderSVGLink(targetDrawerObj, targetDrawerObj); //SVG レンダリング

            $SVGDrawingAreaElement.get(0).addEventListener("mousemove",updateCoordinatesOfTargetDrawerObj);

            connectStarted = true;
        }
    }

    function removeConnect(){

        if(connectStarted){ // 2回連続で処理しないようにする
            
            $SVGDrawingAreaElement.get(0).removeEventListener("mousemove",updateCoordinatesOfTargetDrawerObj);
            // targetDrawerObj.remove();
            targetDrawerObj.$3bindedSVGLinkElement.remove();
            targetDrawerObj.$3bindedSelectionLayerSVGElement.remove();

            // click イベントの復活
            $3svgNodes.each(function(d, i){
                d.$3bindedSVGElement.on('click', null); // click イベントのunbind
                d.$3bindedSVGElement.on('click', nodeClicked);  // SVGノードの単一選択イベントを登録
            });

            $3svgLinks.each(function(d, i){
                // d.$3bindedSVGElement.on('click', linkClicked);  // SVGノードの単一選択イベントを登録
            });

            connectStarted = false;
        }
    }

    //
    //ページ移動前確認(外部コンポーネントload後にaddEventする)
    //
    //note
    //firefoxではページのどこもクリックしていない状態だと移動できる事がある(原因不明)
    //
    var func_checkBeforePageMoving = function(e){
        e.returnValue = "Are you sure to leave this page?"; //仮のメッセージ
    }
    function toggleBeforeLoadEvent(){
        window.addEventListener('beforeunload', func_checkBeforePageMoving, false);
    }
        

    //--------------------------------------------------------------------</UI TRAP>

    function checkObjArr(objArr){

        //オブジェクトコピー
        var appendingSafeObjArr = {};
        mergeObj(objArr, appendingSafeObjArr, false);

        var returnValWhenAborted = { //エラー発生時に返却する為の空定義
            datas:[],
            links:[]
        }
        
        var untreatedPropertyNames = Object.keys(appendingSafeObjArr); //未処理プロパティリスト
        var treatThisObjects = [];

        var lastStrForLinkExistence = "_existInArg";

        var convToAvoidDupliKeyDifi = {};

        var arrayCheckOK = true;
        isThisArray("datas");
        isThisArray("links");
        function isThisArray(objName){

            if(typeof appendingSafeObjArr[objName] == 'undefined'){ //定義がない場合
                appendingSafeObjArr[objName] = []; //空配列にする

            }else{ //定義がある場合
                
                if(!Array.isArray(appendingSafeObjArr[objName])){ //Arrayでない場合
                    console.warn("Obj \`" + objName + "\` is not Array");
                    appendingSafeObjArr[objName] = []; //空配列にする
                    arrayCheckOK = false;

                }else{                    
                    treatThisObjects.push(objName);
                }

                untreatedPropertyNames.splice(untreatedPropertyNames.indexOf(objName), 1) //未処理プロパティリストから削除
            }
        }

        //不明なObject定義が存在する場合
        untreatedPropertyNames.forEach(function(objName,idx){
            var wrn = "Unkdown Object \`" + objName + "\` defined. This Object will ignored.";
            console.warn(wrn);
            delete appendingSafeObjArr[objName];
        });

        if(!arrayCheckOK){ //datas or links が array型でない場合
            return returnValWhenAborted; //空定義を返す
        }

        if(treatThisObjects.length == 0){ //有効な要素が存在しなかった場合
            return returnValWhenAborted; //空定義を返す
        }

        if(treatThisObjects.indexOf("datas") >= 0){ //"datas"定義が存在する場合
            
            //定義型チェックループ
            for(var i = 0 ; i < appendingSafeObjArr.datas.length ; i++){
                
                var typeOf_key = (typeof appendingSafeObjArr.datas[i].key);

                switch(typeOf_key){
                    case 'undefined':
                    {
                        appendingSafeObjArr.datas[i].key = i.toString();//appendingSafeObjArr.datas[]内のindex noをkeyとして使う
                    }
                    break;

                    case 'string':
                    {
                        //空文字回避
                        if(appendingSafeObjArr.datas[i].key == ""){
                            var empstr = "(EmptyString)";
                            console.warn("\`\`(empty string) is defined in datas[" + i + "\].key ." +
                                         " key:\`" + empstr + "\` will apply.");
                            appendingSafeObjArr.datas[i].key = empstr;
                        }
                    }
                    break;

                    case 'number':
                    {
                        appendingSafeObjArr.datas[i].key = appendingSafeObjArr.datas[i].key.toString(); //文字列型に変換
                    }
                    break;

                    default: //unknown な型の場合
                    {
                        console.warn("key \`" + appendingSafeObjArr.datas[i].key.toString() + "\` is defined as \`" + typeOf_key + "\` type. " +
                                     "key \`" + i.toString() + "\` will apply.");
                        appendingSafeObjArr.datas[i].key = i.toString();
                    }
                    break;
                }
            }

            //datas[]内でkey重複チェック
            for(var i = 0 ; i < appendingSafeObjArr.datas.length ; i++){
                for(var j = i+1 ; j < appendingSafeObjArr.datas.length ; j++ ){
                    var eye = appendingSafeObjArr.datas[i].key;
                    var jay = appendingSafeObjArr.datas[j].key;
                    if(eye == jay){ //key重複がある場合
                        console.error("Duplicate definition found in datas[" + i + "].key:\`" + eye + "\` and datas[" + j + "].key:\`" + jay + "\`");
                        return returnValWhenAborted; //空定義を返す
                    }
                }
            }
            
        }

        if(treatThisObjects.indexOf("links") >= 0){ //"links"定義が存在する場合

            //定義型チェックループ
            for(var i = 0 ; i < appendingSafeObjArr.links.length  ; i++){

                var typeOf_key = (typeof appendingSafeObjArr.links[i].key);

                switch(typeOf_key){
                    case 'undefined':
                    {
                        appendingSafeObjArr.links[i].key = i.toString();//appendingSafeObjArr.links[]内のindex noをkeyとして使う
                    }
                    break;

                    case 'string':
                    {
                        //空文字回避
                        if(appendingSafeObjArr.links[i].key == ""){
                            var empstr = "(EmptyString)";
                            console.warn("\`\`(empty string) is defined in links[" + i + "\].key ." +
                                         " key:\`" + empstr + "\` will apply.");
                            appendingSafeObjArr.links[i].key = empstr;
                        }
                    }
                    break;

                    case 'number':
                    {
                        appendingSafeObjArr.links[i].key = appendingSafeObjArr.links[i].key.toString(); //文字列型に変換
                    }
                    break;

                    default: //unknown な型の場合
                    {
                        console.warn("key \`" + appendingSafeObjArr.links[i].key.toString() + "\` is defined as \`" + typeOf_key + "\` type. " +
                                     "key \`" + i.toString() + "\` will apply.");
                        appendingSafeObjArr.links[i].key = i.toString();
                    }
                    break;
                }

                var sourceKeyNameIsDefinedInArgDatas = keyIsDefinedInArgDatas("source");
                var targetKeyNameIsDefinedInArgDatas = keyIsDefinedInArgDatas("target");

                function keyIsDefinedInArgDatas(propertyName){

                    var isDefined = true;
                    var typeOf_key = (typeof appendingSafeObjArr.links[i][propertyName]);

                    switch(typeOf_key){

                        case 'undefined':
                        {
                            console.warn("links[" + i.toString() + "] does not have \`" + propertyName + "\` property. This link will be ignored.");
                            isDefined = false;
                        }
                        break;
                        
                        case 'string':
                        case 'number':
                        {
                            if(typeOf_key == 'number'){
                                appendingSafeObjArr.links[i][propertyName] = appendingSafeObjArr.links[i][propertyName].toString(); //文字列型に変換
                            }

                            //指定キーが datas[] 内に存在するかどうかチェックする
                            var existencePropName = propertyName + lastStrForLinkExistence;
                            appendingSafeObjArr.links[i][existencePropName] = false;
                            if(typeof appendingSafeObjArr.datas != 'undefined'){
                                for(var j = 0 ; j < appendingSafeObjArr.datas.length ; j++){
                                    if(appendingSafeObjArr.datas[j].key == appendingSafeObjArr.links[i][propertyName]){ //キーが存在する場合
                                        appendingSafeObjArr.links[i][existencePropName] = true; //存在する事を記録
                                        break;
                                    }
                                }
                            }
                        }
                        break;

                        default: //unknown な型の場合
                        {
                            console.warn("links[" + i.toString() + "]." + propertyName + " is defined as \`" + typeOf_key + "\` type. " +
                                         "This link will be ignored.");
                            isDefined = false;
                        }
                        break;
                    }

                    return isDefined;
                }

                if(appendingSafeObjArr.links[i].source == appendingSafeObjArr.links[i].target){ //source と target が同じ場合
                    console.warn("links[" + i.toString() + "] defines same \`source\`,/\`target\`:" + appendingSafeObjArr.links[i].source +
                                 "This link will be ignored.");

                    sourceKeyNameIsDefinedInArgDatas = false;
                }

                if((!sourceKeyNameIsDefinedInArgDatas) || (!targetKeyNameIsDefinedInArgDatas)){ //source or target の key 定義に誤りがあった場合
                    appendingSafeObjArr.links[i].keyDefTypeIsSafe = false; //NG 状態を記録
                }else{
                    appendingSafeObjArr.links[i].keyDefTypeIsSafe = true; //OK 状態を記録
                }
            }
        }
        
        if(treatThisObjects.indexOf("datas") >= 0){ //"datas"定義が存在する場合

            //dataset.datas[]へ追加ループ
            for(var i = 0 ; i < appendingSafeObjArr.datas.length ; i++){

                //dataset.datas[] 内とのkey重複チェック
                if(isReservedDataKey(appendingSafeObjArr.datas[i].key)){

                    // Unique な key を生成
                    var uniqueKeyName = makeUniqueKey(appendingSafeObjArr.datas[i].key, function(tryThisKeyName){
                            
                        var isReserved = isReservedDataKey(tryThisKeyName); //dataset.datas[]内で重複しているかどうかを取得

                        if(isReserved){ //dataset.datas[]内で重複している
                            return true;
                        
                        }else{//dataset.datas[]内で重複していいない場合
                            
                            // makeUniqueKey() 内で生成した候補文字列 tryThisKeyName が、//
                            // appendingSafeObjArr.datas[]内で重複することにならないかどうか確認
                            for (var j = 0 ; j < appendingSafeObjArr.datas.length ; j++){
                                if(appendingSafeObjArr.datas[j].key == tryThisKeyName){
                                    return true; //`重複` を返却
                                }
                            }
                        }
                        
                        return false; // `unique` を返却
                    });

                    console.warn("datas[" + i + "\].key:\`" + appendingSafeObjArr.datas[i].key  + "\` is already used. " +
                        "Unique key:\`" + uniqueKeyName + "\` will apply.")
                    ;
                    
                    convToAvoidDupliKeyDifi[appendingSafeObjArr.datas[i].key] = uniqueKeyName; //key名変更を記録
                    appendingSafeObjArr.datas[i].key = uniqueKeyName;
                        
                }
            }
        }

        //Linksの追加
        if(treatThisObjects.indexOf("links") >= 0){ //"links"定義が存在する場合

            //dataset.links[]へ追加ループ
            for(var i = 0 ; i < appendingSafeObjArr.links.length ; i++){

                if(appendingSafeObjArr.links[i].keyDefTypeIsSafe){ // source or target に指定したkey名定義は、型チェックOKだった場合

                    var sourceKeyIsExist = isExistKey("source");
                    var targetKeyIsExist = isExistKey("target");

                    //key名がdataset.datas[]内に存在するかどうかチェック
                    function isExistKey(propertyName){
                        
                        var existence = true;
                        var existencePropName = propertyName + lastStrForLinkExistence;
                        
                        if(appendingSafeObjArr.links[i][existencePropName]){ //key名は appendingSafeObjArr.datas[] 内に存在する場合

                            //key変換チェック
                            if(typeof convToAvoidDupliKeyDifi[appendingSafeObjArr.links[i][propertyName]] != 'undefined'){ //source の key 名に変換があった場合
                                appendingSafeObjArr.links[i][propertyName] = convToAvoidDupliKeyDifi[appendingSafeObjArr.links[i][propertyName]]; //変換
                            }

                        }else{ //key名は appendingSafeObjArr.datas[] 内に存在しない場合

                            //key名存在チェック
                            var searchByThisKeyName = appendingSafeObjArr.links[i][propertyName];

                            if(typeof (getBindedDataFromKey(searchByThisKeyName)) == 'undefined'){ //keyが dataset.datas[]内に見つからない場合
                                console.warn("links[" + i + "]." + propertyName + "):\`" + searchByThisKeyName +
                                            "\` is not defined in any datas[].key . This link will be ignored.");
                                existence = false;
                            }
                        }

                        delete appendingSafeObjArr.links[i][existencePropName];

                        return existence;
                    }

                    if(sourceKeyIsExist && targetKeyIsExist){ //source と target の key チェックが OK の場合

                        //dataset.links[] 内とのkey重複チェック
                        if(isReservedLinkKey(appendingSafeObjArr.links[i].key)){

                            // Unique な key を生成
                            var uniqueKeyName = makeUniqueKey(appendingSafeObjArr.links[i].key, function(tryThisKeyName){
                                    
                                var isReserved = isReservedLinkKey(tryThisKeyName); //dataset.links[]内で重複しているかどうかを取得
                                
                                if(isReserved){ //dataset.links[]内で重複している
                                    return true; //`重複` を返却
                                
                                }else{//dataset.links[]内で重複していいない場合
                                    
                                    // makeUniqueKey() 内で生成した候補文字列 tryThisKeyName が、//
                                    // appendingSafeObjArr.links[]内で重複することにならないかどうか確認
                                    for (var j = 0 ; j < appendingSafeObjArr.links.length ; j++){
                                        if(appendingSafeObjArr.links[j].key == tryThisKeyName){
                                            return true; //`重複` を返却
                                        }
                                    }
                                }
                                
                                return false; // `unique` を返却
                            });

                            console.warn("links[" + i + "\].key:\`" + appendingSafeObjArr.links[i].key  + "\` is already used. " +
                                "Unique key:\`" + uniqueKeyName + "\` will apply.")
                            ;
                            
                            appendingSafeObjArr.links[i].key = uniqueKeyName;
                                
                        }
                    
                    }else{ //source と target の key チェックが NG の場合

                        appendingSafeObjArr.links[i].keyDefTypeIsSafe = false; // NG 状態を記録
                    }
                }
            }
        }

        if(treatThisObjects.indexOf("links") >= 0){ //"links"定義が存在する場合

            // NG 状態を記録した link を削除する
            for(var i = appendingSafeObjArr.links.length-1 ; i >= 0  ; i--){ //要素削除の可能性があるので、デクリメントで網羅する
                
                var isSveLink = appendingSafeObjArr.links[i].keyDefTypeIsSafe; //記録状態を取得
                delete appendingSafeObjArr.links[i].keyDefTypeIsSafe; //状態記録プロパティを削除

                if(!isSveLink){ // NG状態だった場合
                    appendingSafeObjArr.links.splice(i, 1); //削除
                }
            }
        }

        return appendingSafeObjArr;

    }
    
    function appendNodes(appendThisObjArr){

        var appendingTotalReport = {};
        appendingTotalReport.type = 'append';
        appendingTotalReport.allOK = true;
        appendingTotalReport.allNG = true;
        appendingTotalReport.reportsArr = {};
        appendingTotalReport.reportsArr.datas = [];
        appendingTotalReport.reportsArr.links = [];

        if(typeof appendThisObjArr.datas == 'undefined'){
            appendThisObjArr.datas = [];
        }
        if(typeof appendThisObjArr.links == 'undefined'){
            appendThisObjArr.links = [];
        }

        //Nodesの追加
        if(appendThisObjArr.datas.length > 0){ //"datas"定義が存在する場合

            //dataset.datas[]へ追加ループ
            for(var i = 0 ; i < appendThisObjArr.datas.length ; i++){

                //オブジェクトコピー
                var toAppendObj = {};
                mergeObj(appendThisObjArr.datas[i], toAppendObj, false);

                dataset.datas.push(toAppendObj); //datas[]へ追加
            }

            //bind using D3.js
            $3svgNodes = $3svgNodesGroup.selectAll("g.node")
                .data(dataset.datas, function(d){return d.key});
                
            //描画 & リスナ登録
            $3svgNodes.enter()
                .append("g")
                .classed("node", true)
                .attr("transform", lastTransFormObj_d3style)
                .each(function(d ,i){

                    var bindedSVGElement = this;
                    d.$3bindedSVGElement = d3.select(this);

                    d.$3bindedSelectionLayerSVGElement = $3selectionLayersGroup.append("g")
                        .classed("selectionLayer",true)
                        .style("pointer-events", "none")
                        .attr("transform", lastTransFormObj_d3style)
                        .attr("data-selected", "false");

                    checkToBindData(d); //data書式のチェック
                    
                    if(typeof d.coordinate == 'undefined'){ //座標指定がない場合

                        var transformObj = {
                            translates: {x:0, y:0},
                            scale: 1
                        };
            
                        if(lastTransFormObj_d3style !== null){
                            transformObj.translates.x = lastTransFormObj_d3style.x;
                            transformObj.translates.y = lastTransFormObj_d3style.y;
                            transformObj.scale = lastTransFormObj_d3style.k;
                        }
                        
                        //描画領域の中心にを指定する
                        d.coordinate = {
                            x: (($3motherElement.node().offsetWidth / 2) - transformObj.translates.x) / transformObj.scale,
                            y: (($3motherElement.node().offsetHeight / 2) - transformObj.translates.y) / transformObj.scale
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

                    appendingTotalReport.reportsArr.datas.push(renderReport);

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
                                eventObj.argObj.clbkFunc(renderReport, "datas");
                            }
                        }
                        
                    });

                    d.$3bindedSVGElement.on('click', nodeClicked); // SVGノードの単一選択イベントを登録

                    // Nodeに対する単一編集イベント
                    d.$3bindedSVGElement.on('dblclick', function(d){
                        call_editSVGNode(d);
                    });

                    //Dragイベント用Buffer
                    var bufTotalReport;
                    var beforeDragInfo_nodes;
                    var beforeDragInfo_mouse;

                    // Nodeに対する Drag イベント
                    d.$3bindedSVGElement.call(d3.drag()
                        .on('start', function(d, i){

                            if(!d3.event.active) simulation.alphaTarget(0.3).restart();
                            
                            bufTotalReport = {};
                            bufTotalReport.type = 'change';
                            bufTotalReport.allOK = false;
                            bufTotalReport.allNG = true;
                            bufTotalReport.reportsArr = {};
                            bufTotalReport.reportsArr.datas = [];
                            bufTotalReport.reportsArr.links = [];

                            beforeDragInfo_nodes = [];

                            //DragStartされたNodeの選択状態取得
                            var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');
                            if(isSelected){ //選択状態の場合

                                //選択状態にあるNodeをすべてDrag対象として追加するloop
                                $3svgNodes.each(function(dataInItr, idxInItr){
                                    var isSelectedInItr = (dataInItr.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');
                                    if(isSelectedInItr){ //選択状態の場合
                                        // transformを取得
                                        var attrTransformStr = dataInItr.$3bindedSVGElement.attr("transform");
                                        if(attrTransformStr === null) attrTransformStr = "";
                                        var transformObj = getTransformObj(attrTransformStr);

                                        // Drag対象Nodeとして追加
                                        beforeDragInfo_nodes.push({toThisData:dataInItr,
                                                                x:dataInItr.coordinate.x,
                                                                y:dataInItr.coordinate.y,
                                                                scale:transformObj.scale});
                                    }
                                });

                            }else{ //非選択状態の場合 -> 自分のNodeのみをDrag対象として追加

                                // transformを取得
                                var attrTransformStr = d.$3bindedSVGElement.attr("transform");
                                if(attrTransformStr === null) attrTransformStr = "";
                                var transformObj = getTransformObj(attrTransformStr);

                                // Drag対象Nodeとして追加
                                beforeDragInfo_nodes.push({toThisData:d,
                                                        x:d.coordinate.x,
                                                        y:d.coordinate.y,
                                                        scale:transformObj.scale});
                            }

                            beforeDragInfo_mouse = {x:d3.event.x, y:d3.event.y};
                        })
                        .on('drag', function(d, i){
                            
                            //移動していない場合はハジく
                            if(d3.event.dx == 0 && d3.event.dy == 0){return;}

                            var draggingReports = {};
                            draggingReports.type = 'change';
                            draggingReports.allOK = true;
                            draggingReports.allNG = true;
                            draggingReports.reportsArr = {};
                            draggingReports.reportsArr.datas = [];
                            draggingReports.reportsArr.links = [];

                            for(var idx = 0 ; idx < beforeDragInfo_nodes.length ; idx++){

                                //座標していObjの生成
                                var renderByThisObj = {
                                    coordinate:{
                                        x: beforeDragInfo_nodes[idx].x
                                        + ((d3.event.x - beforeDragInfo_mouse.x) / beforeDragInfo_nodes[idx].scale),
                                        y: beforeDragInfo_nodes[idx].y
                                        + ((d3.event.y - beforeDragInfo_mouse.y) / beforeDragInfo_nodes[idx].scale)
                                    }
                                }

                                var renderReport = renderSVGNode(beforeDragInfo_nodes[idx].toThisData, renderByThisObj);
                                if(!renderReport.allOK){ //失敗が発生した場合
                                    draggingReports.allOK = false;
                                }
                                if(!renderReport.allNG){ //成功が1つ以上ある場合
                                    draggingReports.allNG = false;
                                }
                                draggingReports.reportsArr.datas.push(renderReport);

                                beforeDragInfo_nodes[idx].toThisData.fx = renderByThisObj.coordinate.x;
                                beforeDragInfo_nodes[idx].toThisData.fy = renderByThisObj.coordinate.y;

                            }

                            if(!draggingReports.allNG){ //1つ以上適用成功の場合
                                draggingReports.message = draggingReports.reportsArr.datas.length + " node(s) moved.";
                                overWriteScceededTransaction(draggingReports, bufTotalReport, 'datas');
                            }

                        })
                        .on('end', function(d, i){
                            if(!d3.event.active) simulation.alphaTarget(0);
                            
                            for(var idx = 0 ; idx < beforeDragInfo_nodes.length ; idx++){
                                beforeDragInfo_nodes[idx].toThisData.fx = null;
                                beforeDragInfo_nodes[idx].toThisData.fy = null;
                            }

                            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                                historyManager.appendHistory(bufTotalReport);
                            }
                        })
                    );
                });

            //増えた<g>要素に合わせて$node selectionを再調整
            $3svgNodes = $3svgNodesGroup.selectAll("g.node");
        }

        //Linksの追加
        if(appendThisObjArr.links.length > 0){ //"links"定義が存在する場合

            //dataset.links[]へ追加ループ
            for(var i = 0 ; i < appendThisObjArr.links.length ; i++){

                var toAppendObj = {};
                mergeObj(appendThisObjArr.links[i], toAppendObj, false); //objectコピー
                dataset.links.push(toAppendObj); //dataset.links[]に追加
            }
    
            $3svgLinks = $3svgLinksGroup.selectAll("g.link")
                .data(dataset.links, function(d){return d.key});
                
            $3svgLinks.enter()
                .append("g")
                .classed("link", true)
                .attr("transform", lastTransFormObj_d3style)
                .each(function(d, i){
                    var bindedSVGLinkElement = this;
                    d.$3bindedSVGLinkElement = d3.select(bindedSVGLinkElement);

                    d.$3bindedSelectionLayerSVGElement = $3selectionLayersGroup.append("g")
                        .classed("selectionLayer",true)
                        .style("pointer-events", "none")
                        .attr("transform", lastTransFormObj_d3style)
                        .attr("data-selected", "false");

                    checkToBindLink(d); //link書式のチェック

                    if(typeof d.coordinate == 'undefined'){ //座標定義追加
                        d.coordinate = {x1:0}; //<-仮の処理
                    }

                    var renderReport_link = renderSVGLink(d,d); //SVGレンダリング
                    backToDefaulIfWarnForLink(renderReport_link, d);
                    
                    if(!renderReport_link.allOK){ //失敗が発生した場合
                        appendingTotalReport.allOK = false;
                    }

                    if(!renderReport_link.allNG){ //成功が1つ以上ある場合
                        appendingTotalReport.allNG = false;
                    }
                    
                    appendingTotalReport.reportsArr.links.push(renderReport_link);

                    //Property変更用EventListener
                    bindedSVGLinkElement.addEventListener("propertyEditConsole_rerender",function(eventObj){

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
                    
                            var renderReport = renderLineTypeSVGLink(d, eventObj.argObj.renderByThisObj);
                    
                            if(typeof eventObj.argObj.clbkFunc == 'function'){ //コールバック関数が存在する
                                eventObj.argObj.clbkFunc(renderReport, "links");
                            }
                        }
                        
                    });

                    d.$3bindedSVGLinkElement.on('click', linkClicked);

                    d.$3bindedSVGLinkElement.on('dblclick', function(d){

                        //External Componentが未loadの場合はハジく
                        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                        
                        if(nowEditng){ // 編集中の場合
                                    // -> 発生し得ないルート
                                    //    (直前に呼ばれる単一選択イベントによって、編集中が解除される為)
                
                            exitEditing(); //編集モードの終了
                        
                        }
                
                        dataSelectionManager.clearSelections(); //node選択履歴をクリア
                        dataSelectionManager.pushLinkSelection(d);

                        editSVGNodes();
                    });
                });

            //増えた<g>要素に合わせて$link selectionを再調整
            $3svgLinks = $3svgLinksGroup.selectAll("g.link")
                .data(dataset.links);
        }

        startForce(); //force simulation

        var appendedOne = false;
        var msgStr = "";

        if(appendingTotalReport.reportsArr.datas.length > 0){
            if(appendedOne){
                msgStr = msgStr + ", ";
            }
            msgStr = msgStr + appendingTotalReport.reportsArr.datas.length.toString() + " node(s)";
            appendedOne = true;
        }
        if(appendingTotalReport.reportsArr.links.length > 0){
            if(appendedOne){
                msgStr = msgStr + ", ";
            }
            msgStr = msgStr + appendingTotalReport.reportsArr.links.length.toString() + " link(s)";
            appendedOne = true;
        }
        
        msgStr = msgStr + " appended.";
        appendingTotalReport.message = msgStr;

        return appendingTotalReport;
    }

    //
    //選択状態のSVGノード(複数)を削除する
    //
    function deleteSVGNodes(){

        var toDeleteKeyArr = {}; //削除対象keyをまとめたArray
        toDeleteKeyArr.datas = [];
        toDeleteKeyArr.links = [];

        //削除対象Nodeをdataset.datas[]から検索 & 削除
        for(var i = dataset.datas.length-1 ; i >= 0 ; i--){
            if(dataset.datas[i].$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                toDeleteKeyArr.datas.push(dataset.datas[i].key); //削除対象keyArrayに追加
            }
        }

        //削除対象Linkをdataset.link[]から検索 & 削除
        for(var i = dataset.links.length-1 ; i >= 0 ; i--){
            if(dataset.links[i].$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                toDeleteKeyArr.links.push(dataset.links[i].key); //削除対象keyArrayに追加
            }
        }

        if((toDeleteKeyArr.datas.length > 0) || (toDeleteKeyArr.links.length > 0)){ //削除対象Nodeが存在する場合
            var deletingTotalReport = deleteNodes(toDeleteKeyArr, true); //source か target で紐づけられた link も削除する
            historyManager.appendHistory(deletingTotalReport);
        }
    }

    //
    //SVGノード(複数)を削除する
    //
    function deleteNodes(toDeleteKeyArr, deleteLinkIfdefined){

        var deletingTotalReport = {};
        deletingTotalReport.type = 'delete';
        deletingTotalReport.allOK = true;
        deletingTotalReport.allNG = true;
        deletingTotalReport.reportsArr = {};
        deletingTotalReport.reportsArr.datas = [];
        deletingTotalReport.reportsArr.links = [];

        var numOfDeletedNodes = 0;
        var toDeleteDataKeyArr = [];
        var numOfDeletedLinks = 0;

        if(deleteLinkIfdefined){
            toDeleteDataKeyArr = toDeleteKeyArr.datas.slice(0, toDeleteKeyArr.datas.length);
        }

        //削除対象Nodeをdataset.datas[]から検索 & 削除
        for(var i = dataset.datas.length-1 ; i >= 0 ; i--){
            var foundIdx = toDeleteKeyArr.datas.indexOf(dataset.datas[i].key);

            if(foundIdx >= 0){ //削除指定keyArray内に存在する場合
                dataset.datas.splice(i,1); //dataset.datas[]から削除
                toDeleteKeyArr.datas.splice(foundIdx, 1); //削除指定KeyArrayからも削除
                numOfDeletedNodes++;
            }
        }

        //削除対象Nodeをdataset.links[]から検索 & 削除
        for(var i = dataset.links.length-1 ; i >= 0 ; i--){
            var foundIdx = toDeleteKeyArr.links.indexOf(dataset.links[i].key);

            if(foundIdx >= 0){ //削除指定keyArray内に存在する場合
                dataset.links.splice(i,1); //dataset.links[]から削除
                toDeleteKeyArr.links.splice(foundIdx, 1); //削除指定KeyArrayからも削除
                numOfDeletedLinks++;

            }else if(deleteLinkIfdefined){ //data削除時に、source か target で紐づけられた linkを削除する指定がある場合

                var sourceFoundIdx = toDeleteDataKeyArr.indexOf(dataset.links[i].source.key);
                var targetFoundIdx = toDeleteDataKeyArr.indexOf(dataset.links[i].target.key);

                if(sourceFoundIdx >= 0 || targetFoundIdx >= 0){ //削除指定keyArray内に存在する場合
                    dataset.links.splice(i,1); //dataset.links[]から削除
                    numOfDeletedLinks++;
                }
            }
        }

        if((toDeleteKeyArr.datas.length > 0) || (toDeleteKeyArr.links.length > 0)){
            if(toDeleteKeyArr.datas.length > 0){ //削除指定Keyが見つからなかった場合
                console.warn("Data key(s) [" + toDeleteKeyArr.datas.toString() + "] not found");
            }
            if(toDeleteKeyArr.links.length > 0){ //削除指定Keyが見つからなかった場合
                console.warn("Link key(s) [" + toDeleteKeyArr.links.toString() + "] not found");
            }
        }

        //削除指定keyが1つも見つからなかった場合
        if((numOfDeletedNodes == 0) && (numOfDeletedLinks == 0)){
            console.warn("Valid key(s) not found");
            return deletingTotalReport; //allNGで返す
        }

        if(numOfDeletedNodes > 0){
            //rebind using D3.js
            $3svgNodes = $3svgNodesGroup.selectAll("g.node")
                .data(dataset.datas, function(d){return d.key});

            $3svgNodes.exit()
                .each(function(d,i){

                    var defaultObj = makeSetDafaultObj(true);
                    defaultObj.coordinate = {};
                    defaultObj.coordinate.x = 0;
                    defaultObj.coordinate.y = 0;

                    //SVG削除前のPropertyを保存する為、defaltObjで再度レンダリングする
                    var renderReport = renderSVGNode(d, defaultObj); //SVGレンダリング
                    renderReport.PrevObj.type = d.type; //削除前のtypeをPrevObjに保存
                    if(!renderReport.allOK){ //失敗が発生した場合
                        deletingTotalReport.allOK = false;
                    }
                    if(!renderReport.allNG){ //成功が1つ以上ある場合
                        deletingTotalReport.allNG = false;
                    }
                    deletingTotalReport.reportsArr.datas.push(renderReport);
                    
                    // ↓ .remove();で削除されない為ここで削除する ↓
                    //    (多分 selection.data() で紐づけたSVG要素でなない事が原因)
                    d.$3bindedSelectionLayerSVGElement.remove();                                              
                })
                .remove();

            //減った<g>要素に合わせて$node selectionを再調整
            $3svgNodes = $3svgNodesGroup.selectAll("g.node");
        }

        if(numOfDeletedLinks > 0){

            //rebind using D3.js
            $3svgLinks = $3svgLinksGroup.selectAll("g.link")
                    .data(dataset.links, function(d){return d.key});

            $3svgLinks.exit()
                .each(function(d,i){

                    var defaultObj = makeSetDafaultObj_forLink();
                    defaultObj.coordinate = {};
                    defaultObj.coordinate.x1 = 0;
                    defaultObj.coordinate.y1 = 0;
                    defaultObj.coordinate.x2 = 0;
                    defaultObj.coordinate.y2 = 0;

                    //SVG削除前のPropertyを保存する為、defaltObjで再度レンダリングする
                    var renderReport = renderSVGLink(d, defaultObj); //SVGレンダリング
                    renderReport.PrevObj.type = d.type; //削除前のtypeをPrevObjに保存
                    renderReport.PrevObj.source = d.source.key;
                    renderReport.PrevObj.target = d.target.key;
                    
                    if(!renderReport.allOK){ //失敗が発生した場合
                        deletingTotalReport.allOK = false;
                    }
                    if(!renderReport.allNG){ //成功が1つ以上ある場合
                        deletingTotalReport.allNG = false;
                    }
                    deletingTotalReport.reportsArr.links.push(renderReport);
                    
                    // ↓ .remove();で削除されない為ここで削除する ↓
                    //    (多分 selection.data() で紐づけたSVG要素でなない事が原因)
                    d.$3bindedSelectionLayerSVGElement.remove();                                              
                })
                .remove();

            //減った<g>要素に合わせて$link selectionを再調整
            $3svgLinks = $3svgLinksGroup.selectAll("g.link")
                .data(dataset.links);
        }

        startForce(); //force simulation

        //message生成
        var msg = "";
        if(numOfDeletedNodes > 0){
            msg = msg + numOfDeletedNodes.toString() + " node(s)";
        }
        if(numOfDeletedLinks > 0){
            if(numOfDeletedNodes > 0){
                msg = msg + ", ";
            }
            msg = msg + numOfDeletedLinks.toString() + " links(s)";
        }
        msg = msg + " deleted.";
        deletingTotalReport.message = msg;
        
        return deletingTotalReport;
    }

    var simulation;
    function startForce(){

        if(typeof simulation != 'undefined'){

            //note
            //simulation実行中の場合は、
            //`stop()`をcallしないとd3.jsが以下の警告を出す
            //`(x/y/x1/y1/x2/y2) 属性のパース中に予期せぬ値 NaN が見つかりました。`
            simulation.stop(); 
        }

        //現在の座標を simulation 開始時の初期座標に設定
        $3svgNodes.each(function(d, i){
            d.x = d.coordinate.x;
            d.y = d.coordinate.y;
        });

        simulation = d3.forceSimulation()
            .force("link", d3.forceLink())
            .force("charge", d3.forceManyBody())
        ;

        simulation.nodes(dataset.datas)
            .on("tick", function(){
                
                $3svgNodes.each(function(d, i){
                    var renderByThisObj = {
                        coordinate:{
                            x:d.x,
                            y:d.y
                        }
                    }
                    renderSVGNode(d, renderByThisObj);

                    if(connectStarted && // link 追加モードの場合は、preview 表示中のlinkも更新する
                        targetDrawerObj.source == d.key){

                        renderSVGLink(targetDrawerObj, {
                            coordinate:{
                                x1:d.x,
                                y1:d.y
                            }
                        });
                    }
                });

                $3svgLinks.each(function(d, i){
                    var renderByThisObj = {
                        coordinate:{
                            x1:d.source.x,
                            y1:d.source.y,
                            x2:d.target.x,
                            y2:d.target.y
                        }
                    }
                    renderSVGLink(d, renderByThisObj);
                });

                if(nowEditng){
                    adjustPropertyEditConsole(true); //Node個別編集機能のみadjustする(heavyすぎる為)
                }
            });

        simulation.force("link")
            .id(function(d) { return d.key; }) // <- .links([links]) をコールする前に設定する
            .links(dataset.links)
        ;

        /* <Coefficient settings for force simulation>--------------------------------------- */

        // Documentation
        // https://github.com/d3/d3-force

        //
        //d3.forceManyBody()
        //
        simulation.force("charge")

            //
            //manyBody.strength([strength])
            //
            //node同士の引力
            //正値の場合はお互いに引きつけあう
            //負値の場合はお互いに離しあう
            //
            // defalt: -30
            //
            .strength(-60)

            //
            //manyBody.distanceMax([distance]) 
            //
            //node 同士の引力が影響する最大範囲
            //
            // range: 0 <= distance <= (infinity)
            // defalt: (infinity)
            //
            .distanceMax(100)

        ;
            
        //
        //d3.forceLink([links])
        //
        simulation.force("link")

            //
            //link.distance([distance])
            //
            //リンク間距離
            //
            // default:30
            //
            .distance(linkDistance)

            //
            //link.strength([strength])
            //
            //リンク間強度
            //小さい値で link は伸び縮みしやすく、
            //大きい値で link は伸び縮みしにくくなる
            //
            // range: 0.0 <= strength <= 2.0
            // default: 1 / Math.min(count(link.source), count(link.target))
            // <!caution!> strengthの有効範囲外で、ブラウザが不安定になる </!caution!>
            //
            // .strength(2)

        ;

        simulation

            //
            //simulation.alpha([alpha])
            //
            //alpha が `simulation.alphaMin([min])` で設定した min より大きい間、
            //simulation が継続する。alpha は時間とともに小さくなっていく
            //
            // range: 0.0 <= alpha <= 1.0
            // default: 1.0
            //
            //.alpha(1)

            //
            //simulation.alphaMin([min])
            //
            //`simulation.alpha([alpha])` で設定した alpha が min より小さくなると、
            //simulation が停止する。
            //
            // range: 0.0 <= min <= 1.0
            // default: 0.001
            //
            //.alphaMin(0.001)

            //
            //simulation.alphaDecay([decay])
            //
            //`simulation.alpha([alpha])` で設定した alpha の減少速度
            //大きな値で alpha は早く減少、
            //小さな値で alpha は遅く減少する
            //
            // range: 0.0 <= decay <= 1.0
            // default: 0.0228… (= 1 - pow(0.001, 1 / 300) )
            //
            .alphaDecay(0.3)

            //
            //simulation.alphaTarget([target])
            //
            //`simulation.alpha([alpha])` で設定した alpha が、
            //時間と共に、ここで設定した target に漸近する
            //その為、`simulation.alphaMin([min])` で設定した min より大きい値を設定すると、
            //simulationはずっと継続する
            //
            // range: 0.0 <= target <= 1.0
            // default: 0.0
            //
            //alphaTarget(0)

            //
            //simulation.velocityDecay([decay])
            //
            //摩擦係数
            //小さい値で node は滑りやすく、
            //大きい値で node は滑りにくくなる
            //
            // range: 0.0 <= decay <= 1.0
            // default: 0.4
            //
            .velocityDecay(0.2)

        ;

        /* --------------------------------------</Coefficient settings for force simulation> */
    }

    function fireEvent_PropertyEditConsole_rerender(argObj){
        var totalReport = {};
        totalReport.allOK = true;
        totalReport.allNG = true;
        totalReport.reportsArr = {};
        totalReport.reportsArr.datas = [];
        totalReport.reportsArr.links = [];

        var eventObj = document.createEvent("Event");
        eventObj.initEvent("propertyEditConsole_rerender", false, false);
        eventObj.argObj　= {};
        eventObj.argObj.renderByThisObj = argObj;
        eventObj.argObj.clbkFunc = function(renderReport, datasOrLinks){ //ノード変更レポートの追加用コールバック関数
            
            //失敗が発生し場合は、totalReportも失敗とする
            if(!renderReport.allOK){
                totalReport.allOK = false;
            }

            //成功が一つ以上ある場合
            if(!renderReport.allNG){
                totalReport.allNG = false;
            }

            totalReport.reportsArr[datasOrLinks].push(renderReport);
        }
        
        //すべてのnode要素にイベントを発行する
        var nodes = $3svgNodes.nodes();
        for(var i = 0 ; i < nodes.length ; i++){
            nodes[i].dispatchEvent(eventObj);
        }

        //すべてのlink要素にイベントを発行する
        var links = $3svgLinks.nodes();
        for(var i = 0 ; i < links.length ; i++){
            links[i].dispatchEvent(eventObj);
        }

        //コールバックがなかった(=登録リスナがなかった)場合は、totalReportも失敗とする
        if(totalReport.reportsArr.datas.length == 0 && totalReport.reportsArr.links.length == 0){
            totalReport.allOK = false;
            totalReport.allNG = true;
        }

        return totalReport;
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
                        bindedData.type = "text";
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
                            vacantStarted = true; // <- todo node の move event 時に意味をなさなくなる
                        }
                        if(i == (lfSeparatedStrings.length - 1) && str == ""){ //最後の行が空文字
                            str = 'l'; //ダミーとして幅の狭い一文字を設定
                            vacantEnded = true; // <- todo node の move event 時に意味をなさなくなる
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
            
            applyCoordinate("x");
            applyCoordinate("y");
            applyDeltaCoordinate("x", "dx");
            applyDeltaCoordinate("y", "dy");

            function applyCoordinate(axis){

                if(typeof (renderByThisObj.coordinate[axis]) != 'undefined'){ //座標指定あり

                    //変更前状態を取得
                    var prevAxisValStr = $3SVGnodeElem_text.attr(axis);
                    
                    if(typeof (renderByThisObj.coordinate[axis]) != 'number'){ //型がnumberでない場合
                        var wrn = "Wrong type specified in \`renderByThisObj.coordinate." + axis + "\`. "
                                  "specified type:\`" + (typeof (renderByThisObj.coordinate[axis])) + "\`, expected type:\`number\`.";
                        console.warn(wrn);
                        reportObj.FailuredMessages.coordinate[axis] = wrn;
                    
                    }else{ //型がnumber
                        $3SVGnodeElem_text.attr(axis, renderByThisObj.coordinate[axis]);

                        //<tspan>要素に対するx座標指定
                        if(axis == 'x'){
                            $3SVGnodeElem_text.selectAll("tspan").attr(axis, renderByThisObj.coordinate[axis]);
                        }
                        
                        if(prevAxisValStr !== null){
                            prevAxisValStr = parseFloat(prevAxisValStr);
                        }
                        reportObj.PrevObj.coordinate[axis] = prevAxisValStr;
                        reportObj.RenderedObj.coordinate[axis] = renderByThisObj.coordinate[axis];
                        bindedData.coordinate[axis] = renderByThisObj.coordinate[axis];
                        haveToUpdateFrame = true;
                    }
                }
            }

            function applyDeltaCoordinate(axis, delta){

                if(typeof (renderByThisObj.coordinate[delta]) != 'undefined'){ //座標移動指定あり

                    if(typeof (renderByThisObj.coordinate[delta]) != 'number'){ //型がnumberでない場合
                        var wrn = "Wrong type specified in \`renderByThisObj.coordinate." + delta + "\`. " +
                                  "specified type:\`" + (typeof (renderByThisObj.coordinate[delta])) + "\`, expected type:\`number\`.";
                        console.warn(wrn);
                        reportObj.FailuredMessages.coordinate[delta] = wrn;
                    
                    }else{ //型がnumber

                        //変更前状態を取得
                        var prevAxisVal = bindedData.coordinate[axis];

                        var toApplyAxisVal = prevAxisVal + renderByThisObj.coordinate[delta];
                        var toApplyAxisValStr = toApplyAxisVal.toString() + "px"
                        $3SVGnodeElem_text.attr(axis, toApplyAxisValStr);
    
                        //<tspan>要素に対するx座標指定
                        if(axis == 'x'){
                            $3SVGnodeElem_text.selectAll("tspan").attr(axis, toApplyAxisValStr);
                        }
                        
                        //applyCoordinateしていない場合のみ、PrevObjを更新
                        if(typeof reportObj.PrevObj.coordinate[axis] == 'undefined'){
                            reportObj.PrevObj.coordinate[axis] = prevAxisVal;
                        }

                        reportObj.RenderedObj.coordinate[axis] = toApplyAxisVal;
                        bindedData.coordinate[axis] = toApplyAxisVal;
                        haveToUpdateFrame = true;
                    }
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
                                                                    
                    console.warn("Unable to detect pxcel size from applied \`stroke-width\`. " +
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

    function checkToBindLink(checkThisLink){

        if(typeof checkThisLink.type == 'undefined'){ //type指定がない場合
            console.warn("Type not specified. This data will be handled as \`" + defaultLinkhape + "\` type.");
            checkThisLink.type = defaultLinkhape;
        }

        if(typeof checkThisLink.type != 'string'){ //typeの型がstringでない場合
            console.warn("Wrong type specified in \`checkThisLink.type\`. " +
                        "specified type:\`" + (typeof (checkThisLink.type)) + "\`, expected type:\`string\`.\n" +
                        "This data will be handled as \`" + defaultLinkhape + "\` type.");
            checkThisLink.type = defaultLinkhape;
        }

        var forceAsLink = false;

        //不足オブジェクトのチェック&追加
        switch(checkThisLink.type){
            
            case "line":
            {
                forceAsLink = true;
            }
            break;

            default:
            {
                console.warn("unknown data type \`" + checkThisLink.type + "\` specified. This data will be handled as \`line\` type.");
                checkThisLink.type = "line";
                forceAsLink = true;
            }
            break;
        }

        if(forceAsLink){
            //"line" type 固有の不足オブジェクトのチェック&追加
            if(typeof (checkThisLink.line) == 'undefined'){
                checkThisLink.line = {}; //空のオブジェクトを作る
            }
        }
    }

    function renderSVGLink(bindedData, renderByThisObj){

        var $3SVGlinkElem = bindedData.$3bindedSVGLinkElement;
        var $3SVGlinkElem_forSelection = bindedData.$3bindedSelectionLayerSVGElement;
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
                    case "line":
                    {
                        //定義済みSVGElement構造の全削除
                        while($3SVGlinkElem.node().firstChild){
                            $3SVGlinkElem.node().removeChild($3SVGlinkElem.node().firstChild);
                        }
                        while($3SVGlinkElem_forSelection.node().firstChild){ //for selectionlayer
                            $3SVGlinkElem_forSelection.node().removeChild($3SVGlinkElem_forSelection.node().firstChild);
                        }
                        
                        $3SVGlinkElem.append("line");
                        $3SVGlinkElem_forSelection.append("line");
                        
                        //レンダリング
                        reportObj = renderLineTypeSVGLink(bindedData, renderByThisObj);

                        //変更レポートの追加
                        reportObj.PrevObj.type = bindedData.type;
                        bindedData.type = "line";
                        reportObj.RenderedObj.type = "line";
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
                case "line":
                {
                    reportObj = renderLineTypeSVGLink(bindedData, renderByThisObj);
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

        //結合先Nodeが指定されていた場合のチェック
        sourceOrTargetCheck('source');
        sourceOrTargetCheck('target');
        function sourceOrTargetCheck(sourceOrTarget){
            if(typeof renderByThisObj[sourceOrTarget] == 'string'){ //simulation 実行前の場合

                if(typeof bindedData[sourceOrTarget] == 'object'){ //結合先変更の場合
                    reportObj.PrevObj[sourceOrTarget] = bindedData[sourceOrTarget].key;
                }else{ //1回目の描画の場合
                    reportObj.PrevObj[sourceOrTarget] = null;
                }
    
                reportObj.RenderedObj[sourceOrTarget] = renderByThisObj[sourceOrTarget];
            }
        }

        return reportObj;
    }

    function renderLineTypeSVGLink(bindedData, renderByThisObj){

        //line property存在チェック
        if(typeof (renderByThisObj.line) == 'undefined'){
            renderByThisObj.line = {};
        }

        //変更レポート
        var reportObj = {
            key:bindedData.key,
            allOK:true,
            allNG:true,
            PrevObj:{
                line: {},
                coordinate: {}
            },
            RenderedObj:{
                line: {},
                coordinate: {}
            },
            FailuredMessages:{
                line: {},
                coordinate: {}
            }
        };

        var untreatedPropertyNames = Object.keys(renderByThisObj.line); //未処理プロパティリスト

        //line存在チェック
        var $3SVGLinkElement_line;
        var fc = bindedData.$3bindedSVGLinkElement.node().firstChild;
        if(!(fc)){ //lineの描画要素が存在しない場合(= 1回目の描画の場合)
            $3SVGLinkElement_line = bindedData.$3bindedSVGLinkElement.append("line");
        
        }else{
            $3SVGLinkElement_line = d3.select(fc);
        }

        //Selection Layer 存在チェック
        var $3SVGLinkElement_line_forSelection;
        fc = bindedData.$3bindedSelectionLayerSVGElement.node().firstChild
        if(!(fc)){ //line用の selection layer 描画要素が存在しない場合(= 1回目の描画の場合)
            $3SVGLinkElement_line_forSelection = bindedData.$3bindedSelectionLayerSVGElement.append("line");
        
        }else{
            $3SVGLinkElement_line_forSelection = d3.select(fc);
        }

        var inlineStyleOf_SVGlinkElem_line = $3SVGLinkElement_line.node().style;
        var computedStyleOf_SVGlinkElem_line = window.getComputedStyle($3SVGLinkElement_line.node());

        //座標更新
        if(typeof (renderByThisObj.coordinate) != 'undefined'){
            
            applyCoordinate("x1");
            applyCoordinate("y1");
            applyCoordinate("x2");
            applyCoordinate("y2");

            function applyCoordinate(axis){

                if(typeof (renderByThisObj.coordinate[axis]) != 'undefined'){ //座標指定あり

                    //変更前状態を取得
                    var prevAxisValStr = $3SVGLinkElement_line.attr(axis);
                    
                    if(typeof (renderByThisObj.coordinate[axis]) != 'number'){ //型がnumberでない場合
                        var wrn = "Wrong type specified in \`renderByThisObj.coordinate." + axis + "\`. "
                                  "specified type:\`" + (typeof (renderByThisObj.coordinate[axis])) + "\`, expected type:\`number\`.";
                        console.warn(wrn);
                        reportObj.FailuredMessages.coordinate[axis] = wrn;
                    
                    }else{ //型がnumber
                        $3SVGLinkElement_line.attr(axis, renderByThisObj.coordinate[axis]);
                        $3SVGLinkElement_line_forSelection.attr(axis, renderByThisObj.coordinate[axis]);

                        if(prevAxisValStr !== null){
                            prevAxisValStr = parseFloat(prevAxisValStr);
                        }
                        reportObj.PrevObj.coordinate[axis] = prevAxisValStr;
                        reportObj.RenderedObj.coordinate[axis] = renderByThisObj.coordinate[axis];
                        bindedData.coordinate[axis] = renderByThisObj.coordinate[axis];
                    }
                }
            }
        }

        if(typeof renderByThisObj.line.stroke != 'undefined'){ //stroke指定有り

            applyStyleSafely_StringToString({
                bindedObj:bindedData.line,
                $3element:$3SVGLinkElement_line,
                inlineStyleOfElement:inlineStyleOf_SVGlinkElem_line,
                computedtyleOfElement:computedStyleOf_SVGlinkElem_line,
                propertyName:"stroke",
                attributeName:"stroke",
                renderByThisObj:renderByThisObj.line,
                prevReportObj:reportObj.PrevObj.line,
                renderedReportObj:reportObj.RenderedObj.line,
                failuredMessagesObj:reportObj.FailuredMessages.line
            });

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("stroke"), 1); //未処理プロパティリストから削除
        }
        
        if(typeof renderByThisObj.line.stroke_width != 'undefined'){ //stroke-width指定有り

            applyStyleSafely_NumberToPixel({
                bindedObj:bindedData.line,
                $3element:$3SVGLinkElement_line,
                $3sameTypeElement:$3SVGLinkElement_line_forSelection, //selectionlayerにも反映させる
                inlineStyleOfElement:inlineStyleOf_SVGlinkElem_line,
                computedtyleOfElement:computedStyleOf_SVGlinkElem_line,
                propertyName:"stroke_width",
                attributeName:"stroke-width",
                renderByThisObj:renderByThisObj.line,
                prevReportObj:reportObj.PrevObj.line,
                renderedReportObj:reportObj.RenderedObj.line,
                failuredMessagesObj:reportObj.FailuredMessages.line
            });

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("stroke_width"), 1); //未処理プロパティリストから削除
        }

        if(typeof renderByThisObj.line.marker_end != 'undefined'){ //stroke指定有り

            applyStyleSafely_StringToString({
                bindedObj:bindedData.line,
                $3element:$3SVGLinkElement_line,
                $3sameTypeElement:$3SVGLinkElement_line_forSelection, //selectionlayerにも反映させる
                inlineStyleOfElement:inlineStyleOf_SVGlinkElem_line,
                computedtyleOfElement:computedStyleOf_SVGlinkElem_line,
                propertyName:"marker_end",
                attributeName:"marker-end",
                renderByThisObj:renderByThisObj.line,
                prevReportObj:reportObj.PrevObj.line,
                renderedReportObj:reportObj.RenderedObj.line,
                failuredMessagesObj:reportObj.FailuredMessages.line,
                callbackWhenJustBeforeApply:function(writtenInJson, convertedResultObj){

                    var applyThisAtrribute;

                    //pattern check
                    switch(writtenInJson){
                        case "arrow1":
                        {
                            applyThisAtrribute = "url(\"#" + writtenInJson + "\")" ;
                        }
                        break;

                        default:
                        {
                            var wrn = "Unknown marker \`" + writtenInJson + "\` specified in \`marker_end\`. ";
                            console.warn(wrn);
                            convertedResultObj.succeeded = false;
                            convertedResultObj.warningMessage = wrn;
                        }
                        break;
                    }

                    return applyThisAtrribute;
                }
            });

            if(reportObj.PrevObj.line.marker_end !== null){
                var matchedStrs = reportObj.PrevObj.line.marker_end.match(/(url\("#)(.*)("\))/);
                reportObj.PrevObj.line.marker_end = matchedStrs[2]; // `url#\"` と `\")` を取り除いた文字列にする
            }

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("marker_end"), 1); //未処理プロパティリストから削除
        }

        if(typeof renderByThisObj.line.stroke_dasharray != 'undefined'){ //stroke指定有り

            applyStyleSafely_StringToString({
                bindedObj:bindedData.line,
                $3element:$3SVGLinkElement_line,
                $3sameTypeElement:$3SVGLinkElement_line_forSelection, //selectionlayerにも反映させる
                inlineStyleOfElement:inlineStyleOf_SVGlinkElem_line,
                computedtyleOfElement:computedStyleOf_SVGlinkElem_line,
                propertyName:"stroke_dasharray",
                attributeName:"stroke-dasharray",
                renderByThisObj:renderByThisObj.line,
                prevReportObj:reportObj.PrevObj.line,
                renderedReportObj:reportObj.RenderedObj.line,
                failuredMessagesObj:reportObj.FailuredMessages.line,
                callbackWhenJustBeforeApply:function(writtenInJson, convertedResultObj){

                    //"px"とスペースは無視する
                    writtenInJson = writtenInJson.replace(/px/g, "");
                    writtenInJson = writtenInJson.replace(/ /g, "");

                    return writtenInJson;
                },
                callbackWhenVerify:function(triedAttribute, appliedAttribute){

                    var convertedResultObj = {
                        succeeded:true
                    };

                    //"px"とスペースは無視する
                    appliedAttribute = appliedAttribute.replace(/px/g, "");
                    appliedAttribute = appliedAttribute.replace(/ /g, "");

                    if(triedAttribute != appliedAttribute){
                        convertedResultObj.succeeded = false;
                        var wrn  = "Specified style stroke_dasharray:\`" + triedAttribute + "\` did not applied. " +
                                    "Browser applied \`" + appliedAttribute + "\`.";
                        console.warn(wrn);
                        convertedResultObj.warningMessage = wrn;
                    }

                    return convertedResultObj;
                }
            });

            untreatedPropertyNames.splice(untreatedPropertyNames.indexOf("stroke_dasharray"), 1); //未処理プロパティリストから削除
        }

        //Unkdown Propertyに対する警告
        untreatedPropertyNames.forEach(function(propertyName,idx){
            var wrn = "Unkdown Property \`line." + propertyName + "\` specified.";
            console.warn(wrn);
            reportObj.FailuredMessages.line[propertyName] = wrn;
        });

        //変更レポート用警告チェック
        if(Object.keys(reportObj.FailuredMessages.line).length > 0 ||
           Object.keys(reportObj.FailuredMessages.coordinate).length > 0){ //警告が1つ以上ある場合
            reportObj.allOK = false;
        }
        if(Object.keys(reportObj.RenderedObj.line).length > 0 ||
           Object.keys(reportObj.RenderedObj.coordinate).length > 0){ //成功が1つ以上ある場合
            reportObj.allNG = false;
        }

        //変更レポートを返却
        return reportObj;
    }

    //<Utilities for style>----------------------------------------------------------------------------

    //
    // "abcdef"(string) -> "abcdef"(string)
    //
    //指定必須プロパティ
    //
    // | Propery name          | Description                                   |
    // | --------------------- | --------------------------------------------- |
    // | bindedObj             | Objcet that was binded by d3.js               |
    // | $3element             | DOM element selection(d3.js selection)        |
    // | inlineStyleOfElement  | Inline style of DOM element                   |
    // | computedtyleOfElement | Computed style of DOM element                 |
    // | propertyName          | Specified property name in argment object     |
    // | attributeName         | To appliying attribute name (in inline style) |
    // | renderByThisObj       | Argment Object                                |
    // | prevReportObj         | Object to save previous style                 |
    // | renderedReportObj     | Object to save rendered style                 |
    // | failuredMessagesObj   | Object to save warning message                |
    // 
    //任意指定プロパティ
    //
    // | Propery name                | Description                                                |
    // | --------------------------- | ---------------------------------------------------------- |
    // | $3sameTypeElement           | DOM element selection (d3.js selection)                    |
    // | callbackWhenJustBeforeApply | Call back function that invoked just before applying style |
    // | callbackWhenVerify          | Call back function that invoked just after applied style   |
    //
    function applyStyleSafely_StringToString(argmentsObj){

        //変更前状態を取得
        var previousAttribute = argmentsObj.inlineStyleOfElement.getPropertyValue(argmentsObj.attributeName);
        if(previousAttribute == ""){ //未設定の場合
            previousAttribute = null;
        }

        if(argmentsObj.renderByThisObj[argmentsObj.propertyName] === null){ //削除指定の場合
            argmentsObj.$3element.style(argmentsObj.attributeName, null);

            if(typeof argmentsObj.$3sameTypeElement == 'object'){ //同じstyleを適用するelementがある場合
                argmentsObj.$3sameTypeElement.style(argmentsObj.attributeName, null); //style適用
            }

            argmentsObj.prevReportObj[argmentsObj.propertyName] = previousAttribute;
            argmentsObj.renderedReportObj[argmentsObj.propertyName] = null;
            delete argmentsObj.bindedObj[argmentsObj.propertyName];

        }else if(typeof argmentsObj.renderByThisObj[argmentsObj.propertyName] != 'string'){ //型がstringでない場合
            var wrn = "Wrong type specified in \`" + argmentsObj.propertyName + "\`. " +
                      "specified type:\`" + (typeof (argmentsObj.renderByThisObj[argmentsObj.propertyName])) + "\`, expected type:\`string\`.";
            console.warn(wrn);
            argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = wrn;
        
        }else{ //型はstring

            var convertedResultObj = {
                succeeded:true
            };
            var applyThisAttribute;
            if(typeof argmentsObj.callbackWhenJustBeforeApply == 'function'){ //コールバック関数による変換指定アリの場合
                applyThisAttribute = argmentsObj.callbackWhenJustBeforeApply(argmentsObj.renderByThisObj[argmentsObj.propertyName], convertedResultObj); //指定したCallback関数に変換させる
            }else{ //コールバック関数による変換指定ナシの場合
                applyThisAttribute = argmentsObj.renderByThisObj[argmentsObj.propertyName]; //指定文字列をそのまま使用する
            }

            if(!convertedResultObj.succeeded){ //コールバック関数による変換失敗の場合
                argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = convertedResultObj.warningMessage;

            }else{
                argmentsObj.$3element.style(argmentsObj.attributeName, applyThisAttribute); //style適用

                //適用可否チェック
                var appliedAttribute = argmentsObj.computedtyleOfElement.getPropertyValue(argmentsObj.attributeName);
                if(typeof argmentsObj.callbackWhenVerify == 'function'){ //コールバック関数によるチェック指定アリの場合
                    convertedResultObj = argmentsObj.callbackWhenVerify(applyThisAttribute, appliedAttribute); //一致確認用CallBakk関数に比較させる
                
                }else{ //コールバック関数によるチェック指定ナシの場合
                    convertedResultObj = {
                        succeeded:true
                    };
                    if(applyThisAttribute != appliedAttribute){ //文字列が一致しない場合
                        convertedResultObj.succeeded = false;
                        var wrn  = "Specified style in \`" + argmentsObj.propertyName + "\` did not applied. " +
                                   "specified style:\`" + applyThisAttribute + "\`, browser applied style:\`" + appliedAttribute + "\`.";
                        console.warn(wrn);
                        convertedResultObj.warningMessage = wrn;
                    }
                }

                if(!(convertedResultObj.succeeded)){ //computed styleに適用されなかった場合
                    
                    argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = convertedResultObj.warningMessage;
                    argmentsObj.$3element.style(argmentsObj.attributeName, previousAttribute); //変更前の状態に戻す
                
                }else{ //適用された場合

                    if(typeof argmentsObj.$3sameTypeElement == 'object'){ //同じstyleを適用するelementがある場合
                        argmentsObj.$3sameTypeElement.style(argmentsObj.attributeName, applyThisAttribute); //style適用
                    }

                    argmentsObj.prevReportObj[argmentsObj.propertyName] = previousAttribute;
                    argmentsObj.renderedReportObj[argmentsObj.propertyName] = argmentsObj.renderByThisObj[argmentsObj.propertyName];
                    argmentsObj.bindedObj[argmentsObj.propertyName]= argmentsObj.renderByThisObj[argmentsObj.propertyName];
                }
            }
        }
    }

    //
    // 0.0(number) -> "0.0px"(string)
    //
    //指定必須プロパティ
    //
    // | Propery name          | Description                                   |
    // | --------------------- | --------------------------------------------- |
    // | bindedObj             | Objcet that was binded by d3.js               |
    // | $3element             | DOM element selection(d3.js selection)        |
    // | inlineStyleOfElement  | Inline style of DOM element                   |
    // | computedtyleOfElement | Computed style of DOM element                 |
    // | propertyName          | Specified property name in argment object     |
    // | attributeName         | To appliying attribute name (in inline style) |
    // | renderByThisObj       | Argment Object                                |
    // | prevReportObj         | Object to save previous style                 |
    // | renderedReportObj     | Object to save rendered style                 |
    // | failuredMessagesObj   | Object to save warning message                |
    //
    //任意指定プロパティ
    //
    // | Propery name                | Description                                                |
    // | --------------------------- | ---------------------------------------------------------- |
    // | $3sameTypeElement           | DOM element selection (d3.js selection)                    |
    //
    function applyStyleSafely_NumberToPixel(argmentsObj){
            
        //変更前状態を取得
        var previousAttribute = argmentsObj.inlineStyleOfElement.getPropertyValue(argmentsObj.attributeName);
        if(previousAttribute == ""){
            previousAttribute = null;
        }

        if(argmentsObj.renderByThisObj[argmentsObj.propertyName] === null){ //削除指定の場合
            argmentsObj.$3element.style(argmentsObj.attributeName, null); //削除

            //同形式のDOM element に対しても style を適用する
            if(typeof argmentsObj.$3sameTypeElement != 'undefined'){
                argmentsObj.$3sameTypeElement.style(argmentsObj.attributeName, null);
            }

            if(previousAttribute !== null){
                previousAttribute = parseFloat(previousAttribute); // "0.0px"(string) -> 0.0(number) 形式に変換
            }
            argmentsObj.prevReportObj[argmentsObj.propertyName] = previousAttribute;
            argmentsObj.renderedReportObj[argmentsObj.propertyName] = null;
            delete argmentsObj.bindedObj[argmentsObj.propertyName];
        
        }else if(typeof argmentsObj.renderByThisObj[argmentsObj.propertyName] != 'number'){ //型がnumberでない場合
            var wrn = "Wrong type specified in \`" + argmentsObj.propertyName + "\`. " +
                      "specified type:\`" + (typeof (argmentsObj.renderByThisObj[argmentsObj.propertyName])) + "\`, expected type:\`number\`.";
            console.warn(wrn);
            argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = wrn;
        
        }else{ //型がnumber
            var pixcelNumberRegex = new RegExp(/^[-]?[0-9]+(\.[0-9]+)?px$/);
            var applyThisAttribute = argmentsObj.renderByThisObj[argmentsObj.propertyName] + "px";

            if(!(pixcelNumberRegex.test(applyThisAttribute))){ //指定数値が `0.0px`形式にならない場合(ex: NaNを指定)
                var wrn = "Invalid Number \`" + argmentsObj.renderByThisObj[argmentsObj.propertyName].toString() + "\` specified.";
                console.warn(wrn);
                argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = wrn;

            }else{
                argmentsObj.$3element.style(argmentsObj.attributeName, applyThisAttribute);

                //適用可否チェック
                var appliedAttribute = argmentsObj.computedtyleOfElement.getPropertyValue(argmentsObj.attributeName);

                if(!(pixcelNumberRegex.test(appliedAttribute))){ // `0.0px`形式に設定できていない場合
                                                                 // 指数表記になるような極端な数値も、このルートに入る

                    var wrn = "Specified style in \`" + argmentsObj.propertyName + "\` did not applied. " +
                              "specified style:\`" + applyThisAttribute + "\`, browser applied style:\`" + appliedAttribute + "\`.";
                    console.warn(wrn);
                    argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = wrn;

                    argmentsObj.$3element.style(argmentsObj.attributeName, previousAttribute); //変更前の状態に戻す

                }else{

                    //適用されたstrke-widthと指定したstrke-widthの差分チェック
                    if( Math.abs(parseFloat(appliedAttribute) - argmentsObj.renderByThisObj[argmentsObj.propertyName]) >= 0.1){
                        var wrn = "Specified style in \`" + argmentsObj.propertyName + "\` did not applied. " +
                                  "specified style:\`" + applyThisAttribute + "\`, browser applied style:\`" + appliedAttribute + "\`.";
                        console.warn(wrn);
                        argmentsObj.failuredMessagesObj[argmentsObj.propertyName] = wrn;

                        argmentsObj.$3element.style(argmentsObj.attributeName, previousAttribute); //変更前の状態に戻す
                    
                    }else{ //適用された場合

                        //同形式のDOM element に対しても style を適用する
                        if(typeof argmentsObj.$3sameTypeElement != 'undefined'){
                            argmentsObj.$3sameTypeElement.style(argmentsObj.attributeName, applyThisAttribute);
                        }
                        
                        if(previousAttribute !== null){
                            previousAttribute = parseFloat(previousAttribute); // "0.0px"(string) -> 0.0(number) 形式に変換
                        }

                        argmentsObj.prevReportObj[argmentsObj.propertyName] = previousAttribute;
                        argmentsObj.renderedReportObj[argmentsObj.propertyName] = argmentsObj.renderByThisObj[argmentsObj.propertyName];
                        argmentsObj.bindedObj[argmentsObj.propertyName] = argmentsObj.renderByThisObj[argmentsObj.propertyName];
                    }
                }
            }
        }   
    }

    //---------------------------------------------------------------------------</Utilities for style>

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

    function backToDefaulIfWarnForLink(reportObj, bindedData){

        if(typeof reportObj.RenderedObj.type != 'undefined'){
            switch(reportObj.RenderedObj.type){
                case "line":
                {
                    backToDefaulIfWarnForLink_LineType(reportObj, bindedData);
                }
                break;

                default:
                break;
            }
        }
    }

    function backToDefaulIfWarnForLink_LineType(reportObj, bindedData){

        var propertyNames = Object.keys(reportObj.FailuredMessages.line); //Property Names Array to delete

        //Property削除ループ
        propertyNames.forEach(function(propertyName, idx){
            delete bindedData.line[propertyName];
        });
        
    }

    function clsfnc_historyManager(){

        var pointingIndexOfHistory = -1;      //historyのどのindexが選択されているか
        var previewedIndex = -1; //preview している history の index no(-1 はpreview していない事を表す)

        var $slideDowningElem = null;
        var animating = false; //アニメーション中判定用フラグ

        var listenerInvokedOn = -1;
        var mouseEnterdTime = 0;
        var mouseMovedTime = 0;
        var clickedTime = 0;

        this.appendHistory = function(transactionObj, preload){
            
            //最初のhistory 追加時は、ダミーの report を UI 上に配置する
            if(pointingIndexOfHistory == -1 && (!preload)){

                var openReport = {
                    type:'change',
                    allOK:true,
                    allNG:true,
                    reportsArr:{
                        datas:[],
                        links:[],
                    },
                    message:"Start",
                };

                insertHistory(openReport);
            }

            insertHistory(transactionObj);
        }

        this.applyPrevioursObj = function(renderingObj){
            return rollbackOrReplayTransaction(renderingObj, "PrevObj");
        }

        this.traceHistory = function(incrOrDecrVal){

            var toThisIndex;

            if(pointingIndexOfHistory < 0){return;} //history が 1つもない
            if(incrOrDecrVal == 0){return;} //0 は除外

            //incrOrDecrValの有効範囲内チェック
            toThisIndex = incrOrDecrVal + pointingIndexOfHistory;
            if(toThisIndex < 0 ){ //transactionHistory[] の index no がマイナス値になってしまう場合
                toThisIndex = 0;

            }else if(transactionHistory.length <= toThisIndex){ //transactionHistory[] の最大 index値より大きい数になってしまう場合
                toThisIndex = transactionHistory.length-1;
            }

            if(toThisIndex == pointingIndexOfHistory){ //history 移動が発生しない場合
                return;
            }
            
            cancelPreview(); //preview している history を cancel
            replayHistory(pointingIndexOfHistory, toThisIndex); //mouseenterしたhistoryをPreview
            scrollTo($transactionHistoryElement.children('.transaction[data-history_index="' + toThisIndex.toString() + '"]').get(0)); //選択 history を表示範囲内に表示させる
            pointingIndexOfHistory = toThisIndex; //選択 index の更新

        }

        function insertHistory(transactionObj){

            //historyの挿入チェック
            if((pointingIndexOfHistory + 1) < transactionHistory.length){ //historyの途中に挿入する場合
                deleteHistory(pointingIndexOfHistory + 1); //不要なhistoryを破棄
            }
    
            //現在の選択状態を解除
            $transactionHistoryElement.children('.transaction[data-history_index="' + pointingIndexOfHistory.toString() + '"]')
                .eq(0)
                .removeClass(className_nodeIsSelected);
    
            //オブジェクトコピー
            var toSaveTransactionObj = {};
            mergeObj(transactionObj, toSaveTransactionObj, true);
    
            transactionHistory.push(toSaveTransactionObj); //Append History
            pointingIndexOfHistory++;
    
            var $3historyMessageElem = $3transactionHistoryElement.append("div")
                .classed("transaction", true)
                .classed(className_nodeIsSelected, true)
                .attr("data-history_index", pointingIndexOfHistory.toString());
    
            $3historyMessageElem.append("small")
                .style("font-size", "small")
                .text(toSaveTransactionObj.message);
            
            var $historyMessageElem  = $($3historyMessageElem.node());

            //transactionに対するMouseEnterイベント
            $historyMessageElem.mouseenter(function(){
                var invokedElem = this;
                checkInit(invokedElem);
                mouseEnterdTime++;
            });

            $historyMessageElem.mousemove(function(){
                var invokedElem = this;
                checkInit(this);

                if(mouseEnterdTime > 0 && (!animating)){
                    mouseMovedTime++; //mouseEnterの後 かつ、 アニメーション中でないと、カウントアップしない
                }
                
                if(mouseMovedTime == 1){ //最初のmouse move event の場合
                    startPreview(invokedElem);
                }
            });
    
            //transactionに対するクリックイベント
            $historyMessageElem.on("click",function(){
                var invokedElem = this;
                checkInit(invokedElem);

                if(!animating){ //アニメーション中はカウントアップしない
                    clickedTime++;
                }

                if(clickedTime == 1){

                    if(mouseMovedTime == 0){ //mouse move せずに click した場合
                        var invokedIndex = parseInt($(invokedElem).attr("data-history_index"));

                        if(invokedIndex != pointingIndexOfHistory){ //選択済みの history ではない場合
                            replayHistory(pointingIndexOfHistory, invokedIndex); //click した history に移動
                            scrollTo(invokedElem); //選択 history を表示範囲内に表示させる
                            pointingIndexOfHistory = invokedIndex;
                        }
                    
                    }else{ //mouse move の後(startPreview(); のコール後)の場合
                        confirmPreview();
                    }
                }
            });
    
            //transactionに対するMouseLeaveイベント
            $historyMessageElem.mouseleave(function(){
                initHistoryUI();
            });

            scrollTo($3historyMessageElem.node()); //選択 history を表示範囲内に表示させる

            if($slideDowningElem !== null){ //前回 slideDown が終了していない場合
                $slideDowningElem.finish(); // アニメーションを終了させ、アニメーション終了時の状態にする
                $slideDowningElem = null;
            }
            $3historyMessageElem.style("display", "none"); // <- 表示用アニメーションの為に、一旦非表示にする
            $slideDowningElem = $historyMessageElem;
            $historyMessageElem.slideDown(100,function(){
                $slideDowningElem = null;
            }); // <- 表示用アニメーション

            function checkInit(invokedElem){
                var invokedIndex = parseInt($(invokedElem).attr("data-history_index"));

                if(invokedIndex != listenerInvokedOn){
                    initHistoryUI();
                    listenerInvokedOn = invokedIndex;
                }
            }

            function initHistoryUI(){
                cancelPreview();
                mouseEnterdTime = 0;
                mouseMovedTime = 0;
                clickedTime = 0;
            }
        }

        function startPreview(specifiedElem){

            if(previewedIndex == -1){ //previewしているhistory が存在しない場合
                var specifiedIndex = parseInt($(specifiedElem).attr("data-history_index"));
                if(specifiedIndex != pointingIndexOfHistory){ //すでに選択済みの history の場合
                    replayHistory(pointingIndexOfHistory, specifiedIndex); //mouseenterしたhistoryをPreview
                    previewedIndex = specifiedIndex;
                }
                scrollTo(specifiedElem); //選択 history を表示範囲内に表示させる
            }
        }

        function confirmPreview(){

            if(previewedIndex >= 0){ //preview している history が存在する場合
                pointingIndexOfHistory = previewedIndex;
                previewedIndex = -1; //preview mode の終了
            }
        }

        function cancelPreview(){

            if(previewedIndex >= 0){ //preview している history が存在する場合
                replayHistory(previewedIndex, pointingIndexOfHistory); //history[]内の選択indexへもどす
                previewedIndex = -1; //preview mode の終了
            }
        }

        // 指定 history element が表示範囲内からはみ出ている場合、
        // 表示範囲内に収まるように scroll する
        function scrollTo(historyElem){
            var maxHeight = window.getComputedStyle($transactionHistoryElement.get(0)).maxHeight;
            var $historyElem = $(historyElem);
            if(maxHeight != 'none'){ //maxHeightが定義されている
                maxHeight = parseFloat(maxHeight);

                var positionTop = $historyElem.position().top;
                var animateTo = -1;

                if(positionTop < 0){ //上方向に表示しきれていない場合
                    animateTo = $transactionHistoryElement.scrollTop() + positionTop;

                }else{
                    var bottomMax = maxHeight;
                    
                    //note
                    // slidedown 中の history element が存在する場合は
                    // その存在を考慮した scrollwidth を取得するため、finish() させておく必要がある
                    if($slideDowningElem !== null){
                        $slideDowningElem.finish();
                        $slideDowningElem = null;
                    }

                    if($transactionHistoryElement.get(0).clientWidth < $transactionHistoryElement.get(0).scrollWidth){ //横スクロールバーが表示されている場合
                        bottomMax -= getWidthOfScrollbar($3motherElement.node()); //スクロールバーの幅分を除く
                    }

                    if(bottomMax < (positionTop + $historyElem.outerHeight(true))){ //下方向に表示しきれていない場合
                        animateTo = $transactionHistoryElement.scrollTop() + ((positionTop + $historyElem.outerHeight(true)) - bottomMax);
                    }
                }                

                if(animateTo != -1){
                    if(animating){ //前回の animation が終了していない場合
                        $transactionHistoryElement.finish(); // アニメーションを終了させ、アニメーション終了時の状態にする
                        animating = false;  //アニメーションフラグOFF
                    }
                    animating = true; //アニメーションフラグON
                    $transactionHistoryElement.animate(
                        {
                            scrollTop:animateTo
                        },{
                            complete:function(){
                                animating = false;  //アニメーションフラグOFF
                            }
                        }
                    );
                }
            }
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

            var replayReport = {};
            replayReport.reportArr = [];
            
            //increment / decrement 判定
            if(startIndex == endIndex){ //Replay不要の場合
                return; //何も返さない
            }

            if(checkSucceededLoadOf_ExternalComponent() && nowEditng){ //property editor がload済み && 編集中の場合
                propertyEditorsManager.cancel(); //previewしている editor 状態を cancel
            }
            
            $transactionHistoryElement.children('.transaction[data-history_index="' + startIndex.toString() + '"]')
                .eq(0)
                .removeClass(className_nodeIsSelected)
            ; //startindex の history の選択状態を解除

            
            if(startIndex < endIndex){ // 旧 → 新 へのReplay
                replayReport.type = 'replay';
                
                for(var i = (startIndex + 1); i <= endIndex ; i++){
                    var tmpObj = {};
                    tmpObj.indexOfTransaction = i;
                    tmpObj.report = rollbackOrReplayTransaction(transactionHistory[i], "RenderedObj");
                    replayReport.reportArr.push(tmpObj);
                }
    
            }else{ // 新 → 旧 へのReplay
                replayReport.type = 'rollback';
    
                for(var i = startIndex; i > endIndex ; i--){
                    var tmpObj = {};
                    tmpObj.indexOfTransaction = i;
                    tmpObj.report = rollbackOrReplayTransaction(transactionHistory[i], "PrevObj");
                    replayReport.reportArr.push(tmpObj);
                }
    
            }

            $transactionHistoryElement.children('.transaction[data-history_index="' + endIndex.toString() + '"]')
                .eq(0)
                .addClass(className_nodeIsSelected) //endindex の history を選択
            ;
                
            dataSelectionManager.recoverDataSelection(replayReport); // data 増減があった場合に、node(s) / link(s) 選択状態を合わせる
            
            if(checkSucceededLoadOf_ExternalComponent() && nowEditng){ //property editor がload済み && 編集中の場合
                checkAdjustPropertyEditConsole();//property editor 内の値を history 変更した状態に合わせる
            }
    
            return replayReport;
        }

        function rollbackOrReplayTransaction(transaction, toApplyObjName){
    
            var rollbackRenderringReport;
            
            //引数チェック
            if(transaction.reportsArr.datas.length == 0 && transaction.reportsArr.links.length == 0){ //トランザクションレポートが存在しない
                console.warn("Specified trunsaction not contains SVG rendering report.");
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
                    call_changeNodes();
                }
                break;
    
                default:
                {
                    console.warn("Unknown transaction type specified.");
                }
                break;
            }
    
            if( (typeof rollbackRenderringReport == 'object') && (!rollbackRenderringReport.allOK)){ //ロールバックに失敗した場合
                console.error("Cannot apply history. Check following report.");
                console.error(rollbackRenderringReport);
            }
    
            return rollbackRenderringReport;
    
            function call_deleteNodes(){
                //削除対象key収集ループ
                var toDeleteKeyArr = {};
                toDeleteKeyArr.datas = [];
                toDeleteKeyArr.links = [];
    
                //transaction.reportsArr.datas[]の網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.datas.length ; i++){
                    var reportObj = transaction.reportsArr.datas[i];
                    toDeleteKeyArr.datas.push(reportObj.key); //削除指定keyArrayに追加
                }
    
                //transaction.reportsArr.links[]の網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.links.length ; i++){
                    var reportObj = transaction.reportsArr.links[i];
                    toDeleteKeyArr.links.push(reportObj.key); //削除指定keyArrayに追加
                }
    
                rollbackRenderringReport = deleteNodes(toDeleteKeyArr, false); //Node(s), Link(s)削除
            }
    
            function call_appendNodes(){
                //追加NodeArray生成ループ
                var toAppendObjArr = {};
                toAppendObjArr.datas = [];
                toAppendObjArr.links = [];
    
                //transaction.reportsArr.datas[]の網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.datas.length ; i++){
                    var reportObj = transaction.reportsArr.datas[i];
                    var toAppendObj = {};
                    mergeObj(reportObj[toApplyObjName], toAppendObj, false); //オブジェクトコピー
                    toAppendObj.key = reportObj.key; //キー番号をhistoryから復活させる
                    toAppendObjArr.datas.push(toAppendObj);
                }
    
                //transaction.reportsArr.links[]の網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.links.length ; i++){
                    var reportObj = transaction.reportsArr.links[i];
                    var toAppendObj = {};
                    mergeObj(reportObj[toApplyObjName], toAppendObj, false); //オブジェクトコピー
                    toAppendObj.key = reportObj.key; //キー番号をhistoryから復活させる
                    toAppendObjArr.links.push(toAppendObj);
                }
                
                rollbackRenderringReport = appendNodes(toAppendObjArr); //Nodes(s), Link(s)復活
            }
    
            function call_changeNodes(){
                rollbackRenderringReport = {};
                rollbackRenderringReport.type = 'change';
                rollbackRenderringReport.allOK = true;
                rollbackRenderringReport.allNG = true;
                rollbackRenderringReport.reportsArr = {};
                rollbackRenderringReport.reportsArr.datas = [];
                rollbackRenderringReport.reportsArr.links = [];
    
                //レンダリングレポート網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.datas.length ; i++){
                    var reportObj = transaction.reportsArr.datas[i];
                    var bindedData = getBindedDataFromKey(reportObj.key);
    
                    if(typeof bindedData == 'undefined'){ //対象のノードデータが存在しない場合
                        console.error("\`key:" + reportObj.key + "\` not found in D3.js binded data array.");
    
                    }else{ //対象のノードデータが存在する場合
                        
                        var singleReport = renderSVGNode(bindedData, reportObj[toApplyObjName]);
    
                        if(!singleReport.allOK){ //失敗が発生した場合
                            rollbackRenderringReport.allOK = false;
                        }
    
                        if(!singleReport.allNG){ //成功が1つ以上ある場合
                            rollbackRenderringReport.allNG = false;
                        }
    
                        rollbackRenderringReport.reportsArr.datas.push(singleReport);
                    }
                }
    
                //レンダリングレポート網羅ループ
                for(var i = 0 ; i < transaction.reportsArr.links.length ; i++){
                    var reportObj = transaction.reportsArr.links[i];
                    var bindedData = getBindedLinkDataFromKey(reportObj.key);
    
                    if(typeof bindedData == 'undefined'){ //対象のノードデータが存在しない場合
                        console.error("\`key:" + reportObj.key + "\` not found in D3.js binded link array.");
    
                    }else{ //対象のノードデータが存在する場合
                        
                        var singleReport = renderSVGLink(bindedData, reportObj[toApplyObjName]);
    
                        if(!singleReport.allOK){ //失敗が発生した場合
                            rollbackRenderringReport.allOK = false;
                        }
    
                        if(!singleReport.allNG){ //成功が1つ以上ある場合
                            rollbackRenderringReport.allNG = false;
                        }
    
                        rollbackRenderringReport.reportsArr.links.push(singleReport);
                    }
                }
                startForce(); //force simulation
            }
        }
    }
    
    function clsfnc_dataSelectionManager(){

        var lastSelectedDatas = []; //datas[].key 用 stack
        var lastSelectedLinks = []; //links[].key 用 stack

        //CLEAR
        this.clearSelections = function(){

            //Nodeすべてを選択解除する
            for(var i = 0 ; i < dataset.datas.length ; i++){
                dataset.datas[i].$3bindedSelectionLayerSVGElement
                    .classed("selected", false)
                    .attr("data-selected", "false"); //選択解除
            }

            //linkすべてを選択解除する
            for(var i = 0 ; i < dataset.links.length ; i++){
                dataset.links[i].$3bindedSelectionLayerSVGElement
                    .classed("selected", false)
                    .attr("data-selected", "false"); //選択解除
            }

            lastSelectedDatas = [];
            lastSelectedLinks = [];
        }
        
        //PUSH
        this.pushDataSelection = function(d){

            //選択状態にする
            d.$3bindedSelectionLayerSVGElement
                .classed("selected", true)
                .attr("data-selected", "true")
            ;

            lastSelectedDatas.push(d.key);
        }
        this.pushLinkSelection = function(d){

            //選択状態にする
            d.$3bindedSelectionLayerSVGElement
                .classed("selected", true)
                .attr("data-selected", "true")
            ;

            lastSelectedLinks.push(d.key);
        }

        //POP
        this.spliceDataSelection = function(toRemoveData){

            //非選択状態にする
            toRemoveData.$3bindedSelectionLayerSVGElement
                .classed("selected", false)
                .attr("data-selected", "false")
            ;

            if(lastSelectedDatas.length > 0){
                for(var i = lastSelectedDatas.length-1 ; i >=0 ; i--){
                    if(toRemoveData.key == lastSelectedDatas[i]){
                        lastSelectedDatas.splice(i, 1);
                        break;
                    }
                }
            }
        }
        this.spliceLinkSelection = function(toRemoveLink){
            
            //非選択状態にする
            toRemoveLink.$3bindedSelectionLayerSVGElement
                .classed("selected", false)
                .attr("data-selected", "false")
            ;

            if(lastSelectedLinks.length > 0){
                for(var i = lastSelectedLinks.length-1 ; i >=0 ; i--){
                    if(toRemoveLink.key == lastSelectedLinks[i]){
                        lastSelectedLinks.splice(i, 1);
                        break;
                    }
                }
            }
        }

        //history 操作による Node(s) 復活で、
        //selection 状態も復活させる
        this.recoverDataSelection = function(recoveringReport){

            if(typeof recoveringReport != 'object'){
                console.warn("recoveringReport is not a object.");
                return;
            }

            // transaction の 旧 → 新 への Replay でない場合はハジく
            if(recoveringReport.type != 'replay'){
                return;
            }

            for(var i = 0 ; i < recoveringReport.reportArr.length ; i++){

                var oneTransactionReport = recoveringReport.reportArr[i].report;

                if(oneTransactionReport.type == 'append'){ // node の復活イベントのみ対象にする

                    //復活したNode が select 履歴に存在するか検索するループ
                    for(var j = 0 ; j < oneTransactionReport.reportsArr.datas.length ; j++){
                        for(var k = 0 ; k < lastSelectedDatas.length ; k++){
        
                            if(oneTransactionReport.reportsArr.datas[j].key == lastSelectedDatas[k]){
                                var bindeddata = getBindedDataFromKey(lastSelectedDatas[k]);
                                bindeddata.$3bindedSelectionLayerSVGElement
                                    .classed("selected", true) //選択
                                    .attr("data-selected", "true");
                            }
                        }
                    }

                    //復活したLink が select 履歴に存在するか検索するループ
                    for(var j = 0 ; j < oneTransactionReport.reportsArr.links.length ; j++){
                        for(var k = 0 ; k < lastSelectedLinks.length ; k++){
        
                            if(oneTransactionReport.reportsArr.links[j].key == lastSelectedLinks[k]){
                                var bindeddata = getBindedLinkDataFromKey(lastSelectedLinks[k]);
                                bindeddata.$3bindedSelectionLayerSVGElement
                                    .classed("selected", true) //選択
                                    .attr("data-selected", "true");
                            }
                        }
                    }
                }
            }
        }

        //最後に選択した有効な data を返す
        //見つからなかった場合は、 'undefined' のままを返す
        this.getLatestSelectedData = function(){
            var latestSelectedData;
            for(var i = lastSelectedDatas.length-1; i >= 0 ; i--){
                latestSelectedData = getBindedDataFromKey(lastSelectedDatas[i]);
                if(typeof latestSelectedData != 'undefined'){
                    break;
                }
            }
            return latestSelectedData;
        }
    }

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

        nowTyping = false;
        propertyEditorsManager.exit(); // Node個別編集用 PropertyEditor を終了
        
        //Node選択状態の表示化ループ
        for(var i = 0 ; i < dataset.datas.length ; i++){

            var bindedData = dataset.datas[i];

            if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == "true"){ // 選択対象Nodeの場合
                bindedData.$3bindedSelectionLayerSVGElement.classed("selected", true); //選択状態にする
            }
        }

        //link選択状態の表示化ループ
        for(var i = 0 ; i < dataset.links.length ; i++){

            var bindedData = dataset.links[i];

            if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == "true"){ // 選択対象Nodeの場合
                bindedData.$3bindedSelectionLayerSVGElement.classed("selected", true); //選択状態にする
            }
        }

        if(isAnimatingPropertyEditConsoleElement){
            $propertyEditConsoleElement.finish();
            isAnimatingPropertyEditConsoleElement = false;
        }
        isAnimatingPropertyEditConsoleElement = true;
        $propertyEditConsoleElement.slideUp(100,function(){ //edit consoleの終了
            isAnimatingPropertyEditConsoleElement = false;
        });

        nowEditng = false; //編集モードの終了
    }

    function exportNodes(selectedOnly){

        var toExportObjArr = {};
        
        //吐き出し用Obj生成ループ
        $3svgNodes.each(function(d,i){
            
            //選択ノードチェック
            if(selectedOnly &&
               (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() != 'true')){ //選択していない場合
                return; //吐き出し対象から除外
            }

            //吐き出し用Objを生成
            var toExportObj = {};
            toExportObj.key = d.key;
            toExportObj.type = d.type;
            toExportObj[d.type] = {};
            mergeObj(d[d.type], toExportObj[d.type], false); // contentコピー

            if(typeof toExportObjArr.datas == 'undefined'){ //data property未定義(= 1回目の追加の場合)
                toExportObjArr.datas = [];
            }
            toExportObjArr.datas.push(toExportObj); //配列に追加
        });

        //link の吐き出し用Obj生成ループ
        $3svgLinks.each(function(d,i){
            
            //選択ノードチェック
            if(selectedOnly &&
               (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() != 'true')){ //選択していない場合
                return; //吐き出し対象から除外
            }

            //吐き出し用Objを生成
            var toExportObj = {};
            toExportObj.source = d.source.key;
            toExportObj.target = d.target.key;
            toExportObj.type = d.type;
            toExportObj[d.type] = {};
            mergeObj(d[d.type], toExportObj[d.type], false); // contentコピー

            if(typeof toExportObjArr.links == 'undefined'){ //data property未定義(= 1回目の追加の場合)
                toExportObjArr.links = [];
            }
            toExportObjArr.links.push(toExportObj); //配列に追加
        });

        if((typeof toExportObjArr.datas == 'undefined') && (typeof toExportObjArr.links == 'undefined')){ //吐き出すNodeが存在しない場合
            console.warn("No Node and Link to Export");
        
        }else{ //吐き出すNodeが存在する場合
            var txtCntnt = JSON.stringify(toExportObjArr, null, '    ');
            exportTextFile(txtCntnt, fileName_Export); 
        }
    }

    function exportTextFile(content, fileName){
        
        var blobObj = new Blob([content], {type: "application/json"}); // バイナリデータを作る

        if(window.navigator.msSaveBlob){ //ieの場合
            window.navigator.msSaveBlob(blobObj, fileName); //独自関数でDL

        }else{ //ieでない場合
            //var a = document.createElement("a");
            var dlAnchor = $3motherElement.append("a").node();
            dlAnchor.href = URL.createObjectURL(blobObj);
            dlAnchor.target = '_blank';
            dlAnchor.download = fileName;
            dlAnchor.click();
            dlAnchor.remove();
            URL.revokeObjectURL(); //開放 ///todo <- firefoxでコケる
        }
    }

    function call_editSVGNode(bindedData){

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                        
        if(nowEditng){
            exitEditing(); //編集モードの終了
        
        }

        dataSelectionManager.clearSelections(); //node選択履歴をクリア
        dataSelectionManager.pushDataSelection(bindedData); //node選択履歴に追加
        
        editSVGNodes();
        propertyEditorsManager.focus(bindedData);
    }

    function call_editSVGNodes(checkContext){

        if(checkContext){
            $SVGDrawingAreaElement.contextMenu("hide"); //hide right click context menu
        }

        //External Componentが未loadの場合はハジく
        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
        
        if(nowEditng){ // 編集中の場合
            //nothing to do
        
        }else{ // 編集中でない場合
            
            editSVGNodes(); //note 選択状態になっているNodeかLinkが1つ以上あるかどうかは、この関数内で確認する

            var latestSelectedData = dataSelectionManager.getLatestSelectedData();

            if(typeof latestSelectedData !== 'undefined'){ //選択対象Nodeが存在する場合
                propertyEditorsManager.focus(latestSelectedData);
            }
        }
    }

    //
    //SVGノード(複数)を編集する
    //
    function editSVGNodes(){

        editingNodeKeys = [];
        editingLinkKeys = [];
        
        //選択状態のNodeに対するSelectionLayerを非表示にする
        $3svgNodes.each(function(d,i){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                d.$3bindedSelectionLayerSVGElement.classed("selected", false); //非表示にする
                editingNodeKeys.push(d.key);
                propertyEditorsManager.append(d);
            }
        });

        //選択状態のLinkに対するSelectionLayerを非表示にする
        $3svgLinks.each(function(d,i){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                d.$3bindedSelectionLayerSVGElement.classed("selected", false); //非表示にする
                editingLinkKeys.push(d.key);
            }
        });

        if(editingNodeKeys.length > 0 || editingLinkKeys.length > 0){ //1つ以上の Node or Link を選択している場合
            //選択 Node(s) を元に PropertyEditConsole に反映
            adjustPropertyEditConsole();
            
            if(isAnimatingPropertyEditConsoleElement){
                $propertyEditConsoleElement.finish();
                isAnimatingPropertyEditConsoleElement = false;
            }
            isAnimatingPropertyEditConsoleElement = true;
            $propertyEditConsoleElement.slideDown(100, function(){ //PropertyEditorを表示
                isAnimatingPropertyEditConsoleElement = false;
            });
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
    // Node選択状態が変化していないことを確認してから、
    // adjustPropertyEditConsole()をコールする
    // Node選択状態が変化していたら、Property Edit Console を終了する
    //
    function checkAdjustPropertyEditConsole(){

        propertyEditorsManager.exit(); // Node個別編集用 PropertyEditor を終了

        var editingKeysForCheck = editingNodeKeys.slice(0, editingNodeKeys.length);

        $3svgNodes.each(function(d,i){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                editingKeysForCheck.splice(editingKeysForCheck.indexOf(d.key), 1);
            }
        });

        var editingLinkKeysForCheck = editingLinkKeys.slice(0, editingLinkKeys.length);

        $3svgLinks.each(function(d,i){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                editingLinkKeysForCheck.splice(editingLinkKeysForCheck.indexOf(d.key), 1);
            }
        });

        //選択中Nodeの数が減っていたら(= 選択中Nodeのいづれかが、historyのrollbackで削除されたら)
        if(editingKeysForCheck.length > 0 || editingLinkKeysForCheck.length > 0){
            exitEditing(); //Property Edit Consoleを終了
            
        }else{
            adjustPropertyEditConsole();
        }
    }

    //
    // PropertyEditConsole 内の各 Property Editor の設定値を
    // selected な Node の表示状態に合わせる
    //
    function adjustPropertyEditConsole(onlyNodeIndividual){

        if(onlyNodeIndividual){ //Node個別編集機能のみadjustする場合
            propertyEditorsManager.adjust();

        }else{ //すべてadjustする場合

            var computedStylesOfData = [];
            var computedStylesOfLink = [];

            //選択状態になっているNodeから適用済みStyleを抽出するループ
            for(var i = 0 ; i < dataset.datas.length ; i++){

                var bindedData = dataset.datas[i];

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

            if(computedStylesOfData.length == 0){ //編集対象Nodeが存在しない場合
                $propertyEditConsoleElement_node.hide();

            }else{ //編集対象Nodeが存在する場合
                $propertyEditConsoleElement_node.show();

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

            //選択状態になっているNodeから適用済みStyleを抽出するループ
            for(var i = 0 ; i < dataset.links.length ; i++){

                var bindedData = dataset.links[i];

                if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ // 選択対象Linkの場合
                    
                    var computedStyleObj = {};
                    var explicitnessObj = {};
                    var sccedded = getComputedStyleOfLink(bindedData, computedStyleObj, explicitnessObj); // Linkに適用されたスタイルの取得
                    
                    if(sccedded){
                        computedStylesOfLink.push({computedStyle:computedStyleObj,
                                                   explicitness:explicitnessObj});
                        
                    }
                }
            }

            if(computedStylesOfLink.length == 0){ //編集対象Nodeが存在しない場合
                $propertyEditConsoleElement_link.hide();

            }else{ //編集対象Nodeが存在する場合
                $propertyEditConsoleElement_link.show();

                var propName1 = 'line';
                var mergedStyle = {};
                mergedStyle[propName1] = {};
                var mergedExplicitness = {};
                mergedExplicitness[propName1] = {};

                // computedStylesOfLink[]からスタイルをマージ
                for(var i = 0 ; i < computedStylesOfLink.length ; i++){
                    var computedStlOfData =  computedStylesOfLink[i];
                    switch(computedStlOfData.computedStyle.type){
                        case "line":
                        {
                            //各Propertyのマージ
                            mergeStyles(computedStlOfData.computedStyle[propName1], computedStlOfData.explicitness[propName1], mergedStyle[propName1], mergedExplicitness[propName1], "stroke");
                            mergeStyles(computedStlOfData.computedStyle[propName1], computedStlOfData.explicitness[propName1], mergedStyle[propName1], mergedExplicitness[propName1], "stroke_width");
                            mergeStyles(computedStlOfData.computedStyle[propName1], computedStlOfData.explicitness[propName1], mergedStyle[propName1], mergedExplicitness[propName1], "marker_end");
                            mergeStyles(computedStlOfData.computedStyle[propName1], computedStlOfData.explicitness[propName1], mergedStyle[propName1], mergedExplicitness[propName1], "stroke_dasharray");
                            
                        }
                        break;

                        default:
                        {
                            //nothing to do
                        }
                        break;
                    }
                }
                
                propertyEditorsManager.adjustLink(mergedStyle, mergedExplicitness);
            }
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

        var computedStyleOf_MoterElement = window.getComputedStyle($3motherElement.node());
        var motherHeight_beforeAdjust = parseFloat(computedStyleOf_MoterElement.getPropertyValue("height"));
        var motherWidth_beforeAdjust = parseFloat(computedStyleOf_MoterElement.getPropertyValue("width"));
        
        //apply styles from <SVGTextElement>------------------------------------------------------------------------------------
        var $3SVGnodeElem_text = bindedData.$3bindedSVGElement.select("text");
        
        // transformを取得
        var attrTransformStr = bindedData.$3bindedSVGElement.attr("transform");
        if(attrTransformStr === null) attrTransformStr = "";
        var transformObj = getTransformObj(attrTransformStr);

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
        if(pixcelNumberRegex.test(textareaStyle_fontSize)){ // `0.0px`形式の場合
            textareaStyle_fontSize = parseFloat(textareaStyle_fontSize);

        }else{ // `0.0px`形式に設定できていない場合
               // 指数表記になるような極端な数値も、このルートに入る

            console.warn("Cannot calculate pxcel size of Browser applied font-size." +
                        "browser applied font-size:\`" + textareaStyle_fontSize + "\`.");
            
            textareaStyle_fontSize = 11; //`11px`で強行
        }
        textareaStyle_fontSize = textareaStyle_fontSize * transformObj.scale + "px";

        //<textarea>表示の為のtop位置を算出
        var halfLeading = (parseFloat(textareaStyle_fontSize) * (valOfLineHightInText - 1.0)) / 2;
        var pxNumOfTop = (parseFloat($3SVGnodeElem_text.attr("y")) * transformObj.scale + transformObj.translates.y)
                         - getPxDistanceOf_textBeforeEdge_baseline(textareaStyle_fontSize, textareaStyle_fontFamily, $3motherElement.node())
                         - halfLeading;
        
        //font-weightの取得
        var textareaStyle_fontWeight = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-weight");

        //font-styleの取得
        var textareaStyle_fontStyle = computedStyleOf_SVGnodeElem_text.getPropertyValue("font-style");

        //text-decorationの取得
        var textareaStyle_textDecoration = computedStyleOf_SVGnodeElem_text.getPropertyValue("text-decoration");

        //文字色の取得
        var textareaStyle_color = computedStyleOf_SVGnodeElem_text.getPropertyValue("fill");

        $3textareaElem.style("text-align", textareaStyle_textAlign)
            .style("top", pxNumOfTop + "px")
            .style("font-family", textareaStyle_fontFamily)
            .style("font-size", textareaStyle_fontSize)
            .style("font-weight",textareaStyle_fontWeight)
            .style("font-style",textareaStyle_fontStyle)
            .style("text-decoration",textareaStyle_textDecoration)
            .style("color", textareaStyle_color);
        //-----------------------------------------------------------------------------------/apply styles from <SVGTextElement>

        //adjust size------------------------------------------------------------------------------------
        var textareaElem = $3textareaElem.node();
        
        var marginWidthForCaret = parseFloat($3textareaElem.style("font-size")) / 2 * transformObj.scale;
        var numOfLines = textareaElem.value.split(/\n/).length;
        $3textareaElem.style("width", ($3SVGnodeElem_text.node().getBBox().width * transformObj.scale + marginWidthForCaret) + "px");
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
        var pxNumOfLeft = parseFloat($3SVGnodeElem_text.attr("x")) * transformObj.scale + transformObj.translates.x;
        switch($3textareaElem.style("text-align")){
            case "left":
            {
                //nothing to do
            }
            break;

            case "center":
            {
                pxNumOfLeft = pxNumOfLeft - (parseFloat($3textareaElem.style("width")) / 2);
            }
            break;

            case "right":
            {
                pxNumOfLeft = pxNumOfLeft - parseFloat($3textareaElem.style("width"));
            }
            break;

            default:
            break; //nothing to do
        }
        $3textareaElem.style("left", pxNumOfLeft + "px");

        var pxNumOfHeight = parseFloat($3textareaElem.style("height"));
        var pxNumOfWidth = parseFloat($3textareaElem.style("width"));
        
        //heightがmotherElementからはみ出ていた場合
        if((pxNumOfTop + pxNumOfHeight) > motherHeight_beforeAdjust){
            var fixedHeight = pxNumOfHeight - ((pxNumOfTop + pxNumOfHeight) - motherHeight_beforeAdjust);
            fixedHeight = ((fixedHeight < 0)? 0 : fixedHeight);
            $3textareaElem.style("height", fixedHeight + "px");
        }

        //widthがmotherElementからはみ出ていた場合
        if((pxNumOfLeft + pxNumOfWidth) > motherWidth_beforeAdjust){
            var fixedWidth = pxNumOfWidth - ((pxNumOfLeft + pxNumOfWidth) - motherWidth_beforeAdjust);
            fixedWidth = ((fixedWidth < 0)? 0 : fixedWidth);
            $3textareaElem.style("width", fixedWidth + "px");
        }
        
        
        //-----------------------------------------------------------------------------------/adjust size

    }

    //
    // text タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_text(arrNameShouldBeStored, structureArr){

        var editingDataArr = [];
        var bufTotalReport;
        clearBufTotalReport();

        //指定 Data に対する<textarea>要素を作る
        this.append = function(bindedData){

            //重複チェック
            for(var i = 0 ; i < editingDataArr.length ; i++){
                var specifiedKey = editingDataArr[i].bindedData.key;
                if( specifiedKey == bindedData.key){ //すでに登録済みの場合
                    console.warn("specified data is already registered a <textarea> element. key:\`" + specifiedKey + "\`.");
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
                .style("width", 0)
                .style("height", 0)
                .classed(getUniqueClassName(structureArr.join('_')), true)
                .classed("mousetrap",true)
                .property("value", textareaValue)
                .attr("wrap","off");
            
            var textareaElem = $3textareaElem.node();
            var keyDownInvoked = false;
            
            adjustTextarea(bindedData, $3textareaElem); //追加した<textarea>の表示調整
            
            var appendThisObj = {bindedData: bindedData,
                                 $3textareaElem: $3textareaElem};
            
            editingDataArr.push(appendThisObj); //編集対象Nodeとして保存

            $3textareaElem.node().onkeydown = function(){
                keyDownInvoked = true;
            }

            //<textarea>内のキータイプイベント
            $3textareaElem.node().oninput = function(){
                if(keyDownInvoked){
                    //SVGNodeへの反映&<textarea>調整
                    renderAndMergeBufTotalReport($3textareaElem.node().value);
                    adjustEditors($3textareaElem);
                
                }else{
                    //キーボードショートカットを使用してNode追加した場合は、
                    //押下したショートカットキーによってoninputイベントが発火してしまうことを防ぐ
                    $3textareaElem.attr("value", textareaValue); //初期状態に戻す
                }
                
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

            $3textareaElem.node().onfocus = function(){
                // console.log("onfocus");
                nowTyping = true;
            }

            //<textarea>内からフォーカスが外れたイベント
            $3textareaElem.node().onblur = function(){
                // console.log("onblur");
                nowTyping = false;
                comfirmBufTotalReport(); //Bufferの確定
            }

            //確定イベント
            Mousetrap(textareaElem).bind(keySettings.submitEditingTextTypeSVGNode, function(e){
                comfirmBufTotalReport(); //Bufferの確定

                exitEditing(); //編集モードの終了

                var uniqueDataKeyName = makeUniqueKey(bindedData.key, isReservedDataKey);

                var uniqueLinkKeyName;
                if(dataset.links.length == 0){
                    uniqueLinkKeyName = "0";
                }else{
                    uniqueLinkKeyName = dataset.links[dataset.links.length-1].key;
                    uniqueLinkKeyName = makeUniqueKey(uniqueLinkKeyName, isReservedLinkKey);
                }

                var dropToHereDY = linkDistance*0.6;
                var dropToHereX = bindedData.coordinate.x;
                var dropToHereY = bindedData.coordinate.y + dropToHereDY;

                //x座標が近すぎると横方向に散らばらないので、回避する
                for(var i = 0 ; i < dataset.datas.length ; i++){

                    var oneData = dataset.datas[i];
                    
                    if( (Math.abs(dropToHereX - oneData.coordinate.x) < 1) &&     //x座標が近すぎる
                        ((dropToHereY - dropToHereDY) < oneData.coordinate.y) &&  //y座標が (-linkDistance) < (linkDistance*2)
                        (oneData.coordinate.y < (dropToHereY + dropToHereDY*2))){ 

                        dropToHereX += 1;
                        break;
                    }
                }

                var appendingTotalReport = appendNodes({
                    datas:[
                        {
                            key:uniqueDataKeyName,
                            coordinate:{
                                x:dropToHereX,
                                y:dropToHereY
                            },
                            type:"text",
                            text: {
                                text_content: ""
                            }
                        }
                    ],
                    links:[
                        {
                            key:uniqueLinkKeyName,
                            type:defaultLinkhape,
                            source:bindedData.key,
                            target:uniqueDataKeyName
                        }
                    ]
                });
                
                historyManager.appendHistory(appendingTotalReport);
                var appendedData =  getBindedDataFromKey(appendingTotalReport.reportsArr.datas[0].key);
                call_editSVGNode(appendedData);

                //追加した data の画面範囲内チェック
                viewPortCheck(appendedData);
                
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
                historyManager.applyPrevioursObj(bufTotalReport); //元に戻す
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
            comfirmBufTotalReport(); //Bufferの確定
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
                overWriteScceededTransaction(totalReport, bufTotalReport, arrNameShouldBeStored);
            }
        }

        //バッファに積んだ Rendering Report を 確定させる
        function comfirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                historyManager.appendHistory(bufTotalReport);
                clearBufTotalReport();
            }
        }

        function clearBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         // historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
        }
    }

    //
    // <input type="text"> タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_textInput($inputElem, $defaultButtonElem, $expMsgElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport; //編集中に保存する Buffer
        var initExpMessage = null;
        var lastAppliedStr = "";    // confirm 時に<input>要素に適用する文字列
        var propertyEditingBehavor_setAsdefault;

        //initialize
        initializeBufTotalReport();

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     arrNameShouldBeStored,
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
                overWriteScceededTransaction(totalReport, bufTotalReport, arrNameShouldBeStored);

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
                historyManager.applyPrevioursObj(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                initializeBufTotalReport(); //バッファ初期化
                $expMsgElem.text(initExpMessage);
                initExpMessage = null;
            }
            propertyEditingBehavor_setAsdefault.cancel();
        }

        //編集を確定する
        this.confirm = function(){
            confirmBufTotalReport();
            propertyEditingBehavor_setAsdefault.confirm();
        }

        //Buffer初期化
        function initializeBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         //    historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
        }

        //バッファに積んだ Rendering Report を 確定させる
        function confirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                historyManager.appendHistory(bufTotalReport);
                initializeBufTotalReport(); //ログ用バッファ初期化

            }
            $inputElem.val(lastAppliedStr); //最後に反映したtextで<input>要素を更新
            initExpMessage = null;
        }
    }

    //
    // <input type="number"> タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_numberInput($inputElem, $defaultButtonElem, $expMsgElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport; //編集中に保存する Buffer
        var initExpMessage = null;
        var lastAppliedStr = "";    // confirm 時に<input>要素に適用する文字列
        var propertyEditingBehavor_setAsdefault;

        //initialize
        initializeBufTotalReport();

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     arrNameShouldBeStored,
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
                overWriteScceededTransaction(totalReport, bufTotalReport, arrNameShouldBeStored);

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
                historyManager.applyPrevioursObj(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                initializeBufTotalReport(); //バッファ初期化
                $expMsgElem.text(initExpMessage);
                initExpMessage = null;
            }
            propertyEditingBehavor_setAsdefault.cancel();
        }

        //編集を確定する
        this.confirm = function(){
            confirmBufTotalReport();
            propertyEditingBehavor_setAsdefault.confirm();
        }

        //Buffer初期化
        function initializeBufTotalReport(){
            bufTotalReport = {};
            bufTotalReport.type = 'change';
            bufTotalReport.allOK = false; 
            bufTotalReport.allNG = true; // <- falseとなった場合は、
                                         //    historyに残すべきTransactionが少なくとも1件以上存在する事を表す
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
        }

        //バッファに積んだ Rendering Report を 確定させる
        function confirmBufTotalReport(){
            if(!bufTotalReport.allNG){ //ログに記録するべきレポートが存在する場合
                historyManager.appendHistory(bufTotalReport);
                initializeBufTotalReport(); //ログ用バッファ初期化
            }
            $inputElem.val(lastAppliedStr); //最後に反映したtextで<input>要素を更新
            initExpMessage = null;
        }
    }
    
    //
    // Radio Buttons タイプ の Property Editor の Behavor
    //
    function propertyEditorBehavor_radioButtons(elemAndValArr, $defaultButtonElem, $expMsgElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){

        var beforeExpMessage = "";
        var beforePreviewingVal = "";
        var $previewingElement = null;
        var bufTotalReport = null; //Rendering Report 用バッファ
        var propertyEditingBehavor_setAsdefault;

        var invokedStyle = "";
        
        var mouseEnterdTime = 0;
        var mouseMovedTime = 0;
        var clickedTime = 0;

        //Default化ボタンの登録
        propertyEditingBehavor_setAsdefault = new propertyEditorBehavor_setAsDefault($defaultButtonElem,
                                                                                     arrNameShouldBeStored,
                                                                                     structureArr,
                                                                                     callbackBeforePreview,
                                                                                     adjustPropertyEditConsole);

        //各Elementに対するBehavor登録
        for(var itr = 0 ; itr < elemAndValArr.length ; itr++){

            //Mouse Enter Event
            elemAndValArr[itr].$elem.mouseenter(elemAndValArr[itr],function(event){

                if(!($(this).prop("disabled"))){ //プロパティエディタが有効の場合

                    checkInit(event.data);
                    mouseEnterdTime++;
                }
            });

            //Mouse Move Event
            elemAndValArr[itr].$elem.mousemove(elemAndValArr[itr],function(event){

                if(!($(this).prop("disabled"))){ //プロパティエディタが有効の場合

                    checkInit(event.data);

                    if(mouseEnterdTime > 0 && (!isAnimatingPropertyEditConsoleElement)){
                        mouseMovedTime++; //mouseEnterの後 かつ、 アニメーション中でないと、カウントアップしない
                    }

                    if(mouseMovedTime == 1){ //最初のmouse move event の場合
                        startPreview(event.data);
                    }
                }
            });

            // Mouse Click Event
            elemAndValArr[itr].$elem.click(elemAndValArr[itr],function(event){
                
                if(!($(this).prop("disabled"))){ //プロパティエディタが有効の場合

                    checkInit(event.data);

                    if(!isAnimatingPropertyEditConsoleElement){ //アニメーション中はカウントアップしない
                        clickedTime++;
                    }

                    if(clickedTime == 1){
                        if(mouseMovedTime == 0){ //mouse move せずに click した場合
                            startPreview(event.data);
                        }
                        confirmPreview();
                    }
                }
            });
            
            // Mouse Leave Event
            elemAndValArr[itr].$elem.mouseleave(elemAndValArr[itr],function(event){

                if(!($(this).prop("disabled"))){ //プロパティエディタが有効の場合
                    initUI();
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

                    if(valOfNode == 'none'){
                        valOfNode = null;
                    }

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
            cancelPreview();
            // mouseEnterdTime = 0; //<- enterd time はクリアしない
            mouseMovedTime = 0;
            clickedTime = 0;
            
            propertyEditingBehavor_setAsdefault.cancel();
        }

        this.confirm = function(){
            confirmPreview();
            propertyEditingBehavor_setAsdefault.confirm();
        }

        function checkInit(invokedElemAndValObj){
            if(invokedElemAndValObj.useThisVal != invokedStyle){
                initUI();
                invokedStyle = invokedElemAndValObj.useThisVal;
            }
        }

        function initUI(){
            cancelPreview();
            mouseEnterdTime = 0;
            mouseMovedTime = 0;
            clickedTime = 0;
        }

        function startPreview(elemAndValObj){

            if(bufTotalReport === null){ //preview していない場合

                //選択済み style の算出
                var valAlreadySelected = "";
                for(var i = 0 ; i < elemAndValArr.length ; i++){
                    if(elemAndValArr[i].$elem.hasClass(className_nodeIsSelected)){ //選択状態の場合
                        valAlreadySelected = elemAndValArr[i].useThisVal;
                        break;
                    }
                }

                if(valAlreadySelected != elemAndValObj.useThisVal){ //選択済み style と異なる style を指定されている場合
                    
                    callbackBeforePreview();

                    var toRenderObj = makeNestedObj(elemAndValObj.useThisVal, structureArr);

                    beforeExpMessage = $expMsgElem.text();
                    bufTotalReport = fireEvent_PropertyEditConsole_rerender(toRenderObj);

                    callbackWhenEventDone();

                    bufTotalReport.type = 'change';
                    bufTotalReport.message = structureArr.join("/") + ":" + elemAndValObj.useThisVal;

                    //対応 element を選択状態にする
                    beforePreviewingVal = valAlreadySelected; //何も選択されていなかった場合は、""が格納される
                    $previewingElement = elemAndValObj.$elem;
                    for(var i = 0 ; i < elemAndValArr.length ; i++){ // 対応 element 以外は非選択にする
                        elemAndValArr[i].$elem.removeClass(className_nodeIsSelected); //選択解除
                    }
                    elemAndValObj.$elem.addClass(className_nodeIsSelected); //対応 element を選択状態にする

                    if(elemAndValObj.useThisVal === null){ //削除指定の場合
                        $expMsgElem.text("");

                    }else{
                        if(bufTotalReport.allOK){ //適用全部成功の場合
                            $expMsgElem.text("explicit");
                        
                        }else{ //適用一部失敗の場合
                            $expMsgElem.text("explicit (some part)");
                            //note ロールバックは不要
                        }
                    }
                }
            }
        }

        function confirmPreview(){

            if(bufTotalReport !== null){ //previewしている場合
                historyManager.appendHistory(bufTotalReport);
                bufTotalReport = null;
            }
        }

        function cancelPreview(){
            
            if(bufTotalReport !== null){ //previewしている場合
                
                historyManager.applyPrevioursObj(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                
                $previewingElement.removeClass(className_nodeIsSelected); //選択解除

                //Preview 開始前の時の選択済み要素を選択し直す
                if(beforePreviewingVal != ""){
                    var $toSelectElem = get$elemByVal(beforePreviewingVal); //property editor要素を取得
                    if(typeof $toSelectElem != 'undefined'){ //選択対象要素がある場合
                        $toSelectElem.addClass(className_nodeIsSelected); //選択状態にする
                    }
                }

                $expMsgElem.text(beforeExpMessage);
                
                bufTotalReport = null;
            }
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
    function propertyEditorBehavor_fill($inputElem, $pickerElem, $defaultButtonElem, $expMsgElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){

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
                                                                                     arrNameShouldBeStored,
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

            propertyEditingBehavor_setAsdefault.cancel();
        }

        //編集を確定する
        this.confirm = function(){
            confirmBufTotalReport(); //バッファに積んだ Rendering Report を 確定させる

            if(isColorpickerShowed()){ //colorpicker が表示中だった場合
                changed = true;
                $pickerElem.spectrum("hide"); //colorpickerをcancelする
                
            }

            propertyEditingBehavor_setAsdefault.confirm();
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
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
        }

        //Buffer初期化 & 表示を元に戻す
        function clearBuf(){
            if(!bufTotalReport.allNG){ //成功したRenderingReportが存在する場合
                historyManager.applyPrevioursObj(bufTotalReport); //元に戻す
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
                overWriteScceededTransaction(totalReport, bufTotalReport, arrNameShouldBeStored);

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
                historyManager.appendHistory(bufTotalReport);
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
    function propertyEditorBehavor_setAsDefault($buttunElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport = null; //Rendering Report 用バッファ
        var toRenderObj;
        var messageTitle = "";

        var mouseEnterdTime = 0;
        var mouseMovedTime = 0;
        var clickedTime = 0;
        
        //toRenderObjの作成
        if(typeof structureArr == 'undefined'){ //'undefined'の場合は全て削除する

            if(arrNameShouldBeStored == 'datas'){ //datas[]用のデフォルト指定オブジェクトの場合
                toRenderObj = makeSetDafaultObj();
                messageTitle = "All Property of data:defalt"
            
            }else{ //links[]用のデフォルト指定オブジェクトの場合
                toRenderObj = makeSetDafaultObj_forLink();
                messageTitle = "All Property of link:defalt"

            }

        }else{
            toRenderObj = makeNestedObj(null, structureArr);
            messageTitle = structureArr.join("/") + ":default";
        }
        
        // Mouse Enter Event
        $buttunElem.mouseenter(function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                mouseEnterdTime++;
            }
        });

        // tab key で enter した場合
        $buttunElem.get(0).onfocus = function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                startPreview();
            }
        }

        // Mouse Move event
        $buttunElem.mousemove(function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                
                if(mouseEnterdTime > 0 && (!isAnimatingPropertyEditConsoleElement)){
                    mouseMovedTime++; //mouseEnterの後 かつ、 アニメーション中でないと、カウントアップしない
                }

                if(mouseMovedTime == 1){ //最初のmouse move event の場合
                    startPreview();
                }
            }
        });

        // Mouse Click Event
        $buttunElem.click(function(){

            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合

                if(!isAnimatingPropertyEditConsoleElement){ //アニメーション中はカウントアップしない
                    clickedTime++;
                }
                if(clickedTime == 1){
                    if(mouseMovedTime == 0){ //mouse move せずに click した場合
                        startPreview();
                    }
                    confirmPreview();
                }
            }
        });

        // Mouse Leave Event
        $buttunElem.mouseleave(function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                cancelPreview();
                mouseEnterdTime = 0;
                mouseMovedTime = 0;
                clickedTime = 0;
            }
        });

        // tab key で leave した場合
        $buttunElem.get(0).onblur = function(){
            if(!($buttunElem.prop("disabled"))){ //ボタンが有効の場合
                cancelPreview();
                // mouseEnterdTime = 0; //<- enterd time はクリアしない
                mouseMovedTime = 0;
                clickedTime = 0;
            }
        }

        //ボタンを無効にする
        this.disable = function(){
            $buttunElem.prop("disabled", true);
        }

        //ボタンを有効にする
        this.enable = function(){
            $buttunElem.prop("disabled", false);
        }

        this.cancel = function(){
            cancelPreview();
            // mouseEnterdTime = 0; //<- enterd time はクリアしない
            mouseMovedTime = 0;
            clickedTime = 0;
        }

        this.confirm = function(){
            confirmPreview();
        }

        function startPreview(){
            if(bufTotalReport === null){ //preview中でない場合
                callbackBeforePreview();
                bufTotalReport = fireEvent_PropertyEditConsole_rerender(toRenderObj); 
                callbackWhenEventDone();
                bufTotalReport.type = 'change';
                bufTotalReport.message = messageTitle;
                $buttunElem.addClass(className_nodeIsSelected);
            }
        }

        function cancelPreview(){
            if(bufTotalReport !== null){ //preview中の場合
                historyManager.applyPrevioursObj(bufTotalReport); //元に戻す
                callbackWhenEventDone();
                bufTotalReport = null;
            }
            $buttunElem.removeClass(className_nodeIsSelected);
        }

        function confirmPreview(){
            if(bufTotalReport !== null){ //preview中の場合
                historyManager.appendHistory(bufTotalReport);
                bufTotalReport = null;
            }
        }
    }

    //
    // caution renderringReport.allNG = falseな時だけコールする
    //
    function overWriteScceededTransaction(fromThisTransaction, toThisTransaction, arrNameShouldBeStored){

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
        for(var i_f = 0 ; i_f < fromThisTransaction.reportsArr[arrNameShouldBeStored].length ; i_f++){

            if(!fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].allNG){ //property全て失敗でなければ
                
                //マージ対象ノード検索ループ
                var i_t = 0;
                
                for( ; i_t < toThisTransaction.reportsArr[arrNameShouldBeStored].length ; i_t++){

                    //マージ対象のノードkeyが見つかった場合
                    if(toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].key == fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].key){
                        break;
                    }
                }

                if(i_t == toThisTransaction.reportsArr[arrNameShouldBeStored].length){ //マージ対象のノードkeyが見つからなかった場合
                    toThisTransaction.reportsArr[arrNameShouldBeStored].push({}); //空のオブジェクトを追加する
                    toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].key = fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].key;

                    //allOK
                    toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].allOK = fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].allOK;
                    //allNG
                    toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].allNG = false;
                    //PrevObj
                    toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].PrevObj = {};
                    mergeObj(fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].PrevObj, toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].PrevObj,false);
                    //RenderedObj
                    toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].RenderedObj = {};
                    //FailuredMessages
                    toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].FailuredMessages = {};

                }else{ //マージ対象のノードkeyが見つかった場合

                    //allOK
                    if(!fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].allOK){ //一部失敗がある場合
                        toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].allOK = false;
                    }
                    
                    //allNGは不要
                    
                    //PrevObj
                    mergeObj(fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].PrevObj, toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].PrevObj,true); //toThisTransactionに存在しない時だけmerge
                    
                }
                
                //RenderedObj
                mergeObj(fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].RenderedObj, toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].RenderedObj,false);
                
                //FailuredMessages
                mergeObj(fromThisTransaction.reportsArr[arrNameShouldBeStored][i_f].FailuredMessages, toThisTransaction.reportsArr[arrNameShouldBeStored][i_t].FailuredMessages,false);
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
    //SVG(Link)に適用されたスタイルを抽出する
    //抽出成功の場合は、true,
    //失敗の場合はfalseを返却する
    //
    function getComputedStyleOfLink(bindedData, computedStyleObj, explicitnessObj){

        
        //type指定チェック
        if(typeof (bindedData.type) == 'undefined'){
            console.warn("\"type\" property is not specified");
            return false; //存在しない場合場合は終了する
        }

        //初期化
        computedStyleObj.key = bindedData.key;
        explicitnessObj.key = true; //常に明示的とする
        
        switch(bindedData.type){
            case "line":
            {
                computedStyleObj.type = "line";
                computedStyleObj.line = {};
                explicitnessObj.type = true; //常に明示的な指定とする
                explicitnessObj.line = {};

                getComputedStyleOfLineTypeLink(bindedData, computedStyleObj, explicitnessObj);
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

    function getComputedStyleOfLineTypeLink(bindedData, computedStyleObj, explicitnessObj){
        
        var $3SVGnodeElem_line = bindedData.$3bindedSVGLinkElement.select("line");
        var computedStyleOf_SVGnodeElem_line = window.getComputedStyle($3SVGnodeElem_line.node());

        var propNameL1 = 'line';
        var propNameL2;
        
        //stroke
        propNameL2 = 'stroke';
        computedStyleObj[propNameL1][propNameL2] = computedStyleOf_SVGnodeElem_line.getPropertyValue('stroke');
        explicitnessObj[propNameL1][propNameL2] = (typeof bindedData[propNameL1][propNameL2] != 'undefined');

        //stroke_width
        propNameL2 = 'stroke_width';
        computedStyleObj[propNameL1][propNameL2] = parseFloat(computedStyleOf_SVGnodeElem_line.getPropertyValue("stroke-width"));
        explicitnessObj[propNameL1][propNameL2] = (typeof bindedData[propNameL1][propNameL2] != 'undefined');

        //marker_end
        propNameL2 = 'marker_end';
        var computedMarker_end = computedStyleOf_SVGnodeElem_line.getPropertyValue('marker-end');
        if(computedMarker_end != 'none'){
            var matchedStrs = computedMarker_end.match(/(url\("#)(.*)("\))/);
            computedMarker_end = matchedStrs[2]; // `url#\"` と `\")` を取り除いた文字列にする
        }
        computedStyleObj[propNameL1][propNameL2] = computedMarker_end;
        explicitnessObj[propNameL1][propNameL2] = (typeof bindedData[propNameL1][propNameL2] != 'undefined');

        //stroke_dasharray
        propNameL2 = 'stroke_dasharray';
        var computedStrokeDashArray = computedStyleOf_SVGnodeElem_line.getPropertyValue("stroke-dasharray");
        computedStrokeDashArray = computedStrokeDashArray.replace(/px/g, "");
        computedStrokeDashArray = computedStrokeDashArray.replace(/ /g, ""); //"px"とスペースは無視する
        computedStyleObj[propNameL1][propNameL2] = computedStrokeDashArray;
        explicitnessObj[propNameL1][propNameL2] = (typeof bindedData[propNameL1][propNameL2] != 'undefined');
    }

    function getTransformObj(attrTransformStr){

        var transformObj = {
            translates: {x:0, y:0},
            scale: 1
        };
        
        //translateの取得
        var matchedTranslate = attrTransformStr.match(/translate\((.+?)\)/);
        if(matchedTranslate !== null){
            var tmp = matchedTranslate[1].split(/ +/);
            var splittedMatchedTranslate = [];
            for(var i = 0 ; i < tmp.length ; i++){
                splittedMatchedTranslate = splittedMatchedTranslate.concat(tmp[i].split(/, */));
            }
            transformObj.translates.x = parseFloat(splittedMatchedTranslate[0]);
            if(splittedMatchedTranslate.length >= 2){
                transformObj.translates.y = parseFloat(splittedMatchedTranslate[1]);
            }
        }

        //scaleの取得
        var matchedScale = attrTransformStr.match(/scale\((.+?)\)/);
        if(matchedScale !== null){
            transformObj.scale = parseFloat(matchedScale[1]);
        }

        return transformObj;
    }

    //画面表示領域の四角の座標を、svg 空間内座標に換算して返す
    function getCoordinatesOfViewPort(){

        var transformObj = {
            translates: {x:0, y:0},
            scale: 1
        };

        if(lastTransFormObj_d3style !== null){
            transformObj.translates.x = lastTransFormObj_d3style.x;
            transformObj.translates.y = lastTransFormObj_d3style.y;
            transformObj.scale = lastTransFormObj_d3style.k;
        }
        
        var viewPortObj = {
            aboveLeft:{
                x: (0 - transformObj.translates.x) / transformObj.scale,
                y: (0 - transformObj.translates.y) / transformObj.scale
            },
            aboveRight:{},
            belowLeft:{},
            belowRight:{
                x: ($3motherElement.node().offsetWidth - transformObj.translates.x) / transformObj.scale,
                y: ($3motherElement.node().offsetHeight - transformObj.translates.y) / transformObj.scale
            }
        }

        viewPortObj.aboveRight.x = viewPortObj.belowRight.x;
        viewPortObj.aboveRight.y = viewPortObj.aboveLeft.y;

        viewPortObj.belowLeft.x = viewPortObj.aboveLeft.x;
        viewPortObj.belowLeft.y = viewPortObj.belowRight.y;

        return viewPortObj;
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

    //Unique な key を生成する
    function makeUniqueKey(baseKeyName, reservedChecker){
        
        var incrementedIntNum;
        var stringInFront;
        var uniqueKey;

        //ieee754 の 倍精度浮動小数点数 で正確に表せる整数値(より1桁少なく)まで取り出す
        var intNumPart = baseKeyName.match(/(\d){1,15}$/);

        if(intNumPart === null){ //数値部分が存在しない場合
            stringInFront = baseKeyName + "_";
            intNumPart = 2;
        
        }else{ //数値部分が存在する場合
            stringInFront = baseKeyName.substr(0, baseKeyName.length - intNumPart[0].length); //マッチした部分以外を抽出
            incrementedIntNum = parseInt(intNumPart) + 1;
            if(incrementedIntNum.toString().length > 15){
                stringInFront = baseKeyName + "_";
                intNumPart = 2;
            }else{
                intNumPart = incrementedIntNum;
            }
        }

        // Unique Key 生成
        while(true){
            var tryThisKeyName = stringInFront + intNumPart.toString();
            
            if(!(reservedChecker(tryThisKeyName)) ){ //重複がなかった場合
                uniqueKey = tryThisKeyName;
                break;
            }

            incrementedIntNum = intNumPart + 1;
            if(incrementedIntNum.toString().length > 15){
                stringInFront = stringInFront + intNumPart.toString() + "_";
                intNumPart = 2;
            }else{
                intNumPart = incrementedIntNum;
            }
        }

        return uniqueKey;
    }

    //指定key が dataset.datas[]内か、
    //transactionHistory[]内に無いかどうか確認する
    function isReservedDataKey(checkThisKey){

        if(typeof getBindedDataFromKey(checkThisKey) != 'undefined'){ //dataset.datas[]内で使用している場合
            return true;
        
        }else{ //dataset.datas[]内では使用していない場合

            //history 内に使用した key はないかどうか確認
            for(var i = 0 ; i < transactionHistory.length ; i++){
                if(transactionHistory[i].type == 'append' ||
                    transactionHistory[i].type == 'delete'){

                    var reports = transactionHistory[i].reportsArr.datas;

                    for(var j = 0 ; j < reports.length ; j++){
                        if(reports[j].key == checkThisKey){ //key が使用済みの場合
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    //指定key が dataset.datas[]内か、
    //transactionHistory[]内に無いかどうか確認する
    function isReservedLinkKey(checkThisKey){

        if(typeof getBindedLinkDataFromKey(checkThisKey) != 'undefined'){ //dataset.links[]内で使用しているの場合
            return true;
        
        }else{ //dataset.datas[]内では使用していない場合

            //history 内に使用した key はないかどうか確認
            for(var i = 0 ; i < transactionHistory.length ; i++){
                if(transactionHistory[i].type == 'append' ||
                    transactionHistory[i].type == 'delete'){

                    var reports = transactionHistory[i].reportsArr.links;

                    for(var j = 0 ; j < reports.length ; j++){
                        if(reports[j].key == checkThisKey){ //key が使用済みの場合
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    //
    //dataset.datas[]から特定キー番号のオブジェクトを返す
    //存在しない場合は、'undefined'を返す
    //
    function getBindedDataFromKey(findByThisKey){

        //引数チェック
        if(typeof findByThisKey != 'string'){
            console.warn("specified argument \`findByThisKey\` type is not \`string\`");
            return;
        }

        var bindedData;

        //検索ループ
        for(var i = 0 ; i <  dataset.datas.length ; i++){
            if(dataset.datas[i].key == findByThisKey){
                bindedData = dataset.datas[i];
                break;
            }
        }

        return bindedData;
    }

    //
    //dataset.datas[]から特定キー番号のオブジェクトを返す
    //存在しない場合は、'undefined'を返す
    //
    function getBindedLinkDataFromKey(findByThisKey){

        //引数チェック
        if(typeof findByThisKey != 'string'){
            console.warn("specified argument \`findByThisKey\` type is not \`string\`");
            return;
        }

        var bindedData;

        //検索ループ
        for(var i = 0 ; i <  dataset.links.length ; i++){
            if(dataset.links[i].key == findByThisKey){
                bindedData = dataset.links[i];
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

}
