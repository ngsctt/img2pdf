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
  return /image\/.+/.test(mimetype);
}

function humanFileSize (bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes >= 1024 && bytes < 1048576) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }
}

function addImage (files) {
  console.log('Add files...', window.imageList)
  if (!window.imageList) window.imageList = [];
  
  for (const file of files) {
    if (!checkFormat(file.type)) continue;
    
    const url = URL.createObjectURL(file)
    const img = new Image;
    img.src = url;
    const { width, height } = img;
    
    window.imageList.push({
      file,
      url,
      width,
      height
    });
  }
  console.log(window.imageList);
}

function listImages () {
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  
  if (!window.imageList) return;
  
  for (const {file, url} of window.imageList) {
    const tn = new Image;
    tn.classList.add('thumbnail');
    tn.src = url;
    
    list.append(createRow(tn, file.name, humanFileSize(file.size)));
  }
}

function generate () {}

window.addEventListener('change', event => {
  if (event.target === upload) {
    addImage(upload.files);
    listImages();
  }
})