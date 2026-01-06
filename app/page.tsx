"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Calendar } from "@/components/ui/calendar"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarIcon,
  BarChart3,
  Send,
  Target,
  AlertCircle,
  Camera,
  ShoppingCart,
  Calculator,
  Trash2,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"

interface Transaction {
  id: string
  tipo: "receita" | "despesa"
  valor: number
  categoria: string
  descricao: string
  data: Date
  tipoRenda?: "fixa" | "variavel"
}

interface ItemCompra {
  id: string
  nome: string
  valor: number
}

interface ListaCompras {
  id: string
  nome: string
  itens: ItemCompra[]
}

interface UserProfile {
  nome: string
  email?: string
  profissao?: string
  avatar?: string
}

const CATEGORIAS_RECEITA = ["Salário", "Freelance - Fotografia", "Eventos", "Investimentos", "Outros"]
const CATEGORIAS_DESPESA = [
  "Alimentação",
  "Delivery",
  "Transporte",
  "Moradia",
  "Saúde",
  "Estudos",
  "Lazer",
  "Trabalho - Equipamentos",
  "Trabalho - Apps",
  "Investimento Pessoal",
  "Compras",
  "Contas",
  "Outros",
]

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"]

interface Divisao503020 {
  necessidades: number
  desejos: number
  poupanca: number
}

interface Goal {
  id: string
  nome: string
  valorTotal: number
  valorAtual: number
  categoria: string
  prazo?: Date
}

