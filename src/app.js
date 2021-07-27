import 'bootstrap';
import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import i18n from 'i18next';
import parse from './parser.js';
import resources from './locales';
import initView from './view.js';

const buildURL = (link) => {
  const path = 'https://hexlet-allorigins.herokuapp.com/get';
  const buildedUrl = new URL(path);
  buildedUrl.searchParams.set('disableCache', true);
  buildedUrl.searchParams.set('url', link);
  return buildedUrl;
};

const app = () => {
  const delayTime = 5000;
  const defaultLanguage = 'ru';
  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  })
    .then(() => {
      const state = {
        inputRSSForm: {
          valid: false,
          process: 'filling',
          error: null,
        },
        ui: {
          seenLinks: [],
          dataModal: null,
        },
        processError: null,
        feeds: [],
        posts: [],
      };
      const watchedState = initView(state, i18nInstance);

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

      const writeData = (data, currentUrl) => {
        const { title, description, items } = data;
        const idFeed = _.uniqueId();
        watchedState.feeds.unshift({
          id: idFeed, title, description, url: currentUrl,
        });
        const posts = items.map((i) => ({ ...i, id: _.uniqueId(), idFeed }));
        watchedState.posts.unshift(...posts);
      };

      const updateData = () => {
        const promisesFeed = watchedState.feeds.map((feed) => axios.get(buildURL(feed.url))
          .then((response) => {
            const feedData = parse(response.data.contents);
            const newPosts = feedData.items;
            const oldPost = watchedState.posts.filter((el) => el.idFeed === feed.id);
            const diffTitle = _.difference(newPosts.map((post) => post.title),
              oldPost.map((post) => post.title));
            if (diffTitle.length !== 0) {
              const addedPosts = newPosts.filter((post) => diffTitle.includes(post.title))
                .map((i) => ({ ...i, id: _.uniqueId(), idFeed: feed.id }));
              watchedState.posts.unshift(...addedPosts);
            }
          })
          .catch((err) => console.log(err)));

        Promise.all(promisesFeed)
          .finally(() => {
            setTimeout(() => {
              updateData();
            }, delayTime);
          });
      };

      formSubmit.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');
        const error = validateURL(url, watchedState.feeds);
        if (error) {
          watchedState.inputRSSForm.error = error;
          watchedState.inputRSSForm.valid = false;
          return;
        }
        watchedState.inputRSSForm.valid = true;
        watchedState.inputRSSForm.error = null;
        watchedState.inputRSSForm.process = 'sending';
        axios.get(buildURL(url))
          .then((response) => {
            const content = parse(response.data.contents);
            writeData(content, url);
            watchedState.inputRSSForm.process = 'accepted';
            updateData();
          })
          .catch((err) => {
            if (err.isAxiosError) {
              watchedState.processError = 'network';
            }
            if (err.isParsingError) {
              watchedState.processError = 'parsing';
            }
            watchedState.inputRSSForm.process = 'failed';
          });
      });
    });
};

export default app;
