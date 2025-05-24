const fileInput = document.getElementById('fileInput');
const statusEl  = document.getElementById('status');
const resultEl  = document.getElementById('result');
const predsEl   = document.getElementById('predictions');

let mobilenetModel;
mobilenet.load().then(m => {
  mobilenetModel = m;
  console.log('MobileNet loaded');
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  statusEl.textContent = 'Recognizing text…';
  resultEl.textContent = '';
  predsEl.innerHTML = '';

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        statusEl.textContent = `OCR: ${m.status} ${ (m.progress * 100).toFixed(1) }%`;
      }
    });
    resultEl.textContent = text.trim() || '[no text found]';
  } catch (err) {
    resultEl.textContent = 'OCR error: ' + err.message;
  }

  if (!mobilenetModel) {
    predsEl.textContent = 'MobileNet not yet loaded.';
    return;
  }
  statusEl.textContent = 'Classifying image…';

  const img = new Image();
  img.src = URL.createObjectURL(file);
  await img.decode();

  try {
    const predictions = await mobilenetModel.classify(img);
    predsEl.innerHTML = 
      '<ul>' +
      predictions.slice(0,3)
        .map(p => `<li>${p.className} — ${ Math.round(p.probability * 100) }%</li>`)
        .join('') +
      '</ul>';
    statusEl.textContent = 'Done';
  } catch (err) {
    predsEl.textContent = 'Classification error: ' + err.message;
    console.error(err);
    statusEl.textContent = '';
  }
});
