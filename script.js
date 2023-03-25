const upload = document.getElementById('upload');
const list = document.getElementById('list');
const go = document.getElementById('go');
const ppmm = document.getElementById('ppmm');

const PPMM = 5.91;  // (equivalent to 150dpi)

function createRow (...cells) {
  const row = document.createElement('tr');
  for (const content of cells) {
    const cell = document.createElement('td');
    cell.append(content);
    row.append(cell);
  }
  return row;
}

function checkFormat (mimetype) {
  return true;
}

function addImage (files) {
  console.log('Add files...', window.imageList)
  if (!window.imageList) window.imageList = [];
  
  for (const file of files) {
    if (checkFormat(file.type)) window.imageList.push(file);
  }
  console.log(window.imageList);
}

function listImages () {
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  
  if (!window.imageList) return;
  
  for (const image of window.imageList) {
    list.append(createRow(image.name, image.size));
  }
}

function generate () {}

window.addEventListener('change', event => {
  if (event.target === upload) {
    addImage(upload.files);
    listImages();
  }
})