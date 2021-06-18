const heading = document.querySelector('h1');
heading.textContent = 'RSS агрегатор';

const root = document.querySelector('body');
root.append(heading);

const formBase = document.createElement('form');
root.append(formBase);

const inputField = document.createElement('input');
formBase.append(inputField);

const buttonSubmit = document.createElement('button');
buttonSubmit.classList.add('btn', 'btn-primary');
buttonSubmit.textContent = 'Добавить';
formBase.append(buttonSubmit);