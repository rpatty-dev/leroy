$base = "C:\Users\ryan.pattison\Documents\Github Profile"
$target = "C:\Users\ryan.pattison\Documents\Leroy\assets"
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item "$base\leroy\*" -Destination $target -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$base\ascii-bunny.gif" -Destination $target -Force -ErrorAction SilentlyContinue
Get-ChildItem $target | Select-Object Name, Length
