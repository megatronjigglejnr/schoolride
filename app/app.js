/* ===== SHARED CHILD STATE ===== */
/* Track, Full Route, and Notifications all read/write this one value
   instead of each guessing independently which child is "active". */
let activeChild = 'jane';

/* Colours for the hand-drawn SVG maps, read once from the tokens in styles.css so the CSS stays the only source. */
const rootCss = getComputedStyle(document.documentElement);
const T = {};
['ink', 'ink-rgb', 'on-ink', 'card', 'accent', 'stroke-quiet', 'map-ground', 'map-block', 'map-road-edge']
  .forEach(k => { T[k.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = rootCss.getPropertyValue('--' + k).trim(); });

const trackData = {
  jane: { name: "Jane's ride", firstName: 'Jane', eta: '12', dest: 'Oak Street', progress: 'Stop 3 of 5', fillPct: 52,
          stops: ['School', 'Oak St', 'Home'], activeStopIdx: 1,
          driverInitial: 'N', driverName: 'Mr. Naidoo', driverRole: 'Driving Route 4',
          gradeHeadInitial: 'P', gradeHeadName: 'Ms. Patel', gradeHeadRole: 'Grade 4 head', gradeHeadEnabled: false,
          registerInitial: 'C', registerName: 'Mr. Coetzee', registerRole: 'Register teacher', registerEnabled: false,
          lost: false, lostMinutes: 0 },
  liam: { name: "Liam's ride", firstName: 'Liam', eta: '6', dest: 'Birch Close', progress: 'Stop 2 of 4', fillPct: 78,
          stops: ['School', 'Birch Cl', 'Home'], activeStopIdx: 1,
          driverInitial: 'D', driverName: 'Ms. Dlamini', driverRole: 'Driving Route 1',
          gradeHeadInitial: 'Z', gradeHeadName: 'Mr. Zulu', gradeHeadRole: 'Grade 2 head', gradeHeadEnabled: false,
          registerInitial: 'A', registerName: 'Mrs. Adams', registerRole: 'Register teacher', registerEnabled: false,
          lost: false, lostMinutes: 0 }
};
trackData.jane.homeKm = 4.1; // approx. road distance from the bus to the child's home (mock)
trackData.liam.homeKm = 1.8;
trackData.jane.route = [{n:'Depot',s:'done'},{n:'Fern Ave',s:'done'},{n:'Oak St',s:'next'},{n:'Birch Cl',s:'todo'},{n:'School',s:'todo'}];
trackData.liam.route = [{n:'Depot',s:'done'},{n:'Birch Cl',s:'next'},{n:'Elm Rd',s:'todo'},{n:'Northgate',s:'todo'}];
const signalTimers = {};

function tickSignal(key) {
  const d = trackData[key];
  if (!d.lost) return;
  d.lostMinutes++;
  if (key === activeChild) renderTrack();
}

function toggleSignalDemo() {
  const d = trackData[activeChild];
  const key = activeChild;
  if (!d.lost) {
    d.lost = true;
    d.lostMinutes = 0;
    signalTimers[key] = setInterval(() => tickSignal(key), 2000); // 2s = 1 simulated minute
  } else {
    d.lost = false;
    d.lostMinutes = 0;
    clearInterval(signalTimers[key]);
  }
  renderTrack();
}

const callData = {
  jane: { school: 'Jane', driverInitial: 'N', driverName: 'Mr. Naidoo', driverRole: 'Driving Route 4', driverPhone: '+27825550104',
          contacts: [ { id: 'gradeHead', initial: 'P', name: 'Ms. Patel', role: 'Grade 4 head', phone: '+27115550142' },
                      { id: 'register', initial: 'C', name: 'Mr. Coetzee', role: 'Register teacher', phone: '+27115550143' } ] },
  liam: { school: 'Liam', driverInitial: 'D', driverName: 'Ms. Dlamini', driverRole: 'Driving Route 1', driverPhone: '+27825550111',
          contacts: [ { id: 'gradeHead', initial: 'K', name: 'Mr. Khumalo', role: 'Grade 2 head', phone: '+27125550171' },
                      { id: 'register', initial: 'W', name: 'Ms. Williams', role: 'Register teacher', phone: '+27125550172' } ] }
};
// Which school contacts a parent wants listed. Remembered per child (turning one off is a setting, never a barrier to calling).
const callPrefs = { jane: { gradeHead: true, register: true }, liam: { gradeHead: true, register: true } };
let callEdit = false;
const DEMO_CALLS = true;   // prototype: show a toast instead of leaving the page to dial. Real build: false, and tel: links dial.
const phoneIcon = (px, stroke) => '<svg width="' + px + '" height="' + px + '" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="2" aria-hidden="true"><use href="#i-phone"/></svg>';

function placeCall(e) {
  if (!DEMO_CALLS) return;
  e.preventDefault();
  showToast('Calling ' + e.currentTarget.dataset.name + '…');
}
function toggleCallEdit() { callEdit = !callEdit; renderCallSheet(); }
function toggleCallPref(id) {
  callPrefs[activeChild][id] = !callPrefs[activeChild][id];
  renderCallSheet();
  calSelectDate(calSelected);                       // the exam-day "running late" button follows this choice
}
// Who to offer when a child is running late: register teacher first, then grade head, only if the parent hasn't hidden them.
function lateContact() {
  const d = callData[activeChild], p = callPrefs[activeChild];
  return d.contacts.find(c => c.id === 'register' && p.register) || d.contacts.find(c => c.id === 'gradeHead' && p.gradeHead) || null;
}
function lateCallHtml() {
  const c = lateContact();
  if (!c) return '';
  return '<a class="call-late" href="tel:' + c.phone + '" data-name="' + c.name + '" aria-label="Running late? Call ' + c.name + ', ' + c.role + '" onclick="placeCall(event)">'
       + '<span class="cl-text"><b>Running late?</b><span>Call ' + c.name + ', ' + c.role.toLowerCase() + '</span></span>'
       + '<span class="cr-btn">' + phoneIcon(18, 'currentColor') + '</span></a>';
}

function renderCallSheet() {
  const d = callData[activeChild], t = trackData[activeChild], prefs = callPrefs[activeChild];
  let h = '';
  if (t.lost) h += '<div class="call-alert"><i></i><span>Signal lost ' + t.lostMinutes + ' min ago. Calling the driver is the fastest way to check in.</span></div>';
  h += '<a class="call-primary" href="tel:' + d.driverPhone + '" data-name="' + d.driverName + '" aria-label="Call ' + d.driverName + ', ' + d.driverRole.toLowerCase() + '" onclick="placeCall(event)">'
     + '<span class="cp-avatar">' + d.driverInitial + '</span>'
     + '<span class="cp-text"><span class="cp-name">' + d.driverName + '</span><span class="cp-role">' + d.driverRole + '</span></span>'
     + '<span class="cp-btn">' + phoneIcon(22, 'currentColor') + '</span></a>';
  h += '<div class="call-head"><h4>School contacts</h4><button type="button" class="link-btn" onclick="toggleCallEdit()">' + (callEdit ? 'Done' : 'Edit') + '</button></div>';
  const shown = d.contacts.filter(c => callEdit || prefs[c.id]);
  if (!shown.length) h += '<div class="call-empty">No school contacts in this list. Tap Edit to add them back.</div>';
  shown.forEach(c => {
    const text = '<span class="cr-text"><span class="cr-name">' + c.name + '</span><span class="cr-role">' + c.role + '</span></span>';
    if (callEdit) {
      h += '<div class="call-row"><span class="contact-avatar muted">' + c.initial + '</span>' + text
         + '<button type="button" class="switch' + (prefs[c.id] ? ' on' : '') + '" role="switch" aria-checked="' + prefs[c.id] + '" aria-label="Show ' + c.name + ' in this list" onclick="toggleCallPref(\'' + c.id + '\')"><span class="switch-knob"></span></button></div>';
    } else {
      h += '<a class="call-row" href="tel:' + c.phone + '" data-name="' + c.name + '" aria-label="Call ' + c.name + ', ' + c.role + '" onclick="placeCall(event)">'
         + '<span class="contact-avatar muted">' + c.initial + '</span>' + text + '<span class="cr-btn">' + phoneIcon(18, 'currentColor') + '</span></a>';
    }
  });
  h += '<p class="sheet-hint">' + (callEdit ? 'Choose who appears here. You can add anyone back later.' : 'Use these if ' + d.school + ' is running late for class or an exam.') + '</p>';
  document.getElementById('callSheetBody').innerHTML = h;
}

function setActiveChild(key) {
  activeChild = key;
  renderTrack();
  renderCallSheet();
  buildCalendar(); calSelectDate(calSelected);      // Schedule follows the child
  renderHistory();                                  // so does History
  renderShareList();
  document.querySelectorAll('.share-name').forEach(e => { e.textContent = trackData[key].firstName; });
  document.querySelectorAll('#trackSwitch .child-pill').forEach((p, i) => {
    const on = (i === 0 && key === 'jane') || (i === 1 && key === 'liam');
    p.classList.toggle('active', on); p.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (document.getElementById('routeOverlay').classList.contains('open')) renderRouteMap(key);
}

function renderTrack() {
  const d = trackData[activeChild];
  const card = document.getElementById('statusCard');
  const body = document.getElementById('statusCardBody');
  const alertTier = d.lost && d.lostMinutes >= 5;
  card.classList.toggle('lost', d.lost);

  if (!d.lost) {
    body.innerHTML = '<div class="chip"><span class="dot"></span>On the way</div>'
      + '<div class="eta-big"><span class="eta-num">' + d.eta + '</span><span class="eta-unit">min</span></div>'
      + '<div class="eta-next">Next stop: <b>' + d.dest + '</b></div>';
  } else {
    body.innerHTML = '<div class="chip lost' + (alertTier ? ' alert' : '') + '"><span class="dot"></span>Signal lost</div>'
      + '<div class="eta-big"><span class="eta-num">' + d.lostMinutes + '</span><span class="eta-unit">min ago</span></div>'
      + '<div class="eta-next">Last seen near <b>' + d.dest + '</b>' + (alertTier ? '' : ', still tracking') + '</div>'
      + (alertTier ? '<a class="lost-action" href="tel:' + callData[activeChild].driverPhone + '" data-name="' + d.driverName + '" onclick="placeCall(event)">Call ' + d.driverName + ' to check in</a>' : '');
  }

  document.getElementById('trackProgress').textContent = d.progress;
  document.getElementById('trackLine').innerHTML = d.route.map(function (s) {
    return '<li class="stop ' + s.s + '"' + (s.s === 'next' ? ' aria-current="step"' : '') + '>'
      + '<div class="node-wrap"><div class="node">' + (s.s === 'next' ? d.name.charAt(0) : '') + '</div></div>'
      + '<div class="label">' + s.n + '</div></li>';
  }).join('');
  document.getElementById('trackBus').style.setProperty('--p', d.fillPct / 100);
  renderMiniMap();
  renderDistances();

  document.getElementById('trackDriverAvatar').textContent = d.driverInitial;
  document.getElementById('trackDriverName').textContent = d.driverName;
  document.getElementById('trackDriverRole').textContent = d.driverRole;
  const cd = callData[activeChild], cb = document.getElementById('trackCallBtn');
  cb.href = 'tel:' + cd.driverPhone; cb.dataset.name = cd.driverName; cb.setAttribute('aria-label', 'Call ' + cd.driverName);
  document.getElementById('trackMoreBtn').setAttribute('aria-label', 'All contacts for ' + cd.school);
  document.getElementById('signalDemoLink').textContent = d.lost ? 'Restore signal (demo control)' : 'Simulate signal loss (demo control)';
  if (document.getElementById('navtab-track').classList.contains('active')) {
    document.getElementById('pageTitle').textContent = d.name;
  }
}

/* ===== DISTANCE FROM HOME (Track) =====
   Every linked child, measured from their home, so it reads the same wherever the parent is. Own children only. */
function renderDistances() {
  const html = ['jane', 'liam'].map(function (key) {
    const d = trackData[key];
    const where = (d.lost ? 'Last seen near ' : 'Bus near ') + d.dest;
    return '<li class="dist-row" aria-label="' + d.firstName + ': about ' + d.homeKm.toFixed(1) + ' kilometres from home. ' + where + '.">'
      + '<span class="contact-avatar' + (key === 'liam' ? ' muted' : '') + '" aria-hidden="true">' + d.firstName.charAt(0) + '</span>'
      + '<span class="dist-text" aria-hidden="true"><span class="dist-name">' + d.firstName + '</span><span class="dist-where">' + where + '</span></span>'
      + '<span class="dist-km" aria-hidden="true"><span class="dist-value">' + d.homeKm.toFixed(1) + ' km</span><span class="dist-unit">from home</span></span></li>';
  }).join('');
  document.getElementById('distList').innerHTML = html;
}

/* The parent's own profile (Account, Personal info) and their co-guardian, who is linked by the school. */
const profile = { name: 'Sarah Doe', phone: '+27 82 555 0142', email: 'sarah.doe@email.com' };
const coGuardian = { name: 'Thabo Doe' };

/* ===== GREETING =====
   By the phone's own clock and timezone: morning until noon, afternoon until five, evening after. */
function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}
function renderGreeting() {
  document.getElementById('greetLine').textContent = greetingFor(new Date().getHours()) + ',';
  document.querySelector('.greet-name').textContent = profile.name.split(' ')[0];
}
renderGreeting();
setInterval(renderGreeting, 60 * 1000);

/* ===== LIVE MAP CARD (Track) ===== */
const miniMapSpec = {
  jane: { pts: [[28,166],[96,138],[162,108],[234,78],[316,46]], busSeg: 1, busT: 0.62,
          roads: ['M-300 138 C -100 118, 100 168, 250 128 S 500 108, 650 128', 'M-300 36 C -100 66, 120 16, 300 46 S 520 76, 650 46',
                  'M72 -300 C 92 -100, 62 100, 88 500', 'M258 -300 C 238 -100, 278 100, 252 500'],
          blocks: [[118,150,56,28],[196,112,46,26],[268,96,52,30],[28,70,56,30],[150,16,70,26],[300,150,40,28]] },
  liam: { pts: [[34,70],[112,96],[198,130],[286,118]], busSeg: 0, busT: 0.7,
          roads: ['M-300 100 C -100 80, 80 130, 220 100 S 480 70, 650 90', 'M-300 160 C -80 150, 120 200, 280 170 S 520 150, 650 170',
                  'M150 -300 C 130 -100, 170 100, 140 500', 'M300 -300 C 280 -100, 320 100, 290 500'],
          blocks: [[60,100,50,30],[140,40,56,26],[236,76,48,30],[40,150,60,26],[262,18,60,28],[150,150,54,24]] }
};
function mmLerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function mmSegs(p) {            // Catmull-Rom through the stops, as cubic segments
  const s = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    s.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return s;
}
function mmSplit(b, t) {        // de Casteljau: split one cubic at t
  const a = mmLerp(b[0], b[1], t), m = mmLerp(b[1], b[2], t), n = mmLerp(b[2], b[3], t);
  const d = mmLerp(a, m, t), e = mmLerp(m, n, t), f = mmLerp(d, e, t);
  return [[b[0], a, d, f], [f, e, n, b[3]]];
}
function mmPath(segs) {
  const f = v => v.toFixed(1);
  let d = 'M' + f(segs[0][0][0]) + ' ' + f(segs[0][0][1]);
  segs.forEach(s => { d += ' C' + f(s[1][0]) + ' ' + f(s[1][1]) + ',' + f(s[2][0]) + ' ' + f(s[2][1]) + ',' + f(s[3][0]) + ' ' + f(s[3][1]); });
  return d;
}
function renderMiniMap() {
  const d = trackData[activeChild], spec = miniMapSpec[activeChild];
  const segs = mmSegs(spec.pts);
  const parts = mmSplit(segs[spec.busSeg], spec.busT);
  const doneSegs = segs.slice(0, spec.busSeg).concat([parts[0]]);
  const restSegs = [parts[1]].concat(segs.slice(spec.busSeg + 1));
  const bp = parts[0][3], b = segs[spec.busSeg], t = spec.busT, u = 1 - t;
  const dx = u * u * (b[1][0] - b[0][0]) + 2 * u * t * (b[2][0] - b[1][0]) + t * t * (b[3][0] - b[2][0]);
  const dy = u * u * (b[1][1] - b[0][1]) + 2 * u * t * (b[2][1] - b[1][1]) + t * t * (b[3][1] - b[2][1]);
  const ang = Math.max(-26, Math.min(26, Math.atan2(dy, dx) * 180 / Math.PI));
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let s = '<svg viewBox="0 0 350 196" preserveAspectRatio="xMidYMid meet" style="overflow:visible" aria-hidden="true">'
        + '<rect x="-500" y="-500" width="1350" height="1200" fill="' + T.mapGround + '"/>';
  spec.blocks.forEach(k => { s += '<rect x="' + k[0] + '" y="' + k[1] + '" width="' + k[2] + '" height="' + k[3] + '" rx="8" fill="' + T.mapBlock + '"/>'; });
  spec.roads.forEach(r => { s += '<path d="' + r + '" fill="none" stroke="' + T.mapRoadEdge + '" stroke-width="19" stroke-linecap="round"/>'; });
  spec.roads.forEach(r => { s += '<path d="' + r + '" fill="none" stroke="' + T.card + '" stroke-width="14" stroke-linecap="round"/>'; });
  s += '<path d="' + mmPath(restSegs) + '" fill="none" stroke="' + T.ink + '" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="0.1 9"/>';
  s += '<path d="' + mmPath(doneSegs) + '" fill="none" stroke="' + T.ink + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
  spec.pts.forEach((pt, k) => {
    const st = d.route[k].s, x = pt[0], y = pt[1];
    if (st === 'done') s += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + T.ink + '" stroke="' + T.card + '" stroke-width="3"/>';
    else if (st === 'next') {
      s += '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + T.card + '" stroke="' + T.ink + '" stroke-width="4"/>';
      if (!calm && !d.lost) s += '<circle cx="' + x + '" cy="' + y + '" r="13" fill="none" stroke="' + T.ink + '" stroke-width="3"><animate attributeName="r" values="13;24;13" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/></circle>';
    } else s += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + T.card + '" stroke="' + T.strokeQuiet + '" stroke-width="3"/>';
  });
  s += '<g transform="translate(' + bp[0].toFixed(1) + ' ' + bp[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ')" opacity="' + (d.lost ? 0.45 : 1) + '">'
     + '<ellipse cx="0" cy="11" rx="21" ry="4" fill="rgba(' + T.inkRgb + ',0.2)"/>'
     + '<use href="#bus" x="-23" y="-11" width="46" height="21" style="color:' + T.ink + '"/></g>';
  if (d.lost) s += '<circle cx="' + bp[0].toFixed(1) + '" cy="' + bp[1].toFixed(1) + '" r="27" fill="none" stroke="' + T.ink + '" stroke-width="2" stroke-dasharray="4 5" opacity="0.55"/>';
  s += '</svg>';
  document.getElementById('miniMap').innerHTML = s;
  document.getElementById('mapLive').classList.toggle('lost', d.lost);
  document.getElementById('mapLiveText').textContent = d.lost ? 'Last seen ' + d.lostMinutes + ' min ago' : 'Live';
}

/* ===== HISTORY (follows the active child) ===== */
const historyData = {
  jane: [
    { g: 'Yesterday', icon: 'confirm', t: 'Dropped off at Oak Street', time: '3:14 PM with Mr. Naidoo' },
    { g: 'Yesterday', icon: 'confirm', t: 'Picked up at Riverside Primary', time: '2:51 PM with Mr. Naidoo' },
    { g: 'Yesterday', icon: 'confirm', t: 'Arrived at Riverside Primary', time: '7:44 AM with Mr. Naidoo' },
    { g: 'Yesterday', icon: 'confirm', t: 'Picked up at Oak Street', time: '7:12 AM with Mr. Naidoo' },
    { g: 'Monday', icon: 'confirm', t: 'Dropped off at Oak Street', time: '3:09 PM with Mr. Naidoo' },
    { g: 'Monday', icon: 'confirm', t: 'Picked up at Oak Street', time: '7:15 AM with Mr. Naidoo' }
  ],
  liam: [
    { g: 'Yesterday', icon: 'confirm', t: 'Dropped off at Birch Close', time: '2:58 PM with Ms. Dlamini' },
    { g: 'Yesterday', icon: 'confirm', t: 'Picked up at Northgate Academy', time: '2:34 PM with Ms. Dlamini' },
    { g: 'Yesterday', icon: 'confirm', t: 'Arrived at Northgate Academy', time: '7:38 AM with Ms. Dlamini' },
    { g: 'Yesterday', icon: 'confirm', t: 'Picked up at Birch Close', time: '7:20 AM with Ms. Dlamini' },
    { g: 'Monday', icon: 'confirm', t: 'Dropped off at Birch Close', time: '2:55 PM with Ms. Dlamini' },
    { g: 'Monday', icon: 'confirm', t: 'Picked up at Birch Close', time: '7:23 AM with Ms. Dlamini' }
  ]
};
function renderHistory() {
  const d = trackData[activeChild], items = historyData[activeChild];
  let html = '<div class="notif-group-label">Today</div><div class="hist-card"><div class="hist-empty">Nothing logged yet today. ' + d.firstName + "'s ride is on its way.</div></div>";
  ['Yesterday', 'Monday'].forEach(g => {
    const rows = items.filter(r => r.g === g); if (!rows.length) return;
    html += '<div class="notif-group-label">' + g + '</div><div class="hist-card">' + rows.map(r =>
      '<div class="notif-item"><div class="notif-icon type-' + r.icon + '">' + notifIconSvg[r.icon] + '</div><div class="notif-body"><div class="notif-title">' + r.t + '</div><div class="notif-time">' + r.time + '</div></div></div>').join('') + '</div>';
  });
  document.getElementById('historyList').innerHTML = html;
}

let currentTab = 'track';
let indicatorPlaced = false;
const titles = { schedule: "Schedule", history: "History", profile: "Account" };

function switchTab(name) {
  document.querySelectorAll('.tabscreen').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.removeAttribute('aria-current'); });
  document.getElementById('tab-' + name).classList.add('active');
  // Account has no tab any more: the header avatar opens it, and no tab is marked while it is shown.
  const navtab = document.getElementById('navtab-' + name);
  if (navtab) { navtab.classList.add('active'); navtab.setAttribute('aria-current', 'page'); }
  const avatar = document.getElementById('accountBtn');
  if (name === 'profile') avatar.setAttribute('aria-current', 'page'); else avatar.removeAttribute('aria-current');
  document.getElementById('pageTitle').textContent = name === 'track' ? trackData[activeChild].name : titles[name];
  document.getElementById('backBtn').style.visibility = 'hidden';
  if (name === 'profile') {
    subStack = [];
    document.querySelectorAll('.subview').forEach(v => v.classList.remove('active'));
    document.getElementById('sub-account').classList.add('active');
  }
  currentTab = name;
  const tn = document.getElementById('mainTopnav'); tn.dataset.tab = name; delete tn.dataset.sub;
  setHeaderSize();
  moveIndicator(name);
  playEntrance(document.getElementById('tab-' + name));
  document.getElementById('mainContent').scrollTop = 0;
  updateHeaderGlass();
  if (fabOpen) toggleFab();
}

// Account and its sub-screens have no child switcher row, so their content starts higher.
function setHeaderSize() {
  const tn = document.getElementById('mainTopnav');
  const compact = tn.dataset.tab === 'profile' || tn.dataset.sub;
  document.getElementById('mainContent').dataset.hdr = compact ? 'compact' : '';
}
// A tab or step arriving: its blocks rise in once (styles.css, "page entrances").
function playEntrance(el) {
  if (!el) return;
  el.classList.remove('entering');
  void el.offsetWidth; // restart the animation if the same screen is shown again
  el.classList.add('entering');
  clearTimeout(el._enterTimer);
  el._enterTimer = setTimeout(() => el.classList.remove('entering'), 700);
}

// Account's sub-screens. They nest one level (Privacy opens Terms), so Back returns to wherever you came from.
const subTitles = { personal: 'Personal info', family: 'Family', privacy: 'Privacy', security: 'Login & security', terms: 'Terms & conditions' };
let subStack = [];
function showSub(name) {
  document.querySelectorAll('.subview').forEach(v => v.classList.remove('active'));
  document.getElementById('sub-' + name).classList.add('active');
  const tn = document.getElementById('mainTopnav');
  document.getElementById('pageTitle').textContent = name === 'account' ? 'Account' : subTitles[name];
  document.getElementById('backBtn').style.visibility = name === 'account' ? 'hidden' : 'visible';
  if (name === 'account') delete tn.dataset.sub; else tn.dataset.sub = '1';
  setHeaderSize();
  document.getElementById('mainContent').scrollTop = 0;
  updateHeaderGlass();
}
function goToSub(name) {
  if (currentTab !== 'profile') switchTab('profile');
  subStack.push(name);
  showSub(name);
  playEntrance(document.getElementById('tab-profile'));
}
function goToPersonal() { resetPersonalForm(); goToSub('personal'); }
function goToFamily() { goToSub('family'); }
function goToPrivacy() { goToSub('privacy'); }
function goToSecurity() { goToSub('security'); }
function goToTerms() { goToSub('terms'); }
function goBack() {
  subStack.pop();
  showSub(subStack.length ? subStack[subStack.length - 1] : 'account');
}
function toggleChild(id) {
  const open = document.getElementById('body-' + id).classList.toggle('open');
  document.getElementById('chev-' + id).classList.toggle('open', open);
  document.querySelector('#child-' + id + ' .child-card-head').setAttribute('aria-expanded', open);
  document.getElementById('body-' + id).inert = !open;
}

let fabOpen = false;
function toggleFab() {
  fabOpen = !fabOpen;
  const fab = document.getElementById('fab'), radial = document.getElementById('radial');
  fab.classList.toggle('open', fabOpen);
  fab.setAttribute('aria-expanded', fabOpen);
  radial.classList.toggle('open', fabOpen);
  radial.inert = !fabOpen; // closed actions are invisible, so keep them out of the tab order
  document.getElementById('scrim').classList.toggle('open', fabOpen);
}
function closeFabThen(fn) {
  if (fabOpen) toggleFab();
  setTimeout(fn, 120);
}

function toggleRecovery() {
  const sw = document.getElementById('recoverySwitch');
  const fields = document.getElementById('recoveryFields');
  const on = sw.classList.toggle('on');
  sw.setAttribute('aria-checked', on);
  fields.classList.toggle('show', on);
  fields.inert = !on;
}
// A whole toggle row is the switch: the row carries role="switch", the inner .switch is the visual.
function toggleRowSwitch(row) {
  const on = row.querySelector('.switch').classList.toggle('on');
  row.setAttribute('aria-checked', on);
}
function showSaved(which) {
  const id = which === 'pw' ? 'savedPw' : (which === 'email' ? 'savedEmail' : 'savedPersonal');
  const el = document.getElementById(id);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}


/* ===== ACCOUNT: profile, photos, family, privacy ===== */
// Photos are kept on this device as small data URLs; null shows initials (the default).
const photos = { me: null, jane: null, liam: null };
const picInitials = () => ({ me: initialsOf(profile.name), jane: 'J', liam: 'L' });
// Trusted family friends: people the parent can share a day's ETA with. Not linked to any child.
const RELATIONS = ['Grandparent', 'Relative', 'Neighbour', 'Friend'];
let trustedFriends = [{ id: 1, name: 'Naledi Mokoena', phone: '+27 83 555 0198', relation: 'Neighbour' }];
let friendRelation = 'Grandparent';

function esc(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// Every avatar marked data-pic shows that person's photo, or their initials.
function renderPics() {
  const ini = picInitials();
  document.querySelectorAll('[data-pic]').forEach(el => {
    const who = el.dataset.pic, url = photos[who];
    el.classList.toggle('has-photo', !!url);
    el.style.backgroundImage = url ? 'url("' + url + '")' : '';
    const i = el.querySelector('.pic-initials'); if (i) i.textContent = ini[who];
  });
}
function renderProfile() {
  document.querySelectorAll('.js-name').forEach(e => { e.textContent = profile.name; });
  document.querySelectorAll('.js-phone').forEach(e => { e.textContent = profile.phone; });
  document.getElementById('accountBtn').setAttribute('aria-label', 'Account, ' + profile.name);
  renderGreeting();
  renderPics();
}

/* Photo sheet: take one, pick one, a Memoji on Apple devices, or back to initials. */
let photoTarget = 'me';
// Memoji only exist on Apple devices; there is no API for the Apple Account's Memoji, so the parent picks
// one they've saved to Photos (a Memoji sticker can be saved from Messages).
function isAppleDevice() { return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent); }
function openPhotoSheet(who) {
  photoTarget = who;
  document.getElementById('photoTitle').textContent = who === 'me' ? 'Profile photo' : trackData[who].firstName + "'s photo";
  const prev = document.getElementById('photoPreview'); prev.dataset.pic = who;
  document.getElementById('memojiRow').hidden = !isAppleDevice();
  document.getElementById('photoRemoveRow').hidden = !photos[who];
  renderPics();
  openSheet('photo');
}
function pickPhoto(source) {
  const input = document.getElementById('photoInput');
  if (source === 'camera') input.setAttribute('capture', 'user'); else input.removeAttribute('capture');
  input.value = '';
  input.click();
}
// Scaled to 256px on its short side and centre-cropped square, so a phone photo stays small.
function photoChosen(input) {
  const file = input.files && input.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
      const k = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, s, s);
      setPhoto(photoTarget, c.toDataURL('image/png'));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function setPhoto(who, url) {
  photos[who] = url;
  renderPics();
  closeSheet('photo');
  showToast(url ? 'Photo updated' : 'Photo removed');
}
function removePhoto() { setPhoto(photoTarget, null); }

/* Personal info: name, phone and email, checked before saving. */
const PHONE_OK = (v) => v.replace(/[^\d]/g, '').length >= 9 && /^\+?[\d\s()-]+$/.test(v);
const EMAIL_OK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function fieldError(id, msg) {
  const input = document.getElementById(id), err = document.getElementById(id + 'Err');
  err.textContent = msg || '';
  if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  return !msg;
}
function resetPersonalForm() {
  document.getElementById('pfName').value = profile.name;
  document.getElementById('pfPhone').value = profile.phone;
  document.getElementById('pfEmail').value = profile.email;
  ['pfName', 'pfPhone', 'pfEmail'].forEach(id => fieldError(id, ''));
  document.getElementById('savedPersonal').classList.remove('show');
}
function savePersonal() {
  const name = document.getElementById('pfName').value.trim();
  const phone = document.getElementById('pfPhone').value.trim();
  const email = document.getElementById('pfEmail').value.trim();
  const ok = [
    fieldError('pfName', name ? '' : 'Enter your name.'),
    fieldError('pfPhone', PHONE_OK(phone) ? '' : 'Enter a phone number, like +27 82 555 0142.'),
    fieldError('pfEmail', EMAIL_OK(email) ? '' : 'Enter an email address, like you@example.com.'),
  ];
  if (ok.includes(false)) { document.querySelector('#personalForm [aria-invalid]').focus(); return; }
  const phoneChanged = phone !== profile.phone;
  Object.assign(profile, { name, phone, email });
  renderProfile();
  const note = document.getElementById('savedPersonal');
  note.textContent = phoneChanged ? 'Saved. We texted a code to ' + phone + ' to confirm it.' : 'Details updated.';
  note.classList.add('show');
  clearTimeout(note._t); note._t = setTimeout(() => note.classList.remove('show'), 3200);
}

/* Trusted family friends */
function renderFriends() {
  const list = document.getElementById('friendList');
  list.hidden = !trustedFriends.length;
  list.innerHTML = trustedFriends.map(f =>
    '<div class="person-row"><span class="contact-avatar muted" aria-hidden="true">' + esc(initialsOf(f.name)) + '</span>' +
    '<span class="person-info"><span class="contact-name">' + esc(f.name) + '</span><span class="contact-role">' + esc(f.relation) + ' · ' + esc(f.phone) + '</span></span>' +
    '<button type="button" class="icon-btn" aria-label="Remove ' + esc(f.name) + '" onclick="removeFriend(' + f.id + ')">' +
    '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><use href="#i-x"/></svg></button></div>'
  ).join('');
  renderShareList();
}
function renderRelations() {
  document.getElementById('frRel').innerHTML = RELATIONS.map(r =>
    '<button type="button" class="chip-opt' + (r === friendRelation ? ' on' : '') + '" role="radio" aria-checked="' + (r === friendRelation) + '" onclick="pickRelation(\'' + r + '\')">' + r + '</button>'
  ).join('');
}
function pickRelation(r) { friendRelation = r; renderRelations(); }
function openFriendSheet() {
  document.getElementById('frName').value = '';
  document.getElementById('frPhone').value = '';
  ['frName', 'frPhone'].forEach(id => fieldError(id, ''));
  friendRelation = 'Grandparent'; renderRelations();
  openSheet('friend');
}
function addFriend() {
  const name = document.getElementById('frName').value.trim();
  const phone = document.getElementById('frPhone').value.trim();
  const ok = [
    fieldError('frName', name ? '' : 'Enter their name.'),
    fieldError('frPhone', PHONE_OK(phone) ? '' : 'Enter their phone number.'),
  ];
  if (ok.includes(false)) { document.querySelector('#friendForm [aria-invalid]').focus(); return; }
  trustedFriends.push({ id: Date.now(), name, phone, relation: friendRelation });
  renderFriends();
  closeSheet('friend');
  setTimeout(() => showToast(name + ' added as a trusted friend'), 200);
}
function removeFriend(id) {
  const f = trustedFriends.find(x => x.id === id);
  trustedFriends = trustedFriends.filter(x => x.id !== id);
  renderFriends();
  if (f) showToast(f.name + ' removed');
}

/* Privacy: a copy of the parent's data, sent to their email. */
let dataRequested = false;
function requestData() {
  if (dataRequested) return;
  dataRequested = true;
  const btn = document.getElementById('dataRequestBtn');
  btn.textContent = 'Requested'; btn.setAttribute('aria-disabled', 'true'); btn.classList.add('done');
  const note = document.getElementById('dataRequested');
  note.textContent = "We'll email a copy to " + profile.email + ' within 30 days.';
  note.classList.add('show');
}

/* ===== BOTTOM SHEETS ===== */
function openSheet(which) {
  if (fabOpen) toggleFab();
  if (which === 'call') { callEdit = false; renderCallSheet(); }
  document.getElementById(which + 'Sheet').classList.add('open');
  document.getElementById(which + 'Sheet').inert = false;
  document.getElementById(which + 'Scrim').classList.add('open');
}
function closeSheet(which) {
  document.getElementById(which + 'Sheet').classList.remove('open');
  document.getElementById(which + 'Sheet').inert = true; // closed layers stay out of the tab order
  document.getElementById(which + 'Scrim').classList.remove('open');
}

/* ===== TOAST FEEDBACK ===== */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
// Share ETA lists the co-guardian, then the parent's trusted family friends.
function renderShareList() {
  const first = trackData[activeChild].firstName;
  const rows = [{ name: coGuardian.name, initials: initialsOf(coGuardian.name), role: 'Also linked to ' + first }]
    .concat(trustedFriends.map(f => ({ name: f.name, initials: initialsOf(f.name), role: 'Trusted friend · ' + f.relation })));
  document.getElementById('shareList').innerHTML = rows.map(r =>
    '<div class="contact-row"><div class="contact-left"><div class="contact-avatar muted" aria-hidden="true">' + esc(r.initials) + '</div>' +
    '<div><div class="contact-name">' + esc(r.name) + '</div><div class="contact-role">' + esc(r.role) + '</div></div></div>' +
    '<button type="button" class="btn-share" aria-label="Share with ' + esc(r.name) + '" data-name="' + esc(r.name) + '" onclick="fakeShare(this.dataset.name)">Share</button></div>'
  ).join('');
}
function fakeShare(name) {
  closeSheet('share');
  setTimeout(() => showToast('ETA shared with ' + name), 200);
}

/* ===== SCHEDULE CALENDAR ===== */
const examDaysByChild = {
  jane: { '2026-09-10': { pickup: '11:30', grouped: 2, subject: "Jane's maths exam" },
          '2026-09-17': { pickup: '10:15', grouped: 0, subject: "Jane's reading assessment" } },
  liam: { '2026-09-14': { pickup: '12:00', grouped: 1, subject: "Liam's spelling test" },
          '2026-09-21': { pickup: '09:30', grouped: 0, subject: "Liam's number skills check" } }
};
const examFor = () => examDaysByChild[activeChild];
let calYear = 2026, calMonth = 8; // September = index 8
let calSelected = '2026-09-06';
const todayStr = '2026-09-06';
const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateKey(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

function calShiftMonth(delta) {
  calMonth += delta;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  buildCalendar();
  calSelectDate(dateKey(calYear, calMonth, 1));
}

function buildCalendar() {
  document.getElementById('calMonthLabel').textContent = monthNames[calMonth] + ' ' + calYear;
  const grid = document.getElementById('calGrid');
  const firstWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const refocus = grid.contains(document.activeElement);
  let html = '';
  for (let i = 0; i < firstWeekday; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(calYear, calMonth, d);
    const isToday = key === todayStr;
    const isSelected = key === calSelected;
    const hasExam = examFor()[key];
    const weekday = new Date(calYear, calMonth, d).toLocaleDateString('en-US', { weekday: 'long' });
    html += '<button type="button" class="cal-day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : '') + '"'
          + ' aria-label="' + weekday + ', ' + d + ' ' + monthNames[calMonth] + (hasExam ? ', exam day' : '') + '"'
          + ' aria-pressed="' + isSelected + '"' + (isToday ? ' aria-current="date"' : '')
          + ' onclick="calSelectDate(\'' + key + '\')">'
          + d + (hasExam ? '<span class="cal-dot"></span>' : '') + '</button>';
  }
  grid.innerHTML = html;
  // Re-rendering replaces the buttons; keep keyboard focus on the chosen day.
  if (refocus) { const sel = grid.querySelector('.cal-day.selected'); if (sel) sel.focus(); }
}

function calSelectDate(key) {
  calSelected = key;
  buildCalendar();
  const [y, m, d] = key.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const label = weekday + ', ' + d + ' ' + monthNames[m - 1];

  const detail = document.getElementById('calDetail');
  const exam = examFor()[key];

  if (exam) {
    const groupNote = exam.grouped > 0
      ? 'Grouped with ' + exam.grouped + ' other child' + (exam.grouped > 1 ? 'ren' : '') + ' finishing nearby.'
      : 'Solo pickup — no other exam finishes were close enough to group.';
    detail.innerHTML = '<div class="cal-detail-date">' + label + '</div>'
      + '<div class="cal-badge-exam">Exam day — pickup adjusted</div>'
      + '<div class="cal-pickup"><mark>' + exam.pickup + '</mark><span class="cal-pickup-unit"> pickup</span></div>'
      + '<div class="cal-detail-note">' + exam.subject + '. ' + groupNote + '</div>' + lateCallHtml();
  } else {
    detail.innerHTML = '<div class="cal-detail-date">' + label + '</div>'
      + '<div class="cal-badge-regular">Regular day</div>'
      + '<div class="cal-detail-note">No exam scheduled — the usual route and pickup order apply.</div>';
  }
}

buildCalendar();
calSelectDate(calSelected);

/* ===== FULL ROUTE VIEW (Life360-style) ===== */
const routeMaps = {
  jane: '<svg viewBox="0 -125 320 570" preserveAspectRatio="xMidYMid slice">'
      + '<rect x="-10" y="-135" width="340" height="590" fill="' + T.mapGround + '"/>'
      + '<g stroke="' + T.card + '" stroke-width="9" fill="none">'
      + '<path d="M0 90 C 80 70, 150 120, 230 90 S 320 60, 320 60"/>'
      + '<path d="M0 190 C 90 210, 180 160, 260 190 S 320 210, 320 210"/>'
      + '<path d="M60 0 C 40 100, 90 200, 60 320"/>'
      + '</g>'
      + '<path d="M 40 280 C 80 250, 70 190, 130 175 C 190 160, 190 100, 175 60" fill="none" stroke="' + T.ink + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<circle cx="40" cy="280" r="6" fill="' + T.ink + '"/><text x="52" y="284" font-size="11" fill="' + T.ink + '" font-family="Archivo">Home</text>'
      + '<circle cx="130" cy="175" r="9" fill="' + T.card + '" stroke="' + T.ink + '" stroke-width="3.5"/><text x="142" y="179" font-size="11" fill="' + T.ink + '" font-family="Archivo">Oak Street</text>'
      + '<rect x="163" y="46" width="24" height="20" rx="5" fill="' + T.ink + '"/><text x="176" y="60" text-anchor="middle" font-size="11" font-weight="800" fill="' + T.onInk + '" font-family="Archivo">S</text><text x="192" y="60" font-size="11" fill="' + T.ink + '" font-family="Archivo">Riverside Primary</text>'
      + '<circle cx="84" cy="210" r="11" fill="none" stroke="' + T.accent + '" stroke-width="2" opacity="0.6"><animate attributeName="r" values="9;20;9" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/></circle>'
      + '<circle cx="84" cy="210" r="9" fill="' + T.accent + '" stroke="' + T.ink + '" stroke-width="3"/>'
      + '</svg>',
  liam: '<svg viewBox="0 -125 320 570" preserveAspectRatio="xMidYMid slice">'
      + '<rect x="-10" y="-135" width="340" height="590" fill="' + T.mapGround + '"/>'
      + '<g stroke="' + T.card + '" stroke-width="9" fill="none">'
      + '<path d="M0 100 C 90 80, 160 130, 240 100 S 320 80, 320 80"/>'
      + '<path d="M0 200 C 100 220, 190 170, 270 200 S 320 220, 320 220"/>'
      + '<path d="M260 0 C 240 100, 280 200, 260 320"/>'
      + '</g>'
      + '<path d="M 280 290 C 260 250, 240 220, 210 190 C 190 160, 230 100, 250 60" fill="none" stroke="' + T.ink + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
      + '<circle cx="280" cy="290" r="6" fill="' + T.ink + '"/><text x="228" y="304" font-size="11" fill="' + T.ink + '" font-family="Archivo">Home</text>'
      + '<circle cx="210" cy="190" r="9" fill="' + T.card + '" stroke="' + T.ink + '" stroke-width="3.5"/><text x="120" y="194" font-size="11" fill="' + T.ink + '" font-family="Archivo">Birch Close</text>'
      + '<rect x="238" y="46" width="24" height="20" rx="5" fill="' + T.ink + '"/><text x="250" y="60" text-anchor="middle" font-size="11" font-weight="800" fill="' + T.onInk + '" font-family="Archivo">N</text><text x="130" y="60" font-size="11" fill="' + T.ink + '" font-family="Archivo">Northgate Academy</text>'
      + '<circle cx="238" cy="228" r="11" fill="none" stroke="' + T.accent + '" stroke-width="2" opacity="0.6"><animate attributeName="r" values="9;20;9" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/></circle>'
      + '<circle cx="238" cy="228" r="9" fill="' + T.accent + '" stroke="' + T.ink + '" stroke-width="3"/>'
      + '</svg>'
};
const routeTitles = { jane: "Jane's route", liam: "Liam's route" };
let routeScale = 1;

function openRouteView() {
  document.getElementById('routeOverlay').classList.add('open');
  document.getElementById('routeOverlay').inert = false;
  renderRouteMap(activeChild);
  const idx = activeChild === 'jane' ? 0 : 1;
  setActiveDot(idx);
  setTimeout(() => {
    const cardEl = routeCarousel.querySelector('.route-card');
    const cardWidth = cardEl.offsetWidth + 12;
    routeCarousel.scrollLeft = idx * cardWidth;
  }, 20);
}
function closeRouteView() {
  document.getElementById('routeOverlay').classList.remove('open');
  document.getElementById('routeOverlay').inert = true;
}
function renderRouteMap(key) {
  document.getElementById('routeMap').innerHTML = routeMaps[key];
  document.getElementById('routeTitle').textContent = routeTitles[key];
  routeScale = 1;
}
function routeZoom(factor) {
  routeScale = Math.min(1.6, Math.max(0.85, routeScale * factor));
  const svg = document.querySelector('#routeMap svg');
  if (svg) { svg.style.transform = 'scale(' + routeScale + ')'; svg.style.transformOrigin = 'center'; }
}
function setActiveDot(idx) {
  document.querySelectorAll('#routeDots .dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

const routeCarousel = document.getElementById('routeCarousel');
let routeScrollTimer = null;
routeCarousel.addEventListener('scroll', function() {
  clearTimeout(routeScrollTimer);
  routeScrollTimer = setTimeout(function() {
    const cardEl = routeCarousel.querySelector('.route-card');
    const cardWidth = cardEl.offsetWidth + 12; // gap
    const idx = Math.round(routeCarousel.scrollLeft / cardWidth);
    setActiveDot(idx);
    const key = idx === 0 ? 'jane' : 'liam';
    renderRouteMap(key);
    if (key !== activeChild) setActiveChild(key);
  }, 80);
});

/* ===== NOTIFICATIONS ===== */
const notifications = [
  { id: 1, group: 'Today', icon: 'move', child: 'liam', title: "Liam's ride is 6 min away", time: '7:31 AM', unread: true, goto: () => switchTab('track') },
  { id: 2, group: 'Today', icon: 'info', child: 'jane', title: 'ETA shared with Thabo Doe', time: '6:58 AM', unread: false, goto: null },
  { id: 3, group: 'Yesterday', icon: 'confirm', child: 'jane', title: 'Jane dropped off at Oak Street', time: '3:14 PM', unread: false, goto: () => switchTab('history') },
  { id: 4, group: 'Yesterday', icon: 'info', child: 'jane', title: "Jane's exam-day pickup adjusted to 11:30", time: 'For Sep 10', unread: true, goto: () => { switchTab('schedule'); calSelectDate('2026-09-10'); } },
  { id: 5, group: 'Yesterday', icon: 'info', child: 'liam', title: "Liam's spelling test pickup set for 12:00", time: 'For Sep 14', unread: true, goto: () => { switchTab('schedule'); calSelectDate('2026-09-14'); } },
  { id: 6, group: 'Earlier', icon: 'info', child: 'liam', title: "Liam's route now driven by Ms. Dlamini", time: 'Sep 8', unread: false, goto: null }
];

const notifIconSvg = {
  move: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#i-pin"/></svg>',
  confirm: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#i-info"/></svg>'
};

function buildNotifications() {
  const list = document.getElementById('notifList');
  const focusedId = list.contains(document.activeElement) ? document.activeElement.dataset.id : null;
  const groups = ['Today', 'Yesterday', 'Earlier'];
  let html = '';
  groups.forEach(g => {
    const items = notifications.filter(n => n.group === g);
    if (!items.length) return;
    html += '<div class="notif-group-label">' + g + '</div>';
    items.forEach(n => {
      html += '<button type="button" class="notif-item' + (n.unread ? '' : ' read') + '" data-id="' + n.id + '" onclick="handleNotifTap(' + n.id + ')">'
            + '<span class="notif-icon type-' + n.icon + '" aria-hidden="true">' + notifIconSvg[n.icon] + '</span>'
            + '<span class="notif-body"><span class="notif-title">' + (n.unread ? '<span class="sr-only">Unread: </span>' : '') + n.title + '</span><span class="notif-time">' + n.time + (n.child ? '<span class="notif-who">' + trackData[n.child].firstName + '</span>' : '') + '</span></span>'
            + (n.unread ? '<span class="notif-unread-dot" aria-hidden="true"></span>' : '')
            + '</button>';
    });
  });
  list.innerHTML = html;
  // Re-rendering replaces the buttons; keep keyboard focus on the one just used.
  if (focusedId) { const again = list.querySelector('[data-id="' + focusedId + '"]'); if (again) again.focus(); }
  updateBellBadge();
}

function updateBellBadge() {
  const unread = notifications.filter(n => n.unread).length;
  document.getElementById('bellBadge').classList.toggle('show', unread > 0);
  document.getElementById('bellBtn').setAttribute('aria-label', unread ? 'Notifications, ' + unread + ' unread' : 'Notifications');
}

function handleNotifTap(id) {
  const n = notifications.find(x => x.id === id);
  if (!n) return;
  n.unread = false;
  buildNotifications();
  if (n.goto) {
    if (n.child) setActiveChild(n.child);
    closeNotifications();
    setTimeout(n.goto, 150);
  }
}

function markAllRead() {
  notifications.forEach(n => n.unread = false);
  buildNotifications();
}

function openNotifications() {
  buildNotifications();
  document.getElementById('notifOverlay').classList.add('open');
  document.getElementById('notifOverlay').inert = false;
}
function closeNotifications() {
  document.getElementById('notifOverlay').classList.remove('open');
  document.getElementById('notifOverlay').inert = true;
}

buildNotifications();
renderTrack();
renderCallSheet();
renderHistory();
renderFriends();
renderProfile();

/* ===== ONBOARDING ===== */
function obGoTo(step) {
  // The terms are written once, in Account; onboarding shows the same text.
  if (step === 'terms' && !document.getElementById('obTermsBody').firstChild) {
    document.getElementById('obTermsBody').appendChild(document.querySelector('#sub-terms .legal').cloneNode(true));
  }
  document.querySelectorAll('.onboard-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ob-' + step).classList.add('active');
  document.getElementById('onboardFlow').classList.toggle('welcome-mode', step === 'welcome');
}
function obSubmitPhone() {
  const phone = document.getElementById('obPhone').value.trim();
  if (!fieldError('obPhone', PHONE_OK(phone) ? '' : 'Enter the number you gave the school, like +27 82 555 0142.')) {
    document.getElementById('obPhone').focus();
    return;
  }
  document.getElementById('obPhoneEcho').textContent = phone;
  resetOtp();
  document.getElementById('otpResend').style.visibility = 'visible';
  obGoTo('otp');
  setTimeout(() => document.querySelector('#otpRow input').focus(), 350);
}
// After the code is sent: back to the phone step, number kept, to fix a typo.
function obChangeNumber() {
  resetOtp();
  obGoTo('verify');
  setTimeout(() => document.getElementById('obPhone').focus(), 50);
}
function obEnableNotifs() {
  showToast('Notifications enabled');
  setTimeout(obFinish, 500);
}
function obFinish() {
  playEntrance(document.getElementById('tab-' + currentTab));
  document.getElementById('onboardFlow').classList.add('done');
  document.getElementById('onboardFlow').inert = true;
}
function obSkip() {
  obFinish();
}

// OTP: 6 digits. Auto-advance, paste, correctness check, then wrap -> deck -> checkmark.
const OTP_CORRECT = '123456';
let otpBusy = false;
const otpInputs = () => [...document.querySelectorAll('#otpRow input')];

function resetOtp() {
  otpBusy = false;
  document.getElementById('otpRow').classList.remove('collapse', 'merge', 'solid', 'shake');
  document.getElementById('otpSuccess').classList.remove('show', 'instant');
  document.getElementById('otpRow').classList.remove('instant');
  otpMessage('');
  document.querySelectorAll('.otp-box').forEach(b => b.classList.remove('swoosh'));
  otpInputs().forEach(i => { i.value = ''; i.readOnly = false; });
}

function checkOtpComplete() {
  if (otpBusy) return;
  const inputs = otpInputs();
  const code = inputs.map(i => i.value).join('');
  if (code.length < inputs.length) return;
  if (code === OTP_CORRECT) runOtpSuccess(); else runOtpError(inputs);
}

function otpMessage(msg) {
  document.getElementById('otpError').textContent = msg;
}

function runOtpSuccess() {
  otpBusy = true;
  const boxes = [...document.querySelectorAll('.otp-box')];
  const row = document.getElementById('otpRow');
  const success = document.getElementById('otpSuccess');
  otpInputs().forEach(i => { i.blur(); i.readOnly = true; });
  document.getElementById('otpResend').style.visibility = 'hidden';
  otpMessage('');

  // Reduced motion: no rings, deck or merge; straight to the one checked box, then on.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    row.classList.add('instant', 'collapse', 'merge', 'solid');
    success.classList.add('instant', 'show');
    setTimeout(() => obGoTo('confirm'), 900);
    return;
  }

  const STAGGER = 110, WRAP = 750;
  boxes.forEach((b, i) => setTimeout(() => b.classList.add('swoosh'), i * STAGGER));
  const wrapDone = (boxes.length - 1) * STAGGER + WRAP;

  const FAN = wrapDone + 80, MERGE = FAN + 560, SOLID = MERGE + 460;
  setTimeout(() => row.classList.add('collapse'), FAN);                       // the deck
  setTimeout(() => row.classList.add('merge'), MERGE);                        // straighten + slide into one spot, digits fade
  setTimeout(() => { row.classList.add('solid'); success.classList.add('show'); }, SOLID);   // five dissolve, one box pops and takes the check
  setTimeout(() => obGoTo('confirm'), SOLID + 1050);
}

function runOtpError(inputs) {
  otpBusy = true;
  const row = document.getElementById('otpRow');
  row.classList.add('shake');
  otpMessage("That code didn't match. Check the text and try again.");
  setTimeout(() => {
    row.classList.remove('shake');
    inputs.forEach(i => i.value = '');
    otpBusy = false;
    inputs[0].focus();
  }, 420);
}

otpInputs().forEach((input, idx, all) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(-1);
    if (input.value) otpMessage('');
    if (input.value && idx < all.length - 1) all[idx + 1].focus();
    checkOtpComplete();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !input.value && idx > 0) { all[idx - 1].value = ''; all[idx - 1].focus(); }
    if (e.key === 'ArrowLeft' && idx > 0) all[idx - 1].focus();
    if (e.key === 'ArrowRight' && idx < all.length - 1) all[idx + 1].focus();
  });
  input.addEventListener('focus', () => input.select());
});
document.getElementById('otpRow').addEventListener('paste', (e) => {
  const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
  if (!digits) return;
  e.preventDefault();
  const all = otpInputs();
  digits.split('').forEach((d, i) => { all[i].value = d; });
  all[Math.min(digits.length, all.length - 1)].focus();
  checkOtpComplete();
});

