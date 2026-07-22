// ---------- Tabs ----------
var tabDefs = [['image','Image Tools'],['merge','Merge PDFs'],['split','Split PDF']];
var tabsEl = document.getElementById('tabs');
if(tabsEl){
  tabDefs.forEach(function(pair, i){
    var key = pair[0], label = pair[1];
    var b = document.createElement('button');
    b.className = 'tab-btn' + (i===0?' active':'');
    b.textContent = label;
    b.onclick = function(){ switchTab(key); };
    b.dataset.tab = key;
    tabsEl.appendChild(b);
  });
}
function switchTab(key){
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.tab===key); });
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.toggle('active', p.dataset.panel===key); });
}
function fmtBytes(n){
  if(n < 1024) return n + ' B';
  if(n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
  return (n/1024/1024).toFixed(2) + ' MB';
}

// ---------- Image Resize / Compress / Convert ----------
var formatHints = {
  'image/jpeg': 'JPEG: smaller files, no transparency support — best for photos and anything without sharp edges or text.',
  'image/png': 'PNG: lossless (no quality loss) and supports transparency — best for screenshots, logos, and graphics with text or sharp edges, at the cost of larger file size.',
  'image/webp': "WebP: usually smaller than both JPEG and PNG at similar quality, and supports transparency too — a good default unless you specifically need JPEG/PNG for compatibility with an older tool."
};
var imgFormatEl = document.getElementById('imgFormat');
if(imgFormatEl){
  imgFormatEl.addEventListener('change', function(){
    document.getElementById('formatHint').textContent = formatHints[this.value];
  });
}

var origImg = null, origFile = null, resultBlob = null, resultExt = 'jpg';
var imgFileEl = document.getElementById('imgFile');
if(imgFileEl){
  imgFileEl.addEventListener('change', function(e){
    var file = e.target.files[0];
    document.getElementById('imgError').textContent = '';
    if(!file) return;
    origFile = file;
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function(){
      origImg = img;
      document.getElementById('imgWidth').value = img.naturalWidth;
      document.getElementById('imgHeight').value = img.naturalHeight;
      document.getElementById('imgOriginalPreview').src = url;
      document.getElementById('imgOriginalPreview').style.display = 'block';
      document.getElementById('imgOriginalMeta').textContent = img.naturalWidth + '×' + img.naturalHeight + ' — ' + fmtBytes(file.size);
      document.getElementById('imgProcessBtn').disabled = false;
    };
    img.onerror = function(){ document.getElementById('imgError').textContent = 'Could not load that image.'; };
    img.src = url;
  });
}
var imgWidthEl = document.getElementById('imgWidth');
if(imgWidthEl){
  imgWidthEl.addEventListener('input', function(){
    if(!document.getElementById('imgLock').checked || !origImg) return;
    var ratio = origImg.naturalHeight / origImg.naturalWidth;
    var w = parseInt(this.value)||0;
    document.getElementById('imgHeight').value = Math.round(w*ratio);
  });
}
var imgHeightEl = document.getElementById('imgHeight');
if(imgHeightEl){
  imgHeightEl.addEventListener('input', function(){
    if(!document.getElementById('imgLock').checked || !origImg) return;
    var ratio = origImg.naturalWidth / origImg.naturalHeight;
    var h = parseInt(this.value)||0;
    document.getElementById('imgWidth').value = Math.round(h*ratio);
  });
}
function processImage(){
  if(!origImg) return;
  var w = parseInt(document.getElementById('imgWidth').value) || origImg.naturalWidth;
  var h = parseInt(document.getElementById('imgHeight').value) || origImg.naturalHeight;
  var format = document.getElementById('imgFormat').value;
  var quality = parseFloat(document.getElementById('imgQuality').value);
  var canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  var ctx = canvas.getContext('2d');
  if(format === 'image/jpeg'){ ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h); }
  ctx.drawImage(origImg, 0, 0, w, h);
  canvas.toBlob(function(blob){
    resultBlob = blob;
    resultExt = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    var url = URL.createObjectURL(blob);
    document.getElementById('imgResultPreview').src = url;
    document.getElementById('imgResultPreview').style.display = 'block';
    document.getElementById('imgResultMeta').textContent = w + '×' + h + ' — ' + fmtBytes(blob.size);
    document.getElementById('imgDownloadBtn').disabled = false;
  }, format, quality);
}
function downloadImage(){
  if(!resultBlob) return;
  var a = document.createElement('a');
  a.href = URL.createObjectURL(resultBlob);
  a.download = 'converted.' + resultExt;
  a.click();
}

