document.addEventListener("DOMContentLoaded", function () {
  const chessBoard = document.querySelector(".chess-board");
  const pieceButtons = document.querySelectorAll(".piece-button");
  const resetButton = document.querySelector(".control-button:last-child");
  const killGeneralCheckbox = document.getElementById("killGeneral");
  const useItemCheckbox = document.getElementById("useItem");

  // 棋子类型映射
  const pieceTypeMap = {
    添加卒: "pawn",
    添加士: "advisor",
    添加象: "elephant",
    添加马: "horse",
    添加车: "rook",
    添加炮: "cannon",
    添加将: "general",
  };

  // 棋子显示文本映射（黑方）
  const blackPieceTextMap = {
    添加卒: "卒",
    添加士: "士",
    添加象: "象",
    添加马: "马",
    添加车: "车",
    添加炮: "炮",
    添加将: "将",
  };

  // 状态变量
  let draggedPiece = null;
  let originalPosition = null;
  let killGeneralEnabled = false;
  let useItemEnabled = false;

  // 初始化
  function init() {
    setupEventListeners();
    setupInitialPiece();
    updateDangerZones();
  }

  // 设置事件监听器
  function setupEventListeners() {
    // 棋子按钮点击事件
    pieceButtons.forEach((button) => {
      button.addEventListener("click", () =>
        addRandomBlackPiece(button.textContent)
      );
    });

    // 重置按钮点击事件
    resetButton.addEventListener("click", resetBoard);

    // 道具勾选框事件
    killGeneralCheckbox.addEventListener("change", () => {
      killGeneralEnabled = killGeneralCheckbox.checked;
      updateDangerZones();
      calculateBestMove();
    });

    useItemCheckbox.addEventListener("change", () => {
      useItemEnabled = useItemCheckbox.checked;
      updateDangerZones();
      calculateBestMove();
    });
  }

  // 设置初始棋子
  function setupInitialPiece() {
    const initialPiece = document.querySelector(".chess-piece.red.rook");
    if (initialPiece) {
      initialPiece.draggable = true;
      setupDragEvents(initialPiece);
    }
  }

  // 添加随机位置的黑色棋子
  function addRandomBlackPiece(pieceName) {
    const [col, row] = findEmptyPosition();
    if (!col || !row) {
      alert("无法找到空闲位置！");
      return;
    }

    const piece = createPiece(pieceName, col, row);
    chessBoard.appendChild(piece);
    setupDragEvents(piece);
    updateDangerZones();
    calculateBestMove();
  }

  // 查找空位置
  function findEmptyPosition(maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
      const col = Math.floor(Math.random() * 8) + 1;
      const row = Math.floor(Math.random() * 9) + 1;
      if (!isPositionOccupied(col, row)) return [col, row];
    }
    return [null, null];
  }

  // 创建棋子元素
  function createPiece(pieceName, col, row) {
    const piece = document.createElement("div");
    piece.className = `chess-piece black ${pieceTypeMap[pieceName]}`;
    piece.style.setProperty("--col", col);
    piece.style.setProperty("--row", row);
    piece.textContent = blackPieceTextMap[pieceName];
    piece.draggable = true;
    return piece;
  }

  // 检查位置是否被占用
  function isPositionOccupied(col, row, excludePiece = null) {
    const pieces = document.querySelectorAll(".chess-piece");
    for (const piece of pieces) {
      if (piece === excludePiece) continue;

      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));
      if (pieceCol === col && pieceRow === row) return true;
    }
    return false;
  }

  // 设置拖拽事件
  function setupDragEvents(piece) {
    piece.addEventListener("mousedown", handleDragStart);
    piece.addEventListener("touchstart", handleDragStart, { passive: false });
  }

  // 拖拽开始
  function handleDragStart(e) {
    e.preventDefault();
    draggedPiece = e.target;

    originalPosition = {
      col: parseInt(draggedPiece.style.getPropertyValue("--col")),
      row: parseInt(draggedPiece.style.getPropertyValue("--row")),
    };

    draggedPiece.style.opacity = "0.7";
    draggedPiece.style.zIndex = "100";
    draggedPiece.style.transition = "none";

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("touchmove", handleDragMove, { passive: false });
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchend", handleDragEnd);
  }

  // 拖拽移动
  function handleDragMove(e) {
    if (!draggedPiece) return;
    e.preventDefault();

    const clientX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === "mousemove" ? e.clientY : e.touches[0].clientY;

    const rect = chessBoard.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const col = Math.round((x / rect.width) * 8);
    const row = 9 - Math.round((y / rect.height) * 9);
    const validCol = Math.max(1, Math.min(8, col));
    const validRow = Math.max(1, Math.min(9, row));

    draggedPiece.style.setProperty("--col", validCol);
    draggedPiece.style.setProperty("--row", validRow);
  }

  // 拖拽结束
  function handleDragEnd(e) {
    if (!draggedPiece) return;
    e.preventDefault();

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchend", handleDragEnd);

    const col = parseInt(draggedPiece.style.getPropertyValue("--col"));
    const row = parseInt(draggedPiece.style.getPropertyValue("--row"));

    if (isPositionOccupied(col, row, draggedPiece)) {
      const otherPiece = getPieceAtPosition(col, row);
      console.log(draggedPiece, otherPiece);
      if (canCapture(draggedPiece, otherPiece)) {
        capturePiece(otherPiece);
        // 移动红车到目标位置
        draggedPiece.style.setProperty("--col", col);
        draggedPiece.style.setProperty("--row", row);
        cleanupAfterDrag();
        clearDangerZones();
        return;
      } else {
        resetPiecePosition();
      }
    } else {
      applyItemEffects(col, row);
    }

    cleanupAfterDrag();
    updateDangerZones();
    calculateBestMove();
  }

  // 获取指定位置的棋子
  function getPieceAtPosition(col, row) {
    const pieces = document.querySelectorAll(".chess-piece");
    for (const piece of pieces) {
      if (piece === draggedPiece) continue;
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));
      if (pieceCol === col && pieceRow === row) return piece;
    }
    return null;
  }

  // 检查是否可以吃子
  function canCapture(attacker, defender) {
    return (
      attacker.classList.contains("red") && defender.classList.contains("black")
    );
  }

  // 吃子
  function capturePiece(piece) {
    piece.classList.add("capturing");
    setTimeout(() => {
      piece.remove();
      applyItemEffects(
        parseInt(draggedPiece.style.getPropertyValue("--col")),
        parseInt(draggedPiece.style.getPropertyValue("--row"))
      );
    }, 300);
  }

  // 重置棋子位置
  function resetPiecePosition() {
    draggedPiece.style.setProperty("--col", originalPosition.col);
    draggedPiece.style.setProperty("--row", originalPosition.row);
  }

  // 拖拽后清理
  function cleanupAfterDrag() {
    draggedPiece.style.opacity = "";
    draggedPiece.style.zIndex = "";
    draggedPiece.style.transition = "";
    draggedPiece = null;
    originalPosition = null;
  }

  // 应用道具效果
  function applyItemEffects(col, row) {
    if (!draggedPiece || !draggedPiece.classList.contains("red")) return;
    if (killGeneralEnabled) removeEnemiesOnCross(col, row);
    if (useItemEnabled)
      removeEnemiesOnPath(originalPosition.col, originalPosition.row, col, row);
  }

  // 移除十字线上的敌人
  function removeEnemiesOnCross(col, row) {
    const blackPieces = document.querySelectorAll(".chess-piece.black");
    let removed = false;

    blackPieces.forEach((piece) => {
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));

      if (
        (pieceCol === col || pieceRow === row) &&
        !(pieceCol === col && pieceRow === row)
      ) {
        capturePiece(piece);
        removed = true;
      }
    });

    if (removed) setTimeout(updateDangerZones, 300);
  }

  // 移除路径上的敌人
  function removeEnemiesOnPath(startCol, startRow, endCol, endRow) {
    const blackPieces = document.querySelectorAll(".chess-piece.black");
    let removed = false;

    blackPieces.forEach((piece) => {
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));

      if (startCol === endCol && pieceCol === startCol) {
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        if (pieceRow > minRow && pieceRow < maxRow) {
          capturePiece(piece);
          removed = true;
        }
      } else if (startRow === endRow && pieceRow === startRow) {
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        if (pieceCol > minCol && pieceCol < maxCol) {
          capturePiece(piece);
          removed = true;
        }
      }
    });

    if (removed) setTimeout(updateDangerZones, 300);
  }

  // 重置棋盘
  function resetBoard() {
    const pieces = document.querySelectorAll(".chess-piece");
    pieces.forEach((piece) => {
      if (
        !piece.classList.contains("rook") ||
        !piece.classList.contains("red")
      ) {
        piece.remove();
      }
    });

    clearDangerZones();
    clearSafeZones();
    clearBestMove();

    killGeneralCheckbox.checked = false;
    useItemCheckbox.checked = false;
    killGeneralEnabled = false;
    useItemEnabled = false;
  }

  // 清除危险区域
  function clearDangerZones() {
    document.querySelectorAll(".danger-zone").forEach((zone) => zone.remove());
  }

  // 清除安全区域
  function clearSafeZones() {
    document.querySelectorAll(".safe-zone").forEach((zone) => zone.remove());
  }

  // 清除最佳移动标记
  function clearBestMove() {
    document.querySelectorAll(".best-move").forEach((zone) => zone.remove());
  }

  // 更新危险区域
  function updateDangerZones() {
    clearDangerZones();
    clearSafeZones();
    clearBestMove();

    document.querySelectorAll(".chess-piece.black").forEach((piece) => {
      const col = parseInt(piece.style.getPropertyValue("--col"));
      const row = parseInt(piece.style.getPropertyValue("--row"));
      const pieceType = piece.className.split(" ")[2];

      getAttackPositions(pieceType, col, row).forEach((pos) => {
        if (!isPositionOccupied(pos.col, pos.row)) {
          createDangerZone(pos.col, pos.row);
        }
      });
    });

    updateSafeZones();
  }

  // 获取棋子的攻击位置
  function getAttackPositions(pieceType, col, row) {
    const positions = [];

    switch (pieceType) {
      case "pawn":
        positions.push({ col, row: row + 1 }, { col, row: row - 1 });
        positions.push({ col: col - 1, row }, { col: col + 1, row });
        break;

      case "horse":
        if (!isPositionOccupied(col, row + 1)) {
          positions.push({ col: col + 1, row: row + 2 });
          positions.push({ col: col - 1, row: row + 2 });
        }
        // 下方向
        if (!isPositionOccupied(col, row - 1)) {
          positions.push({ col: col + 1, row: row - 2 });
          positions.push({ col: col - 1, row: row - 2 });
        }
        // 左方向
        if (!isPositionOccupied(col - 1, row)) {
          positions.push({ col: col - 2, row: row + 1 });
          positions.push({ col: col - 2, row: row - 1 });
        }
        // 右方向
        if (!isPositionOccupied(col + 1, row)) {
          positions.push({ col: col + 2, row: row + 1 });
          positions.push({ col: col + 2, row: row - 1 });
        }
        break;

      case "elephant":
        if (!isPositionOccupied(col - 1, row + 1)) {
          positions.push({ col: col - 2, row: row + 2 });
        }
        // 右上方向
        if (!isPositionOccupied(col + 1, row + 1)) {
          positions.push({ col: col + 2, row: row + 2 });
        }
        // 左下方向
        if (!isPositionOccupied(col - 1, row - 1)) {
          positions.push({ col: col - 2, row: row - 2 });
        }
        // 右下方向
        if (!isPositionOccupied(col + 1, row - 1)) {
          positions.push({ col: col + 2, row: row - 2 });
        }
        break;

      case "advisor":
        positions.push(
          { col: col + 1, row: row + 1 },
          { col: col - 1, row: row + 1 },
          { col: col + 1, row: row - 1 },
          { col: col - 1, row: row - 1 }
        );
        break;

      case "rook":
        // 水平向右
        for (let i = col + 1; i <= 8; i++) {
          positions.push({ col: i, row });
          if (isPositionOccupied(i, row)) break; // 遇到棋子就停止
        }

        // 水平向左
        for (let i = col - 1; i >= 1; i--) {
          positions.push({ col: i, row });
          if (isPositionOccupied(i, row)) break; // 遇到棋子就停止
        }

        // 垂直向上
        for (let j = row + 1; j <= 9; j++) {
          positions.push({ col, row: j });
          if (isPositionOccupied(col, j)) break; // 遇到棋子就停止
        }

        // 垂直向下
        for (let j = row - 1; j >= 1; j--) {
          positions.push({ col, row: j });
          if (isPositionOccupied(col, j)) break; // 遇到棋子就停止
        }
        break;

      case "cannon":
        // 向右
        {
          let screenFound = false;
          for (let i = col + 1; i <= 8; i++) {
            if (!screenFound) {
              if (isPositionOccupied(i, row)) screenFound = true; // 找到第一个棋子（炮架）
            } else {
              if (isPositionOccupied(i, row)) break; // 遇到第二个棋子 → 停止
              positions.push({ col: i, row }); // 炮架后的空格 → 危险区域
            }
          }
        }

        // 向左
        {
          let screenFound = false;
          for (let i = col - 1; i >= 1; i--) {
            if (!screenFound) {
              if (isPositionOccupied(i, row)) screenFound = true;
            } else {
              if (isPositionOccupied(i, row)) break;
              positions.push({ col: i, row });
            }
          }
        }

        // 向上
        {
          let screenFound = false;
          for (let j = row + 1; j <= 9; j++) {
            if (!screenFound) {
              if (isPositionOccupied(col, j)) screenFound = true;
            } else {
              if (isPositionOccupied(col, j)) break;
              positions.push({ col, row: j });
            }
          }
        }

        // 向下
        {
          let screenFound = false;
          for (let j = row - 1; j >= 1; j--) {
            if (!screenFound) {
              if (isPositionOccupied(col, j)) screenFound = true;
            } else {
              if (isPositionOccupied(col, j)) break;
              positions.push({ col, row: j });
            }
          }
        }
        break;

      case "general":
        positions.push(
          { col, row: row + 1 },
          { col, row: row - 1 },
          { col: col + 1, row },
          { col: col - 1, row }
        );
        break;
    }

    return positions.filter(
      (pos) => pos.col >= 1 && pos.col <= 8 && pos.row >= 1 && pos.row <= 9
    );
  }

  // 创建危险区域
  function createDangerZone(col, row) {
    const zone = document.createElement("div");
    zone.className = "danger-zone";
    zone.style.setProperty("--col", col);
    zone.style.setProperty("--row", row);
    chessBoard.appendChild(zone);
  }

  // 更新安全区域
  function updateSafeZones() {
    const safeMoves = calculateSafeMoves();
    safeMoves.forEach((move) => {
      const zone = document.createElement("div");
      zone.className = "safe-zone";
      if (move.isCapture) zone.classList.add("capture-zone");
      zone.style.setProperty("--col", move.col);
      zone.style.setProperty("--row", move.row);
      chessBoard.appendChild(zone);
    });
  }

  // 计算最佳移动
  function calculateBestMove() {
    clearBestMove();
    const rookPos = getRedRookPosition();
    if (!rookPos) {
      alert("未找到红车！");
      return;
    }

    const safeMoves = calculateSafeMoves();
    if (safeMoves.length === 0) return;

    const kingCaptureMove = safeMoves.find((move) => {
      const piece = getPieceAtPosition(move.col, move.row);
      return piece && piece.classList.contains("general");
    });

    const bestMove = kingCaptureMove || safeMoves[0];

    if (kingCaptureMove) {
      const followUpMove = findBestPositionAfterEatingKing(
        rookPos.col,
        rookPos.row,
        kingCaptureMove.col,
        kingCaptureMove.row
      );

      if (followUpMove) {
        bestMove.score += followUpMove.score * 0.7;
      }
    }

    const bestMoveElement = document.createElement("div");
    bestMoveElement.className = "best-move";
    bestMoveElement.style.setProperty("--col", bestMove.col);
    bestMoveElement.style.setProperty("--row", bestMove.row);
    chessBoard.appendChild(bestMoveElement);

    console.log(bestMove);
  }

  function findBestPositionAfterEatingKing(
    startCol,
    startRow,
    kingCol,
    kingRow
  ) {
    // 模拟吃掉将后的棋盘状态
    const simulatedPieces = [];
    document.querySelectorAll(".chess-piece").forEach((piece) => {
      const col = parseInt(piece.style.getPropertyValue("--col"));
      const row = parseInt(piece.style.getPropertyValue("--row"));
      if (!(col === kingCol && row === kingRow)) {
        simulatedPieces.push({
          element: piece,
          col,
          row,
          type: piece.className.split(" ")[2],
          color: piece.classList.contains("red") ? "red" : "black",
        });
      }
    });

    let bestPosition = null;
    let maxScore = 0;

    // 检查所有可能移动
    const directions = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    directions.forEach((dir) => {
      for (let i = 1; i <= 8; i++) {
        const newCol = kingCol + dir.dx * i;
        const newRow = kingRow + dir.dy * i;

        if (newCol < 1 || newCol > 8 || newRow < 1 || newRow > 9) break;

        // 计算该位置能消除的棋子数量
        const piecesToRemove = simulatedPieces.filter(
          (p) => p.color === "black" && (p.col === newCol || p.row === newRow)
        );

        const score = piecesToRemove.length * 20; // 每个棋子20分

        if (score > maxScore) {
          maxScore = score;
          bestPosition = { col: newCol, row: newRow, score };
        }
      }
    });

    return bestPosition;
  }

  // 获取红车位置
  function getRedRookPosition() {
    const rook = document.querySelector(".chess-piece.red.rook");
    if (!rook) return null;
    return {
      col: parseInt(rook.style.getPropertyValue("--col")),
      row: parseInt(rook.style.getPropertyValue("--row")),
    };
  }

  // 计算安全移动
  function calculateSafeMoves() {
    const rookPos = getRedRookPosition();
    if (!rookPos) return [];

    const safeMoves = [];
    const directions = [
      { dx: 0, dy: 1 }, // 上
      { dx: 0, dy: -1 }, // 下
      { dx: -1, dy: 0 }, // 左
      { dx: 1, dy: 0 }, // 右
    ];

    directions.forEach((dir) => {
      for (let i = 1; i <= 8; i++) {
        const newCol = rookPos.col + dir.dx * i;
        const newRow = rookPos.row + dir.dy * i;

        if (newCol < 1 || newCol > 8 || newRow < 1 || newRow > 9) break;

        const pieceAtPosition = getPieceAtPosition(newCol, newRow);
        const isCapture =
          pieceAtPosition && pieceAtPosition.classList.contains("black");

        let piecesToRemove = [];
        if (isCapture) piecesToRemove.push(pieceAtPosition);
        if (killGeneralEnabled)
          piecesToRemove.push(...getPiecesOnCross(newCol, newRow));
        if (useItemEnabled)
          piecesToRemove.push(
            ...getPiecesOnPath(rookPos.col, rookPos.row, newCol, newRow)
          );

        piecesToRemove = [...new Set(piecesToRemove)];

        const isSafe =
          piecesToRemove.length > 0
            ? !isPositionAttackedAfterRemoval(newCol, newRow, piecesToRemove)
            : !isPositionAttacked(newCol, newRow);

        if (isSafe) {
          safeMoves.push({
            col: newCol,
            row: newRow,
            isCapture,
            piecesToRemove,
            score: calculatePositionScore(
              newCol,
              newRow,
              isCapture,
              piecesToRemove
            ),
          });
        }

        if (pieceAtPosition) {
          if (!useItemEnabled) {
            break;
          }
        }
      }
    });

    return safeMoves.sort((a, b) => b.score - a.score);
  }

  // 计算位置评分
  function calculatePositionScore(col, row, isCapture, piecesToRemove = []) {
    let score = 0;

    // 1. 中心位置得分更高
    const centerX = 5,
      centerY = 5;
    const distanceToCenter = Math.abs(col - centerX) + Math.abs(row - centerY);
    score += (10 - distanceToCenter) * 2 * 0.8;

    const threatScore = calculateThreatPotential(col, row);
    score += threatScore * 15;

    if (isCapture) {
      const targetPiece = getPieceAtPosition(col, row);
      if (targetPiece) {
        const pieceType = targetPiece.className.split(" ")[2];
        score +=
          getCaptureScore(pieceType) * (pieceType === "general" ? 10 : 1);
      }
    }

    piecesToRemove.forEach((piece) => {
      const pieceType = piece.className.split(" ")[2];
      score += getCaptureScore(pieceType) * 0.7;
    });

    // 4. 安全位置额外加分
    if (!isPositionAttacked(col, row)) {
      score += 20;
    }

    return score;
  }

  function calculateThreatPotential(col, row) {
    let threatCount = 0;
    const directions = [
      { dx: 0, dy: 1 }, // 上
      { dx: 0, dy: -1 }, // 下
      { dx: -1, dy: 0 }, // 左
      { dx: 1, dy: 0 }, // 右
    ];

    directions.forEach((dir) => {
      for (let i = 1; i <= 8; i++) {
        const checkCol = col + dir.dx * i;
        const checkRow = row + dir.dy * i;

        if (checkCol < 1 || checkCol > 8 || checkRow < 1 || checkRow > 9) break;

        const piece = getPieceAtPosition(checkCol, checkRow);

        if (piece && piece.classList.contains("black")) {
          threatCount++;
          break;
        }
      }
    });

    return threatCount;
  }

  // 获取吃子分数
  function getCaptureScore(pieceType) {
    const scores = {
      general: 1000,
      rook: 70,
      cannon: 60,
      horse: 50,
      elephant: 40,
      advisor: 30,
      pawn: 20,
    };
    return scores[pieceType] || 0;
  }

  // 检查位置是否被攻击
  function isPositionAttacked(col, row) {
    const blackPieces = document.querySelectorAll(".chess-piece.black");
    for (const piece of blackPieces) {
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));
      const pieceType = piece.className.split(" ")[2];

      if (isPositionAttackedByPiece(col, row, pieceCol, pieceRow, pieceType)) {
        return true;
      }
    }
    return false;
  }

  // 检查是否被特定棋子攻击
  function isPositionAttackedByPiece(col, row, pieceCol, pieceRow, pieceType) {
    const positions = getAttackPositions(pieceType, pieceCol, pieceRow);
    return positions.some((pos) => pos.col === col && pos.row === row);
  }

  // 检查移除棋子后的安全状态
  function isPositionAttackedAfterRemoval(col, row, piecesToRemove) {
    const remainingPieces = [];

    document.querySelectorAll(".chess-piece.black").forEach((piece) => {
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));
      const pieceType = piece.className.split(" ")[2];

      const shouldRemove = piecesToRemove.some(
        (p) =>
          parseInt(p.style.getPropertyValue("--col")) === pieceCol &&
          parseInt(p.style.getPropertyValue("--row")) === pieceRow
      );

      if (!shouldRemove) {
        remainingPieces.push({ col: pieceCol, row: pieceRow, type: pieceType });
      }
    });

    for (const piece of remainingPieces) {
      if (
        isPositionAttackedByPiece(col, row, piece.col, piece.row, piece.type)
      ) {
        return true;
      }
    }
    return false;
  }

  // 获取十字线上的棋子
  function getPiecesOnCross(col, row) {
    const pieces = [];
    document.querySelectorAll(".chess-piece.black").forEach((piece) => {
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));
      if (
        (pieceCol === col || pieceRow === row) &&
        !(pieceCol === col && pieceRow === row)
      ) {
        pieces.push(piece);
      }
    });
    return pieces;
  }

  // 获取路径上的棋子
  function getPiecesOnPath(startCol, startRow, endCol, endRow) {
    const pieces = [];
    document.querySelectorAll(".chess-piece.black").forEach((piece) => {
      const pieceCol = parseInt(piece.style.getPropertyValue("--col"));
      const pieceRow = parseInt(piece.style.getPropertyValue("--row"));

      if (startCol === endCol && pieceCol === startCol) {
        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        if (pieceRow > minRow && pieceRow < maxRow) pieces.push(piece);
      } else if (startRow === endRow && pieceRow === startRow) {
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);
        if (pieceCol > minCol && pieceCol < maxCol) pieces.push(piece);
      }
    });
    return pieces;
  }

  // 初始化应用
  init();
});
