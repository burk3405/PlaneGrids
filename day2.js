(function() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }

  function main() {
    let lastClickedCell = null;
    const usedNames = new Set();
    let currentValidOptions = []; // Initialize currentValidOptions
    const wrongGuesses = new Map(); // key: cell, value: Set of wrong names
    const cellToAnswer = new Map(); // key: cell index, value: selected answer
    const cellRarityScores = new Map(); // key: cell index, value: rarity score

    // Get all non-interactive cells except the rarity cell
    const nonInteractiveCells = document.querySelectorAll(
        '#game-board .cell.non-interactive:not(#rarity-cell)'
    );

    // Example content for each non-interactive cell (left column and top row, excluding top-left)
    // You can use images (logos) or text as needed
    const cellContents = [
        '<img src="manufacturers/embraer.png" alt="Embraer" style="width:108px;height:24px;">',
        '<img src="manufacturers/dassault.png" alt="Dassault" style="width:135px;height:135px;">',
        '<img src="manufacturers/bombardier.png" alt="Bombardier" style="width:128px;height:75px;border-radius:0px;">', // Add (AKA) Mitsubishi to the Hover text
        // Left column (excluding top-left)
        'Regional',
        'Freighter',
        '<img src="operators/american.png" alt="American Airlines" style="width:100px;height:56px;border-radius:0px;">'
    ];

  // Tooltip messages for each non-interactive cell (excluding rarity cell)
    const cellTooltips = [
        "This column is for Airbus aircraft.",
        "This column is for twin-engine planes.",
        "This column is for Boeing aircraft.",
        "This row is for Emirates.",
        "This row is for Singapore Airlines.",
        "This row is for Qantas."
    ];

    // Assign content and tooltip to each non-interactive cell (skipping the rarity cell)
    nonInteractiveCells.forEach((cell, idx) => {
        if (cellContents[idx]) {
            cell.innerHTML = cellContents[idx];
            cell.setAttribute('title', cellTooltips[idx] || "");
            // If the cell contains an image, set the title on the image too
            const img = cell.querySelector('img');
            if (img) {
                img.setAttribute('title', cellTooltips[idx] || "");
            }
        }
    });


    // '<img src="manufacturers/embraer.png" alt="Embraer" style="width:108px;height:24px;">'



    // Helper: get row/col from data-index (for a 3x3 grid in a 4x4 grid)
    function getRowColFromIndex(index) {
        // index: 0-8, left-to-right, top-to-bottom
        return {
            row: Math.floor(index / 3),
            col: index % 3
        };
    }

    // Example attributes for rows/columns (customize as needed)
    const rowAttributes = ['Emirates', 'Singapore', 'Qantas'];
    const colAttributes = ['Airbus', 'Twin-engine', 'Boeing'];

    // Example: [row][col] = count
    const possibleAircraftCounts = [
        [3, 4, 2], // Row 0: Emirates x [Airbus, Twin-engine, Boeing]
        [3, 7, 5], // Row 1: Singapore x [Airbus, Twin-engine, Boeing]
        [3, 4, 2]  // Row 2: Qantas x [Airbus, Twin-engine, Boeing]
    ];

    const validOptions = [
        // Row 0: Emirates
        [
            ["Airbus A350-900", "Airbus A380-800", "Airbus ACJ319"], // Emirates x Airbus
            ["Airbus A350-900", "Airbus ACJ319", "Boeing 777-200LR", "Boeing 777-300ER"],   // Emirates x Twin-engine
            ["Boeing 777-200LR", "Boeing 777-300ER"]                 // Emirates x Boeing
        ],
        // Row 1: Singapore
        [
            ["Airbus A350-900", "Airbus A350-900ULR", "Airbus A380-800"],    // Singapore x Airbus
            ["Airbus A350-900", "Airbus A350-900ULR", "Boeing 737-800", "Boeing 737 MAX 8", "Boeing 777-300ER", "Boeing 777-9", "Boeing 787-10"],                                                      // Singapore x Twin-engine
            ["Boeing 737-800", "Boeing 737 MAX 8", "Boeing 777-300ER", "Boeing 777-9", "Boeing 787-10"]  // Singapore x Boeing
        ],
        // Row 2: Qantas
        [
            ["Airbus A330-200", "Airbus A330-300", "Airbus A380-800"],  // Qantas x Airbus
            ["Airbus A330-200", "Airbus A330-300", "Boeing 737-800", "Boeing 787-9"], // Qantas x Twin-engine
            ["Boeing 737-800", "Boeing 787-9"]                          // Qantas x Boeing
        ]
    ];

    const airlineAircraftCounts = {
        "Emirates": {
            "Airbus A350-900": 6,
            "Airbus A380-800": 116,
            "Airbus ACJ319": 1,
            "Boeing 777-200LR": 10,
            "Boeing 777-300ER": 120,
            // ...add other Emirates aircraft as needed
        },
        "Singapore": {
            "Airbus A350-900": 58,
            "Airbus A350-900ULR": 7,
            "Airbus A380-800": 12,
            "Boeing 737-800": 4,
            "Boeing 737 MAX 8": 17,
            "Boeing 777-300ER": 22,
            "Boeing 787-10": 26
            // ...add other Singapore aircraft as needed
        },
        "Qantas": {
            "Airbus A330-200": 16,
            "Airbus A330-300": 12,
            "Airbus A380-800": 10,
            "Boeing 737-800": 75,
            "Boeing 787-9": 14
            // ...add other Qantas aircraft as needed
        }
        // Add more airlines as needed
    };

    // Modal logic
    const modalOverlay = document.getElementById('cell-modal-overlay');
    const modalAttributes = document.querySelector('.modal-attributes');
    const guessInput = document.querySelector('.modal-guess-input');
    const modalMiddleRow = document.querySelector('.modal-row-middle');

    // List of possible names (replace with your own)
    const possibleNames = [
        "Airbus A330-200",
        "Airbus A330-300",
        "Airbus A350-900",
        "Airbus A350-900ULR",
        "Airbus A380-800",
        "Airbus ACJ319",
        "Boeing 737-800",
        "Boeing 737 MAX 8",
        "Boeing 777-200LR",
        "Boeing 777-300ER",
        "Boeing 777-9",
        "Boeing 787-9",
        "Boeing 787-10"
    ];

    const nameToImage = {
        "Airbus A330-200": "images/a330-200-airbus.png",
        "Airbus A330-300": "images/a330-300-airtransat.png",
        "Airbus A350-900": "images/a350-900-airbus.png",
        "Airbus A350-900ULR": "images/a350-900ulr-singapore.png",
        "Airbus A380-800": "images/a380-emirates.png",
        "Airbus ACJ319": "images/acj-319.png",
        "Boeing 737-800": "images/737-800-delta.png",
        "Boeing 737 MAX 8": "images/737-max-8-westjet.png",
        "Boeing 777-200LR": "images/777-200lr-aircanada.png",
        "Boeing 777-300ER": "images/777-300er-boeing.png",
        "Boeing 777-9": "images/777-9-boeing.png",
        "Boeing 787-9": "images/787-9-boeing.png",
        "Boeing 787-10": "images/787-10-boeing.png"
    };

    // Listen for clicks on interactive cells
    document.querySelectorAll('#game-board .cell:not(.non-interactive)').forEach(cell => {
        cell.addEventListener('click', function () {
            // Prevent guessing again if already guessed
            if (cell.dataset.guessed === "true") return;

            lastClickedCell = cell;
            const idx = parseInt(cell.getAttribute('data-index'), 10);
            const { row, col } = getRowColFromIndex(idx);

            // Set attributes in modal
            modalAttributes.textContent = `${rowAttributes[row]} × ${colAttributes[col]}`;

            // Set possible aircraft count in modal top row
            const modalPossibleAircraft = document.querySelector('.modal-possible-aircraft');
            const count = possibleAircraftCounts[row][col];
            guessInput.value = '';
            guessInput.placeholder = `${count} possible aircraft`;
            guessInput.focus();

            // Set valid options for this cell
            currentValidOptions = validOptions[row][col];

            // Show modal
            modalOverlay.style.display = 'flex';
            guessInput.value = '';
            guessInput.focus();

            // Trigger input event to refresh match list and show "Already used"
            guessInput.dispatchEvent(new Event('input'));
        });
    });

    // Listen for input in the guess box
    guessInput.addEventListener('input', function () {
        const query = guessInput.value.trim().toLowerCase();
        // Show all possibleNames, not just currentValidOptions
        const matches = possibleNames.filter(name =>
            name.toLowerCase().includes(query) && query.length > 0
        );

       if (query.length === 0) {
            // Restore the row/column attributes when input is empty
            modalMiddleRow.innerHTML = `<span class="modal-attributes">${modalAttributes.textContent}</span>`;
            return;
        }


        if (matches.length > 0) {
            const cellKey = lastClickedCell ? lastClickedCell.dataset.index : null;
            const wrongSet = cellKey && wrongGuesses.has(cellKey) ? wrongGuesses.get(cellKey) : new Set();

            modalMiddleRow.innerHTML = `
                <div class="modal-match-list">
                    ${matches.map(name => {
                        if (usedNames.has(name)) {
                            return `
                                <div class="modal-match-row">
                                    <span>${name}</span>
                                    <span style="margin-left:1em;font-style:italic;color:#888;">Already used</span>
                                </div>
                            `;
                        } else if (wrongSet.has(name)) {
                            return `
                                <div class="modal-match-row">
                                    <span style="color:#e74c3c;">${name}</span>
                                    <button class="modal-select-btn" disabled style="background:#ccc;color:#fff;cursor:not-allowed;margin-left:1em;">Select</button>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="modal-match-row">
                                    <span>${name}</span>
                                    <button class="modal-select-btn">Select</button>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
            `;
        } else {
            modalMiddleRow.innerHTML = `<div style="color:#888;padding:0.3em 0;">No matches found.</div>`;
        }
    });

    // Handle Select button clicks
    modalMiddleRow.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-select-btn') && !e.target.disabled) {
            const selectedName = e.target.previousElementSibling.textContent;
            // If correct
            if (currentValidOptions.includes(selectedName)) {
                const cellKey = lastClickedCell.dataset.index;
                const idx = parseInt(cellKey, 10);
                const { row } = getRowColFromIndex(idx);
                const airline = rowAttributes[row];

                // Remove previous answer for this cell from usedNames
                if (cellToAnswer.has(cellKey)) {
                    usedNames.delete(cellToAnswer.get(cellKey));
                }

                // Add new answer to usedNames and update cellToAnswer
                usedNames.add(selectedName);
                cellToAnswer.set(cellKey, selectedName);

                // --- Rarity score calculation ---
                const total = getCellTotalForAirline(row, currentValidOptions);
                const selectedCount = airlineAircraftCounts[airline]?.[selectedName] || 0;
                let rarity = 0;
                if (total > 0) {
                    rarity = +(selectedCount / total).toFixed(3);
                }
                cellRarityScores.set(cellKey, rarity);

                updateTotalRarityScore();

                // Get background image based on rarity
                const bgImage = getBackgroundByRarity(rarity);
                let rarityDisplay;
                if (bgImage === 'unicorn.png') {
                    rarityDisplay = '🦄';
                } else {
                    rarityDisplay = `${(rarity * 100).toFixed(1)}%`;
                }
                lastClickedCell.innerHTML = `
                    <div class="cell-content">
                        <div class="cell-bg" style="background-image:url('images/backgrounds/${bgImage}');"></div>
                        <div class="cell-rarity-badge">${rarityDisplay}</div>
                        <img src="${nameToImage[selectedName]}" alt="${selectedName}">
                        <div class="cell-caption">${selectedName}</div>
                    </div>
                `;
                modalOverlay.style.display = 'none';

                const allFilled = Array.from(document.querySelectorAll('#game-board .cell:not(.non-interactive)'))
                  .every(cell => cell.innerHTML.trim() !== '');
                if (allFilled) {
                  setTimeout(() => {
                    document.getElementById('completion-modal-overlay').style.display = 'flex';
                  }, 1500); // 1500 ms = 1.5 seconds
                }
            } else {
                // Wrong guess: mark as wrong for this cell, refresh modal
                const cellKey = lastClickedCell.dataset.index;
                if (!wrongGuesses.has(cellKey)) wrongGuesses.set(cellKey, new Set());
                wrongGuesses.get(cellKey).add(selectedName);
                // Re-trigger input to update modal
                guessInput.dispatchEvent(new Event('input'));
            }
        }
    });

    // Hide modal on overlay click (optional)
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });

    // Optional: Hide modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            modalOverlay.style.display = 'none';
        }
    });

    // Reset Game button logic
    const resetBtn = document.getElementById('reset');
    resetBtn.addEventListener('click', function () {
        document.querySelectorAll('#game-board .cell:not(.non-interactive)').forEach(cell => {
            cell.innerHTML = '';
            cell.removeAttribute('data-guessed');
        });
        usedNames.clear();
        wrongGuesses.clear();
        cellToAnswer.clear();
        cellRarityScores.clear();
        updateTotalRarityScore();
    });

    // Dark mode toggle
    // const darkModeBtn = document.getElementById('dark-mode-btn');
    // darkModeBtn.addEventListener('click', function () {
    //     document.body.classList.toggle('dark-mode-active');
    // });

    // Completion modal close logic
    document.getElementById('completion-close-btn').onclick = function() {
      document.getElementById('completion-modal-overlay').style.display = 'none';
    };
    // Optionally, add logic for the action buttons:
    document.getElementById('completion-share-btn').onclick = function() {
      // Add your share logic here
      alert('Share functionality coming soon!');
    };
    document.getElementById('completion-play-again-btn').onclick = function() {
      document.getElementById('completion-modal-overlay').style.display = 'none';
      document.getElementById('reset').click();
    };
    function getCellTotal(validOptions) {
        return validOptions.reduce((sum, name) => sum + (aircraftCounts[name] || 0), 0);
    }

    function updateTotalRarityScore() {
        let total = 0;
        for (let val of cellRarityScores.values()) {
            total += val;
        }
        // Show to 3 decimal places
        document.getElementById('score').innerHTML = `<strong>${total.toFixed(3)}</strong>`;
    }

    function getCellTotalForAirline(row, validOptions) {
        const airline = rowAttributes[row];
        let total = 0;
        for (const name of validOptions) {
            total += airlineAircraftCounts[airline]?.[name] || 0;
        }
        return total;
    }

    function getBackgroundByRarity(rarity) {
        if (rarity > 0.15) return 'default.png';
        if (rarity > 0.10) return 'tan.png';
        if (rarity > 0.05) return 'silver.png';
        if (rarity > 0.01) return 'gold.png';
        if (rarity > 0.001) return 'galaxy.png';
        return 'unicorn.png';
    }


    /* Emoji's for sharing

        - 🦄 Unicorn
        - 🟪 Galaxy
        - 🟨 Gold
        - ⬜ Silver
        - 🟫 Bronze
        - ⬛ Common

    */


    /*

    🟨🟪⬜
    ⬜🟫🦄
    ⬛🟫⬛

    */
  }
})();