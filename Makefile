install: install-deps install-flow-typed

develop:
	npx webpack-dev-server

install-deps:
	npm install

start:
	npm run start

dev:
	rm -rf dist
	npm run dev

build:
	rm -rf dist
	npm run build

test:
	npm test

test-watch:
	npm run watch

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