// ---------- Merge PDFs ----------
var mergeFiles = [];
var pdfMergeFilesEl = document.getElementById('pdfMergeFiles');
if(pdfMergeFilesEl){
  pdfMergeFilesEl.addEventListener('change', function(e){
    mergeFiles = Array.from(e.target.files);
    renderMergeList();
  });
}
function renderMergeList(){
  var out = document.getElementById('pdfMergeList');
  out.innerHTML = '';
  mergeFiles.forEach(function(f, i){
    var row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = '<span>' + (i+1) + '. ' + f.name + ' (' + fmtBytes(f.size) + ')</span>' +
      '<span class="actions">' +
      '<button data-i="' + i + '" data-act="up">↑</button>' +
      '<button data-i="' + i + '" data-act="down">↓</button>' +
      '<button data-i="' + i + '" data-act="remove">Remove</button>' +
      '</span>';
    out.appendChild(row);
  });
  out.querySelectorAll('button').forEach(function(btn){
    btn.onclick = function(){
      var i = parseInt(btn.dataset.i), act = btn.dataset.act;
      if(act === 'up' && i>0){ var t=mergeFiles[i]; mergeFiles[i]=mergeFiles[i-1]; mergeFiles[i-1]=t; }
      else if(act === 'down' && i<mergeFiles.length-1){ var t=mergeFiles[i]; mergeFiles[i]=mergeFiles[i+1]; mergeFiles[i+1]=t; }
      else if(act === 'remove'){ mergeFiles.splice(i,1); }
      renderMergeList();
    };
  });
  document.getElementById('pdfMergeBtn').disabled = mergeFiles.length < 2;
}
async function mergePDFs(){
  var errEl = document.getElementById('pdfMergeError'); errEl.textContent = '';
  try{
    var { PDFDocument } = PDFLib;
    var merged = await PDFDocument.create();
    for(var i=0;i<mergeFiles.length;i++){
      var bytes = await mergeFiles[i].arrayBuffer();
      var src = await PDFDocument.load(bytes);
      var pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(function(p){ merged.addPage(p); });
    }
    var outBytes = await merged.save();
    var blob = new Blob([outBytes], {type:'application/pdf'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'merged.pdf';
    a.click();
  }catch(e){
    errEl.textContent = 'Merge failed: ' + e.message;
  }
}

// ---------- Split / Extract PDF ----------
var splitFile = null;
var pdfSplitFileEl = document.getElementById('pdfSplitFile');
if(pdfSplitFileEl){
  pdfSplitFileEl.addEventListener('change', function(e){
    splitFile = e.target.files[0] || null;
    document.getElementById('pdfSplitBtn').disabled = !splitFile;
  });
}
function toggleSplitMode(){
  var mode = document.getElementById('pdfSplitMode').value;
  document.getElementById('pdfRangeWrap').style.display = mode === 'range' ? 'block' : 'none';
}
function parseRange(str, maxPage){
  var pages = [];
  str.split(',').forEach(function(part){
    part = part.trim();
    if(!part) return;
    var m = part.match(/^(\d+)-(\d+)$/);
    if(m){
      var start = parseInt(m[1]), end = parseInt(m[2]);
      for(var p=start; p<=end; p++) if(p>=1 && p<=maxPage) pages.push(p-1);
    } else if(/^\d+$/.test(part)){
      var p = parseInt(part);
      if(p>=1 && p<=maxPage) pages.push(p-1);
    }
  });
  return pages;
}
async function splitPDF(){
  var errEl = document.getElementById('pdfSplitError'); errEl.textContent = '';
  var outEl = document.getElementById('pdfSplitOut'); outEl.innerHTML = '';
  if(!splitFile) return;
  try{
    var { PDFDocument } = PDFLib;
    var bytes = await splitFile.arrayBuffer();
    var src = await PDFDocument.load(bytes);
    var pageCount = src.getPageCount();
    var mode = document.getElementById('pdfSplitMode').value;
    if(mode === 'range'){
      var rangeStr = document.getElementById('pdfRange').value || ('1-' + pageCount);
      var indices = parseRange(rangeStr, pageCount);
      if(indices.length === 0){ errEl.textContent = 'No valid pages in that range (document has ' + pageCount + ' pages).'; return; }
      var out = await PDFDocument.create();
      var pages = await out.copyPages(src, indices);
      pages.forEach(function(p){ out.addPage(p); });
      var outBytes = await out.save();
      var blob = new Blob([outBytes], {type:'application/pdf'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'extracted.pdf';
      a.click();
    } else {
      for(var i=0;i<pageCount;i++){
        var out = await PDFDocument.create();
        var pages = await out.copyPages(src, [i]);
        pages.forEach(function(p){ out.addPage(p); });
        var outBytes = await out.save();
        var blob = new Blob([outBytes], {type:'application/pdf'});
        var row = document.createElement('div');
        row.className = 'list-item';
        var url = URL.createObjectURL(blob);
        row.innerHTML = '<span>Page ' + (i+1) + '</span><span class="actions"><a href="' + url + '" download="page-' + (i+1) + '.pdf">Download</a></span>';
        outEl.appendChild(row);
      }
    }
  }catch(e){
    errEl.textContent = 'Processing failed: ' + e.message;
  }
}
