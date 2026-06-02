class Synth {
    constructor() {
        this.ctx = null; // Wait for interaction
        this.droneOsc = null;
        this.droneGain = null;
        this.isDronePlaying = false;
    }
    
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    playNote(frequency) {
        if (!frequency) return;
        this.init();
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'triangle'; // Clean guitar tone approximation
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        // Envelope: quick attack, slow decay
        gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 1.6);
    }

    toggleDrone(frequency) {
        this.init();
        if (this.isDronePlaying) {
            this.stopDrone();
        } else {
            this.startDrone(frequency);
        }
    }

    startDrone(frequency) {
        if (!frequency || this.isDronePlaying) return;
        this.init();

        this.droneOsc = this.ctx.createOscillator();
        this.droneGain = this.ctx.createGain();

        this.droneOsc.type = 'sine'; // Smooth tone for background
        this.droneOsc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.droneGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 1.0); // Fade in nicely

        this.droneOsc.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc.start();
        this.isDronePlaying = true;
    }

    stopDrone() {
        if (!this.isDronePlaying || !this.droneGain) return;
        
        // Fade out
        this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        this.droneOsc.stop(this.ctx.currentTime + 0.6);
        
        this.isDronePlaying = false;
    }

    setDroneFrequency(frequency) {
        if (this.isDronePlaying && this.droneOsc) {
            // Glide to new frequency smoothly
            this.droneOsc.frequency.exponentialRampToValueAtTime(frequency, this.ctx.currentTime + 0.3);
        }
    }
}

