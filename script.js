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
  
}

function generate () {}

