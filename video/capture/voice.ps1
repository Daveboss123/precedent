param(
  [Parameter(Mandatory=$true)][string]$Manifest,
  [Parameter(Mandatory=$true)][string]$OutputDirectory,
  [string]$Voice = 'Microsoft Zira Desktop'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$jobs = Get-Content -LiteralPath $Manifest -Raw -Encoding UTF8 | ConvertFrom-Json
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $installed = @($speaker.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
  if ($installed -contains $Voice) { $speaker.SelectVoice($Voice) }
  $speaker.Volume = 100
  foreach ($job in $jobs) {
    $speaker.Rate = if ($job.version -eq 'short') { 1 } else { 0 }
    $file = Join-Path $OutputDirectory ($job.id + '.wav')
    $speaker.SetOutputToWaveFile($file)
    $speaker.Speak([string]$job.text)
    $speaker.SetOutputToNull()
    Write-Output ('Narrated ' + $job.id)
  }
} finally {
  $speaker.Dispose()
}
