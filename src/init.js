import '@babel/polyfill';
import axios from 'axios';
import { watch } from 'melanke-watchjs';
import * as yup from 'yup';
import _ from 'lodash';

export default () => {
  const state = {
    form: {
      url: '',
      formState: 'filling',
      errors: [],
    },
    feedsList: [],
    postsList: [],
  };


  const formElement = document.querySelector('#rssAddForm');
  const submitButton = document.querySelector('.btn');
  const feedbackDiv = document.querySelector('#feedback');
  const feedsConteiner = document.querySelector('#feeds');
  const postsConteiner = document.querySelector('#news');

  const spinner = document.createElement('span');
  spinner.classList.add('spinner-border', 'text-success', 'spinner-border-sm');


  const validate = value => yup.string().url().validate(value);

  const inputHandler = (e) => {
    const { value } = e.target;
    state.form.url = value;
    // state.form.formState = 'filling';
    validate(value)
      .then(() => {
        state.form.errors = [];
      })
      .catch(() => {
        state.form.errors = ['URL is not correct'];
      });
  };


  const parseXML = (xml) => {
    const title = xml.querySelector('title').textContent;
    const descriprion = xml.querySelector('description').textContent;
    const feed = { title, descriprion };

    const items = xml.querySelectorAll('item');
    const posts = [...items].map((item) => {
      const link = item.querySelector('link').textContent;
      const post = item.querySelector('description').textContent;
      return { link, post };
    });
    return { feed, posts };
  };

  const proxyURL = 'https://cors-anywhere.herokuapp.com/';

  const submitHandler = (e) => {
    e.preventDefault();
    state.form.formState = 'processing';
    axios.get(`${proxyURL}${state.form.url}`)
      .then((response) => {
        // console.log(response.status);
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'application/xml');
        if (doc.documentElement.tagName !== 'rss') {
          state.form.formState = 'filling';
          state.form.errors = ['No feeds were found for this URL'];
          return;
        }
        const { feed, posts } = parseXML(doc);
        if (_.some(state.feedsList, feed)) {
          state.form.formState = 'filling';
          state.form.errors = ['this feed already was added'];
          return;
        }
        state.feedsList.push(feed);
        state.postsList.push(...posts);
        state.form.formState = 'filling';
        // state.form.errors = [];
        state.form.url = '';
      })
      .catch((err) => {
        console.log(err);
        state.form.formState = 'filling';
        state.form.errors = ['URL is not unreachable'];
      });
  };

  formElement.addEventListener('submit', submitHandler);
  formElement.addEventListener('input', inputHandler);

  watch(state.form, 'formState', () => {
    const { formState } = state.form;
    // console.log(formState);
    if (formState === 'processing') {
      formElement.elements.link.disabled = true;
      submitButton.prepend(spinner);
    } else {
      formElement.elements.link.disabled = false;
      spinner.remove();
    }
  });

  watch(state.form, ['errors', 'url'], () => {
    // console.log(state.form.formState);
    if (state.form.errors.length > 0) {
      const [error] = state.form.errors;
      feedbackDiv.innerHTML = error;
      formElement.elements.link.classList.add('is-invalid');
      submitButton.disabled = true;
      formElement.elements.link.focus();
    } else {
      formElement.elements.link.classList.remove('is-invalid');
      feedbackDiv.innerHTML = '';
      const { url } = state.form;
      submitButton.disabled = !url;
    }
    formElement.elements.link.value = state.form.url;
  });


  watch(state, 'feedsList', () => {
    feedsConteiner.textContent = '';
    const ulForFeeds = document.createElement('ul');
    ulForFeeds.classList.add('list-group', 'list-group-flush');
    feedsConteiner.append(ulForFeeds);

    state.feedsList.forEach(({ title, descriprion }) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      li.textContent = `${title} - ${descriprion}`;
      ulForFeeds.append(li);
    });

    postsConteiner.textContent = '';
    const ulForPosts = document.createElement('ul');
    ulForPosts.classList.add('list-group', 'list-group-flush');
    postsConteiner.append(ulForPosts);

    state.postsList.forEach(({ link, post }) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      const a = document.createElement('a');
      a.href = link;
      a.textContent = post;
      li.append(a);
      ulForPosts.append(li);
    });
  });
};
