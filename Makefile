dict: chaimdict
	ruby dictconv.rb < chaimdict.txt > dictdata.js

chaimdict:
	cd ../Gictionary; make chaimdict;
	/bin/cp ../Gictionary/chaimdict.txt .

webdict:
	wget https://scrapbox.io/api/pages/masui/dict/text -q -O - | ruby webdictconv.rb > webdictdata.js

#
# Chromeエクステンション公開用のzipを作る
# Dashboard
# https://chrome.google.com/webstore/developer/dashboard/g00750819356671613953?hl=ja
# https://chrome.google.com/webstore/detail/chaim/nbakiigeihdkfihjnahbagdahgoanedd?hl=ja
#
ZIPFILES=manifest.json chaim.js dictdata.js dict.js romakana.js webdictdata.js icons
zip:
	/bin/rm -f chaim.zip
	zip -r chaim.zip ${ZIPFILES}

clean:
	/bin/rm -r -f *~
