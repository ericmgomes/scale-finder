class Fretboard {
    constructor(tuningArr = null, frets = 30) {
        // Default standard 6-string tuning (1st to 6th string)
        this.tuning = tuningArr || [
            { note: 'E', octave: 4 },
            { note: 'B', octave: 3 },
            { note: 'G', octave: 3 },
            { note: 'D', octave: 3 },
            { note: 'A', octave: 2 },
            { note: 'E', octave: 2 }
        ];
        this.frets = frets;
    }

    setTuning(tuningArr) {
        if (!tuningArr || !Array.isArray(tuningArr)) return; // early return
        this.tuning = tuningArr;
    }

    getNotesForString(openNoteObj) {
        if (!openNoteObj || !openNoteObj.note) return []; // Early return

        const rootIndex = MusicTheory.notes.indexOf(openNoteObj.note);
        if (rootIndex === -1) return []; // Early return

        const stringNotes = [];
        for (let i = 0; i <= this.frets; i++) {
            const rawIndex = rootIndex + i;
            const noteName = MusicTheory.notes[rawIndex % 12];
            // Octave increments every time passing 'B' to 'C' (which aligns with rawIndex multiples of 12 since rootIndex is offset from C)
            const octave = openNoteObj.octave + Math.floor(rawIndex / 12);
            
            stringNotes.push({
                note: noteName,
                octave: octave,
                frequency: MusicTheory.getFrequency(noteName, octave),
                fretIndex: i
            });
        }
        return stringNotes;
    }

    getFretboardState() {
        return this.tuning.map(openNote => ({
            openNote,
            notes: this.getNotesForString(openNote)
        }));
    }
}
