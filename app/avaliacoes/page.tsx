'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Player {
  id: string
  name: string
}

interface Review {
  id: string
  message: string
  created_at: string
  reviewer_id: string
  players: {
    name: string
  }
}

export default function Avaliacoes() {
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('')
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const playerId = localStorage.getItem('playerId')
    const playerName = localStorage.getItem('playerName')

    if (!playerId || !playerName) {
      router.push('/')
      return
    }

    setCurrentPlayerId(playerId)
    setCurrentPlayerName(playerName)
    loadPlayers()
  }, [router])

  useEffect(() => {
    if (selectedPlayerId) {
      loadReviews()
    }
  }, [selectedPlayerId])

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPlayers(data || [])

      // Selecionar primeiro jogador que não seja o usuário atual
      const playerId = localStorage.getItem('playerId')
      const otherPlayers = (data || []).filter(p => p.id !== playerId)
      if (otherPlayers.length > 0) {
        setSelectedPlayerId(otherPlayers[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    if (!selectedPlayerId) return

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          players:reviewer_id (name)
        `)
        .eq('target_player_id', selectedPlayerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(data || [])
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || !selectedPlayerId) return

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{
          reviewer_id: currentPlayerId,
          target_player_id: selectedPlayerId,
          message: message.trim()
        }])

      if (error) throw error

      setMessage('')
      loadReviews()
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      alert('Erro ao enviar avaliação. Tente novamente.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Se pressionar Enter sem Shift, envia a mensagem
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && selectedPlayerId) {
        handleSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)
  const otherPlayers = players.filter(p => p.id !== currentPlayerId)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Olá, {currentPlayerName}!
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/analytics')}
                className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Analytics
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('playerId')
                  localStorage.removeItem('playerName')
                  router.push('/')
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Seletor de Jogador */}
          <div>
            <label htmlFor="player-select" className="block text-sm font-medium text-gray-700 mb-2">
              Avaliar jogador:
            </label>
            <select
              id="player-select"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {otherPlayers.length === 0 ? (
                <option value="">Nenhum outro jogador disponível</option>
              ) : (
                otherPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Formulário de Avaliação */}
        {selectedPlayerId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Escrever avaliação para {selectedPlayer?.name}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                placeholder="Digite sua avaliação... (Enter para enviar, Shift+Enter para nova linha)"
                rows={4}
                required
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Enviar Avaliação
              </button>
            </form>
          </div>
        )}

        {/* Lista de Avaliações */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Avaliações de {selectedPlayer?.name}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma avaliação ainda. Seja o primeiro a avaliar!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800">
                      {review.players.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
