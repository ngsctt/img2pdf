import { PDFDocument } from 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.esm.js';
// import { PDFDocument } from 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js';

const upload = document.getElementById('upload');
const list = document.getElementById('list');
const listRow = document.getElementById('list-row').content;
const total = {
  count: document.getElementById('total-count'),
  size: document.getElementById('total-size'),
};
const go = document.getElementById('go');
// const ppmm = document.getElementById('ppmm');
const clear = document.getElementById('clear');
const scale = document.getElementById('scale');
// const resultRow = document.getElementById('result-row');
// const result = document.createElement('a');
const result = document.getElementById('result');
const resultSize = document.getElementById('result-size');
// const download = document.getElementById('download');
// result.classList.add('result', 'button');
// result.textContent = 'Generated PDF';
// result.target = '_blank';
// result.download = 'img2pdf';

const PPMM = 5.91;  // (equivalent to 150dpi)
const DB_VERSION = 2;

window.db = new window.Dexie('img2pdf');
window.db.version(DB_VERSION).stores({ images: '++id,name'});
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
    
  for (const file of files) {
    if (!checkFormat(file.type)) continue;
    
    const url = URL.createObjectURL(file)
    const img = new Image;
    img.src = url;
    await table.add({ file, name: file.name });
  }
}

async function removeImage (id) {
  id = Number(id);
  await table.delete(id);
}

async function clearImages () {
  await table.clear();
}

async function listImages () {
  let count = 0, size = 0;
  
  const fragment = new DocumentFragment();
    
  await table.each(({file, name, id}) => {
    const tn = new Image;
    tn.src = URL.createObjectURL(file);
    tn.classList.add('thumbnail');
    
    const row = listRow.cloneNode(true);
    window.row = row
    row.querySelector('.tn')?.append(tn);
    row.querySelector('.name')?.append(name);
    row.querySelector('.size')?.append(humanFileSize(file.size));
    row.querySelector('.remove').dataset.id = id;
    fragment.append(row);
    
    count ++;
    size += file.size;
  });
  
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  total.count.textContent = '';
  total.size.textContent = '';
  list.append(fragment);
  
  total.count.textContent = `${count} images total`;
  total.size.textContent = humanFileSize(size);
}

async function generate () {
  result.hidden = true;
  result.disabled = true;
  resultSize.textContent = '';
  URL.revokeObjectURL(result.href);
  result.href = '';
  // const PPMM = ppmm.value || PPMM;
  const pdf = await PDFDocument.create();
  let page = 0;
  
  for (const {file, name, id} of await table.toArray()) {
    const buffer = await file.arrayBuffer();
    let img;
    if (file.type === 'image/png') img = await pdf.embedPng(buffer);
    else if (file.type === 'image/jpeg' || file.type === 'image/jpg') img = await pdf.embedJpg(buffer);
    else throw new Error(`Image not PNG or JPEG: ${name}`)
    const {width, height} = img.scale(1);
    const page = pdf.addPage([width, height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }
  
  const bytes  = new Uint8Array( await pdf.save() ); 
  // const blob = new Blob([bytes],  {type: 'application/pdf'});
  const file = new File([bytes], 'img2pdf.pdf', {type: 'application/pdf'});
  const url = URL.createObjectURL(file);
  result.href = url;
  resultSize.textContent = `(${humanFileSize(file.size)})`;
  result.disabled = false;
  result.hidden = false;
}

window.addEventListener('change', async event => {
  if (event.target === upload) {
    await addImage(upload.files);
    upload.value = '';
    await listImages();
  } else if (event.target === scale) {
    window.localStorage.setItem('img2pdf-scale', scale.value);
  }
});

window.addEventListener('click', async event => {
  if (event.target === go) generate();
  else if (event.target.name === 'remove') {
    await removeImage(event.target.dataset.id);
    await listImages();
  } else if (event.target === clear) {
    await clearImages();
    await listImages();
  }
});
  
window.addEventListener('load', event => {
  listImages();
  // scale.value = window.localStorage.getItem('img2pdf-scale') || 1;
})

Object.assign(window, {
  PDFDocument,
});