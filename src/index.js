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
      error: null,
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

  const baseURLSchema = yup.string().required().url();

  const validateURL = (url, feeds) => {
    const urls = feeds.map((el) => el.url);
    const currentURLSchema = baseURLSchema.notOneOf(urls);
    try {
      currentURLSchema.validateSync(url);
      return null;
    } catch (err) {
      return err.type;
    }
  };

  const formSubmit = document.querySelector('.rss-form');
  const submitButton = document.querySelector('button[type="submit"]');
  const inputUrl = document.querySelector('#urlInput');
  const divURL = document.querySelector('#divUrl');
  const divFeeds = document.querySelector('.feeds');
  const divPosts = document.querySelector('.posts');

  const renderMessage = (element, messageType, isSuccess = true) => { // refactoring
    const feedbackExist = divURL.querySelector('.feedback');
    const elementMessage = element;
    if (feedbackExist) {
      feedbackExist.remove();
      elementMessage.classList.remove('is-invalid');
    }
    const feedbackElement = document.createElement('div');
    if (isSuccess) {
      const message = i18nInstance.t(`messages.${messageType}`);
      feedbackElement.classList.add('feedback', 'text-success', 'position-absolute', 'small');
      feedbackElement.innerHTML = message;
    } else {
      console.log(messageType);
      const errorMessage = i18nInstance.t([`messages.errors.${messageType}`, 'messages.errors.undefined']);
      feedbackElement.classList.add('feedback', 'text-danger', 'position-absolute', 'small');
      feedbackElement.innerHTML = errorMessage;
      elementMessage.classList.add('is-invalid');
    }
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
        inputUrl.value = '';
        renderMessage(inputUrl, 'success.add');
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
      case 'inputRSSForm.error':
        renderMessage(inputUrl, value, false);
        break;
      case 'inputRSSForm.processError':
        renderMessage(inputUrl, value, false);
        break;
      case 'inputRSSForm.valid':
        submitButton.disabled = false;
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
  });

  const writeData = (data, currentUrl) => {
    const repeatUrl = watchedState.dataRss.feeds.filter((el) => el.url === currentUrl);
    if (!_.isEqual(repeatUrl, [])) {
      throw new Error(i18nInstance.t('messages.errors.exist'));
    }
    const { title, description, items } = data;
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
    const error = validateURL(url, watchedState.dataRss.feeds);
    if (error) {
      watchedState.inputRSSForm.error = error;
      watchedState.inputRSSForm.valid = false;
      return;
    }
    watchedState.inputRSSForm.valid = true;
    watchedState.inputRSSForm.error = null;
    watchedState.inputRSSForm.process = 'sending';
    axios.get(`${proxyServ}${encodeURIComponent(url)}`)
      .then((response) => {
      // handle success
        const content = parser(response.data.contents);
        writeData(content, url);
        watchedState.inputRSSForm.process = 'accepted'; // success info?
      })
      .catch((err) => {
        if (err.isAxiosError) {
          watchedState.inputRSSForm.processError = 'network';
        }
        if (err.isParsingError) {
          watchedState.inputRSSForm.processError = 'parsing';
        }
        watchedState.inputRSSForm.process = 'failed';
      });
  });
};

app();
