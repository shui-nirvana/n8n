import fetch from 'node-fetch'

const baseUrl = process.env.N8N_URL || 'http://localhost:5678'
const apiKey = process.env.N8N_API_KEY || ''

async function n8nFetch (path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json'
  }
  if (apiKey) {
    headers['X-N8N-API-KEY'] = apiKey
  }
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`n8n error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function triggerWebhook (workflowId, payload) {
  return n8nFetch(`/webhook/${workflowId}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function listExecutions (params = {}) {
  const query = new URLSearchParams(params).toString()
  return n8nFetch(`/rest/executions?${query}`)
}

export async function getExecution (id) {
  return n8nFetch(`/rest/executions/${id}`)
}