export default function FinancasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("transactions")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("goals")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [listasCompras, setListasCompras] = useState<ListaCompras[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("listasCompras")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userProfile")
      return saved ? JSON.parse(saved) : { nome: "Usuário" }
    }
    return { nome: "Usuário" }
  })

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<UserProfile>({ nome: "" })

  const [chatMessage, setChatMessage] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [is503020DialogOpen, setIs503020DialogOpen] = useState(false)
  const [valorRecebido, setValorRecebido] = useState("")
  const [divisaoCalculada, setDivisaoCalculada] = useState<Divisao503020 | null>(null)

  const [isListaComprasDialogOpen, setIsListaComprasDialogOpen] = useState(false)
  const [novaListaCompras, setNovaListaCompras] = useState({ nome: "" })
  const [listaEditando, setListaEditando] = useState<string | null>(null)
  const [novoItem, setNovoItem] = useState({ nome: "", valor: "" })

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [filtroMes, setFiltroMes] = useState<number>(new Date().getMonth())
  const [filtroAno, setFiltroAno] = useState<number>(2026) // Assuming this year for filter, adjust if needed
  const [ultimoRegistro, setUltimoRegistro] = useState<Date>(new Date())

  const [novaTransacao, setNovaTransacao] = useState({
    tipo: "despesa" as "receita" | "despesa",
    valor: "",
    categoria: "",
    descricao: "",
    data: new Date(),
    tipoRenda: "fixa" as "fixa" | "variavel",
  })

  const [novaMeta, setNovaMeta] = useState({
    nome: "",
    valorTotal: "",
    categoria: "",
    prazo: "",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("transactions", JSON.stringify(transactions))
      localStorage.setItem("goals", JSON.stringify(goals))
      localStorage.setItem("listasCompras", JSON.stringify(listasCompras))
      localStorage.setItem("userProfile", JSON.stringify(userProfile))
    }
  }, [transactions, goals, listasCompras, userProfile])

  const calcularDivisao503020 = () => {
    const valor = Number.parseFloat(valorRecebido)
    if (isNaN(valor) || valor <= 0) return

    const divisao: Divisao503020 = {
      necessidades: valor * 0.5, // 50%
      desejos: valor * 0.3, // 30%
      poupanca: valor * 0.2, // 20%
    }

    setDivisaoCalculada(divisao)
  }

  const processarMensagemChat = () => {
    const msg = chatMessage.toLowerCase()

    // Simple pattern matching for "gastei X com Y"
    const padraoGasto = /gastei?\s*(r\$?\s*)?(\d+(?:[.,]\d+)?)\s*(?:reais?)?\s*com\s+(.+)/i
    const padraoReceita = /recebi\s*(r\$?\s*)?(\d+(?:[.,]\d+)?)\s*(?:reais?)?\s*(?:de|com)?\s*(.+)/i

    let match = msg.match(padraoGasto)
    if (match) {
      const valor = Number.parseFloat(match[2].replace(",", "."))
      const descricao = match[3].trim()

      // Try to categorize automatically
      let categoria = "Outros"
      if (descricao.includes("transporte") || descricao.includes("uber") || descricao.includes("ônibus")) {
        categoria = "Transporte"
      } else if (descricao.includes("delivery") || descricao.includes("ifood") || descricao.includes("comida")) {
        categoria = "Delivery"
      } else if (descricao.includes("café") || descricao.includes("lanche") || descricao.includes("almoço")) {
        categoria = "Alimentação"
      } else if (descricao.includes("curso") || descricao.includes("livro") || descricao.includes("estudo")) {
        categoria = "Estudos"
      }

      const transacao: Transaction = {
        id: Date.now().toString(),
        tipo: "despesa",
        valor,
        categoria,
        descricao,
        data: new Date(),
      }

      setTransactions([...transactions, transacao])
      setChatMessage("")
      setUltimoRegistro(new Date())
      return
    }

    match = msg.match(padraoReceita)
    if (match) {
      const valor = Number.parseFloat(match[2].replace(",", "."))
      const descricao = match[3].trim()

      let categoria = "Outros"
      if (descricao.includes("freela") || descricao.includes("freelance") || descricao.includes("fotografia")) {
        categoria = "Freelance - Fotografia"
      } else if (descricao.includes("evento") || descricao.includes("casamento") || descricao.includes("festa")) {
        categoria = "Eventos"
      } else if (descricao.includes("salário") || descricao.includes("salario")) {
        categoria = "Salário"
      }

      const transacao: Transaction = {
        id: Date.now().toString(),
        tipo: "receita",
        valor,
        categoria,
        descricao,
        data: new Date(),
        tipoRenda: categoria.includes("Freelance") || categoria.includes("Eventos") ? "variavel" : "fixa",
      }

      setTransactions([...transactions, transacao])
      setChatMessage("")
      setUltimoRegistro(new Date())
    }
  }

  const adicionarTransacao = () => {
    if (!novaTransacao.valor || !novaTransacao.categoria) return

    const transacao: Transaction = {
      id: Date.now().toString(),
      tipo: novaTransacao.tipo,
      valor: Number.parseFloat(novaTransacao.valor),
      categoria: novaTransacao.categoria,
      descricao: novaTransacao.descricao,
      data: novaTransacao.data,
      tipoRenda: novaTransacao.tipo === "receita" ? novaTransacao.tipoRenda : undefined,
    }

    setTransactions([...transactions, transacao])
    setNovaTransacao({
      tipo: "despesa",
      valor: "",
      categoria: "",
      descricao: "",
      data: new Date(),
      tipoRenda: "fixa",
    })
    setIsDialogOpen(false)
    setUltimoRegistro(new Date())
  }

  const adicionarMeta = () => {
    if (!novaMeta.nome || !novaMeta.valorTotal) return

    const meta: Goal = {
      id: Date.now().toString(),
      nome: novaMeta.nome,
      valorTotal: Number.parseFloat(novaMeta.valorTotal),
      valorAtual: 0,
      categoria: novaMeta.categoria,
      prazo: novaMeta.prazo ? new Date(novaMeta.prazo) : undefined,
    }

    setGoals([...goals, meta])
    setNovaMeta({
      nome: "",
      valorTotal: "",
      categoria: "",
      prazo: "",
    })
    setIsGoalDialogOpen(false)
  }

  const adicionarValorMeta = (goalId: string, valor: number) => {
    setGoals(
      goals.map((g) => (g.id === goalId ? { ...g, valorAtual: Math.min(g.valorAtual + valor, g.valorTotal) } : g)),
    )
  }

  const adicionarListaCompras = () => {
    if (novaListaCompras.nome.trim()) {
      const novaLista: ListaCompras = {
        id: Date.now().toString(),
        nome: novaListaCompras.nome,
        itens: [],
      }
      setListasCompras([...listasCompras, novaLista])
      setNovaListaCompras({ nome: "" })
      setIsListaComprasDialogOpen(false)
    }
  }

  const adicionarItemNaLista = (listaId: string) => {
    if (novoItem.nome.trim() && novoItem.valor) {
      const item: ItemCompra = {
        id: Date.now().toString(),
        nome: novoItem.nome,
        valor: Number.parseFloat(novoItem.valor),
      }
      setListasCompras(
        listasCompras.map((lista) => (lista.id === listaId ? { ...lista, itens: [...lista.itens, item] } : lista)),
      )
      setNovoItem({ nome: "", valor: "" })
    }
  }

  const removerItemDaLista = (listaId: string, itemId: string) => {
    setListasCompras(
      listasCompras.map((lista) =>
        lista.id === listaId ? { ...lista, itens: lista.itens.filter((item) => item.id !== itemId) } : lista,
      ),
    )
  }

  const removerLista = (listaId: string) => {
    setListasCompras(listasCompras.filter((lista) => lista.id !== listaId))
  }

  const calcularTotalLista = (lista: ListaCompras) => {
    return lista.itens.reduce((acc, item) => acc + item.valor, 0)
  }

  const calcularTotalTodasListas = () => {
    return listasCompras.reduce((acc, lista) => acc + calcularTotalLista(lista), 0)
  }

  const handleOpenProfileDialog = () => {
    setEditProfile({ ...userProfile })
    setIsProfileDialogOpen(true)
  }

  const handleSaveProfile = () => {
    if (editProfile.nome.trim()) {
      setUserProfile(editProfile)
      setIsProfileDialogOpen(false)
    }
  }

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const transacoesFiltradas = useMemo(() => {
    return transactions.filter((t) => {
      const dataTransacao = new Date(t.data)
      return dataTransacao.getMonth() === filtroMes && dataTransacao.getFullYear() === filtroAno
    })
  }, [transactions, filtroMes, filtroAno])

  const totais = useMemo(() => {
    return transacoesFiltradas.reduce(
      (acc, t) => {
        if (t.tipo === "receita") {
          acc.receitas += t.valor
          if (t.tipoRenda === "variavel") {
            acc.receitasVariaveis += t.valor
          } else {
            acc.receitasFixas += t.valor
          }
        } else {
          acc.despesas += t.valor
        }
        return acc
      },
      { receitas: 0, despesas: 0, receitasFixas: 0, receitasVariaveis: 0 },
    )
  }, [transacoesFiltradas])

  const saldo = totais.receitas - totais.despesas

  const gastosPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {}
    transacoesFiltradas
      .filter((t) => t.tipo === "despesa")
      .forEach((t) => {
        categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor
      })

    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transacoesFiltradas])

  const receitasPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {}
    transacoesFiltradas
      .filter((t) => t.tipo === "receita")
      .forEach((t) => {
        categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor
      })

    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transacoesFiltradas])

  const gastosPorDia = useMemo(() => {
    const dias: Record<string, number> = {}
    transacoesFiltradas
      .filter((t) => t.tipo === "despesa")
      .forEach((t) => {
        const dia = format(new Date(t.data), "dd/MM", { locale: ptBR })
        dias[dia] = (dias[dia] || 0) + t.valor
      })

    return Object.entries(dias)
      .map(([dia, valor]) => ({ dia, valor }))
      .sort((a, b) => a.dia.localeCompare(b.dia))
  }, [transacoesFiltradas])

  const alertas = useMemo(() => {
    const alerts: { tipo: "warning" | "info" | "success"; mensagem: string }[] = []

    // Check if not registering for days
    const diasSemRegistro = Math.floor((new Date().getTime() - ultimoRegistro.getTime()) / (1000 * 60 * 60 * 24))
    if (diasSemRegistro > 3 && transactions.length > 0) {
      alerts.push({
        tipo: "info",
        mensagem: `Já faz ${diasSemRegistro} dias que você não registra gastos.`,
      })
    }

    // Check delivery spending
    const gastoDelivery = gastosPorCategoria.find((g) => g.name === "Delivery")
    if (gastoDelivery && totais.despesas > 0 && gastoDelivery.value > totais.despesas * 0.2) {
      const porcentagem = ((gastoDelivery.value / totais.despesas) * 100).toFixed(0)
      alerts.push({
        tipo: "warning",
        mensagem: `Você está gastando ${porcentagem}% do seu orçamento com delivery!`,
      })
    }

    // Check if spending more than earning
    if (totais.despesas > totais.receitas) {
      alerts.push({
        tipo: "warning",
        mensagem: "Atenção! Suas despesas estão maiores que suas receitas este mês.",
      })
    }

    // Positive feedback
    if (saldo > 0 && totais.receitas > 0) {
      const taxaPoupanca = (saldo / totais.receitas) * 100
      if (taxaPoupanca >= 10) {
        alerts.push({
          tipo: "success",
          mensagem: `Parabéns! Você está economizando ${taxaPoupanca.toFixed(0)}% da sua renda!`,
        })
      }
    }

    return alerts
  }, [gastosPorCategoria, totais, saldo, ultimoRegistro, transactions.length])

  const resumoMensal = useMemo(() => {
    if (gastosPorCategoria.length === 0 || totais.despesas === 0) return null

    const maiorGasto = gastosPorCategoria[0]
    const porcentagemMaiorGasto = ((maiorGasto.value / totais.despesas) * 100).toFixed(0)

    return {
      maiorCategoria: maiorGasto.name,
      valorMaiorCategoria: maiorGasto.value,
      porcentagemMaiorGasto,
    }
  }, [gastosPorCategoria, totais.despesas])

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                {/* <h1 className="text-2xl font-bold">Controle Financeiro</h1> */}
                <h1 className="text-2xl font-bold text-foreground">Controle Financeiro</h1>
                <p className="text-sm text-muted-foreground">Gerencie suas finanças com inteligência</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenProfileDialog} className="gap-2 bg-transparent">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {getInitials(userProfile.nome)}
                </div>
                <span className="hidden md:inline">{userProfile.nome}</span>
              </Button>
              <Dialog open={is503020DialogOpen} onOpenChange={setIs503020DialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calculator className="w-4 h-4 mr-2" />
                    {/* <PieChart className="mr-2 h-4 w-4" /> */}
                    Regra 50/30/20
                  </Button>
                </DialogTrigger>
                {/* Diálogo 50/30/20 */}
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Divisão com Regra 50/30/20</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <Label>Quanto você recebeu?</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={valorRecebido}
                          onChange={(e) => setValorRecebido(e.target.value)}
                        />
                        <Button onClick={calcularDivisao503020}>Calcular</Button>
                      </div>
                    </div>

                    {divisaoCalculada && (
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <Card className="p-4 border-blue-500/50 bg-blue-500/10">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-lg">Necessidades (50%)</h4>
                              <span className="text-2xl font-bold text-blue-500">
                                R$ {divisaoCalculada.necessidades.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Moradia, alimentação, transporte, contas essenciais
                            </p>
                          </Card>

                          <Card className="p-4 border-amber-500/50 bg-amber-500/10">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-lg">Desejos (30%)</h4>
                              <span className="text-2xl font-bold text-amber-500">
                                R$ {divisaoCalculada.desejos.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Lazer, delivery, compras não essenciais, entretenimento
                            </p>
                          </Card>

                          <Card className="p-4 border-green-500/50 bg-green-500/10">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-lg">Poupança (20%)</h4>
                              <span className="text-2xl font-bold text-green-500">
                                R$ {divisaoCalculada.poupanca.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Reserva de emergência, investimentos, metas futuras
                            </p>
                          </Card>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Como usar essa divisão:</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Use esses valores como guia para suas despesas mensais</li>
                            <li>• Ajuste conforme sua realidade, mas tente se aproximar dessa proporção</li>
                            <li>• O importante é sempre guardar alguma parte da sua renda</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={() => setIsGoalDialogOpen(true)} variant="outline" size="sm">
                <Target className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
              {/* Adicionando botão para criar lista de compras */}
              <Button onClick={() => setIsListaComprasDialogOpen(true)} variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Listas de Compras
              </Button>
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            {alertas.map((alerta, idx) => (
              <Card
                key={idx}
                className={`p-4 ${
                  alerta.tipo === "warning"
                    ? "border-amber-500 bg-amber-500/10"
                    : alerta.tipo === "success"
                      ? "border-green-500 bg-green-500/10"
                      : "border-blue-500 bg-blue-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${
                      alerta.tipo === "warning"
                        ? "text-amber-500"
                        : alerta.tipo === "success"
                          ? "text-green-500"
                          : "text-blue-500"
                    }`}
                  />
                  <p className="flex-1">{alerta.mensagem}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Receitas</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">R$ {totais.receitas.toFixed(2)}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Fixa: R$ {totais.receitasFixas.toFixed(2)}</p>
              <p>Variável: R$ {totais.receitasVariaveis.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Despesas</h3>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold">R$ {totais.despesas.toFixed(2)}</p>
            {resumoMensal && (
              <p className="text-xs text-muted-foreground mt-2">
                Maior gasto: {resumoMensal.maiorCategoria} ({resumoMensal.porcentagemMaiorGasto}%)
              </p>
            )}
          </Card>

          <Card
            className={`p-6 bg-gradient-to-br ${
              saldo >= 0
                ? "from-blue-500/20 to-blue-600/10 border-blue-500/50"
                : "from-red-500/20 to-red-600/10 border-red-500/50"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Saldo</h3>
              <DollarSign className={`w-5 h-5 ${saldo >= 0 ? "text-blue-500" : "text-red-500"}`} />
            </div>
            <p className="text-3xl font-bold">R$ {saldo.toFixed(2)}</p>
            {saldo > 0 && totais.receitas > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Taxa de poupança: {((saldo / totais.receitas) * 100).toFixed(0)}%
              </p>
            )}
          </Card>
        </div>

        {/* Registro Rápido por Chat */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Registro Rápido
          </h3>
          <div className="flex gap-2">
            <Textarea
              placeholder='Digite: "Gastei 32 reais com transporte" ou "Recebi 500 de freela fotografia"'
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  processarMensagemChat()
                }
              }}
              className="flex-1 min-h-[60px]"
            />
            <Button onClick={processarMensagemChat} size="lg">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* Metas */}
        {goals.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Minhas Metas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const progresso = (goal.valorAtual / goal.valorTotal) * 100
                const falta = goal.valorTotal - goal.valorAtual

                return (
                  <Card key={goal.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{goal.nome}</h4>
                          <Badge variant="secondary" className="mt-1">
                            {goal.categoria}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{progresso.toFixed(0)}%</span>
                      </div>

                      <Progress value={progresso} className="h-2" />

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          R$ {goal.valorAtual.toFixed(2)} de R$ {goal.valorTotal.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">Falta: R$ {falta.toFixed(2)}</span>
                      </div>

                      {goal.prazo && (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {format(new Date(goal.prazo), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Input type="number" placeholder="Valor" id={`valor-meta-${goal.id}`} className="flex-1" />
                        <Button
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`valor-meta-${goal.id}`) as HTMLInputElement
                            const valor = Number.parseFloat(input.value)
                            if (valor > 0) {
                              adicionarValorMeta(goal.id, valor)
                              input.value = ""
                            }
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </Card>
        )}

        {/* Adicionando seção de listas de compras */}
        {listasCompras.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Listas de Compras</h2>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Geral</p>
                <p className="text-2xl font-bold text-primary">R$ {calcularTotalTodasListas().toFixed(2)}</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listasCompras.map((lista) => (
                <Card key={lista.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{lista.nome}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => removerLista(lista.id)} className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <CardDescription>Total: R$ {calcularTotalLista(lista).toFixed(2)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {lista.itens.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-sm">{item.nome}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">R$ {item.valor.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerItemDaLista(lista.id, item.id)}
                              className="h-6 w-6"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {listaEditando === lista.id ? (
                      <div className="space-y-2 pt-2 border-t">
                        <Input
                          placeholder="Nome do produto"
                          value={novoItem.nome}
                          onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Valor"
                            value={novoItem.valor}
                            onChange={(e) => setNovoItem({ ...novoItem, valor: e.target.value })}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              adicionarItemNaLista(lista.id)
                              setListaEditando(null)
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setListaEditando(null)
                              setNovoItem({ nome: "", valor: "" })
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setListaEditando(lista.id)} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="visao-geral" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="transacoes">Transações</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="renda-variavel">Renda Variável</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de Despesas por Categoria */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Despesas por Categoria
                </h3>
                {gastosPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gastosPorCategoria}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`}
                      >
                        {gastosPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhuma despesa registrada
                  </div>
                )}
              </Card>

              {/* Gráfico de Receitas por Categoria */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Receitas por Categoria
                </h3>
                {receitasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={receitasPorCategoria}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: R$ ${value.toFixed(0)}`}
                      >
                        {receitasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhuma receita registrada
                  </div>
                )}
              </Card>
            </div>

            {/* Gráfico de Gastos Diários */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Despesas Diárias
              </h3>
              {gastosPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gastosPorDia}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Bar dataKey="valor" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum gasto diário registrado
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="transacoes">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Todas as Transações</h3>
              {transacoesFiltradas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transacoesFiltradas
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((transacao) => (
                          <TableRow key={transacao.id}>
                            <TableCell>{format(new Date(transacao.data), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant={transacao.tipo === "receita" ? "default" : "destructive"}
                                  className="w-fit"
                                >
                                  {transacao.tipo === "receita" ? "Receita" : "Despesa"}
                                </Badge>
                                {transacao.tipoRenda && (
                                  <Badge variant="outline" className="w-fit text-xs">
                                    {transacao.tipoRenda === "variavel" ? "Variável" : "Fixa"}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{transacao.categoria}</TableCell>
                            <TableCell>{transacao.descricao || "-"}</TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                transacao.tipo === "receita" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transacao.tipo === "receita" ? "+" : "-"} R$ {transacao.valor.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma transação encontrada para este período
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="calendario">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Calendário {filtroAno}</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md"
                  locale={ptBR}
                />
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Transações de{" "}
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecione uma data"}
                </h3>
                {selectedDate ? (
                  <div className="space-y-3">
                    {transacoesFiltradas
                      .filter((t) => format(new Date(t.data), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"))
                      .map((transacao) => (
                        <Card key={transacao.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant={transacao.tipo === "receita" ? "default" : "destructive"}>
                                {transacao.tipo === "receita" ? "Receita" : "Despesa"}
                              </Badge>
                              <p className="font-medium mt-2">{transacao.categoria}</p>
                              <p className="text-sm text-muted-foreground">{transacao.descricao}</p>
                            </div>
                            <p
                              className={`text-xl font-bold ${
                                transacao.tipo === "receita" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {transacao.tipo === "receita" ? "+" : "-"} R$ {transacao.valor.toFixed(2)}
                            </p>
                          </div>
                        </Card>
                      ))}
                    {transacoesFiltradas.filter(
                      (t) => format(new Date(t.data), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"),
                    ).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">Nenhuma transação neste dia</div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Selecione uma data no calendário</div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="renda-variavel" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Análise de Renda Variável
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/50">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Total de Freelas</h4>
                  <p className="text-2xl font-bold">R$ {totais.receitasVariaveis.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transacoesFiltradas.filter((t) => t.tipoRenda === "variavel").length} transações
                  </p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Renda Fixa</h4>
                  <p className="text-2xl font-bold">R$ {totais.receitasFixas.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Salário e outras rendas fixas</p>
                </Card>
              </div>

              {receitasPorCategoria.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Receitas por Categoria</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={receitasPorCategoria}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {receitasPorCategoria.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-green-500 font-bold">R$ {cat.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Adicionando dialog para criar nova lista de compras */}
      <Dialog open={isListaComprasDialogOpen} onOpenChange={setIsListaComprasDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Lista de Compras</DialogTitle>
            <DialogDescription>Crie uma nova lista para organizar suas compras</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nomeLista">Nome da Lista</Label>
              <Input
                id="nomeLista"
                placeholder="Ex: Supermercado, Material Escolar, Casa"
                value={novaListaCompras.nome}
                onChange={(e) => setNovaListaCompras({ nome: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsListaComprasDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionarListaCompras}>Criar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo 50/30/20 */}
      <Dialog open={is503020DialogOpen} onOpenChange={setIs503020DialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Divisão com Regra 50/30/20</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Quanto você recebeu?</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                />
                <Button onClick={calcularDivisao503020}>Calcular</Button>
              </div>
            </div>

            {divisaoCalculada && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  <Card className="p-4 border-blue-500/50 bg-blue-500/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-lg">Necessidades (50%)</h4>
                      <span className="text-2xl font-bold text-blue-500">
                        R$ {divisaoCalculada.necessidades.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Moradia, alimentação, transporte, contas essenciais</p>
                  </Card>

                  <Card className="p-4 border-amber-500/50 bg-amber-500/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-lg">Desejos (30%)</h4>
                      <span className="text-2xl font-bold text-amber-500">
                        R$ {divisaoCalculada.desejos.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lazer, delivery, compras não essenciais, entretenimento
                    </p>
                  </Card>

                  <Card className="p-4 border-green-500/50 bg-green-500/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-lg">Poupança (20%)</h4>
                      <span className="text-2xl font-bold text-green-500">
                        R$ {divisaoCalculada.poupanca.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Reserva de emergência, investimentos, metas futuras</p>
                  </Card>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Como usar essa divisão:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Use esses valores como guia para suas despesas mensais</li>
                    <li>• Ajuste conforme sua realidade, mas tente se aproximar dessa proporção</li>
                    <li>• O importante é sempre guardar alguma parte da sua renda</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Metas */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome da Meta</Label>
              <Input
                placeholder="Ex: Notebook novo, Viagem, Faculdade"
                value={novaMeta.nome}
                onChange={(e) => setNovaMeta({ ...novaMeta, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Total</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={novaMeta.valorTotal}
                onChange={(e) => setNovaMeta({ ...novaMeta, valorTotal: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={novaMeta.categoria}
                onValueChange={(value) => setNovaMeta({ ...novaMeta, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equipamento">Equipamento</SelectItem>
                  <SelectItem value="Viagem">Viagem</SelectItem>
                  <SelectItem value="Educação">Educação</SelectItem>
                  <SelectItem value="Reserva">Reserva de Emergência</SelectItem>
                  <SelectItem value="Investimento">Investimento</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prazo (Opcional)</Label>
              <Input
                type="date"
                value={novaMeta.prazo}
                onChange={(e) => setNovaMeta({ ...novaMeta, prazo: e.target.value })}
              />
            </div>

            <Button onClick={adicionarMeta} className="w-full">
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                {getInitials(editProfile.nome || "U")}
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={editProfile.nome}
                  onChange={(e) => setEditProfile({ ...editProfile, nome: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={editProfile.email || ""}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Profissão</label>
                <input
                  type="text"
                  placeholder="Ex: Fotógrafo, Designer, etc"
                  value={editProfile.profissao || ""}
                  onChange={(e) => setEditProfile({ ...editProfile, profissao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProfile} disabled={!editProfile.nome.trim()}>
              Salvar Perfil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Nova Transação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={novaTransacao.tipo}
                onValueChange={(value: "receita" | "despesa") =>
                  setNovaTransacao({ ...novaTransacao, tipo: value, categoria: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {novaTransacao.tipo === "receita" && (
              <div className="space-y-2">
                <Label>Tipo de Renda</Label>
                <Select
                  value={novaTransacao.tipoRenda}
                  onValueChange={(value: "fixa" | "variavel") =>
                    setNovaTransacao({ ...novaTransacao, tipoRenda: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixa">Renda Fixa (Salário)</SelectItem>
                    <SelectItem value="variavel">Renda Variável (Freelas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={novaTransacao.valor}
                onChange={(e) => setNovaTransacao({ ...novaTransacao, valor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={novaTransacao.categoria}
                onValueChange={(value) => setNovaTransacao({ ...novaTransacao, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(novaTransacao.tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição da transação"
                value={novaTransacao.descricao}
                onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })}
              />
            </div>

            <Button onClick={adicionarTransacao} className="w-full">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
