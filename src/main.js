document.addEventListener('DOMContentLoaded', () => {
    let chosen = [];
    const choiceA = document.getElementById('a');
    const choiceB = document.getElementById('b');

    function selected(el, selectedState) {
        if (!el) return;
        el.classList.toggle('selected', selectedState);
        el.setAttribute('aria-pressed', selectedState ? 'true' : 'false');
    }

    let questions = [];
    let idx = 0;

    function renderCurrent() {
        const item = questions[idx];
        const titles = document.querySelectorAll('.card .card-title');
        if (!item) {
            if (titles[0]) titles[0].textContent = 'No more questions';
            if (titles[1]) titles[1].textContent = '';
            return;
        }
        if (titles[0]) titles[0].textContent = item.A;
        if (titles[1]) titles[1].textContent = item.B;
    }

    async function loadBatch() {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (!res.ok) throw new Error(res.status);
        const payload = await res.json();
        if (!payload.ok) throw new Error(payload.error);
        const raw = (payload.text || '[]').replace(/```json|```/g, '').trim();
        let parsed = [];
        try { parsed = JSON.parse(raw); } catch (err) { console.error('parse error', err, raw); }
        if (Array.isArray(parsed) && parsed.length) {
            questions = parsed.map(p => ({ A: String(p.A ?? p.choiceA ?? p.a ?? '').trim(), B: String(p.B ?? p.choiceB ?? p.b ?? '').trim() }));
            idx = 0;
            renderCurrent();
        } else {
            console.warn('no questions returned');
        }
    }

    (async function init() {
        try {
            await loadBatch();
        } catch (err) {
            console.error(err);
            const titles = document.querySelectorAll('.card .card-title');
            if (titles[0]) titles[0].textContent = ':(';
        }
    })();

    function handle(choice) {
        const aText = choiceA.querySelector('.card-title').textContent.trim();
        const bText = choiceB.querySelector('.card-title').textContent.trim();
        chosen.push(aText, bText);
        chosen = Array.from(new Set(chosen.map(s => String(s).trim()).filter(Boolean)));

        const picked = choice === 'A' ? aText : bText;

        if (choice == 'A') {
            selected(choiceA, true);
            selected(choiceB, false);
        } else {
            selected(choiceA, false);
            selected(choiceB, true);
        }

        idx++;
        if (idx >= questions.length) {
            loadBatch().catch(err => {
                console.warn('Failed to reload batch', err);
                renderCurrent();
            });
        } else {
            renderCurrent();
            setTimeout(() => {
                selected(choiceA, false);
                selected(choiceB, false);
            }, 220);
        }
    }

    function attach(el, id) {
        if (!el) return;
        el.addEventListener('click', () => handle(id));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                handle(id);
            }
        });
    }
    attach(choiceA, 'A');
    attach(choiceB, 'B');
});