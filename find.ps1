$sk = 'C:\Users\ryan.pattison\.gemini\config\skills'
Get-ChildItem $sk -Directory | Where-Object { $_.Name -match 'ponytail|taste|design|ui-ux|frontend' } | ForEach-Object { $_.FullName }
Write-Output '--- other skill roots ---'
Get-ChildItem 'C:\Users\ryan.pattison\.agents','C:\Users\ryan.pattison\.claude\skills','C:\Users\ryan.pattison\.gemini\config\plugins' -Directory -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
Write-Output '--- rea pkg ---'
$npm = (npm root -g)
Get-ChildItem "$npm\rea-agents" -Recurse -Filter SKILL.md -ErrorAction SilentlyContinue | Select-Object -First 5 | ForEach-Object { $_.FullName }
Write-Output '--- server ---'
Get-Process llama-server -ErrorAction SilentlyContinue | ForEach-Object { 'llama-server pid ' + $_.Id + ' WS_MB=' + [math]::Round($_.WorkingSet64/1MB) }
$o = Get-CimInstance Win32_OperatingSystem
'FreeRAM_GB=' + [math]::Round($o.FreePhysicalMemory/1MB,1)
