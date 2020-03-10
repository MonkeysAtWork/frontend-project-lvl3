install: install-deps install-flow-typed

develop:
	npx webpack-dev-server

install-deps:
	npm install

start:
	npx webpack-dev-server --open

dev:
	rm -rf dist
	npx webpack

build:
	rm -rf dist
	NODE_ENV=production npx webpack

test:
	npm test

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
