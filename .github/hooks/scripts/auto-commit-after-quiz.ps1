# Auto-commit script after quiz completion
# Triggered by: post-quiz-commit hook
# Extracts results from session-results.json and generates meaningful commit message

param(
    [string]$ExamFolder = $null
)

# Auto-detect active exam if not provided
if (-not $ExamFolder) {
    if (Test-Path "active-exam.txt") {
        $ExamFolder = (Get-Content "active-exam.txt" | Select-Object -First 1).Trim()
    } else {
        Write-Warning "Could not detect active exam. Skipping auto-commit."
        exit 0
    }
}

$ExamPath = "./$ExamFolder"
if (-not (Test-Path $ExamPath)) {
    Write-Warning "Exam folder not found: $ExamPath"
    exit 0
}

# Check for git repo
if (-not (Test-Path ".git")) {
    Write-Warning "Not a git repository. Skipping auto-commit."
    exit 0
}

# Check for uncommitted changes
$status = git status --porcelain
if (-not $status) {
    Write-Verbose "No uncommitted changes. Skipping auto-commit."
    exit 0
}

# Read session results
$sessionResultsFile = "$ExamPath/session-results.json"
if (-not (Test-Path $sessionResultsFile)) {
    Write-Warning "No session-results.json found at $sessionResultsFile"
    exit 0
}

$results = Get-Content $sessionResultsFile -Raw | ConvertFrom-Json
$accuracy = [math]::Round($results.summary.accuracy, 1)
$correct = $results.summary.correct
$total = $results.summary.totalQuestions
$wrongCount = $results.summary.wrong

# Read progress to extract day and domain
$progressFile = "$ExamPath/progress.md"
if (-not (Test-Path $progressFile)) {
    Write-Warning "No progress.md found"
    exit 0
}

$progressContent = Get-Content $progressFile -Raw

# Extract current day from daily log (LAST data row, i.e. most recent session)
$dayMatches = [regex]::Matches($progressContent, '\|\s*(\d+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|')
if ($dayMatches.Count -eq 0) {
    Write-Warning "Could not extract day number from progress.md"
    exit 0
}
$lastMatch = $dayMatches[$dayMatches.Count - 1]
$dayNum = $lastMatch.Groups[1].Value -as [int]
$topic = $lastMatch.Groups[3].Value.Trim()

if (-not $dayNum) {
    Write-Warning "Could not extract day number from progress.md"
    exit 0
}

# Generate commit message based on results
$commitMessage = "Day $dayNum session: $topic, $correct/$total ($accuracy%)"

if ($wrongCount -gt 0) {
    # Extract key trap(s) from wrong questions
    $wrongQuestions = $results.wrongQuestions
    if ($wrongQuestions -and $wrongQuestions.Count -gt 0) {
        $wrongQ = $wrongQuestions[0]
        $trapHint = $wrongQ.question -replace '.*?(\w+.{0,40}?)[\.\?]?$', '$1' | Select-Object -First 50
        # Simplify trap hint
        if ($trapHint.Length -gt 40) {
            $trapHint = $trapHint.Substring(0, 40) + "..."
        }
        $commitMessage += " — $trapHint"
    }
}

# Truncate to 72 chars for commit message best practices
if ($commitMessage.Length -gt 72) {
    $commitMessage = $commitMessage.Substring(0, 69) + "…"
}

Write-Host "Committing: $commitMessage"

# Stage and commit
try {
    git add -A
    git commit -m $commitMessage
    
    # Try to push
    git push 2>$null | Out-Null
    Write-Host "✅ Committed and pushed"
} catch {
    Write-Warning "Git operation failed: $_"
    exit 1
}
