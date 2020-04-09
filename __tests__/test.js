import nock from 'nock';
import path from 'path';
import fs from 'fs';
import { html } from 'js-beautify';

import run from '../src/application';


nock.disableNetConnect();

const fixturesPath = path.join(__dirname, '__fixtures__');


const response = fs.readFileSync(path.join(fixturesPath, 'rss_0.xml'), 'utf-8');
const url = 'http://www.test.com';
const inputEvent = new Event('input', { bubbles: true });
const submitEvent = new Event('submit');
let form;
let input;


const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));
const getTree = () => html(document.body.innerHTML);

const inputValue = (value) => {
  input.value = value;
  input.dispatchEvent(inputEvent);
  return delay(50);
};

const submitForm = () => {
  form.dispatchEvent(submitEvent);
  return delay(300);
};

nock('https://cors-anywhere.herokuapp.com')
  // .log(console.log)
  .get(/undefined$/)
  .replyWithError('some error')
  .get(/404$/)
  .reply(404)
  .get(/nofeed$/)
  .reply(200, '<!doctype html><html><head></head><body></body></html>')
  .get(/feed$/)
  .twice()
  .reply(200, response);


beforeEach(() => {
  const initHtml = fs.readFileSync(path.join(fixturesPath, 'index.html'), 'utf-8');
  document.documentElement.innerHTML = initHtml;
  run();
  form = document.querySelector('#rssAddForm');
  input = form.elements.link;
});


test('invalid URL', () => inputValue('uncorrect')
  .then(() => expect(getTree()).toMatchSnapshot()));


test('uncorrect URL', () => inputValue(`${url}/undefined`)
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(submitForm)
  .then(() => expect(getTree()).toMatchSnapshot()));


test('network error', () => inputValue(`${url}/404`)
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(submitForm)
  .then(() => expect(getTree()).toMatchSnapshot()));


test('no feed on URL', () => inputValue(`${url}/nofeed`)
  .then(submitForm)
  .then(() => expect(getTree()).toMatchSnapshot()));


test('correct URL twice', () => inputValue(`${url}/feed`)
  .then(submitForm)
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => inputValue(`${url}/feed`))
  .then(() => expect(getTree()).toMatchSnapshot()));
