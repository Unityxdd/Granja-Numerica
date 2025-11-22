/* ==========================================================================
   script.js — Juego Educativo "Granja Matemática"
   Autor: (Tu nombre o equipo)
   Descripción:
   Juego con 3 niveles lógicos basado en secuencias de 2 en 2.
   Guarda puntajes y progreso en localStorage bajo la clave "granja_puntajes".
   ========================================================================== */

(() => {
  // =======================
  // CONFIGURACIÓN INICIAL
  // =======================
  const sequence = Array.from({ length: 26 }, (_, i) => i * 2); // [0,2,4,...,50]

  const DOM = {
    nivelSpan: document.getElementById('nivel-actual'),
    puntajeSpan: document.getElementById('puntaje'),
    intentosSpan: document.getElementById('intentos'),
    titulo: document.getElementById('titulo-pregunta'),
    contenido: document.getElementById('contenido-pregunta'),
    opcionesDiv: document.getElementById('opciones'),
    petImg: document.getElementById('pet-img'),
    petText: document.getElementById('pet-text'),
    btnSiguiente: document.getElementById('btn-siguiente'),
    lvlButtons: document.querySelectorAll('.lvl'),
    btnReset: document.getElementById('btn-reset'),
  };

  // Estado del juego
  let nivelActual = 1;
  let score = 0;
  let currentQuestion = null;
  let attemptsOnCurrent = 0;
  let disabled = false;

  const petSet = {
    1: {
      name: 'Lechuza Matemática',
      img: 'assets/lechuza.png',
      success: '¡Muy bien! ¡Eres estupendo!',
      fail: 'Incorrecto — inténtalo otra vez.',
    },
    2: {
      name: 'Coco el Conejo',
      img: 'assets/conejo.png',
      success: '¡Genial! ¡Bravo!',
      fail: 'No es correcto — prueba de nuevo.',
    },
    3: {
      name: 'Kirby la Tortuga',
      img: 'assets/tortuga.png',
      success: '¡Perfecto! Sigamos así.',
      fail: 'Ups, no — puedes hacerlo.',
    },
  };

  // =======================
  // FUNCIONES AUXILIARES
  // =======================

  const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

  const updateUI = () => {
    DOM.nivelSpan.textContent = nivelActual;
    DOM.puntajeSpan.textContent = score;
    DOM.intentosSpan.textContent = attemptsOnCurrent;
  };

  const feedback = (message, type = 'neutral') => {
    DOM.petText.textContent = message;
    DOM.petText.className = ''; // reset clases
    DOM.petText.classList.add(type);
  };

  // =======================
  // GENERADOR DE PREGUNTAS
  // =======================

  function genQuestion(level) {
    attemptsOnCurrent = 0;
    updateUI();

    if (level === 1) {
      const target = sequence[Math.floor(Math.random() * sequence.length)];
      const correctPos = sequence.indexOf(target) + 1;

      const choices = new Set([correctPos]);
      while (choices.size < 3) {
        const r = Math.max(1, Math.min(26, correctPos + (Math.floor(Math.random() * 7) - 3)));
        choices.add(r);
      }

      return {
        level,
        type: 'pos',
        target,
        answer: correctPos,
        text: `¿En qué lugar (1 = primero) está el número ${target}?`,
        opts: shuffle([...choices]),
      };
    }

    if (level === 2) {
      const target = sequence[Math.floor(Math.random() * (sequence.length - 1)) + 1];
      const answer = sequence[sequence.indexOf(target) - 1];
      const choices = new Set([answer]);

      while (choices.size < 3) {
        const pick = sequence[Math.floor(Math.random() * sequence.length)];
        if (pick !== answer) choices.add(pick);
      }

      return {
        level,
        type: 'before',
        target,
        answer,
        text: `¿Qué número va antes de ${target}?`,
        opts: shuffle([...choices]),
      };
    }

    // Nivel 3
    const startIndex = Math.floor(Math.random() * (sequence.length - 3));
    const seq = sequence.slice(startIndex, startIndex + 4);
    const blankIndex = Math.floor(Math.random() * 2) + 1;
    const answer = seq[blankIndex];
    const display = seq.map((n, i) => (i === blankIndex ? '__' : n)).join(', ');

    const choices = new Set([answer]);
    while (choices.size < 3) {
      const delta = (Math.floor(Math.random() * 5) - 2) * 2;
      const candidate = answer + delta;
      if (sequence.includes(candidate) && candidate !== answer) choices.add(candidate);
    }

    return {
      level,
      type: 'fill',
      seq,
      blankIndex,
      answer,
      text: `Completa: ${display}`,
      opts: shuffle([...choices]),
    };
  }

  // =======================
  // RENDER DE PREGUNTAS
  // =======================

  function renderQuestion(q) {
    if (!q) return;

    DOM.titulo.textContent = `Nivel ${q.level} — Pregunta`;
    DOM.contenido.textContent = q.text;
    DOM.opcionesDiv.innerHTML = '';

    q.opts.forEach((opt) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.classList.add('option-btn');
      btn.addEventListener('click', () => handleAnswer(opt, btn));
      DOM.opcionesDiv.appendChild(btn);
    });

    const pet = petSet[q.level];
    DOM.petImg.src = pet.img || '';
    DOM.petImg.alt = pet.name;
    feedback(pet.name);
    updateUI();
    DOM.btnSiguiente.disabled = true;
  }

  // =======================
  // LÓGICA DE RESPUESTA
  // =======================

  function handleAnswer(choice, btnEl) {
    if (disabled) return;
    const correct = currentQuestion.answer;

    Array.from(DOM.opcionesDiv.children).forEach((b) => (b.disabled = true));

    if (choice === correct) {
      score += 10;
      btnEl.classList.add('correct');
      feedback(petSet[nivelActual].success, 'success');
      saveProgress(false);
      DOM.btnSiguiente.disabled = false;
    } else {
      score = Math.max(0, score - 5);
      btnEl.classList.add('wrong');
      attemptsOnCurrent++;
      feedback(petSet[nivelActual].fail, 'error');
      if (attemptsOnCurrent >= 3) {
        disabled = true;
        feedback(`Has fallado 3 veces. Perdiste el nivel ${nivelActual}.`, 'error');
        saveProgress(true);
      } else {
        Array.from(DOM.opcionesDiv.children)
          .filter((b) => b.textContent != choice)
          .forEach((b) => (b.disabled = false));
      }
    }

    updateUI();
  }

  // =======================
  // GUARDADO EN LOCALSTORAGE
  // =======================

  function saveProgress(lost) {
    const data = JSON.parse(localStorage.getItem('granja_puntajes') || '[]');
    data.push({
      level: nivelActual,
      score,
      date: new Date().toISOString(),
      lost,
    });
    localStorage.setItem('granja_puntajes', JSON.stringify(data));
  }

  // =======================
  // EVENTOS GENERALES
  // =======================

  DOM.lvlButtons.forEach((b) =>
    b.addEventListener('click', () => {
      nivelActual = Number(b.dataset.nivel);
      disabled = false;
      score = 0;
      attemptsOnCurrent = 0;
      currentQuestion = genQuestion(nivelActual);
      renderQuestion(currentQuestion);
    })
  );

  DOM.btnSiguiente.addEventListener('click', () => {
    if (!disabled) {
      currentQuestion = genQuestion(nivelActual);
      renderQuestion(currentQuestion);
    }
  });

  DOM.btnReset.addEventListener('click', () => {
    if (confirm('¿Reiniciar nivel actual?')) {
      disabled = false;
      score = 0;
      attemptsOnCurrent = 0;
      currentQuestion = genQuestion(nivelActual);
      renderQuestion(currentQuestion);
    }
  });

  // =======================
  // INICIO
  // =======================
  function init() {
    nivelActual = 1;
    score = 0;
    disabled = false;
    currentQuestion = genQuestion(nivelActual);
    renderQuestion(currentQuestion);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
