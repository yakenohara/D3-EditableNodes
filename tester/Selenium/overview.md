# 大枠

0. terminal で `py -m http.server`

1. ブラウザ起動
2. 'http://localhost:8000/' にアクセス
3. テスト用 .json ファイルを D&D
4. 結果確認

確認する結果は以下の通り。  

1. ブラウザコンソールに以下が表示されること

```
Wrong type specified in `renderByThisObj.text.text_content`. specified type:`number`, expected type:`string`.
```

2. svg 領域に node が生成されないこと
   
   