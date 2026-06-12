class SheetMusicView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onNoteClickCallback = null;
    }

    setOnNoteClick(callback) {
        this.onNoteClickCallback = callback;
    }

    // Helper to map letter name to diatonic step index
    // C=0, D=1, E=2, F=3, G=4, A=5, B=6
    getLetterStep(noteName) {
        const letter = noteName.charAt(0).toUpperCase();
        const mapping = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };
        return mapping[letter] !== undefined ? mapping[letter] : 0;
    }

    // Convert note + octave to absolute diatonic step number
    getDiatonicStep(noteName, octave) {
        const letterStep = this.getLetterStep(noteName);
        return octave * 7 + letterStep;
    }

    // Key signature lookup based on parent major root note
    getKeySignature(parentMajorRoot) {
        const sigs = {
            'C': { type: 'none', count: 0, notes: [] },
            'G': { type: 'sharp', count: 1, notes: ['F'] },
            'D': { type: 'sharp', count: 2, notes: ['F', 'C'] },
            'A': { type: 'sharp', count: 3, notes: ['F', 'C', 'G'] },
            'E': { type: 'sharp', count: 4, notes: ['F', 'C', 'G', 'D'] },
            'B': { type: 'sharp', count: 5, notes: ['F', 'C', 'G', 'D', 'A'] },
            'F': { type: 'flat', count: 1, notes: ['B'] },
            'Bb': { type: 'flat', count: 2, notes: ['B', 'E'] },
            'Eb': { type: 'flat', count: 3, notes: ['B', 'E', 'A'] },
            'Ab': { type: 'flat', count: 4, notes: ['B', 'E', 'A', 'D'] },
            'Db': { type: 'flat', count: 5, notes: ['B', 'E', 'A', 'D', 'G'] },
            'Gb': { type: 'flat', count: 6, notes: ['B', 'E', 'A', 'D', 'G', 'C'] }
        };
        return sigs[parentMajorRoot] || { type: 'none', count: 0, notes: [] };
    }

    drawKeySignatureSVG(clef, type, count, xStart, centerY, lineSpacing) {
        if (type === 'none' || count === 0) return '';
        
        let svg = '';
        const symbol = type === 'sharp' ? '♯' : '♭';
        
        let trebleSteps = [];
        let bassSteps = [];
        
        if (type === 'sharp') {
            trebleSteps = [38, 35, 39, 36, 33, 37, 34]; // F, C, G, D, A, E, B
            bassSteps = [24, 21, 25, 22, 19, 23, 20];
        } else {
            trebleSteps = [34, 37, 33, 36, 32, 35, 31]; // B, E, A, D, G, C, F
            bassSteps = [20, 23, 19, 22, 18, 21, 17];
        }
        
        const steps = clef === 'bass' ? bassSteps : trebleSteps;
        const refStep = clef === 'bass' ? 22 : 34;
        
        for (let i = 0; i < count; i++) {
            const step = steps[i];
            const x = xStart + i * 7;
            const y = centerY - (step - refStep) * (lineSpacing / 2);
            svg += `<text x="${x}" y="${y + 5}" class="accidental">${symbol}</text>`;
        }
        
        return svg;
    }

    // Generate ascending notes with octaves
    getNotesWithOctaves(notes, clef) {
        if (!notes || notes.length === 0) return [];

        const root = notes[0];
        let startOctave = 4; // Default for Treble

        if (clef === 'bass') {
            startOctave = 2; // Default for Bass Clef
            if (['G', 'Ab', 'A', 'Bb', 'B'].includes(root)) {
                startOctave = 1;
            }
        } else if (clef === 'grand') {
            startOctave = 3; // Start lower on grand staff
        } else {
            // Treble Clef
            if (['G', 'Ab', 'A', 'Bb', 'B'].includes(root)) {
                startOctave = 3;
            }
        }

        const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const getIndex = (n) => {
            const normalized = n.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');
            return chromatic.indexOf(normalized);
        };

        const notesWithOctaves = [];
        let currentOctave = startOctave;
        let prevIndex = -1;

        const count = notes.length;
        const totalNotesToRender = count === 3 || count === 4 || count === 5 ? count : count + 1; // Chords vs Scales

        for (let i = 0; i < totalNotesToRender; i++) {
            const noteName = notes[i % count];
            const idx = getIndex(noteName);
            if (i > 0 && idx <= prevIndex) {
                currentOctave++;
            }
            notesWithOctaves.push({
                name: noteName,
                octave: currentOctave
            });
            prevIndex = idx;
        }

        return notesWithOctaves;
    }

    render(notes, clefMode, parentMajorRoot = 'C', rootNote = null, isChord = false, inversion = 0, showRootHighlight = true) {
        if (!this.container) return;

        const renderedNotes = this.getNotesWithOctaves(notes, clefMode);
        if (renderedNotes.length === 0) {
            this.container.innerHTML = '<p class="text-muted">Select a scale or chord to view sheet music.</p>';
            return;
        }

        const isGrand = clefMode === 'grand';
        const height = isGrand ? 175 : 100;
        const width = 640;
        
        let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="sheet-music-svg" xmlns="http://www.w3.org/2000/svg">`;

        // Style overrides for SVG elements
        svg += `
            <style>
                .staff-line { stroke: var(--glass-border); stroke-width: 1.2; }
                .clef-text { font-family: 'Segoe UI Symbol', 'Apple Symbols', sans-serif; font-size: 44px; fill: var(--text-main); user-select: none; }
                .clef-text-bass { font-family: 'Segoe UI Symbol', 'Apple Symbols', sans-serif; font-size: 36px; fill: var(--text-main); user-select: none; }
                .note-head { fill: var(--text-muted); stroke: var(--text-muted); stroke-width: 1; transition: fill 0.2s, transform 0.2s, filter 0.2s; cursor: pointer; }
                .note-head:hover { fill: var(--accent); filter: drop-shadow(0 0 6px var(--accent)); }
                .note-head.root-note { fill: var(--primary) !important; stroke: var(--primary-hover) !important; filter: drop-shadow(0 0 6px var(--primary)); }
                .note-head.bass-note { fill: var(--accent) !important; stroke: var(--accent) !important; filter: drop-shadow(0 0 6px var(--accent)); }
                .note-stem { stroke: var(--text-main); stroke-width: 1.5; pointer-events: none; }
                .ledger-line { stroke: var(--text-main); stroke-width: 1.2; pointer-events: none; }
                .accidental { font-family: 'Segoe UI Symbol', 'Apple Symbols', sans-serif; font-size: 20px; fill: var(--text-main); font-weight: bold; pointer-events: none; user-select: none; }
                .grand-brace { stroke: var(--text-main); stroke-width: 2.0; fill: none; }
                .staff-side-border { stroke: var(--glass-border); stroke-width: 2.0; }
            </style>
        `;

        const lineSpacing = 8;
        const xStart = 40;
        const xEnd = width - 40;

        const keySig = this.getKeySignature(parentMajorRoot);
        const keySigWidth = keySig.count * 7;

        if (isGrand) {
            const trebleCenterY = 45;
            const bassCenterY = 125;

            // Draw grand staff connecting brace
            svg += `<path d="M ${xStart} ${trebleCenterY - 16} L ${xStart} ${bassCenterY + 16}" class="staff-side-border" />`;
            svg += `<path d="M ${xEnd} ${trebleCenterY - 16} L ${xEnd} ${bassCenterY + 16}" class="staff-side-border" />`;
            svg += `<path d="M ${xStart - 8} ${trebleCenterY - 16} Q ${xStart - 15} ${trebleCenterY + 25} ${xStart - 8} ${trebleCenterY + 40} Q ${xStart - 15} ${trebleCenterY + 55} ${xStart - 8} ${bassCenterY + 16}" class="grand-brace" />`;

            // Draw Treble Lines
            for (let i = -2; i <= 2; i++) {
                const y = trebleCenterY + i * lineSpacing;
                svg += `<line x1="${xStart}" y1="${y}" x2="${xEnd}" y2="${y}" class="staff-line" />`;
            }
            svg += `<text x="${xStart + 12}" y="${trebleCenterY + 10}" class="clef-text">𝄞</text>`;
            svg += this.drawKeySignatureSVG('treble', keySig.type, keySig.count, xStart + 42, trebleCenterY, lineSpacing);

            // Draw Bass Lines
            for (let i = -2; i <= 2; i++) {
                const y = bassCenterY + i * lineSpacing;
                svg += `<line x1="${xStart}" y1="${y}" x2="${xEnd}" y2="${y}" class="staff-line" />`;
            }
            svg += `<text x="${xStart + 12}" y="${bassCenterY + 7}" class="clef-text-bass">𝄢</text>`;
            svg += this.drawKeySignatureSVG('bass', keySig.type, keySig.count, xStart + 42, bassCenterY, lineSpacing);

            // Render notes (adjusting start offset based on key signature width)
            const notesOffset = xStart + 52 + Math.max(30, keySigWidth + 15);
            const noteSpacing = (xEnd - 40 - notesOffset) / (renderedNotes.length - 1 || 1);
            
            renderedNotes.forEach((n, idx) => {
                const x = notesOffset + idx * noteSpacing;
                const step = this.getDiatonicStep(n.name, n.octave);
                
                if (step >= 29) {
                    const y = trebleCenterY - (step - 34) * (lineSpacing / 2);
                    svg += this.drawNoteSVG(n, x, y, step, trebleCenterY, 30, 40, lineSpacing, keySig, rootNote, isChord, inversion, showRootHighlight, idx === 0);
                } else {
                    const y = bassCenterY - (step - 22) * (lineSpacing / 2);
                    svg += this.drawNoteSVG(n, x, y, step, bassCenterY, 16, 28, lineSpacing, keySig, rootNote, isChord, inversion, showRootHighlight, idx === 0);
                }
            });

        } else {
            const centerY = 50;
            svg += `<line x1="${xStart}" y1="${centerY - 16}" x2="${xStart}" y2="${centerY + 16}" class="staff-side-border" />`;
            svg += `<line x1="${xEnd}" y1="${centerY - 16}" x2="${xEnd}" y2="${centerY + 16}" class="staff-side-border" />`;

            for (let i = -2; i <= 2; i++) {
                const y = centerY + i * lineSpacing;
                svg += `<line x1="${xStart}" y1="${y}" x2="${xEnd}" y2="${y}" class="staff-line" />`;
            }

            if (clefMode === 'bass') {
                svg += `<text x="${xStart + 12}" y="${centerY + 7}" class="clef-text-bass">𝄢</text>`;
                svg += this.drawKeySignatureSVG('bass', keySig.type, keySig.count, xStart + 42, centerY, lineSpacing);
                
                const notesOffset = xStart + 52 + Math.max(30, keySigWidth + 15);
                const noteSpacing = (xEnd - 40 - notesOffset) / (renderedNotes.length - 1 || 1);
                
                renderedNotes.forEach((n, idx) => {
                    const x = notesOffset + idx * noteSpacing;
                    const step = this.getDiatonicStep(n.name, n.octave);
                    const y = centerY - (step - 22) * (lineSpacing / 2);
                    svg += this.drawNoteSVG(n, x, y, step, centerY, 16, 28, lineSpacing, keySig, rootNote, isChord, inversion, showRootHighlight, idx === 0);
                });
            } else {
                svg += `<text x="${xStart + 12}" y="${centerY + 10}" class="clef-text">𝄞</text>`;
                svg += this.drawKeySignatureSVG('treble', keySig.type, keySig.count, xStart + 42, centerY, lineSpacing);

                const notesOffset = xStart + 52 + Math.max(30, keySigWidth + 15);
                const noteSpacing = (xEnd - 40 - notesOffset) / (renderedNotes.length - 1 || 1);
                
                renderedNotes.forEach((n, idx) => {
                    const x = notesOffset + idx * noteSpacing;
                    const step = this.getDiatonicStep(n.name, n.octave);
                    const y = centerY - (step - 34) * (lineSpacing / 2);
                    svg += this.drawNoteSVG(n, x, y, step, centerY, 30, 40, lineSpacing, keySig, rootNote, isChord, inversion, showRootHighlight, idx === 0);
                });
            }
        }

        svg += `</svg>`;
        this.container.innerHTML = svg;

        // Attach event listeners
        const noteHeads = this.container.querySelectorAll('.note-head');
        noteHeads.forEach(head => {
            head.addEventListener('click', (e) => {
                const note = e.target.dataset.note;
                const octave = parseInt(e.target.dataset.octave, 10);
                if (this.onNoteClickCallback) {
                    this.onNoteClickCallback(note, octave);
                }
            });
        });
    }

    drawNoteSVG(n, x, y, step, centerY, bottomStaffStep, topStaffStep, lineSpacing, keySig, rootNote, isChord, inversion, showRootHighlight, isFirstNote) {
        let noteSVG = '';

        // Draw Ledger Lines
        if (step <= bottomStaffStep) {
            for (let s = bottomStaffStep; s >= step; s -= 2) {
                const ly = centerY - (s - (bottomStaffStep + 2)) * (lineSpacing / 2);
                noteSVG += `<line x1="${x - 11}" y1="${ly}" x2="${x + 11}" y2="${ly}" class="ledger-line" />`;
            }
        } else if (step >= topStaffStep) {
            for (let s = topStaffStep; s <= step; s += 2) {
                const ly = centerY - (s - (topStaffStep - 2)) * (lineSpacing / 2);
                noteSVG += `<line x1="${x - 11}" y1="${ly}" x2="${x + 11}" y2="${ly}" class="ledger-line" />`;
            }
        }

        // Draw Accidental ONLY if the letter is NOT already altered in the key signature
        const noteLetter = n.name.charAt(0);
        const inKeySig = keySig.notes.includes(noteLetter);

        if (!inKeySig) {
            if (n.name.includes('#')) {
                noteSVG += `<text x="${x - 15}" y="${y + 5}" class="accidental">♯</text>`;
            } else if (n.name.includes('b')) {
                noteSVG += `<text x="${x - 14}" y="${y + 5}" class="accidental">♭</text>`;
            }
        }

        // Determine classes
        let classes = ['note-head'];
        if (showRootHighlight && rootNote && n.name === rootNote) {
            classes.push('root-note');
        }
        if (isChord && inversion > 0 && isFirstNote) {
            classes.push('bass-note');
        }
        const classStr = classes.join(' ');

        // Draw Note Head
        noteSVG += `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="4.3" transform="rotate(-20, ${x}, ${y})" class="${classStr}" data-note="${n.name}" data-octave="${n.octave}" />`;

        // Draw Stem
        const midStep = bottomStaffStep + 4;
        if (step >= midStep) {
            noteSVG += `<line x1="${x - 6.0}" y1="${y}" x2="${x - 6.0}" y2="${y + 26}" class="note-stem" />`;
        } else {
            noteSVG += `<line x1="${x + 6.0}" y1="${y}" x2="${x + 6.0}" y2="${y - 26}" class="note-stem" />`;
        }

        return noteSVG;
    }
}

