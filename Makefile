copy:
	cd ..; cp -r Lexierra /home/masui/SD

dict:
	ruby dictconv.rb < dict.txt > dictdata.js
