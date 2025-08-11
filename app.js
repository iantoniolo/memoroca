const DEFAULT_DECK = {
  title: 'Padrão',
  backImage: './assets/cards/back-default.svg',
  gridByDifficulty: {
    easy: { cols: 6, rows: 4 },
    medium: { cols: 7, rows: 4 },
    hard: { cols: 8, rows: 4 }
  },
  cards: [
    { id: '1', image: './assets/cards/1.svg', label: 'Figura 1' },
    { id: '2', image: './assets/cards/2.svg', label: 'Figura 2' },
    { id: '3', image: './assets/cards/3.svg', label: 'Figura 3' },
    { id: '4', image: './assets/cards/4.svg', label: 'Figura 4' },
    { id: '5', image: './assets/cards/5.svg', label: 'Figura 5' },
    { id: '6', image: './assets/cards/6.svg', label: 'Figura 6' },
    { id: '7', image: './assets/cards/7.svg', label: 'Figura 7' },
    { id: '8', image: './assets/cards/8.svg', label: 'Figura 8' },
    { id: '9', image: './assets/cards/9.svg', label: 'Figura 9' },
    { id: '10', image: './assets/cards/10.svg', label: 'Figura 10' },
    { id: '11', image: './assets/cards/11.svg', label: 'Figura 11' },
    { id: '12', image: './assets/cards/12.svg', label: 'Figura 12' },
    { id: '13', image: './assets/cards/13.svg', label: 'Figura 13' }
  ]
};

