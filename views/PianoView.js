class PianoView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onNoteClickCallback = null;
        this.keyElements = [];
    }

    setOnNoteClick(callback) {
        this.onNoteClickCallback = callback;
    }

    setTheme(theme) {
        if (!this.container) return;
        this.container.classList.remove('theme-classic', 'theme-synth', 'theme-rhodes', 'theme-matrix');
        this.container.classList.add(`theme-${theme}`);
    }

    render(startOctave = 2, octaves = 3) {
        if (!this.container) return; // early return

        this.container.innerHTML = '';
        this.container.className = 'piano-keyboard';
        this.keyElements = [];

        // Note standard sequence
        const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

        for (let oct = startOctave; oct < startOctave + octaves; oct++) {
            const octaveGroup = document.createElement('div');
            octaveGroup.className = 'piano-octave';

            // Draw white keys first
            whiteNotes.forEach((noteName) => {
                const wKey = document.createElement('div');
                wKey.className = 'piano-key white-key';
                this.setupKey(wKey, noteName, oct);
                octaveGroup.appendChild(wKey);
            });

            // Draw black keys (absolutely positioned relative to octaveGroup)
            // Black key positions conceptually rest between the white keys:
            // C# (idx 1), D# (idx 2), F# (idx 4), G# (idx 5), A# (idx 6) relative to white indices 0-6.
            const blackConfig = [
                { note: 'Db', pos: 1 }, 
                { note: 'Eb', pos: 2 },
                { note: 'Gb', pos: 4 },
                { note: 'Ab', pos: 5 },
                { note: 'Bb', pos: 6 }
            ];

            blackConfig.forEach((cfg) => {
                const bKey = document.createElement('div');
                bKey.className = 'piano-key black-key';
                
                // Standard width calculations for keyboard spacing
                // if there are 7 white keys, each is ~14.28% wide. Extrapolating the CSS calc dynamically.
                const whiteWidth = 100 / 7;
                bKey.style.left = `calc(${cfg.pos * whiteWidth}% - var(--bkey-width-half))`;
                
                this.setupKey(bKey, cfg.note, oct);
                octaveGroup.appendChild(bKey);
            });

            this.container.appendChild(octaveGroup);
        }
    }

    setupKey(elem, noteName, octave) {
        const frequency = MusicTheory.getFrequency(noteName, octave);
        elem.dataset.note = noteName;
        
        elem.onclick = () => {
            if(this.onNoteClickCallback) {
                this.onNoteClickCallback({ note: noteName, frequency, octave });
            }
        };
        
        const label = document.createElement('span');
        label.className = 'key-label';
        label.innerText = noteName;
        elem.appendChild(label);
        
        // Save ref for highlighting later
        this.keyElements.push(elem);
    }

    highlightNotes(activeNotes, rootNote, showRootHighlight, labelMode = 'notes') {
        if (!this.container || !activeNotes || activeNotes.length === 0) return;

        this.keyElements.forEach(key => {
            const note = key.dataset.note;
            key.classList.remove('visible', 'root');
            
            // Labels Logic
            const labelSpan = key.querySelector('.key-label');
            if (labelMode === 'none') {
                labelSpan.innerText = '';
            } else if (labelMode === 'intervals') {
                labelSpan.innerText = MusicTheory.getIntervalName(rootNote, note);
            } else {
                labelSpan.innerText = note; // Default or off-scale
            }

            if (activeNotes.includes(note)) {
                key.classList.add('visible');
                if (showRootHighlight && note === rootNote) {
                    key.classList.add('root');
                }
            }
        });
    }
}
