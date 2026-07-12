class MusicTheory {
    static get notes() {
        return ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    }

    static get scales() {
        return {
            'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
            'Dorian': [0, 2, 3, 5, 7, 9, 10],
            'Phrygian': [0, 1, 3, 5, 7, 8, 10],
            'Lydian': [0, 2, 4, 6, 7, 9, 11],
            'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
            'Locrian': [0, 1, 3, 5, 6, 8, 10],
            'Minor Pentatonic': [0, 3, 5, 7, 10],
            'Major Pentatonic': [0, 2, 4, 7, 9],
            'Blues': [0, 3, 5, 6, 7, 10],
            'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
            'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
            'Whole Tone': [0, 2, 4, 6, 8, 10]
        };
    }

    static get parentMajorOffsets() {
        return {
            'Major (Ionian)': 0,
            'Dorian': -2,
            'Phrygian': -4,
            'Lydian': -5,
            'Mixolydian': -7,
            'Minor (Aeolian)': -9,
            'Locrian': -11,
            'Minor Pentatonic': -9,  // Use Aeolian parent
            'Major Pentatonic': 0,   // Use Ionian parent
            'Blues': -9,             // Use Aeolian parent
            'Melodic Minor': 0,      // Fallback
            'Harmonic Minor': -9,    // Use Aeolian parent
            'Whole Tone': 0          // Fallback
        };
    }

    static getParentMajorRoot(rootNote, type) {
        if (!rootNote || !type) return rootNote;
        const offset = this.parentMajorOffsets[type];
        if (offset === undefined) return rootNote; // If chord or unsupported
        
        const rootIndex = this.notes.indexOf(rootNote);
        if (rootIndex === -1) return rootNote;
        
        let parentIndex = (rootIndex + offset) % 12;
        if (parentIndex < 0) parentIndex += 12;
        
        return this.notes[parentIndex];
    }

    static get chords() {
        return {
            'Major': [0, 4, 7],
            'Minor': [0, 3, 7],
            'Diminished': [0, 3, 6],
            'Augmented': [0, 4, 8],
            'sus2': [0, 2, 7],
            'sus4': [0, 5, 7],
            'Maj7': [0, 4, 7, 11],
            'Min7': [0, 3, 7, 10],
            'Dom7': [0, 4, 7, 10],
            'm7b5': [0, 3, 6, 10],
            'dim7': [0, 3, 6, 9],
            'mMaj7': [0, 3, 7, 11],
            'Maj7#5': [0, 4, 8, 11],
            '9': [0, 4, 7, 10, 14],
            'Maj9': [0, 4, 7, 11, 14],
            'Min9': [0, 3, 7, 10, 14],
            '11': [0, 4, 7, 10, 14, 17],
            'Min11': [0, 3, 7, 10, 14, 17],
            '13': [0, 4, 7, 10, 14, 21],
            'Maj13': [0, 4, 7, 11, 14, 21],
            'Min13': [0, 3, 7, 10, 14, 21],
            'add9': [0, 4, 7, 14],
            'madd9': [0, 3, 7, 14],
            '6': [0, 4, 7, 9],
            'm6': [0, 3, 7, 9],
            '6/9': [0, 4, 7, 9, 14]
        };
    }

    static getNotesInSequence(rootNote, type, isChord = false, inversion = 0) {
        if (!rootNote || !type) return [];
        
        const rootIndex = this.notes.indexOf(rootNote);
        if (rootIndex === -1) return [];

        const intervals = isChord ? this.chords[type] : this.scales[type];
        if (!intervals) return [];

        const notes = intervals.map(interval => this.notes[(rootIndex + interval) % 12]);
        
        if (isChord && inversion > 0 && inversion < notes.length) {
            return notes.slice(inversion).concat(notes.slice(0, inversion));
        }
        return notes;
    }

    static getFrequency(note, octave) {
        const rootIndex = this.notes.indexOf(note);
        if (rootIndex === -1) return 0;
        
        // A4 is 440 Hz. A4 is octave=4, note='A' (index=9). MIDI num = 69.
        // General MIDI calculation: MidiNumber = 12 * (octave + 1) + rootIndex;
        // Wait, C0 MIDI number is 12.
        const midiNumber = 12 + (octave * 12) + rootIndex;
        return 440 * Math.pow(2, (midiNumber - 69) / 12);
    }

    static get intervalNames() {
        return ['R', 'b2', '2', 'm3', '3M', 'P4', 'b5', 'P5', 'm6', '6M', 'm7', '7M'];
    }

    static getIntervalName(rootNote, targetNote) {
        const rootIndex = this.notes.indexOf(rootNote);
        const targetIndex = this.notes.indexOf(targetNote);
        if (rootIndex === -1 || targetIndex === -1) return '';
        
        let diff = targetIndex - rootIndex;
        if (diff < 0) diff += 12;
        
        return this.intervalNames[diff];
    }

    static getFifthsOrder(tonic) {
        const notes = this.notes;
        const tonicIndex = notes.indexOf(tonic);
        if (tonicIndex === -1) return [];
        
        const fifths = [];
        for (let k = 0; k < 12; k++) {
            fifths.push(notes[(tonicIndex + k * 7) % 12]);
        }
        return fifths;
    }

    static getLydianScale(tonic) {
        const fifths = this.getFifthsOrder(tonic);
        const scaleNotes = fifths.slice(0, 7);
        const notes = this.notes;
        const tonicIndex = notes.indexOf(tonic);
        return scaleNotes.sort((a, b) => {
            let diffA = notes.indexOf(a) - tonicIndex;
            if (diffA < 0) diffA += 12;
            let diffB = notes.indexOf(b) - tonicIndex;
            if (diffB < 0) diffB += 12;
            return diffA - diffB;
        });
    }

    static getGravityDistance(note, tonic) {
        const fifths = this.getFifthsOrder(tonic);
        return fifths.indexOf(note);
    }
}
