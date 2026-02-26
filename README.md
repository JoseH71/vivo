# VIVO — Motor de Decisión Autonómica

**v1.0 MVP**

Una aplicación de salud para deportistas de resistencia que combina datos de Intervals.icu con análisis autonómico en tiempo real.

## 🎯 Diferencial

A diferencia de apps de "tracking", **Vivo** es un motor de **decisión**:

- **IEA (Índice de Estabilidad Autonómica):** Combina HRV, RHR, Sueño, TSB, Síntomas y Electrolitos en un score 0-100
- **Semáforo Inteligente:** Verde/Amarillo/Rojo basado en tendencias de 60 días (no en datos puntuales)
- **Módulo de Electrolitos:** Correlaciona Mg, Na, K y Taurina con la respuesta del sistema nervioso
- **Diario Sintomático:** Fasciculaciones, estrés, digestión → alimentan el IEA
- **IA (Gemini):** Análisis diario personalizado para atletas con historial de FA

## 🚀 Cómo arrancar

```bash
cd c:\Users\Jose\Desktop\Antigravity\Vivo
npm run dev
```

La app se abrirá en: **http://localhost:5175**

## 📱 Estructura

```
src/
├── App.jsx                    # Orquestador principal
├── config/
│   └── firebase.js            # Firebase config (mismo proyecto que Nutriminerals)
├── services/
│   ├── intervalsService.js    # Conexión con Intervals.icu
│   └── geminiService.js       # Análisis IA
├── engine/
│   └── ieaEngine.js           # Motor IEA (el cerebro de Vivo)
├── components/
│   ├── Semaphore.jsx          # Indicador central IEA
│   ├── BioMetrics.jsx         # HRV, RHR, Sueño, TSB
│   ├── SymptomJournal.jsx     # Check-in diario
│   ├── ElectrolyteTracker.jsx # Registro de suplementos
│   ├── TrendCharts.jsx        # Gráficos HRV/TSS con bandas
│   └── AIAnalysis.jsx         # Narrativa de Gemini
└── index.css                  # Design system completo
```

## 🔑 Características Clave

### 1. Motor IEA (ieaEngine.js)
Ponderación:
- **HRV trends (40%):** Z-score sobre media de 60 días
- **RHR trends (25%):** Desviación vs baseline
- **Sleep (15%):** Ratio 7d vs 28d
- **Training Load (10%):** TSB (CTL - ATL)
- **Symptoms (±10):** Fasciculaciones, estrés, etc.
- **Electrolytes (±5):** Mg, Na, Taurina

### 2. Conexión Intervals.icu
- Cache en Firebase (refresco cada 15 min)
- Proxy CORS automático
- Sincronización en background

### 3. Firebase (Coste Cero)
- Mismo proyecto que Nutriminerals
- APP_ID diferente: `vivo_app`
- Datos diarios sincronizados entre dispositivos

### 4. Gemini AI
- Análisis contextual diario
- Prompt especializado para atletas con FA
- Nunca recomienda VO2max (límite 150 lpm)

## 🎨 Diseño

- **Dark Mode Premium:** Glassmorphism + glow effects
- **Fuentes:** Inter (UI) + JetBrains Mono (datos)
- **Semáforo con Orbs:** Efectos de "breathing" y glow dinámico
- **Animaciones:** Fade-in, stagger, pulse-glow
- **PWA Ready:** Instalable en móvil

## 📊 Tabs

1. **Hoy:** Semáforo IEA + Bio-métricas + Síntomas + Preview IA
2. **Tendencia:** Gráficos HRV/RHR con bandas de normalidad + Desglose IEA
3. **Electro:** Tracker de Mg/Na/K/Taurina con insights autonómicos
4. **IA:** Análisis completo de Gemini

## 🔧 Próximos pasos

- [ ] Añadir vista de "Historial" (calendario con IEA por día)
- [ ] Notificaciones push cuando IEA < 50
- [ ] Exportar datos a CSV
- [ ] Integración con peso corporal (pre/post entreno)
- [ ] Predictor de HRV nocturno basado en cena + electrolitos

## 💡 Filosofía

**Vivo no es un tracker. Es un copiloto autonómico.**

No te dice "tu HRV es 62ms". Te dice:
> "Tu HRV está 8% por debajo de tu media de 60 días. Combinado con el TSB de -15 y las fasciculaciones de ayer, tu sistema simpático está saturado. Hoy: Z2 suave o descanso. Dobla el Magnesio antes de dormir."

---

**Desarrollado con:** Vite + React + Firebase + Recharts + Gemini AI