/* ===== LIQUID GLASS NAV ===== */
// The active tab's marigold bar glides under the new tab's label. Placed without motion on load and resize.
function moveIndicator(name, instant) {
  const bar = document.getElementById('tabIndicator');
  const tab = document.getElementById('navtab-' + name);
  if (!bar) return;
  bar.style.opacity = tab ? '' : '0'; // Account: no tab is active
  if (!tab) return;
  const x = tab.offsetLeft + tab.offsetWidth / 2 - bar.offsetWidth / 2;
  if (instant || !indicatorPlaced) {
    bar.style.transition = 'none';
    bar.style.setProperty('--x', x + 'px');
    void bar.offsetWidth;
    bar.style.transition = '';
    indicatorPlaced = true;
  } else {
    bar.style.setProperty('--x', x + 'px');
  }
}

function updateHeaderGlass() {
  document.getElementById('mainTopnav').classList.toggle('scrolled', document.getElementById('mainContent').scrollTop > 6);
}

(function initGlass() {
  document.getElementById('mainContent').addEventListener('scroll', updateHeaderGlass, { passive: true });
  const bar = document.getElementById('tabbar');
  bar.addEventListener('pointerenter', () => bar.classList.add('lit'));
  bar.addEventListener('pointerleave', () => bar.classList.remove('lit'));
  bar.addEventListener('pointermove', (e) => {
    const r = bar.getBoundingClientRect();
    bar.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    bar.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  });
  moveIndicator(currentTab, true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveIndicator(currentTab, true));
  window.addEventListener('resize', () => moveIndicator(currentTab, true));
})();

/* ===== START-UP =====
   Decorative, so with reduced motion it is skipped outright (its delays would otherwise still hold the screen).
   When it ends, the first screen's blocks rise in. */
(function startUp() {
  const intro = document.getElementById('intro');
  const done = () => {
    intro.remove();
    playEntrance(document.querySelector('.onboard-flow:not(.done) .onboard-step.active') || document.getElementById('tab-' + currentTab));
  };
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { intro.remove(); return; }
  intro.addEventListener('animationend', (e) => { if (e.animationName === 'introOut') done(); });
})();
