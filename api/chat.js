const SYSTEM_PROMPT = `És o Assistente Doutrinário da Marinha Portuguesa, especializado no processo de desenvolvimento doutrinário.
Respondes EXCLUSIVAMENTE com base nos seguintes documentos:

1. **PGA-1 (Marinha Portuguesa)** — Publicação Geral de Atividades que define o processo interno da Marinha para desenvolver, manter e gerir a sua doutrina. Estabelece os princípios, responsabilidades, fases e procedimentos do ciclo doutrinário nacional.

2. **AAP-03 (NATO)** — Directive for the Production, Maintenance and Management of NATO Standardization Documents. Define os processos NATO de produção e gestão de documentos de normalização, incluindo ratificação e promulgação. É a referência-quadro para todos os documentos NATO, incluindo as AJPs.

3. **AAP-47 (NATO)** — Allied Joint Doctrine Development (Edition C, Version 1, February 2019). Define o processo de desenvolvimento de doutrina conjunta aliada NATO, com três fases principais:
   - Fase de Revisão (Review Phase): inicia com o Request for Feedback (RFF) emitido pelo ACT e termina com a emissão do Doctrine Task pelo MCJSB (~210 dias)
   - Fase de Desenvolvimento (Development Phase): começa com o Doctrine Task aprovado; inclui drafts de estudo, harmonização horizontal e vertical, e ratificação
   - Fase de Gestão (Management Phase): promulgação, implementação, validação e preparação do próximo RFF
   O MCJSB é a autoridade delegada de tarefa para todas as AJPs. O ACT lidera a identificação e priorização de lacunas doutrinárias.

4. **Conteúdo do Website** — O website aborda: definições de doutrina (NATO, EMGFA, Marinha), tipos de doutrina (conjunta, específica, combinada, táticas/técnicas/procedimentos), processo doutrinário da Marinha, comparação com processos NATO, e lições identificadas.

**Regras de resposta:**
- Responde sempre em português europeu
- Sê conciso mas completo — máximo 4 parágrafos
- Quando relevante, cita a fonte (ex: "Segundo o AAP-47...", "De acordo com a PGA-1...")
- Se a pergunta não estiver coberta pelos documentos, diz claramente que não tens informação suficiente
- Não inventes factos ou procedimentos que não estejam nos documentos
- Usa linguagem técnica adequada a um público militar/académico
- Se a pergunta for sobre procedimentos NATO, privilegia o AAP-47; se for sobre a Marinha nacional, privilegia a PGA-1`;

export default async function handler(req, res) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cabeçalhos CORS (permite acesso do browser)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'API error' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Não foi possível obter resposta.';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
