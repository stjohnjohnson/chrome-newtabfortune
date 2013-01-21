build:
	@mkdir -p build
	@rm build/NewTabFortune.zip
	@zip -r build/NewTabFortune.zip * -x "screenshots*" Makefile Readme.md .gitignore "build*" "*.DS_Store"

.PHONY: build