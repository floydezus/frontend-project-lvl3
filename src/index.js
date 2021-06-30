import axios from 'axios';
import * as yup from 'yup';
import onChange from 'on-change';
import _ from 'lodash';
import parser from './parser.js';

const schema = yup.object().shape({
    url: yup.string().required().url(),
    //rss: yup.string().required().xml()
});

const proxyServ = `https://hexlet-allorigins.herokuapp.com/get?url=`;

const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
  parsing: {
    error: 'Ресурс не содержит валидный RSS.',
  },
};

const validateURL = (fields) => {
    try {
      schema.validateSync(fields, { abortEarly: false });
      return {};
    } catch (e) {
      //console.log('CATCH ERRORS');
      return _.keyBy(e.inner, 'path');
    }
};

const state = {
    inputRSSForm: {
        valid: false,        
        process: 'filling',
        processError: null,
        data: {
          url: '',          
        },
        errors: {},
    },
    dataRss: {        
        feeds: [],
        posts: [],
    },
}

const formSubmit = document.querySelector('.rss-form');
const submitButton = document.querySelector('button[type="submit"]');
const inputUrl = document.querySelector('#urlInput');
const divURL = document.querySelector('#divUrl');
const divFeeds = document.querySelector('.feeds');
const divPosts = document.querySelector('.posts');

const renderErrors = (element, errors) => { //refactoring
  const elementError =  element;
  const error = errors[elementError.name];
  //console.log(error);
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
    //   submitButton.disabled = false;
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

const renderPosts = (postsObj, rootPosts) => {
  rootPosts.innerHTML = '';
  const cardPosts = document.createElement('div');
  cardPosts.classList.add('card', 'border-0');
  rootPosts.appendChild(cardPosts);
  const bodyPosts = document.createElement('div');
  bodyPosts.classList.add('card-body');
  cardPosts.appendChild(bodyPosts);
  const titlePosts = document.createElement('h2');
  titlePosts.classList.add('card-title');
  titlePosts.textContent = 'Посты';
  bodyPosts.appendChild(titlePosts);
  const groupListPosts = document.createElement('ul');
  groupListPosts.classList.add('list-group');
  cardPosts.appendChild(groupListPosts);
  
  postsObj.forEach((obj) => {
    const { posts } = obj;
    posts.forEach(({title, link}) => {

      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      groupListPosts.appendChild(listItem);
      const id = _.uniqueId();
      const linkElem = document.createElement('a');
      linkElem.classList.add('fw-bold');
      linkElem.href = link;
      linkElem.textContent = title;
      linkElem.setAttribute("data-id", id);
      listItem.appendChild(linkElem);

      const buttonElem = document.createElement('button');
      buttonElem.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      buttonElem.textContent = 'Просмотр';
      buttonElem.setAttribute("data-id", id);
      buttonElem.setAttribute("data-bs-toggle", "modal");
      buttonElem.setAttribute("data-bs-target", "#modal");
      listItem.appendChild(buttonElem);

    });

  });

};

const renderFeeds = (feeds, rootFeeds) => {
  rootFeeds.innerHTML = '';
  const cardFeeds = document.createElement('div');
  cardFeeds.classList.add('card', 'border-0');
  rootFeeds.appendChild(cardFeeds);
  const bodyFeeds = document.createElement('div');
  bodyFeeds.classList.add('card-body');
  cardFeeds.appendChild(bodyFeeds);
  const titleFeeds = document.createElement('h2');
  titleFeeds.classList.add('card-title');
  titleFeeds.textContent = 'Фиды';
  bodyFeeds.appendChild(titleFeeds);
  const groupListFeeds = document.createElement('ul');
  groupListFeeds.classList.add('list-group');
  cardFeeds.appendChild(groupListFeeds);

  feeds.forEach(({title, description }) => {
          
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
        //renderErrors(inputUrl, value);
        break;
      case 'inputRSSForm.valid':
        //submit.disabled = false;
        break;
      case 'inputRSSForm.process':
        processStateHandler(value);
        break;
      case 'inputRSSForm.process':
        processStateHandler(value);
        break;
      case 'dataRss.feeds':        
        //console.log('feeds');
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

const updateValidationState = (watchedState) => {
  const errors = validateURL(watchedState.inputRSSForm.data);
  watchedState.inputRSSForm.valid = _.isEqual(errors, {});
  watchedState.inputRSSForm.errors = errors;
};

const writeData = (data, currentUrl) => {
  const repeatUrl = watchedState.dataRss.feeds.filter((el) => el.url === currentUrl);
  if (!_.isEqual(repeatUrl, [])) {
    throw new Error(`RSS уже существует`);
  }
  const {title, description, items} = data;  
  console.log(items);
  const id = _.uniqueId();
  watchedState.dataRss.feeds.unshift({id: id, title: title, description: description, url: currentUrl });
  watchedState.dataRss.posts.unshift({id: id, posts: items });
};

formSubmit.addEventListener('submit', (e) => {
   e.preventDefault();
   const formData = new FormData(e.target);
   const url = formData.get('url');   
   watchedState.inputRSSForm.data.url = url; //delete this
   updateValidationState(watchedState);
   watchedState.inputRSSForm.process = 'sending';
   axios.get(`${proxyServ}${encodeURIComponent(url)}`)
     .then((response) => {
       // handle success     
      const content = parser(response.data.contents);
      console.log(content);       
      writeData(content, url);
      watchedState.inputRSSForm.process = 'accepted';   //success info?   
     })
     .catch((error) => {
//       // handle error
      console.log(`handle error ${error}`);
       watchedState.inputRSSForm.processError = errorMessages.network.error;
       watchedState.inputRSSForm.process = 'failed';     
     });
 });
