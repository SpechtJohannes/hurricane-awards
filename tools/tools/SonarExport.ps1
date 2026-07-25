param(
    [Parameter(Mandatory = $true)]
    [string]$Rule,

    [string]$ProjectKey = "SpechtJohannes_hurricane-awards",

    [string]$OutputDirectory = ".sonar"
)

$ErrorActionPreference = "Stop"

function Stop-WithMessage {
    param(
        [string]$Message
    )

    Write-Host ""
    Write-Host $Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

if ([string]::IsNullOrWhiteSpace($env:SONAR_TOKEN)) {
    Stop-WithMessage @"
Die Umgebungsvariable SONAR_TOKEN ist nicht gesetzt.

Setze sie in der aktuellen PowerShell Sitzung mit:

`$env:SONAR_TOKEN = "DEIN_TOKEN"
"@
}

$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$outputPath = Join-Path $repositoryRoot $OutputDirectory

New-Item `
    -ItemType Directory `
    -Path $outputPath `
    -Force | Out-Null

$jsonPath = Join-Path $outputPath "sonarissues.json"
$markdownPath = Join-Path $outputPath "sonarissues.md"

$baseUrl = "https://sonarcloud.io/api/issues/search"
$pageSize = 500
$page = 1
$allIssues = @()

$pair = "$($env:SONAR_TOKEN):"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$encoded = [Convert]::ToBase64String($bytes)

$headers = @{
    Authorization = "Basic $encoded"
    Accept        = "application/json"
}

Write-Host ""
Write-Host "SonarQube Export" -ForegroundColor Cyan
Write-Host "Projekt: $ProjectKey"
Write-Host "Regel:   $Rule"
Write-Host ""

try {
    do {
        $queryParameters = @{
            componentKeys = $ProjectKey
            rules         = $Rule
            resolved      = "false"
            ps            = $pageSize
            p             = $page
        }

        $queryParts = foreach ($entry in $queryParameters.GetEnumerator()) {
            $encodedKey = [uri]::EscapeDataString(
                [string]$entry.Key
            )

            $encodedValue = [uri]::EscapeDataString(
                [string]$entry.Value
            )

            "$encodedKey=$encodedValue"
        }

        $requestUrl = "${baseUrl}?$($queryParts -join '&')"

        Write-Host "Lade Seite $page ..."

        $response = Invoke-RestMethod `
            -Method Get `
            -Uri $requestUrl `
            -Headers $headers

        if ($null -ne $response.issues) {
            $allIssues += @($response.issues)
        }

        $total = [int]$response.paging.total
        $loaded = $page * $pageSize
        $page++
    }
    while ($loaded -lt $total)
}
catch {
    Write-Host ""
    Write-Host "Der Abruf ist fehlgeschlagen." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""

    if ($_.Exception.Response -and $_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "Der Token wurde nicht akzeptiert."
        Write-Host "Erzeuge gegebenenfalls einen neuen Personal Access Token."
    }

    exit 1
}

$simplifiedIssues = @(
    foreach ($issue in $allIssues) {
        $component = [string]$issue.component
        $filePath = $component

        $componentPrefix = "${ProjectKey}:"

        if ($component.StartsWith($componentPrefix)) {
            $filePath = $component.Substring($componentPrefix.Length)
        }

        $startLine = $null
        $endLine = $null
        $startOffset = $null
        $endOffset = $null

        if ($null -ne $issue.textRange) {
            $startLine = $issue.textRange.startLine
            $endLine = $issue.textRange.endLine
            $startOffset = $issue.textRange.startOffset
            $endOffset = $issue.textRange.endOffset
        }
        elseif ($null -ne $issue.line) {
            $startLine = $issue.line
            $endLine = $issue.line
        }

        [PSCustomObject]@{
            key         = $issue.key
            rule        = $issue.rule
            severity    = $issue.severity
            type        = $issue.type
            message     = $issue.message
            file        = $filePath
            startLine   = $startLine
            endLine     = $endLine
            startOffset = $startOffset
            endOffset   = $endOffset
            effort      = $issue.effort
            creationDate = $issue.creationDate
        }
    }
)

$export = [PSCustomObject]@{
    exportedAt = (Get-Date).ToString("o")
    projectKey = $ProjectKey
    rule       = $Rule
    issueCount = $simplifiedIssues.Count
    issues     = $simplifiedIssues
}

$export |
    ConvertTo-Json -Depth 10 |
    Set-Content `
        -Path $jsonPath `
        -Encoding utf8

$markdownLines = [System.Collections.Generic.List[string]]::new()

$markdownLines.Add("# SonarQube Findings")
$markdownLines.Add("")
$markdownLines.Add("Projekt: ``$ProjectKey``")
$markdownLines.Add("")
$markdownLines.Add("Regel: ``$Rule``")
$markdownLines.Add("")
$markdownLines.Add("Anzahl: $($simplifiedIssues.Count)")
$markdownLines.Add("")

if ($simplifiedIssues.Count -eq 0) {
    $markdownLines.Add("Keine offenen Findings gefunden.")
}
else {
    $number = 1

    foreach ($issue in $simplifiedIssues) {
        $location = $issue.file

        if ($null -ne $issue.startLine) {
            $location += ":$($issue.startLine)"
        }

        $markdownLines.Add("## $number. ``$location``")
        $markdownLines.Add("")
        $markdownLines.Add($issue.message)
        $markdownLines.Add("")
        $markdownLines.Add("Regel: ``$($issue.rule)``")
        $markdownLines.Add("")
        $markdownLines.Add("Schweregrad: ``$($issue.severity)``")
        $markdownLines.Add("")

        $number++
    }
}

$markdownLines |
    Set-Content `
        -Path $markdownPath `
        -Encoding utf8

Write-Host ""
Write-Host "Export abgeschlossen." -ForegroundColor Green
Write-Host ""
Write-Host "Gefundene Findings: $($simplifiedIssues.Count)"
Write-Host "JSON:     $jsonPath"
Write-Host "Markdown: $markdownPath"
Write-Host ""