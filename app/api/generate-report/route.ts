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
        created_at
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

    const prompt = `

    Não inclua textos adicionais, apenas o relatório em markdown!
    🧭 ORIENTAÇÃO VOCACIONAL BASEADA EM IKIGAI
    
    Você é um especialista em psicologia vocacional, coaching e mercado de trabalho. 
    Seu papel é gerar um relatório empático, construtivo e inspirador sobre o usuário, 
    com base em avaliações qualitativas feitas por pessoas próximas (amigos, familiares, colegas, professores etc.) 
    e nas respostas do próprio usuário sobre propósito, interesses e experiências.
    
    ---
    
    🔹 Estrutura dos dados de entrada
    
    O app irá preencher o prompt com algo assim:
    
    Avaliações: 
    ${JSON.stringify(reviews)}
    
    ---
    
    🔹 Instruções de análise
    
    1. **Mapeie as respostas para os quatro pilares do IKIGAI:**
       - **Paixão** — O que a pessoa ama fazer, o que a empolga, o que a faz perder a noção do tempo.
       - **Missão** — Que tipo de impacto ou problema do mundo ela gostaria de resolver.
       - **Vocação** — O que os outros reconhecem como talentos naturais ou habilidades notáveis.
       - **Profissão** — Áreas em que essas habilidades poderiam gerar valor e reconhecimento.
    
    2. **Identifique padrões** — traços de personalidade, valores e motivações que aparecem com frequência nas avaliações.
    
    3. **Monte um quadro IKIGAI personalizado**, mostrando como esses quatro elementos se conectam.
    
    4. **Sugira 3 a 5 caminhos profissionais possíveis**, explicando:
       - Como cada um se relaciona com os pilares do Ikigai identificados.
       - Que tipo de ambiente ou dinâmica de trabalho combina com o perfil.
       - Exemplos de profissões e áreas correlatas.
    
    5. **Traga recomendações práticas** — experiências, cursos, testes ou atividades que o usuário pode explorar.
    
    6. **Finalize com uma mensagem inspiradora**, que motive o usuário a ver a vocação como uma jornada de autoconhecimento.
    
    ---
    
    🔹 Exemplo de estrutura de saída esperada
    
    🧠 **Resumo do Perfil**
    Você demonstra curiosidade intelectual, empatia e desejo de impacto positivo. 
    Pessoas próximas destacam sua comunicação e sensibilidade. 
    Há também um traço de indecisão — comum em perfis criativos e multifacetados.
    
    💫 **Mapa Ikigai**
    - **Paixão:** ajudar pessoas, aprender coisas novas.  
    - **Missão:** contribuir para o bem-estar emocional.  
    - **Vocação:** empatia, escuta ativa, comunicação.  
    - **Profissão:** psicologia, coaching, educação, recursos humanos.
    
    🚀 **Possíveis Caminhos**
    1. **Psicologia / Coaching** — conecta sua paixão por ajudar e seu talento para ouvir e compreender.
    2. **Educação / Comunicação** — valoriza sua clareza, empatia e desejo de inspirar.
    3. **Design Social / Inovação** — une criatividade e propósito.
    
    🎯 **Próximos Passos**
    - Fazer um curso introdutório em psicologia ou educação.
    - Participar de projetos de voluntariado ligados a pessoas.
    - Fazer o teste Holland ou MBTI para complementar o autoconhecimento.
    
    💬 **Mensagem Final**
    "Sua vocação não é um destino fixo — é o caminho que você constrói ao seguir o que te faz sentir vivo."
    
    `
    
    // Chamar a API do OpenAI
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });
    

    const result = response.output_text

    console.log(prompt)
    console.log(result)

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
