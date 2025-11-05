'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AnalyticsData {
  totalReviews: number
  ikigaiInsights: {
    passion: string[]
    mission: string[]
    vocation: string[]
    profession: string[]
  }
  commonCharacteristics: string[]
  interestAreas: string[]
  suggestedCareers: string[]
  summary: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function Analytics() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics')

      if (!response.ok) {
        throw new Error('Erro ao buscar dados')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  // Preparar dados para os gráficos
  const characteristicsChartData = data?.commonCharacteristics.map((char, index) => ({
    name: char.length > 20 ? char.substring(0, 20) + '...' : char,
    fullName: char,
    value: data.commonCharacteristics.length - index, // Valor decrescente para visualização
  })) || []

  const interestAreasChartData = data?.interestAreas.map((area, index) => ({
    name: area.length > 20 ? area.substring(0, 20) + '...' : area,
    fullName: area,
    value: data.interestAreas.length - index,
  })) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Analytics - Análise Geral
              </h1>
              <p className="text-gray-600">
                Visualize insights agregados de todas as avaliações
              </p>
            </div>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Atualizando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Atualizar Análise
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        {!data && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nenhuma análise carregada
            </h3>
            <p className="text-gray-600 mb-6">
              Clique em "Atualizar Análise" para gerar insights baseados nas avaliações
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total de Avaliações</p>
                    <p className="text-4xl font-bold mt-2">{data.totalReviews}</p>
                  </div>
                  <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Carreiras Sugeridas</p>
                    <p className="text-4xl font-bold mt-2">{data.suggestedCareers.length}</p>
                  </div>
                  <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Áreas de Interesse</p>
                    <p className="text-4xl font-bold mt-2">{data.interestAreas.length}</p>
                  </div>
                  <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* IKIGAI Pillars */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Os 4 Pilares do IKIGAI
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paixão */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <span className="text-2xl">❤️</span>
                    Paixão - O que amam fazer
                  </h3>
                  <ul className="space-y-2">
                    {data.ikigaiInsights.passion.map((item, index) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missão */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🌍</span>
                    Missão - O que o mundo precisa
                  </h3>
                  <ul className="space-y-2">
                    {data.ikigaiInsights.mission.map((item, index) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vocação */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    Vocação - Em que são bons
                  </h3>
                  <ul className="space-y-2">
                    {data.ikigaiInsights.vocation.map((item, index) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Profissão */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                    <span className="text-2xl">💼</span>
                    Profissão - Pelo que podem ser pagos
                  </h3>
                  <ul className="space-y-2">
                    {data.ikigaiInsights.profession.map((item, index) => (
                      <li key={index} className="text-gray-700 flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Características Comuns */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Características Comuns
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={characteristicsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <p className="text-sm font-semibold text-gray-800">
                              {payload[0].payload.fullName}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {characteristicsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Áreas de Interesse */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Áreas de Interesse
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interestAreasChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <p className="text-sm font-semibold text-gray-800">
                              {payload[0].payload.fullName}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {interestAreasChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Carreiras Sugeridas */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Carreiras Sugeridas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.suggestedCareers.map((career, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 font-medium">{career}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumo Geral */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-3xl">💡</span>
                Resumo Geral
              </h2>
              <div className="prose prose-lg prose-invert">
                <p className="text-white text-opacity-95 leading-relaxed whitespace-pre-line">
                  {data.summary}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
