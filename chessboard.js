const board = document.getElementById("chessboard");

const pieceSymbols = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙"
};

let draggedFromSquare = null;

function createBoard() {
  board.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      const isWhite = (row + col) % 2 === 0;
      square.classList.add(isWhite ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("dragover", allowDrop);
      square.addEventListener("drop", drop);
      board.appendChild(square);
    }
  }
}

function loadFEN(fen) {
  createBoard();
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, rIdx) => {
    let col = 0;
    for (let char of row) {
      if (isNaN(char)) {
        const square = board.querySelector(
          `.square[data-row="${rIdx}"][data-col="${col}"]`
        );
        if (square) {
          const piece = document.createElement("div");
          piece.textContent = pieceSymbols[char] || "";
          piece.classList.add("piece");
          piece.setAttribute("draggable", "true");
          piece.addEventListener("dragstart", drag);
          square.innerHTML = "";
          square.appendChild(piece);
        }
        col++;
      } else {
        col += parseInt(char);
      }
    }
  });
}

function loadPosition() {
  const selected = document.querySelector('input[name="position"]:checked').value;
  const fenInput = document.getElementById("fenInput").value.trim();
  if (selected === "start") {
    loadFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  } else if (fenInput) {
    loadFEN(fenInput);
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.preventDefault();
  draggedFromSquare = ev.target.parentElement;
  ev.dataTransfer.setData("text", ev.target.textContent);
  ev.dataTransfer.setData("class", ev.target.className);
}

function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const className = ev.dataTransfer.getData("class");

  let target = ev.target;
  if (!target.classList.contains("square")) {
    target = target.closest(".square");
  }

  if (target && draggedFromSquare) {
    draggedFromSquare.innerHTML = "";
    target.innerHTML = "";
    const piece = document.createElement("div");
    piece.textContent = data;
    piece.className = className;
    piece.setAttribute("draggable", "true");
    piece.addEventListener("dragstart", drag);
    target.appendChild(piece);
    draggedFromSquare = null;
  }
}

function copyToClipboard(text) {
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  alert("Copied to clipboard!");
}

function getCurrentFEN() {
  let fen = "";
  for (let row = 0; row < 8; row++) {
    let empty = 0;
    for (let col = 0; col < 8; col++) {
      const square = board.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
      const piece = square?.querySelector(".piece");
      if (piece) {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        const symbol = Object.entries(pieceSymbols).find(([k, v]) => v === piece.textContent)?.[0];
        fen += symbol || "";
      } else {
        empty++;
      }
    }
    if (empty > 0) fen += empty;
    if (row < 7) fen += "/";
  }
  return fen + " w KQkq - 0 1";
}

const exportBtn = document.createElement("button");
exportBtn.textContent = "Export FEN";
exportBtn.id = "exportFEN";
exportBtn.onclick = () => {
  const fen = getCurrentFEN();
  copyToClipboard(fen);
};
document.body.appendChild(exportBtn);

const inputField = document.getElementById("fenInput");
if (inputField) {
  const copyIcon = document.createElement("span");
  copyIcon.className = "copy-icon";
  copyIcon.textContent = "📋";
  copyIcon.title = "Copy input text";
  copyIcon.onclick = () => {
    copyToClipboard(inputField.value.trim());
  };
  inputField.parentNode.appendChild(copyIcon);
}

loadPosition();

document.addEventListener("dragend", (ev) => {
  const x = ev.clientX;
  const y = ev.clientY;
  const boardRect = board.getBoundingClientRect();
  const insideBoard =
    x >= boardRect.left &&
    x <= boardRect.right &&
    y >= boardRect.top &&
    y <= boardRect.bottom;

  if (!insideBoard && draggedFromSquare) {
    draggedFromSquare.innerHTML = "";
    draggedFromSquare = null;
  }
});

const piecePicker = document.createElement("div");
piecePicker.id = "piecePicker";
piecePicker.style.display = "none";
piecePicker.style.position = "absolute";
piecePicker.style.background = "#222";
piecePicker.style.border = "1px solid #888";
piecePicker.style.padding = "5px";
piecePicker.style.zIndex = "1000";
document.body.appendChild(piecePicker);

const allPieces = Object.entries(pieceSymbols);
allPieces.forEach(([key, symbol]) => {
  const btn = document.createElement("button");
  btn.textContent = symbol;
  btn.style.margin = "2px";
  btn.style.fontSize = "24px";
  btn.onclick = () => {
    if (piecePicker.targetSquare) {
      const piece = document.createElement("div");
      piece.textContent = symbol;
      piece.className = "piece";
      piece.setAttribute("draggable", "true");
      piece.addEventListener("dragstart", drag);
      piecePicker.targetSquare.innerHTML = "";
      piecePicker.targetSquare.appendChild(piece);
    }
    piecePicker.style.display = "none";
  };
  piecePicker.appendChild(btn);
});

board.addEventListener("contextmenu", (ev) => {
  ev.preventDefault();
  const square = ev.target.closest(".square");
  if (square && square.children.length === 0) {
    piecePicker.style.left = `${ev.pageX}px`;
    piecePicker.style.top = `${ev.pageY}px`;
    piecePicker.style.display = "block";
    piecePicker.targetSquare = square;
  } else {
    piecePicker.style.display = "none";
  }
});

document.addEventListener("click", () => {
  piecePicker.style.display = "none";
});
