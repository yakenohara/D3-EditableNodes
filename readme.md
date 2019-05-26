# Features 

## Edit Node(s)

Select any node(s) you want to edit and press `F2` (or double click).  
And you can edit text content of node(s), and styles.

## Add Node

Open context menu by right click or press application key and select `Add`.

## Connect Node(s) / Stretch link(s)

Press `C` key and hold (or Open context menu and select `Connect`).  
To exit this mode, Release key `C` (or press key `ESC`).

## Brush Select

Press `B` key and hold (or Open context menu and select `Brush`).  
To exit this mode, Release key `B` (or press key `ESC`).

## Highlight connected node(s)

To highlight connected source node(s), press `S` key and hold.  
To highlight connected target node(s), press `T` key and hold.  
You can highlight source and target at same time by press `S` and `T` key and hold (or press `L` key and hold).  
To exit this mode, Release that key(s).

## Undo, Redo (History select)

To undo operation, press `ctrl+z` key (like other some editing applicaion).  
To Redo operation, press `ctrl+y` key.  

Or select history from history area(upper right of editing area) by using mouse.

## Export as json file

To export node(s) as json file, Open context nemu and select `Export` -> `Export all` or `Export selected`.

## Export as SVG file

To export node(s) as json file, Open context nemu and select `Export` -> `Export as SVG`

## Import from .json file

To import node(s) from json file, drag json file you want to import and drop to editing area.

# Install

## 1. Include dependencies

force-layout-memo.js depends on following.

- [d3.js](https://github.com/d3/d3)
- [jQuery](https://jquery.com/)
- [mousetrap](https://github.com/ccampbell/mousetrap)
- [spectrum](https://github.com/bgrins/spectrum)
- [jQuery-contextMenu](https://github.com/swisnl/jQuery-contextMenu)

So include like following.


```
<!-- <include dependencies for force-layout-memo.js>=========================== -->

<!-- https://github.com/d3/d3 -->
<script src="assets/js/d3.v5.5.0.js"></script>

<!-- https://jquery.com/ -->
<script src="assets/js/jquery-3.3.1.js"></script>

<!-- https://github.com/ccampbell/mousetrap -->
<script src="assets/js/mousetrap.v1.6.2.js"></script>

<!-- https://github.com/bgrins/spectrum -->
<!-- caution depends on jQuery -->
<script src="assets/js/spectrum-1.8.0.js"></script>
<link rel="stylesheet" href="assets/css/spectrum-1.8.0.css" />

<!-- https://github.com/swisnl/jQuery-contextMenu -->
<!-- caution depends on jQuery -->
<script src="assets/js/jquery.contextMenu-2.7.1.js"></script>
<script src="assets/js/jquery.contextMenu-2.7.1-jquery.ui.position.js"></script>
<link rel="stylesheet" href="assets/css/jquery.contextMenu-2.7.1.css" />

<!-- ==========================</include dependencies for force-layout-memo.js> -->
```

## 2. Include force-layout-memo.js

Before include force-layout-memo.js, Deploy `force-layout-memo_compo.html` file to `assets/components/` directory.  
If you don't like that making the `assets/components/` directory for `force-layout-memo_compo.html`, you can specify other directory to force-layout-memo.js. See next step.  


And include `force-layout-memo.css` and `force-layout-memo.js` like following.

```
<link rel="stylesheet" href="assets/css/force-layout-memo.css">
<script src="assets/js/force-layout-memo.js"></script>
```

## 3. Specify `<div>` element as editing area to force-layout-memo.js

Here's an example

```
<div id="force-memo0"></div>
<script>
    var memo0 = new forceLayoutMemo({
        elemIdNameToBind:"force-memo0"
    });
</script>
```

If you deployed `force-layout-memo_compo.html` to `xxx/yyy/zzz/` directory instead of `assets/components/`, you have to specify this directory in this instantiate timing.   
Here's an example

```
<div id="force-memo0"></div>
<script>
    var memo0 = new forceLayoutMemo({
        elemIdNameToBind:"force-memo0",
        componentPath:"xxx/yyy/zzz/force-layout-memo_compo.html"
    });
</script>
```


## 4. (Optional) Load a saved file

If you have a exported file, You can specify that file to instanciated object of force-layout-memo.js .  
Here's an example

```
<div id="force-memo0"></div>
<script>
    var memo0 = new forceLayoutMemo({
        elemIdNameToBind:"force-memo0",
    });
    memo0.loadFile("foo/bar.json");
</script>
```

# Limitation

 - クラス名 `force-layout-memo` は使用不可
 
 - クラス名 以下から始まる文字列は使用不可
 `context-menu-` -> jquery.contextMenu-2.7.1.js で使用
 
 `text_text_fill`
 `text_frame_stroke`
 `text_frame_fill`
 `line_stroke`       -> spectrum-1.8.0.js で使用
 
 
 - 必要な最小width, height
 
 - link の矢印表示 (ie11 only)

# Todo

 - highlight, brush, connect/stretch の競合判定 and 判定結果による status message control
  
# Wish

 - distance 用 property editor
 - ctrl+a で全選択したい
 - alt 単独押下で Browser Menu を出したくない
 - highlight 時に source / target が存在しなかった場合の message が不親切

# Loap map

 - リファクタリング
 - 画像表示
 - グルーピング