# XBill Web Remake (GAS)

1994 年の X Window System 用ゲーム **XBill** を、ブラウザで遊べるように移植したものです。
Google Apps Script のウェブアプリとして動きます。

> ビル軍団（Bill）が、あなたのコンピュータの OS を Wingdows に入れ替えようとしてきます。ビルを叩いて、OS を守りましょう。

## 遊ぶ

<https://script.google.com/macros/s/AKfycbyOP_vYPnagEkkHLuU5OSqFlxNJdBABp6GQUzqEGLyvrQb-425-0SJZbOWVidXu2aAOkg/exec>

- スマホ（縦向き）でもパソコンでも遊べます。
- ログインは不要です。複数の Google アカウントでログインしているブラウザでは、URL が書き換えられて「現在、ファイルを開くことができません」と表示されることがあります。その場合は、**シークレット（プライベート）ウィンドウで開く**か、他の Google アカウントからログアウトしてください。
- 初めて開いたときに、画面の上に「このアプリケーションは Google Apps Script のユーザーによって作成されたものです」と表示されることがあります。Apps Script で作られたアプリすべてに Google が出す案内で、ゲームの不具合や危険を示すものではありません。

## 遊び方

1. **ビルを叩く**: クリック（タップ）で倒します。重なったビルを一度に倒すほど高得点です（倒した数の 2 乗 × 5 点）。
2. **OS を取り戻す**: ビルは PC の OS を Wingdows に入れ替え、盗んだ OS を頭に載せて逃げます。叩くと OS を落とすので、ドラッグして同じ種類の PC に戻します。逃げ切られたビルは、また戻ってきます。
3. **火花を止める**: Wingdows になった PC から、ケーブルでつながった PC へ火花が走ります。左上のバケツをドラッグして火花にかけると、火花が最初からやり直しになります。
4. 動いている PC が 1 台以下になるとゲームオーバーです。レベルが終わるたびに、稼働率に応じたボーナスが入ります。
5. **レベル 10 をクリアで全クリア**です。

## 特徴

- 原作 XBill 2.1 の C ソースをもとに、PC とケーブルの配置、ビルの動き、OS の入れ替え、火花とバケツ、得点、終了条件を移植しています。
- 絵は原作のものをそのまま使っています。
- ランキング（名前とスコア）を Script Properties に保存します。

## ファイル構成

```
src/                    Apps Script のプロジェクト（clasp の rootDir）
  appsscript.json         マニフェスト（ウェブアプリの設定）
  code.gs                 doGet、ランキングの保存と取得
  index.html              画面の骨組み。下の部分ファイルを include で読み込む
  styles.html             CSS
  assets.html             原作の絵（自動生成）
  sprites.html            絵の読み込みと描画
  sound.html              効果音
  game.html               ゲーム本体（ルール、操作、画面、ランキングの画面）
tools/make_assets.py    原作の絵（XPM）から src/assets.html を作る
third_party/xbill-2.1/  原作の絵の元データ、README、ライセンス表記
```

## 自分の Google アカウントで動かす

[clasp](https://github.com/google/clasp) を使います。

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json     # scriptId を自分のプロジェクトのものに書き換える
clasp push
```

新しいプロジェクトを作る場合は、`clasp create --type webapp --title "XBill" --rootDir src` を使うこともできます。
`clasp push` のあと、Apps Script のエディタで「デプロイ」→「新しいデプロイ」からウェブアプリとして公開します。
公開の範囲は `src/appsscript.json` の `webapp.access` で決まります（`ANYONE_ANONYMOUS` は、誰でもログインなしで開けます）。

### ランキングの保存先

`PropertiesService.getScriptProperties()` の `XBILL_RANKING` に、上位 20 件を JSON で保存します。
白紙に戻したいときは、Apps Script のエディタの「プロジェクトの設定」→「スクリプト プロパティ」で、このキーを削除します。

### 絵を作り直す

```bash
python3 tools/make_assets.py
```

## 難易度の調整

`src/game.html` の `LEVELS`（レベルごとの、ビルの数・出現の勢い・速さなど）だけを変えれば調整できます。
PC の台数とケーブルの本数は、原作の式のままです。

## ライセンスとクレジット

- ライセンス: **GPL-3.0 以降**（[`LICENSE`](LICENSE)）
- 原作: XBill 2.1 — Copyright (C) Brian Wellington, Matias Duarte（<http://www.xbill.org/>）
- 詳しくは [`NOTICE.md`](NOTICE.md) を見てください。
