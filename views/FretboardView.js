class FretboardView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onNoteClickCallback = null;
    }

    setOnNoteClick(callback) {
        this.onNoteClickCallback = callback;
    }

    render(fretboardState, numFrets) {
        if (!this.container) return; // Early return

        this.container.innerHTML = '';
        
        // Calculate realistic fret widths (flex values mapping to ratio of string)
        const totalWidthScale = 1 - (1 / Math.pow(2, numFrets / 12));
        const fretWidths = [];
        for (let i = 1; i <= numFrets; i++) {
            const d_prev = 1 / Math.pow(2, (i - 1) / 12);
            const d_curr = 1 / Math.pow(2, i / 12);
            fretWidths.push((d_prev - d_curr) / totalWidthScale);
        }
        
        // Render strings
        fretboardState.forEach((stringObj, stringIndex) => {
            const stringDiv = document.createElement('div');
            stringDiv.className = 'string';

            // Inject tuning cell
            const tuningCell = document.createElement('div');
            tuningCell.className = 'tuning-cell';
            stringDiv.appendChild(tuningCell);
            
            stringObj.notes.forEach((noteData, fretIndex) => {
                const fretDiv = document.createElement('div');
                fretDiv.className = `fret ${fretIndex === 0 ? 'open-string' : ''}`;
                
                if (fretIndex > 0) {
                    // Set variable width
                    fretDiv.style.flex = fretWidths[fretIndex - 1];
                }

                // Add inlays (dots) logic, mapping generically across all strings for center spacing
                // On 4-strings vs 8-strings, we typically place them towards the middle.
                const centerStringBase = Math.floor(fretboardState.length / 2);
                const isCenter = stringIndex === centerStringBase || (fretboardState.length % 2 === 0 && stringIndex === centerStringBase - 1);
                
                // Single inlays at 3, 5, 7, 9, 15, 17, 19, 21, 27, 29
                if (isCenter && [3, 5, 7, 9, 15, 17, 19, 21, 27, 29].includes(fretIndex)) {
                    fretDiv.innerHTML += '<div class="inlay single-inlay"></div>';
                }
                
                // Double inlays at 12, 24
                if ([12, 24].includes(fretIndex)) {
                    if (stringIndex === Math.floor(fretboardState.length / 4)) fretDiv.innerHTML += '<div class="inlay double-inlay-top"></div>';
                    if (stringIndex === Math.floor(fretboardState.length * 3 / 4)) fretDiv.innerHTML += '<div class="inlay double-inlay-bottom"></div>';
                }

                // Add note dot (initially hidden by CSS)
                const dot = document.createElement('div');
                dot.className = 'note-dot';
                dot.dataset.note = noteData.note;
                dot.dataset.fret = fretIndex;
                dot.dataset.string = stringIndex;
                
                // Left-handed css flip fix on texts
                const dotSpan = document.createElement('span');
                dotSpan.innerText = noteData.note;
                dot.appendChild(dotSpan);
                
                dot.onclick = () => {
                    if(this.onNoteClickCallback) this.onNoteClickCallback(noteData);
                };

                fretDiv.appendChild(dot);
                stringDiv.appendChild(fretDiv);
            });
            
            this.container.appendChild(stringDiv);
        });

        // Render fret numbers below strings
        const numbersDiv = document.createElement('div');
        numbersDiv.className = 'fret-numbers';
        
        // Spacer for tuning cell
        const tuningSpacer = document.createElement('div');
        tuningSpacer.className = 'tuning-cell-spacer';
        numbersDiv.appendChild(tuningSpacer);
        for (let i = 0; i <= numFrets; i++) {
            const numDiv = document.createElement('div');
            numDiv.className = `fret-number ${i === 0 ? 'open-string-num' : ''}`;
            
            if (i > 0) {
                numDiv.style.flex = fretWidths[i - 1];
            }
            
            const numSpan = document.createElement('span');
            numSpan.innerText = i === 0 ? '0' : i;
            numDiv.appendChild(numSpan);
            
            numbersDiv.appendChild(numDiv);
        }
        this.container.appendChild(numbersDiv);
    }

    highlightNotes(activeNotes, rootNote, showRootHighlight, labelMode = 'notes', fretWindows = null, isChord = false, inversion = 0) {
        if (!this.container || !activeNotes || activeNotes.length === 0) return; // Early return

        const dots = this.container.querySelectorAll('.note-dot');
        
        dots.forEach(dot => {
            const note = dot.dataset.note;
            const fret = parseInt(dot.dataset.fret, 10);
            const stringIdx = parseInt(dot.dataset.string, 10);
            const span = dot.querySelector('span');
            
            // Labels Logic
            if (labelMode === 'none') {
                span.innerText = '';
            } else if (labelMode === 'intervals') {
                span.innerText = MusicTheory.getIntervalName(rootNote, note);
            } else {
                span.innerText = note;
            }

            dot.classList.remove('visible', 'root', 'bass', 'faded');
            
            if (activeNotes.includes(note)) {
                dot.classList.add('visible');
                if (showRootHighlight && note === rootNote) {
                    dot.classList.add('root');
                } else if (isChord && inversion > 0 && note === activeNotes[0]) {
                    dot.classList.add('bass');
                }
                
                // Position filtering logic
                if (fretWindows !== null) {
                    if (Array.isArray(fretWindows)) {
                        // Generic Windows logic
                        const inWindow = fretWindows.some(w => fret >= w.min && fret <= w.max);
                        if (!inWindow) {
                            dot.classList.add('faded');
                        }
                    } else if (fretWindows.type === 'per_string') {
                        // Strict CAGED per-string logic
                        // Find the corresponding octave window
                        const baseBounds = fretWindows.strings[stringIdx];
                        if (baseBounds) {
                            // baseBounds is [min, max]
                            // The shape repeats every 12 frets
                            let inWindow = false;
                            for (let octave = -1; octave <= 3; octave++) {
                                const minFret = baseBounds[0] + (octave * 12);
                                const maxFret = baseBounds[1] + (octave * 12);
                                if (fret >= minFret && fret <= maxFret) {
                                    inWindow = true;
                                    break;
                                }
                            }
                            if (!inWindow) {
                                dot.classList.add('faded');
                            }
                        } else {
                            dot.classList.add('faded'); // String not covered
                        }
                    }
                }
            }
        });
    }

    setHandedness(isLeftHanded) {
        if(!this.container) return; // early return
        if (isLeftHanded) {
            this.container.classList.add('left-handed');
        } else {
            this.container.classList.remove('left-handed');
        }
    }

    setWood(woodType) {
        if(!this.container) return; // early return
        this.container.classList.remove('wood-rosewood', 'wood-maple', 'wood-ebony');
        this.container.classList.add(`wood-${woodType}`);
    }
}
