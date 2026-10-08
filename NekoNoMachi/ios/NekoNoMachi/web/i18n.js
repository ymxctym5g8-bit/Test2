// i18n.js – Deutsch / English / 日本語
'use strict';
(() => {
  const D = {
    de: {
      shrineBook: 'Schreine', shrineBookPack: '· Erweiterung „Die Ikonen Japans“', newShrine: '⛩️ Schrein entdeckt: {name} {jp} ({n}/{total})', shrineAgain: '⛩️ Schrein besucht: {name}', packIconsTitle: '✨ Erweiterung: Die Ikonen Japans', packFullTitle: '✨ Vollversion', lockBadgeIcons: '🔒 Erweiterung', shopIconsTitle: '✨ Erweiterung: Die Ikonen Japans', shopIconsLead: 'Acht neue Kapitel rund um Japans Berühmtheiten – einmal kaufen, für immer spielen.', shopIconsP1: '8 neue Welten: Matsuri, Onsen, Shinkansen, Bambuswald, Spielhalle, Zen-Garten, Samuraiburg und Teezeremonie', shopIconsP2: 'Sushi sammeln wie gewohnt – und dazu 9 Schreine entdecken, vom kleinen Hokora bis zum seltenen Itsukushima', shopIconsP3: '8 neue Musikstücke, 8 Ziel-Tore und Stempel', shopIconsThanks: '🎉 Danke! Die Ikonen Japans sind jetzt freigeschaltet.',
      shopTitle: '✨ Vollversion: Kapitel 4–8', shopLead: 'Fünf neue Kapitel für deine Reise durch Japan – einmal kaufen, für immer spielen.', shopP1: '5 neue Welten: Tokio, Tempel, Katzencafé, Sushi & Ramen und Monster-Wiesen – jede mit eigener Musik', shopP2: '5 neue Ziel-Tore und Stempel – dein Stempelheft wird komplett', shopP3: 'Neun Monster fürs Monster-Buch', shopP4: 'Einmaliger Kauf · keine Werbung · Familienfreigabe', shopBuy: 'Für {price} freischalten', shopBuyNoPrice: 'Freischalten', shopRestore: 'Käufe wiederherstellen', shopBusy: 'Einen Moment …', shopPending: 'Der Kauf wartet noch auf Bestätigung (z. B. „Kaufen fragen“).', shopFailed: 'Der Kauf hat nicht geklappt. Bitte versuche es später noch einmal.', shopUnavailable: 'Der App Store ist gerade nicht erreichbar. Bitte prüfe deine Internetverbindung.', shopCancelled: '', shopRestoredNone: 'Es wurde kein Kauf gefunden.', shopTimeout: 'Der App Store antwortet nicht. Bitte versuche es noch einmal.', shopOwned: '✓ Freigeschaltet – viel Spaß!', shopThanks: '🎉 Danke! Kapitel 4–8 sind jetzt freigeschaltet.', lockBadge: '🔒 Vollversion', lockPlay: 'Zur Vollversion', goalNextLocked: 'Weiter: {title} 🔒', stampLocked: '🔒 Vollversion', monsterLocked: '🔒 Die Monster triffst du in Kapitel 8 (Vollversion).',
      touchPhoto: 'Foto', touchDown: 'Runter', ariaPhoto: 'Foto machen', cPhoto: 'Foto machen', photoSaved: '📷 Foto gespeichert', photoSavedMac: '📷 Foto gespeichert in Bilder › Neko no Machi', photoSavedIOS: '📷 Foto in der Fotos-App gespeichert', photoFailed: 'Foto konnte nicht gespeichert werden – Zugriff auf Fotos erlauben?',
      chSushi: '{s} gesammelt',
      newCat: 'Neue Katze', editCat: 'Katze bearbeiten', edDelete: '🗑 Löschen', edDeleteConfirm: 'Wirklich löschen?', catDeleted: '{cat} wurde gelöscht', maxCats: 'Höchstens {n} Katzen – du bearbeitest deine letzte eigene Katze',
      // Oberfläche
      soundTitle: 'Ton an/aus', menuTitle: 'Menü (Esc)',
      help: '<b>← →</b> laufen &nbsp; <b>⇧</b> rennen &nbsp; <b>Leertaste</b> springen (2× in der Luft) &nbsp; <b>M</b> miauen &nbsp; <b>S</b> hinsetzen / schlafen &nbsp; <b>F</b> Foto &nbsp; <b>K</b> Kapitel &nbsp; <b>Esc</b> Menü',
      helpTouch: '<b>◀ ▶</b> laufen &nbsp; <b>{RUN}</b> rennen &nbsp; <b>🐾</b> springen (2×) &nbsp; <b>😺</b> miauen &nbsp; <b>📷</b> Foto &nbsp; <b>☰</b> Menü',
      someone: 'Jemand', rotate: '↻  Bitte dreh dein Gerät ins Querformat', ariaLeft: 'links', ariaRight: 'rechts', ariaRun: 'rennen', ariaSit: 'hinsetzen', ariaMeow: 'miauen', ariaDown: 'runter', ariaJump: 'springen',
      goalTitle: 'Ziel erreicht!', goalSub: '{title} geschafft', goalDays: 'Unterwegs: {d} Tage', goalStay: 'Weiter erkunden', goalNext: 'Weiter: {title} ›', goalCount: 'Stempel {n} von {total} im Stempelheft', goalAll: '🎉 Alle {total} Stempel gesammelt – großartig!', goalHud: 'Weg zum Ziel-Tor', stampBook: 'Stempelheft', sushiBook: 'Sushi', stampDone: 'geschafft<br><b>in {d} Tagen</b>', stampTodo: 'Weg zum Tor:<br><b>{p} %</b>',
      mmContinue: 'Weiterspielen', mmChapters: 'Kapitel wählen', mmChaptersSub: '8 Orte in Japan entdecken',
      mmDesign: 'Katze gestalten', mmDesignSub: 'Zufallskatze & eigene Farben', mmCollection: 'Sammlung', mmCollectionSub: 'Sushi, Freunde & Monster-Buch',
      mmControls: 'Steuerung', mmControlsSub: 'Tasten & Tipps', mmSettings: 'Einstellungen', mmSettingsSub: 'Sprache, Lautstärke & Spielstand', mmQuit: 'Beenden',
      mmFoot: '↑ ↓ auswählen · Enter bestätigen',
      contInfo: 'Kapitel {n}: {title} · mit {cat}', mmStats: '🍣 {s} Sushi · 🐾 {f} {fw} · {k}/9 Sorten',
      edTitle: 'Katze gestalten', edRandom: '🎲 Zufallskatze', edNote: 'Deine Katzen erscheinen in der Katzenwahl neben Mochi, Yoru und Hana – bis zu 6 eigene.',
      edName: 'Name', edPattern: 'Muster', edBase: 'Fell', edStripe: 'Streifen', edPatch: 'Flecken', edWhite: 'Brust', edEyes: 'Augen',
      edSize: 'Größe', edFluff: 'Flauschigkeit', edEar: 'Ohren', edTail: 'Schwanz', back: 'Zurück', edSave: 'Speichern & auswählen 🐾',
      customDesc: 'Deine eigene Katze – selbst gestaltet.', catReady: '{cat} ist bereit! 🐾',
      poseWalk: 'läuft', poseRun: 'rennt', poseIdle: 'steht', poseSit: 'sitzt', poseSleep: 'schläft',
      setTitle: 'Einstellungen', setLang: 'Sprache / Language', setMusic: 'Musik', setSfx: 'Effekte',
      reset: 'Spielstand zurücksetzen', resetConfirm: 'Wirklich? Nochmal klicken', resetDone: 'Spielstand zurückgesetzt',
      catTitle: 'Wähle deine Katze', catGo: "Los geht's! 🐾", catHint: '← → auswählen · Enter starten', chapterChip: 'Kapitel {n}: {title}',
      ctrlTitle: 'Steuerung', or: 'oder', hold: 'halten', inAir: 'in der Luft', space: 'Leertaste',
      cWalk: 'laufen', cRun: 'rennen', cJump: 'springen – länger halten springt höher', cDouble: 'Doppelsprung mit Salto',
      cDrop: 'von Dach, Zaun oder Regal herunterfallen', cMeow: 'miauen – Katzen, Rehe und Monster werden deine Freunde',
      cRest: 'hinsetzen → schlafen → aufstehen', cChapters: 'Kapitel wählen', cMenu: 'Menü',
      ctrlNote: 'Sammle Sushi 🍣 auf Dächern, Ästen und Regalen. Der Tag vergeht in jedem Kapitel – nachts leuchten Laternen, Fenster und Glühwürmchen.',
      pause: 'Pause', resume: 'Weiterspielen', pChapters: '📖 Kapitel wählen', pCollection: '🍣 Sammlung', pSwitch: '🐱 Katze wechseln',
      pControls: '🎮 Steuerung', pSettings: '⚙️ Einstellungen', pHome: '🏠 Hauptmenü',
      chTitle: 'Kapitel wählen', backToGame: 'Zurück', chStats: '🍣 {s} gesammelt · {icon} {f} {word}', friends: 'Freunde',
      collTitle: 'Sammlung', monsterBook: 'Monster-Buch', friendsBook: 'Freunde', friendsEmpty: 'Noch keine Freunde – miaue schlafende Katzen und Rehe an!', friendsMore: 'weitere Freunde',
      // Spiel
      toastChapter: 'Kapitel {n}: {title} {jp}', newSushi: 'Neu in der Sammlung: {name} {jp} 🍣', fullCat: '{n} Sushi! {cat} ist pappsatt 😸',
      friendCat: '{name} ist jetzt {cat}s Freund! 🐾', friendDeer: 'Ein Reh verbeugt sich höflich vor {cat}! 🦌',
      friendMonster: '{name} hat sich mit {cat} angefreundet! Neu im Monster-Buch ✨',
      touchRun: 'Rennen', touchSit: 'Sitzen', touchMeow: 'Miau', touchJump: 'Sprung',
    },
    en: {
      shrineBook: 'Shrines', shrineBookPack: '· Expansion “Icons of Japan”', newShrine: '⛩️ Shrine discovered: {name} {jp} ({n}/{total})', shrineAgain: '⛩️ Shrine visited: {name}', packIconsTitle: '✨ Expansion: Icons of Japan', packFullTitle: '✨ Full version', lockBadgeIcons: '🔒 Expansion', shopIconsTitle: '✨ Expansion: Icons of Japan', shopIconsLead: 'Eight new chapters about Japan’s most famous sights – buy once, play forever.', shopIconsP1: '8 new worlds: Matsuri, Onsen, Shinkansen, Bamboo Forest, Arcade, Zen Garden, Samurai Castle and Tea Ceremony', shopIconsP2: 'Collect sushi as usual – and discover 9 shrines, from the little hokora to the rare Itsukushima', shopIconsP3: '8 new pieces of music, 8 goal gates and stamps', shopIconsThanks: '🎉 Thank you! Icons of Japan is now unlocked.',
      shopTitle: '✨ Full version: Chapters 4–8', shopLead: 'Five new chapters for your journey through Japan – buy once, play forever.', shopP1: '5 new worlds: Tokyo, Temples, Cat Café, Sushi & Ramen and Monster Meadows – each with its own music', shopP2: '5 new goal gates and stamps – complete your stamp book', shopP3: 'Nine monsters for the monster book', shopP4: 'One-time purchase · no ads · Family Sharing', shopBuy: 'Unlock for {price}', shopBuyNoPrice: 'Unlock', shopRestore: 'Restore purchases', shopBusy: 'One moment …', shopPending: 'The purchase is waiting for approval (e.g. Ask to Buy).', shopFailed: 'The purchase didn’t go through. Please try again later.', shopUnavailable: 'The App Store can’t be reached right now. Please check your internet connection.', shopCancelled: '', shopRestoredNone: 'No purchase was found.', shopTimeout: 'The App Store isn’t responding. Please try again.', shopOwned: '✓ Unlocked – have fun!', shopThanks: '🎉 Thank you! Chapters 4–8 are now unlocked.', lockBadge: '🔒 Full version', lockPlay: 'See full version', goalNextLocked: 'Next: {title} 🔒', stampLocked: '🔒 Full version', monsterLocked: '🔒 You’ll meet the monsters in chapter 8 (full version).',
      touchPhoto: 'Photo', touchDown: 'Down', ariaPhoto: 'Take a photo', cPhoto: 'take a photo', photoSaved: '📷 Photo saved', photoSavedMac: '📷 Photo saved to Pictures › Neko no Machi', photoSavedIOS: '📷 Photo saved to your Photos app', photoFailed: 'Could not save the photo – allow access to Photos?',
      chSushi: '{s} collected',
      newCat: 'New cat', editCat: 'Edit cat', edDelete: '🗑 Delete', edDeleteConfirm: 'Really delete?', catDeleted: '{cat} was deleted', maxCats: 'Up to {n} cats – editing your last custom cat',
      soundTitle: 'Sound on/off', menuTitle: 'Menu (Esc)',
      help: '<b>← →</b> walk &nbsp; <b>⇧</b> run &nbsp; <b>Space</b> jump (2× in the air) &nbsp; <b>M</b> meow &nbsp; <b>S</b> sit / sleep &nbsp; <b>F</b> photo &nbsp; <b>K</b> chapters &nbsp; <b>Esc</b> menu',
      helpTouch: '<b>◀ ▶</b> walk &nbsp; <b>{RUN}</b> run &nbsp; <b>🐾</b> jump (2×) &nbsp; <b>😺</b> meow &nbsp; <b>📷</b> photo &nbsp; <b>☰</b> menu',
      someone: 'Someone', rotate: '↻  Please rotate your device to landscape', ariaLeft: 'left', ariaRight: 'right', ariaRun: 'run', ariaSit: 'sit down', ariaMeow: 'meow', ariaDown: 'down', ariaJump: 'jump',
      goalTitle: 'Goal reached!', goalSub: '{title} complete', goalDays: 'On the road: {d} days', goalStay: 'Keep exploring', goalNext: 'Next: {title} ›', goalCount: 'Stamp {n} of {total} in your stamp book', goalAll: '🎉 All {total} stamps collected – amazing!', goalHud: 'Way to the goal gate', stampBook: 'Stamp book', sushiBook: 'Sushi', stampDone: 'completed<br><b>in {d} days</b>', stampTodo: 'Way to the gate:<br><b>{p} %</b>',
      mmContinue: 'Continue', mmChapters: 'Choose chapter', mmChaptersSub: 'Explore 8 places in Japan',
      mmDesign: 'Design your cat', mmDesignSub: 'Random cat & your own colors', mmCollection: 'Collection', mmCollectionSub: 'Sushi, friends & monster book',
      mmControls: 'Controls', mmControlsSub: 'Keys & tips', mmSettings: 'Settings', mmSettingsSub: 'Language, volume & save data', mmQuit: 'Quit',
      mmFoot: '↑ ↓ select · Enter confirm',
      contInfo: 'Chapter {n}: {title} · with {cat}', mmStats: '🍣 {s} sushi · 🐾 {f} {fw} · {k}/9 kinds',
      edTitle: 'Design your cat', edRandom: '🎲 Random cat', edNote: 'Your cats appear in the cat selection next to Mochi, Yoru and Hana – up to 6 of your own.',
      edName: 'Name', edPattern: 'Pattern', edBase: 'Fur', edStripe: 'Stripes', edPatch: 'Patches', edWhite: 'Chest', edEyes: 'Eyes',
      edSize: 'Size', edFluff: 'Fluffiness', edEar: 'Ears', edTail: 'Tail', back: 'Back', edSave: 'Save & select 🐾',
      customDesc: 'Your very own cat – designed by you.', catReady: '{cat} is ready! 🐾',
      poseWalk: 'walking', poseRun: 'running', poseIdle: 'standing', poseSit: 'sitting', poseSleep: 'sleeping',
      setTitle: 'Settings', setLang: 'Language / Sprache', setMusic: 'Music', setSfx: 'Sound effects',
      reset: 'Reset save data', resetConfirm: 'Are you sure? Click again', resetDone: 'Save data reset',
      catTitle: 'Choose your cat', catGo: "Let's go! 🐾", catHint: '← → select · Enter start', chapterChip: 'Chapter {n}: {title}',
      ctrlTitle: 'Controls', or: 'or', hold: 'hold', inAir: 'in the air', space: 'Space',
      cWalk: 'walk', cRun: 'run', cJump: 'jump – hold longer to jump higher', cDouble: 'double jump with a flip',
      cDrop: 'drop down from a roof, fence or shelf', cMeow: 'meow – cats, deer and monsters become your friends',
      cRest: 'sit → sleep → stand up', cChapters: 'choose chapter', cMenu: 'menu',
      ctrlNote: 'Collect sushi 🍣 on rooftops, branches and shelves. A whole day passes in every chapter – at night, lanterns, windows and fireflies light up.',
      pause: 'Paused', resume: 'Continue', pChapters: '📖 Choose chapter', pCollection: '🍣 Collection', pSwitch: '🐱 Switch cat',
      pControls: '🎮 Controls', pSettings: '⚙️ Settings', pHome: '🏠 Main menu',
      chTitle: 'Choose a chapter', backToGame: 'Back', chStats: '🍣 {s} collected · {icon} {f} {word}', friends: 'friends',
      collTitle: 'Collection', monsterBook: 'Monster book', friendsBook: 'Friends', friendsEmpty: 'No friends yet – meow at sleeping cats and deer!', friendsMore: 'more friends',
      toastChapter: 'Chapter {n}: {title} {jp}', newSushi: 'New in your collection: {name} {jp} 🍣', fullCat: '{n} sushi! {cat} is completely full 😸',
      friendCat: '{name} is now friends with {cat}! 🐾', friendDeer: 'A deer bows politely to {cat}! 🦌',
      friendMonster: '{name} made friends with {cat}! New in the monster book ✨',
      touchRun: 'Run', touchSit: 'Sit', touchMeow: 'Meow', touchJump: 'Jump',
    },
    ja: {
      shrineBook: '神社', shrineBookPack: '· 拡張パック「日本のアイコン」', newShrine: '⛩️ 神社を発見：{name}（{n}/{total}）', shrineAgain: '⛩️ 神社におまいり：{name}', packIconsTitle: '✨ 拡張パック：日本のアイコン', packFullTitle: '✨ 完全版', lockBadgeIcons: '🔒 拡張パック', shopIconsTitle: '✨ 拡張パック：日本のアイコン', shopIconsLead: '日本の名所をめぐる8つの新しい章。一度買えばずっと遊べます。', shopIconsP1: '8つの新しい世界：祭り、温泉、新幹線、竹林、ゲームセンター、禅の庭、城、茶道', shopIconsP2: 'いつものようにお寿司を集めて、さらに9つの神社を見つけよう。小さな祠から、めずらしい厳島まで', shopIconsP3: '8つの新しい音楽、8つのゴールの門とスタンプ', shopIconsThanks: '🎉 ありがとう！「日本のアイコン」が解放されました。',
      shopTitle: '✨ 完全版：第4〜8章', shopLead: '日本をめぐる旅に5つの新しい章。一度買えばずっと遊べます。', shopP1: '5つの新しい世界：東京、お寺、ねこカフェ、すし＆ラーメン、モンスター草原（それぞれ専用の音楽つき）', shopP2: '5つのゴールの門とスタンプ：スタンプ帳がそろう', shopP3: 'モンスター図鑑に9匹のモンスター', shopP4: '買い切り・広告なし・ファミリー共有対応', shopBuy: '{price}で解放', shopBuyNoPrice: '解放する', shopRestore: '購入を復元', shopBusy: 'しばらくお待ちください…', shopPending: '購入は承認待ちです（「承認と購入のリクエスト」など）。', shopFailed: '購入できませんでした。あとでもう一度お試しください。', shopUnavailable: 'App Storeに接続できません。インターネット接続を確認してください。', shopCancelled: '', shopRestoredNone: '購入が見つかりませんでした。', shopTimeout: 'App Storeから応答がありません。もう一度お試しください。', shopOwned: '✓ 解放済み。楽しんでね！', shopThanks: '🎉 ありがとう！第4〜8章が解放されました。', lockBadge: '🔒 完全版', lockPlay: '完全版を見る', goalNextLocked: 'つぎへ：{title} 🔒', stampLocked: '🔒 完全版', monsterLocked: '🔒 モンスターには第8章（完全版）で会えます。',
      touchPhoto: '写真', touchDown: 'おりる', ariaPhoto: '写真をとる', cPhoto: '写真をとる', photoSaved: '📷 写真を保存しました', photoSavedMac: '📷 ピクチャ › Neko no Machi に保存しました', photoSavedIOS: '📷 写真アプリに保存しました', photoFailed: '写真を保存できませんでした。写真へのアクセスを許可してね',
      chSushi: '{s}個',
      newCat: 'あたらしいネコ', editCat: 'ネコを編集', edDelete: '🗑 消す', edDeleteConfirm: '本当に消す？', catDeleted: '{cat}を消しました', maxCats: 'ネコは{n}匹まで。最後のオリジナルネコを編集します',
      soundTitle: 'サウンド オン/オフ', menuTitle: 'メニュー (Esc)',
      help: '<b>← →</b> あるく &nbsp; <b>⇧</b> はしる &nbsp; <b>スペース</b> ジャンプ（空中でもう1回）&nbsp; <b>M</b> ニャー &nbsp; <b>S</b> すわる／ねる &nbsp; <b>F</b> 写真 &nbsp; <b>K</b> チャプター &nbsp; <b>Esc</b> メニュー',
      helpTouch: '<b>◀ ▶</b> あるく &nbsp; <b>{RUN}</b> はしる &nbsp; <b>🐾</b> ジャンプ（2回）&nbsp; <b>😺</b> ニャー &nbsp; <b>📷</b> 写真 &nbsp; <b>☰</b> メニュー',
      someone: 'だれか', rotate: '↻  端末を横向きにしてね', ariaLeft: '左', ariaRight: '右', ariaRun: 'はしる', ariaSit: 'すわる', ariaMeow: 'ニャー', ariaDown: 'おりる', ariaJump: 'ジャンプ',
      goalTitle: 'ゴール！', goalSub: '{title} クリア', goalDays: 'かかった日数：{d}日', goalStay: 'このまま探検する', goalNext: 'つぎへ：{title} ›', goalCount: 'スタンプ帳 {n} / {total}', goalAll: '🎉 {total}個のスタンプをぜんぶ集めた！すごい！', goalHud: 'ゴールの門までの道のり', stampBook: 'スタンプ帳', sushiBook: 'おすし', stampDone: 'クリア<br><b>{d}日</b>', stampTodo: '門まで<br><b>{p} %</b>',
      mmContinue: 'つづきから', mmChapters: 'チャプターをえらぶ', mmChaptersSub: '日本の8つの場所をめぐろう',
      mmDesign: 'ネコをつくる', mmDesignSub: 'ランダムネコと好きな色', mmCollection: 'コレクション', mmCollectionSub: 'おすし・ともだち・モンスター図鑑',
      mmControls: 'そうさ方法', mmControlsSub: 'キーとヒント', mmSettings: '設定', mmSettingsSub: '言語・音量・セーブデータ', mmQuit: 'おわる',
      mmFoot: '↑ ↓ えらぶ · Enter けってい',
      contInfo: 'チャプター{n}：{title} · {cat}といっしょ', mmStats: '🍣 おすし {s}個 · 🐾 ともだち {f} · {k}/9種類',
      edTitle: 'ネコをつくる', edRandom: '🎲 ランダムネコ', edNote: 'つくったネコは、ネコえらびでモチ・ヨル・ハナのとなりに登場します（最大6匹）。',
      edName: '名前', edPattern: 'もよう', edBase: '毛の色', edStripe: 'しま', edPatch: 'ぶち', edWhite: 'むね', edEyes: '目',
      edSize: '大きさ', edFluff: 'ふわふわ度', edEar: '耳', edTail: 'しっぽ', back: 'もどる', edSave: '保存してえらぶ 🐾',
      customDesc: 'あなただけのオリジナルのネコ。', catReady: '{cat}の準備ができたよ！🐾',
      poseWalk: 'あるく', poseRun: 'はしる', poseIdle: 'たつ', poseSit: 'すわる', poseSleep: 'ねる',
      setTitle: '設定', setLang: '言語 / Language', setMusic: '音楽', setSfx: '効果音',
      reset: 'セーブデータを消す', resetConfirm: '本当に？もう一度押してね', resetDone: 'セーブデータを消しました',
      catTitle: 'ネコをえらんでね', catGo: 'しゅっぱつ！🐾', catHint: '← → えらぶ · Enter スタート', chapterChip: 'チャプター{n}：{title}',
      ctrlTitle: 'そうさ方法', or: 'または', hold: '長押し', inAir: '空中で', space: 'スペース',
      cWalk: 'あるく', cRun: 'はしる', cJump: 'ジャンプ – 長押しでもっと高く', cDouble: '宙返りの二段ジャンプ',
      cDrop: '屋根・へい・たなからおりる', cMeow: 'ニャー – ネコ、シカ、モンスターとともだちになれる',
      cRest: 'すわる → ねる → おきる', cChapters: 'チャプターをえらぶ', cMenu: 'メニュー',
      ctrlNote: '屋根や枝やたなの上のおすし🍣を集めよう。どのチャプターでも一日が過ぎていき、夜にはちょうちんや窓やホタルが光ります。',
      pause: 'ひとやすみ', resume: 'つづける', pChapters: '📖 チャプターをえらぶ', pCollection: '🍣 コレクション', pSwitch: '🐱 ネコをかえる',
      pControls: '🎮 そうさ方法', pSettings: '⚙️ 設定', pHome: '🏠 メインメニュー',
      chTitle: 'チャプターをえらぶ', backToGame: 'もどる', chStats: '🍣 {s}個 · {icon} {f} {word}', friends: 'ともだち',
      collTitle: 'コレクション', monsterBook: 'モンスター図鑑', friendsBook: 'ともだち', friendsEmpty: 'まだともだちはいないよ。ねむっているネコやシカに「ニャー」と話しかけよう！', friendsMore: 'ほかのともだち',
      toastChapter: 'チャプター{n}：{title}', newSushi: 'コレクションに追加：{name} 🍣', fullCat: 'おすし{n}個！{cat}はおなかいっぱい 😸',
      friendCat: '{name}が{cat}のともだちになった！🐾', friendDeer: 'シカが{cat}にていねいにおじぎした！🦌',
      friendMonster: '{name}が{cat}となかよくなった！モンスター図鑑に登録 ✨',
      touchRun: 'はしる', touchSit: 'すわる', touchMeow: 'ニャー', touchJump: 'ジャンプ',
    },
  };

  // Daten, die in anderen Dateien definiert sind (Kapitel, Sushi, Katzen, Muster, Monster)
  const DATA = {
    en: {
      chapters: {
        town: ['The Little Town', 'Tiled roofs, washing lines and sparrows on the power lines – the quiet town where it all begins.'],
        landscape: ['Countryside', 'Rice terraces, thatched farmhouses and bamboo groves. Dragonflies dance over the fields; at night the fireflies glow.'],
        fuji: ['Mount Fuji', 'Autumn by the lake: red maples, a five-storey pagoda to climb and the snowy peak mirrored in the water.'],
        tokyo: ['Tokyo', 'Neon signs, convenience stores and a train rushing past overhead. Climb fire escapes all the way up to the city rooftops.'],
        temple: ['Temple', 'Mossy stone lanterns, a tunnel of a thousand red gates, a great temple hall and curious deer that bow to you.'],
        cafe: ['Cat Café', 'An endlessly cozy café with cat trees, bookshelves and a cake counter – and cats everywhere who want to be friends.', 'café cats'],
        food: ['Sushi & Ramen', 'A lantern-lit alley full of food stalls: steaming ramen carts, a fish market and a giant sushi conveyor belt that carries you along.'],
        monster: ['Monster Meadows', 'Little monsters hide in the tall grass! Wander through, meow at them and fill your monster book. Mushrooms are springboards.', 'monsters'],
      },
      sushi: { nigiri: 'Nigiri', hosomaki: 'Hosomaki', uramaki: 'Uramaki', gunkan: 'Gunkan', inari: 'Inari', futomaki: 'Futomaki', temaki: 'Temaki', chirashi: 'Chirashi', oshizushi: 'Oshizushi' },
      shrines: { sh_hokora: 'Hokora', sh_inari: 'Inari Shrine', sh_tenjin: 'Tenjin Shrine', sh_hachiman: 'Hachiman Shrine', sh_shinmei: 'Shinmei Shrine', sh_taisha: 'Taisha Shrine', sh_sengen: 'Sengen Shrine', sh_kumano: 'Kumano Shrine', sh_itsukushima: 'Itsukushima' },
      cats: {
        mochi: 'A striped ray of sunshine. Loves warm rooftops and long naps.',
        yoru: 'Jet black and curious – loves to roam at dusk.',
        hana: 'A calico with soft fur – brings a little luck wherever she goes.',
      },
      patterns: { solid: 'Solid', tabby: 'Tabby', tabbywhite: 'Tabby with white', bicolor: 'Bicolor (with white)', tuxedo: 'Tuxedo (black & white)', calico: 'Calico (three colors)', tortie: 'Tortoiseshell', points: 'Siamese (points)' },
      creatures: { moosi: 'Meadow', tropfi: 'Water', wolki: 'Wind', pilzi: 'Forest', kiesel: 'Stone', bluetli: 'Flower', funki: 'Starlight', laterni: 'Ghost', glutti: 'Fire' },
      creatureNames: { moosi: 'Mossy', tropfi: 'Droplet', wolki: 'Cloudy', pilzi: 'Shroomy', kiesel: 'Pebble', bluetli: 'Blossom', funki: 'Sparky', laterni: 'Lanterny', glutti: 'Emberly' },
    },
    ja: {
      chapters: {
        town: ['猫の町', '瓦屋根に洗濯物、電線にはスズメ。すべてがはじまる、しずかな小さな町。'],
        landscape: ['里山', '棚田にかやぶき屋根の家、竹林。田んぼの上をトンボが舞い、夜にはホタルが光ります。'],
        fuji: ['富士山', '湖のほとりの秋。赤いもみじ、のぼれる五重塔、そして水面に映る雪の山頂。'],
        tokyo: ['東京', 'ネオンにコンビニ、頭上を走る電車。非常階段をのぼってビルの屋上まで行こう。'],
        temple: ['寺', 'こけむした石灯籠、千本鳥居のトンネル、大きな本堂、そしておじぎをする好奇心いっぱいのシカ。'],
        cafe: ['猫カフェ', 'キャットタワーに本棚、ケーキのショーケース。どこまでも続くくつろぎのカフェには、ともだちになりたいネコがいっぱい。', 'カフェのネコ'],
        food: ['寿司とラーメン', 'ちょうちんが灯る屋台の路地。湯気の立つラーメン屋台、魚市場、そしてネコを運んでくれる大きな回転ずしのレーン。'],
        monster: ['モンスター', '背の高い草むらに小さなモンスターがかくれているよ！歩きまわってニャーと話しかけ、モンスター図鑑をうめよう。キノコはジャンプ台。', 'モンスター'],
      },
      sushi: { nigiri: '握り', hosomaki: '細巻き', uramaki: '裏巻き', gunkan: '軍艦巻き', inari: 'いなり', futomaki: '太巻き', temaki: '手巻き', chirashi: 'ちらし', oshizushi: '押し寿司' },
      shrines: { sh_hokora: '祠', sh_inari: '稲荷神社', sh_tenjin: '天神社', sh_hachiman: '八幡神社', sh_shinmei: '神明社', sh_taisha: '大社', sh_sengen: '浅間神社', sh_kumano: '熊野神社', sh_itsukushima: '厳島神社' },
      catNames: { mochi: 'モチ', yoru: 'ヨル', hana: 'ハナ' },
      cats: {
        mochi: 'しましまのお日さまネコ。あたたかい屋根と長いお昼寝が大好き。',
        yoru: 'まっ黒で好奇心いっぱい。夕ぐれのおさんぽが大好き。',
        hana: 'ふわふわの三毛ネコ。行く先々に小さな幸せを運びます。',
      },
      patterns: { solid: '単色', tabby: 'キジトラ（しま）', tabbywhite: 'キジ白', bicolor: '2色（白まじり）', tuxedo: 'ハチワレ（白黒）', calico: '三毛', tortie: 'サビ', points: 'シャム（ポイント）' },
      creatures: { moosi: 'くさ', tropfi: 'みず', wolki: 'かぜ', pilzi: 'もり', kiesel: 'いし', bluetli: 'はな', funki: 'ほし', laterni: 'おばけ', glutti: 'ひ' },
      creatureNames: { moosi: 'コケッチ', tropfi: 'シズクン', wolki: 'モクモ', pilzi: 'キノッコ', kiesel: 'コロイシ', bluetli: 'ハナッピ', funki: 'キラリン', laterni: 'ボンボリ', glutti: 'ヒバナ' },
    },
  };

  const orig = {};
  function snapshot() {
    if (orig.done) return; orig.done = true;
    orig.chapters = {}; for (const c of Chapters.list) orig.chapters[c.id] = [c.title, c.desc, c.friendWord];
    orig.sushi = {}; for (const s of SUSHI) orig.sushi[s.id] = s.name;
    orig.shrines = {}; if (window.SHRINES) for (const s of SHRINES) orig.shrines[s.id] = s.name;
    orig.cats = {}; orig.catNames = {}; for (const c of CAT_CHOICES) { orig.cats[c.id] = c.desc; orig.catNames[c.id] = c.name; }
    orig.patterns = Object.assign({}, CatModel.PATTERNS);
    const m = Chapters.byId.monster; orig.creatures = {}; orig.cnames = {}; if (m) for (const c of m.creatures) { orig.creatures[c.id] = c.type; orig.cnames[c.id] = c.name; }
  }

  const I18N = window.I18N = {
    lang: 'de',
    t(key, vars) {
      let s = (D[this.lang] && D[this.lang][key]) ?? D.de[key] ?? key;
      if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
      return s;
    },
    // „1 Freund“ statt „1 Freunde“ (Japanisch kennt keine Mehrzahl)
    friendWord(ch, n) {
      const SG = { de: { _: 'Freund', cafe: 'Café-Katze', monster: 'Monster' }, en: { _: 'friend', cafe: 'café cat', monster: 'monster' } }[this.lang];
      if (n === 1 && ch && ch.friendOne && ch.friendOne[this.lang]) return ch.friendOne[this.lang]; // neue Kapitel: eigene Einzahl
      if (n === 1 && SG) return SG[ch && ch.id] ?? SG._;
      return (ch && ch.friendWord) || this.t('friends');
    },
    LANGS: ['de', 'en', 'ja'],
    detect() { const l = (navigator.language || 'de').toLowerCase(); return l.startsWith('de') ? 'de' : l.startsWith('ja') ? 'ja' : 'en'; },
    set(lang) {
      this.lang = this.LANGS.includes(lang) ? lang : 'de';
      document.documentElement.lang = this.lang;
      snapshot();
      const E = DATA[this.lang] || null;
      for (const c of Chapters.list) {
        const o = orig.chapters[c.id], e = E && (E.chapters[c.id] || (c.i18n && c.i18n[this.lang])); // neue Kapitel bringen ihre Übersetzung selbst mit
        c.title = e ? e[0] : o[0]; c.desc = e ? e[1] : o[1];
        c.friendWord = e && e[2] ? e[2] : (E ? (o[2] ? this.t('friends') : undefined) : o[2]);
      }
      for (const s of SUSHI) s.name = E ? E.sushi[s.id] : orig.sushi[s.id];
      if (window.SHRINES) for (const s of SHRINES) s.name = (E && E.shrines && E.shrines[s.id]) || orig.shrines[s.id];
      for (const c of CAT_CHOICES) { c.desc = E ? E.cats[c.id] : orig.cats[c.id]; c.name = (E && E.catNames && E.catNames[c.id]) || orig.catNames[c.id]; }
      Object.assign(CatModel.PATTERNS, E ? E.patterns : orig.patterns);
      const m = Chapters.byId.monster; if (m) for (const c of m.creatures) { c.type = E ? E.creatures[c.id] : orig.creatures[c.id]; c.name = E ? E.creatureNames[c.id] : orig.cnames[c.id]; }
      this.applyDOM();
      dispatchEvent(new Event('langchange'));
    },
    // Hilfeleiste für Touch: jeder Eintrag bleibt zusammen (kein Umbruch zwischen Symbol und Wort)
    helpTouch() { return this.wrapHelp(this.t('helpTouch', { RUN: window.NEKO_RUN_SVG || '💨' })); },
    wrapHelp(html) { return html.split(/\s*&nbsp;\s*/).map(x => `<span class="hi">${x}</span>`).join(' '); },
    applyDOM() {
      document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = this.t(el.dataset.i18n); });
      const help = document.getElementById('help'); if (help) help.innerHTML = document.documentElement.classList.contains('touch-mode') ? this.helpTouch() : this.wrapHelp(this.t('help'));
      document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = this.t(el.dataset.i18nTitle); });
      document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', this.t(el.dataset.i18nAria)); });
      document.documentElement.style.setProperty('--rotate-msg', JSON.stringify(this.t('rotate')));
      const sel = document.getElementById('inPattern');
      if (sel) [...sel.options].forEach(o => { o.textContent = CatModel.PATTERNS[o.value] || o.textContent; });
    },
  };
  window.t = (k, v) => I18N.t(k, v);
})();
