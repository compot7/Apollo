/* ==========================================================================
   page1.js — интерактив сцены: шарнирное прицеливание Аполлона (SVG-слои),
   натяжение тетивы, шипение змеи, выстрел стрел и показ кнопки перехода.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ===== Элементы сцены ===== */
  var scene = document.getElementById('scene');
  var content = document.getElementById('content');
  var python = document.getElementById('python');

  // Составные части Аполлона
  var apolloTorso = document.getElementById('apollo-torso');
  var apolloHead = document.getElementById('apollo-head');
  var apolloBow = document.getElementById('apollo-bow');
  var apolloArrowBlack = document.getElementById('apollo-arrow-black');

  // Белые стрелы
  var whiteArrows = [
    document.getElementById('arrow-white-1'),
    document.getElementById('arrow-white-2'),
    document.getElementById('arrow-white-3')
  ];

  // Кнопка перехода
  var nextButton = document.getElementById('undertext');

  /* ===== Состояние ===== */
  var isDefeated = false;
  var isAiming = false;

  /* ===== Звуковая система (MP3 + Web Audio API синтез как фолбэк) ===== */
  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  function getAudioContext() {
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  var sounds = {
    hiss: new Audio('./assets/audio/snake-hiss.mp3'),
    draw: new Audio('./assets/audio/bow-draw.mp3'),
    shoot: new Audio('./assets/audio/bow-release.mp3')
  };

  function synthSnakeHiss(duration) {
    var ctx = getAudioContext();
    if (!ctx) return;

    var bufferSize = ctx.sampleRate * duration;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    var noise = ctx.createBufferSource();
    noise.buffer = buffer;

    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3800, ctx.currentTime);
    filter.Q.setValueAtTime(3.5, ctx.currentTime);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  function synthBowDraw() {
    var ctx = getAudioContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(165, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  function synthBowShoot() {
    var ctx = getAudioContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  function playSound(type) {
    var audio = sounds[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(function () {
        if (type === 'hiss') synthSnakeHiss(0.9);
        if (type === 'draw') synthBowDraw();
        if (type === 'shoot') synthBowShoot();
      });
    }
  }

  /* ===== Шарнирное прицеливание Аполлона ===== */
  function updateApolloAim(clientX, clientY) {
    if (!scene || isDefeated) return;

    var rect = scene.getBoundingClientRect();
    var relY = (clientY - rect.top) / rect.height - 0.45;

    // Угол наклона торса, головы и лука вслед за курсором
    var angle = Math.max(-8, Math.min(8, relY * 16));

    if (apolloTorso) {
      apolloTorso.style.transform = 'rotate(' + (angle * 0.6).toFixed(2) + 'deg)';
    }
    if (apolloHead) {
      apolloHead.style.transform = 'rotate(' + (angle * 0.9).toFixed(2) + 'deg)';
    }
    if (apolloBow) {
      apolloBow.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    }
    if (apolloArrowBlack) {
      var drawOffset = isAiming ? ' translate(10%, 7%)' : '';
      apolloArrowBlack.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)' + drawOffset;
    }
  }

  if (scene) {
    scene.addEventListener('mousemove', function (e) {
      updateApolloAim(e.clientX, e.clientY);
    });
  }

  /* ===== Наведение на змея (натяжение лука + шипение) ===== */
  if (python) {
    python.addEventListener('mouseenter', function () {
      if (isDefeated) return;
      isAiming = true;
      python.classList.add('aiming');
      if (apolloArrowBlack) apolloArrowBlack.classList.add('drawn');
      playSound('draw');
      playSound('hiss');
    });

    python.addEventListener('mouseleave', function () {
      if (isDefeated) return;
      isAiming = false;
      python.classList.remove('aiming');
      if (apolloArrowBlack) apolloArrowBlack.classList.remove('drawn');
    });

    // Поддержка мобильных / тач-экранов
    python.addEventListener('touchstart', function (e) {
      if (isDefeated) return;
      e.preventDefault();
      isAiming = true;
      python.classList.add('aiming');
      playSound('draw');
      shootPython();
    }, { passive: false });

    /* ===== Клик по змею — выстрел ===== */
    python.addEventListener('click', function () {
      shootPython();
    });
  }

  function shootPython() {
    if (isDefeated) return;
    isDefeated = true;
    isAiming = false;
    python.classList.remove('aiming');

    // 1. Чёрная стрела срывается с тетивы
    if (apolloArrowBlack) {
      apolloArrowBlack.classList.remove('drawn');
      apolloArrowBlack.classList.add('shot');
    }
    playSound('shoot');

    // 2. Поочередно вылетают 3 белые стрелы
    whiteArrows.forEach(function (arrow, index) {
      setTimeout(function () {
        if (arrow) arrow.classList.add('shot');
        if (index > 0) playSound('shoot');
      }, 100 + index * 130);
    });

    // 3. Змей вздрагивает и шипит
    setTimeout(function () {
      if (python) {
        python.classList.add('hit');
        python.style.cursor = 'default';
      }
      if (scene) {
        scene.style.cursor = 'default';
      }
      playSound('hiss');
    }, 240);

    // 4. Появляется кнопка «СЛЕДУЮЩИЙ МИФ» и текст плавно прокручивается к ней
    setTimeout(function () {
      if (nextButton) {
        nextButton.classList.add('visible');
        if (content) {
          content.scrollTo({
            top: content.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 800);
  }

  /* ===== Обработка клика по кнопке «СЛЕДУЮЩИЙ МИФ» ===== */
  if (nextButton) {
    nextButton.addEventListener('click', function () {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'NEXT_PAGE' }, '*');
      }
    });
  }
});