const board = document.getElementById('board');
const gameStatus = document.getElementById('gameStatus');
const resultArea = document.getElementById('resultArea');
let pieces = [];
let carPosition = { x: 4, y: 7 };

function initBoard() {
  board.innerHTML = '';
  for (let y = 1; y <= 9; y++) {
    for (let x = 1; x <= 8; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('drop', handleDrop);
      cell.addEventListener('dragover', e => e.preventDefault());
      board.appendChild(cell);
    }
  }

  // 初始红车
  pieces = [{ type: 'car', x: carPosition.x, y: carPosition.y }];
  renderPieces();
}

function renderPieces() {
  document.querySelectorAll('.piece').forEach(p => p.remove());
  pieces.forEach(piece => {
    const cell = document.querySelector(`.cell[data-x="${piece.x}"][data-y="${piece.y}"]`);
    const el = document.createElement('div');
    el.className = `piece ${piece.type}`;
    el.textContent = getSymbol(piece.type);
    el.draggable = true;
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('dragging', JSON.stringify(piece));
    });
    cell.appendChild(el);
  });
}

function handleDrop(e) {
  const x = parseInt(e.currentTarget.dataset.x);
  const y = parseInt(e.currentTarget.dataset.y);

  // 拖入新棋子
  const pieceType = e.dataTransfer.getData('pieceType');
  if (pieceType) {
    if (!pieces.some(p => p.x === x && p.y === y)) {
      pieces.push({ type: pieceType, x, y });
      renderPieces();
    }
    return;
  }

  // 移动已有棋子
  const dragging = JSON.parse(e.dataTransfer.getData('dragging'));
  if (dragging) {
    const existing = pieces.find(p => p.x === x && p.y === y);
    if (existing && existing.type !== 'car') {
      pieces = pieces.filter(p => !(p.x === x && p.y === y));
    }
    const piece = pieces.find(p => p.x === dragging.x && p.y === dragging.y);
    piece.x = x;
    piece.y = y;
    if (piece.type === 'car') carPosition = { x, y };
    renderPieces();
  }
}

function getSymbol(type) {
  return {
    car: '车',
    knight: '马',
    cannon: '炮',
    bishop: '象',
    advisor: '士',
    pawn: '兵',
    king: '将'
  }[type] || '?';
}

document.getElementById('resetBoard').onclick = initBoard;
document.getElementById('calculateMove').onclick = () => {
  resultArea.innerHTML = '<h3>计算中...</h3><p>尚未实现</p>';
};

initBoard();

