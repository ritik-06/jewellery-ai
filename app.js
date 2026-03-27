let selectedCat = 'ring';

const GRADIO_URL = 'https://20ffdec4f37fd76f0a.gradio.live/';
const HF_URL = 'ritik-raj/jewellery-ai';

function selectCat(el, cat) {
document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
el.classList.add('active');
selectedCat = cat;
updatePlaceholder();
}

const placeholders = {
ring: "e.g. A delicate solitaire ring with a round brilliant diamond, twisted pavé band inspired by Edwardian filigree...",
necklace: "e.g. A layered necklace with a teardrop emerald pendant surrounded by diamond halo, on a fine 18k gold chain...",
earring: "e.g. Long drop earrings with graduated sapphires in a waterfall setting, framed by rose gold curves...",
bracelet: "e.g. A tennis bracelet with alternating round diamonds and rubies in a bezel setting, bright polish finish..."
};

function updatePlaceholder() {
document.getElementById('prompt').placeholder = placeholders[selectedCat] || '';
}

function toggleChip(el) {
el.classList.toggle('active');
}

function updateChar() {
const t = document.getElementById('prompt');
document.getElementById('char-count').textContent = `${t.value.length} / 400`;
}

function getActiveChips() {
return [...document.querySelectorAll('.chip.active')].map(c => c.textContent).join(', ');
}

function buildPrompt() {
const userText = document.getElementById('prompt').value.trim();
const chips = getActiveChips();
const style = document.getElementById('render-style').value;
const angle = document.getElementById('view-angle').value;

const pieces = [
    `Luxury ${selectedCat} jewellery product photograph`,
    chips && `materials: ${chips}`,
    userText,
    `render style: ${style}`,
    `camera angle: ${angle}`,
    'ultra high resolution, professional jewellery photography, dark background, dramatic lighting'
].filter(Boolean);

return pieces.join('. ');
}

function setLoading(msg) {
document.getElementById('loading-text').textContent = msg;
document.getElementById('loading-overlay').style.display = 'flex';
document.getElementById('result-img').style.display = 'none';
}

function imageLoaded() {
document.getElementById('loading-overlay').style.display = 'none';
document.getElementById('result-img').style.display = 'block';
const btn = document.getElementById('gen-btn');
btn.classList.remove('loading');
btn.querySelector('.btn-text').textContent = 'Generate';
}

function imageError() {
document.getElementById('loading-overlay').innerHTML = `<p class="error-msg">The atelier encountered an issue crafting your piece.<br>Please try again.</p>`;
const btn = document.getElementById('gen-btn');
btn.classList.remove('loading');
btn.querySelector('.btn-text').textContent = 'Generate';
}

async function generate() {
const btn = document.getElementById('gen-btn');
btn.classList.add('loading');
btn.querySelector('.btn-text').textContent = 'Creating…';

const resultArea = document.getElementById('result-area');
resultArea.classList.add('show');

const loadingMessages = [
    'Crafting your jewel...',
    'Setting each stone with care...',
    'Applying the final polish...',
    'Almost ready...'
];
let msgIdx = 0;
setLoading(loadingMessages[0]);
const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    const lo = document.getElementById('loading-overlay');
    if (lo && lo.style.display !== 'none') {
    document.getElementById('loading-text').textContent = loadingMessages[msgIdx];
    }
}, 2200);

const fullPrompt = buildPrompt();

document.getElementById('result-title').textContent =
    `${selectedCat.charAt(0).toUpperCase() + selectedCat.slice(1)} · ${document.getElementById('render-style').value}`;
document.getElementById('result-meta').textContent = new Date().toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
document.getElementById('prompt-echo').textContent = fullPrompt.substring(0, 80) + (fullPrompt.length > 80 ? '…' : '');

resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

try {
    const { Client } = await import('https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js');
    
    let client, result;

    try {
        client = await Client.connect(GRADIO_URL);
        result = await client.predict('/predict', {
        user_prompt: fullPrompt
    });
    } catch (e) {
        client = await Client.connect(HF_URL);
        result = await client.predict('/run_agent', {
        user_prompt: fullPrompt
    });
    }

    clearInterval(msgInterval);

    // result.data may be a URL string, array, or object — handle all shapes
    const raw = result.data;
    const imageUrl =
    typeof raw === 'string' ? raw :
    Array.isArray(raw) ? (typeof raw[0] === 'string' ? raw[0] : raw[0]?.url) :
    raw?.url || raw?.image_url;

    if (!imageUrl) throw new Error('No image URL in response');

    const img = document.getElementById('result-img');
    img.src = imageUrl;

    const dlBtn = document.getElementById('dl-btn');
    dlBtn.href = imageUrl;
    dlBtn.download = `aurum-${selectedCat}-${Date.now()}.png`;

} catch (err) {
    clearInterval(msgInterval);
    console.error(err);
    document.getElementById('loading-overlay').style.display = 'flex';
    document.getElementById('loading-overlay').innerHTML = `<p class="error-msg">Unable to reach the atelier at this moment.<br><small style="opacity:0.5;font-size:11px;">${err.message}</small></p>`;
    btn.classList.remove('loading');
    btn.querySelector('.btn-text').textContent = 'Generate';
}
}