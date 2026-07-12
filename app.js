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
        this.sheetMusicView = new SheetMusicView('sheet-music-container');
        this.circleFifthsView = new CircleOfFifthsView('circle-fifths-container');
        this.modalCircleFifthsView = new CircleOfFifthsView('modal-circle-container');
        this.harmonicFieldView = new HarmonicFieldView('harmonic-field-container');
        this.synth = new Synth();
        
        this.elements = {
            toggleGuitarSync: document.getElementById('toggle-guitar'),
            togglePianoSync: document.getElementById('toggle-piano'),
            toggleSheetMusicLocalSync: document.getElementById('toggle-sheet-music-local'),
            toggleCircleFifthsLocalSync: document.getElementById('toggle-circle-fifths-local'),
            fretContext: document.getElementById('fret-context-wrapper'),
            pianoContext: document.getElementById('piano-context-wrapper'),
            sheetMusicContext: document.getElementById('sheet-music-context-wrapper'),
            sheetMusicWrapper: document.getElementById('sheet-music-wrapper'),
            circleFifthsContext: document.getElementById('circle-fifths-context-wrapper'),
            circleFifthsWrapper: document.getElementById('circle-fifths-wrapper'),
            fretboardWrapper: document.getElementById('fretboard-wrapper'),
            pianoWrapper: document.getElementById('piano-wrapper'),
            pianoSettings: document.getElementById('piano-settings'),
            rootNoteSync: document.getElementById('root-note'),
            scaleSelectSync: document.getElementById('scale-select'),
            chordSelectSync: document.getElementById('chord-select'),
            inversionSelectSync: document.getElementById('inversion-select'),
            inversionGroupSync: document.getElementById('inversion-group'),
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
            pianoThemeSync: document.getElementById('piano-theme'),
            clefSelectSync: document.getElementById('clef-select'),
            // Modal elements
            circleModal: document.getElementById('circle-modal'),
            modalCloseBtn: document.getElementById('modal-close-btn'),
            keySelectBtn: document.getElementById('key-select-btn'),

            // Harmonic field elements
            harmonicChordSize: document.getElementById('harmonic-chord-size'),
            toggleHarmonicFieldLocal: document.getElementById('toggle-harmonic-field-local'),
            harmonicFieldWrapper: document.getElementById('harmonic-field-wrapper'),
            harmonicFieldContextWrapper: document.getElementById('harmonic-field-context-wrapper'),

            // LCC / Gravitational Mode elements
            theoryModeSwitch: document.getElementById('theory-mode-switch'),
            traditionalControls: document.getElementById('traditional-controls'),
            gravitationalControls: document.getElementById('gravitational-controls'),
            lydianTonic: document.getElementById('lydian-tonic'),
            lydianTonicBtn: document.getElementById('lydian-tonic-btn'),
            lydianDroneBtn: document.getElementById('lydian-drone-btn'),
            lydianParentSelect: document.getElementById('lydian-parent-select'),
            gravitationalModeContainer: document.getElementById('gravitational-mode-container'),
            gravityMapContainer: document.getElementById('gravity-map-container'),
            lydianDegreesDisplay: document.getElementById('lydian-degrees-display'),
            lydianFifthsDisplay: document.getElementById('lydian-fifths-display'),
            compTradDisplay: document.getElementById('comp-trad-display'),
            compGravDisplay: document.getElementById('comp-grav-display'),
            compTextExplanation: document.getElementById('comp-text-explanation')
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
        
        this.theoryMode = 'traditional';
        this.init();
    }

    init() {
        if (!this.elements.rootNoteSync || !this.elements.scaleSelectSync) return; // Early return

        this.view.setOnNoteClick((noteData) => {
            this.synth.playNote(noteData.frequency);
        });

        this.pianoView.setOnNoteClick((noteData) => {
            this.synth.playNote(noteData.frequency);
        });

        this.sheetMusicView.setOnNoteClick((noteName, octave) => {
            const freq = MusicTheory.getFrequency(noteName, octave);
            this.synth.playNote(freq);
        });

        // initial render of piano (3 octaves starting at C2)
        this.pianoView.render(2, 3);

        // Add interaction listeners for scale/notes
        this.elements.rootNoteSync.addEventListener('change', () => this.updateHighlights());
        
        this.elements.scaleSelectSync.addEventListener('change', (e) => {
            if (e.target.value !== 'none') {
                this.elements.chordSelectSync.value = 'none';
                this.elements.inversionSelectSync.value = '0';
                this.elements.inversionGroupSync.style.display = 'none';
            }
            this.updateHighlights();
        });

        this.elements.chordSelectSync.addEventListener('change', (e) => {
            if (e.target.value !== 'none') {
                this.elements.scaleSelectSync.value = 'none';
                this.elements.inversionGroupSync.style.display = 'flex';
            } else {
                this.elements.inversionGroupSync.style.display = 'none';
            }
            this.updateHighlights();
        });

        this.elements.inversionSelectSync.addEventListener('change', () => {
            this.updateHighlights();
        });

        this.elements.showRootSync.addEventListener('change', () => this.updateHighlights());

        this.elements.droneBtnSync.addEventListener('click', () => {
            const rootNote = this.elements.rootNoteSync.value;
            // Play in octave 2 for a nice low hum
            const freq = MusicTheory.getFrequency(rootNote, 2);
            
            this.synth.toggleDrone(freq);
            this.updateDroneUI();
        });

        this.elements.lydianDroneBtn.addEventListener('click', () => {
            const rootNote = this.elements.lydianTonic.value;
            const freq = MusicTheory.getFrequency(rootNote, 2);
            
            this.synth.toggleDrone(freq);
            this.updateDroneUI();
        });

        this.elements.lydianTonicBtn.addEventListener('click', () => {
            this.modalCircleFifthsView.render(this.elements.lydianTonic.value, 'Major (Ionian)');
            const modalTitle = document.querySelector('.modal-title');
            if (modalTitle) modalTitle.innerText = "Select Lydian Tonic";
            this.elements.circleModal.classList.add('active');
        });

        this.elements.theoryModeSwitch.addEventListener('change', (e) => {
            this.theoryMode = e.target.value;
            this.updateTheoryModeUI();
            this.saveState();
        });

        this.elements.lydianParentSelect.addEventListener('change', () => {
            this.updateHighlights();
        });

        this.elements.randomBtnSync.addEventListener('click', () => {
            const rootOptions = MusicTheory.notes;
            const randomRootIndex = Math.floor(Math.random() * rootOptions.length);
            this.elements.rootNoteSync.value = rootOptions[randomRootIndex];

            const isScale = Math.random() > 0.5;
            if (isScale) {
                const scaleOptions = this.elements.scaleSelectSync.options;
                const randomIndex = 1 + Math.floor(Math.random() * (scaleOptions.length - 1));
                this.elements.scaleSelectSync.selectedIndex = randomIndex;
                
                this.elements.chordSelectSync.value = 'none';
                this.elements.inversionSelectSync.value = '0';
                this.elements.inversionGroupSync.style.display = 'none';
                
                // Sync toggles
                this.elements.toggleScaleSelect.checked = true;
                this.elements.scaleSelectSync.style.display = 'block';
                this.elements.toggleChordSelect.checked = false;
                this.elements.chordSelectSync.style.display = 'none';
            } else {
                const chordOptions = this.elements.chordSelectSync.options;
                const randomIndex = 1 + Math.floor(Math.random() * (chordOptions.length - 1));
                this.elements.chordSelectSync.selectedIndex = randomIndex;
                
                this.elements.scaleSelectSync.value = 'none';
                this.elements.inversionSelectSync.value = '0';
                this.elements.inversionGroupSync.style.display = 'flex';
                
                // Sync toggles
                this.elements.toggleScaleSelect.checked = false;
                this.elements.scaleSelectSync.style.display = 'none';
                this.elements.toggleChordSelect.checked = true;
                this.elements.chordSelectSync.style.display = 'block';
            }

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

        this.elements.toggleSheetMusicLocalSync.addEventListener('change', (e) => {
            this.elements.sheetMusicWrapper.style.display = e.target.checked ? 'block' : 'none';
            this.updateHighlights();
            this.saveState();
        });

        const handleCircleFifthsClick = (key, scaleType) => {
            this.elements.rootNoteSync.value = key;
            this.elements.scaleSelectSync.value = scaleType;
            this.elements.chordSelectSync.value = 'none';
            this.elements.inversionGroupSync.style.display = 'none';

            this.updateHighlights();
        };

        const handleLydianTonicClick = (key) => {
            this.elements.lydianTonic.value = key;
            this.updateHighlights();
        };

        this.circleFifthsView.setOnKeyClick((key, scaleType) => {
            if (this.theoryMode === 'gravitational') {
                handleLydianTonicClick(key);
            } else {
                handleCircleFifthsClick(key, scaleType);
            }
        });

        this.modalCircleFifthsView.setOnKeyClick((key, scaleType) => {
            if (this.theoryMode === 'gravitational') {
                handleLydianTonicClick(key);
            } else {
                handleCircleFifthsClick(key, scaleType);
            }
            this.elements.circleModal.classList.remove('active'); // Close modal
        });

        // Key Selector Modal Events
        this.elements.keySelectBtn.addEventListener('click', () => {
            const scaleVal = this.elements.scaleSelectSync.value;
            const isMinor = scaleVal.includes('Minor') || scaleVal.includes('Locrian') || scaleVal.includes('Dorian') || scaleVal.includes('Phrygian');
            const scaleType = isMinor ? 'Minor (Aeolian)' : 'Major (Ionian)';
            this.modalCircleFifthsView.render(this.elements.rootNoteSync.value, scaleType);
            const modalTitle = document.querySelector('.modal-title');
            if (modalTitle) modalTitle.innerText = "Select Key (Tonalidade)";
            this.elements.circleModal.classList.add('active');
        });

        this.elements.modalCloseBtn.addEventListener('click', () => {
            this.elements.circleModal.classList.remove('active');
        });

        this.elements.circleModal.addEventListener('click', (e) => {
            if (e.target === this.elements.circleModal) {
                this.elements.circleModal.classList.remove('active');
            }
        });

        // Harmonic Field handlers
        this.elements.harmonicChordSize.addEventListener('change', () => {
            this.updateHighlights();
        });

        const syncHarmonicFieldToggles = (checked) => {
            this.elements.toggleHarmonicFieldLocal.checked = checked;
            this.elements.harmonicFieldWrapper.style.display = checked ? 'block' : 'none';
            this.updateHighlights();
            this.saveState();
        };

        this.elements.toggleHarmonicFieldLocal.addEventListener('change', (e) => {
            syncHarmonicFieldToggles(e.target.checked);
        });

        this.harmonicFieldView.setOnPlayChord((notes) => {
            notes.forEach((note, idx) => {
                setTimeout(() => {
                    const freq = MusicTheory.getFrequency(note, 3);
                    this.synth.playNote(freq);
                }, idx * 150);
            });
        });

        this.harmonicFieldView.setOnSelectChord((rootNote, chordType) => {
            this.elements.rootNoteSync.value = rootNote;
            this.elements.chordSelectSync.value = chordType;
            this.elements.scaleSelectSync.value = 'none';
            this.elements.inversionGroupSync.style.display = 'flex';
            this.elements.inversionSelectSync.value = '0';

            this.updateHighlights();
        });

        this.elements.toggleCircleFifthsLocalSync.addEventListener('change', (e) => {
            this.elements.circleFifthsWrapper.style.display = e.target.checked ? 'flex' : 'none';
            this.updateHighlights();
            this.saveState();
        });

        this.elements.clefSelectSync.addEventListener('change', () => {
            this.updateHighlights();
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
            this.fretboard.setTuning(savedState.tuning);
            this.elements.stringCountSync.value = savedState.stringCount;
            this.renderFretboard();
        } else {
            const defaultInst = this.elements.stringCountSync.value;
            this.handleStringCountChange(defaultInst === 'ukulele' ? 'ukulele' : (parseInt(defaultInst) || 6)); 
        }

        // Instrument toggles init
        this.elements.fretboardWrapper.style.display = this.elements.toggleGuitarSync.checked ? 'flex' : 'none';
        this.elements.pianoWrapper.style.display = this.elements.togglePianoSync.checked ? 'block' : 'none';
        this.elements.sheetMusicContext.style.display = 'block';
        this.elements.sheetMusicWrapper.style.display = this.elements.toggleSheetMusicSync.checked ? 'block' : 'none';
        this.elements.toggleSheetMusicLocalSync.checked = this.elements.toggleSheetMusicSync.checked;

        this.elements.circleFifthsContext.style.display = 'block';
        this.elements.circleFifthsWrapper.style.display = this.elements.toggleCircleFifthsSync.checked ? 'flex' : 'none';
        this.elements.toggleCircleFifthsLocalSync.checked = this.elements.toggleCircleFifthsSync.checked;

        // Harmonic field init
        this.elements.harmonicFieldContextWrapper.style.display = 'block';
        this.elements.harmonicFieldWrapper.style.display = this.elements.toggleHarmonicFieldLocal.checked ? 'block' : 'none';
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

        const showRoot = this.elements.showRootSync.checked;

        if (this.theoryMode === 'gravitational') {
            const lydianTonic = this.elements.lydianTonic.value;
            const activeNotes = MusicTheory.getLydianScale(lydianTonic);

            if (this.synth.isDronePlaying) {
                const freq = MusicTheory.getFrequency(lydianTonic, 2);
                this.synth.setDroneFrequency(freq);
            }

            this.view.highlightNotes(activeNotes, null, showRoot, this.elements.keyLabelsSync.value, null, false, 0, this.theoryMode, lydianTonic);
            this.pianoView.highlightNotes(activeNotes, null, showRoot, this.elements.keyLabelsSync.value, false, 0, this.theoryMode, lydianTonic);

            if (this.elements.toggleSheetMusicLocalSync.checked) {
                this.elements.sheetMusicContext.style.display = 'block';
                this.elements.sheetMusicWrapper.style.display = 'block';
                
                let clef = this.elements.clefSelectSync.value;
                if (clef === 'auto') {
                    const pianoActive = this.elements.togglePianoSync.checked;
                    const stringCountStr = this.elements.stringCountSync.value;
                    const isBass = stringCountStr === '4' || stringCountStr === '5';
                    if (pianoActive) {
                        clef = 'grand';
                    } else if (isBass) {
                        clef = 'bass';
                    } else {
                        clef = 'treble';
                    }
                }
                const parentMajorRoot = MusicTheory.getParentMajorRoot(lydianTonic, 'Lydian');
                this.sheetMusicView.render(activeNotes, clef, parentMajorRoot, lydianTonic, false, 0, showRoot);
            } else {
                this.elements.sheetMusicContext.style.display = 'none';
                this.elements.sheetMusicWrapper.style.display = 'none';
            }

            // Hide traditional modes
            this.elements.circleFifthsContext.style.display = 'none';
            this.elements.circleFifthsWrapper.style.display = 'none';
            this.elements.harmonicFieldContextWrapper.style.display = 'none';
            this.elements.harmonicFieldWrapper.style.display = 'none';

            this.elements.lydianTonicBtn.innerText = '🔑 Lydian Tonic: ' + lydianTonic;

            this.renderLCCPanels(lydianTonic);
        } else {
            const rootNote = this.elements.rootNoteSync.value;

            let typeSelection = 'none';
            let isChord = false;
            
            if (this.elements.scaleSelectSync.value !== 'none') {
                typeSelection = this.elements.scaleSelectSync.value;
                isChord = false;
            } else if (this.elements.chordSelectSync.value !== 'none') {
                typeSelection = this.elements.chordSelectSync.value;
                isChord = true;
            }

            const inversion = isChord ? parseInt(this.elements.inversionSelectSync.value, 10) : 0;
            const activeNotes = MusicTheory.getNotesInSequence(rootNote, typeSelection, isChord, inversion);
            
            if (this.synth.isDronePlaying) {
                const freq = MusicTheory.getFrequency(rootNote, 2);
                this.synth.setDroneFrequency(freq);
            }

            const fretWindows = this.calculateFretWindows(rootNote, this.elements.shapeSelectSync.value, typeSelection);

            this.view.highlightNotes(activeNotes, rootNote, showRoot, this.elements.keyLabelsSync.value, fretWindows, isChord, inversion, this.theoryMode);
            this.pianoView.highlightNotes(activeNotes, rootNote, showRoot, this.elements.keyLabelsSync.value, isChord, inversion, this.theoryMode);

            const showMusicSections = typeSelection !== 'none';

            if (showMusicSections && this.elements.toggleSheetMusicLocalSync.checked) {
                this.elements.sheetMusicContext.style.display = 'block';
                this.elements.sheetMusicWrapper.style.display = 'block';
                
                let clef = this.elements.clefSelectSync.value;
                if (clef === 'auto') {
                    const pianoActive = this.elements.togglePianoSync.checked;
                    const stringCountStr = this.elements.stringCountSync.value;
                    const isBass = stringCountStr === '4' || stringCountStr === '5';
                    if (pianoActive) {
                        clef = 'grand';
                    } else if (isBass) {
                        clef = 'bass';
                    } else {
                        clef = 'treble';
                    }
                }
                const parentMajorRoot = MusicTheory.getParentMajorRoot(rootNote, typeSelection);
                this.sheetMusicView.render(activeNotes, clef, parentMajorRoot, rootNote, isChord, inversion, showRoot);
            } else {
                this.elements.sheetMusicContext.style.display = 'none';
                this.elements.sheetMusicWrapper.style.display = 'none';
            }

            if (this.elements.toggleCircleFifthsLocalSync.checked) {
                this.elements.circleFifthsContext.style.display = 'block';
                this.elements.circleFifthsWrapper.style.display = 'flex';
                const scaleVal = this.elements.scaleSelectSync.value;
                const isMinor = scaleVal.includes('Minor') || scaleVal.includes('Locrian') || scaleVal.includes('Dorian') || scaleVal.includes('Phrygian');
                const scaleType = isMinor ? 'Minor (Aeolian)' : 'Major (Ionian)';
                this.circleFifthsView.render(rootNote, scaleType);
            } else {
                this.elements.circleFifthsContext.style.display = 'none';
                this.elements.circleFifthsWrapper.style.display = 'none';
            }

            // Render Harmonic Field (Only active if a scale is selected, not a chord)
            if (showMusicSections && !isChord && this.elements.toggleHarmonicFieldLocal.checked) {
                this.elements.harmonicFieldContextWrapper.style.display = 'block';
                this.elements.harmonicFieldWrapper.style.display = 'block';
                this.harmonicFieldView.render(rootNote, typeSelection, this.elements.harmonicChordSize.value);
            } else {
                this.elements.harmonicFieldContextWrapper.style.display = 'none';
                this.elements.harmonicFieldWrapper.style.display = 'none';
            }

            // Update Key select button label
            let keyText = `Key: ${rootNote}`;
            if (typeSelection !== 'none') {
                if (isChord) {
                    keyText = `Key: ${rootNote} ${typeSelection}`;
                } else {
                    keyText = `Key: ${rootNote} ${typeSelection.split(' ')[0]}`;
                }
            }
            this.elements.keySelectBtn.innerText = '🔑 ' + keyText;
        }

        this.saveState();
    }

    updateTheoryModeUI() {
        if (this.theoryMode === 'gravitational') {
            this.elements.traditionalControls.style.display = 'none';
            this.elements.gravitationalControls.style.display = 'flex';
            this.elements.gravitationalModeContainer.style.display = 'block';
            
            // Hide traditional modules that are irrelevant
            this.elements.circleFifthsContext.style.display = 'none';
            this.elements.harmonicFieldContextWrapper.style.display = 'none';
            
            // Sync radio button visually
            const rad = document.getElementById('theory-mode-gravitational');
            if (rad) rad.checked = true;
        } else {
            this.elements.traditionalControls.style.display = 'flex';
            this.elements.gravitationalControls.style.display = 'none';
            this.elements.gravitationalModeContainer.style.display = 'none';
            
            // Restore visibility of traditional modules depending on context
            const rad = document.getElementById('theory-mode-traditional');
            if (rad) rad.checked = true;
        }
        this.updateHighlights();
    }

    updateDroneUI() {
        if (this.synth.isDronePlaying) {
            this.elements.droneBtnSync.classList.add('active');
            this.elements.droneBtnSync.innerText = '⏹️';
            this.elements.lydianDroneBtn.classList.add('active');
            this.elements.lydianDroneBtn.innerText = '⏹️';
        } else {
            this.elements.droneBtnSync.classList.remove('active');
            this.elements.droneBtnSync.innerText = '▶️';
            this.elements.lydianDroneBtn.classList.remove('active');
            this.elements.lydianDroneBtn.innerText = '▶️';
        }
    }

    renderLCCPanels(lydianTonic) {
        const fifths = MusicTheory.getFifthsOrder(lydianTonic);
        const lydianScale = MusicTheory.getLydianScale(lydianTonic);

        // 1. Render Gravity Map
        this.elements.gravityMapContainer.innerHTML = '';
        fifths.forEach((note, index) => {
            const dist = index;
            let tensionLabel = "Ingoing";
            let tensionBg = "#10b981";
            let textColor = "#fff";
            
            if (dist === 0) {
                tensionLabel = "Tonic";
                tensionBg = "#10b981";
            } else if (dist <= 6) {
                tensionLabel = "Ingoing";
                tensionBg = "#6366f1";
            } else if (dist <= 8) {
                tensionLabel = "Semi-Ingoing";
                tensionBg = "#f59e0b";
            } else if (dist <= 10) {
                tensionLabel = "Semi-Outgoing";
                tensionBg = "#d97706";
            } else {
                tensionLabel = "Outgoing";
                tensionBg = "#ef4444";
            }

            const node = document.createElement('div');
            node.className = 'gravity-node';
            node.innerHTML = `
                <div class="node-note">${note}</div>
                <div class="node-dist">Order: ${dist}</div>
                <div class="node-tension" style="background: ${tensionBg}; color: ${textColor};">${tensionLabel}</div>
            `;
            this.elements.gravityMapContainer.appendChild(node);
        });

        // 2. Render Lydian Scale Panel Degrees
        this.elements.lydianDegreesDisplay.innerHTML = '';
        lydianScale.forEach((note) => {
            const interval = MusicTheory.getIntervalName(lydianTonic, note);
            let degreeName = 'I';
            if (interval === 'R') degreeName = 'I';
            else if (interval === '2' || interval === 'b2') degreeName = 'II';
            else if (interval === '3M' || interval === 'm3') degreeName = 'III';
            else if (interval === 'b5' || interval === 'P4') degreeName = '+IV';
            else if (interval === 'P5') degreeName = 'V';
            else if (interval === '6M' || interval === 'm6') degreeName = 'VI';
            else if (interval === '7M' || interval === 'm7') degreeName = 'VII';
            
            const badge = document.createElement('div');
            badge.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--glass-border); min-width: 60px;";
            badge.innerHTML = `
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${degreeName}</span>
                <span style="color: ${degreeName === '+IV' ? 'var(--accent)' : 'var(--text-main)'}; font-size: 1.1rem; margin-top: 0.2rem;">${note}</span>
            `;
            this.elements.lydianDegreesDisplay.appendChild(badge);
        });

        // 3. Render Gravity Stack (Fifths)
        this.elements.lydianFifthsDisplay.innerHTML = '';
        const lccFifths = fifths.slice(0, 7);
        lccFifths.forEach((note, idx) => {
            const badge = document.createElement('div');
            badge.style.cssText = "display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--glass-border); min-width: 60px;";
            badge.innerHTML = `
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">#${idx + 1}</span>
                <span style="color: var(--text-main); font-size: 1.1rem; margin-top: 0.2rem;">${note}</span>
            `;
            this.elements.lydianFifthsDisplay.appendChild(badge);
        });

        // 4. Render Dynamic Traditional vs Gravitational Comparison
        const tradNotes = MusicTheory.getNotesInSequence(lydianTonic, 'Major (Ionian)', false);
        const fourthNoteTrad = tradNotes[3] || 'F';
        const fourthNoteLcc = lydianScale[3] || 'F#';
        
        // Build traditional string
        const tradHtml = tradNotes.map((n, idx) => {
            if (idx === 3) return `<span style="color: #ef4444; font-weight: bold;">${n}</span>`;
            return n;
        }).join(' - ');
        this.elements.compTradDisplay.innerHTML = tradHtml;
        this.elements.compTradDisplay.previousElementSibling.innerText = `${lydianTonic} Major (Traditional):`;

        // Build gravitational string
        const lccHtml = lydianScale.map((n, idx) => {
            if (idx === 3) return `<span style="color: var(--accent); font-weight: bold;">${n}</span>`;
            return n;
        }).join(' - ');
        this.elements.compGravDisplay.innerHTML = lccHtml;
        this.elements.compGravDisplay.previousElementSibling.innerText = `${lydianTonic} Lydian (Gravitational):`;

        // Update explanation text
        this.elements.compTextExplanation.innerHTML = `
            In traditional theory, the 4th degree (<strong>${fourthNoteTrad}</strong>) is a crucial scale tone, but it introduces a major-third resolving pull down to the 3rd. Under a gravitational/LCC reading, the <strong>${fourthNoteLcc}</strong> (sharp 4th) preserves the symmetry of perfect fifths, establishing ${lydianTonic} Lydian as the true stable acoustic center.
        `;
    }

    saveState() {
        const state = {
            rootNote: this.elements.rootNoteSync.value,
            scale: this.elements.scaleSelectSync.value,
            chord: this.elements.chordSelectSync.value,
            inversion: this.elements.inversionSelectSync.value,
            shape: this.elements.shapeSelectSync.value,
            showGuitar: this.elements.toggleGuitarSync.checked,
            showPiano: this.elements.togglePianoSync.checked,
            showSheetMusic: this.elements.toggleSheetMusicLocalSync.checked,
            showCircleFifths: this.elements.toggleCircleFifthsLocalSync.checked,
            clef: this.elements.clefSelectSync.value,
            showRoot: this.elements.showRootSync.checked,
            leftHanded: this.elements.leftHandedSync.checked,
            woodType: this.elements.woodTypeSync.value,
            stringCount: this.elements.stringCountSync.value,
            tuningPreset: this.elements.tuningPresetSync.value,
            tuning: this.fretboard.tuning,
            lightMode: document.documentElement.getAttribute('data-theme') === 'light',
            keyLabels: this.elements.keyLabelsSync.value,
            pianoTheme: this.elements.pianoThemeSync.value,
            showHarmonicField: this.elements.toggleHarmonicFieldLocal.checked,
            theoryMode: this.theoryMode,
            lydianTonic: this.elements.lydianTonic.value
        };
        localStorage.setItem('scaleFinderState', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('scaleFinderState');
        if (!saved) return false;
        
        try {
            const state = JSON.parse(saved);
            
            if (state.theoryMode) {
                this.theoryMode = state.theoryMode;
            }
            if (state.lydianTonic) {
                this.elements.lydianTonic.value = state.lydianTonic;
            }

            if (state.rootNote) this.elements.rootNoteSync.value = state.rootNote;
            if (state.type) {
                if (MusicTheory.scales[state.type]) {
                    this.elements.scaleSelectSync.value = state.type;
                    this.elements.chordSelectSync.value = 'none';
                    this.elements.inversionGroupSync.style.display = 'none';
                } else {
                    this.elements.chordSelectSync.value = state.type;
                    this.elements.scaleSelectSync.value = 'none';
                    this.elements.inversionGroupSync.style.display = 'flex';
                }
            } else {
                if (state.scale) this.elements.scaleSelectSync.value = state.scale;
                if (state.chord) this.elements.chordSelectSync.value = state.chord;
                if (state.inversion) this.elements.inversionSelectSync.value = state.inversion;
                if (this.elements.chordSelectSync.value !== 'none') {
                    this.elements.inversionGroupSync.style.display = 'flex';
                } else {
                    this.elements.inversionGroupSync.style.display = 'none';
                }
            }
            if (state.shape) this.elements.shapeSelectSync.value = state.shape;
            if (state.showGuitar !== undefined) {
                this.elements.toggleGuitarSync.checked = state.showGuitar;
            } else if (state.instrument) {
                this.elements.toggleGuitarSync.checked = (state.instrument === 'both' || state.instrument === 'guitar');
                this.elements.togglePianoSync.checked = (state.instrument === 'both' || state.instrument === 'piano');
            }
            if (state.showPiano !== undefined) this.elements.togglePianoSync.checked = state.showPiano;
            if (state.showSheetMusic !== undefined) this.elements.toggleSheetMusicLocalSync.checked = state.showSheetMusic;
            if (state.showCircleFifths !== undefined) this.elements.toggleCircleFifthsLocalSync.checked = state.showCircleFifths;
            if (state.clef) this.elements.clefSelectSync.value = state.clef;
            if (state.showHarmonicField !== undefined) this.elements.toggleHarmonicFieldLocal.checked = state.showHarmonicField;
            
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
            
            // Trigger UI and highlights update after all settings are loaded
            this.updateTheoryModeUI();

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