class App {
    constructor() {
        this.fretboard = new Fretboard(null, 26);
        this.view = new FretboardView('fretboard');
        this.pianoView = new PianoView('piano-container');
        this.synth = new Synth();
        
        this.elements = {
            toggleGuitarSync: document.getElementById('toggle-guitar'),
            togglePianoSync: document.getElementById('toggle-piano'),
            fretContext: document.getElementById('fret-context-wrapper'),
            pianoContext: document.getElementById('piano-context-wrapper'),
            fretboardWrapper: document.getElementById('fretboard-wrapper'),
            pianoWrapper: document.getElementById('piano-wrapper'),
            pianoSettings: document.getElementById('piano-settings'),
            rootNoteSync: document.getElementById('root-note'),
            typeSync: document.getElementById('type-select'),
            showRootSync: document.getElementById('show-root'),
            droneBtnSync: document.getElementById('drone-btn'),
            randomBtnSync: document.getElementById('random-btn'),
            lightModeSync: document.getElementById('theme-btn'),
            leftHandedSync: document.getElementById('left-handed'),
            woodTypeSync: document.getElementById('wood-type'),
            stringCountSync: document.getElementById('string-count'),
            tuningPresetSync: document.getElementById('tuning-preset'),
            shapeSelectSync: document.getElementById('shape-select'),
            keyLabelsSync: document.getElementById('key-labels'),
            pianoThemeSync: document.getElementById('piano-theme')
        };
        
        this.defaultTuningsInfo = {
            'ukulele': [{note:'A', octave:4}, {note:'E', octave:4}, {note:'C', octave:4}, {note:'G', octave:4}],
            4: [{note:'G', octave:2}, {note:'D', octave:2}, {note:'A', octave:1}, {note:'E', octave:1}],
            5: [{note:'G', octave:2}, {note:'D', octave:2}, {note:'A', octave:1}, {note:'E', octave:1}, {note:'B', octave:0}],
            6: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}],
            7: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}, {note:'B', octave:1}],
            8: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}, {note:'B', octave:1}, {note:'Gb', octave:1}]
        };

        this.tuningsPresets = {
            'standard': { strings: '6', tuning: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}] },
            'drop_d': { strings: '6', tuning: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'D', octave:2}] },
            'drop_c': { strings: '6', tuning: [{note:'D', octave:4}, {note:'A', octave:3}, {note:'F', octave:3}, {note:'C', octave:3}, {note:'G', octave:2}, {note:'C', octave:2}] },
            'dadgad': { strings: '6', tuning: [{note:'D', octave:4}, {note:'A', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'D', octave:2}] },
            'open_d': { strings: '6', tuning: [{note:'D', octave:4}, {note:'A', octave:3}, {note:'Gb', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'D', octave:2}] },
            'open_g': { strings: '6', tuning: [{note:'D', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'G', octave:2}, {note:'D', octave:2}] },
            'standard_7': { strings: '7', tuning: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}, {note:'B', octave:1}] },
            'drop_a_7': { strings: '7', tuning: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}, {note:'A', octave:1}] },
            'standard_8': { strings: '8', tuning: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}, {note:'B', octave:1}, {note:'Gb', octave:1}] },
            'drop_e_8': { strings: '8', tuning: [{note:'E', octave:4}, {note:'B', octave:3}, {note:'G', octave:3}, {note:'D', octave:3}, {note:'A', octave:2}, {note:'E', octave:2}, {note:'B', octave:1}, {note:'E', octave:1}] }
        };
        
        this.init();
    }

    init() {
        if (!this.elements.rootNoteSync || !this.elements.typeSync) return; // Early return

        this.view.setOnNoteClick((noteData) => {
            this.synth.playNote(noteData.frequency);
        });

        this.pianoView.setOnNoteClick((noteData) => {
            this.synth.playNote(noteData.frequency);
        });

        // initial render of piano (3 octaves starting at C2)
        this.pianoView.render(2, 3);

        // Add interaction listeners for scale/notes
        this.elements.rootNoteSync.addEventListener('change', () => this.updateHighlights());
        this.elements.typeSync.addEventListener('change', () => this.updateHighlights());
        this.elements.showRootSync.addEventListener('change', () => this.updateHighlights());

        this.elements.droneBtnSync.addEventListener('click', () => {
            const rootNote = this.elements.rootNoteSync.value;
            // Play in octave 2 for a nice low hum
            const freq = MusicTheory.getFrequency(rootNote, 2);
            
            this.synth.toggleDrone(freq);
            
            if (this.synth.isDronePlaying) {
                this.elements.droneBtnSync.classList.add('active');
                this.elements.droneBtnSync.innerText = '⏹️';
            } else {
                this.elements.droneBtnSync.classList.remove('active');
                this.elements.droneBtnSync.innerText = '▶️';
            }
        });

        this.elements.randomBtnSync.addEventListener('click', () => {
            const rootOptions = this.elements.rootNoteSync.options;
            const randomRootIndex = Math.floor(Math.random() * rootOptions.length);
            this.elements.rootNoteSync.selectedIndex = randomRootIndex;

            // Type sync has optgroups, but `.options` flattens them correctly
            const typeOptions = this.elements.typeSync.options;
            const randomTypeIndex = Math.floor(Math.random() * typeOptions.length);
            this.elements.typeSync.selectedIndex = randomTypeIndex;

            // Trigger the UI update
            this.updateHighlights();
        });

        // Settings Listeners
        const sunSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        const moonSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

        let isLightMode = false;
        this.elements.lightModeSync.addEventListener('click', () => {
            isLightMode = !isLightMode;
            if (isLightMode) {
                document.documentElement.setAttribute('data-theme', 'light');
                this.elements.lightModeSync.innerHTML = moonSVG;
            } else {
                document.documentElement.removeAttribute('data-theme');
                this.elements.lightModeSync.innerHTML = sunSVG;
            }
            this.saveState();
        });

        this.elements.leftHandedSync.addEventListener('change', (e) => {
            this.view.setHandedness(e.target.checked);
            if (e.target.checked) {
                this.elements.fretboardWrapper.classList.add('left-handed-layout');
            } else {
                this.elements.fretboardWrapper.classList.remove('left-handed-layout');
            }
            this.saveState();
        });

        this.elements.woodTypeSync.addEventListener('change', (e) => {
            this.view.setWood(e.target.value);
            this.saveState();
        });

        this.elements.stringCountSync.addEventListener('change', (e) => {
            const val = e.target.value === 'ukulele' ? 'ukulele' : parseInt(e.target.value);
            this.handleStringCountChange(val);
            // Default preset mapped based on string count
            if (val === 6) this.elements.tuningPresetSync.value = 'standard';
            else if (val === 7) this.elements.tuningPresetSync.value = 'standard_7';
            else if (val === 8) this.elements.tuningPresetSync.value = 'standard_8';
            else this.elements.tuningPresetSync.value = 'custom';
            this.saveState();
        });

        this.elements.tuningPresetSync.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val !== 'custom' && this.tuningsPresets[val]) {
                const preset = this.tuningsPresets[val];
                this.elements.stringCountSync.value = preset.strings;
                
                // Copy the default to prevent mutating the original reference
                const newTuning = JSON.parse(JSON.stringify(preset.tuning));
                this.fretboard.setTuning(newTuning);
                this.renderFretboard();
                this.saveState();
            }
        });

        this.elements.toggleGuitarSync.addEventListener('change', (e) => {
            this.elements.fretboardWrapper.style.display = e.target.checked ? 'flex' : 'none';
            this.saveState();
        });

        this.elements.togglePianoSync.addEventListener('change', (e) => {
            this.elements.pianoWrapper.style.display = e.target.checked ? 'block' : 'none';
            this.saveState();
        });

        this.elements.shapeSelectSync.addEventListener('change', () => {
            this.updateHighlights();
        });

        this.elements.keyLabelsSync.addEventListener('change', () => {
            this.updateHighlights();
        });

        this.elements.pianoThemeSync.addEventListener('change', (e) => {
            this.pianoView.setTheme(e.target.value);
            this.saveState();
        });
        
        // Initial setup
        const savedState = this.loadState();
        
        this.view.setWood(this.elements.woodTypeSync.value);
        this.view.setHandedness(this.elements.leftHandedSync.checked);
        if (this.elements.leftHandedSync.checked) {
            this.elements.fretboardWrapper.classList.add('left-handed-layout');
        } else {
            this.elements.fretboardWrapper.classList.remove('left-handed-layout');
        }
        this.pianoView.setTheme(this.elements.pianoThemeSync.value);

        if (savedState && savedState.tuning) {
            // Restore exact tuning from previous session
            this.fretboard.setTuning(savedState.tuning);
            this.elements.stringCountSync.value = savedState.stringCount; // Use saved instrument
            this.renderFretboard();
        } else {
            const defaultInst = this.elements.stringCountSync.value;
            this.handleStringCountChange(defaultInst === 'ukulele' ? 'ukulele' : (parseInt(defaultInst) || 6)); 
        }

        // Instrument toggles init
        this.elements.fretboardWrapper.style.display = this.elements.toggleGuitarSync.checked ? 'flex' : 'none';
        this.elements.pianoWrapper.style.display = this.elements.togglePianoSync.checked ? 'block' : 'none';
    }

    handleStringCountChange(count) {
        if(!count || !this.defaultTuningsInfo[count]) return; // Early return
        
        // Copy the default to prevent mutating the original reference
        const newTuning = JSON.parse(JSON.stringify(this.defaultTuningsInfo[count]));
        this.fretboard.setTuning(newTuning);
        this.renderFretboard();
    }

    renderTuningUI() {
        const tuningCells = document.querySelectorAll('.tuning-cell');
        if (tuningCells.length !== this.fretboard.tuning.length) return;

        this.fretboard.tuning.forEach((tuningObj, index) => {
            const cell = tuningCells[index];
            cell.innerHTML = '';
            
            const selectContainer = document.createElement('div');
            selectContainer.className = 'tuning-select-group';

            const noteSelect = document.createElement('select');
            MusicTheory.notes.forEach(note => {
                const opt = document.createElement('option');
                opt.value = note;
                opt.innerText = note;
                if(note === tuningObj.note) opt.selected = true;
                noteSelect.appendChild(opt);
            });

            // On change, update the Fretboard state and redraw
            const onTuningChange = () => {
                this.fretboard.tuning[index].note = noteSelect.value;
                this.elements.tuningPresetSync.value = 'custom';
                this.renderFretboard();
                this.saveState();
            };

            noteSelect.addEventListener('change', onTuningChange);

            selectContainer.appendChild(noteSelect);
            cell.appendChild(selectContainer);
        });
    }

    renderFretboard() {
        this.view.render(this.fretboard.getFretboardState(), this.fretboard.frets);
        this.renderTuningUI();
        this.updateHighlights();
    }

    calculateCAGEDWindows(rootNote, shape) {
        // CAGED relies on standard 6 string tuning
        if (this.elements.stringCountSync.value !== '6' || this.elements.tuningPresetSync.value !== 'standard') {
            return null; 
        }

        const state = this.fretboard.getFretboardState();
        const lowENotes = state[5].notes;
        const aNotes = state[4].notes;
        const dNotes = state[3].notes;
        
        let r_E = -1, r_A = -1, r_D = -1;
        for (let i = 0; i < 12; i++) {
            if (lowENotes[i] && lowENotes[i].note === rootNote) r_E = i;
            if (aNotes[i] && aNotes[i].note === rootNote) r_A = i;
            if (dNotes[i] && dNotes[i].note === rootNote) r_D = i;
        }

        let bounds = [];
        let R = 0;
        
        switch (shape) {
            case 'e':
                R = r_E;
                bounds = [[R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3]];
                break;
            case 'd':
                R = r_D;
                bounds = [[R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3]];
                break;
            case 'c':
                R = r_A;
                // String indices: 0(e), 1(B), 2(G), 3(D), 4(A), 5(E)
                // The B string needs R+1 for minor pentatonic, but G string should stop at R to avoid stretch.
                bounds = [[R-3, R], [R-3, R+1], [R-3, R], [R-3, R], [R-3, R], [R-3, R]];
                break;
            case 'a':
                R = r_A;
                bounds = [[R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3], [R-1, R+3]];
                break;
            case 'g':
                R = r_E;
                bounds = [[R-4, R], [R-4, R], [R-4, R], [R-4, R], [R-4, R], [R-4, R]];
                break;
        }

        return { type: 'per_string', strings: bounds };
    }

    calculateFretWindows(rootNote, position, typeSelection) {
        if (position === 'all') return null;
        
        const referenceRoot = MusicTheory.getParentMajorRoot(rootNote, typeSelection);
        
        if (position.startsWith('caged_')) {
            return this.calculateCAGEDWindows(referenceRoot, position.split('_')[1]);
        }
        
        // Find r1: first fret (0-11) of referenceRoot on the lowest string
        const lowestStringNotes = this.fretboard.getFretboardState()[this.fretboard.tuning.length - 1].notes;
        let r1 = -1;
        for (let i = 0; i < 12; i++) {
            if (lowestStringNotes[i] && lowestStringNotes[i].note === referenceRoot) {
                r1 = i;
                break;
            }
        }
        
        if (r1 === -1) return null;
        
        const posIndex = parseInt(position, 10);
        let startOffset = 0;
        let endOffset = 4; // width of 4 frets (span 5 frets)
        
        switch (posIndex) {
            case 1: startOffset = 5; endOffset = 9; break;   // C Shape equivalent
            case 2: startOffset = 7; endOffset = 11; break;  // A Shape equivalent
            case 3: startOffset = 9; endOffset = 13; break;  // G Shape equivalent
            case 4: startOffset = 0; endOffset = 4; break;   // E Shape equivalent
            case 5: startOffset = 2; endOffset = 6; break;   // D Shape equivalent
        }
        
        const baseMin = r1 + startOffset;
        const baseMax = r1 + endOffset;
        
        const windows = [];
        for (let octave = -1; octave <= 3; octave++) {
            windows.push({
                min: baseMin + (octave * 12),
                max: baseMax + (octave * 12)
            });
        }
        
        return windows;
    }

    updateHighlights() {
        const cagedGroup = document.getElementById('caged-optgroup');
        if (cagedGroup) {
            const isStandard6 = this.elements.stringCountSync.value === '6' && this.elements.tuningPresetSync.value === 'standard';
            if (!isStandard6) {
                cagedGroup.disabled = true;
                cagedGroup.style.display = 'none';
                if (this.elements.shapeSelectSync.value.startsWith('caged_')) {
                    this.elements.shapeSelectSync.value = 'all'; // Reset if invalid
                }
            } else {
                cagedGroup.disabled = false;
                cagedGroup.style.display = 'block';
            }
        }

        const rootNote = this.elements.rootNoteSync.value;
        const typeSelection = this.elements.typeSync.value;
        const showRoot = this.elements.showRootSync.checked;

        const selectedOption = this.elements.typeSync.options[this.elements.typeSync.selectedIndex];
        const isChord = selectedOption.parentElement.label === 'Chords';

        const activeNotes = MusicTheory.getNotesInSequence(rootNote, typeSelection, isChord);
        
        if (this.synth.isDronePlaying) {
            const freq = MusicTheory.getFrequency(rootNote, 2);
            this.synth.setDroneFrequency(freq);
        }

        const fretWindows = this.calculateFretWindows(rootNote, this.elements.shapeSelectSync.value, typeSelection);

        this.view.highlightNotes(activeNotes, rootNote, showRoot, this.elements.keyLabelsSync.value, fretWindows);
        this.pianoView.highlightNotes(activeNotes, rootNote, showRoot, this.elements.keyLabelsSync.value);
        this.saveState();
    }

    saveState() {
        const state = {
            rootNote: this.elements.rootNoteSync.value,
            type: this.elements.typeSync.value,
            shape: this.elements.shapeSelectSync.value,
            showGuitar: this.elements.toggleGuitarSync.checked,
            showPiano: this.elements.togglePianoSync.checked,
            showRoot: this.elements.showRootSync.checked,
            leftHanded: this.elements.leftHandedSync.checked,
            woodType: this.elements.woodTypeSync.value,
            stringCount: this.elements.stringCountSync.value,
            tuningPreset: this.elements.tuningPresetSync.value,
            tuning: this.fretboard.tuning,
            lightMode: document.documentElement.getAttribute('data-theme') === 'light',
            keyLabels: this.elements.keyLabelsSync.value,
            pianoTheme: this.elements.pianoThemeSync.value
        };
        localStorage.setItem('scaleFinderState', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('scaleFinderState');
        if (!saved) return false;
        
        try {
            const state = JSON.parse(saved);
            if (state.rootNote) this.elements.rootNoteSync.value = state.rootNote;
            if (state.type) this.elements.typeSync.value = state.type;
            if (state.shape) this.elements.shapeSelectSync.value = state.shape;
            if (state.showGuitar !== undefined) {
                this.elements.toggleGuitarSync.checked = state.showGuitar;
            } else if (state.instrument) {
                this.elements.toggleGuitarSync.checked = (state.instrument === 'both' || state.instrument === 'guitar');
                this.elements.togglePianoSync.checked = (state.instrument === 'both' || state.instrument === 'piano');
            }
            if (state.showPiano !== undefined) this.elements.togglePianoSync.checked = state.showPiano;
            
            if (state.showRoot !== undefined) this.elements.showRootSync.checked = state.showRoot;
            if (state.leftHanded !== undefined) this.elements.leftHandedSync.checked = state.leftHanded;
            if (state.woodType) this.elements.woodTypeSync.value = state.woodType;
            if (state.stringCount) this.elements.stringCountSync.value = state.stringCount;
            if (state.tuningPreset) this.elements.tuningPresetSync.value = state.tuningPreset;
            
            if (state.keyLabels) this.elements.keyLabelsSync.value = state.keyLabels;
            else if (state.pianoLabels) this.elements.keyLabelsSync.value = state.pianoLabels;
            if (state.pianoTheme) this.elements.pianoThemeSync.value = state.pianoTheme;
            
            // Reapply Light Mode DOM immediately
            if (state.lightMode) {
                document.documentElement.setAttribute('data-theme', 'light');
                const moonSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
                this.elements.lightModeSync.innerHTML = moonSVG;
            }
            
            return state;
        } catch(e) {
            console.error("Could not load state", e);
            return false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
