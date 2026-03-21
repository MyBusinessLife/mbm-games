(function () {
  "use strict";

  var COLOR_POOL = [
    { id: "marron", label: "Marron", hex: "#8b5e4c" },
    { id: "noir", label: "Noir", hex: "#2f3440" },
    { id: "rouge", label: "Rouge", hex: "#c34754" },
    { id: "gris", label: "Gris", hex: "#b7b4c5" },
    { id: "bleu", label: "Bleu", hex: "#4252b8" },
    { id: "jaune", label: "Jaune", hex: "#e7be48" },
    { id: "vert", label: "Vert", hex: "#5da06f" }
  ];

  var COLOR_BY_ID = COLOR_POOL.reduce(function (accumulator, color) {
    accumulator[color.id] = color;
    return accumulator;
  }, {});

  var NUMBER_POOL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  function buildPermutations(items, length) {
    var results = [];

    function step(current, available) {
      var index;

      if (current.length === length) {
        results.push(current.slice());
        return;
      }

      for (index = 0; index < available.length; index += 1) {
        current.push(available[index]);
        step(
          current,
          available.slice(0, index).concat(available.slice(index + 1))
        );
        current.pop();
      }
    }

    step([], items.slice());
    return results;
  }

  var NUMBER_CANDIDATES = buildPermutations(NUMBER_POOL, 4);
  var COLOR_CANDIDATES = buildPermutations(
    COLOR_POOL.map(function (color) {
      return color.id;
    }),
    3
  );

  var MODE_CONFIGS = {
    numbers: {
      key: "numbers",
      label: "Version chiffres",
      codeLength: 4,
      candidates: NUMBER_CANDIDATES,
      allowedPatterns: new Set([
        "0-0",
        "1-0",
        "1-1",
        "2-0",
        "2-1",
        "2-2",
        "3-0",
        "3-1"
      ]),
      note:
        "Tous les chiffres du code sont différents. Chaque chargement crée une nouvelle énigme.",
      inputHelp: "Entre 4 chiffres différents.",
      feminine: false,
      nouns: { singular: "chiffre", plural: "chiffres" },
      good: { singular: "bon", plural: "bons" },
      placement: {
        wellSingular: "bien placé",
        wellPlural: "bien placés",
        badSingular: "mal placé",
        badPlural: "mal placés"
      }
    },
    colors: {
      key: "colors",
      label: "Version couleurs",
      codeLength: 3,
      candidates: COLOR_CANDIDATES,
      allowedPatterns: new Set(["0-0", "1-0", "1-1", "2-0", "2-1", "3-0"]),
      note:
        "Toutes les couleurs du code sont différentes. Chaque chargement crée une nouvelle énigme.",
      inputHelp: "Clique sur chaque case pour faire défiler les couleurs.",
      feminine: true,
      nouns: { singular: "couleur", plural: "couleurs" },
      good: { singular: "bonne", plural: "bonnes" },
      placement: {
        wellSingular: "bien placée",
        wellPlural: "bien placées",
        badSingular: "mal placée",
        badPlural: "mal placées"
      }
    }
  };

  function shuffle(list) {
    var clone = list.slice();
    var index;
    var swapIndex;
    var temporary;

    for (index = clone.length - 1; index > 0; index -= 1) {
      swapIndex = Math.floor(Math.random() * (index + 1));
      temporary = clone[index];
      clone[index] = clone[swapIndex];
      clone[swapIndex] = temporary;
    }

    return clone;
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function arraysEqual(first, second) {
    var index;

    if (first.length !== second.length) {
      return false;
    }

    for (index = 0; index < first.length; index += 1) {
      if (first[index] !== second[index]) {
        return false;
      }
    }

    return true;
  }

  function numberWord(count, feminine, lowercase) {
    var words = {
      1: feminine ? "une" : "un",
      2: "deux",
      3: "trois",
      4: "quatre"
    };
    var word = words[count] || String(count);

    if (lowercase) {
      return word;
    }

    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function computeFeedback(secret, guess) {
    var wellPlaced = 0;
    var present = 0;
    var index;

    for (index = 0; index < guess.length; index += 1) {
      if (secret[index] === guess[index]) {
        wellPlaced += 1;
      }

      if (secret.indexOf(guess[index]) !== -1) {
        present += 1;
      }
    }

    return {
      present: present,
      wellPlaced: wellPlaced
    };
  }

  function clueSentence(config, present, wellPlaced) {
    var subject;
    var detail;
    var noun = present === 1 ? config.nouns.singular : config.nouns.plural;
    var good = present === 1 ? config.good.singular : config.good.plural;
    var verb = present === 1 ? "est" : "sont";

    if (present === 0) {
      return "Rien n'est bon.";
    }

    subject =
      numberWord(present, config.feminine, false) +
      " " +
      noun +
      " " +
      verb +
      " " +
      good;

    if (wellPlaced === 0) {
      return (
        subject +
        " et " +
        (present === 1
          ? config.placement.badSingular
          : config.placement.badPlural) +
        "."
      );
    }

    if (wellPlaced === present) {
      return (
        subject +
        " et " +
        (wellPlaced === 1
          ? config.placement.wellSingular
          : config.placement.wellPlural) +
        "."
      );
    }

    detail =
      "dont " +
      numberWord(wellPlaced, config.feminine, true) +
      (wellPlaced === 1 ? " seul" + (config.feminine ? "e" : "") : "") +
      " " +
      (wellPlaced === 1 ? "est" : "sont") +
      " " +
      (wellPlaced === 1
        ? config.placement.wellSingular
        : config.placement.wellPlural);

    return subject + ", " + detail + ".";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeMode(rawValue) {
    var value = (rawValue || "random").toLowerCase().trim();

    if (value === "numbers" || value === "chiffres") {
      return "numbers";
    }

    if (value === "colors" || value === "couleurs") {
      return "colors";
    }

    return Math.random() < 0.5 ? "numbers" : "colors";
  }

  function filterSolutions(clues, candidates) {
    return candidates.filter(function (candidate) {
      return clues.every(function (clue) {
        var feedback = computeFeedback(candidate, clue.guess);
        return (
          feedback.present === clue.present &&
          feedback.wellPlaced === clue.wellPlaced
        );
      });
    });
  }

  function buildUniqueClueSet(config, secret, cluePool) {
    var attempt;
    var chosen;
    var zeroClues = cluePool.filter(function (clue) {
      return clue.pattern === "0-0";
    });

    function wouldRepeatPattern(selection, candidate) {
      var count = selection.filter(function (item) {
        return item.pattern === candidate.pattern;
      }).length;
      var limit = candidate.pattern === "0-0" ? 1 : 2;
      return count >= limit;
    }

    for (attempt = 0; attempt < 550; attempt += 1) {
      var solutions;
      chosen = [];

      if (zeroClues.length && Math.random() < 0.82) {
        chosen.push(randomItem(zeroClues));
      }

      while (chosen.length < 4) {
        var pick = randomItem(cluePool);
        if (
          chosen.some(function (clue) {
            return arraysEqual(clue.guess, pick.guess);
          })
        ) {
          continue;
        }

        if (wouldRepeatPattern(chosen, pick)) {
          continue;
        }

        chosen.push(pick);
      }

      if (
        !chosen.some(function (clue) {
          return clue.wellPlaced > 0;
        })
      ) {
        continue;
      }

      solutions = filterSolutions(chosen, config.candidates);

      if (solutions.length === 1 && arraysEqual(solutions[0], secret)) {
        return shuffle(chosen);
      }
    }

    return null;
  }

  function generatePuzzle(modeKey) {
    var config = MODE_CONFIGS[modeKey];
    var attempt;

    for (attempt = 0; attempt < 220; attempt += 1) {
      var secret = randomItem(config.candidates);
      var cluePool = [];

      config.candidates.forEach(function (candidate) {
        var feedback;
        var pattern;

        if (arraysEqual(candidate, secret)) {
          return;
        }

        feedback = computeFeedback(secret, candidate);
        pattern = feedback.present + "-" + feedback.wellPlaced;

        if (!config.allowedPatterns.has(pattern)) {
          return;
        }

        cluePool.push({
          guess: candidate,
          present: feedback.present,
          wellPlaced: feedback.wellPlaced,
          pattern: pattern
        });
      });

      var clues = buildUniqueClueSet(config, secret, cluePool);

      if (clues) {
        return {
          mode: modeKey,
          config: config,
          secret: secret,
          clues: clues.map(function (clue) {
            return {
              guess: clue.guess.slice(),
              present: clue.present,
              wellPlaced: clue.wellPlaced,
              text: clueSentence(config, clue.present, clue.wellPlaced)
            };
          })
        };
      }
    }

    throw new Error("Impossible de generer une enigme unique.");
  }

  function renderGuess(puzzle, clue) {
    if (puzzle.mode === "numbers") {
      return (
        '<div class="thecode-game__guess thecode-game__guess--numbers">' +
        clue.guess
          .map(function (digit) {
            return (
              '<span class="thecode-game__digit-box">' +
              escapeHtml(digit) +
              "</span>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    return (
      '<div class="thecode-game__guess">' +
      clue.guess
        .map(function (colorId) {
          var color = COLOR_BY_ID[colorId];
          return (
            '<div class="thecode-game__color-token">' +
            '<span class="thecode-game__color-label">' +
            escapeHtml(color.label) +
            "</span>" +
            '<span class="thecode-game__swatch" style="--tcg-swatch: ' +
            escapeHtml(color.hex) +
            ';"></span>' +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderAnswerInputs(puzzle) {
    var index;
    var inputs = [];

    if (puzzle.mode === "numbers") {
      for (index = 0; index < puzzle.config.codeLength; index += 1) {
        inputs.push(
          '<input class="thecode-game__input" type="text" inputmode="numeric" maxlength="1" aria-label="Chiffre ' +
            String(index + 1) +
            '" />'
        );
      }

      return (
        '<div class="thecode-game__answer-inputs thecode-game__answer-inputs--numbers">' +
        inputs.join("") +
        "</div>"
      );
    }

    for (index = 0; index < puzzle.config.codeLength; index += 1) {
      inputs.push(
        '<button class="thecode-game__color-slot" type="button" data-slot-index="' +
          String(index) +
          '" data-value="">' +
          '<span class="thecode-game__swatch" style="--tcg-swatch: rgba(126, 179, 143, 0.12);"></span>' +
          '<span class="thecode-game__color-slot-name">Choisir</span>' +
          "</button>"
      );
    }

    return (
      '<div class="thecode-game__answer-inputs thecode-game__answer-inputs--colors">' +
      inputs.join("") +
      "</div>" +
      '<p class="thecode-game__helper">' +
      escapeHtml(puzzle.config.inputHelp) +
      "</p>" +
      '<div class="thecode-game__palette">' +
      COLOR_POOL.map(function (color) {
        return (
          '<span class="thecode-game__palette-item">' +
          '<span class="thecode-game__swatch" style="--tcg-swatch: ' +
          escapeHtml(color.hex) +
          ';"></span>' +
          escapeHtml(color.label) +
          "</span>"
        );
      }).join("") +
      "</div>"
    );
  }

  function buildMarkup(puzzle) {
    return (
      '<section class="thecode-game__card" data-tcg-mode="' +
      escapeHtml(puzzle.mode) +
      '">' +
      '<div class="thecode-game__header">' +
      '<div class="thecode-game__eyebrow">' +
      escapeHtml(puzzle.config.label) +
      "</div>" +
      '<h2 class="thecode-game__title">The code</h2>' +
      '<p class="thecode-game__subtitle">Un mini-jeu genere aleatoirement a chaque chargement, resolvable uniquement avec les indices affiches.</p>' +
      "</div>" +
      '<div class="thecode-game__layout">' +
      '<div class="thecode-game__clues">' +
      puzzle.clues
        .map(function (clue) {
          return (
            '<article class="thecode-game__clue">' +
            renderGuess(puzzle, clue) +
            '<p class="thecode-game__clue-text">' +
            escapeHtml(clue.text) +
            "</p>" +
            "</article>"
          );
        })
        .join("") +
      "</div>" +
      '<aside class="thecode-game__sidebar">' +
      '<div class="thecode-game__note">' +
      '<span class="thecode-game__note-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3 2 21h20L12 3Z"></path><path d="M12 9v5"></path><circle cx="12" cy="17" r="1"></circle>' +
      "</svg>" +
      "</span>" +
      '<span>' +
      escapeHtml(puzzle.config.note) +
      "</span>" +
      "</div>" +
      '<div class="thecode-game__lock" aria-hidden="true">' +
      '<svg viewBox="0 0 180 210" role="presentation">' +
      '<path fill="#1f2937" d="M127 83V59c0-22-16-39-37-39S53 37 53 59v24H39c-5 0-9 4-9 9v87c0 5 4 9 9 9h102c5 0 9-4 9-9V92c0-5-4-9-9-9h-14Zm-54 0V59c0-10 7-18 17-18s17 8 17 18v24H73Z"></path>' +
      '<path fill="#fff" d="M90 108c-10 0-18 8-18 18 0 7 4 13 9 16l-3 21h24l-3-21c5-3 9-9 9-16 0-10-8-18-18-18Zm0 28a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"></path>' +
      '<text x="90" y="186" font-size="23" text-anchor="middle" font-family="inherit" font-weight="800" fill="#ffffff">Code ?</text>' +
      "</svg>" +
      "</div>" +
      '<div class="thecode-game__answer-card">' +
      '<p class="thecode-game__answer-title">A toi de jouer</p>' +
      '<p class="thecode-game__answer-subtitle">Trouve la combinaison exacte puis verifie ta reponse.</p>' +
      renderAnswerInputs(puzzle) +
      '<div class="thecode-game__actions">' +
      '<button class="thecode-game__button thecode-game__button--primary" type="button" data-action="check">Verifier</button>' +
      '<button class="thecode-game__button thecode-game__button--secondary" type="button" data-action="reset">Nouvelle enigme</button>' +
      "</div>" +
      '<p class="thecode-game__feedback" aria-live="polite"></p>' +
      "</div>" +
      "</aside>" +
      "</div>" +
      "</section>"
    );
  }

  function setFeedback(container, message, tone) {
    var feedback = container.querySelector(".thecode-game__feedback");

    if (!feedback) {
      return;
    }

    feedback.textContent = message;
    feedback.classList.remove("is-success", "is-error");

    if (tone) {
      feedback.classList.add(tone === "success" ? "is-success" : "is-error");
    }
  }

  function setupNumberInputs(container) {
    var inputs = Array.prototype.slice.call(
      container.querySelectorAll(".thecode-game__input")
    );

    if (!inputs.length) {
      return;
    }

    inputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        if (input.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    inputs[0].focus();
  }

  function paintColorSlot(button, colorId) {
    var swatch = button.querySelector(".thecode-game__swatch");
    var label = button.querySelector(".thecode-game__color-slot-name");

    if (!colorId) {
      button.dataset.value = "";
      swatch.style.setProperty("--tcg-swatch", "rgba(126, 179, 143, 0.12)");
      label.textContent = "Choisir";
      return;
    }

    button.dataset.value = colorId;
    swatch.style.setProperty("--tcg-swatch", COLOR_BY_ID[colorId].hex);
    label.textContent = COLOR_BY_ID[colorId].label;
  }

  function setupColorInputs(container) {
    var buttons = Array.prototype.slice.call(
      container.querySelectorAll(".thecode-game__color-slot")
    );
    var cycle = [""].concat(
      COLOR_POOL.map(function (color) {
        return color.id;
      })
    );

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var currentIndex = cycle.indexOf(button.dataset.value || "");
        var nextValue = cycle[(currentIndex + 1) % cycle.length];
        paintColorSlot(button, nextValue);
      });
    });
  }

  function collectAnswer(container, puzzle) {
    if (puzzle.mode === "numbers") {
      return Array.prototype.slice
        .call(container.querySelectorAll(".thecode-game__input"))
        .map(function (input) {
          return input.value.trim();
        });
    }

    return Array.prototype.slice
      .call(container.querySelectorAll(".thecode-game__color-slot"))
      .map(function (button) {
        return button.dataset.value || "";
      });
  }

  function hasDuplicates(values) {
    return new Set(values).size !== values.length;
  }

  function formatSecret(puzzle) {
    if (puzzle.mode === "numbers") {
      return puzzle.secret.join("");
    }

    return puzzle.secret
      .map(function (colorId) {
        return COLOR_BY_ID[colorId].label;
      })
      .join(" / ");
  }

  function attachEvents(container, forcedMode) {
    var puzzle = container.__theCodeGame.puzzle;
    var checkButton = container.querySelector('[data-action="check"]');
    var resetButton = container.querySelector('[data-action="reset"]');

    if (puzzle.mode === "numbers") {
      setupNumberInputs(container);
    } else {
      setupColorInputs(container);
    }

    checkButton.addEventListener("click", function () {
      var answer = collectAnswer(container, puzzle);
      var missing = answer.some(function (value) {
        return !value;
      });

      if (missing) {
        setFeedback(container, "Complete toutes les cases avant de verifier.", "error");
        return;
      }

      if (hasDuplicates(answer)) {
        setFeedback(
          container,
          puzzle.mode === "numbers"
            ? "Le code ne contient pas de chiffre en double."
            : "Le code ne contient pas de couleur en double.",
          "error"
        );
        return;
      }

      if (arraysEqual(answer, puzzle.secret)) {
        setFeedback(
          container,
          "Bravo, tu as trouve le code : " + formatSecret(puzzle) + ".",
          "success"
        );
        return;
      }

      setFeedback(container, "Ce n'est pas la bonne combinaison. Reessaie.", "error");
    });

    resetButton.addEventListener("click", function () {
      mount(container, forcedMode);
    });
  }

  function mount(container, preferredMode) {
    try {
      var mode = normalizeMode(preferredMode || container.getAttribute("data-mode"));
      var puzzle = generatePuzzle(mode);

      container.innerHTML = buildMarkup(puzzle);
      container.__theCodeGame = {
        puzzle: puzzle
      };

      attachEvents(container, preferredMode || container.getAttribute("data-mode"));
    } catch (error) {
      container.innerHTML =
        "<section class='thecode-game__card'><p class='thecode-game__clue-text'>Le jeu n'a pas pu se charger. Recharge la page pour generer une nouvelle enigme.</p></section>";
      if (window.console && typeof window.console.error === "function") {
        window.console.error(error);
      }
    }
  }

  function mountAll() {
    Array.prototype.forEach.call(
      document.querySelectorAll(".thecode-game"),
      function (container) {
        mount(container, container.getAttribute("data-mode"));
      }
    );
  }

  var hasMountedAll = false;

  function safeMountAll() {
    if (hasMountedAll) {
      return;
    }

    hasMountedAll = true;
    mountAll();
  }

  window.TheCodeGame = {
    createPuzzle: generatePuzzle,
    mount: mount,
    mountAll: safeMountAll
  };

  if (window.Webflow && typeof window.Webflow.push === "function") {
    window.Webflow.push(safeMountAll);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeMountAll);
  } else {
    safeMountAll();
  }

  if (window.addEventListener) {
    window.addEventListener("load", safeMountAll);
  }
})();
