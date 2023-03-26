const upload = document.getElementById('upload');
const list = document.getElementById('list');
const listRow = document.getElementById('list-row').content;
const total = {
  count: document.getElementById('total-count'),
  size: document.getElementById('total-size'),
};
const go = document.getElementById('go');
const ppmm = document.getElementById('ppmm');
const clear = document.getElementById('clear');
const scale = document.getElementById('scale');

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
  // if (!window.imageList) window.imageList = [];
    
  for (const file of files) {
    if (!checkFormat(file.type)) continue;
    
    const url = URL.createObjectURL(file)
    const img = new Image;
    img.src = url;
    // window.imageList.push({ file, name: file.name });
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
  const PPMM = ppmm.value || PPMM;
  const pdf = new window.jspdf.jsPDF({
    units: 'px',
    hotfixes: ['px_scaling']
  });
  pdf.deletePage(1);
  let page = 0;
  
  for (const {file, name, id} of await table.toArray()) {
    const img = new Image;
    img.src = URL.createObjectURL(file);
    await img.decode();
    const {width, height} = img;
    pdf.addPage([width/PPMM, height/PPMM], width > height ? 'landscape' : 'portrait') && page++;
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight()
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    pdf.outline.add(null, name, { pageNumber: page });
    //URL.revokeObjectURL(img.src);
  }
  
  window.open(pdf.output('bloburl'), '_blank');
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