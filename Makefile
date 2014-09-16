.PHONY: test-unit test-functional

MOCHA=./node_modules/mocha/bin/mocha -R spec

test-unit:
	$(MOCHA) ./test/unit

test-functional:
	$(MOCHA) ./test/functional
