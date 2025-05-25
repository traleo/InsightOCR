import React, { useState, useEffect } from 'react'
import Tesseract from 'tesseract.js'
import '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import './App.css'

export default function App() {
  const [status,    setStatus]    = useState('Choose an image…')
  const [ocrText,   setOcrText]   = useState('')
  const [preds,     setPreds]     = useState([])
  const [classifier,setClassifier]= useState(null)

  useEffect(()=>{
    mobilenet.load().then(m=>setClassifier(m))
  },[])

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setStatus('Preprocessing image…')
    setOcrText('')
    setPreds([])

    const img = new Image()
    img.src = URL.createObjectURL(file)
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width  = img.width * 2
    canvas.height = img.height * 2
    const ctx = canvas.getContext('2d')
    ctx.filter = 'contrast(200%) brightness(120%)'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // OCR in one line
    setStatus('Recognizing text…')
    const { data: { text } } = await Tesseract.recognize(
      canvas,
      'eng',
      {
        logger: m => setStatus(`${m.status} ${(m.progress*100).toFixed(1)}%`),
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1'
      }
    )
    setOcrText(text.trim())

    // classification
    if (classifier) {
      setStatus('Classifying image…')
      const results = await classifier.classify(img)
      setPreds(results.slice(0,3))
    }

    setStatus('All done!')
  }

  return (
    <div className="App">
      <h1>InsightOCR</h1>
      <input type="file" accept="image/*" onChange={handleFile} />
      <p className="status">{status}</p>

      <section className="ocr">
        <h2>OCR Result</h2>
        <pre>{ocrText}</pre>
      </section>

      <section className="classify">
        <h2>Top 3 Predictions</h2>
        <ul>
          {preds.map((p,i)=>
            <li key={i}>
              {p.className} — {(p.probability*100).toFixed(1)}%
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
