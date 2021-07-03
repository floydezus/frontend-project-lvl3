import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import _ from 'lodash';
import i18n from 'i18next';
import parser from './parser.js';
import resources from './locales';

const proxyServ = 'https://hexlet-allorigins.herokuapp.com/get?url=';

const app = async () => {
  const state = {
    inputRSSForm: {
      valid: false,
      process: 'filling',
      processError: null,
      errors: {},
    },
    dataRss: {
      feeds: [],
      posts: [],
    },
  };

  const defaultLanguage = 'ru';
  // каждый запуск приложения создаёт свой собственный объект i18n и работает с ним,
  // не меняя глобальный объект.
  const i18nInstance = i18n.createInstance();
  await i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  yup.setLocale({
    mixed: {
      required: i18nInstance.t('messages.errors.required'),
    },
    string: {
      url: i18nInstance.t('messages.errors.validation'),
    },
  });

  const schema = yup.object().shape({
    url: yup.string().required().url(),
  });

  const validateURL = (fields) => {
    try {
      schema.validateSync(fields, { abortEarly: false });
      return {};
    } catch (e) {
      // console.log('CATCH ERRORS');
      return _.keyBy(e.inner, 'path');
    }
  };

  const errorMessages = {
    network: {
      // error: 'Network Problems. Try again.',
      error: i18nInstance.t('messages.errors.network'),
    },
    parsing: {
      // error: 'Ресурс не содержит валидный RSS.',
      error: i18nInstance.t('messages.errors.invalidrss'),
    },
  };

  const formSubmit = document.querySelector('.rss-form');
  const submitButton = document.querySelector('button[type="submit"]');
  const inputUrl = document.querySelector('#urlInput');
  const divURL = document.querySelector('#divUrl');
  const divFeeds = document.querySelector('.feeds');
  const divPosts = document.querySelector('.posts');

  const renderErrors = (element, errors) => { // refactoring
    const elementError = element;
    const error = errors[elementError.name];
    // console.log(error);
    const feedbackError = divURL.querySelector('.feedback');
    if (feedbackError) {
      feedbackError.remove();
      elementError.classList.remove('is-invalid');
    }
    if (!error) {
      return;
    }
    const feedbackElement = document.createElement('div');
    feedbackElement.classList.add('feedback', 'text-danger', 'position-absolute', 'small');
    feedbackElement.innerHTML = error.message;
    elementError.classList.add('is-invalid');
    divURL.appendChild(feedbackElement);
  };

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'accepted':
        submitButton.disabled = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const renderPosts = (postsObj, rootEl) => {
    const rootPosts = rootEl;
    rootPosts.innerHTML = '';
    const cardPosts = document.createElement('div');
    cardPosts.classList.add('card', 'border-0');
    rootPosts.appendChild(cardPosts);
    const bodyPosts = document.createElement('div');
    bodyPosts.classList.add('card-body');
    cardPosts.appendChild(bodyPosts);
    const titlePosts = document.createElement('h2');
    titlePosts.classList.add('card-title');
    titlePosts.textContent = i18nInstance.t('interface.fields.posts');
    bodyPosts.appendChild(titlePosts);
    const groupListPosts = document.createElement('ul');
    groupListPosts.classList.add('list-group');
    cardPosts.appendChild(groupListPosts);

    postsObj.forEach((obj) => {
      const { posts } = obj;
      posts.forEach(({ title, link }) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
        groupListPosts.appendChild(listItem);
        const id = _.uniqueId();
        const linkElem = document.createElement('a');
        linkElem.classList.add('fw-bold');
        linkElem.href = link;
        linkElem.textContent = title;
        linkElem.setAttribute('data-id', id);
        listItem.appendChild(linkElem);

        const buttonElem = document.createElement('button');
        buttonElem.classList.add('btn', 'btn-outline-primary', 'btn-sm');
        buttonElem.textContent = i18nInstance.t('interface.buttons.view');
        buttonElem.setAttribute('data-id', id);
        buttonElem.setAttribute('data-bs-toggle', 'modal');
        buttonElem.setAttribute('data-bs-target', '#modal');
        listItem.appendChild(buttonElem);
      });
    });
  };

  const renderFeeds = (feeds, rootEl) => {
    const rootFeeds = rootEl;
    rootFeeds.innerHTML = '';
    const cardFeeds = document.createElement('div');
    cardFeeds.classList.add('card', 'border-0');
    rootFeeds.appendChild(cardFeeds);
    const bodyFeeds = document.createElement('div');
    bodyFeeds.classList.add('card-body');
    cardFeeds.appendChild(bodyFeeds);
    const titleFeeds = document.createElement('h2');
    titleFeeds.classList.add('card-title');
    titleFeeds.textContent = i18nInstance.t('interface.fields.feeds');
    bodyFeeds.appendChild(titleFeeds);
    const groupListFeeds = document.createElement('ul');
    groupListFeeds.classList.add('list-group');
    cardFeeds.appendChild(groupListFeeds);

    feeds.forEach(({ title, description }) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'border-0');
      groupListFeeds.appendChild(listItem);

      const titleItem = document.createElement('h3');
      titleItem.classList.add('m-0', 'h6');
      titleItem.textContent = title;
      listItem.appendChild(titleItem);

      const descrItem = document.createElement('p');
      descrItem.classList.add('m-0', 'small', 'text-black-50');
      descrItem.innerHTML = description;
      listItem.appendChild(descrItem);
    });
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'inputRSSForm.errors':
        renderErrors(inputUrl, value);
        break;
      case 'inputRSSForm.processError':
      // renderErrors(inputUrl, value);
        break;
      case 'inputRSSForm.valid':
      // submit.disabled = false;
        break;
      case 'inputRSSForm.process':
        processStateHandler(value);
        break;
      case 'dataRss.feeds':
        renderFeeds(value, divFeeds);
        break;
      case 'dataRss.posts':
        renderPosts(value, divPosts);
        break;
      default:
        break;
    }
    console.log(state);
  });

  const updateValidationState = (url) => {
    const errors = validateURL({ url });
    watchedState.inputRSSForm.valid = _.isEqual(errors, {});
    watchedState.inputRSSForm.errors = errors;
  };

  const writeData = (data, currentUrl) => {
    const repeatUrl = watchedState.dataRss.feeds.filter((el) => el.url === currentUrl);
    if (!_.isEqual(repeatUrl, [])) {
      throw new Error(i18nInstance.t('messages.errors.exist'));
    }
    const { title, description, items } = data;
    console.log(items);
    const id = _.uniqueId();
    watchedState.dataRss.feeds.unshift({
      id, title, description, url: currentUrl,
    });
    watchedState.dataRss.posts.unshift({ id, posts: items });
  };

  formSubmit.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');
    updateValidationState(url);
    watchedState.inputRSSForm.process = 'sending';
    axios.get(`${proxyServ}${encodeURIComponent(url)}`)
      .then((response) => {
      // handle success
        const content = parser(response.data.contents);
        console.log(content);
        writeData(content, url);
        watchedState.inputRSSForm.process = 'accepted'; // success info?
      })
      .catch((error) => {
      //       // handle error
        console.log(`handle error ${error}`);
        watchedState.inputRSSForm.processError = errorMessages.network.error;
        watchedState.inputRSSForm.process = 'failed';
      });
  });
};

app();
