install: install-deps

install-deps:
	npm ci

develop:
	npx webpack-dev-server --open

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test

test-watch:
	npm test -- --watchAll

test-coverage:
	npm test -- --coverage

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
