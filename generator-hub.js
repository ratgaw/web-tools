// ---------- Tabs ----------
var tabDefs = [
  ['qr','QR Code'],['password','Password'],['uuid','UUID'],['name','Name/Username'],['colors','Color Palette']
];
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
function copyText(id){
  var el = document.getElementById(id);
  var text = el.value !== undefined ? el.value : el.textContent;
  navigator.clipboard.writeText(text);
}

// ---------- QR Code ----------
var qrInstance = null;
function genQR(){
  var text = document.getElementById('qrText').value || 'https://example.com';
  var size = parseInt(document.getElementById('qrSize').value);
  var level = document.getElementById('qrLevel').value;
  var out = document.getElementById('qrOutput');
  out.innerHTML = '';
  qrInstance = new QRCode(out, {
    text: text,
    width: size,
    height: size,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel[level]
  });
}
function downloadQR(){
  var out = document.getElementById('qrOutput');
  var img = out.querySelector('img');
  var canvas = out.querySelector('canvas');
  var url = img ? img.src : (canvas ? canvas.toDataURL('image/png') : null);
  if(!url){ genQR(); return; }
  var a = document.createElement('a');
  a.href = url;
  a.download = 'qrcode.png';
  a.click();
}
if(document.getElementById('qrText')){ genQR(); }

// ---------- Password Generator ----------
function genPassword(){
  var len = parseInt(document.getElementById('pwLen').value);
  var useUpper = document.getElementById('pwUpper').checked;
  var useLower = document.getElementById('pwLower').checked;
  var useNumbers = document.getElementById('pwNumbers').checked;
  var useSymbols = document.getElementById('pwSymbols').checked;
  var excludeAmbiguous = document.getElementById('pwAmbiguous').checked;

  var sets = [];
  if(useUpper) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if(useLower) sets.push('abcdefghijklmnopqrstuvwxyz');
  if(useNumbers) sets.push('0123456789');
  if(useSymbols) sets.push('!@#$%^&*()-_=+[]{};:,.<>?');
  if(sets.length === 0){ sets.push('abcdefghijklmnopqrstuvwxyz'); document.getElementById('pwLower').checked = true; }

  var ambiguous = 'l1IO0';
  if(excludeAmbiguous){
    sets = sets.map(function(s){
      var filtered = '';
      for(var i=0;i<s.length;i++){ if(ambiguous.indexOf(s[i])===-1) filtered += s[i]; }
      return filtered;
    });
  }

  var all = sets.join('');
  var randVals = new Uint32Array(len);
  crypto.getRandomValues(randVals);

  // guarantee at least one char from each selected set
  var passwordChars = [];
  sets.forEach(function(s, i){
    if(s.length){
      var v = new Uint32Array(1); crypto.getRandomValues(v);
      passwordChars.push(s[v[0] % s.length]);
    }
  });
  for(var i=passwordChars.length; i<len; i++){
    passwordChars.push(all[randVals[i] % all.length]);
  }
  // shuffle
  for(var i=passwordChars.length-1; i>0; i--){
    var v = new Uint32Array(1); crypto.getRandomValues(v);
    var j = v[0] % (i+1);
    var tmp = passwordChars[i]; passwordChars[i] = passwordChars[j]; passwordChars[j] = tmp;
  }
  var password = passwordChars.slice(0, len).join('');
  document.getElementById('pwOut').textContent = password;
  scorePassword(password, sets.length);
}
function scorePassword(pw, varietyCount){
  var entropy = pw.length * Math.log2(Math.max(varietyCount * 20, 10));
  var pct = Math.min(100, Math.round(entropy / 128 * 100));
  var bar = document.getElementById('pwStrengthBar');
  var label = document.getElementById('pwStrengthLabel');
  var color = pct < 35 ? '#ef4444' : pct < 65 ? '#f59e0b' : '#22c55e';
  bar.style.width = pct + '%';
  bar.style.background = color;
  var text = pct < 35 ? 'Weak' : pct < 65 ? 'Reasonable' : pct < 85 ? 'Strong' : 'Very strong';
  label.textContent = text + ' (~' + Math.round(entropy) + ' bits of entropy)';
}
if(document.getElementById('pwLen')){ genPassword(); }

// ---------- UUID Generator ----------
function uuidv4(){
  return crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c){
    return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
  });
}
function genUUIDs(){
  var count = Math.min(100, Math.max(1, parseInt(document.getElementById('uuidCount').value)||1));
  var format = document.getElementById('uuidFormat').value;
  var out = document.getElementById('uuidOut');
  out.innerHTML = '';
  for(var i=0;i<count;i++){
    var id = uuidv4();
    if(format === 'plain') id = id.replace(/-/g,'');
    if(format === 'upper') id = id.toUpperCase();
    var row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = '<span>' + id + '</span><button onclick="navigator.clipboard.writeText(\'' + id + '\')">Copy</button>';
    out.appendChild(row);
  }
}
if(document.getElementById('uuidCount')){ genUUIDs(); }

