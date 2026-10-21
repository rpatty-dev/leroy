# Adds Leroy to the user PATH so `leroy <url>` works from any new terminal.
$dir = $PSScriptRoot
$cur = [Environment]::GetEnvironmentVariable('Path', 'User')
if (($cur -split ';') -notcontains $dir) {
  [Environment]::SetEnvironmentVariable('Path', ($cur.TrimEnd(';') + ';' + $dir), 'User')
  Write-Output "Added to PATH: $dir"
} else {
  Write-Output 'Already on PATH'
}
