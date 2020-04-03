import '@babel/polyfill';
import axios from 'axios';
import _ from 'lodash';
import * as yup from 'yup';

import view from './view';


const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const makeAutoRequestLoop = (func, ms) => wait(ms)
  .then(func)
  .then(() => makeAutoRequestLoop(func, ms))
  .catch(() => makeAutoRequestLoop(func, ms));


const validate = value => yup.string().url().validate(value);


const makeRequest = (url) => {
  const prefixURL = 'https://cors-anywhere.herokuapp.com';
  const proxy = axios.create({
    baseURL: prefixURL,
  });
  const promise = proxy.get(`/${url}`)
    .then(response => response.data)
    .catch((err) => {
      console.log(err.message);
      throw new Error('errors.unreachableURL');
    });
  return promise;
};


const isRSS = doc => doc.documentElement.tagName === 'rss';

const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (!isRSS(doc)) {
    throw new Error('errors.notTargetURL');
  }
  const title = doc.querySelector('title').textContent;
  const description = doc.querySelector('description').textContent;

  const items = doc.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const link = item.querySelector('link').textContent;
    const content = item.querySelector('description').textContent;
    return { link, content };
  });
  return { title, description, posts };
};


const addIdToPostsList = (posts, id) => posts.map(post => ({ ...post, id }));


const getNewPosts = (feed, postsList) => {
  const { url, id } = feed;
  return makeRequest(url)
    .then((data) => {
      const { posts } = parseRSS(data);
      const addingPosts = postsList.filter(post => post.id === id);
      const newPosts = _.differenceBy(posts, addingPosts, 'link');
      return addIdToPostsList(newPosts, id);
    })
    .catch(() => []);
};


export default () => {
  const state = {
    form: {
      url: '',
      formState: 'filling',
      errors: null,
    },
    feedsList: [],
    postsList: [],
  };


  const handleInput = (e) => {
    const { value } = e.target;
    state.form.url = value;
    validate(value)
      .then(() => {
        state.form.errors = null;
      })
      .catch(() => {
        state.form.errors = 'errors.invalidURL';
      });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    const { url } = state.form;
    state.form.formState = 'processing';
    makeRequest(url)
      .then((data) => {
        const { title, description, posts } = parseRSS(data);
        const wasAddBefore = _.some(state.feedsList, { title });
        if (wasAddBefore) {
          throw new Error('errors.repeatURL');
        }
        const id = _.uniqueId();
        const newFeed = { title, description, id, url }; // eslint-disable-line object-curly-newline
        const newPosts = addIdToPostsList(posts, id);

        state.feedsList.unshift(newFeed);
        state.postsList.unshift(...newPosts);
        state.form.url = '';
        state.form.formState = 'filling';
      })
      .catch((err) => {
        state.form.formState = 'filling';
        state.form.errors = err.message;
      });
  };


  const updateFeeds = () => {
    const newPostsPromises = state.feedsList.map(feed => getNewPosts(feed, state.postsList));
    Promise.all(newPostsPromises)
      .then(allNewPosts => allNewPosts
        .filter(posts => posts.length > 0)
        .forEach(posts => state.postsList.unshift(...posts)));
  };


  makeAutoRequestLoop(updateFeeds, 5000);
  view(state, handleInput, handleSubmit);
};
