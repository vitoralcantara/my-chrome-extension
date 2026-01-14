const element = document.createElement('div');
element.textContent = 'Hello from your Chrome extension!';
element.style.position = 'fixed';
element.style.top = '10px';
element.style.right = '10px';
element.style.backgroundColor = 'white';
element.style.border = '1px solid black';
element.style.padding = '10px';
element.style.zIndex = '1000';

document.body.appendChild(element);