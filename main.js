/*
 * 以下から借用
 * https://github.com/google/extra-keyboards-for-chrome-os/blob/master/capslockremap/background.js
 * (IME機能でCapsLockをCtrlにするもの)
 */

var contextID = -1;

var lastRemappedKeyEvent = undefined;
var ctrlKey = false;

var japaneseMode = false;
var pat = "";              // 日本語入力パタン e.g. "masui"
var candidates = [];
var selectedCand = -1;
var convMode = 0;          // 0:前方一致 1:完全一致/ひらがな

var selectionTime = new Date;

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

var localdict;

//function getLocalDict(){
//    return new Promise(
//function(resolve){
//	    console.log("chrome.storage");
//	    chrome.storage.local.get(['localdict'], function(result) {
//		localdict = result.localdict;
//		if(localdict == undefined) localdict = [];
//		console.log("localdict read end");
//		resolve('');
//	    });
//	});
//}

function searchAndShowCands(){
    candidates = [];

//    curTime = new Date;
//    console.log(curTime);
//    if(curTime - selectionTime < 10 * 1000){
//    }

    // storage.local.get()が非同期で呼ばれるのでasync-awaitを使う
    (async function(){
	//await getLocalDict();

	await chrome.storage.local.get(['localdict'], function(result) {
	    localdict = result.localdict;
	    if(localdict == undefined) localdict = [];
	});

	/* DBを使ってみたけど動かない
	await chrome.storage.local.get(['selection'], function(result) {
	    var selection = result.selection;
	    console.log(`selection=${selection}`);
	    if(selection) candidates.push(selection);
	});
	 */

	for(var i=0;i<localdict.length;i++){
	    var a = localdict[i].split("\t");
	    if(a[0].startsWith(pat)){
		if(candidates.indexOf(a[1]) < 0){
		    candidates.push(a[1]);
		}
	    }
	}
	
	search(pat,0,function(word,pat,connection){
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
	chrome.storage.local.get(['localdict'], function(result) {
	    localdict = result.localdict;
	    if(localdict == undefined) localdict = [];
	    while(true){
		var pos = localdict.indexOf(entry);
		if(pos < 0) break;
		localdict.splice(pos,1);
	    }
	    if(localdict.length > 1000) localdict.pop();
	    localdict.unshift(entry);
	    chrome.storage.local.set({localdict: localdict}, function(){});
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

document.addEventListener("selectionchange", function() {
    selectionTime = new Date;
    console.log('Selection changed.'); 
});


chrome.input.ime.onKeyEvent.addListener(
    function(engineID, keyData) {
	var handled = false;

	if (isRemappedEvent(keyData)) {
            // console.log(keyData); // TODO eventually remove
            return false;
	}

	if (keyData.key == ";" && keyData.code && !japaneseMode){
	    keyData.key = "Enter";
	    keyData.code = "Enter";
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    lastRemappedKeyEvent = keyData;
	    handled = true;
	}
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
	    handled = true;
	}
	/*
	if (keyData.key == "`" && keyData.code){
	    keyData.key = "Escape";
	    keyData.code = "Escape";
	    keyData.ctrlKey = true;
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    lastRemappedKeyEvent = keyData;
	    handled = true;
	    return true;
	}
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
	    handled = true;
	}
	 */

	if (keyData.key == "Ctrl"){
	    ctrlKey = (keyData.type == "keydown");
            lastRemappedKeyEvent = keyData;
	    handled = false;
	} else if (ctrlKey) {
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
	    else {
		keyData.ctrlKey = ctrlKey;
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
            lastRemappedKeyEvent = keyData;
            handled = true;
	}
	/*
	if (ctrlKey && keyData.key == "a"){
	    keyData.ctrlKey = false;
	    keyData.key = "Left";
	    keyData.code = "ArrowLeft";
	    chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    handled = false;
	}
	 */

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
	if (keyData.type == "keydown" && keyData.code == "AltLeft" && japaneseMode){
	    japaneseMode = false;
	    chrome.input.ime.setCandidateWindowProperties({
		engineID:engineID,
		properties:{
		    visible:false
		}
	    });
	    pat = "";
	    handled = false;
	}

	// 日本語入力処理

	if(japaneseMode){
	    if(keyData.type == "keydown" && keyData.key == "." && pat.length > 0 && convMode == 0){
		//
		// 読みの後でピリオドを入力するとGoogle検索する
		//

		showComposition(pat);

		var hira = roma2hiragana(pat);
		var url = "http://google.com/transliterate?langpair=ja-Hira|ja&text=" + hira;
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

		/*
		var jsonRequest = new XMLHttpRequest();
		jsonRequest.onreadystatechange = function() {
		    if ((jsonRequest.readyState === 4) && (jsonRequest.status === 200)) {
			var data = JSON.parse(jsonRequest.responseText);
			console.log(data);
			candidates = [];
			for(var i=0;i<data[0][1].length;i++){
			    if(candidates.indexOf(data[0][1][i]) < 0){
				candidates.push(data[0][1][i]);
			    }
			}
			selectedCand = -1;
			showComposition(pat);
			showCands();
		    }
		};
		var hira = roma2hiragana(pat);
		jsonRequest.open("GET",`http://google.com/transliterate?langpair=ja-Hira|ja&text=${hira}`, true);
		jsonRequest.send(null);

		showComposition(pat);
		handled = true;
		 */
	    }
	    else if(keyData.type == "keydown" && keyData.key.match(/^[a-z,\-\.\{\}\(\)]$/)){
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

