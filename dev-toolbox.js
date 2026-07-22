// ---------- Tabs ----------
var tabDefs = [
  ['json','JSON'],['base64','Base64'],['words','Word Count'],['case','Case Convert'],
  ['lorem','Lorem Ipsum'],['regex','Regex Tester'],['diff','Diff Checker'],['markdown','Markdown']
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
  if(el.select) el.select();
  navigator.clipboard.writeText(el.value !== undefined ? el.value : el.textContent);
}

// ---------- JSON ----------
function jsonFormat(indent){
  var errEl = document.getElementById('jsonErr');
  errEl.textContent = '';
  try{
    var parsed = JSON.parse(document.getElementById('jsonIn').value);
    document.getElementById('jsonOut').value = JSON.stringify(parsed, null, indent);
  }catch(e){
    errEl.textContent = 'Invalid JSON: ' + e.message;
    document.getElementById('jsonOut').value = '';
  }
}

// ---------- Base64 ----------
function b64Encode(){
  var errEl = document.getElementById('b64Err'); errEl.textContent='';
  try{
    var bytes = new TextEncoder().encode(document.getElementById('b64In').value);
    var bin = '';
    bytes.forEach(function(b){ bin += String.fromCharCode(b); });
    document.getElementById('b64Out').value = btoa(bin);
  }catch(e){ errEl.textContent = 'Encode error: ' + e.message; }
}
function b64Decode(){
  var errEl = document.getElementById('b64Err'); errEl.textContent='';
  try{
    var bin = atob(document.getElementById('b64In').value.trim());
    var bytes = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    document.getElementById('b64Out').value = new TextDecoder().decode(bytes);
  }catch(e){ errEl.textContent = 'Invalid Base64 input'; }
}

// ---------- Word Count ----------
function wordCount(){
  var text = document.getElementById('wcIn').value;
  var trimmed = text.trim();
  var words = trimmed.length ? trimmed.split(/\s+/) : [];
  var sentenceMatches = text.match(/[^.!?]+[.!?]+/g);
  var sentences = sentenceMatches ? sentenceMatches.length : (trimmed.length ? 1 : 0);
  var paragraphs = text.split(/\n\s*\n/).filter(function(p){ return p.trim().length; });
  document.getElementById('wcWords').textContent = words.length;
  document.getElementById('wcChars').textContent = text.length;
  document.getElementById('wcCharsNoSpace').textContent = text.replace(/\s/g,'').length;
  document.getElementById('wcSentences').textContent = sentences;
  document.getElementById('wcParagraphs').textContent = paragraphs.length || (trimmed.length?1:0);
  var secs = Math.ceil(words.length / 200 * 60);
  document.getElementById('wcReadTime').textContent = secs < 60 ? secs+'s' : Math.round(secs/60)+'m';
}

// ---------- Case Converter ----------
function caseConvert(mode){
  var text = document.getElementById('caseIn').value;
  var out = text;
  var words = text.trim().split(/\s+/).filter(Boolean);
  if(mode==='upper') out = text.toUpperCase();
  else if(mode==='lower') out = text.toLowerCase();
  else if(mode==='title') out = words.map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); }).join(' ');
  else if(mode==='sentence') out = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function(c){ return c.toUpperCase(); });
  else if(mode==='camel') out = words.map(function(w,i){ return i===0 ? w.toLowerCase() : w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); }).join('');
  else if(mode==='snake') out = words.map(function(w){ return w.toLowerCase(); }).join('_');
  else if(mode==='kebab') out = words.map(function(w){ return w.toLowerCase(); }).join('-');
  document.getElementById('caseOut').value = out;
}

// ---------- Lorem Ipsum ----------
var loremBank = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(' ');
function loremGen(){
  var paras = Math.max(1, parseInt(document.getElementById('loremParas').value)||1);
  var wordsPer = Math.max(5, parseInt(document.getElementById('loremWords').value)||40);
  var classic = document.getElementById('loremClassic').value === 'yes';
  var out = [];
  for(var p=0;p<paras;p++){
    var ws = [];
    for(var w=0; w<wordsPer; w++){
      ws.push(loremBank[Math.floor(Math.random()*loremBank.length)]);
    }
    if(p===0 && classic){
      ws = "lorem ipsum dolor sit amet consectetur adipiscing elit".split(' ').concat(ws.slice(8));
    }
    var sentence = ws.join(' ');
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
    out.push(sentence);
  }
  document.getElementById('loremOut').value = out.join('\n\n');
}

