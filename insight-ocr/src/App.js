import React, { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import './App.css';
import './index.css';

export default function App() {
  const [status, setStatus] = useState('Choose an image…');
  const [ocrText, setOcrText] = useState('');
  const [preds, setPreds] = useState([]);
  const [classifier, setClassifier] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [selectedLang, setSelectedLang] = useState('eng');

  useEffect(() => {
    mobilenet.load().then(m => setClassifier(m));
  }, []);

  const renderPreview = async (file) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    setPreviewSrc(canvas.toDataURL());
  };

  const runAnalysis = async () => {
    if (!currentFile) return;
    setStatus('Running OCR…');
    setOcrText('');
    setPreds([]);

    const img = new Image();
    img.src = URL.createObjectURL(currentFile);
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const { data: { text } } = await Tesseract.recognize(
      canvas,
      selectedLang,
      { logger: m => setStatus(`${m.status} ${(m.progress * 100).toFixed(1)}%`) }
    );
    setOcrText(text.trim());

    if (classifier) {
      setStatus('Classifying image…');
      const results = await classifier.classify(img);
      setPreds(results.slice(0, 3));
    }

    setStatus('All done!');
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setCurrentFile(file);
    setStatus('Click "Analyze" to begin');
    setOcrText('');
    setPreds([]);
    await renderPreview(file);
  };

  const copyText = () => {
    navigator.clipboard.writeText(ocrText)
      .then(() => alert('Copied to clipboard!'))
      .catch(() => alert('Failed to copy.'));
  };

  return (
    <div className="App">
      <div className="header">
        <img src="/eye.gif" alt="Logo" />
        <h1>InsightOCR</h1>
      </div>

      <label htmlFor="lang-select">OCR Language:</label>
      <select
        id="lang-select"
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
      >
        <option value="eng">English</option>
        <option value="spa">Spanish</option>
        <option value="fra">French</option>
        <option value="deu">German</option>
        <option value="ita">Italian</option>
        <option value="vie">Vietnamese</option>
        <option value="jpn">Japanese</option>
        <option value="chi_sim">Chinese (Simplified)</option>
      </select>

      <input type="file" accept="image/*" onChange={handleFile} />

      {previewSrc && (
        <div>
          <h3>Image Preview</h3>
          <img src={previewSrc} alt="Processed preview" style={{ maxWidth: '30%' }} />
          {currentFile && (
            <button onClick={runAnalysis}>Analyze</button>
          )}
        </div>
      )}

      <p className="status">{status}</p>

      <section className="ocr">
        <h2>OCR Result</h2>
        <pre>{ocrText}</pre>
        {ocrText && (
          <div>
            <button onClick={() => {
              const blob = new Blob([ocrText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ocr_result.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}>Download as .txt</button>
            <button onClick={copyText}>Copy Text</button>
          </div>
        )}
      </section>

      <section className="classify">
        <h2>Top 3 Predictions</h2>
        <ul>
          {preds.map((p, i) =>
            <li key={i}>{p.className} — {(p.probability * 100).toFixed(1)}%</li>
          )}
        </ul>
      </section>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} InsightOCR. All rights reserved.</p>
      </footer>
    </div>


  );
}
