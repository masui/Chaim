/*
 * 以下から借用
 * https://github.com/google/extra-keyboards-for-chrome-os/blob/master/capslockremap/background.js
 * (IME機能でCapsLockをCtrlにするもの)

 DOM event (Home, ArrowRight, etc.)
 https://www.w3.org/TR/uievents/

 */

var contextID = -1;

var lastRemappedKeyEvent = undefined;
var ctrlKey = false;

var japaneseMode = false;
var pat = "";              // 日本語入力パタン e.g. "masui"
var candidates = [];
var selectedCand = -1;
var convMode = 0;          // 0:前方一致 1:完全一致/ひらがな

chrome.input.ime.onFocus.addListener(function(context) {
    contextID = context.contextID;
});

chrome.input.ime.onBlur.addListener(function(context) {
    contextID = -1;
});

function isRemappedEvent(keyData) {  
    // hack, should check for a sender ID (to be added to KeyData)
    return lastRemappedKeyEvent != undefined &&
        (lastRemappedKeyEvent.key == keyData.key &&
         lastRemappedKeyEvent.code == keyData.code &&
         lastRemappedKeyEvent.type == keyData.type
        ); // requestID would be different so we are not checking for it  
}

var localdict = [];

function searchAndShowCands(){
    candidates = [];

    // storage.local.get()が非同期で呼ばれるのでasync-awaitを使う
    (async () => {
	//await getLocalDict();

	await chrome.storage.local.get(['localdict'], (result) => {
	    localdict = result.localdict;
	    if(localdict == undefined) localdict = [];
	});

	for(var i=0;i<localdict.length;i++){
	    var a = localdict[i].split("\t");
	    if(a[0].startsWith(pat)){
		if(candidates.indexOf(a[1]) < 0){
		    candidates.push(a[1]);
		}
	    }
	}

	search(pat,0,(word,pat,connection) => {
	    var newword = word.replace(/\*/g,'');
	    if(candidates.indexOf(newword) < 0){
		candidates.push(newword);
	    }
	});
	selectedCand = -1;
	showCands();
    })();
}

function showCands(){
    var candmenus = [];
    for(var i=selectedCand+1;i<selectedCand+4 && i<candidates.length;i++){
	candmenus.push({
	    candidate:candidates[i],
	    id:i
	});
    }
    chrome.input.ime.setCandidates({
	contextID:contextID,
	candidates:candmenus
    });
}

function fix(){ // 確定
    // ローカル辞書に登録
    if(selectedCand >= 0){
	var word = candidates[selectedCand];
	var localdict;
	var entry = `${pat}\t${word}`;
	chrome.storage.local.get(['localdict'], (result) => {
	    localdict = result.localdict;
	    if(localdict == undefined) localdict = [];
	    while(true){
		var pos = localdict.indexOf(entry);
		if(pos < 0) break;
		localdict.splice(pos,1);
	    }
	    if(localdict.length > 1000) localdict.pop();
	    localdict.unshift(entry);
	    chrome.storage.local.set({localdict: localdict}); // , function(){});
	});
    }

    chrome.input.ime.commitText({
	"contextID": contextID,
	"text": selectedCand >= 0 ? candidates[selectedCand] : pat
    });
}

function showComposition(text){
    var obj = {
	contextID: contextID,
	text: text,
	cursor: text.length,
	selectionStart: 0,
	selectionEnd: text.length
    };
    chrome.input.ime.setComposition(obj); // カーソル位置に未変換文字列をアンダーライン表示
}

