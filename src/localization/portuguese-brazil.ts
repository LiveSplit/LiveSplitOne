import { Label } from ".";

export function resolveBrazilianPortuguese(text: Label): string {
    switch (text) {
        case Label.Ok:
            return "OK";
        case Label.Cancel:
            return "Cancelar";
        case Label.Settings:
            return "Configurações";
        case Label.Language:
            return "Idioma";
        case Label.LanguageDescription:
            return "Define o idioma usado no aplicativo.";
        case Label.LanguageAuto:
            return "Automático";
        case Label.Theme:
            return "Tema";
        case Label.ThemeDescription:
            return "Determina se deve seguir o tema do sistema ou forçar um modo claro ou escuro.";
        case Label.ThemeLightMode:
            return "Modo claro";
        case Label.ThemeDarkMode:
            return "Modo escuro";
        case Label.HotkeysHeading:
            return "Teclas de atalho";
        case Label.GeneralHeading:
            return "Geral";
        case Label.NetworkHeading:
            return "Rede";
        case Label.FrameRate:
            return "Taxa de quadros";
        case Label.FrameRateDescription:
            return "Determina a taxa de quadros em que o cronômetro é exibido. “Sensível à bateria” tenta determinar o tipo de dispositivo e o estado de carregamento para selecionar uma boa taxa de quadros. “Correspondente à tela” faz o cronômetro corresponder à taxa de atualização da tela.";
        case Label.FrameRateBatteryAware:
            return "Sensível à bateria";
        case Label.FrameRateMatchScreen:
            return "Correspondente à tela";
        case Label.SaveOnReset:
            return "Salvar ao resetar";
        case Label.SaveOnResetDescription:
            return "Determina se os splits devem ser salvos automaticamente ao resetar o cronômetro.";
        case Label.ShowControlButtons:
            return "Mostrar botões de controle";
        case Label.ShowControlButtonsDescription:
            return "Determina se deve mostrar botões abaixo do cronômetro que permitem controlá-lo. Quando desativado, você deve usar as teclas de atalho.";
        case Label.ShowManualGameTimeInput:
            return "Mostrar entrada manual do tempo de jogo";
        case Label.ShowManualGameTimeInputDescription:
            return "Mostra uma caixa de texto abaixo do cronômetro que permite inserir manualmente o tempo de jogo. Você inicia o cronômetro e faz splits pressionando a tecla Enter na caixa de texto. Certifique-se de comparar com “Tempo de jogo”.";
        case Label.ManualGameTimeMode:
            return "Modo de tempo de jogo manual";
        case Label.ManualGameTimeModeDescription:
            return "Determina se o tempo de jogo manual é inserido como tempos de segmento ou tempos de split.";
        case Label.ManualGameTimeModeSegmentTimes:
            return "Tempos de segmento";
        case Label.ManualGameTimeModeSplitTimes:
            return "Tempos de split";
        case Label.AlwaysOnTop:
            return "Sempre no topo";
        case Label.AlwaysOnTopDescription:
            return "Mantém a janela sempre acima das outras janelas.";
        case Label.SpeedrunComIntegration:
            return "Integração com Speedrun.com";
        case Label.SpeedrunComIntegrationDescription:
            return "Consulta a lista de jogos, categorias e rankings do Speedrun.com.";
        case Label.ServerConnection:
            return "Conexão com servidor";
        case Label.ServerConnectionDescription:
            return "Permite conectar a um servidor WebSocket que pode controlar o cronômetro enviando vários comandos. Os comandos atualmente são um subconjunto dos comandos suportados pelo LiveSplit original.";
        case Label.ServerConnectionExperimental:
            return "Este recurso é experimental e o protocolo provavelmente mudará no futuro.";
        case Label.TheRunGgIntegration:
            return "Integração com therun.gg";
        case Label.TheRunGgIntegrationDescription:
            return "Integra-se ao therun.gg para rastreamento ao vivo das runs e envio automático de estatísticas. Você precisa de uma chave de upload do therun.gg para usar este recurso.";
        case Label.TheRunGgLiveTracking:
            return "Rastreamento ao vivo";
        case Label.TheRunGgLiveTrackingDescription:
            return "Quando ativado, os dados de split ao vivo são enviados para o therun.gg após cada ação de split, permitindo o rastreamento da run em tempo real no site.";
        case Label.TheRunGgStatsUploading:
            return "Envio de estatísticas";
        case Label.TheRunGgStatsUploadingDescription:
            return "Quando ativado, o arquivo de splits é enviado ao therun.gg após cada reset ou run concluída, sincronizando automaticamente suas runs com o site.";
        case Label.HotkeyAlreadyInUse:
            return "A tecla de atalho já está em uso.";
        case Label.Start:
            return "Iniciar";
        case Label.Resume:
            return "Retomar";
        case Label.Pause:
            return "Pausar";
        case Label.UndoSplit:
            return "Desfazer split";
        case Label.Reset:
            return "Resetar";
        case Label.SkipSplit:
            return "Pular split";
        case Label.ManualGameTimePlaceholder:
            return "Tempo de jogo manual";
        case Label.LiveSplitLogoAlt:
            return "Logo do LiveSplit";
        case Label.LiveSplitOne:
            return "LiveSplit One";
        case Label.Splits:
            return "Splits";
        case Label.Layout:
            return "Layout";
        case Label.CompareAgainst:
            return "Comparar com";
        case Label.RealTime:
            return "Tempo real";
        case Label.GameTime:
            return "Tempo de jogo";
        case Label.PopOut:
            return "Pop-out";
        case Label.About:
            return "Sobre";
        case Label.Back:
            return "Voltar";
        case Label.AboutVersionPrefix:
            return "Versão:";
        case Label.AboutDescription:
            return "LiveSplit One é uma versão multiplataforma do LiveSplit, o cronômetro elegante e altamente personalizável para speedrunners.";
        case Label.AboutViewSource:
            return "Ver código-fonte no GitHub";
        case Label.AboutRecentChanges:
            return "Alterações recentes";
        case Label.AboutContributors:
            return "Contribuidores";
        case Label.Loading:
            return "Carregando…";
        case Label.Add:
            return "Adicionar";
        case Label.Import:
            return "Importar";
        case Label.OpenSplits:
            return "Abrir splits";
        case Label.EditSplits:
            return "Editar splits";
        case Label.ExportSplits:
            return "Exportar splits";
        case Label.CopySplits:
            return "Copiar splits";
        case Label.RemoveSplits:
            return "Remover splits";
        case Label.Untitled:
            return "Sem título";
        case Label.NoCategory:
            return "—";
        case Label.DiscardChangesTitle:
            return "Descartar alterações?";
        case Label.DiscardChangesDescription:
            return "Seus splits atuais foram modificados e têm alterações não salvas. Deseja continuar e descartar essas alterações?";
        case Label.DeleteSplitsTitle:
            return "Excluir splits?";
        case Label.DeleteSplitsDescription:
            return "Tem certeza de que deseja excluir os splits? Esta operação não pode ser desfeita.";
        case Label.SaveBestTimesTitle:
            return "Salvar melhores tempos?";
        case Label.SaveBestTimesDescription:
            return "Você superou alguns dos seus melhores tempos. Deseja atualizá-los?";
        case Label.Yes:
            return "Sim";
        case Label.No:
            return "Não";
        case Label.DontReset:
            return "Não reiniciar";
        case Label.FailedToExportSplits:
            return "Falha ao exportar os splits.";
        case Label.CantImportEmptySplits:
            return "Não é possível importar splits vazios.";
        case Label.FailedToReadFile:
            return "Falha ao ler o arquivo:";
        case Label.FailedToImportSplits:
            return "Falha ao importar os splits:";
        case Label.CouldNotParseSplits:
            return "Não foi possível analisar os splits.";
        case Label.LoadedSplitsInvalid:
            return "Os splits carregados são inválidos.";
        case Label.NewSegmentName:
            return "Tempo";
        case Label.EditWhileRunningError:
            return "Não é possível editar os splits enquanto o cronômetro estiver em execução.";
        case Label.Edit:
            return "Editar…";
        case Label.Save:
            return "Salvar";
        case Label.Export:
            return "Exportar";
        case Label.FailedToParseTimeSpan:
            return "Não foi possível analisar TimeSpan";
        case Label.Default:
            return "Padrão";
        case Label.Game:
            return "Jogo";
        case Label.Category:
            return "Categoria";
        case Label.StartTimerAt:
            return "Iniciar cronômetro em";
        case Label.Attempts:
            return "Tentativas";
        case Label.SplitsEditor:
            return "Editor de splits";
        case Label.Variables:
            return "Variáveis";
        case Label.Rules:
            return "Regras";
        case Label.Leaderboard:
            return "Leaderboard";
        case Label.InsertAbove:
            return "Inserir acima";
        case Label.InsertBelow:
            return "Inserir abaixo";
        case Label.RemoveSegment:
            return "Remover segmento";
        case Label.MoveUp:
            return "Mover para cima";
        case Label.MoveDown:
            return "Mover para baixo";
        case Label.CreateGroup:
            return "Criar grupo";
        case Label.RemoveGroup:
            return "Remover grupo";
        case Label.AddVariable:
            return "Adicionar variável";
        case Label.OpenPbPage:
            return "Abrir página PB";
        case Label.AssociateRun:
            return "Associar run";
        case Label.Icon:
            return "Ícone";
        case Label.SegmentName:
            return "Nome do segmento";
        case Label.SplitTime:
            return "Tempo do split";
        case Label.SegmentTime:
            return "Tempo do segmento";
        case Label.BestSegment:
            return "Melhor segmento";
        case Label.SpeedrunComVariableTooltip:
            return "Variável do Speedrun.com específica do jogo.";
        case Label.Region:
            return "Região";
        case Label.RegionDescription:
            return "A região do jogo que está sendo jogado.";
        case Label.Platform:
            return "Plataforma";
        case Label.PlatformDescription:
            return "A plataforma em que o jogo é jogado.";
        case Label.UsesEmulator:
            return "Usa emulador";
        case Label.UsesEmulatorDescription:
            return "Se um emulador está sendo usado para jogar.";
        case Label.CustomVariableTooltip:
            return "Variável personalizada definida por você. Pode ser exibida com o componente Texto.";
        case Label.NoVariables:
            return "No momento não há variáveis personalizadas para este jogo.";
        case Label.NoVariablesWithSpeedrunCom:
            return "No momento não há variáveis do Speedrun.com ou personalizadas para este jogo.";
        case Label.TimedWithoutLoads:
            return "são cronometradas sem tempos de carregamento";
        case Label.TimedWithGameTime:
            return "são cronometradas com Tempo de jogo";
        case Label.RequireVideoProof:
            return "exigem prova em vídeo";
        case Label.RunsOfThisGamePrefix:
            return "As runs deste jogo ";
        case Label.RunsOfThisGameSuffix:
            return ".";
        case Label.And:
            return "e";
        case Label.SetIcon:
            return "Definir ícone";
        case Label.SetIconDescription:
            return "Escolha uma imagem como ícone do jogo. Alguns formatos podem não funcionar em todos os lugares.";
        case Label.DownloadBoxArt:
            return "Baixar box art";
        case Label.DownloadBoxArtDescription:
            return "Tenta baixar a box art do Speedrun.com para definir como ícone do jogo.";
        case Label.DownloadIcon:
            return "Baixar ícone";
        case Label.DownloadIconDescription:
            return "Tenta baixar o ícone do jogo do Speedrun.com.";
        case Label.RemoveIcon:
            return "Remover ícone";
        case Label.RemoveIconDescription:
            return "Remove o ícone do jogo.";
        case Label.CleaningMenu:
            return "Limpeza…";
        case Label.ClearOnlyHistory:
            return "Limpar apenas histórico";
        case Label.ClearOnlyHistoryDescription:
            return "Os splits armazenam o histórico completo de todas as runs, incluindo cada tempo de segmento. Essas informações são usadas por vários componentes. Com esta opção você pode limpar o histórico. O recorde pessoal, os melhores tempos de segmento e as comparações não serão afetados.";
        case Label.ClearAllTimes:
            return "Limpar todos os tempos";
        case Label.ClearAllTimesDescription:
            return "Remove todos os tempos dos splits, incluindo todo o histórico, de modo que os splits fiquem completamente vazios, como se tivessem acabado de ser criados.";
        case Label.CleanSumOfBest:
            return "Limpar soma dos melhores";
        case Label.CleanSumOfBestDescription:
            return "Permite remover de forma interativa possíveis problemas no histórico dos segmentos que deixam a soma dos melhores segmentos imprecisa. Se você pular um split, o tempo de segmento combinado no split seguinte pode ser mais rápido do que a soma dos melhores segmentos individuais. Esta função aponta todas essas ocorrências e permite excluí-las individualmente se alguma parecer incorreta.";
        case Label.ComparisonsMenu:
            return "Comparações…";
        case Label.AddComparison:
            return "Adicionar comparação";
        case Label.AddComparisonDescription:
            return "Adiciona uma nova comparação personalizada para armazenar os tempos que você quiser.";
        case Label.ImportComparison:
            return "Importar comparação";
        case Label.ImportComparisonDescription:
            return "Importa como comparação o recorde pessoal de um arquivo de splits que você fornecer.";
        case Label.GenerateGoalComparison:
            return "Gerar comparação de meta";
        case Label.GenerateGoalComparisonDescription:
            return "Gera uma comparação de meta personalizada com base em um tempo alvo que você pode especificar. Os tempos da comparação são distribuídos automaticamente com base no histórico dos segmentos, de modo a representar aproximadamente os tempos de split para o tempo alvo. Como é calculada a partir do histórico dos segmentos, o tempo alvo é limitado ao intervalo entre a soma dos melhores segmentos e a soma dos piores segmentos. A comparação só é gerada para o método de cronometragem selecionado. Os tempos de comparação do outro método não são alterados, então você pode gerá-la novamente com o outro método para obter tempos de comparação para ambos os métodos de cronometragem.";
        case Label.CopyComparison:
            return "Copiar comparação";
        case Label.CopyComparisonDescription:
            return "Copia qualquer comparação existente, incluindo o recorde pessoal ou qualquer outra comparação fornecida automaticamente, como uma nova comparação personalizada. Você pode, por exemplo, usá-la para manter a última run como comparação pelo tempo que quiser.";
        case Label.SetSegmentIcon:
            return "Definir ícone do segmento";
        case Label.SetSegmentIconDescription:
            return "Escolha uma imagem como ícone do segmento. Alguns formatos podem não funcionar em todos os lugares.";
        case Label.RemoveSegmentIcon:
            return "Remover ícone do segmento";
        case Label.RemoveSegmentIconDescription:
            return "Remove o ícone do segmento.";
        case Label.Rename:
            return "Renomear";
        case Label.RenameDescription:
            return "Escolha um novo nome para a comparação personalizada. Nomes reservados ou duplicados não são permitidos.";
        case Label.CopyAction:
            return "Copiar";
        case Label.CopyDescription:
            return "Cria uma cópia da comparação personalizada.";
        case Label.ACopy:
            return "Cópia";
        case Label.Remove:
            return "Remover";
        case Label.RemoveDescription:
            return "Remove a comparação personalizada.";
        case Label.AnyPercent:
            return "Any%";
        case Label.LowPercent:
            return "Low%";
        case Label.HundredPercent:
            return "100%";
        case Label.AddComparisonPrompt:
            return "Especifique o nome da comparação que deseja adicionar:";
        case Label.ComparisonAddError:
            return "Não foi possível adicionar a comparação. O nome pode estar duplicado ou ser reservado.";
        case Label.ImportComparisonPrompt:
            return "Especifique o nome da comparação que deseja importar:";
        case Label.GenerateGoalComparisonPrompt:
            return "Especifique o tempo que deseja alcançar:";
        case Label.Generate:
            return "Gerar";
        case Label.GenerateGoalComparisonError:
            return "Falha ao gerar a comparação de meta. Verifique se o tempo é válido.";
        case Label.CopyComparisonPrompt:
            return "Especifique o nome da comparação que deseja copiar:";
        case Label.CopyComparisonError:
            return "Falha ao copiar a comparação. A comparação pode não existir.";
        case Label.NothingToCleanUp:
            return "Não há nada para limpar.";
        case Label.CleanPrompt:
            return "Limpar?";
        case Label.AssociateRunPrompt:
            return "Especifique o ID ou URL Speedrun.com da run:";
        case Label.Associate:
            return "Associar";
        case Label.InvalidSpeedrunUrl:
            return "ID ou URL Speedrun.com inválido.";
        case Label.AssociateRunError:
            return "Não foi possível associar a run. O ID pode ser inválido.";
        case Label.AddVariablePrompt:
            return "Especifique o nome da variável personalizada que deseja adicionar:";
        case Label.RenameComparison:
            return "Renomear comparação";
        case Label.RenameComparisonPrompt:
            return "Especifique o novo nome da comparação:";
        case Label.ComparisonRenameError:
            return "Não foi possível renomear a comparação. Pode ser duplicada ou reservada.";
        case Label.GameNotFound:
            return "Jogo não encontrado.";
        case Label.NoBoxArt:
            return "O jogo não tem box art.";
        case Label.DownloadBoxArtError:
            return "Falha ao baixar a box art.";
        case Label.NoGameIcon:
            return "Sem ícone do jogo";
        case Label.DownloadIconError:
            return "Falha ao baixar o ícone.";
        case Label.Rank:
            return "Classificação";
        case Label.Player:
            return "Jogador";
        case Label.Time:
            return "Tempo";
        case Label.Date:
            return "Data:";
        case Label.Emulator:
            return "Emulador";
        case Label.EmulatorTag:
            return "Emulador";
        case Label.ObsoleteRuns:
            return "Runs obsoletas";
        case Label.Shown:
            return "Exibidas";
        case Label.Hidden:
            return "Ocultas";
        case Label.OpenLeaderboard:
            return "Abrir leaderboard";
        case Label.Filters:
            return "Filtros";
        case Label.LayoutEditor:
            return "Editor de layout";
        case Label.Component:
            return "Componente";
        case Label.AddComponent:
            return "Adicionar componente";
        case Label.RemoveComponent:
            return "Remover componente";
        case Label.DuplicateComponent:
            return "Duplicar componente";
        case Label.MoveComponentUp:
            return "Mover componente para cima";
        case Label.MoveComponentDown:
            return "Mover componente para baixo";
        case Label.ComponentTitle:
            return "Título";
        case Label.ComponentTitleDescription:
            return "Mostra o nome do jogo e categoria, ícones, tentativas e número de finalizações.";
        case Label.ComponentGraph:
            return "Gráfico";
        case Label.ComponentGraphDescription:
            return "Mostra o avanço/atraso em relação à comparação em todos os splits.";
        case Label.ComponentSplitsDescription:
            return "O principal componente de tempos de split. Mostra uma tabela rolável.";
        case Label.ComponentDetailedTimer:
            return "Timer detalhado";
        case Label.ComponentDetailedTimerDescription:
            return "Mostra o tempo total e o tempo do segmento atual.";
        case Label.ComponentTimer:
            return "Timer";
        case Label.ComponentTimerDescription:
            return "Mostra o tempo total em formato digital; a cor depende da comparação.";
        case Label.ComponentCurrentComparison:
            return "Comparação atual";
        case Label.ComponentCurrentComparisonDescription:
            return "Mostra o nome da comparação atual.";
        case Label.ComponentCurrentPace:
            return "Ritmo atual";
        case Label.ComponentCurrentPaceDescription:
            return "Prevê o tempo final com base na comparação selecionada.";
        case Label.ComponentDelta:
            return "Delta";
        case Label.ComponentDeltaDescription:
            return "Mostra o avanço/atraso em relação à comparação.";
        case Label.ComponentPbChance:
            return "Chance de PB";
        case Label.ComponentPbChanceDescription:
            return "Mostra a chance de obter um PB.";
        case Label.ComponentPossibleTimeSave:
            return "Tempo possível de economizar";
        case Label.ComponentPossibleTimeSaveDescription:
            return "Mostra o tempo que pode ser economizado no segmento atual.";
        case Label.ComponentPreviousSegment:
            return "Segmento anterior";
        case Label.ComponentPreviousSegmentDescription:
            return "Mostra o ganho/perda e a economia potencial do segmento anterior.";
        case Label.ComponentSegmentTime:
            return "Tempo do segmento";
        case Label.ComponentSegmentTimeDescription:
            return "Mostra o tempo do segmento para a comparação selecionada.";
        case Label.ComponentSumOfBest:
            return "Soma dos melhores";
        case Label.ComponentSumOfBestDescription:
            return "Mostra o tempo mais rápido possível com base no histórico.";
        case Label.ComponentText:
            return "Texto";
        case Label.ComponentTextDescription:
            return "Mostra textos central/esquerda/direita e variáveis personalizadas.";
        case Label.ComponentTotalPlaytime:
            return "Tempo total de jogo";
        case Label.ComponentTotalPlaytimeDescription:
            return "Mostra o tempo total de jogo na categoria.";
        case Label.ComponentVariableDescription:
            return "Cria texto que mostra o valor da variável personalizada “{name}”.";
        case Label.ComponentBlankSpace:
            return "Espaço em branco";
        case Label.ComponentBlankSpaceDescription:
            return "Componente vazio com apenas o fundo.";
        case Label.ComponentCarousel:
            return "Carrossel";
        case Label.ComponentCarouselDescription:
            return "Mostra um componente filho por vez e alterna entre eles. Dá prioridade aos que tiveram conteúdo alterado; caso contrário, troca em um intervalo definido.";
        case Label.ComponentSeparator:
            return "Separador";
        case Label.ComponentSeparatorDescription:
            return "Mostra uma linha separadora entre componentes.";
        case Label.Row:
            return "Linha";
        case Label.RowDescription:
            return "Uma linha de componentes dispostos horizontalmente, alterando a direção do layout para os componentes internos.";
        case Label.Column:
            return "Coluna";
        case Label.ColumnDescription:
            return "Uma coluna de componentes dispostos verticalmente, alterando a direção do layout para os componentes internos.";
        case Label.AccuracySeconds:
            return "Segundos";
        case Label.AccuracyTenths:
            return "Décimos";
        case Label.AccuracyHundredths:
            return "Centésimos";
        case Label.AccuracyMilliseconds:
            return "Milissegundos";
        case Label.FontStyle:
            return "Estilo";
        case Label.FontWeight:
            return "Peso";
        case Label.FontStretch:
            return "Alongamento";
        case Label.FontStyleNormal:
            return "Normal";
        case Label.FontStyleItalic:
            return "Itálico";
        case Label.AlignmentAutomatic:
            return "Automático";
        case Label.AlignmentLeft:
            return "Esquerda";
        case Label.AlignmentCenter:
            return "Centro";
        case Label.GradientTransparent:
            return "Transparente";
        case Label.GradientPlain:
            return "Sólido";
        case Label.GradientVertical:
            return "Vertical";
        case Label.GradientHorizontal:
            return "Horizontal";
        case Label.GradientAlternating:
            return "Alternado";
        case Label.GradientPlainDelta:
            return "Delta sólido";
        case Label.GradientVerticalDelta:
            return "Delta vertical";
        case Label.GradientHorizontalDelta:
            return "Delta horizontal";
        case Label.LayoutBackgroundImage:
            return "Imagem";
        case Label.LayoutBackgroundBrightness:
            return "Brilho";
        case Label.LayoutBackgroundOpacity:
            return "Opacidade";
        case Label.LayoutBackgroundBlur:
            return "Desfoque";
        case Label.LayoutDirectionVertical:
            return "Vertical";
        case Label.LayoutDirectionHorizontal:
            return "Horizontal";
        case Label.ColumnKindTime:
            return "Tempo";
        case Label.ColumnKindVariable:
            return "Variável";
        case Label.ColumnStartWithEmpty:
            return "Vazio";
        case Label.ColumnStartWithComparisonTime:
            return "Tempo de comparação";
        case Label.ColumnStartWithComparisonSegmentTime:
            return "Tempo de segmento de comparação";
        case Label.ColumnStartWithPossibleTimeSave:
            return "Tempo possível de economizar";
        case Label.IconDisplayModeBothRows:
            return "Ambas as linhas";
        case Label.IconDisplayModeFirstRow:
            return "Primeira linha";
        case Label.SubsplitDisplayModeFlat:
            return "Plano";
        case Label.SubsplitDisplayModeCurrentGroupExpanded:
            return "Grupo atual expandido";
        case Label.SubsplitDisplayModeAllGroupsExpanded:
            return "Todos os grupos expandidos";
        case Label.ColumnUpdateWithDontUpdate:
            return "Não atualizar";
        case Label.ColumnUpdateWithSplitTime:
            return "Tempo do split";
        case Label.ColumnUpdateWithDelta:
            return "Tempo à frente / atrás";
        case Label.ColumnUpdateWithDeltaWithFallback:
            return "Tempo à frente / atrás ou tempo do split se vazio";
        case Label.ColumnUpdateWithSegmentTime:
            return "Tempo do segmento";
        case Label.ColumnUpdateWithSegmentDelta:
            return "Tempo ganho / perdido";
        case Label.ColumnUpdateWithSegmentDeltaWithFallback:
            return "Tempo ganho / perdido ou tempo do segmento se vazio";
        case Label.ColumnUpdateTriggerOnStartingSegment:
            return "Ao iniciar o segmento";
        case Label.ColumnUpdateTriggerContextual:
            return "Contextual";
        case Label.ColumnUpdateTriggerOnEndingSegment:
            return "Ao terminar o segmento";
        case Label.ComparisonCurrentComparison:
            return "Comparação atual";
        case Label.CustomVariableNoneAvailable:
            return "Não há variáveis disponíveis";
        case Label.CustomVariableNoneAvailableTooltip:
            return "Variáveis personalizadas podem ser definidas na aba Variáveis ao editar splits. Variáveis personalizadas adicionais podem ser fornecidas automaticamente por auto splitters.";
        case Label.HotkeyButtonTooltip:
            return "Clique para gravar uma tecla de atalho. Você também pode usar botões do gamepad. Teclas de atalho globais não são possíveis no momento. Os botões do gamepad funcionam globalmente.";
        case Label.ServerConnect:
            return "Conectar";
        case Label.ServerDisconnect:
            return "Desconectar";
        case Label.ServerConnecting:
            return "Conectando…";
        case Label.ServerDisconnecting:
            return "Desconectando…";
        case Label.ConnectToServerTitle:
            return "Conectar ao servidor";
        case Label.ConnectToServerDescription:
            return "Informe a URL do WebSocket:";
        case Label.Connect:
            return "Conectar";
        case Label.UpdateAvailable:
            return "Há uma nova versão do LiveSplit One disponível! Clique aqui para recarregar.";
        case Label.UnsavedChangesBeforeUnload:
            return "Há alterações não salvas. Tem certeza de que deseja fechar o LiveSplit One?";
        case Label.OpenSidebarAriaLabel:
            return "Abrir barra lateral";
        case Label.FailedToSaveLayout:
            return "Falha ao salvar o layout.";
        case Label.FailedToSaveHotkeys:
            return "Falha ao salvar as configurações de atalhos.";
        case Label.FailedToSaveGeneralSettings:
            return "Falha ao salvar as configurações gerais.";
        case Label.FailedToSaveSplits:
            return "Falha ao salvar os splits.";
        case Label.LayoutCouldNotBeLoaded:
            return "Não foi possível carregar o layout. Talvez não seja um layout válido do LiveSplit ou LiveSplit One.";
        case Label.EmptySplitsNotSupported:
            return "Splits vazios não são suportados.";
        case Label.BugEncountered:
            return "Você encontrou um bug:";
        case Label.PleaseReportIssueStart:
            return "Por favor, reporte este problema ";
        case Label.ReportHere:
            return "aqui";
        case Label.PleaseReportIssueEnd:
            return ".";
        case Label.BugReportInstructions:
            return "Para nos ajudar a corrigir este problema, inclua as etapas para reproduzi-lo e anexe os splits e o layout que você estava usando quando o problema ocorreu.";
        case Label.LoadFailedPrivateBrowsing:
            return "Não foi possível carregar o LiveSplit One.\nTalvez você esteja no modo de navegação privada.\nO LiveSplit One não pode armazenar splits, layouts ou outras configurações devido às limitações do modo privado do navegador.\nEssas limitações podem ser removidas no futuro.\nPara usar o LiveSplit One agora, desative a navegação privada nas configurações.";
        case Label.LoadFailedOutdatedBrowser:
            return "Não foi possível carregar o LiveSplit One.\nTalvez você esteja usando um navegador desatualizado.\nAtualize o navegador ou sua versão do iOS e tente novamente.\nOutro motivo pode ser uma extensão do navegador, como um bloqueador de anúncios, que esteja bloqueando o acesso a scripts importantes.";
    }
}
