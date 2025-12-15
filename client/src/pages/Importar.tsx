import { DTELayout } from "@/components/DTELayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";

type DatasetType = "eleitorado" | "candidatos" | "partidos" | "coligacoes" | "resultados" | "votos_nulos_brancos";

const datasetTypes: { value: DatasetType; label: string; description: string }[] = [
  { value: "eleitorado", label: "Perfil do Eleitorado (TSE)", description: "Dados demográficos dos eleitores - perfil_eleitorado" },
  { value: "candidatos", label: "Candidatos (TSE)", description: "Cadastro de candidatos - consulta_cand" },
  { value: "partidos", label: "Partidos (TSE)", description: "Cadastro de partidos políticos - consulta_legendas" },
  { value: "coligacoes", label: "Coligações (TSE)", description: "Coligações partidárias - consulta_coligacao" },
  { value: "resultados", label: "Resultados Eleitorais", description: "Votação por candidato e partido" },
  { value: "votos_nulos_brancos", label: "Votos Nulos e Brancos", description: "Dados de votos nulos, brancos e abstenções" },
];

function getStatusIcon(status: string) {
  switch (status) {
    case "concluido":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case "processando":
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case "erro":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-amber-500" />;
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pendente: "Pendente",
    processando: "Processando",
    concluido: "Concluído",
    erro: "Erro",
  };
  return labels[status] || status;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "concluido":
      return "dte-badge-success";
    case "processando":
      return "dte-badge-info";
    case "erro":
      return "dte-badge-danger";
    default:
      return "dte-badge-warning";
  }
}

export default function Importar() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDataset, setTipoDataset] = useState<DatasetType | "">("eleitorado");
  const [anoReferencia, setAnoReferencia] = useState("2024");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: importacoes, refetch: refetchImportacoes } = trpc.importacoes.list.useQuery(undefined, {
    enabled: !!user && ["admin", "gestor"].includes(user.role),
  });

  const createImportacao = trpc.importacoes.create.useMutation();
  const processData = trpc.importacoes.processData.useMutation();

  // Redirect if not authorized
  if (!authLoading && (!user || !["admin", "gestor"].includes(user.role))) {
    return (
      <DTELayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">
            Esta área é restrita a administradores e gestores de campanha.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </DTELayout>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
        toast.error("Formato inválido. Use arquivos CSV ou Excel.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !tipoDataset) {
      toast.error("Selecione um arquivo e o tipo de dataset.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file reading and parsing
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Parse CSV (simplified)
        const lines = content.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
        const data = lines.slice(1).map(line => {
          const values = line.split(",");
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || "";
          });
          return row;
        });

        setUploadProgress(30);

        // Create import record
        const result = await createImportacao.mutateAsync({
          nomeArquivo: selectedFile.name,
          tipoArquivo: selectedFile.type || "text/csv",
          tipoDataset,
          anoReferencia: parseInt(anoReferencia),
        });

        setUploadProgress(50);

        if (result.id) {
          // Process the data
          await processData.mutateAsync({
            importacaoId: result.id,
            tipoDataset,
            data,
            anoReferencia: parseInt(anoReferencia),
          });

          setUploadProgress(100);
          toast.success("Dados importados com sucesso!");
          refetchImportacoes();
        }
      };

      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo.");
        setIsUploading(false);
      };

      reader.readAsText(selectedFile);
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar dados.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1000);
    }
  };

  return (
    <DTELayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Dados</h1>
          <p className="text-muted-foreground">
            Carregue datasets eleitorais em formato CSV ou Excel
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload de Dataset
            </CardTitle>
            <CardDescription>
              Selecione o arquivo e configure as opções de importação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Drop Zone */}
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              {selectedFile ? (
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-foreground">Clique para selecionar um arquivo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos suportados: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tipo de Dataset</Label>
                <Select value={tipoDataset} onValueChange={(value) => setTipoDataset(value as DatasetType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de dados" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ano de Referência</Label>
                <Select value={anoReferencia} onValueChange={setAnoReferencia}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2018">2018</SelectItem>
                    <SelectItem value="2016">2016</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processando...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !tipoDataset || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Dados
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template Downloads */}
        <Card>
          <CardHeader>
            <CardTitle>Templates de Importação</CardTitle>
            <CardDescription>
              Baixe os modelos de planilha para cada tipo de dataset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasetTypes.map((type) => (
                <div
                  key={type.value}
                  className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      <Button variant="link" className="h-auto p-0 mt-2 text-xs" onClick={() => toast.info("Template em desenvolvimento")}>
                        Baixar template CSV
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Importações</CardTitle>
            <CardDescription>
              Acompanhe o status das importações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importacoes && importacoes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Arquivo</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Ano</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Registros</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importacoes.map((imp) => (
                      <tr key={imp.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium truncate max-w-[200px]">{imp.nomeArquivo}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {datasetTypes.find(t => t.value === imp.tipoDataset)?.label || imp.tipoDataset}
                        </td>
                        <td className="py-3 px-4 text-sm">{imp.anoReferencia}</td>
                        <td className="py-3 px-4 text-right font-mono text-sm">
                          {imp.registrosImportados?.toLocaleString("pt-BR") || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(imp.status || "pendente")}
                            <span className={`dte-badge ${getStatusBadgeClass(imp.status || "pendente")}`}>
                              {getStatusLabel(imp.status || "pendente")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(imp.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma importação realizada ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DTELayout>
  );
}
