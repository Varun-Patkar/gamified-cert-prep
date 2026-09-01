$ErrorActionPreference = 'Stop'
$tmp = [System.IO.Path]::GetTempPath()
$out = Join-Path $tmp 'certprep-selftest-report.txt'
$sentinel = Join-Path $tmp 'certprep-diagnostics-request.json'
$repo = 'd:\Projects\microsoft-exam-prep'

Remove-Item $out, $sentinel -ErrorAction SilentlyContinue
[ordered]@{ outPath = $out; mode = 'selftest'; repoPath = $repo } |
    ConvertTo-Json -Compress | Set-Content -Path $sentinel -Encoding utf8

# A throwaway profile is the only reliable way to make the dev host open the target folder;
# with the shared profile it restores the previous (empty) window instead.
code --user-data-dir="$tmp\certprep-udd" --extensions-dir="$tmp\certprep-exd" `
    --extensionDevelopmentPath="$repo\extension" "$repo" | Out-Null

$deadline = (Get-Date).AddMinutes(4)
while ((Get-Date) -lt $deadline) {
    if (Test-Path $out) {
        $content = Get-Content $out -Raw
        if ($content -and $content -notmatch '^ACTIVATED') { break }
    }
    [System.Threading.Thread]::Sleep(3000)
}

if (Test-Path $out) { Get-Content $out -Raw } else { 'NO REPORT PRODUCED' }
