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

async function addImage (files) {
  console.log('Add files...', window.imageList)
  if (!window.imageList) window.imageList = [];
  
  console.log(files)
  
  for (const file of files) {
    if (!checkFormat(file.type)) continue;
    
    const url = URL.createObjectURL(file)
    const img = new Image;
    img.src = url;
    window.imageList.push({ file, img });
  }
  console.log(window.imageList);
}

function listImages () {
  while (list.firstChild) {
    list.removeChild(list.lastChild);
  }
  
  if (!window.imageList) return;
  
  for (const {file, img} of window.imageList) {
    const tn = img.cloneNode();
    tn.classList.add('thumbnail');
    
    list.append(createRow(tn, file.name, humanFileSize(file.size)));
  }
}

async function generate () {
  const pdf = new window.jspdf.jsPDF({
    units: 'px',
    hotfixes: ['px_scaling']
  });
  pdf.deletePage(1);
  
  for (const {file, img} of window.imageList) {
    await img.decode();
    const {width, height} = img;
    pdf.addPage([width, height], width > height ? 'landscape' : 'portrait');
    pdf.addImage(img, 'PNG', 0, 0, width, height);
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
});