/**
 * Pipeline Stage: Notification & Alert Engine
 * Sends real-time alerts to Telegram and Webhooks when high-value opportunities are discovered.
 */

/**
 * Send alert message to Telegram Bot.
 */
async function sendTelegramAlert(token, chatId, messageHtml) {
  if (!token || !chatId) return false
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    })
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * Send alert payload to generic Webhook (Discord, Slack, Make, Zapier, n8n).
 */
async function sendWebhookAlert(webhookUrl, payload) {
  if (!webhookUrl) return false
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch (err) {
    return false
  }
}

/**
 * Format an opportunity into a rich Telegram HTML message.
 */
function formatOpportunityMessage(item) {
  const { asset, score, confidence, decision, estimatedValue, discount, grade } = item
  const loc = asset.location || {}
  const locStr = [loc.corregimiento || loc.neighborhood, loc.district, loc.province].filter(Boolean).join(', ')
  const priceStr = asset.price_amount ? `$${Number(asset.price_amount).toLocaleString('en-US')}` : 'Consultar'
  const estStr = estimatedValue ? `$${Number(estimatedValue).toLocaleString('en-US')}` : 'N/A'
  const discStr = discount ? `${discount.toFixed(1)}%` : '0%'
  const actionEmoji = decision === 'BUY_NOW' ? '🔥' : '⭐'

  return `
${actionEmoji} <b>OPORTUNIDAD DETECTADA: ${decision} (${grade})</b>

🏷️ <b>Activo:</b> ${asset.title || 'Propiedad'}
💰 <b>Precio:</b> ${priceStr}
📈 <b>Valor Estimado:</b> ${estStr} (<b>${discStr}</b> de descuento)
🎯 <b>Opportunity Score:</b> ${score}/100 (Confianza: ${confidence}%)
📍 <b>Ubicación:</b> ${locStr || 'Panamá'}
🏦 <b>Fuente:</b> ${asset.source_id || 'Portal'}

🔗 <a href="${asset.source_listing_url || '#'}">Ver Publicación Original</a>
`.trim()
}

/**
 * Execute notification stage.
 * @param {object} ctx Pipeline context { decided, log, report }
 * @returns {Promise<object>} Notification summary
 */
export async function run(ctx) {
  const { decided, log, report } = ctx
  const notifyStart = Date.now()
  const logStage = log.module('NOTIFIER')
  logStage.section('NOTIFICATIONS & ALERTS')

  const minScore = parseInt(process.env.ALERT_MIN_SCORE || '80', 10)
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_CHAT_ID
  const webhookUrl = process.env.ALERT_WEBHOOK_URL

  // Filter high-conviction opportunities
  const opportunities = (decided || []).filter(item => {
    return item.decision === 'BUY_NOW' || item.score >= minScore
  })

  let sentCount = 0

  if (opportunities.length > 0) {
    logStage.info(`Found ${opportunities.length} high-conviction opportunity(ies) (Score >= ${minScore} / BUY_NOW)`)

    for (const opp of opportunities) {
      const msg = formatOpportunityMessage(opp)
      
      // 1. Telegram
      if (telegramToken && telegramChatId) {
        const ok = await sendTelegramAlert(telegramToken, telegramChatId, msg)
        if (ok) sentCount++
      }

      // 2. Webhook
      if (webhookUrl) {
        await sendWebhookAlert(webhookUrl, {
          event: 'opportunity_detected',
          timestamp: new Date().toISOString(),
          opportunity: {
            title: opp.asset?.title,
            price: opp.asset?.price_amount,
            estimated_value: opp.estimatedValue,
            discount_pct: opp.discount,
            score: opp.score,
            confidence: opp.confidence,
            decision: opp.decision,
            url: opp.asset?.source_listing_url,
            location: opp.asset?.location,
          },
        })
      }
    }

    if (!telegramToken && !webhookUrl) {
      logStage.info(`Real-time channels not configured. Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID in .env to receive instant alerts.`)
    } else {
      logStage.info(`Dispatched ${sentCount} alert(s) to configured notification channels.`)
    }
  } else {
    logStage.info(`No immediate BUY_NOW opportunities exceeding threshold (${minScore}/100) in this run.`)
  }

  const durationMs = Date.now() - notifyStart
  if (report) {
    report.notifier = {
      opportunities_detected: opportunities.length,
      alerts_sent: sentCount,
      duration_ms: durationMs,
    }
  }

  logStage.stats({
    'Opportunities detected': opportunities.length,
    'Alerts sent': sentCount,
    'Notifier time': log.module().duration(durationMs),
  })

  return { opportunities, sentCount }
}
