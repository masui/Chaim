function search(pat,searchmode,callback){
    console.log(pat);
    generateCand(pat, searchmode, callback, null, "", "");
}

function generateCand(pat, searchmode, callback, connection, foundword, foundpat){
    // これまでマッチした文字列がfoundword,foundpatに入っている
    var d = (connection ? connectionLink[connection] : keyLink[pat.charCodeAt(0)]);
    while(d != null && d != undefined){
	if(pat == dictData[d][0]){ // 完全一致
            callback(foundword+dictData[d][1], foundpat+dictData[d][1], dictData[d][3] /* outConnection */);
	}
	else if(dictData[d][0].startsWith(pat)){ // 先頭一致
	    if(searchmode == 0){
		callback(foundword+dictData[d][1], foundpat+dictData[d][0], dictData[d][3]);
	    }
	}
	// else if(_searchmode == 0 && pat.startsWith(dictData[d][0])){ // connectionがあるかも
	else if(pat.startsWith(dictData[d][0])){ // connectionがあるかも
            var restpat = pat.substring(dictData[d][0].length,pat.length);
	    if(dictData[d][3] != 0){
		generateCand(restpat, searchmode, callback, dictData[d][3], foundword+dictData[d][1], foundpat+dictData[d][0]);
	    }
	}
	d = (connection ? dictData[d][5] : dictData[d][4]);
    }
}

function generateCandxxx(pat, searchmode, callback, connection, foundword, foundpat){
    // これまでマッチした文字列がfoundword,foundpatに入っている
    var d = (connection ? connectionLink[connection] : keyLink[pat.charCodeAt(0)]);
    console.log("pat = " + pat);
    console.log("d ==== " + d);
    if(d != null && d != undefined){
	console.log("-----");
	console.log(dictData[d]);
    }
    return;
    while(d != null && d != undefined){
	if(pat == dictData[d].pat){ // 完全一致
            callback(foundword+dictData[d].word, foundpat+dictData[d].word, dictData[d].out /* outConnection */);
	}
	else if(dictData[d].pat.startsWith(pat)){ // 先頭一致
	    if(searchmode == 0){
		callback(foundword+dictData[d].word, foundpat+dictData[d].pat, dictData[d].out);
	    }
	}
	// else if(_searchmode == 0 && pat.startsWith(dictData[d][0])){ // connectionがあるかも
	else if(pat.startsWith(dictData[d].pat)){ // connectionがあるかも
            var restpat = pat.substring(dictData[d].pat.length,pat.length);
	    if(dictData[d].out != 0){
		generateCand(restpat, searchmode, callback, dictData[d].out, foundword+dictData[d].word, foundpat+dictData[d].pat);
	    }
	}
	d = (connection ? dictData[d].clink : dictData[d].klink);
    }
}

