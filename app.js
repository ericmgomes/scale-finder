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
            viewModeRadios: document.querySelectorAll('input[name="view-mode"]'),
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
            this.saveState();
        });

        this.elements.viewModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateInstrumentView(e.target.value);
                this.saveState();
            });
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

        this.updateInstrumentView(document.querySelector('input[name="view-mode"]:checked').value);
    }

    updateInstrumentView(val) {
        if (!this.elements.fretContext || !this.elements.pianoContext) return;
        this.elements.fretContext.style.display = (val === 'both' || val === 'guitar') ? 'block' : 'none';
        this.elements.pianoContext.style.display = (val === 'both' || val === 'piano') ? 'block' : 'none';
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

    updateHighlights() {
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

        this.view.highlightNotes(activeNotes, rootNote, showRoot, this.elements.keyLabelsSync.value);
        this.pianoView.highlightNotes(activeNotes, rootNote, showRoot, this.elements.keyLabelsSync.value);
        this.saveState();
    }

    saveState() {
        const state = {
            rootNote: this.elements.rootNoteSync.value,
            type: this.elements.typeSync.value,
            instrument: document.querySelector('input[name="view-mode"]:checked').value,
            showRoot: this.elements.showRootSync.checked,
            leftHanded: this.elements.leftHandedSync.checked,
            woodType: this.elements.woodTypeSync.value,
            stringCount: this.elements.stringCountSync.value,
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
            if (state.instrument) {
                const radio = document.querySelector(`input[name="view-mode"][value="${state.instrument}"]`);
                if (radio) radio.checked = true;
            }
            if (state.showRoot !== undefined) this.elements.showRootSync.checked = state.showRoot;
            if (state.leftHanded !== undefined) this.elements.leftHandedSync.checked = state.leftHanded;
            if (state.woodType) this.elements.woodTypeSync.value = state.woodType;
            if (state.stringCount) this.elements.stringCountSync.value = state.stringCount;
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
