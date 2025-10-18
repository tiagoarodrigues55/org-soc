'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    setLoading(true)

    try {
      // Criar ou buscar jogador
      const { data, error } = await supabase
        .from('players')
        .insert([{ name: name.trim() }])
        .select()
        .single()

      if (error) throw error

      // Salvar ID do jogador no localStorage
      localStorage.setItem('playerId', data.id)
      localStorage.setItem('playerName', data.name)

      // Redirecionar para página de avaliações
      router.push('/avaliacoes')
    } catch (error) {
      console.error('Erro ao criar jogador:', error)
      alert('Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Avaliações de Jogadores
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Digite seu nome
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Seu nome completo"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Escaneie o QR code para acessar</p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/relatorios')}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>
  )
}
