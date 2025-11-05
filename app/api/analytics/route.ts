import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Buscar TODOS os reviews do Supabase
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        message,
        created_at,
        reviewer_id,
        target_player_id,
        players!reviews_reviewer_id_fkey (name),
        target:players!reviews_target_player_id_fkey (name)
      `)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Erro ao buscar reviews:', reviewsError)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        totalReviews: 0,
        ikigaiInsights: {
          passion: [],
          mission: [],
          vocation: [],
          profession: []
        },
        commonCharacteristics: [],
        interestAreas: [],
        suggestedCareers: [],
        summary: 'Ainda não há avaliações suficientes para análise.'
      })
    }

    // Preparar dados para o GPT
    const reviewsText = reviews.map(r => ({
      reviewer: r.players?.name || 'Anônimo',
      target: r.target?.name || 'Desconhecido',
      message: r.message
    }))

    const prompt = `
Você é um especialista em análise de dados qualitativos e psicologia vocacional.

Analise as seguintes avaliações feitas entre jogadores e identifique padrões gerais,
características comuns, e insights baseados no framework IKIGAI.

AVALIAÇÕES (${reviews.length} no total):
${JSON.stringify(reviewsText, null, 2)}

---

Com base nessas avaliações, faça uma análise agregada e retorne SOMENTE um JSON válido (sem markdown, sem comentários) com a seguinte estrutura:

{
  "totalReviews": <número de avaliações analisadas>,
  "ikigaiInsights": {
    "passion": [<lista de 3-5 paixões/interesses comuns identificados>],
    "mission": [<lista de 3-5 missões/propósitos comuns>],
    "vocation": [<lista de 3-5 talentos/vocações comuns>],
    "profession": [<lista de 3-5 áreas profissionais que combinam com os perfis>]
  },
  "commonCharacteristics": [<lista de 5-7 características de personalidade mais comuns>],
  "interestAreas": [<lista de 4-6 áreas de interesse comuns>],
  "suggestedCareers": [<lista de 5-8 carreiras que combinam com o perfil geral do grupo>],
  "summary": "<resumo em 2-3 parágrafos sobre o perfil geral do grupo>"
}

IMPORTANTE:
- Retorne APENAS o JSON, sem nenhum texto adicional
- Todas as listas devem conter strings curtas e objetivas
- O summary deve ser inspirador e construtivo
- Identifique padrões reais nas avaliações fornecidas
`

    // Chamar a API do OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise de dados qualitativos e psicologia vocacional. Sempre responda com JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const result = completion.choices[0].message.content

    if (!result) {
      throw new Error('Resposta vazia do GPT')
    }

    // Parse do JSON retornado
    const analyticsData = JSON.parse(result)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Erro ao gerar analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar análise', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
