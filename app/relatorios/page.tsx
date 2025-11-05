'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'

interface Player {
  id: string
  name: string
}

interface Report {
  id?: string
  analysis: string
  vocationalRecommendation: string
  createdAt?: string
}

interface SavedReport {
  id: string
  analysis: string
  vocational_recommendation: string
  created_at: string
}

export default function Relatorios() {
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    if (selectedPlayerId) {
      loadSavedReports()
    }
  }, [selectedPlayerId])

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setPlayers(data || [])
      if (data && data.length > 0) {
        setSelectedPlayerId(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedReports = async () => {
    if (!selectedPlayerId) return

    setLoadingReports(true)
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('player_id', selectedPlayerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedReports(data || [])
    } catch (error) {
      console.error('Erro ao carregar relatórios salvos:', error)
    } finally {
      setLoadingReports(false)
    }
  }

  const generatePDF = async (playerName: string, analysis: string, vocationalRecommendation: string, createdAt?: string) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)
      let yPosition = margin

      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Relatório de Avaliação', margin, yPosition)
      yPosition += 10

      // Nome do jogador
      doc.setFontSize(14)
      doc.text(playerName, margin, yPosition)
      yPosition += 8

      // Data
      if (createdAt) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const date = new Date(createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        doc.text(`Data: ${date}`, margin, yPosition)
        yPosition += 10
      } else {
        yPosition += 5
      }

      // Análise de Perfil
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Análise de Perfil', margin, yPosition)
      yPosition += 7

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const analysisLines = doc.splitTextToSize(analysis, maxWidth)

      for (const line of analysisLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin, yPosition)
        yPosition += 5
      }

      yPosition += 10

      // Recomendação Vocacional
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage()
        yPosition = margin
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Recomendação Vocacional', margin, yPosition)
      yPosition += 7

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const recommendationLines = doc.splitTextToSize(vocationalRecommendation, maxWidth)

      for (const line of recommendationLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(line, margin, yPosition)
        yPosition += 5
      }

      return doc
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      throw error
    }
  }

  const downloadPDF = async (playerName: string, analysis: string, vocationalRecommendation: string, createdAt?: string) => {
    try {
      const doc = await generatePDF(playerName, analysis, vocationalRecommendation, createdAt)
      const fileName = `relatorio_${playerName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
      doc.save(fileName)
    } catch {
      alert('Erro ao baixar PDF. Tente novamente.')
    }
  }

  const sharePDF = async (playerName: string, analysis: string, vocationalRecommendation: string, createdAt?: string) => {
    try {
      const doc = await generatePDF(playerName, analysis, vocationalRecommendation, createdAt)
      const pdfBlob = doc.output('blob')
      const fileName = `relatorio_${playerName.replace(/\s+/g, '_')}.pdf`

      // Verificar se a Web Share API está disponível
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' })
        const canShare = navigator.canShare({ files: [file] })

        if (canShare) {
          await navigator.share({
            title: `Relatório de ${playerName}`,
            text: 'Confira o relatório de avaliação',
            files: [file]
          })
        } else {
          // Fallback para download
          downloadPDF(playerName, analysis, vocationalRecommendation, createdAt)
        }
      } else {
        // Fallback para download se Web Share API não estiver disponível
        downloadPDF(playerName, analysis, vocationalRecommendation, createdAt)
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      // Fallback para download em caso de erro
      downloadPDF(playerName, analysis, vocationalRecommendation, createdAt)
    }
  }

  const generateReport = async () => {
    if (!selectedPlayerId) return

    setGenerating(true)
    setReport(null)

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId: selectedPlayerId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar relatório')
      }

      const data = await response.json()
      setReport(data)

      // Recarregar lista de relatórios salvos
      loadSavedReports()
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert(error instanceof Error ? error.message : 'Erro ao gerar relatório. Tente novamente.')
    } finally {
      setGenerating(false)
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Relatório de Avaliação
            </h1>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Voltar
            </button>
          </div>

          {/* Seletor de Jogador */}
          <div className="mb-4">
            <label htmlFor="player-select" className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o jogador:
            </label>
            <select
              id="player-select"
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value)
                setReport(null)
                setSavedReports([])
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              {players.length === 0 ? (
                <option value="">Nenhum jogador disponível</option>
              ) : (
                players.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Botão Gerar Relatório */}
          <button
            onClick={generateReport}
            disabled={!selectedPlayerId || generating}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Gerando relatório...' : 'Gerar Relatório'}
          </button>
        </div>

        {/* Relatório Gerado */}
        {report && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Relatório de {selectedPlayer?.name}
              </h2>

              {/* Botões de Ação - Topo */}
              <div className="flex gap-2">
                <button
                  onClick={() => sharePDF(
                    selectedPlayer?.name || 'Jogador',
                    report.analysis,
                    report.vocationalRecommendation,
                    report.createdAt
                  )}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Compartilhar PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </button>
                <button
                  onClick={() => downloadPDF(
                    selectedPlayer?.name || 'Jogador',
                    report.analysis,
                    report.vocationalRecommendation,
                    report.createdAt
                  )}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Baixar PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-2">
                  Análise de Perfil
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {report.analysis}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-purple-700 mb-2">
                  Recomendação Vocacional
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {report.vocationalRecommendation}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de Carregamento */}
        {generating && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-gray-700">Analisando avaliações e gerando relatório...</p>
            </div>
          </div>
        )}

        {/* Relatórios Salvos */}
        {!generating && savedReports.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Relatórios Anteriores de {selectedPlayer?.name}
            </h2>

            {loadingReports ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {savedReports.map((savedReport, index) => (
                  <div key={savedReport.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-purple-700">
                          Relatório #{savedReports.length - index}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(savedReport.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Botões de Ação - Topo */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => sharePDF(
                            selectedPlayer?.name || 'Jogador',
                            savedReport.analysis,
                            savedReport.vocational_recommendation,
                            savedReport.created_at
                          )}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Compartilhar PDF"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => downloadPDF(
                            selectedPlayer?.name || 'Jogador',
                            savedReport.analysis,
                            savedReport.vocational_recommendation,
                            savedReport.created_at
                          )}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Baixar PDF"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Análise de Perfil:</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{savedReport.analysis}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mensagem quando não há relatórios */}
        {!generating && !loadingReports && savedReports.length === 0 && selectedPlayerId && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <p className="text-gray-500 text-center">
              Nenhum relatório gerado ainda para {selectedPlayer?.name}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
