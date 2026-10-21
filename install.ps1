# Adds Leroy to the user PATH so `leroy <url>` works from any new terminal.
$dir = 'C:\Users\ryan.pattison\Documents\Leroy'
$cur = [Environment]::GetEnvironmentVariable('Path', 'User')
if (($cur -split ';') -notcontains $dir) {
  [Environment]::SetEnvironmentVariable('Path', ($cur.TrimEnd(';') + ';' + $dir), 'User')
  'Added to PATH: ' + $dir
} else { 'Already on PATH' }