// ---------- Random Name / Username Generator ----------
var adjectives = ['Swift','Silent','Brave','Clever','Cosmic','Golden','Lucky','Mighty','Quiet','Rapid','Vivid','Wandering','Frosty','Solar','Lunar','Crimson','Azure','Iron','Shadow','Electric'];
var nouns = ['Falcon','Tiger','River','Comet','Wolf','Otter','Phoenix','Panther','Storm','Voyager','Ranger','Nomad','Fox','Hawk','Ember','Raven','Panda','Dragon','Sparrow','Wizard'];
var firstNames = ['Alex','Jordan','Taylor','Morgan','Casey','Riley','Sam','Avery','Quinn','Reese','Drew','Jamie','Skyler','Rowan','Emerson','Dakota','Sage','Finley','Harper','Charlie'];
var lastNames = ['Bennett','Hayes','Sullivan','Reed','Foster','Coleman','Bishop','Mercer','Wallace','Pierce','Sinclair','Whitfield','Lockhart','Ashford','Marlowe','Ellison','Kingsley','Blackwood','Harlow','Sterling'];
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function genNames(){
  var type = document.getElementById('nameType').value;
  var count = Math.min(50, Math.max(1, parseInt(document.getElementById('nameCount').value)||1));
  var out = document.getElementById('nameOut');
  out.innerHTML = '';
  for(var i=0;i<count;i++){
    var value;
    if(type === 'username'){
      value = pick(adjectives) + pick(nouns) + Math.floor(Math.random()*900+100);
    } else {
      value = pick(firstNames) + ' ' + pick(lastNames);
    }
    var row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = '<span>' + value + '</span><button onclick="navigator.clipboard.writeText(\'' + value.replace(/'/g,"\\\\'") + '\')">Copy</button>';
    out.appendChild(row);
  }
}
if(document.getElementById('nameType')){ genNames(); }

// ---------- Color Palette Generator ----------
var colorModeHints = {
  random: 'Random: five unrelated colors, useful for quick inspiration.',
  complementary: 'Complementary: colors from opposite sides of the color wheel — high contrast, good for making one element (like a button) stand out against another.',
  analogous: 'Analogous: colors that sit next to each other on the wheel — calm and cohesive, good for a unified look without much contrast.',
  triadic: 'Triadic: three colors evenly spaced around the wheel — vibrant and balanced, good when you want variety without it feeling random.',
  monochrome: 'Monochrome: shades and tints of a single hue — minimal and easy to keep consistent, good for a clean, understated look.'
};
if(document.getElementById('colorMode')){
  document.getElementById('colorMode').addEventListener('change', function(){
    document.getElementById('colorModeHint').textContent = colorModeHints[this.value];
  });
}

function hslToHex(h,s,l){
  s/=100; l/=100;
  var c = (1-Math.abs(2*l-1))*s;
  var x = c*(1-Math.abs((h/60)%2-1));
  var m = l-c/2;
  var r=0,g=0,b=0;
  if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  var toHex = v => Math.round((v+m)*255).toString(16).padStart(2,'0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function genPalette(){
  var mode = document.getElementById('colorMode').value;
  var baseHue = Math.floor(Math.random()*360);
  var hues = [];
  if(mode === 'random'){
    for(var i=0;i<5;i++) hues.push(Math.floor(Math.random()*360));
  } else if(mode === 'complementary'){
    hues = [baseHue, baseHue, (baseHue+180)%360, (baseHue+180)%360, baseHue];
  } else if(mode === 'analogous'){
    hues = [baseHue-30, baseHue-15, baseHue, baseHue+15, baseHue+30].map(h=>(h+360)%360);
  } else if(mode === 'triadic'){
    hues = [baseHue, baseHue, (baseHue+120)%360, (baseHue+240)%360, baseHue];
  } else if(mode === 'monochrome'){
    hues = [baseHue,baseHue,baseHue,baseHue,baseHue];
  }
  var out = document.getElementById('paletteOut');
  out.innerHTML = '';
  hues.forEach(function(h, i){
    var s = mode === 'monochrome' ? 55 : (55 + Math.random()*30);
    var l = mode === 'monochrome' ? (20 + i*15) : (40 + Math.random()*25);
    var hex = hslToHex(h, s, l);
    var card = document.createElement('div');
    card.className = 'swatch';
    card.title = 'Click to copy ' + hex;
    card.innerHTML = '<div class="fill" style="background:' + hex + '"></div><div class="label">' + hex + '</div>';
    card.onclick = function(){ navigator.clipboard.writeText(hex); };
    out.appendChild(card);
  });
}
if(document.getElementById('colorMode')){ genPalette(); }
