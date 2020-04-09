import '@babel/polyfill';
import axios from 'axios';
import _ from 'lodash';
import * as yup from 'yup';
import normalizeUrl from 'normalize-url';
import i18next from 'i18next';

import resources from './locales';
import view from './view';


const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeAutoRequestLoop = (func, ms) => wait(ms)
  .then(func)
  .then(() => makeAutoRequestLoop(func, ms))
  .catch(() => makeAutoRequestLoop(func, ms));


const isEqualsUrls = (a, b, options = {}) => {
  if (a === b) {
    return true;
  }
  return normalizeUrl(a, options) === normalizeUrl(b, options);
};

const validate = (value, feedsList) => yup.string().url().validate(value)
  .catch(() => {
    throw new Error('form.errors.invalidURL');
  })
  .then((url) => {
    const wasAddBefore = feedsList.some((feed) => (
      isEqualsUrls(url, feed.url, { stripProtocol: true })));
    if (wasAddBefore) {
      throw new Error('form.errors.repeatURL');
    }
    return url;
  });


const prefixURL = 'https://cors-anywhere.herokuapp.com';

const makeRequest = (url) => axios.get(`${prefixURL}/${url}`)
  .then((response) => response.data)
  .catch((err) => {
    console.log(err.message);
    throw new Error('form.errors.unreachableURL');
  });


const isRSS = (doc) => doc.documentElement.tagName === 'rss';

const parseRSS = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (!isRSS(doc)) {
    throw new Error('form.errors.notTargetURL');
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


const addIdToPostsList = (posts, id) => posts.map((post) => ({ ...post, id }));

const getNewPosts = (feed, postsList) => {
  const { url, id } = feed;
  return makeRequest(url)
    .then((data) => {
      const { posts } = parseRSS(data);
      const addingPosts = postsList.filter((post) => post.id === id);
      const newPosts = _.differenceBy(posts, addingPosts, 'link');
      return addIdToPostsList(newPosts, id);
    })
    .catch(() => []);
};


export default () => {
  i18next.init({
    lng: 'en',
    resources,
  }).then(() => {
    const state = {
      form: {
        formState: 'empty',
        valid: false,
        error: null,
      },
      feedsList: [],
      postsList: [],
    };


    const handleInput = (e) => {
      const { value } = e.target;
      if (!value) {
        state.form.formState = 'empty';
        state.form.error = null;
        state.form.valid = false;
        return;
      }
      state.form.formState = 'filling';
      validate(value, state.feedsList)
        .then(() => {
          state.form.error = null;
          state.form.valid = true;
        })
        .catch((err) => {
          state.form.error = err.message;
          state.form.valid = false;
        });
    };


    const handleSubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const url = formData.get('link');
      state.form.formState = 'processing';
      makeRequest(url)
        .then((data) => {
          const { title, description, posts } = parseRSS(data);
          const id = _.uniqueId();
          const newFeed = { title, description, id, url }; // eslint-disable-line object-curly-newline, max-len
          const newPosts = addIdToPostsList(posts, id);

          state.feedsList.unshift(newFeed);
          state.postsList.unshift(...newPosts);
          state.form.formState = 'empty';
          state.form.valid = false;
        })
        .catch((err) => {
          state.form.formState = 'filling';
          state.form.valid = false;
          state.form.error = err.message;
        });
    };


    const updateFeeds = () => {
      const newPostsPromises = state.feedsList.map((feed) => getNewPosts(feed, state.postsList));
      Promise.all(newPostsPromises)
        .then((allNewPosts) => allNewPosts
          .filter((posts) => posts.length > 0)
          .forEach((posts) => state.postsList.unshift(...posts)));
    };


    makeAutoRequestLoop(updateFeeds, 5000);
    view(state, handleInput, handleSubmit, i18next);
  });
};
