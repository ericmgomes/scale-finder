class HarmonicFieldView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onSelectChordCallback = null;
        this.onPlayChordCallback = null;
    }

    setOnSelectChord(callback) {
        this.onSelectChordCallback = callback;
    }

    setOnPlayChord(callback) {
        this.onPlayChordCallback = callback;
    }

    // Identify standard chord types from stack of notes
    getChordName(notesStack) {
        if (!notesStack || notesStack.length === 0) return '';
        const rootNote = notesStack[0];
        const rootIdx = MusicTheory.notes.indexOf(rootNote);
        if (rootIdx === -1) return rootNote;

        const intervals = notesStack.map(note => {
            let diff = MusicTheory.notes.indexOf(note) - rootIdx;
            if (diff < 0) diff += 12;
            return diff;
        });

        // Normalize to one octave range (modulo 12) and sort to compare
        const normalizedIntervals = [...new Set(intervals.map(v => v % 12))].sort((a, b) => a - b);

        let bestMatch = '';
        let minNotesCount = 999;
        
        for (const [chordName, chordIntervals] of Object.entries(MusicTheory.chords)) {
            const normChordIntervals = [...new Set(chordIntervals.map(v => v % 12))].sort((a, b) => a - b);
            if (JSON.stringify(normalizedIntervals) === JSON.stringify(normChordIntervals)) {
                // If it matches intervals exactly, returns root + chordName
                const displaySuffix = chordName === 'Major' ? '' : chordName === 'Minor' ? 'm' : ' ' + chordName;
                return rootNote + displaySuffix;
            }
        }

        // Fallback for custom stacks: just show "Root (notes)"
        return rootNote + ' (stack)';
    }

    render(currentRoot, currentScaleType, chordSize = 'triads') {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (currentScaleType === 'none') {
            this.container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem;">Select a Scale above to calculate its diatonic chords (Harmonic Field).</div>';
            return;
        }

        const scaleNotes = MusicTheory.getNotesInSequence(currentRoot, currentScaleType, false);
        if (scaleNotes.length === 0) return;

        const numNotes = scaleNotes.length;
        const stackSize = chordSize === 'triads' ? 3 : chordSize === 'tetrads' ? 4 : chordSize === '9ths' ? 5 : chordSize === '11ths' ? 6 : 7;
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

        scaleNotes.forEach((rootNote, i) => {
            // Stack thirds
            const chordNotes = [];
            for (let k = 0; k < stackSize; k++) {
                const noteName = scaleNotes[(i + k * 2) % numNotes];
                if (!chordNotes.includes(noteName)) {
                    chordNotes.push(noteName);
                }
            }

            const chordName = this.getChordName(chordNotes);
            const degreeText = numNotes === 7 ? romanNumerals[i] : `${i + 1}`;

            const card = document.createElement('div');
            card.className = 'chord-card';
            
            const degreeDiv = document.createElement('div');
            degreeDiv.className = 'chord-degree';
            degreeDiv.innerText = degreeText;
            card.appendChild(degreeDiv);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'chord-name';
            nameDiv.innerText = chordName;
            card.appendChild(nameDiv);

            const notesDiv = document.createElement('div');
            notesDiv.className = 'chord-notes';
            notesDiv.innerText = chordNotes.join(' - ');
            card.appendChild(notesDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'chord-actions';

            const playBtn = document.createElement('button');
            playBtn.className = 'chord-action-btn';
            playBtn.innerText = '🔊 Play';
            playBtn.title = 'Play Chord arpeggio';
            playBtn.onclick = (e) => {
                e.stopPropagation();
                if (this.onPlayChordCallback) {
                    this.onPlayChordCallback(chordNotes);
                }
            };
            actionsDiv.appendChild(playBtn);

            const showBtn = document.createElement('button');
            showBtn.className = 'chord-action-btn';
            showBtn.innerText = '🎯 Show';
            showBtn.title = 'Highlight this chord on the fretboard';
            showBtn.onclick = (e) => {
                e.stopPropagation();
                if (this.onSelectChordCallback) {
                    // Try to map back to selector values
                    let chordType = 'Major';
                    const nameWithoutRoot = chordName.substring(rootNote.length);
                    if (nameWithoutRoot === 'm') chordType = 'Minor';
                    else if (nameWithoutRoot === '') chordType = 'Major';
                    else chordType = nameWithoutRoot.trim();

                    this.onSelectChordCallback(rootNote, chordType);
                }
            };
            actionsDiv.appendChild(showBtn);

            card.appendChild(actionsDiv);

            // Card click highlights chord on board
            card.onclick = () => {
                showBtn.click();
            };

            this.container.appendChild(card);
        });
    }
}
