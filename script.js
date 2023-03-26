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
const DB_VERSION = 1;

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
  }
  console.log(window.imageList);
}

function listImages () {
  let count = 0, size = 0;
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  total.count.textContent = '';
  total.size.textContent = '';
  
  if (!window.imageList) return;
  
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
    listImages();
  }
});

window.addEventListener('click', event => {
  if (event.target.id === 'go') generate();
  else if (event.target.name === 'remove') null;
});
  
window.addEventListener('load', event => {
  // Open IndexedDB database
  const DBOpenRequest = window.indexedDB.open('toDoList', DB_VERSION);

  // Register two event handlers to act on the database being opened successfully, or not
  DBOpenRequest.onerror = (event) => {
    console.error('Error loading database.');
  };

  DBOpenRequest.onsuccess = (event) => {
    console.info('Database initialised.');
    window.db = DBOpenRequest.result;
    listImages();
  };
})