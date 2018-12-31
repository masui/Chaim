copy:
	cd ..; cp -r Chaim /home/masui/SD

dict:
	ruby dictconv.rb < dict.txt > dictdata.js

webdict:
	wget https://scrapbox.io/api/pages/masui/dict/text -q -O - | ruby webdictconv.rb > webdictdata.js

#
# Chromeエクステンション公開用のzipを作る
# Dashboard
# https://chrome.google.com/webstore/developer/dashboard/g00750819356671613953?hl=ja
#
ZIPFILES=manifest.json chaim.js dictdata.js dict.js romakana.js webdictdata.js icons
zip:
	/bin/rm -f chaim.zip
	zip -r chaim.zip ${ZIPFILES}

clean:
	/bin/rm -r -f *~
