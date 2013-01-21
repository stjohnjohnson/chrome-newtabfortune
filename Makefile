manifest.json: fortune.html fortune.js icon*.png fortunes/*
	@mkdir -p build
	@zip -r build/NewTabFortune.zip * -x "screenshots*" Makefile Readme.md .gitignore