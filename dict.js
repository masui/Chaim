var _searchmode;
var _candidates;

function search(pat,searchmode,callback){
    _searchmode = searchmode;
    _candidates = [];
    generateCand(null, pat, "", "", callback);
}

function generateCand(connection, pat, foundword, foundpat, callback){
    // これまでマッチした文字列がfoundword,foundpatに入っている
    var d = (connection ? connectionLink[connection] : keyLink[pat.charCodeAt(0)]);
    while(d != null){
	if(pat == dictData[d][0]){ // 完全一致
            callback(foundword+dictData[d][1], foundpat+dictData[d][1], dictData[d][3] /* outConnection */);
	}
	else if(dictData[d][0].startsWith(pat)){ // 先頭一致
	    if(_searchmode == 0){
		callback(foundword+dictData[d][1], foundpat+dictData[d][0], dictData[d][3]);
	    }
	}
	else if(_searchmode == 0 && pat.startsWith(dictData[d][0])){ // connectionがあるかも
            var restpat = pat.substring(dictData[d][0].length,pat.length);
            generateCand(dictData[d][3], restpat, foundword+dictData[d][1], foundpat+dictData[d][0], callback);
	}
	d = (connection ? dictData[d][5] : dictData[d][4]);
    }
}



