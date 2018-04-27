copy:
	cd ..; cp -r Chaim /home/masui/SD

dict:
	ruby dictconv.rb < dict.txt > dictdata.js

webdict:
	wget https://scrapbox.io/api/pages/masui/dict/text -q -O - | ruby webdictconv.rb > webdictdata.js
