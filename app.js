const moodInput = document.getElementById('moodInput');
const generateBtn = document.getElementById('generateBtn');
const canvasContainer = document.getElementById('canvasContainer');
const presetButtons = document.getElementById('presetButtons');
const muteBtn = document.getElementById('muteBtn');
const languageSelect = document.getElementById('languageSelect');
const title = document.getElementById('title');
const description = document.getElementById('description');
const languageLabel = document.getElementById('languageLabel');
const happyBtn = document.getElementById('happyBtn');
const sadBtn = document.getElementById('sadBtn');
const neutralBtn = document.getElementById('neutralBtn');
const historyBtn = document.getElementById('historyBtn');
const moodRankingContainer = document.getElementById('moodRankingContainer');
const moodCalendar = document.getElementById('moodCalendar');
const moodStats = document.getElementById('moodStats');
const rankingTitle = document.getElementById('rankingTitle');
const closeRankingBtn = document.getElementById('closeRankingBtn');

let scene, camera, renderer;
let particles = [];
let audioCtx, gainNode, oscillator;
let animationId = null;
let isMuted = false;
let isMouseInCanvas = false;
let currentLanguage = 'en';
let currentMoodText = '';
let currentMoodScore = 0;
let moodHistory = {}; // Object to store mood history by date

const sentiment = new Sentiment();

function initScene(palette) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
  camera.position.z = 50;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
  canvasContainer.innerHTML = '';
  canvasContainer.appendChild(renderer.domElement);

  scene.background = new THREE.Color(palette.background);

  particles = [];
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: palette.particle });

  for (let i = 0; i < 150; i++) {
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    );
    sphere.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      )
    };
    particles.push(sphere);
    scene.add(sphere);
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  particles.forEach(p => {
    p.position.add(p.userData.velocity);
    if (p.position.x > 50 || p.position.x < -50) p.userData.velocity.x *= -1;
    if (p.position.y > 25 || p.position.y < -25) p.userData.velocity.y *= -1;
    if (p.position.z > 25 || p.position.z < -25) p.userData.velocity.z *= -1;
  });
  renderer.render(scene, camera);
}

function stopAnimation() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function setupAudio(palette) {
  if (audioCtx) {
    audioCtx.close();
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = isMuted || !isMouseInCanvas ? 0 : 0.15;
  gainNode.connect(audioCtx.destination);

  oscillator = audioCtx.createOscillator();
  oscillator.type = palette.soundWave;
  oscillator.frequency.value = palette.soundFreq;
  oscillator.connect(gainNode);
  oscillator.start();
}

function updateAudio(freq) {
  if (!oscillator) return;
  oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
}

function toggleMute() {
  isMuted = !isMuted;
  muteBtn.innerHTML = isMuted
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';

  if (gainNode) {
    gainNode.gain.value = isMuted ? 0 : (isMouseInCanvas ? 0.15 : 0);
  }
}

function updateAudioState() {
  if (!gainNode) return;
  gainNode.gain.value = isMuted || !isMouseInCanvas ? 0 : 0.15;
}

function mapMoodToPalette(score) {
  if (score > 1) {
    return {
      background: '#89CFF0',
      particle: '#FFE156',
      soundWave: 'triangle',
      soundFreq: 440
    };
  }
  if (score < 0) {
    return {
      background: '#2E4057',
      particle: '#FF6F91',
      soundWave: 'sawtooth',
      soundFreq: 220
    };
  }
  return {
    background: '#A3D9FF',
    particle: '#FF9671',
    soundWave: 'sine',
    soundFreq: 330
  };
}

function onGenerate() {
  stopAnimation();
  const text = moodInput.value.trim();
  if (!text) return;

  const result = sentiment.analyze(text);
  const score = result.score;

  currentMoodText = text;
  currentMoodScore = score;
  

  const today = new Date().toISOString().split('T')[0]; 
  moodHistory[today] = {
    text: text,
    score: score,
    timestamp: new Date().getTime()
  };
  
  saveMoodHistory();

  const palette = mapMoodToPalette(score);
  initScene(palette);
  setupAudio(palette);
  animate();
}

generateBtn.addEventListener('click', () => {
  onGenerate();
});

presetButtons.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    let moodText = '';
    switch (e.target.dataset.mood) {
      case 'happy':
        moodText = translations[currentLanguage].happyMood;
        break;
      case 'sad':
        moodText = translations[currentLanguage].sadMood;
        break;
      case 'neutral':
        moodText = translations[currentLanguage].neutralMood;
        break;
    }
    moodInput.value = moodText;
    onGenerate();
  }
});

window.addEventListener('resize', () => {
  if (!renderer) return;
  camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
});

canvasContainer.addEventListener('mousemove', e => {
  if (!oscillator) return;
  const xNorm = e.offsetX / canvasContainer.clientWidth;
  const yNorm = e.offsetY / canvasContainer.clientHeight;
  const freq = 200 + 800 * xNorm;
  updateAudio(freq);
  particles.forEach(p => {
    p.userData.velocity.x += (xNorm - 0.5) * 0.001;
    p.userData.velocity.y += (yNorm - 0.5) * 0.001;
  });
});

canvasContainer.addEventListener('mouseenter', () => {
  isMouseInCanvas = true;
  updateAudioState();
});

canvasContainer.addEventListener('mouseleave', () => {
  isMouseInCanvas = false;
  updateAudioState();
});

