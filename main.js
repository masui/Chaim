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

function searchAndShowCands(){
    candidates = [];
    search(pat,0,function(word,pat,connection){
	var newword = word.replace(/\*/g,'');
	if(candidates.indexOf(newword) < 0){
	    candidates.push(newword);
	}
    });
    selectedCand = -1;
    showCands();
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

	if (isRemappedEvent(keyData)) {
            console.log(keyData); // TODO eventually remove
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
	    if(keyData.type == "keydown" && keyData.key.match(/^[a-z,\-\.]$/)){
		if(selectedCand >= 0){
		    chrome.input.ime.commitText({
			"contextID": contextID,
			"text": selectedCand >= 0 ? candidates[selectedCand] : pat
		    });
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
		    chrome.input.ime.commitText({
			"contextID": contextID,
			"text": selectedCand >= 0 ? candidates[selectedCand] : pat
		    });
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

