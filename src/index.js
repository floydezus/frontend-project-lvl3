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
        feed: [],
        post: [],
    },
}

const formSubmit = document.querySelector('.rss-form');
const inputUrl = document.querySelector('#urlInput');
const divURL = document.querySelector('#divUrl');

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
      //submitButton.disabled = false;
      break;
     case 'filling':
    //   submitButton.disabled = false;
      break;
     case 'accepted':
    //   submitButton.disabled = true;
       break;
    // case 'finished':
    //   container.innerHTML = 'User Created!';
    //   break;
    default:
      throw new Error(`Unknown state: ${processState}`);
  }
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

formSubmit.addEventListener('submit', (e) => {
   e.preventDefault();
   const formData = new FormData(e.target);
   const url = formData.get('url');   
   watchedState.inputRSSForm.data.url = url;
   updateValidationState(watchedState);   
   axios.get(`${proxyServ}${encodeURIComponent(url)}`)
     .then((response) => {
       // handle success
       //console.log(response.data.contents);       
       //watchedState.inputRSSForm.process = 'accepted';       
       const content = parser(response.data.contents, 'dom'); 
       return;      
       const rssC = content.querySelector('rss');
       if (rssC) {
        const titleContent = content.querySelector('title').textContent;
        console.log(rssC);
        console.log(`title eq = ${titleContent}`);
        watchedState.dataRss.feed.push({ id:_.uniqueId(), feedName: titleContent} );
        watchedState.inputRSSForm.process = 'accepted';
        return;
       }
       watchedState.inputRSSForm.processError = errorMessages.parsing.error;
       watchedState.inputRSSForm.process = 'failed';
       // parsing rss - case 1: nice rss, get feeds; case 2: bad rss, get error
     })
     .catch((error) => {
//       // handle error
       watchedState.inputRSSForm.processError = errorMessages.network.error;
       watchedState.inputRSSForm.process = 'failed';
       console.log(error);
     });
 });
