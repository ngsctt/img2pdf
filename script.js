const upload = document.getElementById('upload');
const list = document.getElementById('list');
const go = document.getElementById('go');
const ppmm = document.getElementById('ppmm');

const PPMM = 5.91;  // (equivalent to 150dpi)

function checkFormat (mimetype) {
  return true;
}

function addImage (files) {
  if (!window.imageList) window.imageList = [];
  
  for (const file of files) {
    if (checkFormat(file.type)) window.imageList.push(file);
  }
}

function listImages () {
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  
  if (!window.imageList) return;
  
  for (const image of window.imageList) {
    const li = document.createElement('li');
    li.textContent = image.name;
    list.append(li);
  }
}

function generate () {}

window.addEventListener('change', event => {
  console.log(event);
  if (event.target === upload) {
    addImage(upload.files);
  }
})