// ---------- Regex Tester ----------
function regexTest(){
  var errEl = document.getElementById('regexErr'); errEl.textContent='';
  var pattern = document.getElementById('regexPattern').value;
  var flags = document.getElementById('regexFlags').value;
  var input = document.getElementById('regexInput').value;
  var highlightEl = document.getElementById('regexHighlight');
  var matchesEl = document.getElementById('regexMatches');
  matchesEl.innerHTML = ''; highlightEl.textContent = input;
  if(!pattern){ return; }
  var re;
  try{ re = new RegExp(pattern, flags.indexOf('g')>-1 ? flags : flags+'g'); }
  catch(e){ errEl.textContent = 'Invalid regex: ' + e.message; return; }
  var match, matches = [], lastIndex = 0, htmlParts = [];
  var esc = function(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
  while((match = re.exec(input)) !== null){
    matches.push(match);
    htmlParts.push(esc(input.slice(lastIndex, match.index)));
    htmlParts.push('<mark>' + esc(match[0]) + '</mark>');
    lastIndex = match.index + match[0].length;
    if(match[0].length === 0) re.lastIndex++;
  }
  htmlParts.push(esc(input.slice(lastIndex)));
  highlightEl.innerHTML = htmlParts.join('');
  if(matches.length === 0){
    matchesEl.innerHTML = '<div class="match-item">No matches</div>';
  }else{
    matchesEl.innerHTML = matches.map(function(m,i){
      var groups = m.length>1 ? ' — groups: ' + JSON.stringify(m.slice(1)) : '';
      return '<div class="match-item">#' + (i+1) + ': "' + esc(m[0]) + '" at index ' + m.index + groups + '</div>';
    }).join('');
  }
}

// ---------- Diff Checker (line-based LCS) ----------
function diffCompare(){
  var a = document.getElementById('diffA').value.split('\n');
  var b = document.getElementById('diffB').value.split('\n');
  var n = a.length, m = b.length;
  var dp = [];
  for(var x=0;x<=n;x++){ dp.push(new Array(m+1).fill(0)); }
  for(var i=n-1;i>=0;i--){
    for(var j=m-1;j>=0;j--){
      dp[i][j] = a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
    }
  }
  var i=0,j=0; var rows=[];
  while(i<n && j<m){
    if(a[i]===b[j]){ rows.push(['ctx', a[i]]); i++; j++; }
    else if(dp[i+1][j] >= dp[i][j+1]){ rows.push(['rem', a[i]]); i++; }
    else { rows.push(['add', b[j]]); j++; }
  }
  while(i<n){ rows.push(['rem', a[i]]); i++; }
  while(j<m){ rows.push(['add', b[j]]); j++; }
  var esc = function(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
  document.getElementById('diffOut').innerHTML = rows.map(function(pair){
    var type = pair[0], line = pair[1];
    var cls = type==='add' ? 'diff-add' : type==='rem' ? 'diff-rem' : 'diff-ctx';
    var prefix = type==='add' ? '+ ' : type==='rem' ? '- ' : '  ';
    return '<div class="diff-line ' + cls + '">' + prefix + esc(line) + '</div>';
  }).join('');
}

// ---------- Markdown Preview (lightweight) ----------
function mdRender(){
  var src = document.getElementById('mdIn').value;
  var esc = function(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var blocks = [];
  src = src.replace(/```([\s\S]*?)```/g, function(_,code){
    blocks.push('<pre><code>'+esc(code.trim())+'</code></pre>');
    return '~~~BLOCK' + (blocks.length-1) + '~~~';
  });
  var html = esc(src);
  html = html.replace(/^###### (.*)$/gm,'<h6>$1</h6>')
             .replace(/^##### (.*)$/gm,'<h5>$1</h5>')
             .replace(/^#### (.*)$/gm,'<h4>$1</h4>')
             .replace(/^### (.*)$/gm,'<h3>$1</h3>')
             .replace(/^## (.*)$/gm,'<h2>$1</h2>')
             .replace(/^# (.*)$/gm,'<h1>$1</h1>')
             .replace(/^&gt; (.*)$/gm,'<blockquote>$1</blockquote>')
             .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
             .replace(/\*(.+?)\*/g,'<em>$1</em>')
             .replace(/_(.+?)_/g,'<em>$1</em>')
             .replace(/`([^`]+?)`/g,'<code>$1</code>')
             .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
             .replace(/^[ \t]*[-*] (.*)$/gm,'<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(?:\n<li>.*<\/li>)*)/g, function(m){ return '<ul>' + m.replace(/\n/g,'') + '</ul>'; });
  html = html.split(/\n{2,}/).map(function(block){
    block = block.trim();
    if(!block) return '';
    if(/^<(h[1-6]|ul|blockquote)/.test(block)) return block;
    if(/^~~~BLOCK/.test(block)) return block;
    return '<p>' + block.replace(/\n/g,'<br>') + '</p>';
  }).filter(Boolean).join('\n');
  html = html.replace(/~~~BLOCK(\d+)~~~/g, function(_,idx){ return blocks[idx]; });
  document.getElementById('mdPreview').innerHTML = html;
}
if(document.getElementById('mdIn')){ mdRender(); }
