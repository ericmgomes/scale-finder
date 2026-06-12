class CircleOfFifthsView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onKeyClickCallback = null;
        
        // Clockwise in fifths starting at 12 o'clock (C)
        this.majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
        // Clockwise starting at 12 o'clock (Am)
        this.minorKeys = ['A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];
    }

    setOnKeyClick(callback) {
        this.onKeyClickCallback = callback;
    }

    // Helper to calculate SVG wedge path
    getWedgePath(cx, cy, rInner, rOuter, startAngleDeg, endAngleDeg) {
        const startRad = (startAngleDeg * Math.PI) / 180;
        const endRad = (endAngleDeg * Math.PI) / 180;

        const x1_in = cx + rInner * Math.cos(startRad);
        const y1_in = cy + rInner * Math.sin(startRad);
        const x2_in = cx + rInner * Math.cos(endRad);
        const y2_in = cy + rInner * Math.sin(endRad);

        const x1_out = cx + rOuter * Math.cos(startRad);
        const y1_out = cy + rOuter * Math.sin(startRad);
        const x2_out = cx + rOuter * Math.cos(endRad);
        const y2_out = cy + rOuter * Math.sin(endRad);

        const largeArcFlag = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;

        return `
            M ${x1_in} ${y1_in}
            L ${x1_out} ${y1_out}
            A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out}
            L ${x2_in} ${y2_in}
            A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x1_in} ${y1_in}
            Z
        `;
    }

    render(currentRoot, currentScaleType) {
        if (!this.container) return;

        const cx = 250;
        const cy = 250;
        const rOuterStart = 160;
        const rOuterEnd = 225;
        const rInnerStart = 95;
        const rInnerEnd = 160;

        let svg = `<svg viewBox="0 0 500 500" width="100%" height="500" class="circle-fifths-svg" xmlns="http://www.w3.org/2000/svg">`;

        // SVG Styling definitions
        svg += `
            <style>
                .fifths-wedge { fill: rgba(255, 255, 255, 0.02); stroke: var(--glass-border); stroke-width: 1.5; cursor: pointer; transition: fill 0.2s, filter 0.2s; }
                .fifths-wedge:hover { fill: rgba(99, 102, 241, 0.25); filter: drop-shadow(0 0 4px var(--primary)); }
                .fifths-wedge.active { fill: var(--primary); stroke: var(--primary-hover); filter: drop-shadow(0 0 8px var(--primary)); }
                .fifths-text { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; fill: var(--text-main); pointer-events: none; user-select: none; text-anchor: middle; dominant-baseline: middle; }
                .fifths-text-minor { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 500; fill: var(--text-muted); pointer-events: none; user-select: none; text-anchor: middle; dominant-baseline: middle; }
                .fifths-text.active { fill: #ffffff; }
                .fifths-text-minor.active { fill: #ffffff; font-weight: 700; }
                .fifths-center { fill: rgba(15, 17, 21, 0.4); stroke: var(--glass-border); stroke-width: 1.5; }
                .fifths-center-text { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; fill: var(--accent); text-anchor: middle; dominant-baseline: middle; user-select: none; }
            </style>
        `;

        // Draw wedges
        for (let i = 0; i < 12; i++) {
            // Angles centered at i * 30 degrees, rotating 12 o'clock to -90 degrees
            const centerAngle = i * 30 - 90;
            const startAngle = centerAngle - 15;
            const endAngle = centerAngle + 15;

            const majorKey = this.majorKeys[i];
            const minorKey = this.minorKeys[i];

            // Check if wedge is active
            const isMajorActive = (currentRoot === majorKey && currentScaleType === 'Major (Ionian)');
            const isMinorActive = (currentRoot === minorKey && currentScaleType === 'Minor (Aeolian)');

            // Outer Wedge (Major)
            const outerPath = this.getWedgePath(cx, cy, rOuterStart, rOuterEnd, startAngle, endAngle);
            svg += `<path d="${outerPath}" class="fifths-wedge ${isMajorActive ? 'active' : ''}" data-key="${majorKey}" data-type="major" />`;

            // Inner Wedge (Minor)
            const innerPath = this.getWedgePath(cx, cy, rInnerStart, rInnerEnd, startAngle, endAngle);
            svg += `<path d="${innerPath}" class="fifths-wedge ${isMinorActive ? 'active' : ''}" data-key="${minorKey}" data-type="minor" />`;

            // Text positions
            const rad = (centerAngle * Math.PI) / 180;
            const rMajorText = (rOuterStart + rOuterEnd) / 2;
            const rMinorText = (rInnerStart + rInnerEnd) / 2;

            const txMajor = cx + rMajorText * Math.cos(rad);
            const tyMajor = cy + rMajorText * Math.sin(rad);
            const txMinor = cx + rMinorText * Math.cos(rad);
            const tyMinor = cy + rMinorText * Math.sin(rad);

            svg += `<text x="${txMajor}" y="${tyMajor}" class="fifths-text ${isMajorActive ? 'active' : ''}">${majorKey}</text>`;
            svg += `<text x="${txMinor}" y="${tyMinor}" class="fifths-text-minor ${isMinorActive ? 'active' : ''}">${minorKey}m</text>`;
        }

        // Draw center label
        svg += `<circle cx="${cx}" cy="${cy}" r="${rInnerStart - 2}" class="fifths-center" />`;
        
        let label = 'FIFTHS';
        if (currentScaleType === 'Major (Ionian)') {
            label = `${currentRoot} Major`;
        } else if (currentScaleType === 'Minor (Aeolian)') {
            label = `${currentRoot} Minor`;
        }
        svg += `<text x="${cx}" y="${cy}" class="fifths-center-text">${label}</text>`;

        svg += `</svg>`;
        this.container.innerHTML = svg;

        // Add event listeners to wedges
        const wedges = this.container.querySelectorAll('.fifths-wedge');
        wedges.forEach(wedge => {
            wedge.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                const type = e.target.dataset.type === 'major' ? 'Major (Ionian)' : 'Minor (Aeolian)';
                if (this.onKeyClickCallback) {
                    this.onKeyClickCallback(key, type);
                }
            });
        });
    }
}
