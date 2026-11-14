import { Label } from ".";

export function resolveFrench(text: Label): string {
    switch (text) {
        case Label.Ok:
            return "OK";
        case Label.Cancel:
            return "Annuler";
        case Label.Settings:
            return "Paramètres";
        case Label.Language:
            return "Langue";
        case Label.LanguageDescription:
            return "Définit la langue utilisée dans l’application.";
        case Label.LanguageAuto:
            return "Automatique";
        case Label.Theme:
            return "Thème";
        case Label.ThemeDescription:
            return "Détermine s’il faut suivre le thème du système ou forcer le mode clair ou sombre.";
        case Label.ThemeLightMode:
            return "Mode clair";
        case Label.ThemeDarkMode:
            return "Mode sombre";
        case Label.HotkeysHeading:
            return "Raccourcis";
        case Label.GeneralHeading:
            return "Général";
        case Label.NetworkHeading:
            return "Réseau";
        case Label.FrameRate:
            return "Fréquence d’images";
        case Label.FrameRateDescription:
            return "Détermine la fréquence d’images à laquelle afficher le timer. « Adapté à la batterie » tente de déterminer le type d’appareil et l’état de charge pour choisir une bonne fréquence d’images. « Adapter à l’écran » fait correspondre le timer au taux de rafraîchissement de l’écran.";
        case Label.FrameRateBatteryAware:
            return "Adapté à la batterie";
        case Label.FrameRateMatchScreen:
            return "Adapter à l’écran";
        case Label.SaveOnReset:
            return "Enregistrer lors de la réinitialisation";
        case Label.SaveOnResetDescription:
            return "Détermine s’il faut enregistrer automatiquement les splits lors de la réinitialisation du timer.";
        case Label.ShowControlButtons:
            return "Afficher les boutons de contrôle";
        case Label.ShowControlButtonsDescription:
            return "Détermine s’il faut afficher des boutons sous le timer pour le contrôler. Lorsqu’ils sont désactivés, vous devez utiliser les raccourcis.";
        case Label.ShowManualGameTimeInput:
            return "Afficher la saisie manuelle du temps de jeu";
        case Label.ShowManualGameTimeInputDescription:
            return "Affiche une zone de texte sous le timer qui vous permet de saisir manuellement le temps de jeu. Vous démarrez le timer et faites des splits en appuyant sur la touche Entrée dans la zone de texte. Assurez-vous de comparer avec « Temps de jeu ».";
        case Label.ManualGameTimeMode:
            return "Mode de temps de jeu manuel";
        case Label.ManualGameTimeModeDescription:
            return "Détermine si le temps de jeu manuel est saisi en temps de segment ou en temps de split.";
        case Label.ManualGameTimeModeSegmentTimes:
            return "Temps de segment";
        case Label.ManualGameTimeModeSplitTimes:
            return "Temps de split";
        case Label.AlwaysOnTop:
            return "Toujours au premier plan";
        case Label.AlwaysOnTopDescription:
            return "Garde la fenêtre au-dessus des autres fenêtres.";
        case Label.SpeedrunComIntegration:
            return "Intégration Speedrun.com";
        case Label.SpeedrunComIntegrationDescription:
            return "Interroge la liste des jeux, catégories et classements depuis Speedrun.com.";
        case Label.ServerConnection:
            return "Connexion au serveur";
        case Label.ServerConnectionDescription:
            return "Permet de se connecter à un serveur WebSocket qui peut contrôler le timer en envoyant diverses commandes. Les commandes sont actuellement un sous-ensemble de celles que le LiveSplit original prend en charge.";
        case Label.ServerConnectionExperimental:
            return "Cette fonctionnalité est expérimentale et le protocole changera probablement à l’avenir.";
        case Label.TheRunGgIntegration:
            return "Intégration therun.gg";
        case Label.TheRunGgIntegrationDescription:
            return "S’intègre à therun.gg pour le suivi en direct des runs et l’envoi automatique des statistiques. Vous avez besoin d’une clé d’envoi therun.gg pour utiliser cette fonctionnalité.";
        case Label.TheRunGgLiveTracking:
            return "Suivi en direct";
        case Label.TheRunGgLiveTrackingDescription:
            return "Lorsqu’il est activé, les données de split en direct sont envoyées à therun.gg après chaque action de split, ce qui permet un suivi en direct sur le site.";
        case Label.TheRunGgStatsUploading:
            return "Envoi des statistiques";
        case Label.TheRunGgStatsUploadingDescription:
            return "Lorsqu’il est activé, le fichier de splits est envoyé à therun.gg après chaque réinitialisation ou run terminée, ce qui synchronise automatiquement vos runs avec le site.";
        case Label.HotkeyAlreadyInUse:
            return "Le raccourci est déjà utilisé.";
        case Label.Start:
            return "Démarrer";
        case Label.Resume:
            return "Reprendre";
        case Label.Pause:
            return "Pause";
        case Label.UndoSplit:
            return "Annuler le split";
        case Label.Reset:
            return "Réinitialiser";
        case Label.SkipSplit:
            return "Passer le split";
        case Label.ManualGameTimePlaceholder:
            return "Temps de jeu manuel";
        case Label.LiveSplitLogoAlt:
            return "Logo LiveSplit";
        case Label.LiveSplitOne:
            return "LiveSplit One";
        case Label.Splits:
            return "Splits";
        case Label.Layout:
            return "Layout";
        case Label.CompareAgainst:
            return "Comparer à";
        case Label.RealTime:
            return "Temps réel";
        case Label.GameTime:
            return "Temps de jeu";
        case Label.PopOut:
            return "Fenêtre détachée";
        case Label.About:
            return "À propos";
        case Label.Back:
            return "Retour";
        case Label.AboutVersionPrefix:
            return "Version :";
        case Label.AboutDescription:
            return "LiveSplit One est une version multiplateforme de LiveSplit, le timer élégant et hautement personnalisable pour les speedrunners.";
        case Label.AboutViewSource:
            return "Voir le code source sur GitHub";
        case Label.AboutRecentChanges:
            return "Changements récents";
        case Label.AboutContributors:
            return "Contributeurs";
        case Label.Loading:
            return "Chargement…";
        case Label.Add:
            return "Ajouter";
        case Label.Import:
            return "Importer";
        case Label.OpenSplits:
            return "Ouvrir les splits";
        case Label.EditSplits:
            return "Modifier les splits";
        case Label.ExportSplits:
            return "Exporter les splits";
        case Label.CopySplits:
            return "Copier les splits";
        case Label.RemoveSplits:
            return "Supprimer les splits";
        case Label.Untitled:
            return "Sans titre";
        case Label.NoCategory:
            return "—";
        case Label.DiscardChangesTitle:
            return "Ignorer les modifications ?";
        case Label.DiscardChangesDescription:
            return "Vos splits actuels ont des modifications non enregistrées. Voulez-vous continuer et ignorer ces modifications ?";
        case Label.DeleteSplitsTitle:
            return "Supprimer les splits ?";
        case Label.DeleteSplitsDescription:
            return "Voulez-vous vraiment supprimer les splits ? Cette opération est irréversible.";
        case Label.SaveBestTimesTitle:
            return "Enregistrer les meilleurs temps ?";
        case Label.SaveBestTimesDescription:
            return "Vous avez battu certains de vos meilleurs temps. Voulez-vous les mettre à jour ?";
        case Label.Yes:
            return "Oui";
        case Label.No:
            return "Non";
        case Label.DontReset:
            return "Ne pas réinitialiser";
        case Label.FailedToExportSplits:
            return "Échec de l’exportation des splits.";
        case Label.CantImportEmptySplits:
            return "Impossible d’importer des splits vides.";
        case Label.FailedToReadFile:
            return "Échec de la lecture du fichier :";
        case Label.FailedToImportSplits:
            return "Échec de l’importation des splits :";
        case Label.CouldNotParseSplits:
            return "Impossible d’analyser les splits.";
        case Label.LoadedSplitsInvalid:
            return "Les splits chargés ne sont pas valides.";
        case Label.NewSegmentName:
            return "Temps";
        case Label.EditWhileRunningError:
            return "Vous ne pouvez pas modifier vos splits pendant que le timer tourne.";
        case Label.Edit:
            return "Modifier…";
        case Label.Save:
            return "Enregistrer";
        case Label.Export:
            return "Exporter";
        case Label.FailedToParseTimeSpan:
            return "Impossible d’analyser TimeSpan";
        case Label.Default:
            return "Par défaut";
        case Label.Game:
            return "Jeu";
        case Label.Category:
            return "Catégorie";
        case Label.StartTimerAt:
            return "Démarrer le timer à";
        case Label.Attempts:
            return "Tentatives";
        case Label.SplitsEditor:
            return "Éditeur de splits";
        case Label.Variables:
            return "Variables";
        case Label.Rules:
            return "Règles";
        case Label.Leaderboard:
            return "Classement";
        case Label.InsertAbove:
            return "Insérer au-dessus";
        case Label.InsertBelow:
            return "Insérer au-dessous";
        case Label.RemoveSegment:
            return "Supprimer le segment";
        case Label.MoveUp:
            return "Monter";
        case Label.MoveDown:
            return "Descendre";
        case Label.CreateGroup:
            return "Créer un groupe";
        case Label.RemoveGroup:
            return "Supprimer le groupe";
        case Label.AddVariable:
            return "Ajouter une variable";
        case Label.OpenPbPage:
            return "Ouvrir la page PB";
        case Label.AssociateRun:
            return "Associer une run";
        case Label.Icon:
            return "Icône";
        case Label.SegmentName:
            return "Nom du segment";
        case Label.SplitTime:
            return "Temps du split";
        case Label.SegmentTime:
            return "Temps du segment";
        case Label.BestSegment:
            return "Meilleur segment";
        case Label.SpeedrunComVariableTooltip:
            return "Variable Speedrun.com spécifique au jeu.";
        case Label.Region:
            return "Région";
        case Label.RegionDescription:
            return "La région du jeu joué.";
        case Label.Platform:
            return "Plateforme";
        case Label.PlatformDescription:
            return "La plateforme sur laquelle le jeu est joué.";
        case Label.UsesEmulator:
            return "Utilise un émulateur";
        case Label.UsesEmulatorDescription:
            return "Indique si un émulateur est utilisé pour jouer au jeu.";
        case Label.CustomVariableTooltip:
            return "Variable personnalisée que vous avez définie. Elle peut être affichée avec le composant Texte.";
        case Label.NoVariables:
            return "Il n’y a actuellement aucune variable personnalisée pour ce jeu.";
        case Label.NoVariablesWithSpeedrunCom:
            return "Il n’y a actuellement aucune variable Speedrun.com ou personnalisée pour ce jeu.";
        case Label.TimedWithoutLoads:
            return "sont chronométrées sans les temps de chargement";
        case Label.TimedWithGameTime:
            return "sont chronométrées avec le Temps de jeu";
        case Label.RequireVideoProof:
            return "exigent une preuve vidéo";
        case Label.RunsOfThisGamePrefix:
            return "Les runs de ce jeu ";
        case Label.RunsOfThisGameSuffix:
            return ".";
        case Label.And:
            return "et";
        case Label.SetIcon:
            return "Définir l’icône";
        case Label.SetIconDescription:
            return "Choisir une image comme icône du jeu. Certains formats peuvent ne pas être pris en charge partout.";
        case Label.DownloadBoxArt:
            return "Télécharger la jaquette";
        case Label.DownloadBoxArtDescription:
            return "Tente de télécharger la jaquette depuis Speedrun.com pour l’utiliser comme icône du jeu.";
        case Label.DownloadIcon:
            return "Télécharger l’icône";
        case Label.DownloadIconDescription:
            return "Tente de télécharger l’icône du jeu depuis Speedrun.com.";
        case Label.RemoveIcon:
            return "Retirer l’icône";
        case Label.RemoveIconDescription:
            return "Retire l’icône du jeu.";
        case Label.CleaningMenu:
            return "Nettoyage…";
        case Label.ClearOnlyHistory:
            return "Effacer uniquement l’historique";
        case Label.ClearOnlyHistoryDescription:
            return "Les splits stockent l’historique complet de toutes les runs, y compris chaque temps de segment. Ces informations sont utilisées par divers composants. Cette action permet d’effacer l’historique. Le record personnel, les meilleurs temps de segment et les comparaisons ne sont pas affectés.";
        case Label.ClearAllTimes:
            return "Effacer tous les temps";
        case Label.ClearAllTimesDescription:
            return "Supprime tous les temps des splits, y compris tout l’historique, de sorte que les splits soient complètement vides, comme s’ils venaient d’être créés.";
        case Label.CleanSumOfBest:
            return "Nettoyer la somme des meilleurs";
        case Label.CleanSumOfBestDescription:
            return "Permet de supprimer de manière interactive les problèmes potentiels de l’historique des segments qui rendent la somme des meilleurs segments inexacte. Si vous passez un split, le temps de segment combiné obtenu au split suivant peut être plus rapide que la somme des meilleurs segments individuels. Cette fonction signale toutes ces occurrences et vous permet de les supprimer une par une si certaines semblent incorrectes.";
        case Label.ComparisonsMenu:
            return "Comparaisons…";
        case Label.AddComparison:
            return "Ajouter une comparaison";
        case Label.AddComparisonDescription:
            return "Ajoute une nouvelle comparaison personnalisée dans laquelle vous pouvez stocker les temps de votre choix.";
        case Label.ImportComparison:
            return "Importer une comparaison";
        case Label.ImportComparisonDescription:
            return "Importe comme comparaison le record personnel d’un fichier de splits que vous fournissez.";
        case Label.GenerateGoalComparison:
            return "Générer une comparaison d’objectif";
        case Label.GenerateGoalComparisonDescription:
            return "Génère une comparaison d’objectif personnalisée à partir d’un temps cible que vous pouvez indiquer. Les temps de la comparaison sont automatiquement répartis selon l’historique des segments, de sorte qu’ils représentent approximativement les temps de split correspondant au temps cible. Comme la comparaison est calculée à partir de l’historique des segments, le temps cible est limité à l’intervalle entre la somme des meilleurs segments et la somme des pires segments. La comparaison n’est générée que pour la méthode de chronométrage sélectionnée. Les temps de comparaison de l’autre méthode ne sont pas modifiés : vous pouvez donc la générer à nouveau avec l’autre méthode pour obtenir des temps de comparaison pour les deux méthodes de chronométrage.";
        case Label.CopyComparison:
            return "Copier la comparaison";
        case Label.CopyComparisonDescription:
            return "Copie une comparaison existante, y compris le record personnel ou toute autre comparaison fournie automatiquement, en tant que nouvelle comparaison personnalisée. Vous pouvez par exemple vous en servir pour conserver la dernière run comme comparaison aussi longtemps que vous le souhaitez.";
        case Label.SetSegmentIcon:
            return "Définir l’icône du segment";
        case Label.SetSegmentIconDescription:
            return "Choisir une image comme icône du segment. Certains formats peuvent ne pas fonctionner partout.";
        case Label.RemoveSegmentIcon:
            return "Retirer l’icône du segment";
        case Label.RemoveSegmentIconDescription:
            return "Retire l’icône du segment.";
        case Label.Rename:
            return "Renommer";
        case Label.RenameDescription:
            return "Choisissez un nouveau nom pour la comparaison personnalisée. Les noms réservés ou en double ne sont pas autorisés.";
        case Label.CopyAction:
            return "Copier";
        case Label.CopyDescription:
            return "Crée une copie de la comparaison personnalisée.";
        case Label.ACopy:
            return "Copie";
        case Label.Remove:
            return "Supprimer";
        case Label.RemoveDescription:
            return "Supprime la comparaison personnalisée.";
        case Label.AnyPercent:
            return "Any%";
        case Label.LowPercent:
            return "Low%";
        case Label.HundredPercent:
            return "100%";
        case Label.AddComparisonPrompt:
            return "Indiquez le nom de la comparaison à ajouter :";
        case Label.ComparisonAddError:
            return "La comparaison n’a pas pu être ajoutée. Le nom est peut-être en double ou réservé.";
        case Label.ImportComparisonPrompt:
            return "Indiquez le nom de la comparaison à importer :";
        case Label.GenerateGoalComparisonPrompt:
            return "Indiquez le temps à atteindre :";
        case Label.Generate:
            return "Générer";
        case Label.GenerateGoalComparisonError:
            return "Impossible de générer la comparaison d’objectif. Vérifiez que le temps est valide.";
        case Label.CopyComparisonPrompt:
            return "Indiquez le nom de la comparaison à copier :";
        case Label.CopyComparisonError:
            return "Impossible de copier la comparaison. Elle n’existe peut-être pas.";
        case Label.NothingToCleanUp:
            return "Il n’y a rien à nettoyer.";
        case Label.CleanPrompt:
            return "Nettoyer ?";
        case Label.AssociateRunPrompt:
            return "Indiquez l’ID ou l’URL Speedrun.com de la run :";
        case Label.Associate:
            return "Associer";
        case Label.InvalidSpeedrunUrl:
            return "ID ou URL Speedrun.com invalide.";
        case Label.AssociateRunError:
            return "Impossible d’associer la run. L’ID est peut-être invalide.";
        case Label.AddVariablePrompt:
            return "Indiquez le nom de la variable personnalisée à ajouter :";
        case Label.RenameComparison:
            return "Renommer la comparaison";
        case Label.RenameComparisonPrompt:
            return "Indiquez le nouveau nom de la comparaison :";
        case Label.ComparisonRenameError:
            return "La comparaison n’a pas pu être renommée. Elle est peut-être en double ou réservée.";
        case Label.GameNotFound:
            return "Jeu introuvable.";
        case Label.NoBoxArt:
            return "Le jeu n’a pas de jaquette.";
        case Label.DownloadBoxArtError:
            return "Impossible de télécharger la jaquette.";
        case Label.NoGameIcon:
            return "Aucune icône de jeu";
        case Label.DownloadIconError:
            return "Impossible de télécharger l’icône.";
        case Label.Rank:
            return "Rang";
        case Label.Player:
            return "Joueur";
        case Label.Time:
            return "Temps";
        case Label.Date:
            return "Date :";
        case Label.Emulator:
            return "Émulateur";
        case Label.EmulatorTag:
            return "Émulateur";
        case Label.ObsoleteRuns:
            return "Runs obsolètes";
        case Label.Shown:
            return "Affichées";
        case Label.Hidden:
            return "Masquées";
        case Label.OpenLeaderboard:
            return "Ouvrir le classement";
        case Label.Filters:
            return "Filtres";
        case Label.LayoutEditor:
            return "Éditeur de layout";
        case Label.Component:
            return "Composant";
        case Label.AddComponent:
            return "Ajouter un composant";
        case Label.RemoveComponent:
            return "Supprimer le composant";
        case Label.DuplicateComponent:
            return "Dupliquer le composant";
        case Label.MoveComponentUp:
            return "Monter le composant";
        case Label.MoveComponentDown:
            return "Descendre le composant";
        case Label.ComponentTitle:
            return "Titre";
        case Label.ComponentTitleDescription:
            return "Affiche le nom du jeu et la catégorie, ainsi que l’icône, les tentatives et les runs terminées.";
        case Label.ComponentGraph:
            return "Graphique";
        case Label.ComponentGraphDescription:
            return "Visualise l’avance/le retard sur toute la run par rapport à la comparaison.";
        case Label.ComponentSplitsDescription:
            return "Composant principal des splits avec icône, nom, delta et temps, défilable.";
        case Label.ComponentDetailedTimer:
            return "Timer détaillé";
        case Label.ComponentDetailedTimerDescription:
            return "Affiche le temps total et celui du segment, plus des infos optionnelles.";
        case Label.ComponentTimer:
            return "Timer";
        case Label.ComponentTimerDescription:
            return "Affiche le temps total en horloge numérique, couleur selon la comparaison.";
        case Label.ComponentCurrentComparison:
            return "Comparaison actuelle";
        case Label.ComponentCurrentComparisonDescription:
            return "Affiche le nom de la comparaison en cours.";
        case Label.ComponentCurrentPace:
            return "Rythme actuel";
        case Label.ComponentCurrentPaceDescription:
            return "Prédit le temps final en fonction de la comparaison choisie.";
        case Label.ComponentDelta:
            return "Delta";
        case Label.ComponentDeltaDescription:
            return "Affiche l’avance/le retard par rapport à la comparaison.";
        case Label.ComponentPbChance:
            return "Chance de PB";
        case Label.ComponentPbChanceDescription:
            return "Affiche la probabilité de battre le PB, évolutive pendant la run.";
        case Label.ComponentPossibleTimeSave:
            return "Gain de temps possible";
        case Label.ComponentPossibleTimeSaveDescription:
            return "Affiche le temps gagnable sur le segment et le total possible.";
        case Label.ComponentPreviousSegment:
            return "Segment précédent";
        case Label.ComponentPreviousSegmentDescription:
            return "Affiche gain/perte sur le segment précédent et le gain potentiel.";
        case Label.ComponentSegmentTime:
            return "Temps du segment";
        case Label.ComponentSegmentTimeDescription:
            return "Affiche le temps du segment pour la comparaison choisie.";
        case Label.ComponentSumOfBest:
            return "Somme des meilleurs";
        case Label.ComponentSumOfBestDescription:
            return "Affiche le temps minimal possible basé sur l’historique.";
        case Label.ComponentText:
            return "Texte";
        case Label.ComponentTextDescription:
            return "Affiche un texte centré ou gauche/droite, ou une variable personnalisée.";
        case Label.ComponentTotalPlaytime:
            return "Temps de jeu total";
        case Label.ComponentTotalPlaytimeDescription:
            return "Affiche le temps total joué pour la catégorie.";
        case Label.ComponentVariableDescription:
            return "Crée un composant texte qui affiche la valeur de la variable « {name} ».";
        case Label.ComponentBlankSpace:
            return "Espace vide";
        case Label.ComponentBlankSpaceDescription:
            return "Composant vide servant d’espacement.";
        case Label.ComponentCarousel:
            return "Carrousel";
        case Label.ComponentCarouselDescription:
            return "Affiche un composant enfant à la fois et alterne entre eux. Il privilégie ceux dont le contenu a changé, sinon il bascule selon un intervalle.";
        case Label.ComponentSeparator:
            return "Séparateur";
        case Label.ComponentSeparatorDescription:
            return "Affiche un séparateur entre les composants.";
        case Label.Row:
            return "Ligne";
        case Label.RowDescription:
            return "Une ligne de composants disposés horizontalement, changeant la direction du layout pour les composants à l’intérieur.";
        case Label.Column:
            return "Colonne";
        case Label.ColumnDescription:
            return "Une colonne de composants disposés verticalement, changeant la direction du layout pour les composants à l’intérieur.";
        case Label.AccuracySeconds:
            return "Secondes";
        case Label.AccuracyTenths:
            return "Dixièmes";
        case Label.AccuracyHundredths:
            return "Centièmes";
        case Label.AccuracyMilliseconds:
            return "Millisecondes";
        case Label.FontStyle:
            return "Style";
        case Label.FontWeight:
            return "Graisse";
        case Label.FontStretch:
            return "Étirement";
        case Label.FontStyleNormal:
            return "Normal";
        case Label.FontStyleItalic:
            return "Italique";
        case Label.AlignmentAutomatic:
            return "Automatique";
        case Label.AlignmentLeft:
            return "Gauche";
        case Label.AlignmentCenter:
            return "Centre";
        case Label.GradientTransparent:
            return "Transparent";
        case Label.GradientPlain:
            return "Uni";
        case Label.GradientVertical:
            return "Vertical";
        case Label.GradientHorizontal:
            return "Horizontal";
        case Label.GradientAlternating:
            return "Alterné";
        case Label.GradientPlainDelta:
            return "Delta uni";
        case Label.GradientVerticalDelta:
            return "Delta vertical";
        case Label.GradientHorizontalDelta:
            return "Delta horizontal";
        case Label.LayoutBackgroundImage:
            return "Image";
        case Label.LayoutBackgroundBrightness:
            return "Luminosité";
        case Label.LayoutBackgroundOpacity:
            return "Opacité";
        case Label.LayoutBackgroundBlur:
            return "Flou";
        case Label.LayoutDirectionVertical:
            return "Vertical";
        case Label.LayoutDirectionHorizontal:
            return "Horizontal";
        case Label.ColumnKindTime:
            return "Temps";
        case Label.ColumnKindVariable:
            return "Variable";
        case Label.ColumnStartWithEmpty:
            return "Vide";
        case Label.ColumnStartWithComparisonTime:
            return "Temps de comparaison";
        case Label.ColumnStartWithComparisonSegmentTime:
            return "Temps du segment de comparaison";
        case Label.ColumnStartWithPossibleTimeSave:
            return "Gain de temps possible";
        case Label.IconDisplayModeBothRows:
            return "Les deux lignes";
        case Label.IconDisplayModeFirstRow:
            return "Première ligne";
        case Label.SubsplitDisplayModeFlat:
            return "À plat";
        case Label.SubsplitDisplayModeCurrentGroupExpanded:
            return "Groupe actuel déplié";
        case Label.SubsplitDisplayModeAllGroupsExpanded:
            return "Tous les groupes dépliés";
        case Label.ColumnUpdateWithDontUpdate:
            return "Ne pas mettre à jour";
        case Label.ColumnUpdateWithSplitTime:
            return "Temps du split";
        case Label.ColumnUpdateWithDelta:
            return "Avance / retard";
        case Label.ColumnUpdateWithDeltaWithFallback:
            return "Avance / retard ou temps du split si vide";
        case Label.ColumnUpdateWithSegmentTime:
            return "Temps du segment";
        case Label.ColumnUpdateWithSegmentDelta:
            return "Temps gagné / perdu";
        case Label.ColumnUpdateWithSegmentDeltaWithFallback:
            return "Temps gagné / perdu ou temps du segment si vide";
        case Label.ColumnUpdateTriggerOnStartingSegment:
            return "Au début du segment";
        case Label.ColumnUpdateTriggerContextual:
            return "Contextuel";
        case Label.ColumnUpdateTriggerOnEndingSegment:
            return "À la fin du segment";
        case Label.ComparisonCurrentComparison:
            return "Comparaison actuelle";
        case Label.CustomVariableNoneAvailable:
            return "Aucune variable disponible";
        case Label.CustomVariableNoneAvailableTooltip:
            return "Les variables personnalisées peuvent être définies dans l’onglet Variables lors de l’édition des splits. Des variables personnalisées supplémentaires peuvent être fournies automatiquement par les auto splitters.";
        case Label.HotkeyButtonTooltip:
            return "Cliquez pour enregistrer un raccourci. Vous pouvez aussi utiliser les boutons d’une manette. Les raccourcis globaux ne sont pas possibles pour l’instant. Les boutons de manette fonctionnent globalement.";
        case Label.ServerConnect:
            return "Se connecter";
        case Label.ServerDisconnect:
            return "Se déconnecter";
        case Label.ServerConnecting:
            return "Connexion…";
        case Label.ServerDisconnecting:
            return "Déconnexion…";
        case Label.ConnectToServerTitle:
            return "Se connecter au serveur";
        case Label.ConnectToServerDescription:
            return "Saisissez l’URL WebSocket :";
        case Label.Connect:
            return "Se connecter";
        case Label.UpdateAvailable:
            return "Une nouvelle version de LiveSplit One est disponible ! Cliquez ici pour recharger.";
        case Label.UnsavedChangesBeforeUnload:
            return "Il y a des modifications non enregistrées. Voulez-vous vraiment fermer LiveSplit One ?";
        case Label.OpenSidebarAriaLabel:
            return "Ouvrir la barre latérale";
        case Label.FailedToSaveLayout:
            return "Échec de l’enregistrement du layout.";
        case Label.FailedToSaveHotkeys:
            return "Échec de l’enregistrement des raccourcis clavier.";
        case Label.FailedToSaveGeneralSettings:
            return "Échec de l’enregistrement des paramètres généraux.";
        case Label.FailedToSaveSplits:
            return "Échec de l’enregistrement des splits.";
        case Label.LayoutCouldNotBeLoaded:
            return "Le layout n’a pas pu être chargé. Il se peut que ce ne soit pas un layout LiveSplit ou LiveSplit One valide.";
        case Label.EmptySplitsNotSupported:
            return "Les splits vides ne sont pas pris en charge.";
        case Label.BugEncountered:
            return "Vous avez rencontré un bug :";
        case Label.PleaseReportIssueStart:
            return "Veuillez signaler ce problème ";
        case Label.ReportHere:
            return "ici";
        case Label.PleaseReportIssueEnd:
            return ".";
        case Label.BugReportInstructions:
            return "Afin de nous aider à corriger ce problème, veuillez indiquer les étapes pour le reproduire et joindre les splits et le layout que vous utilisiez lorsque le problème est survenu.";
        case Label.LoadFailedPrivateBrowsing:
            return "Impossible de charger LiveSplit One.\nVous êtes peut-être en navigation privée.\nLiveSplit One ne peut pas enregistrer les splits, les layouts ou d’autres paramètres à cause des limitations de la navigation privée.\nCes limitations pourraient être levées à l’avenir.\nPour utiliser LiveSplit One pour l’instant, désactivez la navigation privée dans vos paramètres.";
        case Label.LoadFailedOutdatedBrowser:
            return "Impossible de charger LiveSplit One.\nVotre navigateur n’est peut-être pas à jour.\nMettez à jour votre navigateur ou votre version d’iOS et réessayez.\nUne autre raison possible est qu’une extension de navigateur, comme un bloqueur de publicité, bloque l’accès à des scripts importants.";
    }
}
