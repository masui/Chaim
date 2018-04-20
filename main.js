/*
Copyright 2014 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var contextID = -1;
var lastRemappedKeyEvent = undefined;
var ctrlKey = false;

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

chrome.input.ime.onKeyEvent.addListener(
    function(engineID, keyData) {
	var handled = false;

	if (isRemappedEvent(keyData)) {
            console.log(keyData); // TODO eventually remove
            return false;
	}

	if (keyData.key == ";" && keyData.code){
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

	if (keyData.key == "Ctrl"){
            //keyData.code = "ControlLeft";
            //keyData.ctrlKey = (keyData.type == "keydown");
            //ctrlKey = keyData.ctrlKey;
	    ctrlKey = (keyData.type == "keydown");
            // keyData.capsLock = false;
            // chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
            lastRemappedKeyEvent = keyData;
	    handled = false;
	} else if (ctrlKey) {
	    if(keyData.key == "n"){
		keyData.ctrlKey = false;
		//keyData.capsLock = false;
		keyData.key = "Down";
		keyData.code = "ArrowDown";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "p"){
		keyData.ctrlKey = false;
		//keyData.capsLock = false;
		keyData.key = "Up";
		keyData.code = "ArrowUp";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "f"){
		keyData.ctrlKey = false;
		//keyData.capsLock = false;
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
	    /*
	    else if(keyData.key == "a"){
		keyData.ctrlKey = true;
		keyData.code = "ArrowLeft";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	    else if(keyData.key == "e"){
		keyData.ctrlKey = true;
		keyData.code = "ArrowRight";
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
	     */
	    else {
		keyData.ctrlKey = ctrlKey;
		//keyData.capsLock = false;
		chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [keyData]});
	    }
            lastRemappedKeyEvent = keyData;
            handled = true;
	}
	
	return handled;
    }
);
