/* ==========================================================================
   page2.js — интерактив страницы 2: удержание критского корабля в шторме,
   прыжок дельфина-Аполлона и разветвление на 2 видения (экран 3 / экран 4).
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var scene = document.getElementById('scene');
  var content = document.getElementById('content');
  var shipGroup = document.getElementById('ship-group');
  var dolphin = document.getElementById('dolphin');
  var balanceHint = document.getElementById('balance-hint');
  var visionsModal = document.getElementById('visions-modal');
  var nextButton = document.getElementById('undertext');
  var visionCards = document.querySelectorAll('.vision-card');

  var isBalanced = false;
  var stormAngle = 0;       // Текущий угол качки от шторма
  var userTilt = 0;         // Коррекция наклона игроком
  var calmTimer = 0;        // Таймер удержания равновесия
  var lastTimestamp = null;

  /* ===== 1. Управление балансом (Мышь / Тач / Гироскоп) ===== */
  function handleMove(clientX) {
    if (isBalanced || !scene) return;
    var rect = scene.getBoundingClientRect();
    var normX = (clientX - rect.left) / rect.width; // от 0 до 1
    // Пользователь двигает мышью влево/вправо для компенсации качки
    userTilt = (normX - 0.5) * 16; // угол компенсации от -16 до +16 градусов
  }

  if (scene) {
    scene.addEventListener('mousemove', function (e) {
      handleMove(e.clientX);
    });

    scene.addEventListener('touchmove', function (e) {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    }, { passive: true });
  }

  // Поддержка гироскопа на мобильных
  window.addEventListener('deviceorientation', function (e) {
    if (isBalanced || typeof e.gamma !== 'number') return;
    userTilt = Math.max(-18, Math.min(18, e.gamma * 1.0));
  });

  /* ===== 2. Игровой цикл шторма (requestAnimationFrame) ===== */
  function stormLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    var delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (!isBalanced) {
      // Синусоидальная качка шторма
      var time = timestamp * 0.0018;
      var waveForce = Math.sin(time) * 3.2 + Math.cos(time * 1.4) * 5.5;
      stormAngle = waveForce + userTilt;

      if (shipGroup) {
        shipGroup.style.transform = 'rotate(' + stormAngle.toFixed(2) + 'deg)';
      }

      // Если корабль удерживается близко к горизонту (|угол| <= 4.5 град)
      if (Math.abs(stormAngle) < 4.5) {
        calmTimer += delta;
        if (balanceHint) {
          balanceHint.textContent = 'Держите ровно... ' + Math.ceil(5 - calmTimer);
        }

        // Удержали 5 секунд — шторм побеждён!
        if (calmTimer >= 5) {
          winStorm();
        }
      } else {
        calmTimer = Math.max(0, calmTimer - delta * 1.5);
        if (balanceHint) {
          balanceHint.textContent = 'Удерживайте корабль в равновесии!';
        }
      }
      requestAnimationFrame(stormLoop);
    }
  }

  requestAnimationFrame(stormLoop);

  /* ===== 3. Успокоение моря и прыжок дельфина ===== */
  function winStorm() {
    isBalanced = true;

    if (balanceHint) balanceHint.classList.add('hidden');

    // Плавное возвращение корабля в штиль
    if (shipGroup) {
      shipGroup.style.transition = 'transform 1.2s ease-out';
      shipGroup.style.transform = 'rotate(0deg)';
    }

    // Торжественный прыжок дельфина
    if (dolphin) {
      dolphin.style.transform = 'translate(60px, -70px) rotate(-25deg) scale(1.18)';
      setTimeout(function () {
        dolphin.style.transform = 'translate(120px, 10px) rotate(20deg) scale(1)';
      }, 700);
    }

    // Появление кнопки перехода в тексте
    if (nextButton) {
      nextButton.classList.add('visible');
    }

    // Появление двух видений
    setTimeout(function () {
      if (visionsModal) {
        visionsModal.classList.add('visible');
      }
    }, 1200);
  }

  /* ===== 4. Выбор видения и навигация ===== */
  visionCards.forEach(function (card) {
    card.addEventListener('click', function () {
      var targetPage = card.getAttribute('data-target'); // "3" или "4"
      navigateToPage(targetPage);
    });
  });

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      // По умолчанию кнопка «Следующий миф» ведёт на страницу 3
      navigateToPage('3');
    });
  }

  function navigateToPage(pageNum) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'GOTO_PAGE', page: parseInt(pageNum, 10) }, '*');
    } else {
      window.location.href = './page' + pageNum + '.html';
    }
  }

  /* ===== 5. Оптимизированный плавный скроллбар ===== */
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