const upload = document.getElementById('upload');
const list = document.getElementById('list');
const listRow = document.getElementById('list-row').content;
const total = {
  count: document.getElementById('total-count'),
  size: document.getElementById('total-size'),
};
const go = document.getElementById('go');
const ppmm = document.getElementById('ppmm');

const PPMM = 5.91;  // (equivalent to 150dpi)
const DB_VERSION = 2;

window.db = new window.Dexie('img2pdf');
window.db.version(DB_VERSION).stores({ images: '++id, name'});
const table = window.db.table('images');

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

async function addImage (files) {
  console.log('Add files...', window.imageList)
  if (!window.imageList) window.imageList = [];
  
  console.log(files)
  
  for (const file of files) {
    if (!checkFormat(file.type)) continue;
    
    const url = URL.createObjectURL(file)
    const img = new Image;
    img.src = url;
    window.imageList.push({ file, img, name: file.name });
    table.add({ file, img, name: file.name });
  }
  console.log(window.imageList);
}

async function listImages () {
  let count = 0, size = 0;
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  total.count.textContent = '';
  total.size.textContent = '';
  
  if (!window.imageList) return;
  
  //await db.images.each(image => console.log(image));
  
  for (const {file, img, name} of window.imageList) {
    const tn = img.cloneNode();
    tn.classList.add('thumbnail');
    
    //list.append(createRow(tn, file.name, humanFileSize(file.size)));
    const row = listRow.cloneNode(true);
    window.row = row
    row.querySelector('.tn')?.append(tn);
    row.querySelector('.name')?.append(name);
    row.querySelector('.size')?.append(humanFileSize(file.size));
    list.append(row);
    
    count ++;
    size += file.size;
  }
  
  total.count.textContent = `${count} images total`;
  total.size.textContent = humanFileSize(size);
}

async function generate () {
  const pdf = new window.jspdf.jsPDF({
    units: 'px',
    hotfixes: ['px_scaling']
  });
  pdf.deletePage(1);
  let page = 0;
  
  for (const {img, name} of window.imageList) {
    await img.decode();
    const {width, height} = img;
    pdf.addPage([width, height], width > height ? 'landscape' : 'portrait') && page++;
    pdf.addImage(img, 'PNG', 0, 0, width, height);
    pdf.outline.add(null, name, { pageNumber: page });
  }
  
  window.open(pdf.output('bloburl'), '_blank')
}

window.addEventListener('change', async event => {
  if (event.target === upload) {
    await addImage(upload.files);
    upload.value = '';
    await listImages();
  }
});

window.addEventListener('click', event => {
  if (event.target.id === 'go') generate();
  else if (event.target.name === 'remove') null;
});
  
window.addEventListener('load', event => {
  const request = indexedDB.open('img2pdf');
  request.onerror = (event) => {
    console.error('Error loading database');
  };
  request.onsuccess = (event) => {
    window.db = event.target.result;
  };
  window.db.onerror = (event) => {
    console.error(`Database error: ${event.target.errorCode}`);
  };
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const objectStore = db.createObjectStore('images', { autoIncrement: true });
    objectStore.createIndex('file', 'file', { unique: false });
    objectStore.createIndex('img', 'img', { unique: false });
    objectStore.createIndex('name', 'name', { unique: false });
  };
})