chrome.input.ime.onKeyEvent.addListener(
    function(engineID, keyData) {
	var handled = false;

	console.log(`key = ${keyData.key}, code=${keyData.code}, control = ${keyData.ctrlKey}`);

	if (isRemappedEvent(keyData)) {
            // console.log(keyData); // TODO eventually remove
            return false;
	}

	//
	// セミコロンを改行キーに
	//
	if (keyData.key == ";" && keyData.code && !japaneseMode){
	    keyData.key = "Enter";
	    keyData.code = "Enter";
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    lastRemappedKeyEvent = keyData;
	    return true;
	}
	//
	// 右コントロールをセミコロンに
	//
	if (keyData.code == "ControlRight"){
	    keyData.ctrlKey = false;
	    if(keyData.shiftKey){
		keyData.key = ":";
		keyData.code = ":";
	    }
	    else {
		keyData.key = ";";
		keyData.code = ";";
	    }
	    keyData.shiftKey = false;
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    lastRemappedKeyEvent = keyData;
	    return true;
	}
	//
	// "`" をEscape (Ctrl-[)に
	//
	if (keyData.key == "`" && keyData.code){
	    keyData.key = "[";
	    keyData.code = "BracketLeft";
	    keyData.ctrlKey = true;
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    lastRemappedKeyEvent = keyData;
	    return true;
	}
	//
	// Escapeを"~"に
	//
	if (keyData.code == "Escape"){
	    if(keyData.shiftKey){
		keyData.key = "~";
		keyData.code = "~";
	    }
	    else {
		keyData.key = "`";
		keyData.code = "`";
	    }
	    keyData.shiftKey = false;
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    lastRemappedKeyEvent = keyData;
	    return true;
	}

	if (keyData.key == "Ctrl"){
	    ctrlKey = (keyData.type == "keydown");
            lastRemappedKeyEvent = keyData;
	    handled = false;
	    return false;
	}
	if (ctrlKey) {
	    if(keyData.key == "n"){
		keyData.ctrlKey = false;
		keyData.key = "Down";
		keyData.code = "ArrowDown";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "p"){
		keyData.ctrlKey = false;
		keyData.key = "Up";
		keyData.code = "ArrowUp";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "f"){
		keyData.ctrlKey = false;
		keyData.key = "Right";
		keyData.code = "ArrowRight";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "b"){
		keyData.ctrlKey = false;
		keyData.key = "Left";
		keyData.code = "ArrowLeft";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "a"){ // Ctrl-AでHomeキーを送る
		keyData.ctrlKey = false;
		keyData.code = "Home";
                chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "e"){ // Ctrl-EでEndキーを送る
		keyData.ctrlKey = false;
		keyData.code = "End";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
   	    }
	    else {
		keyData.ctrlKey = ctrlKey;
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
            lastRemappedKeyEvent = keyData;
            handled = true;
	    return handled;
	}

	if (keyData.type == "keydown" && keyData.code == "AltRight" && !japaneseMode){
	    japaneseMode = true;
	    chrome.input.ime.setCandidateWindowProperties({
		engineID:engineID,
		properties:{
		    visible:true,
		    cursorVisible:false,
		    vertical:true,
		    pageSize:3,
		    auxiliaryText: "Lexierra",
		    auxiliaryTextVisible: false
		}
	    });
	    pat = "";
	    handled = false;
	}
 	if (keyData.code == "ContextMenu"){
	    japaneseMode = true;
	    chrome.input.ime.setCandidateWindowProperties({
		engineID:engineID,
		properties:{
		    visible:true,
		    cursorVisible:false,
		    vertical:true,
		    pageSize:3,
		    auxiliaryText: "Lexierra",
		    auxiliaryTextVisible: false
		}
	    });
	    pat = "";
	    handled = true;
	}
	if (keyData.type == "keydown" && keyData.code == "AltLeft" && japaneseMode){
	    japaneseMode = false;
	    chrome.input.ime.setCandidateWindowProperties({
		engineID:engineID,
		properties:{
		    visible:false
		}
	    });
	    fix();
	    candidates = [];
	    selecteCand = -1;
	    pat = "";
	    handled = false;
	}
	if (keyData.code == "MetaLeft"){
	    console.log("type = " + keyData.type);
	    japaneseMode = false;
	    chrome.input.ime.setCandidateWindowProperties({
		engineID:engineID,
		properties:{
		    visible:false
		}
	    });
	    fix();
	    candidates = [];
	    selecteCand = -1;
	    pat = "";
	    handled = true;
	}

	// 日本語入力処理

	if(japaneseMode){
	    //if(keyData.type == "keydown" && keyData.key == "." && pat.length > 0 && convMode == 0){
	    if(keyData.type == "keydown" && keyData.key == "." && pat.length > 0){
		//
		// 読みの後でピリオドを入力するとGoogle検索する
		//
		showComposition(pat);

		var url = "http://google.com/transliterate?langpair=ja-Hira|ja&text=" + roma2hiragana(pat);
		fetch(url).then(function(response){
		    return response.json();
		}).catch(function(){
		    console.log("error caught at fetch()!");
		}).then(function(data){
		    candidates = [];
		    for(var i=0;i<data[0][1].length;i++){
			var word = data[0][1][i];
			if(candidates.indexOf(word) < 0){
			    candidates.push(word);
			}
		    }
		    selectedCand = -1;
		    showComposition(pat);
		    showCands();
		    
		});
		handled = true;
	    }
	    else if(keyData.type == "keydown" && keyData.key.match(/^[a-z0-9,'\-\.\{\}\(\)]$/)){
		if(selectedCand >= 0){
		    fix();
		    pat = keyData.key;
		    showComposition(pat);
		    searchAndShowCands();
		}
		else {
		    pat += keyData.key;
		    showComposition(pat);
		    searchAndShowCands();
		}
		handled = true;
	    }
	    if(keyData.type == "keydown" && keyData.key == " "){
		if(candidates.length > 0 && selectedCand < candidates.length-1){
		    selectedCand += 1;
		    showComposition(candidates[selectedCand]);
		    showCands();
		    handled = true;
		}
	    }
	    if(keyData.type == "keydown" && (keyData.key == "Enter" || keyData.key == ";")){
		if(candidates.length > 0 && selectedCand >= 0){
		    fix();
		    pat = "";
		    candidates = [];
		    selectedCand = -1;
		    convMode = 0;
		    handled = true;
		}
		else if(pat.length > 0){
		    candidates = [];
		    candidates.push(roma2hiragana(pat));
		    candidates.push(roma2katakana(pat));
		    search(pat,1,function(word,pat,connection){
			var newword = word.replace(/\*/g,'');
			if(candidates.indexOf(newword) < 0){
			    candidates.push(newword);
			}
		    });
		    selectedCand = 0;
		    convMode = 1;
		    showComposition(candidates[0]);
		    showCands();
		    handled = true;
		}
		else {
		    keyData.key = "Enter";
		    keyData.code = "Enter";
		    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
		    lastRemappedKeyEvent = keyData;
		    pat = "";
		    candidates = [];
		    selectedCand = -1;
		    convMode = 0;
		    showCands();
		    handled = true;
		}
	    }
	    if(keyData.type == "keydown" && keyData.key == "Backspace"){
		if(selectedCand >= 0){
		    selectedCand -= 1;
		    if(selectedCand < 0){
			showComposition(pat);
		    }
		    else {
			showComposition(candidates[selectedCand]);
		    }
		    showCands();
		    handled = true;
		}
		else if(pat.length > 0){
		    pat = pat.substring(0,pat.length-1);
		    showComposition(pat);
		    searchAndShowCands();
		    handled = true;
		}
		else {
		    candidates = [];
		    selectedCand = -1;
		    convMode = 0;
		    showCands();
		    handled = false;
		}
	    }
	}
	
	return handled;
    }
);

