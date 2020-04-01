import nock from 'nock';
import path from 'path';
import fs from 'fs';
import { html } from 'js-beautify';

import run from '../src/application';


nock.disableNetConnect();

const fixturesPath = path.join(__dirname, '__fixtures__');

beforeAll(() => {
  const pathToTemplate = path.join(__dirname, '..', 'template.html');
  const pathToIndex = path.join(fixturesPath, 'index.html');
  fs.copyFileSync(pathToTemplate, pathToIndex);
});

const initHtml = fs.readFileSync(path.join(fixturesPath, 'index.html'), 'utf-8');
document.documentElement.innerHTML = initHtml;
run();


const response = fs.readFileSync(path.join(fixturesPath, 'rss_0.xml'), 'utf-8');
const response2 = fs.readFileSync(path.join(fixturesPath, 'rss_1.xml'), 'utf-8');
const response3 = fs.readFileSync(path.join(fixturesPath, 'rss_2.xml'), 'utf-8');

const form = document.querySelector('#rssAddForm');
const input = form.elements.link;
const url = 'http://www.test.com';
const inputEvent = new Event('input', { bubbles: true });
const submitEvent = new Event('submit');


const delay = time => new Promise(resolve => setTimeout(resolve, time));
const getTree = () => html(document.body.innerHTML);

const inputValue = (value) => {
  input.value = value;
  input.dispatchEvent(inputEvent);
  return delay(10);
};

const submitForm = () => {
  form.dispatchEvent(submitEvent);
  return delay(300);
};

nock('https://cors-anywhere.herokuapp.com')
  // .log(console.log)
  .get(/auto$/)
  .twice()
  .reply(200, response)
  .get(/auto$/)
  .reply(200, response2)
  .get(/auto$/)
  .replyWithError('some error')
  .get(/auto$/)
  .reply(200, response3);


test('auto request', () => inputValue(`${url}/auto`).then(submitForm)
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => delay(5200))
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => delay(5200))
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => delay(5200))
  .then(() => expect(getTree()).toMatchSnapshot())
  .then(() => delay(5200))
  .then(() => expect(getTree()).toMatchSnapshot()), 30000);
