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
 - history 追加時に 座標が変化した node の座標情報も保存
 - highlight 時に source / target が存在しなかった場合の message が不親切