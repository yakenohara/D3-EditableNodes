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
    var url_externalComponent = "assets/components/force-layout-memo_compo.html";

    //ファイル出力(Export)時に設定するファイル名
    var fileName_Export = "Nodes.json";

    // frameType 未指定時に設定する Default Shape
    var defaultTextFrameShape = "rect";

    // linkType 未指定時に設定する Default Shape
    var defaultLinkhape = "line";
    
    //frameとtext間のpadding
    var valOfpadding_frame_text = 5;
    
    //<text>要素内での行間 note:単位は[em]
    var valOfLineHightInText = 1.3;

    //全ての親となるDOM要素のID名
    var idName_superElement = "force-layout-memo";

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
    
    //todo localize
    dataset = { //Bind用Dataset
        datas:[],
        links:[]
    };
    transactionHistory = [];  //history

    var nowEditng = false;　      //Property Edit Console が起動中かどうか
    var editingNodeKeys = []; //Property Edit Console の 編集対象ノードのkey
    var editingLinkKeys = []; //Property Edit Console の 編集対象Linkのkey
    var lastSelectedData = null;　//最後に選択状態にしたNode    
    var pointingIndexOfHistory = -1;      //historyのどのindexが選択されているか
    
    var $3motherElement; //全てのもと
    var $3propertyEditConsoleElement;        //Property Edit Console (D3.js selection)
    var $propertyEditConsoleElement;         //Property Edit Console (jQuery selection)
    var $propertyEditConsoleElement_node;    //(For Node) Property Edit Console (jQuery selection)
    var $propertyEditConsoleElement_link;    //(For Link) Property Edit Console (jQuery selection)
    var $3transactionHistoryElement;         //Transaction History (D3.js selection)
    var $transactionHistoryElement;          //Transaction History (jQuery selection)
    var $3SVGDrawingAreaElement;             //描画用SVG領域 (D3.js selection)
    var $SVGDrawingAreaElement;              //描画用SVG領域 (jQuery selection)
    var $3svgNodesGroup;
    var $3svgNodes;
    var $3svgLinksGroup;
    var $3svgLinks;
    var $3selectionLayersGroup;
    var lastTransForm = null;

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
        this.confirm = function(){
            confirmPropertyEditors();
        }

        this.confirmLink = function(){
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
                        var appendingTotalReport = appendNodes(parsedObj);
                        
                        if(appendingTotalReport.allNG){ //有効なobjectが存在しなかった場合
                            console.error("\`" + nm + "\` has no available object.");
                        }else{
                            appendHistory(appendingTotalReport);
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
            for(var i = 0 ; i < dataset.datas.length ; i++){
                dataset.datas[i].$3bindedSelectionLayerSVGElement.style("visibility", "hidden")
                    .attr("data-selected", "false"); //選択解除
            }

            //linkすべてを選択解除する
            for(var i = 0 ; i < dataset.links.length ; i++){
                dataset.links[i].$3bindedSelectionLayerSVGElement.style("visibility", "hidden")
                    .attr("data-selected", "false"); //選択解除
            }

            lastSelectedData = null;
        }
    });

    // Node以外に対する right click event
    var clsNameForCntxtMenu = getUniqueClassName('context-menu-');
    $3SVGDrawingAreaElement.classed(clsNameForCntxtMenu, true);
    $.contextMenu({
        selector: '.' + clsNameForCntxtMenu,
        items: {
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
                        accesskey: 'a',
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
        callback: function(itemKey, opt){ //keyup event
            //DL確認画面終了後にhide出来ないことがあるので、先にhideする
            opt.$menu.trigger("contextmenu:hide");
            
            console.warn("Unkown Item selected. Itemkey:\`" + itemKey + "\`, DOM: ", opt.$trigger.get(0));
        }
    });

    // SVG領域の Zoom・Pan イベント
    $3SVGDrawingAreaElement.call(d3.zoom()
        .on("zoom", function(){
            lastTransForm = d3.event.transform; //最終状態を保存(Node Append/復活時に利用する)

            $3svgNodes.each(function(d, i){
                d.$3bindedSVGElement.attr("transform", lastTransForm);
                d.$3bindedSelectionLayerSVGElement.attr("transform", lastTransForm);
            });

            $3svgLinks.each(function(d, i){
                d.$3bindedSVGLinkElement.attr("transform", lastTransForm);
                d.$3bindedSelectionLayerSVGElement.attr("transform", lastTransForm);
            });

            if(nowEditng){
                adjustPropertyEditConsole(true); //Node個別編集機能のみadjustする(heavyすぎる為)
            }
        }))
        .on("dblclick.zoom", null); // <- dblclickによるNode編集イベントとの競合を回避する

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

    // Nodeに対する複数編集イベント
    Mousetrap.bind(keySettings.editSVGNodes, function(e){
        call_editSVGNodes(true);
        disablingKeyEvent(e); //ブラウザにキーイベントを渡さない
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
        appendingTotalReport.reportsArr = {};
        appendingTotalReport.reportsArr.datas = [];
        appendingTotalReport.reportsArr.links = [];

        var treatThisObjects = [];
        
        var convToAvoidDupliKeyDifi = {};

        var lastStrForLinkExistence = "_existInArg";

        //<key定義チェック>------------------------------------------------------------------

        
        var arrayCheckOK = true;
        var untreatedPropertyNames = Object.keys(appendThisObjArr); //未処理プロパティリスト

        isThisArray("datas");
        isThisArray("links");

        function isThisArray(objName){
            if(typeof appendThisObjArr[objName] != 'undefined'){ //定義がある場合
                if(!Array.isArray(appendThisObjArr[objName])){ //Arrayでない場合
                    console.warn("Obj \`" + objName + "\` is not Array");
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
        });

        if(!arrayCheckOK){ //datas or links が array型でない場合
            return appendingTotalReport; //allNGで返す
        }

        if(treatThisObjects.length == 0){ //有効なObjectが存在しない
            return appendingTotalReport; //allNGで返す
        }

        if(treatThisObjects.indexOf("datas") >= 0){ //"datas"定義が存在する場合
            
            //定義型チェックループ
            for(var i = 0 ; i < appendThisObjArr.datas.length ; i++){
                
                var typeOf_key = (typeof appendThisObjArr.datas[i].key);

                switch(typeOf_key){
                    case 'undefined':
                    {
                        appendThisObjArr.datas[i].key = i.toString();//appendThisObjArr.datas[]内のindex noをkeyとして使う
                    }
                    break;

                    case 'string':
                    {
                        //空文字回避
                        if(appendThisObjArr.datas[i].key == ""){
                            var empstr = "(EmptyString)";
                            console.warn("\`\`(empty string) is defined in datas[" + i + "\].key ." +
                                         " key:\`" + empstr + "\` will apply.");
                            appendThisObjArr.datas[i].key = empstr;
                        }
                    }
                    break;

                    case 'number':
                    {
                        appendThisObjArr.datas[i].key = appendThisObjArr.datas[i].key.toString(); //文字列型に変換
                    }
                    break;

                    default: //unknown な型の場合
                    {
                        console.warn("key \`" + appendThisObjArr.datas[i].key.toString() + "\` is defined as \`" + typeOf_key + "\` type. " +
                                     "key \`" + i.toString() + "\` will apply.");
                        appendThisObjArr.datas[i].key = i.toString();
                    }
                    break;
                }
            }

            //appendThisObjArr.datas[]内でkey重複チェック
            var duplicateKeysInArgDatas = false;
            for(var i = 0 ; i < appendThisObjArr.datas.length ; i++){
                for(var j = i+1 ; j < appendThisObjArr.datas.length ; j++ ){
                    var eye = appendThisObjArr.datas[i].key;
                    var jay = appendThisObjArr.datas[j].key;
                    if(eye == jay){ //key重複がある場合
                        console.error("Duplicate definition found in datas[" + i + "].key:\`" + eye + "\` and datas[" + j + "].key:\`" + jay + "\`");
                        duplicateKeysInArgDatas = true;
                    }
                }
            }
            if(duplicateKeysInArgDatas){ //key重複が1件以上見つかった場合
                return appendingTotalReport; //allNGで返す
            }
        }

        if(treatThisObjects.indexOf("links") >= 0){ //"links"定義が存在する場合

            //定義型チェックループ
            for(var i = 0 ; i < appendThisObjArr.links.length  ; i++){

                var typeOf_key = (typeof appendThisObjArr.links[i].key);

                switch(typeOf_key){
                    case 'undefined':
                    {
                        appendThisObjArr.links[i].key = i.toString();//appendThisObjArr.links[]内のindex noをkeyとして使う
                    }
                    break;

                    case 'string':
                    {
                        //空文字回避
                        if(appendThisObjArr.links[i].key == ""){
                            var empstr = "(EmptyString)";
                            console.warn("\`\`(empty string) is defined in links[" + i + "\].key ." +
                                         " key:\`" + empstr + "\` will apply.");
                            appendThisObjArr.links[i].key = empstr;
                        }
                    }
                    break;

                    case 'number':
                    {
                        appendThisObjArr.links[i].key = appendThisObjArr.links[i].key.toString(); //文字列型に変換
                    }
                    break;

                    default: //unknown な型の場合
                    {
                        console.warn("key \`" + appendThisObjArr.links[i].key.toString() + "\` is defined as \`" + typeOf_key + "\` type. " +
                                     "key \`" + i.toString() + "\` will apply.");
                        appendThisObjArr.links[i].key = i.toString();
                    }
                    break;
                }

                var sourceKeyNameIsDefinedInArgDatas = keyIsDefinedInArgDatas("source");
                var targetKeyNameIsDefinedInArgDatas = keyIsDefinedInArgDatas("target");

                function keyIsDefinedInArgDatas(propertyName){

                    var isDefined = true;
                    var typeOf_key = (typeof appendThisObjArr.links[i][propertyName]);

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
                                appendThisObjArr.links[i][propertyName] = appendThisObjArr.links[i][propertyName].toString(); //文字列型に変換
                            }

                            //指定キーがappendThisObjArr.datas[]内に存在するかどうかチェックする
                            var existencePropName = propertyName + lastStrForLinkExistence;
                            appendThisObjArr.links[i][existencePropName] = false;
                            if(typeof appendThisObjArr.datas != 'undefined'){
                                for(var j = 0 ; j < appendThisObjArr.datas.length ; j++){
                                    if(appendThisObjArr.datas[j].key == appendThisObjArr.links[i][propertyName]){ //キーが存在する場合
                                        appendThisObjArr.links[i][existencePropName] = true; //存在する事を記録
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

                if(appendThisObjArr.links[i].source == appendThisObjArr.links[i].target){ //source と target が同じ場合
                    console.warn("links[" + i.toString() + "] defines same \`source\`,/\`target\`:" + appendThisObjArr.links[i].source +
                                 "This link will be ignored.");

                    sourceKeyNameIsDefinedInArgDatas = false;
                }

                if((!sourceKeyNameIsDefinedInArgDatas) || (!targetKeyNameIsDefinedInArgDatas)){ //source or target の key 定義に誤りがあった場合
                    appendThisObjArr.links[i].keyDefTypeIsSafe = false;
                }else{
                    appendThisObjArr.links[i].keyDefTypeIsSafe = true;
                }
            }
        }
        //-----------------------------------------------------------------</key定義チェック>

        //Nodesの追加
        if(treatThisObjects.indexOf("datas") >= 0){ //"datas"定義が存在する場合

            //dataset.datas[]へ追加ループ
            for(var i = 0 ; i < appendThisObjArr.datas.length ; i++){

                //オブジェクトコピー
                var toAppendObj = {};
                mergeObj(appendThisObjArr.datas[i], toAppendObj, false);

                //key重複チェック
                if(typeof (getBindedDataFromKey(toAppendObj.key)) != 'undefined'){ //重複があった場合
                            
                    var uniqueKeyName = makeUniqueKey(toAppendObj.key, getBindedDataFromKey);

                    console.warn("datas[" + i + "\].key:\`" + appendThisObjArr.datas[i].key  + "\` is already used. " +
                                 "Unique key:\`" + uniqueKeyName + "\` will apply.");
                    convToAvoidDupliKeyDifi[toAppendObj.key] = uniqueKeyName; //key名変更を記録
                    toAppendObj.key = uniqueKeyName; //重複しないkeyで上書き
                    //note appendingTotalReport.AllOK は変更しない (NodeRenderingに失敗したわけではない為)
                        
                }

                dataset.datas.push(toAppendObj); //datas[]へ追加
            }

            //bind using D3.js
            $3svgNodes = $3svgNodesGroup.selectAll("g.node")
                .data(dataset.datas, function(d){return d.key});
                
            //描画 & リスナ登録
            $3svgNodes.enter()
                .append("g")
                .classed("node", true)
                .attr("transform", lastTransForm)
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

                    //
                    // SVGノードの単一選択イベント 
                    //
                    // note doubleclick時に2回呼ばれて不要なTogglingが発生するが、
                    //      .on('dblclick', function()~ によって強制的に選択状態にされる
                    //
                    d.$3bindedSVGElement.on('click', function(d){

                        //External Componentが未loadの場合はハジく
                        if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                        
                        exitEditing(); //編集モードの終了
                
                        if(!(d3.event.ctrlKey)){ //ctrl key 押下でない場合
                
                            //別ノードすべてを選択解除する
                            for(var i = 0 ; i < dataset.datas.length ; i++){
                                if(dataset.datas[i].key != d.key){ //自分のノードでない場合
                                    dataset.datas[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                                        .attr("data-selected", "false"); //選択解除
                                }
                            }

                            //Linkすべてを選択解除する
                            for(var i = 0 ; i < dataset.links.length ; i++){
                                dataset.links[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                                    .attr("data-selected", "false"); //選択解除
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
                                .attr("data-selected", "true"); //選択
                            
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
                        for(var i = 0 ; i < dataset.datas.length ; i++){
                            if(dataset.datas[i].key != d.key){ //自分のノードでない場合
                                dataset.datas[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden") //選択解除
                                    .attr("data-selected", "false"); //選択解除
                            
                            }else{ //自分のノードの場合
                                dataset.datas[i].$3bindedSelectionLayerSVGElement.style("visibility",null) //選択
                                    .attr("data-selected", "true"); //選択解除
                            }
                        }

                        //Linkすべてを選択解除する
                        for(var i = 0 ; i < dataset.links.length ; i++){
                            dataset.links[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                                .attr("data-selected", "false"); //選択解除
                        }
                        
                        editSVGNodes();
                        lastSelectedData = d; //最終選択Nodeの記憶
                        propertyEditorsManager.focus(lastSelectedData);
                
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
                                appendHistory(bufTotalReport);
                            }
                        })
                    );
                });

            //増えた<g>要素に合わせて$node selectionを再調整
            $3svgNodes = $3svgNodesGroup.selectAll("g.node");
        }

        //Linksの追加
        if(treatThisObjects.indexOf("links") >= 0){ //"links"定義が存在する場合

            var numOfAppeddedLink = 0;
            
            //dataset.links[]へ追加ループ
            for(var i = 0 ; i < appendThisObjArr.links.length ; i++){

                // source or target に指定したkey名定義は、型チェックOKだった場合
                if(appendThisObjArr.links[i].keyDefTypeIsSafe){

                    var toAppendObj = {};
                    mergeObj(appendThisObjArr.links[i], toAppendObj, false); //objectコピー

                    var sourceKeyIsExist = isExistKey("source");
                    var targetKeyIsExist = isExistKey("target");

                    //key名がdataset.datas[]内に存在するかどうかチェック
                    function isExistKey(propertyName){
                        
                        var existence = true;
                        var existencePropName = propertyName + lastStrForLinkExistence;
                        
                        delete toAppendObj.keyDefTypeIsSafe;
                        delete toAppendObj[existencePropName];

                        if(appendThisObjArr.links[i][existencePropName]){ //key名は appendThisObjArr.datas[] 内に存在する場合

                            //key変換チェック
                            if(typeof convToAvoidDupliKeyDifi[toAppendObj[propertyName]] != 'undefined'){ //source の key 名に変換があった場合
                                toAppendObj[propertyName] = convToAvoidDupliKeyDifi[toAppendObj[propertyName]]; //変換
                            }

                        }else{ //key名は appendThisObjArr.datas[] 内に存在しない場合

                            //key名存在チェック
                            var searchByThisKeyName = appendThisObjArr.links[i][propertyName];
                            if(typeof (getBindedDataFromKey(searchByThisKeyName)) == 'undefined'){ //keyが dataset.datas[]内に見つからない場合
                                console.warn("links[" + i + "]." + propertyName + "):\`" + searchByThisKeyName +
                                            "\` is not defined in any datas[].key . This link will be ignored.");
                                existence = false;
                            }
                        }
                        return existence;
                    }

                    if(sourceKeyIsExist && targetKeyIsExist){

                        //key重複チェック
                        if(typeof (getBindedLinkDataFromKey(toAppendObj.key)) != 'undefined'){ //重複があった場合
                            
                            var uniqueKeyName = makeUniqueKey(toAppendObj.key, getBindedLinkDataFromKey);

                            console.warn("links[" + i + "\].key:\`" + appendThisObjArr.links[i].key  + "\` is already used. " +
                                         "Unique key:\`" + uniqueKeyName + "\` will apply.");
                            toAppendObj.key = uniqueKeyName; //重複しないkeyで上書き
                            //note appendingTotalReport.AllOK は変更しない (NodeRenderingに失敗したわけではない為)
                                
                        }

                        dataset.links.push(toAppendObj); //dataset.links[]に追加
                        numOfAppeddedLink++;
                    }
                }
            }

            if(numOfAppeddedLink > 0){
                
                $3svgLinks = $3svgLinksGroup.selectAll("g.link")
                    .data(dataset.links, function(d){return d.key});
                    
                $3svgLinks.enter()
                    .append("g")
                    .classed("link", true)
                    .attr("transform", lastTransForm)
                    .each(function(d, i){
                        var bindedSVGLinkElement = this;
                        d.$3bindedSVGLinkElement = d3.select(bindedSVGLinkElement);

                        d.$3bindedSelectionLayerSVGElement = $3selectionLayersGroup.append("g")
                            .classed("selectionLayer",true)
                            .style("pointer-events", "none")
                            .style("visibility", "hidden")
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

                        d.$3bindedSVGLinkElement.on('click', function(d){

                            //External Componentが未loadの場合はハジく
                            if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                            
                            exitEditing(); //編集モードの終了
                    
                            if(!(d3.event.ctrlKey)){ //ctrl key 押下でない場合
                    
                                //別ノードすべてを選択解除する
                                for(var i = 0 ; i < dataset.datas.length ; i++){
                                    dataset.datas[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                                        .attr("data-selected", "false"); //選択解除
                                }

                                //別ノードすべてを選択解除する(links[])
                                for(var i = 0 ; i < dataset.links.length ; i++){
                                    if(dataset.links[i].key != d.key){ //自分のノードでない場合
                                        dataset.links[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden")
                                            .attr("data-selected", "false"); //選択解除
                                    }
                                }
                            }
                    
                            var isSelected = (d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true');
                    
                            //選択状態を切り替える
                            if(isSelected){ //選択状態の場合
                                d.$3bindedSelectionLayerSVGElement.style("visibility","hidden") //非表示にする
                                    .attr("data-selected", "false"); //選択解除
                    
                            }else{ //非選択状態の場合
                                d.$3bindedSelectionLayerSVGElement.style("visibility",null) //表示状態にする
                                    .attr("data-selected", "true"); //選択
                            }
                            lastSelectedData = null;
                        });

                        d.$3bindedSVGLinkElement.on('dblclick', function(d){

                            //External Componentが未loadの場合はハジく
                            if(!(checkSucceededLoadOf_ExternalComponent())){return;}
                            
                            if(nowEditng){ // 編集中の場合
                                        // -> 発生し得ないルート
                                        //    (直前に呼ばれる単一選択イベントによって、編集中が解除される為)
                    
                                exitEditing(); //編集モードの終了
                            
                            }
                    
                            //Nodeすべてを選択解除する
                            for(var i = 0 ; i < dataset.datas.length ; i++){
                                dataset.datas[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden") //選択解除
                                    .attr("data-selected", "false"); //選択解除
                            }

                            //別Linkすべてを選択解除して、自分のLinkのみ選択状態にする
                            for(var i = 0 ; i < dataset.links.length ; i++){
                                if(dataset.links[i].key != d.key){ //自分のノードでない場合
                                    dataset.links[i].$3bindedSelectionLayerSVGElement.style("visibility","hidden") //選択解除
                                        .attr("data-selected", "false"); //選択解除
                                
                                }else{ //自分のノードの場合
                                    dataset.links[i].$3bindedSelectionLayerSVGElement.style("visibility",null) //選択
                                        .attr("data-selected", "true"); //選択解除
                                }
                            }
                            lastSelectedData = null;
                            
                            editSVGNodes();
                        });
                    });

                //増えた<g>要素に合わせて$link selectionを再調整
                $3svgLinks = $3svgLinksGroup.selectAll("g.link")
                    .data(dataset.links);
            
            }else{
                treatThisObjects.splice(treatThisObjects.indexOf("links"), 1); //append処理対象から除外
            }
        }

        if(treatThisObjects.length > 0){ //datasetに対する要素追加があった場合

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

        }

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
        deletingTotalReport.reportsArr = {};
        deletingTotalReport.reportsArr.datas = [];
        deletingTotalReport.reportsArr.links = [];

        var numOfDeletedNodes = 0;
        var numOfDeletedLinks = 0;

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
            .force("link", d3.forceLink().id(function(d) { return d.key; }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(400, 400));

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
            .links(dataset.links);

        //<Coefficient settings for force simulation>---------------------------------------

        // Documentation
        // https://github.com/d3/d3-force

        simulation.force("link")

            //link.distance([distance])
            //リンク間距離(default:30)
            .distance(100)

            ;

        simulation.force("charge")

            //manyBody.strength([strength])
            //正値の場合はお互いに引きつけあう
            //負値の場合はお互いに離しあう (defalt:-30)
            .strength(-60)
            
            ;

        simulation
            
            //simulation.velocityDecay([decay])
            //摩擦係数. 有効範囲は 0 - 1 (default:0.4)
            // .velocityDecay(0.4)

            ;
        


        //--------------------------------------</Coefficient settings for force simulation>
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
                        $3SVGnodeElem_text.selectAll("tspan")
                            .attr(axis, renderByThisObj.coordinate[axis]);
                        
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
                        $3SVGnodeElem_text.selectAll("tspan")
                            .attr(axis, toApplyAxisValStr);
                        
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

        //オブジェクトコピー
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
            .style("font-size", "small")
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
                checkAdjustPropertyEditConsole();//property editor内の値をロールバックしたNode状態に合わせる
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
                    checkAdjustPropertyEditConsole();//property editor内の値をロールバックしたNode状態に合わせる
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

            rollbackRenderringReport = deleteNodes(toDeleteKeyArr); //Node(s), Link(s)削除
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
        for(var i = 0 ; i < dataset.datas.length ; i++){

            var bindedData = dataset.datas[i];

            if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == "true"){ // 選択対象Nodeの場合
                bindedData.$3bindedSelectionLayerSVGElement.style("visibility",null); //選択状態にする
            }
        }

        //link選択状態の表示化ループ
        for(var i = 0 ; i < dataset.links.length ; i++){

            var bindedData = dataset.links[i];

            if(bindedData.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == "true"){ // 選択対象Nodeの場合
                bindedData.$3bindedSelectionLayerSVGElement.style("visibility",null); //選択状態にする
            }
        }

        $propertyEditConsoleElement.slideUp(100); //edit consoleの終了

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

            if(lastSelectedData !== null){ //選択対象Nodeが存在する場合
                propertyEditorsManager.focus(lastSelectedData);
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
                d.$3bindedSelectionLayerSVGElement.style("visibility","hidden"); //非表示にする
                editingNodeKeys.push(d.key);
                propertyEditorsManager.append(d);
            }
        });

        //選択状態のLinkに対するSelectionLayerを非表示にする
        $3svgLinks.each(function(d,i){

            if(d.$3bindedSelectionLayerSVGElement.attr("data-selected").toLowerCase() == 'true'){ //選択状態の場合
                d.$3bindedSelectionLayerSVGElement.style("visibility","hidden"); //非表示にする
                editingLinkKeys.push(d.key);
            }
        });

        if(editingNodeKeys.length > 0 || editingLinkKeys.length > 0){ //1つ以上の Node or Link を選択している場合
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

                //todo 確定して次のNodeを追加する
                
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
                overWriteScceededTransaction(totalReport, bufTotalReport, arrNameShouldBeStored);
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
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
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
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
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
    function propertyEditorBehavor_radioButtons(elemAndValArr, $defaultButtonElem, $expMsgElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){

        var clicked = false;
        var beforeExpMessage = "";
        var beforeVal = "";
        var bufTotalReport = null; //Rendering Report 用バッファ
        var propertyEditingBehavor_setAsdefault;

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
                    enteredElem.classList.add(className_nodeIsSelected); //Mouse Enter された要素を選択状態にする

                    if(event.data.useThisVal === null){ //削除指定の場合
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
            bufTotalReport.reportsArr = {};
            bufTotalReport.reportsArr.datas = [];
            bufTotalReport.reportsArr.links = [];
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
    function propertyEditorBehavor_setAsDefault($buttunElem, arrNameShouldBeStored, structureArr, callbackBeforePreview, callbackWhenEventDone){
        
        var bufTotalReport = null; //Rendering Report 用バッファ
        var clicked = false;
        var toRenderObj;
        var messageTitle = "";
        
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

    //key重複チェック
    function makeUniqueKey(baseKeyName, bindedDataGetter){
        
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
            
            if(typeof (bindedDataGetter(tryThisKeyName)) == 'undefined'){ //重複がなかった場合
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

})();
