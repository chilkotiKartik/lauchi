Translations of the PYQ bank. One file per subject and language: `<COURSE>.hi.json` (Hindi, Devanagari) and `<COURSE>.hl.json` (Hinglish, Roman script).

Shape: `{ "units": { "1": "unit title", ... }, "q": { "<pyq id>": { "title": "...", "parts": ["...", "..."] } }, "predicted": { "<unit>:<index>": { "title": "...", "text": "..." } } }`

`parts` has the same length and order as the English `parts`. Keep numbers, units, symbols and the allowed markup (<sub> <sup> <b> <i>) exactly. Technical terms stay recognisable (e.g. "Newton's rings / न्यूटन वलय").