muteBtn.addEventListener('click', toggleMute);

function saveMoodHistory() {
  localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
}

function loadMoodHistory() {
  const savedHistory = localStorage.getItem('moodHistory');
  if (savedHistory) {
    moodHistory = JSON.parse(savedHistory);
  }
}

function generateCalendar() {

  moodCalendar.innerHTML = '';
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  const startingDayOfWeek = firstDay.getDay();
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day';
    moodCalendar.appendChild(emptyDay);
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = day;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (moodHistory[dateStr]) {
      dayCell.classList.add('has-mood');
      
      const score = moodHistory[dateStr].score;
      if (score > 1) {
        dayCell.classList.add('positive');
      } else if (score < 0) {
        dayCell.classList.add('negative');
      } else {
        dayCell.classList.add('neutral');
      }

      dayCell.addEventListener('click', () => {
        showMoodDetails(dateStr);
      });
    }
    
    moodCalendar.appendChild(dayCell);
  }
}

function showMoodDetails(dateStr) {
  const mood = moodHistory[dateStr];
  if (!mood) return;
  
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  moodInput.value = mood.text;
  currentMoodText = mood.text;
  currentMoodScore = mood.score;
  
  const palette = mapMoodToPalette(mood.score);
  initScene(palette);
  setupAudio(palette);
  animate();
  
  closeRankingDialog();
}

function calculateStats() {
  moodStats.innerHTML = '';
  
  if (Object.keys(moodHistory).length === 0) {
    const noDataMsg = document.createElement('span');
    noDataMsg.textContent = translations[currentLanguage].noMoodData;
    moodStats.appendChild(noDataMsg);
    return;
  }
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const weeklyPositive = [];
  const weeklyNegative = [];
  const weeklyNeutral = [];
  
  const monthlyPositive = [];
  const monthlyNegative = [];
  const monthlyNeutral = [];
  
  for (const dateStr in moodHistory) {
    const date = new Date(dateStr);
    const mood = moodHistory[dateStr];
    
    const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      if (mood.score > 1) {
        weeklyPositive.push(dateStr);
      } else if (mood.score < 0) {
        weeklyNegative.push(dateStr);
      } else {
        weeklyNeutral.push(dateStr);
      }
    }

    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      if (mood.score > 1) {
        monthlyPositive.push(dateStr);
      } else if (mood.score < 0) {
        monthlyNegative.push(dateStr);
      } else {
        monthlyNeutral.push(dateStr);
      }
    }
  }
  
  const weeklyTitle = document.createElement('h4');
  weeklyTitle.textContent = translations[currentLanguage].weeklyStats;
  moodStats.appendChild(weeklyTitle);
  
  addStatItem(moodStats, translations[currentLanguage].positiveCount, weeklyPositive.length);
  addStatItem(moodStats, translations[currentLanguage].negativeCount, weeklyNegative.length);
  addStatItem(moodStats, translations[currentLanguage].neutralCount, weeklyNeutral.length);
  
  const monthlyTitle = document.createElement('h4');
  monthlyTitle.textContent = translations[currentLanguage].monthlyStats;
  monthlyTitle.style.marginTop = '1rem';
  moodStats.appendChild(monthlyTitle);
  
  addStatItem(moodStats, translations[currentLanguage].positiveCount, monthlyPositive.length);
  addStatItem(moodStats, translations[currentLanguage].negativeCount, monthlyNegative.length);
  addStatItem(moodStats, translations[currentLanguage].neutralCount, monthlyNeutral.length);
}

function addStatItem(container, label, value) {
  const statItem = document.createElement('div');
  statItem.className = 'stats-item';
  
  const statLabel = document.createElement('span');
  statLabel.textContent = label;
  
  const statValue = document.createElement('span');
  statValue.textContent = value;
  
  statItem.appendChild(statLabel);
  statItem.appendChild(statValue);
  container.appendChild(statItem);
}

function showRankingDialog() {
  generateCalendar();
  calculateStats();
  moodRankingContainer.classList.remove('hidden');
}

function closeRankingDialog() {
  moodRankingContainer.classList.add('hidden');
}

historyBtn.addEventListener('click', showRankingDialog);
closeRankingBtn.addEventListener('click', closeRankingDialog);

window.addEventListener('load', () => {
  loadMoodHistory();
});

function updateLanguage(lang) {
  currentLanguage = lang;
  
  document.title = translations[lang].title;
  title.textContent = translations[lang].title;
  
  const descriptionText = translations[lang].description;
  description.innerHTML = descriptionText.replace(/\n\n/g, '<br><br>');
  
  moodInput.placeholder = translations[lang].inputPlaceholder;
  generateBtn.textContent = translations[lang].generateButton;
  
  happyBtn.textContent = translations[lang].happyButton;
  sadBtn.textContent = translations[lang].sadButton;
  neutralBtn.textContent = translations[lang].neutralButton;
  
  languageLabel.textContent = translations[lang].languageSelector + ':';
  
  historyBtn.title = translations[lang].historyButton;
  rankingTitle.textContent = translations[lang].rankingTitle;
  closeRankingBtn.title = translations[lang].closeButton;
  
  if (!moodRankingContainer.classList.contains('hidden')) {
    generateCalendar();
    calculateStats();
  }
}

languageSelect.addEventListener('change', (e) => {
  updateLanguage(e.target.value);
});

updateLanguage(currentLanguage);
