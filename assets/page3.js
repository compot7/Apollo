/* ==========================================================================
   page3.js — сцена 3: сбор белых хитонов, звук шелеста ткани, 
   появление кнопки «СЛЕДУЮЩИЙ МИФ» и переход на следующую страницу (4).
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var content = document.getElementById('content');
  var chitons = document.querySelectorAll('.chiton');
  var counterDisplay = document.getElementById('counter-val');
  var counterBox = document.getElementById('chiton-counter');
  var nextButton = document.getElementById('undertext');

  var remaining = chitons.length;

  if (counterDisplay) {
    counterDisplay.textContent = remaining;
  }

  /* Синтез звука шелеста ткани при подъёме */
  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  function playClothSound() {
    try {
      if (!audioCtx && AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (!audioCtx) return;

      var duration = 0.22;
      var bufferSize = audioCtx.sampleRate * duration;
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      var noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      var filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + duration);

      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start();
    } catch (e) {}
  }

  /* Клик по группе хитонов */
  chitons.forEach(function (chiton) {
    function collect() {
      if (chiton.classList.contains('collected')) return;

      chiton.classList.add('collected');
      playClothSound();
      remaining--;

      if (counterDisplay) {
        counterDisplay.textContent = remaining;
      }

      if (remaining <= 0) {
        onAllCollected();
      }
    }

    chiton.addEventListener('click', collect);
    chiton.addEventListener('touchstart', function (e) {
      e.preventDefault();
      collect();
    }, { passive: false });
  });

  function onAllCollected() {
    if (counterBox) {
      counterBox.classList.add('done');
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
    }, 400);
  }

  /* Переход на следующую страницу (4) */
  if (nextButton) {
    nextButton.addEventListener('click', function () {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'NEXT_PAGE' }, '*');
      } else {
        window.location.href = './page4.html';
      }
    });
  }

  /* Оптимизированный плавный скроллбар */
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