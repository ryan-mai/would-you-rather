(async function() {
    async function getQuestion() {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (!res.ok) throw new Error(res.status);
        const payload = await res.json();
        if (!payload.ok) throw new Error(payload.error);
        return payload.text;
    }

    try {
        let raw = await getQuestion();
        raw = raw.replace(/```json|```/g, '').trim()
        let parsed;
        try {
            parsed = JSON.parse(raw)
        } catch (err) {
            console.error(err, raw);
        }
        let items;
        if (Array.isArray(parsed)) {
            items = parsed;
        } else if (parsed && Array.isArray(parsed.game)) {
            items = parsed.game;
        } else if (parsed && (parsed.choiceA || parsed.choiceB)) {
            items = [parsed];
        } else if (parsed && (parsed.choiceA || parsed.choiceB || parsed.A || parsed.B)) {
            const a = parsed.choiceA ?? parsed.A ?? parsed.a ?? '';
            const b = parsed.choiceB ?? parsed.B ?? parsed.b ?? '';
           items = [{ choiceA: a, choiceB: b }];
        } else {
            throw new Error('JSON MESSED UP WTFFFFFFFFFFFF')
        }
        const item = items[0];
        item.choiceA = item.choiceA.replace(/[?,]/g, '');
        item.choiceB = item.choiceB.replace(/[?,]/g, '');
        const titles = document.querySelectorAll('.card .card-title');
        if (titles[0]) titles[0].textContent = item.choiceA;
        if (titles[1]) titles[1].textContent = item.choiceB
    
    } catch (err) {
        console.log(err)
        const titles = document.querySelectorAll('.card .card-title');
        if (titles[0]) titles[0].textContent = ':('
    }
}) ();