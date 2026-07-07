# ADR-008: Estrategia de IA

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

Hermes es una plataforma de inteligencia de inversiones. La palabra "inteligencia" en su nombre implica análisis, no solo recolección de datos. Sin embargo, en esta fase el proyecto debe decidir qué tipo de inteligencia artificial usar: reglas explícitas (determinístico), modelos estadísticos clásicos, o Machine Learning.

## Problema

Definir la estrategia de IA para Hermes: ¿qué tipo de inteligencia usar en cada capa? ¿cuándo introducir ML? ¿qué datos recolectar ahora para entrenar modelos en el futuro?

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Sistema basado en reglas (Sprint 1-6)** | Explicable, depurable, predecible, sin datos de entrenamiento necesarios, funciona desde el día 1, thresholds ajustables manualmente | Menos preciso que ML con suficientes datos, requiere tuning manual, no detecta patrones no lineales |
| **ML desde el MVP** | Precisión potencialmente mayor, aprendizaje automático de patrones | Necesita datos históricos (no existen), opaco (caja negra), sobreingeniería para el volumen actual, costo de infraestructura ML |
| **Híbrido (reglas + ML futuro)** | Reglas funcionan desde el día 1, ML mejora con el tiempo, datos históricos se recolectan desde el principio | Complejidad de mantener dos sistemas coexistiendo, riesgo de no migrar nunca a ML |
| **Modelos estadísticos clásicos** | Explicables, paramétricos, bajo costo computacional, funcionan con pocos datos | Menos flexibles que ML, no escalan a patrones complejos |

## Decisión

**Estrategia híbrida en 3 fases:**

1. **Fase 1 — Reglas (Ahora, Sprint 1-6):** Opportunity Engine, Decision Engine, Valuation Engine, todos los engines de Data Intelligence usan fórmulas explícitas y pesos configurables. Explicabilidad total.

2. **Fase 2 — Estadístico (Post-MVP, Mes 3-6):** Regresión lineal para valuations, clustering (k-means) para segmentación de zonas, promedios móviles para tendencias.

3. **Fase 3 — ML (Post-Producción, Mes 6+):** Modelos supervisados (Random Forest → XGBoost → Redes) para scoring y clasificación, entrenados con los datos recolectados desde el día 1.

## Consecuencias

### Positivas
- Hermes es usable y valioso desde el Sprint 1
- Cada cálculo es explicable ("¿Por qué este score? Porque X, Y, Z")
- Todos los inputs, outputs, pesos y versiones se guardan → dataset de entrenamiento futuro
- Sin dependencia de GPUs, ML infraestructura, data scientists en MVP
- Los modelos ML futuros tendrán datos de alta calidad etiquetados por las decisiones humanas

### Negativas
- Los pesos de las reglas requieren calibración manual (ajustes en Sprint 3-5)
- ML futuro podría contradecir las reglas actuales (gestión de cambio)

### ML-Readiness (datos que se recolectan desde el día 1)

| Dato | ¿Para qué modelo futuro? |
|------|-------------------------|
| Input del Opportunity Engine | Feature vector para scoring ML |
| Output del Opportunity Engine | Variable target (regresión) |
| Decision Engine: decisión final | Label para clasificación |
| Decision Engine: confianza | Peso de muestra |
| Versión de cada engine | Feature de versión |
| quality_score | Filtro de calidad de datos |
| correlationId | Trazabilidad para debugging |
| Tiempo de cálculo | Feature de latencia (monitoreo) |

### Lo que NO se hará con IA/ML en MVP
- Generación de lenguaje natural (evitar costos de LLM)
- Predicción automática de precios futuros (sin datos históricos)
- Negociación automática
- Chatbots
- Procesamiento de imágenes (costo computacional alto vs valor)

## Referencias

- [DATA_INTELLIGENCE_LAYER.md §6 — ML Readiness](../DATA_INTELLIGENCE_LAYER.md)
- [ARCHITECTURE_GATE_REVIEW.md §9 — Data Quality Framework](../ARCHITECTURE_GATE_REVIEW.md)
