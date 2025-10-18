import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar informações do jogador
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('name')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Jogador não encontrado' },
        { status: 404 }
      )
    }

    // Buscar todas as avaliações sobre esse jogador
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        message,
        created_at,
        players:reviewer_id (name)
      `)
      .eq('target_player_id', playerId)
      .order('created_at', { ascending: false })

    if (reviewsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma avaliação encontrada para este jogador' },
        { status: 404 }
      )
    }

    // Montar o prompt com as avaliações

    const prompt = `🧠 Prompt base para análise de vocação

Instrução geral ao modelo:

Você é um especialista em orientação vocacional, psicologia e mercado de trabalho. Seu papel é analisar avaliações qualitativas sobre um usuário, feitas por outras pessoas (amigos, familiares, colegas, professores etc.), com base nas respostas desse usuário sobre temas como vida, hobbies, experiências passadas, carreiras de interesse e valores pessoais.

A partir dessas avaliações, gere um relatório detalhado e empático que ajude o usuário a refletir sobre sua vocação e possíveis caminhos profissionais.

🔹 Estrutura dos dados de entrada

O app pode preencher o prompt dinamicamente com algo assim:

Avaliações: 
${JSON.stringify(reviews)}



🔹 Instrução de geração de relatório

Com base nas respostas do usuário e nas avaliações recebidas:

Identifique padrões — que traços de personalidade, habilidades e valores aparecem com mais frequência nas análises.

Interprete os sinais de vocação — o que esses padrões indicam sobre áreas ou tipos de carreira que combinam com a pessoa.

Gere um resumo de perfil (personalidade, interesses, pontos fortes e pontos de atenção).

Sugira 3 a 5 áreas profissionais ou caminhos de carreira, explicando por que cada uma faz sentido.

Dê recomendações práticas — como a pessoa pode explorar essas áreas (cursos, experiências, testes, atividades).

Finalize com um conselho inspirador e personalizado, que motive o usuário a explorar o autoconhecimento.

🔹 Exemplo de saída esperada

Resumo do perfil:
Você demonstra curiosidade intelectual, empatia e desejo de impacto positivo. Pessoas próximas destacam sua capacidade de comunicação e interesse genuíno pelos outros. Ao mesmo tempo, há traços de indecisão — o que é comum em perfis criativos e multifacetados.

Possíveis vocações:

Psicologia / Coaching: seu interesse por pessoas e empatia podem se traduzir em uma carreira de apoio emocional e desenvolvimento humano.

Educação / Comunicação: você se destaca por transmitir ideias e inspirar outras pessoas.

Design / Inovação social: há traços de criatividade e propósito.
(...)

Próximos passos:

Fazer um curso introdutório em psicologia ou educação.

Participar de um voluntariado para testar o interesse por causas humanas.

Realizar o teste Holland ou MBTI para complementar a análise.

Mensagem final:

“Sua vocação não é um ponto fixo, mas uma jornada de autodescoberta. Escute o que os outros veem em você, mas acima de tudo, escute a si mesmo.”`

    // Chamar a API do OpenAI
    const response = await openai.responses.create({
      model: "gpt-5",
      input: prompt,
    });
    

    const result = response.output_text

    // Salvar relatório no banco de dados
    const { data: savedReport, error: saveError } = await supabase
      .from('reports')
      .insert([{
        player_id: playerId,
        analysis: result,
        vocational_recommendation: result,
      }])
      .select()
      .single()
    return NextResponse.json({
      result: result,
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}
