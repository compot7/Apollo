/* ==========================================================================
   page4.js — интерактив страницы 4: игра на кифаре Аполлона.
   Порядок струн: [1, 3, 2, 5, 4].
   Ошибка -> возврат на экран 3. Успех -> разветвление на экран 5 / 6.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var scene = document.getElementById('scene');
  var content = document.getElementById('content');
  var stringGroups = document.querySelectorAll('.string-group');
  var pluckingHand = document.getElementById('right-fingers-group');
  var hint = document.getElementById('melody-hint');
  var roadsModal = document.getElementById('roads-modal');
  var nextButton = document.getElementById('undertext');
  var roadCards = document.querySelectorAll('.road-card');

  var CORRECT_MELODY = [1, 3, 2, 5, 4];
  var currentStep = 0;
  var isLocked = false;

  /* ===== Звуковой движок кифары (Web Audio API) ===== */
  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  var STRING_FREQS = {
    1: 293.66, // D4
    2: 329.63, // E4
    3: 369.99, // F#4
    4: 440.00, // A4
    5: 493.88  // B4
  };

  function getAudioContext() {
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playKitharaNote(index) {
    var ctx = getAudioContext();
    if (!ctx) return;

    var freq = STRING_FREQS[index] || 440;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.25);
  }

  function playDissonance() {
    var ctx = getAudioContext();
    if (!ctx) return;

    [155, 164, 218].forEach(function (freq) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    });
  }

  function playVictoryHarmonics() {
    [1, 2, 3, 4, 5].forEach(function (idx, i) {
      setTimeout(function () {
        playKitharaNote(idx);
      }, i * 90);
    });
  }

  /* ===== Обработка клика по струнам ===== */
  /* ===== Обработка клика и наведения по струнам ===== */
  stringGroups.forEach(function (group) {
    var stringIndex = parseInt(group.getAttribute('data-index'), 10);
    var line = document.getElementById('str-line-' + stringIndex);
    var hitboxLine = group.querySelector('.string-hitbox') || group;

    // Включение подсветки струны
    hitboxLine.addEventListener('mouseenter', function () {
      if (line && !isLocked) {
        line.classList.add('hovered');
      }
    });

    // Отключение подсветки струны
    hitboxLine.addEventListener('mouseleave', function () {
      if (line) {
        line.classList.remove('hovered');
      }
    });

    function onPluck() {
      if (isLocked) return;

      // Вибрация видимой струны под руками
      if (line) {
        line.classList.remove('pluck');
        void line.offsetWidth; // перезапуск CSS-анимации
        line.classList.add('pluck');
      }

      // Анимация пальцев правой руки
      if (pluckingHand) {
        pluckingHand.classList.add('pluck-motion');
        setTimeout(function () {
          pluckingHand.classList.remove('pluck-motion');
        }, 120);
      }

      // Проверка последовательности
      if (stringIndex === CORRECT_MELODY[currentStep]) {
        playKitharaNote(stringIndex);
        currentStep++;

        if (hint) {
          hint.textContent = 'Звучит гармония: ' + currentStep + ' из ' + CORRECT_MELODY.length;
        }

        if (currentStep >= CORRECT_MELODY.length) {
          onMelodySuccess();
        }
      } else {
        onMelodyFail();
      }
    }

    hitboxLine.addEventListener('click', onPluck);
    hitboxLine.addEventListener('touchstart', function (e) {
      e.preventDefault();
      onPluck();
    }, { passive: false });
  });
  /* ===== Ошибка -> возврат на 3 экран ===== */
  function onMelodyFail() {
    isLocked = true;
    playDissonance();

    if (scene) scene.classList.add('error-shake');
    if (hint) {
      hint.classList.add('error');
      hint.textContent = 'Диссонанс! Возвращение...';
    }

    setTimeout(function () {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'GOTO_PAGE', page: 3 }, '*');
      } else {
        window.location.href = './3.html';
      }
    }, 1100);
  }

  /* ===== Победа -> открытие двух дорог ===== */
  function onMelodySuccess() {
    isLocked = true;

    setTimeout(function () {
      playVictoryHarmonics();
    }, 200);

    if (hint) {
      hint.classList.remove('error');
      hint.classList.add('success');
      hint.textContent = 'И мир разделился на две дороги...';
    }

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
    }, 550);

    setTimeout(function () {
      if (roadsModal) {
        roadsModal.classList.add('visible');
      }
    }, 1100);
  }

  /* ===== Навигация ===== */
  roadCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var targetPage = card.getAttribute('data-target');
      navigate(targetPage);
    });
  });

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      navigate('5');
    });
  }

  function navigate(pageNum) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'GOTO_PAGE', page: parseInt(pageNum, 10) }, '*');
    } else {
      window.location.href = './' + pageNum + '.html';
    }
  }

  /* ===== Плавный скроллбар ===== */
  var scrollTimer = null;
  var isScrolling = false;
  if (content) {
    content.addEventListener('scroll', function () {
      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(function () {
          content.classList.add('is-scrolling');
        });
      }
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        isScrolling = false;
        content.classList.remove('is-scrolling');
      }, 600);
    }, { passive: true });
  }
});