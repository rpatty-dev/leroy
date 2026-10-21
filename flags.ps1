$d = 'C:\Users\ryan.pattison\Documents\LocalLLM\llama'
$h = (& "$d\llama-server.exe" --help 2>&1) -join "`n"
$lines = $h -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^\s*(--load|-lm|--mmap|--no-mmap|--spec-type|--spec-ngram|--spec-draft-n-max|--spec-draft-n-min|--spec-ngram-size)') {
    $lines[$i..([Math]::Min($i + 3, $lines.Count - 1))] | ForEach-Object { $_.Trim().Substring(0, [Math]::Min(170, $_.Trim().Length)) }
    '--'
  }
}