const STORAGE_KEY = 'memory-game-deck-v1';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function showToast(message, type = 'info', timeoutMs = 2500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${type === 'success' ? '✔️' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <div class="toast__message">${message}</div>
    <button class="toast__close" aria-label="Fechar">×</button>
  `;
  container.appendChild(toast);
  const close = () => { toast.remove(); };
  toast.querySelector('.toast__close').addEventListener('click', close);
  if (timeoutMs > 0) setTimeout(close, timeoutMs);
}

function shuffle(array) {
  if (!Array.isArray(array)) return [];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getSavedDeck() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const hasCards = Array.isArray(parsed.cards) && parsed.cards.length > 0;
    if (!hasCards) return null;
    return {
      ...parsed,
      backImage: typeof parsed.backImage === 'string' && parsed.backImage ? parsed.backImage : DEFAULT_DECK.backImage,
      gridByDifficulty: DEFAULT_DECK.gridByDifficulty
    };
  } catch (_) {
    return null;
  }
}

function saveDeck(deck) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

function buildDeckForDifficulty(deck, difficulty) {
  const isMobile = window.innerWidth <= 768;
  
  let baseGrid;
  if (isMobile) {
    const mobileGrid = {
      easy: { cols: 6, rows: 4 },
      medium: { cols: 6, rows: 5 },
      hard: { cols: 6, rows: 6 }
    };
    baseGrid = mobileGrid[difficulty] || mobileGrid.easy;
  } else {
    baseGrid = (deck.gridByDifficulty && deck.gridByDifficulty[difficulty])
      ? deck.gridByDifficulty[difficulty]
      : DEFAULT_DECK.gridByDifficulty?.[difficulty] || DEFAULT_DECK.gridByDifficulty.easy;
  }
  
  const cols = Number(baseGrid?.cols);
  const rows = Number(baseGrid?.rows);
  const totalCards = Number.isFinite(cols * rows) && cols > 0 && rows > 0 ? cols * rows : 12;
  const neededPairs = Math.floor(totalCards / 2);

  const sourceCards = (Array.isArray(deck.cards) && deck.cards.length > 0) ? deck.cards : DEFAULT_DECK.cards;
  const base = Array.from({ length: neededPairs }, (_, i) => {
    const src = sourceCards[i % sourceCards.length];
    return { id: src.id, image: src.image, label: src.label };
  });
  const duplicated = base.flatMap(c => [{ ...c }, { ...c }]);
  const trimmed = duplicated.slice(0, totalCards);
  return {
    cards: shuffle(trimmed),
    grid: { cols: cols || 4, rows: rows || 3 },
    backImage: deck.backImage || DEFAULT_DECK.backImage
  };
}

function setGrid(board, grid) {
  board.style.gridTemplateColumns = `repeat(${grid.cols}, minmax(0, 1fr))`;
  const rows = grid.rows;
  const dynamicGap = rows >= 7 ? 6 : rows === 6 ? 8 : rows === 5 ? 10 : 12;
  board.style.gap = `${dynamicGap}px`;
  requestAnimationFrame(() => {
    const gap = parseFloat(getComputedStyle(board).gap) || dynamicGap;
    const cols = grid.cols;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const headerH = document.querySelector('.site-header')?.offsetHeight || 0;
    const controlsH = document.querySelector('.controls')?.offsetHeight || 0;
    const statusH = document.querySelector('.statusbar')?.offsetHeight || 0;
    const footerH = document.querySelector('.site-footer')?.offsetHeight || 0;
    // Reserva vertical: garante footer visível
    const overhead = Math.max(6, (document.querySelector('.site-footer')?.offsetHeight || 0) + 6);
    const verticalAvailable = Math.max(vh - headerH - controlsH - statusH - footerH - overhead, 200);

    const cardW = Math.floor((vw - (cols - 1) * gap - 32) / cols);
    const cardH = Math.floor((verticalAvailable - (rows - 1) * gap) / rows);

    const aspectW = Math.floor(cardH * (14 / 17));
    const finalW = Math.min(cardW, aspectW);
    const finalH = Math.floor(finalW * (17 / 14));

    board.style.setProperty('--card-w', `${finalW}px`);
    board.style.setProperty('--card-h', `${finalH}px`);
    board.style.gridTemplateColumns = `repeat(${cols}, var(--card-w))`;
  });
}

function createCardElement(card, backImage) {
  const el = document.createElement('button');
  el.className = 'card';
  el.setAttribute('aria-pressed', 'false');
  el.setAttribute('aria-label', card.label || 'Carta');
  el.dataset.cardId = card.id;

  const back = document.createElement('div');
  back.className = 'card-face back';
  if (backImage) back.style.backgroundImage = `url(${backImage})`;

  const front = document.createElement('div');
  front.className = 'card-face front';
  front.style.backgroundImage = `url(${card.image})`;
  front.title = card.label || '';

  el.append(back, front);
  return el;
}

function renderStatus(text) { $('#status-text').textContent = text; }

function initBoard(deck, difficulty) {
  const oldBoard = document.querySelector('.board');
  const newBoard = oldBoard.cloneNode(false);
  oldBoard.replaceWith(newBoard);

  const { cards, grid, backImage } = buildDeckForDifficulty(deck, difficulty);
  setGrid(newBoard, grid);
  cards.forEach(card => newBoard.appendChild(createCardElement(card, backImage)));
  setGrid(newBoard, grid);

  const onResize = () => {
    // Recalcula o grid baseado no novo tamanho da tela
    const { grid: newGrid } = buildDeckForDifficulty(deck, difficulty);
    setGrid(newBoard, newGrid);
  };
  
  window.addEventListener('resize', onResize, { passive: true });
  newBoard.addEventListener('DOMNodeRemoved', (e) => {
    if (e.target === newBoard) window.removeEventListener('resize', onResize);
  }, { once: true });

  let first = null;
  let lock = false;
  let matchedCount = 0;
  const total = cards.length;

  function flip(cardBtn, forceState) {
    const next = forceState ?? (cardBtn.getAttribute('aria-pressed') !== 'true');
    cardBtn.setAttribute('aria-pressed', String(next));
    cardBtn.classList.toggle('is-flipped', next);
  }

  const newGameBtn = document.getElementById('btn-new-game');
  if (newGameBtn) newGameBtn.disabled = true;

  let firstMatchHappened = false;

  function markMatched(a, b) {
    a.classList.add('matched');
    b.classList.add('matched');
    a.setAttribute('disabled', 'true');
    b.setAttribute('disabled', 'true');
    if (!firstMatchHappened && newGameBtn) {
      newGameBtn.disabled = false;
      firstMatchHappened = true;
    }
  }

  newBoard.addEventListener('click', (e) => {
    const btn = e.target.closest('.card');
    if (!btn || lock) return;
    if (btn.getAttribute('aria-pressed') === 'true') return;

    flip(btn, true);
    if (!first) { first = btn; return; }

    const isMatch = first.dataset.cardId === btn.dataset.cardId;
    if (isMatch) {
      markMatched(first, btn);
      matchedCount += 2;
      first = null;
      renderStatus(`Par encontrado! Restam ${(total - matchedCount) / 2} pares.`);
      if (!firstMatchHappened) showToast('Primeiro par encontrado! “Novo jogo” habilitado.', 'success');
      if (matchedCount === total) setTimeout(() => renderStatus('Parabéns! Você concluiu o jogo.'), 250);
      if (matchedCount === total) showToast('Parabéns! Você concluiu o jogo.', 'success', 3500);
    } else {
      lock = true;
      setTimeout(() => {
        flip(first, false);
        flip(btn, false);
        first = null;
        lock = false;
      }, 750);
    }
  });

  newBoard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const btn = document.activeElement;
      if (btn?.classList.contains('card')) btn.click();
    }
  });

  renderStatus('Selecione cartas para começar.');
}

function applyDifficultySelection(currentDifficulty) {
  $$('.difficulty-selector .chip').forEach(btn => {
    const is = btn.dataset.difficulty === currentDifficulty;
    btn.classList.toggle('is-selected', is);
    btn.setAttribute('aria-pressed', String(is));
  });
}

function setupUI() {
  let deck = getSavedDeck() || DEFAULT_DECK;
  let difficulty = 'easy';
  applyDifficultySelection(difficulty);
  initBoard(deck, difficulty);

  $('.difficulty-selector').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    difficulty = b.dataset.difficulty;
    applyDifficultySelection(difficulty);
    initBoard(deck, difficulty);
  });

  const newGameBtn = $('#btn-new-game');
  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => initBoard(deck, difficulty));
    newGameBtn.disabled = true;
  } else {
    console.warn('btn-new-game não encontrado');
  }

  $('.deck-selector').addEventListener('click', (e) => {
    const b = e.target.closest('.chip-deck');
    if (!b) return;
    const mode = b.dataset.deck;
    $$('.deck-selector .chip-deck').forEach(btn => {
      const is = btn === b;
      btn.classList.toggle('is-selected', is);
      btn.setAttribute('aria-pressed', String(is));
    });
    if (mode === 'default') {
      deck = DEFAULT_DECK;
    } else {
      deck = getSavedDeck() || DEFAULT_DECK;
      if (!getSavedDeck()) {
        $('#config-dialog').showModal();
      }
    }
    initBoard(deck, difficulty);
  });

  const dialog = $('#config-dialog');
  const openCfg = $('#btn-open-config');
  if (openCfg && dialog) {
    openCfg.addEventListener('click', () => dialog.showModal());
  }

  // Removido botão "Usar baralho padrão" do diálogo (já existe no menu principal)

  const saveDeckBtn = $('#btn-save-deck');
  if (saveDeckBtn) saveDeckBtn.addEventListener('click', async () => {
    const frontsFiles = Array.from($('#file-fronts').files || []);
    const backFile = $('#file-back').files?.[0];

    const toDataURL = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    let newCards = deck.cards;
    if (frontsFiles.length > 0) {
      const images = await Promise.all(frontsFiles.map(f => toDataURL(f)));
      newCards = images.map((src, idx) => ({ id: `u-${idx+1}`, image: src, label: `Carta ${idx+1}` }));
    }
    const newBack = backFile ? await toDataURL(backFile) : deck.backImage;

    const onlyBackChanged = frontsFiles.length === 0 && !!backFile;
    const nothingChanged = frontsFiles.length === 0 && !backFile;

    if (nothingChanged) {
      showToast('Nenhuma alteração para salvar.', 'info');
      return;
    }

    deck = {
      ...deck,
      title: 'Personalizado',
      backImage: newBack,
      cards: newCards
    };
    saveDeck(deck);
    initBoard(deck, difficulty);
    showToast(onlyBackChanged ? 'Verso atualizado com sucesso.' : 'Baralho salvo neste navegador.', 'success');
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', setupUI);
} else {
  setupUI();
}


